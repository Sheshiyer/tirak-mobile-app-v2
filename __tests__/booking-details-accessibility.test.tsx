import React from 'react';
import {render,fireEvent} from '@testing-library/react-native';
let mockBookingId='booking-real-1';
jest.mock('expo-router',()=>({router:{push:jest.fn(),replace:jest.fn()}}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:{id:'traveler-1',userType:'customer'},isAuthenticated:true})}));
jest.mock('../stores/toast-store',()=>({useToast:()=>({success:jest.fn(),error:jest.fn()})}));
jest.mock('../constants/review-mode',()=>({isReviewModeEnabled:()=>false,REVIEW_ACCOUNTS:{customer:{user:{id:'review-customer'}},guide:{user:{id:'review-guide'}}}}));
jest.mock('../stores/review-booking-fixture-store',()=>({REVIEW_BOOKING_ID:'review-booking-fixture',reviewBookingToListItem:jest.fn(),useReviewBookingFixtureStore:(selector:any)=>selector({booking:null,acceptAsGuide:jest.fn()})}));
jest.mock('../services/api/booking/booking',()=>({useBookingsQuery:()=>({data:{success:true,data:{items:[{id:mockBookingId,status:'pending',date:'2099-01-02',startTime:'09:00',duration:30,totalAmount:300,paymentMethod:'cash',location:'Bangkok',service:{name:'Canal walk'},companion:{name:'Local Guide'}}]}},isLoading:false,error:null,refetch:jest.fn()}),useUpdateBookingStatus:()=>({isPending:false})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../components/ui/Card',()=>({Card:require('react-native').View}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:require('react-native').View}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:require('react-native').View}));
jest.mock('../components/ui/Button',()=>({Button:require('react-native').View}));
jest.mock('../components/ui/Typography',()=>({Heading:require('react-native').Text,Subheading:require('react-native').Text,Body:require('react-native').Text,Caption:require('react-native').Text}));
jest.mock('../components/ui/LoadingState',()=>({LoadingState:require('react-native').View}));
import Screen from '../app/(app)/bookings';
import {router} from 'expo-router';
beforeEach(()=>{jest.clearAllMocks();mockBookingId='booking-real-1';});
it('pending booking exposes a named detail button that opens the existing booking route',()=>{
 const ui=render(<Screen/>);const button=ui.getByRole('button',{name:'View booking details'});fireEvent.press(button);
 expect(router.push).toHaveBeenCalledWith('/(app)/booking/booking-real-1');ui.unmount();
});
it('keeps detail navigation unavailable for the review fixture',()=>{
 mockBookingId='review-booking-fixture';const ui=render(<Screen/>);expect(ui.queryByRole('button',{name:'View booking details'})).toBeNull();expect(router.push).not.toHaveBeenCalled();ui.unmount();
});
