import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveBackendRoot(mobileRoot, configuredRoot = process.env.TIRAK_BACKEND_ROOT) {
  const explicitRoot = configuredRoot?.trim();
  if (explicitRoot) {
    const backendRoot = resolve(explicitRoot);
    if (!existsSync(backendRoot)) {
      throw new Error(`backend repository root not found at ${backendRoot}; set TIRAK_BACKEND_ROOT to a full backend checkout`);
    }
    return backendRoot;
  }

  const candidates = [
    resolve(mobileRoot, '../../Backend/tirak-backend-alpha01'),
    resolve(mobileRoot, '../../../Backend/tirak-backend-alpha01'),
  ];
  const backendRoot = candidates.find((candidate) => existsSync(candidate));
  if (!backendRoot) {
    throw new Error(`backend repository root not found; set TIRAK_BACKEND_ROOT to a full backend checkout (checked: ${candidates.join(', ')})`);
  }
  return backendRoot;
}
