import axios from 'axios';
import { deleteCompanionAccount, deleteSupplierAccount } from '@/services/api/auth/delete';

jest.mock('axios', () => ({ __esModule: true, default: { delete: jest.fn(), isAxiosError: () => false } }));
jest.mock('@/utils/secure-storage', () => ({ secureStorage: { getItemAsync: jest.fn().mockResolvedValue('t') } }));
jest.mock('@/constants/api', () => ({ apiUrl: (p: string) => `https://api.test${p}` }));

describe('account deletion endpoints', () => {
  beforeEach(() => (axios.delete as jest.Mock).mockResolvedValue({ data: { success: true } }));

  it('closes companion accounts through the supplier route the Worker serves', async () => {
    await deleteCompanionAccount('abc');
    expect((axios.delete as jest.Mock).mock.calls[0][0]).toBe('https://api.test/api/suppliers/abc');
  });

  it('keeps supplier deletion on the supplier route', async () => {
    await deleteSupplierAccount('abc');
    expect((axios.delete as jest.Mock).mock.calls.at(-1)[0]).toBe('https://api.test/api/suppliers/abc');
  });
});
