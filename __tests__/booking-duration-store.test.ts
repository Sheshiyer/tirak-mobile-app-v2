jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule:true,default:{getItem:jest.fn().mockResolvedValue(null),setItem:jest.fn(),removeItem:jest.fn()} }));
jest.mock('@/services/api/booking/booking', () => ({ createBooking:jest.fn() }));
jest.mock('@/stores/payment-store', () => ({ usePaymentStore: {getState:()=>({resetPayment:jest.fn()})} }));
jest.mock('@/constants/api',()=>({apiUrl:(path:string)=>path}));
jest.mock('@/utils/currency',()=>({convertCurrency:async(amount:number)=>amount}));
jest.mock('@/utils/logger',()=>({logger:{log:jest.fn(),warn:jest.fn(),error:jest.fn()}}));
import { useBookingStore } from '@/stores/booking-store';
import { experienceToBookingService } from '@/utils/experience-booking';
const experience={id:'service',title:'90 minute walk',description:'Local walk',durationMinutes:90,keywords:['Culture'],price:900,currency:'THB',isActive:true,createdAt:'2026-09-28',updatedAt:'2026-09-28'};
beforeEach(()=>{
 const state=useBookingStore.getState();
 state.updateService(experienceToBookingService(experience));
 state.updateDateTime({date:'2099-10-01',time:'09:00',endTime:'10:30',duration:1.5,isAvailable:true});
 state.updateLocation({area:'Bangkok',meetingPoint:'Pier'});
});
test('90 minute experience reaches request as 90, without rounding to 2 hours',()=>{
 expect(useBookingStore.getState().bookingData.service?.duration).toBe(1.5);
 expect(useBookingStore.getState().prepareBookingRequest()).toMatchObject({duration:90,endTime:'10:30',serviceId:'service'});
});
test('stale differently sized selection fails rather than sending a mismatched duration',()=>{
 const error=jest.spyOn(console,'error').mockImplementation(()=>{});
 try{
 useBookingStore.getState().updateDateTime({date:'2099-10-01',time:'09:00',endTime:'11:00',duration:2,isAvailable:true});
 expect(useBookingStore.getState().prepareBookingRequest()).toBeNull();
 }finally{error.mockRestore();}
});
