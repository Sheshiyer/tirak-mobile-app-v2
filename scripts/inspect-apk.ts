/** Read-only APK v2 signature, manifest and 16 KB native-library inspection. */
import { readFileSync } from 'node:fs';
import { createHash, verify, X509Certificate, constants } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
const file = process.argv[2];
if (!file) throw new Error('Usage: bun scripts/inspect-apk.ts FILE.apk');
const apk = readFileSync(file);
class Reader {
  pos = 0;
  constructor(readonly b: Buffer) {}
  u32() { const n = this.b.readUInt32LE(this.pos); this.pos += 4; return n; }
  bytes() { const n = this.u32(); const value = this.b.subarray(this.pos, this.pos + n); this.pos += n; return value; }
}
const hash = (b: Buffer, algorithm = 'sha256') => createHash(algorithm).update(b).digest();
let end = apk.length - 22;
while (end >= Math.max(0, apk.length - 65557) && apk.readUInt32LE(end) !== 0x06054b50) end--;
if (end < 0 || apk.readUInt32LE(end) !== 0x06054b50) throw new Error('ZIP end missing');
const central = apk.readUInt32LE(end + 16);
const footer = central - 24;
if (apk.subarray(central - 16, central).toString() !== 'APK Sig Block 42') throw new Error('APK signature block missing');
const start = central - Number(apk.readBigUInt64LE(footer)) - 8;
if (apk.readBigUInt64LE(start) !== apk.readBigUInt64LE(footer)) throw new Error('Signature block size mismatch');
let signatureValid = false;
let contentDigestValid = false;
let certificateSha256 = '';
for (let p = start + 8; p < footer;) {
  const size = Number(apk.readBigUInt64LE(p)); p += 8;
  const id = apk.readUInt32LE(p);
  if (id === 0x7109871a) {
    const signers = new Reader(new Reader(apk.subarray(p + 4, p + size)).bytes());
    const signer = new Reader(signers.bytes());
    const signedData = signer.bytes();
    const signatures = new Reader(signer.bytes());
    const publicKey = signer.bytes();
    const signature = new Reader(signatures.bytes());
    const algorithmId = signature.u32();
    const signatureBytes = signature.bytes();
    const algorithm = [0x0102, 0x0104, 0x0202].includes(algorithmId) ? 'sha512' : 'sha256';
    if (![0x0101, 0x0102, 0x0103, 0x0104, 0x0201, 0x0202].includes(algorithmId)) throw new Error('Unsupported signing algorithm');
    const signed = new Reader(signedData);
    const digests = new Reader(signed.bytes());
    let expectedDigest: Buffer | null = null;
    while (digests.pos < digests.b.length) {
      const digest = new Reader(digests.bytes());
      if (digest.u32() === algorithmId) expectedDigest = digest.bytes();
    }
    const certificate = new Reader(signed.bytes()).bytes();
    const cert = new X509Certificate(certificate);
    certificateSha256 = hash(certificate).toString('hex');
    if (!Buffer.from(cert.publicKey.export({ type: 'spki', format: 'der' })).equals(publicKey)) throw new Error('Signing key and certificate mismatch');
    signatureValid = verify(algorithm, signedData, [0x0101, 0x0102].includes(algorithmId)
      ? { key: cert.publicKey, padding: constants.RSA_PKCS1_PSS_PADDING, saltLength: algorithm === 'sha256' ? 32 : 64 }
      : cert.publicKey, signatureBytes);
    const eocd = Buffer.from(apk.subarray(end));
    eocd.writeUInt32LE(start, 16);
    const chunks: Buffer[] = [];
    for (const section of [apk.subarray(0, start), apk.subarray(central, end), eocd]) {
      for (let offset = 0; offset < section.length; offset += 1048576) {
        const chunk = section.subarray(offset, offset + 1048576);
        const prefix = Buffer.alloc(5); prefix[0] = 0xa5; prefix.writeUInt32LE(chunk.length, 1);
        chunks.push(hash(Buffer.concat([prefix, chunk]), algorithm));
      }
    }
    const prefix = Buffer.alloc(5); prefix[0] = 0x5a; prefix.writeUInt32LE(chunks.length, 1);
    contentDigestValid = Boolean(expectedDigest?.equals(hash(Buffer.concat([prefix, ...chunks]), algorithm)));
  }
  p += size;
}
if (!signatureValid || !contentDigestValid) throw new Error('APK v2 signature or content digest invalid');
const entries: Array<{ name: string; data: Buffer; offset: number; compressed: boolean }> = [];
for (let p = central; p < end && apk.readUInt32LE(p) === 0x02014b50;) {
  const nameLen = apk.readUInt16LE(p + 28), extraLen = apk.readUInt16LE(p + 30), commentLen = apk.readUInt16LE(p + 32);
  const name = apk.subarray(p + 46, p + 46 + nameLen).toString();
  if (name === 'AndroidManifest.xml' || /^lib\/(arm64-v8a|x86_64)\/.*\.so$/.test(name)) {
    const local = apk.readUInt32LE(p + 42), method = apk.readUInt16LE(p + 10), size = apk.readUInt32LE(p + 20);
    const offset = local + 30 + apk.readUInt16LE(local + 26) + apk.readUInt16LE(local + 28);
    const compressed = apk.subarray(offset, offset + size);
    entries.push({ name, offset, compressed: method !== 0, data: method === 8 ? inflateRawSync(compressed) : compressed });
  }
  p += 46 + nameLen + extraLen + commentLen;
}
const manifest = entries.find(e => e.name === 'AndroidManifest.xml')!.data;
const strings: string[] = [];
const attributes: Record<string, string | number | boolean> = {};
for (let p = 8; p < manifest.length;) {
  const type = manifest.readUInt16LE(p), headerSize = manifest.readUInt16LE(p + 2), size = manifest.readUInt32LE(p + 4);
  if (!size) throw new Error('Invalid manifest chunk');
  if (type === 1) {
    const count = manifest.readUInt32LE(p + 8), utf8 = Boolean(manifest.readUInt32LE(p + 16) & 0x100), base = p + manifest.readUInt32LE(p + 20);
    for (let i = 0; i < count; i++) {
      let q = base + manifest.readUInt32LE(p + headerSize + i * 4);
      if (utf8) {
        const length = () => { const n = manifest[q++]; return n & 0x80 ? ((n & 0x7f) << 8) | manifest[q++] : n; };
        length(); const n = length(); strings.push(manifest.subarray(q, q + n).toString('utf8'));
      } else {
        let n = manifest.readUInt16LE(q); q += 2;
        if (n & 0x8000) { n = ((n & 0x7fff) << 16) | manifest.readUInt16LE(q); q += 2; }
        strings.push(manifest.subarray(q, q + n * 2).toString('utf16le'));
      }
    }
  }
  if (type === 0x0102) {
    const ext = p + headerSize, count = manifest.readUInt16LE(ext + 12), stride = manifest.readUInt16LE(ext + 10);
    for (let i = 0; i < count; i++) {
      const a = ext + manifest.readUInt16LE(ext + 8) + i * stride;
      const name = strings[manifest.readUInt32LE(a + 4)], kind = manifest[a + 15], value = manifest.readUInt32LE(a + 16);
      if (['package', 'versionCode', 'versionName', 'minSdkVersion', 'targetSdkVersion', 'debuggable'].includes(name)) attributes[name] = kind === 3 ? strings[value] : kind === 0x12 ? Boolean(value) : value;
    }
  }
  p += size;
}
const nativeLibraries = entries.filter(e => e.name.endsWith('.so')).map(e => {
  const b = e.data, is64 = b[4] === 2;
  const offset = is64 ? Number(b.readBigUInt64LE(32)) : b.readUInt32LE(28);
  const stride = b.readUInt16LE(is64 ? 54 : 42), count = b.readUInt16LE(is64 ? 56 : 44);
  const aligns: number[] = [];
  for (let i = 0; i < count; i++) { const p = offset + i * stride; if (b.readUInt32LE(p) === 1) aligns.push(is64 ? Number(b.readBigUInt64LE(p + 48)) : b.readUInt32LE(p + 28)); }
  return { name: e.name, elf16k: aligns.every(n => n >= 16384), zip16k: e.compressed || e.offset % 16384 === 0, alignments: aligns };
});
console.log(JSON.stringify({ file, sha256: hash(apk).toString('hex'), signatureValid, contentDigestValid, certificateSha256, manifest: { ...attributes, debuggable: attributes.debuggable ?? false }, nativeLibraryCount: nativeLibraries.length, incompatible16kLibraries: nativeLibraries.filter(e => !e.elf16k || !e.zip16k) }, null, 2));
