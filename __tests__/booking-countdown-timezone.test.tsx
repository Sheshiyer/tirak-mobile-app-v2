import React from 'react';
import {render,fireEvent,act} from '@testing-library/react-native';
let mockBookingId='booking-real-1';
let mockRole='customer';
const mockMutateStatus=jest.fn();
jest.mock('expo-router',()=>({router:{push:jest.fn(),replace:jest.fn()}}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:{id:'traveler-1',userType:mockRole},isAuthenticated:true})}));
jest.mock('../stores/toast-store',()=>({useToast:()=>({success:jest.fn(),error:jest.fn()})}));
jest.mock('../constants/review-mode',()=>({isReviewModeEnabled:()=>false,REVIEW_ACCOUNTS:{customer:{user:{id:'review-customer'}},guide:{user:{id:'review-guide'}}}}));
jest.mock('../stores/review-booking-fixture-store',()=>({REVIEW_BOOKING_ID:'review-booking-fixture',reviewBookingToListItem:jest.fn(),useReviewBookingFixtureStore:(selector:any)=>selector({booking:null,acceptAsGuide:jest.fn()})}));
jest.mock('../services/api/booking/booking',()=>({useBookingHistoryQuery:()=>({data:{success:true,data:{items:[{id:mockBookingId,status:'pending',date:'2099-01-02',startTime:'09:00',duration:30,totalAmount:300,paymentMethod:'cash',location:'Bangkok',service:{name:'Canal walk'},companion:{name:'Local Guide'}}]}},isLoading:false,error:null,refetch:jest.fn()}),useUpdateBookingStatus:()=>({isPending:false,mutateAsync:mockMutateStatus})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../components/ui/Card',()=>({Card:require('react-native').View}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:require('react-native').View}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:require('react-native').View}));
jest.mock('../components/ui/Button',()=>({Button:require('react-native').View}));
jest.mock('../components/ui/Typography',()=>({Heading:require('react-native').Text,Subheading:require('react-native').Text,Body:require('react-native').Text,Caption:require('react-native').Text}));
jest.mock('../components/ui/LoadingState',()=>({LoadingState:require('react-native').View}));
import {CountdownTimer} from '../app/(app)/bookings';
beforeEach(()=>{jest.useFakeTimers();jest.setSystemTime(new Date('2026-10-26T01:00:00Z'));});
afterEach(()=>jest.useRealTimers());
it('renders the CoreThailand countdown instead of device-local time and ticks each minute',()=>{
 const ui=render(<CountdownTimer targetDate="2026-10-26" targetTime="09:00"/>);
 expect(ui.getByText('1h 0m')).toBeTruthy();
 act(()=>jest.advanceTimersByTime(60000));
 expect(ui.getByText('59m')).toBeTruthy();ui.unmount();
});
it('recomputes when the actual booking timezone changes and supports seconds in stored schedules',()=>{
 const ui=render(<CountdownTimer targetDate="2026-10-26T00:00:00Z" targetTime="09:00:00" timeZone="Asia/Bangkok"/>);
 expect(ui.getByText('1h 0m')).toBeTruthy();
 ui.rerender(<CountdownTimer targetDate="2026-10-26" targetTime="09:00:00" timeZone="Asia/Kolkata"/>);
 expect(ui.getByText('2h 30m')).toBeTruthy();ui.unmount();
});
it.each([['2026-02-30','09:00','Asia/Bangkok'],['2026-10-26','bad','Asia/Bangkok'],['2026-10-26','09:00','invalid/zone']])('invalid schedule is readable rather than falsely Now (%s %s %s)',(date,time,zone)=>{
 const ui=render(<CountdownTimer targetDate={date} targetTime={time} timeZone={zone}/>);
 expect(ui.getByText('Schedule unavailable')).toBeTruthy();expect(ui.queryByText('Now')).toBeNull();ui.unmount();
});
it('uses truthful reached-start copy for a valid past start',()=>{
 const ui=render(<CountdownTimer targetDate="2026-10-25" targetTime="09:00"/>);
 expect(ui.getByText('Start time reached')).toBeTruthy();ui.unmount();
});
