import axios from 'axios';
import {getReferralAccount,applyReferralCode} from '../services/api/referrals/referrals';
jest.mock('axios');
jest.mock('../constants/api',()=>({apiUrl:(path:string)=>`https://api.test${path}`}));
jest.mock('../services/api/companion/companion',()=>({getAuthToken:jest.fn().mockResolvedValue('token')}));
const api=axios as jest.Mocked<typeof axios>;
beforeEach(()=>jest.clearAllMocks());
it('rejects a resolved unsuccessful GET instead of rendering a valid account',async()=>{
 api.get.mockResolvedValue({data:{success:false,message:'Rewards unavailable'}});await expect(getReferralAccount()).rejects.toThrow('Rewards unavailable');
});
it('rejects a resolved unsuccessful apply so mutation cannot announce success',async()=>{
 api.post.mockResolvedValue({data:{success:false,message:'Invalid code'}});await expect(applyReferralCode('INVALID')).rejects.toThrow('Invalid code');
});
it('preserves successful account and apply responses',async()=>{
 const account={success:true,data:{coinBalance:0,referralCode:'ABC'},message:'ok'};api.get.mockResolvedValue({data:account});expect(await getReferralAccount()).toEqual(account);
 const applied={success:true,data:{},message:'applied'};api.post.mockResolvedValue({data:applied});expect(await applyReferralCode('ABC')).toEqual(applied);
});
