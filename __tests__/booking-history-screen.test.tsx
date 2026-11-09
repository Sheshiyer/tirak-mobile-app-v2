import React from 'react';
import {render,fireEvent,act} from '@testing-library/react-native';
let mockHistory:any;
let mockRole='customer';
const mockMutateStatus=jest.fn();
jest.mock('expo-router',()=>({router:{push:jest.fn(),replace:jest.fn()}}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:{id:'traveler-1',userType:mockRole},isAuthenticated:true})}));
jest.mock('../stores/toast-store',()=>({useToast:()=>({success:jest.fn(),error:jest.fn()})}));
jest.mock('../constants/review-mode',()=>({isReviewModeEnabled:()=>false,REVIEW_ACCOUNTS:{customer:{user:{id:'review-customer'}},guide:{user:{id:'review-guide'}}}}));
jest.mock('../stores/review-booking-fixture-store',()=>({REVIEW_BOOKING_ID:'review-booking-fixture',reviewBookingToListItem:jest.fn(),useReviewBookingFixtureStore:(selector:any)=>selector({booking:null,acceptAsGuide:jest.fn()})}));
jest.mock('../services/api/booking/booking',()=>({useBookingHistoryQuery:()=>({data:mockHistory,isLoading:false,error:null,refetch:jest.fn()}),useUpdateBookingStatus:()=>({isPending:false,mutateAsync:mockMutateStatus})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../components/ui/Card',()=>({Card:require('react-native').View}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:require('react-native').View}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:require('react-native').View}));
jest.mock('../components/ui/Button',()=>({Button:require('react-native').View}));
jest.mock('../components/ui/Typography',()=>({Heading:require('react-native').Text,Subheading:require('react-native').Text,Body:require('react-native').Text,Caption:require('react-native').Text}));
jest.mock('../components/ui/LoadingState',()=>({LoadingState:require('react-native').View}));

import Screen from '../app/(app)/bookings';
import {collectBookingHistory} from '../utils/booking-history';
it('complete history includes a third-page booking in global counts and search',async()=>{
 const booking=(id:string,name:string)=>({id,status:'pending',date:'2099-01-02',startTime:'09:00',duration:30,totalAmount:300,paymentMethod:'cash',location:'Bangkok',service:{name},companion:{name:'Guide'}}) as any;
 const fetchPage=jest.fn(async(page:number)=>({success:true,data:{items:[booking(`booking-${page}`,page===3?'Third page canal walk':`Earlier walk ${page}`)],pagination:{page,limit:1,total:3,totalPages:3}}}));
 mockHistory=await collectBookingHistory(fetchPage);const ui=render(<Screen/>);
 expect(fetchPage).toHaveBeenCalledTimes(3);expect(ui.getAllByRole('button',{name:'View booking details'})).toHaveLength(3);
 expect(ui.getAllByText('3')).toHaveLength(2);
 fireEvent.changeText(ui.getByPlaceholderText('bookings.searchBookings'),'Third page canal');
 expect(ui.getByText('Third page canal walk')).toBeTruthy();expect(ui.queryByText('Earlier walk 1')).toBeNull();expect(ui.queryByText('Earlier walk 2')).toBeNull();
 expect(ui.getAllByRole('button',{name:'View booking details'})).toHaveLength(1);expect(ui.getAllByText('3')).toHaveLength(2);ui.unmount();
});

it('shows a same-day confirmed Thailand countdown but no countdown for a pending trip', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-11-06T01:00:00Z'));
  const schedule = {
    date: '2026-11-06',
    startTime: '09:00',
    duration: 30,
    totalAmount: 300,
    paymentMethod: 'cash',
    companion: { name: 'Guide' },
  };
  mockHistory = { success: true, data: { items: [
    { ...schedule, id: 'confirmed-today', status: 'confirmed', service: { name: 'Confirmed canal walk' } },
    { ...schedule, id: 'pending-today', status: 'pending', service: { name: 'Requested canal walk' } },
    { ...schedule, id: 'completed', status: 'completed', service: { name: 'Completed canal walk' } },
  ] } };
  const ui = render(<Screen />);
  try {
    expect(ui.getByText('Confirmed canal walk')).toBeTruthy();
    expect(ui.getByText('Requested canal walk')).toBeTruthy();
    expect(ui.getAllByText('1h 0m')).toHaveLength(1);
    expect(ui.queryByText('Completed canal walk')).toBeNull();
    fireEvent.press(ui.getByText('bookings.past'));
    expect(ui.getByText('Completed canal walk')).toBeTruthy();
  } finally {
    ui.unmount();
    jest.useRealTimers();
  }
});
