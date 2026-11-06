import React from 'react';
const Renderer=require('react-test-renderer');const {act}=Renderer;
const mockMutate=jest.fn();
const mockUser={id:'traveler-1',name:'Traveler',email:'synthetic@example.com',profileImage:'',dateOfBirth:''};
let mockProfile={data:{name:'Traveler',email:'synthetic@example.com',dateOfBirth:''}};
let mockPlatform: 'web' | 'android' = 'web';
jest.mock('react-native',()=>({Platform:{get OS(){return mockPlatform;},select:(options:any)=>options[mockPlatform] ?? options.default},StyleSheet:{create:(s:any)=>s},View:'View',Text:'Text',ScrollView:'ScrollView',TouchableOpacity:'TouchableOpacity',Alert:{alert:jest.fn()},Modal:'Modal',SafeAreaView:'SafeAreaView'}));
jest.mock('expo-router',()=>({router:{canGoBack:()=>false,replace:jest.fn(),back:jest.fn()}}));
jest.mock('../services/api/customer/customerProfile',()=>({useCustomerProfile:()=>({data:mockProfile,isLoading:false,error:null}),useUpdateCustomerProfile:()=>({mutate:mockMutate,isPending:false})}));
jest.mock('@tanstack/react-query',()=>({useQueryClient:()=>({setQueryData:jest.fn()})}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:mockUser,updateUser:jest.fn()})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:'RadialGradient'}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:'ProfileImage'}));
jest.mock('../components/ui/Input',()=>({Input:'Input'}));
jest.mock('../components/ui/Button',()=>({Button:'Button'}));
jest.mock('../components/ui/Card',()=>({Card:'Card'}));
jest.mock('../components/ui/SimpleInput',()=>({SimpleInput:'SimpleInput'}));
jest.mock('lucide-react-native',()=>({ArrowLeft:'ArrowLeft',Camera:'Camera',Save:'Save',User:'User',Phone:'Phone',Mail:'Mail',MapPin:'MapPin',Calendar:'Calendar'}));
jest.mock('@react-native-community/datetimepicker',()=>({
  __esModule: true,
  default: 'NativeDatePicker',
}));
jest.mock('../utils/profile-image-picker',()=>({chooseProfileImage:jest.fn()}));
import Screen from '../app/(app)/profile/edit';
beforeEach(()=>{jest.clearAllMocks();mockPlatform='web';mockProfile={data:{name:'Traveler',email:'synthetic@example.com',dateOfBirth:''}};});
it('web birth date is empty until chosen and saves literal calendar date without native picker or timezone conversion',async()=>{
 let tree:any;await act(async()=>{tree=Renderer.create(<Screen/>);});
 const input=tree.root.findByType('input');expect(input.props.type).toBe('date');expect(input.props.value).toBe('');expect(input.props.max).toMatch(/^\d{4}-\d{2}-\d{2}$/);
 expect(tree.root.findAllByType('NativeDatePicker')).toHaveLength(0);
 await act(async()=>input.props.onChange({currentTarget:{value:'1990-01-02'}}));
 const save=tree.root.findAllByType('Button').find((b:any)=>b.props.title==='profile.customer.saveChanges');
 await act(async()=>save.props.onPress());expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({dateOfBirth:'1990-01-02'}),expect.anything());
 await act(async()=>tree.unmount());
});

it('Android opens an older saved birth date on the same day and ignores a cancelled edit', async () => {
  mockPlatform = 'android';
  mockProfile.data.dateOfBirth = '1965-01-02T00:00:00.000Z';
  let tree: any;
  await act(async () => { tree = Renderer.create(<Screen />); });
  const open = () => tree.root.findByProps({
    accessibilityLabel: 'profile.customer.dateOfBirth',
  }).props.onPress();
  await act(async () => open());
  const picker = tree.root.findByType('NativeDatePicker');
  expect(picker.props.value).toEqual(new Date(1965, 0, 2));
  expect(picker.props.minimumDate).toEqual(new Date(1900, 0, 1));
  await act(async () => picker.props.onChange({ type: 'dismissed' }, new Date(1965, 0, 3)));
  expect(tree.root.findByProps({
    accessibilityLabel: 'profile.customer.dateOfBirth',
  }).props.accessibilityValue.text).toBe('1965-01-02');

  await act(async () => open());
  await act(async () => tree.root.findByType('NativeDatePicker')
    .props.onChange({ type: 'set' }, new Date(1965, 0, 3)));
  const save = tree.root.findByProps({ title: 'profile.customer.saveChanges' });
  await act(async () => save.props.onPress());
  expect(mockMutate).toHaveBeenCalledWith(
    expect.objectContaining({ dateOfBirth: '1965-01-03' }),
    expect.anything(),
  );
  await act(async () => tree.unmount());
});

it('onInput synchronizes the selected day and a background profile refresh cannot overwrite the unsaved date',async()=>{
 let tree:any;await act(async()=>{tree=Renderer.create(<Screen/>);});
 await act(async()=>tree.root.findByType('input').props.onInput({currentTarget:{value:'1990-02-03'}}));
 expect(tree.root.findByType('input').props.value).toBe('1990-02-03');
 mockProfile={data:{name:'Traveler',email:'synthetic@example.com',dateOfBirth:'1990-02-02'}};
 await act(async()=>tree.update(<Screen/>));
 expect(tree.root.findByType('input').props.value).toBe('1990-02-03');
 const save=tree.root.findAllByType('Button').find((b:any)=>b.props.title==='profile.customer.saveChanges');
 await act(async()=>save.props.onPress());
 expect(mockMutate).toHaveBeenCalledWith(expect.objectContaining({dateOfBirth:'1990-02-03'}),expect.anything());
 await act(async()=>tree.unmount());
});
