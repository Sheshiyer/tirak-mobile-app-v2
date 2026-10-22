// Exercise status mutation callbacks with the real QueryClient cache.
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
(mockedAxios.isAxiosError as unknown as jest.Mock) = jest.fn(() => false);
(mockedAxios.post as jest.Mock) = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn().mockResolvedValue(null),
    setItem: jest.fn().mockResolvedValue(undefined),
    removeItem: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/secure-storage', () => ({
  secureStorage: {
    getItemAsync: jest.fn().mockResolvedValue('test-token'),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/utils/booking-notifications', () => ({
  showBookingCreatedNotification: jest.fn().mockResolvedValue(undefined),
  scheduleThreeHourBookingReminder: jest.fn().mockResolvedValue(undefined),
  syncBookingReminderNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/constants/payment-capabilities', () => ({
  isLocalPromptPayEnabled: () => false,
}));

jest.mock('@/utils/companion-display', () => ({
  isTestCompanionId: () => false,
}));

jest.mock('@/utils/demo-mode', () => ({
  getDemoModeEnabled: jest.fn().mockResolvedValue(false),
  isDemoModeEnabled: () => false,
  isDemoIdentity: () => false,
}));

jest.mock('@/stores/review-booking-fixture-store', () => ({
  useReviewBookingFixtureStore: { getState: () => ({}) },
  reviewBookingToBooking: jest.fn(),
  reviewBookingToListItem: jest.fn(),
}));

jest.mock('@/constants/review-mode', () => ({
  isReviewAccountUser: () => false,
  isReviewModeEnabled: () => false,
  REVIEW_ACCOUNTS: {},
}));

jest.mock('@/utils/api-errors', () => ({
  handleApiError: jest.fn(),
  isUnauthorizedError: () => false,
}));

jest.mock('@/stores/auth-store', () => ({
  useAuthStore: { getState: () => ({ user: { id: 'user-1' } }) },
}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://test.example.com',
  apiUrl: (path: string) => `https://test.example.com${path}`,
}));


let mockQueryClient: any;
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useMutation: (options: any) => options,
  useQueryClient: () => mockQueryClient,
}));
import { QueryClient } from '@tanstack/react-query';
import { useUpdateBookingStatus } from '../services/api/booking/booking';
const booking = {id:'booking-1',status:'pending',paymentStatus:'pending',totalAmount:300};
const response = {success:true,data:{booking:{id:'booking-1',status:'confirmed'}},message:'Updated'};
const variables = {id:'booking-1',statusData:{status:'confirmed'}};
beforeEach(()=>{mockQueryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});});
afterEach(()=>{mockQueryClient.clear();});
it('updates both role/list cache shapes and details immediately from server status, preserving payment and unrelated records',async()=>{
 const travelerKey=['bookings',{page:1}],guideKey=['bookings',{}];
 mockQueryClient.setQueryData(travelerKey,{success:true,data:{items:[booking,{...booking,id:'other'}],pagination:{total:2}}});
 mockQueryClient.setQueryData(guideKey,{success:true,data:{bookings:[booking],pagination:{total:1}}});
 mockQueryClient.setQueryData(['booking','booking-1'],{success:true,data:{booking}});
 const invalidate=jest.spyOn(mockQueryClient,'invalidateQueries');
 // Use one shared pending refresh gate so callback remains pending until all are settled.
 let finish!:()=>void;const refresh=new Promise<void>(resolve=>{finish=resolve;});invalidate.mockImplementation(()=>refresh);
 const options=useUpdateBookingStatus() as any;const success=options.onSuccess(response,variables);
 await new Promise(resolve => setTimeout(resolve, 0));
 const rows=mockQueryClient.getQueryData(travelerKey).data.items;
 expect(rows[0]).toEqual({...booking,status:'confirmed'});expect(rows[1].status).toBe('pending');
 expect(mockQueryClient.getQueryData(guideKey).data.bookings[0].status).toBe('confirmed');
 expect(mockQueryClient.getQueryData(['booking','booking-1']).data.booking.paymentStatus).toBe('pending');
 expect(invalidate).toHaveBeenCalledWith({queryKey:['supplierStats']});
 finish();await success;
});
it('cancels an old in-flight pending list response before applying confirmation',async()=>{
 const key=['bookings',{}];mockQueryClient.setQueryData(key,{success:true,data:{items:[booking]}});
 let lateResolve!:(value:any)=>void;
 const oldRead=mockQueryClient.fetchQuery({queryKey:key,queryFn:()=>new Promise(resolve=>{lateResolve=resolve;})}).catch(()=>null);
 await Promise.resolve();
 jest.spyOn(mockQueryClient,'invalidateQueries').mockResolvedValue(undefined);
 const options=useUpdateBookingStatus() as any;await options.onSuccess(response,variables);
 lateResolve({success:true,data:{items:[booking]}});await oldRead;await Promise.resolve();
 expect(mockQueryClient.getQueryData(key).data.items[0].status).toBe('confirmed');
});
it('never changes cached pending state for an unconfirmed server response',async()=>{
 const key=['bookings',{}];mockQueryClient.setQueryData(key,{success:true,data:{items:[booking]}});
 const options=useUpdateBookingStatus() as any;
 await expect(options.onSuccess({...response,success:false},variables)).rejects.toThrow('did not confirm');
 expect(mockQueryClient.getQueryData(key).data.items[0].status).toBe('pending');
});
