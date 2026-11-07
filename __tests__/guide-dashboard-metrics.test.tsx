import React from 'react';
const Renderer=require('react-test-renderer');const {act}=Renderer;
let mockStats:any;
jest.mock('react-native',()=>({Platform:{OS:'web',select:(x:any)=>x.web??x.default},StyleSheet:{create:(x:any)=>x},View:'View',Text:'Text',TouchableOpacity:'TouchableOpacity',ScrollView:'ScrollView',Alert:{alert:jest.fn()}}));
jest.mock('expo-router',()=>({router:{push:jest.fn()}}));
jest.mock('../components/ui/Card',()=>({Card:'Card'}));
jest.mock('../components/ui/Badge',()=>({Badge:'Badge'}));
jest.mock('../components/ui/Button',()=>({Button:'Button'}));
jest.mock('../components/ui/Divider',()=>({Divider:'Divider'}));
jest.mock('../components/ui/LoadingState',()=>({LoadingState:'LoadingState'}));
jest.mock('../components/ui/SafeIcon',()=>({SafeIcon:'SafeIcon'}));
jest.mock('../components/ErrorBoundary',()=>({ErrorBoundary:'ErrorBoundary'}));
jest.mock('../components/ui/ViewManagerSafeWrapper',()=>({ViewManagerSafeWrapper:'ViewManagerSafeWrapper'}));
jest.mock('lucide-react-native',()=>({Calendar:'Calendar',Settings:'Settings',TrendingUp:'TrendingUp',Plus:'Plus',Clock:'Clock',CheckCircle:'CheckCircle',XCircle:'XCircle'}));
jest.mock('../services/api/companion/stats',()=>({useSupplierStats:()=>({data:{data:{data:mockStats}},isLoading:false})}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({isAuthenticated:true})}));
jest.mock('../services/api/booking/booking',()=>({useBookingsQuery:()=>({data:{success:true,data:{items:[],bookings:[]}},isLoading:false,error:null,refetch:jest.fn()})}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>(({'analytics.unavailable':'Unavailable','userHome.companion.bookings':'Bookings','userHome.companion.rating':'Rating','analytics.thisMonthEarnings':'This Month'} as Record<string,string>)[key]||key)})}));
import {CompanionDashboard} from '../components/home/CompanionDashboard';
const flatten=(x:any):any=>Array.isArray(x)?Object.assign({},...x.filter(Boolean).map(flatten)):x||{};
let tree:any;afterEach(async()=>{if(tree)await act(async()=>tree.unmount());});
it('narrow-column null metrics use compact dashes with full semantic labels, not adjacent Unavailable values',async()=>{
 mockStats={totalBookings:0,averageRating:null,thisMonthEarnings:null};await act(async()=>{tree=Renderer.create(<CompanionDashboard userName="Guide"/>);});
 const values=tree.root.findAllByType('Text').filter((node:any)=>node.props.accessibilityLabel);
 expect(values.map((node:any)=>node.props.accessibilityLabel)).toEqual(['Bookings: 0','Rating: Unavailable','This Month: Unavailable']);
 expect(values.map((node:any)=>node.props.children)).toEqual([0,'—','—']);
 for(const value of values){expect(value.props.numberOfLines).toBe(1);expect(flatten(value.props.style).maxWidth).toBe('100%');expect(flatten(value.parent.props.style)).toEqual(expect.objectContaining({minWidth:0,flex:1,flexShrink:1}));}
 expect(tree.root.findAllByType('Text').some((node:any)=>Array.isArray(node.props.children)&&node.props.children.includes('Unavailable'))).toBe(true);
});
it('real zero ratings and earnings stay zero instead of becoming unavailable',async()=>{
 mockStats={totalBookings:0,averageRating:0,thisMonthEarnings:0};await act(async()=>{tree=Renderer.create(<CompanionDashboard userName="Guide"/>);});
 const values=tree.root.findAllByType('Text').filter((node:any)=>node.props.accessibilityLabel);
 expect(values.map((node:any)=>node.props.children)).toEqual([0,0,0]);expect(values.map((node:any)=>node.props.accessibilityLabel)).toEqual(['Bookings: 0','Rating: 0','This Month: 0']);
});
