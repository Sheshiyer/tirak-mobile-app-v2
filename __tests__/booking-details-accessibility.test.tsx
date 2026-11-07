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
import Screen from '../app/(app)/bookings';
import {router} from 'expo-router';
import {Platform} from 'react-native';
beforeEach(()=>{jest.clearAllMocks();mockBookingId='booking-real-1';mockRole='customer';});
it('pending booking exposes a named detail button that opens the existing booking route',()=>{
 const ui=render(<Screen/>);const button=ui.getByRole('button',{name:'View booking details'});fireEvent.press(button);
 expect(router.push).toHaveBeenCalledWith('/(app)/booking/booking-real-1');ui.unmount();
});
it('keeps detail navigation unavailable for the review fixture',()=>{
 mockBookingId='review-booking-fixture';const ui=render(<Screen/>);expect(ui.queryByRole('button',{name:'View booking details'})).toBeNull();expect(router.push).not.toHaveBeenCalled();ui.unmount();
});

it('blocks duplicate guide approval clicks until the acknowledged mutation completes',async()=>{
 mockRole='companion';let finish!:()=>void;
 mockMutateStatus.mockImplementation(()=>new Promise<void>(resolve=>{finish=resolve;}));
 const ui=render(<Screen/>);const approve=ui.getByRole('button',{name:'Approve booking request'});
 let control=approve;while(typeof control.props.onPress!=='function'&&control.parent)control=control.parent;
 const press=control.props.onPress;act(()=>{press();press();});
 expect(mockMutateStatus).toHaveBeenCalledTimes(1);
 expect(mockMutateStatus).toHaveBeenCalledWith({id:'booking-real-1',statusData:{status:'confirmed',reason:undefined}});
 await act(async()=>{finish();});ui.unmount();
});

it('web list rejection requires in-app confirmation, and Keep does not mutate',async()=>{
 const old=Platform.OS;Object.defineProperty(Platform,'OS',{value:'web',configurable:true});mockRole='companion';mockMutateStatus.mockResolvedValue({success:true});
 const ui=render(<Screen/>);fireEvent.press(ui.getByRole('button',{name:'Reject booking request'}));
 expect(ui.getByText('Reject this request?')).toBeTruthy();expect(mockMutateStatus).not.toHaveBeenCalled();
 const keep=ui.UNSAFE_getAllByType(require('../components/ui/Button').Button).find((node:any)=>node.props.title==='Keep request');fireEvent.press(keep!);
 expect(ui.queryByText('Reject this request?')).toBeNull();expect(mockMutateStatus).not.toHaveBeenCalled();
 fireEvent.press(ui.getByRole('button',{name:'Reject booking request'}));
 const confirm=ui.UNSAFE_getAllByType(require('../components/ui/Button').Button).find((node:any)=>node.props.title==='Confirm rejection');
 await act(async()=>fireEvent.press(confirm!));
 expect(mockMutateStatus).toHaveBeenCalledTimes(1);expect(mockMutateStatus).toHaveBeenCalledWith({id:'booking-real-1',statusData:{status:'cancelled',reason:'Guide declined the booking request.'}});
 ui.unmount();Object.defineProperty(Platform,'OS',{value:old,configurable:true});
});
