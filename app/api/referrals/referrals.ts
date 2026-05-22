import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiUrl } from '@/constants/api';
import { getAuthToken } from '@/app/api/companion/companion';

export interface ReferralEvent {
  id: string;
  referred_user_id: string;
  status: 'pending' | 'awarded' | 'reversed';
  coins_awarded: number;
  created_at: string;
  completed_at?: string;
}

export interface ReferralAccount {
  referralCode: string;
  coinBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  awardCoins: number;
  shareUrl: string;
  referrals: ReferralEvent[];
}

export const getReferralAccount = async (): Promise<{ success: boolean; data: ReferralAccount; message: string }> => {
  const token = await getAuthToken();
  const response = await axios.get(apiUrl('/api/referrals/me'), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const applyReferralCode = async (code: string): Promise<{ success: boolean; data: unknown; message: string }> => {
  const token = await getAuthToken();
  const response = await axios.post(apiUrl('/api/referrals/apply'), { code }, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

export const useReferralAccount = () => {
  return useQuery({
    queryKey: ['referralAccount'],
    queryFn: getReferralAccount,
  });
};

export const useApplyReferralCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applyReferralCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralAccount'] });
    },
  });
};
