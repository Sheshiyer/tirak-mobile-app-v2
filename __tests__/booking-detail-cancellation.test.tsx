import React from 'react';
const Renderer=require('react-test-renderer');const {act}=Renderer;
let mockRole='customer';const mockMutate=jest.fn();
const mockCreateOrGetRoom = jest.fn();
const mockPush = jest.fn();
let mockBooking:any;
jest.mock('react-native',()=>({Platform:{OS:'web',select:(x:any)=>x.web??x.default},StyleSheet:{create:(x:any)=>x},View:'View',Text:'Text',ActivityIndicator:'ActivityIndicator',ScrollView:'ScrollView',SafeAreaView:'SafeAreaView',TouchableOpacity:'TouchableOpacity',Alert:{alert:jest.fn()},Linking:{openURL:jest.fn()},Modal:({visible,children}:any)=>visible?require('react').createElement('Modal',null,children):null}));
jest.mock('expo-router',()=>({useLocalSearchParams:()=>({id:'booking-real-1'}),useRouter:()=>({back:jest.fn(),push:mockPush})}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:{id:'person-1',userType:mockRole},isAuthenticated:true})}));
jest.mock('../services/api/booking/booking',()=>({useBookingQuery:()=>({data:{success:true,data:{booking:mockBooking}},isLoading:false,error:null}),useUpdateBookingStatus:()=>({mutateAsync:mockMutate})}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:'RadialGradient'}));
jest.mock('../components/ui/Card',()=>({Card:'Card'}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:'ProfileImage'}));
jest.mock('../components/ui/Button',()=>({Button:'Button'}));
jest.mock('../components/ui/Typography',()=>({Heading:'Heading',Subheading:'Subheading',Body:'Body',Caption:'Caption'}));
jest.mock('../utils/currency',()=>({useCurrencyConversion:()=>null}));
jest.mock('../utils/chat-api', () => ({ createOrGetRoom: (...args: unknown[]) => mockCreateOrGetRoom(...args) }));
jest.mock('../utils/payment-display',()=>({toPaymentDisplay:()=>({status:'Cash due',method:'Cash',collectionNote:'Pay guide directly'})}));
jest.mock('lucide-react-native',()=>({ArrowLeft:'ArrowLeft',CalendarPlus:'CalendarPlus',CheckCircle:'CheckCircle',Clock:'Clock',MessageCircle:'MessageCircle',XCircle:'XCircle'}));
import Screen from '../app/(app)/booking/[id]';
import {Alert,Linking,Platform} from 'react-native';
let tree:any;
const action=(label:string)=>tree.root.findAllByType('TouchableOpacity').find((x:any)=>x.props.accessibilityLabel===label);
beforeEach(()=>{jest.useFakeTimers();jest.clearAllMocks();(Platform as any).OS='web';mockRole='customer';mockBooking={id:'booking-real-1',status:'confirmed',date:'2099-01-02',startTime:'09:00',endTime:'09:30',duration:30,totalAmount:300,companion:{name:'Local Guide'},customer:{name:'Traveler'},service:{name:'Canal walk'},paymentStatus:'pending'};});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());jest.useRealTimers();});
it('web cancellation requires explicit in-app confirmation and Keep booking leaves it untouched',async()=>{
 await act(async()=>{tree=Renderer.create(<Screen/>);});await act(async()=>action('Cancel this booking').props.onPress());
 expect(action('Confirm cancellation').props.accessibilityRole).toBe('button');expect(JSON.stringify(tree.toJSON())).toContain('Free cancellation applies 48h+');expect(mockMutate).not.toHaveBeenCalled();expect(Alert.alert).not.toHaveBeenCalled();
 await act(async()=>action('Keep booking').props.onPress());expect(action('Confirm cancellation')).toBeUndefined();expect(mockMutate).not.toHaveBeenCalled();
});
it('confirm cancellation submits exactly once, disables pending controls and shows completion',async()=>{
 let finish!:(value:any)=>void;mockMutate.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 await act(async()=>{tree=Renderer.create(<Screen/>);});await act(async()=>action('Cancel this booking').props.onPress());
 const confirm=action('Confirm cancellation').props.onPress;act(()=>{void confirm();void confirm();});
 expect(mockMutate).toHaveBeenCalledTimes(1);expect(mockMutate).toHaveBeenCalledWith({id:'booking-real-1',statusData:{status:'cancelled'}});expect(action('Keep booking').props.disabled).toBe(true);expect(action('Confirm cancellation').props.accessibilityState.busy).toBe(true);
 await act(async()=>finish({success:true}));expect(action('Confirm cancellation')).toBeUndefined();expect(JSON.stringify(tree.toJSON())).toContain('Booking cancelled: This Tirak booking has been cancelled.');
});
it('failed cancellation keeps the confirmation and displays a retryable error',async()=>{
 mockMutate.mockRejectedValue(new Error('Network unavailable'));await act(async()=>{tree=Renderer.create(<Screen/>);});await act(async()=>action('Cancel this booking').props.onPress());await act(async()=>action('Confirm cancellation').props.onPress());
 expect(JSON.stringify(tree.toJSON())).toContain('Could not cancel booking: Network unavailable');expect(action('Confirm cancellation').props.disabled).toBe(false);expect(mockBooking.status).toBe('confirmed');
});
it('guide rejection uses the same explicit confirmation and preserves its existing reason',async()=>{
 mockRole='companion';mockBooking.status='pending';mockMutate.mockResolvedValue({success:true});await act(async()=>{tree=Renderer.create(<Screen/>);});expect(action('Cancel this booking')).toBeUndefined();await act(async()=>action('Reject booking request').props.onPress());expect(mockMutate).not.toHaveBeenCalled();await act(async()=>action('Confirm rejection').props.onPress());expect(mockMutate).toHaveBeenCalledWith({id:'booking-real-1',statusData:{status:'cancelled',reason:'Guide declined the booking request.'}});expect(JSON.stringify(tree.toJSON())).toContain('Booking rejected:');
});
it('native cancellation retains Alert confirmation and completed bookings expose no cancellation',async()=>{
 (Platform as any).OS='ios';await act(async()=>{tree=Renderer.create(<Screen/>);});await act(async()=>action('Cancel this booking').props.onPress());expect(Alert.alert).toHaveBeenCalledWith('Cancel booking',expect.stringContaining('48h+'),expect.any(Array));expect(mockMutate).not.toHaveBeenCalled();await act(async()=>tree.unmount());mockBooking.status='completed';await act(async()=>{tree=Renderer.create(<Screen/>);});expect(action('Cancel this booking')).toBeUndefined();
});

