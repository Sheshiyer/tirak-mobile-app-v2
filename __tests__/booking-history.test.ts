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

let mockOwner:any={user:{id:'user-a',userType:'customer'},isAuthenticated:true};
jest.mock('@/stores/auth-store',()=>({useAuthStore:Object.assign(()=>mockOwner,{getState:()=>mockOwner})}));

jest.mock('@/constants/api', () => ({
  API_BASE_URL: 'https://test.example.com',
  apiUrl: (path: string) => `https://test.example.com${path}`,
}));



jest.mock('@tanstack/react-query',()=>({...jest.requireActual('@tanstack/react-query'),useQuery:(options:any)=>options}));
import {fetchBookingHistory,fetchBookings,useBookingHistoryQuery} from '../services/api/booking/booking';
import {collectBookingHistory} from '../utils/booking-history';
import {syncBookingReminderNotifications} from '../utils/booking-notifications';
const row=(id:string)=>({id,status:'pending'}) as any;
const response=(page:number,total:number,ids:string[],limit=100)=>({success:true,data:{items:ids.map(row),pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}}});
beforeEach(()=>{jest.clearAllMocks();mockOwner={user:{id:'user-a',userType:'customer'},isAuthenticated:true};});
it('loads three sequential pages including the last-only booking, forwards cancellation and syncs reminders once',async()=>{
 const pages=[response(1,201,Array.from({length:100},(_,i)=>`id-${i}`)),response(2,201,Array.from({length:100},(_,i)=>`id-${i+100}`)),response(3,201,['last-only'])];
 mockedAxios.get.mockImplementation(async()=>({data:pages.shift()}));const abort=new AbortController();
 const result=await fetchBookingHistory('user-a',abort.signal);
 expect(result.data.items).toHaveLength(201);expect(result.data.items![200].id).toBe('last-only');expect(result.data.pagination.total).toBe(201);
 expect(mockedAxios.get.mock.calls.map(call=>new URL(call[0] as string).searchParams.get('page'))).toEqual(['1','2','3']);
 for(const call of mockedAxios.get.mock.calls){expect(new URL(call[0] as string).searchParams.get('limit')).toBe('100');expect(call[1]?.signal).toBe(abort.signal);}
 expect(syncBookingReminderNotifications).toHaveBeenCalledTimes(1);expect(syncBookingReminderNotifications).toHaveBeenCalledWith(result.data.items,'traveler');
});
it('rejects later transport failure and never synchronizes a partial history',async()=>{
 mockedAxios.get.mockResolvedValueOnce({data:response(1,101,Array.from({length:100},(_,i)=>`id-${i}`))}).mockRejectedValueOnce(new Error('offline'));
 await expect(fetchBookingHistory('user-a')).rejects.toThrow();expect(syncBookingReminderNotifications).not.toHaveBeenCalled();
});
it('rejects a later success:false envelope rather than returning first-page records',async()=>{
 const fetchPage=jest.fn().mockResolvedValueOnce(response(1,2,['one'],1)).mockResolvedValueOnce({success:false,data:{items:[],pagination:{page:2,limit:1,total:2,totalPages:2}}});
 await expect(collectBookingHistory(fetchPage)).rejects.toThrow('invalid page response');
});
it('deduplicates overlapping page IDs while preserving the complete global count',async()=>{
 const fetchPage=jest.fn().mockResolvedValueOnce(response(1,3,['one','two'],2)).mockResolvedValueOnce(response(2,3,['two','three'],2));
 const result=await collectBookingHistory(fetchPage);expect(result.data.items?.map(item=>item.id)).toEqual(['one','two','three']);expect(result.data.pagination.total).toBe(3);
});
it.each([
 ['repeated page',response(1,2,['two'],1)],
 ['nonfinite total',{success:true,data:{items:[row('two')],pagination:{page:2,limit:1,total:Infinity,totalPages:2}}}],
 ['changed total',response(2,3,['two'],1)],
 ['no progress',response(2,2,['one'],1)],
])('rejects %s instead of marking partial data complete',async(_label,badPage)=>{
 const fetchPage=jest.fn().mockResolvedValueOnce(response(1,2,['one'],1)).mockResolvedValueOnce(badPage);
 await expect(collectBookingHistory(fetchPage)).rejects.toThrow('complete booking history');expect(fetchPage).toHaveBeenCalledTimes(2);
});
it('scopes the history cache to owner and disables unauthenticated/explicitly disabled requests',()=>{
 expect((useBookingHistoryQuery() as any).queryKey).toEqual(['bookings','history','user-a']);expect((useBookingHistoryQuery() as any).enabled).toBe(true);
 mockOwner={user:{id:'user-b'},isAuthenticated:true};expect((useBookingHistoryQuery() as any).queryKey).toEqual(['bookings','history','user-b']);expect((useBookingHistoryQuery({enabled:false}) as any).enabled).toBe(false);
 mockOwner={user:null,isAuthenticated:false};expect((useBookingHistoryQuery() as any).enabled).toBe(false);
});
it('blocks a late owner switch before the next page or reminder sync',async()=>{
 mockedAxios.get.mockImplementationOnce(async()=>{mockOwner={user:{id:'user-b'},isAuthenticated:true};return {data:response(1,101,Array.from({length:100},(_,i)=>`id-${i}`))};});
 await expect(fetchBookingHistory('user-a')).rejects.toThrow('sign in again');expect(mockedAxios.get).toHaveBeenCalledTimes(1);expect(syncBookingReminderNotifications).not.toHaveBeenCalled();
});
it('aborts without starting further pages and preserves the existing single-page reminder behavior',async()=>{
 const abort=new AbortController();abort.abort();await expect(fetchBookingHistory('user-a',abort.signal)).rejects.toThrow();expect(mockedAxios.get).not.toHaveBeenCalled();
 mockedAxios.get.mockResolvedValueOnce({data:response(1,1,['single'])});await fetchBookings({page:1,limit:100});expect(syncBookingReminderNotifications).toHaveBeenCalledTimes(1);
});
it('represents a successfully empty account without inventing records',async()=>{
 mockedAxios.get.mockResolvedValueOnce({data:response(1,0,[])});const result=await fetchBookingHistory('user-a');expect(result.data.items).toEqual([]);expect(result.data.pagination.total).toBe(0);expect(mockedAxios.get).toHaveBeenCalledTimes(1);
});
it('cancellation during a page prevents later requests and reminder updates',async()=>{
 const abort=new AbortController();mockedAxios.get.mockImplementationOnce(async()=>{abort.abort();return {data:response(1,101,Array.from({length:100},(_,i)=>`id-${i}`))};});
 await expect(fetchBookingHistory('user-a',abort.signal)).rejects.toThrow('cancelled');expect(mockedAxios.get).toHaveBeenCalledTimes(1);expect(syncBookingReminderNotifications).not.toHaveBeenCalled();
});
