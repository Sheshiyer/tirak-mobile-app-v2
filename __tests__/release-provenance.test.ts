import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const sourceRoots = ['app', 'components', 'constants', 'locales', 'mocks', 'public'];
const prohibited = /Companion Services|Dining Companion|Paid in cash directly|compensated companionship|adult services|escort service|hookup|private\.png/iu;

const walk = (directory: string): string[] => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target);
    return entry.isFile() ? [target] : [];
  });
};

describe('release fixture and content provenance', () => {
  test('contains no prohibited visible category or compensated-companionship source copy', () => {
    const violations = sourceRoots
      .flatMap((directory) => walk(path.join(root, directory)))
      .filter((file) => prohibited.test(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(root, file));

    expect(violations).toEqual([]);
  });

  test('requires provider proof and forbids manual paid-state fixtures', () => {
    const specification = JSON.parse(fs.readFileSync(
      path.join(root, 'docs/contracts/tirak-payments-v1/reviewer-fixture-provenance.json'),
      'utf8',
    ));

    expect(specification.bookings.paid).toContain('real small Omise PromptPay charge');
    expect(specification.paidEvidence).toEqual(expect.arrayContaining([
      'provider charge id and livemode',
      'payment_attempts row',
      'webhook/reconciliation evidence',
    ]));
    expect(specification.prohibitedBypasses).toContain('manual booking payment_status update');
    expect(specification.ingestionSurfaces).toHaveLength(7);
  });
});