it.each(['pending', 'completed', 'cancelled'])('keeps %s booking details readable without active trip actions', async status => {
  mockBooking.status = status;
  await act(async () => { tree = Renderer.create(<Screen />); });
  expect(action('Message')).toBeUndefined();
  expect(action('Add booking to calendar')).toBeUndefined();
  expect(mockCreateOrGetRoom).not.toHaveBeenCalled();
});

it('opens only the selected booking room and guards duplicate taps', async () => {
  mockBooking.companionId = 'guide-with-an-older-room';
  let finish!: (roomId: string) => void;
  mockCreateOrGetRoom.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => { tree = Renderer.create(<Screen />); });
  const press = action('Message').props.onPress;
  act(() => { void press(); void press(); });
  expect(mockCreateOrGetRoom).toHaveBeenCalledTimes(1);
  expect(mockCreateOrGetRoom).toHaveBeenCalledWith('booking-real-1');
  expect(action('Message').props.accessibilityState.busy).toBe(true);
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () => { finish('selected-booking-room'); });
  expect(mockPush).toHaveBeenCalledWith('/chat/selected-booking-room');
});

it('offers retry after a room failure and sends the Thai schedule to the calendar', async () => {
  mockCreateOrGetRoom.mockResolvedValueOnce(null).mockResolvedValueOnce('selected-booking-room');
  await act(async () => { tree = Renderer.create(<Screen />); });
  await act(async () => action('Message').props.onPress());
  expect(JSON.stringify(tree.toJSON())).toContain('Could not open chat');
  expect(mockPush).not.toHaveBeenCalled();
  await act(async () => action('Message').props.onPress());
  expect(mockPush).toHaveBeenCalledWith('/chat/selected-booking-room');
  await act(async () => action('Add booking to calendar').props.onPress());
  expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('dates=20990102T020000Z/20990102T023000Z&ctz=Asia%2FBangkok'));
});
