import React from 'react';
const Renderer=require('react-test-renderer');const {act}=Renderer;
let mockQuery:any;let mockUpdate:any;
jest.mock('react-native',()=>({Platform:{OS:'web',select:(x:any)=>x.web??x.default},StyleSheet:{create:(x:any)=>x},ActivityIndicator:'ActivityIndicator',ScrollView:'ScrollView',Switch:'Switch',Text:'Text',TouchableOpacity:'TouchableOpacity',View:'View'}));
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:'SafeAreaView'}));
jest.mock('expo-router',()=>({router:{canGoBack:()=>false,replace:jest.fn(),back:jest.fn()}}));
jest.mock('lucide-react-native',()=>({ArrowLeft:'ArrowLeft',Bell:'Bell',Mail:'Mail',Smartphone:'Smartphone'}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:'RadialGradient'}));
jest.mock('../components/ui/Button',()=>({Button:'Button'}));
jest.mock('../services/api/notifications/notifications',()=>({useNotificationPreferences:()=>mockQuery,useUpdateNotificationPreferences:()=>mockUpdate}));
import Screen from '../app/(app)/profile/notificationSettings';
let tree:any;
beforeEach(()=>{mockQuery={isLoading:false,error:null,refetch:jest.fn(),data:{success:true,data:{preferences:{push:true,email:true,sms:false}}}};mockUpdate={mutate:jest.fn(),isPending:false};});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());});
it('shows loading and retryable failures instead of fictitious all-off toggles',async()=>{
 mockQuery.isLoading=true;mockQuery.data=undefined;
 await act(async()=>{tree=Renderer.create(<Screen/>);});expect(tree.root.findAllByType('Switch')).toHaveLength(0);expect(tree.root.findAllByType('ActivityIndicator')).toHaveLength(1);
 mockQuery.isLoading=false;mockQuery.error=new Error('offline');await act(async()=>tree.update(<Screen/>));
 expect(tree.root.findAllByType('Switch')).toHaveLength(0);expect(JSON.stringify(tree.toJSON())).toContain('notificationSettings.loadError');
 await act(async()=>tree.root.findByType('Button').props.onPress());expect(mockQuery.refetch).toHaveBeenCalled();
});
it('loads actual preferences, labels switches and restores prior value visibly on failure',async()=>{
 await act(async()=>{tree=Renderer.create(<Screen/>);});let switches=tree.root.findAllByType('Switch');expect(switches.map((s:any)=>s.props.value)).toEqual([true,true,false]);expect(switches[0].props.accessibilityLabel).toBe('settingsFlow.pushAlerts');
 await act(async()=>switches[0].props.onValueChange(false));expect(mockUpdate.mutate).toHaveBeenCalledWith({push:false},expect.anything());
 await act(async()=>mockUpdate.mutate.mock.calls[0][1].onError(new Error('offline')));
 switches=tree.root.findAllByType('Switch');expect(switches[0].props.value).toBe(true);expect(JSON.stringify(tree.toJSON())).toContain('notificationSettings.saveError');
});
it('disables controls during save and confirms only the server returned preference',async()=>{
 await act(async()=>{tree=Renderer.create(<Screen/>);});await act(async()=>tree.root.findAllByType('Switch')[0].props.onValueChange(false));
 mockUpdate.isPending=true;await act(async()=>tree.update(<Screen/>));expect(tree.root.findAllByType('Switch').every((s:any)=>s.props.disabled)).toBe(true);
 mockUpdate.isPending=false;await act(async()=>mockUpdate.mutate.mock.calls[0][1].onSuccess({success:true,data:{preferences:{push:false,email:true,sms:false}}}));
 expect(tree.root.findAllByType('Switch')[0].props.value).toBe(false);expect(JSON.stringify(tree.toJSON())).toContain('notificationSettings.saved');
});
