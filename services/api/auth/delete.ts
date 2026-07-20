import { logger } from '@/utils/logger';
import axios from "axios";
import { secureStorage } from '@/utils/secure-storage';
import { apiUrl } from '@/constants/api';

export interface DeleteResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const getToken = async (): Promise<string> => {
  const token = await secureStorage.getItemAsync("authToken");
  if (!token) throw new Error("No auth token available");
  return token;
};

const buildHeaders = async () => {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};



export const deleteUserAccount = async (userId: string): Promise<DeleteResponse> => {
  if (!userId || userId.trim() === "") throw new Error("Invalid user id");

  try {
    const headers = await buildHeaders();
    const url = apiUrl(`/api/users/${userId}`);
    const res = await axios.delete(url, { headers });
    const api = res.data;
    return {
      success: !!api?.success,
      message: api?.message ?? "User deletion completed",
      data: api?.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message || "Failed to delete user";
      throw new Error(msg);
    }
    throw new Error("Network error during user deletion");
  }
};

export const deleteCustomerAccount = async (customerId: string): Promise<DeleteResponse> => {
  if (!customerId || customerId.trim() === "") throw new Error("Invalid customer id");

  try {
    const headers = await buildHeaders();
    const url = apiUrl(`/api/customers/${customerId}`);
    const res = await axios.delete(url, { headers });
    const api = res.data;
    return {
      success: !!api?.success,
      message: api?.message ?? "Customer deletion completed",
      data: api?.data,
    };
  } catch (error) {
    console.error("Error deleting customer account:", error);
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message || "Failed to delete customer";
      throw new Error(msg);
    }
    throw new Error("Network error during customer deletion");
  }
};

export const deleteSupplierAccount = async (supplierId: string): Promise<DeleteResponse> => {
  if (!supplierId || supplierId.trim() === "") throw new Error("Invalid supplier id");
    logger.log('Deleting supplier account with id:', supplierId);
        
  try {
    const headers = await buildHeaders();
    const url = apiUrl(`/api/suppliers/${supplierId}`);
    const res = await axios.delete(url, { headers });
    const api = res.data;
    return {
      success: !!api?.success,
      message: api?.message ?? "Supplier deletion completed",
      data: api?.data,
    };
  } catch (error) {
    console.error("Error deleting supplier account:", error);
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message || "Failed to delete supplier";
      throw new Error(msg);
    }
    throw new Error("Network error during supplier deletion");
  }
};

export const deleteCompanionAccount = async (companionId: string): Promise<DeleteResponse> => {
  if (!companionId || companionId.trim() === "") throw new Error("Invalid companion id");

  try {
    const headers = await buildHeaders();
    const url = apiUrl(`/api/companions/${companionId}`);
    const res = await axios.delete(url, { headers });
    const api = res.data;
    return {
      success: !!api?.success,
      message: api?.message ?? "Supplier deletion completed",
      data: api?.data,
    };
  } catch (error) {
    console.error("Error deleting companion account:", error);
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message || "Failed to delete supplier";
      throw new Error(msg);
    }
    throw new Error("Network error during supplier deletion");
  }
};
