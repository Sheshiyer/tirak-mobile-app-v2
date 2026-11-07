import React from 'react';
const Renderer = require('react-test-renderer');
const {act}=Renderer;
let mockAuth:any;
jest.mock('react-native',()=>({ActivityIndicator:'ActivityIndicator'}));
jest.mock('expo-router',()=>({Redirect:'Redirect'}));
jest.mock('../hooks/useAuthStoreHydrated',()=>({useAuthStoreHydrated:()=>mockAuth}));
import Screen from '../app/supplier/settings';
let tree:any;
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());});
it.each(['supplier','companion'])('legacy URL directs restored %s to the complete canonical guide settings',async userType=>{
 mockAuth={isHydrated:true,user:{id:'guide-1',userType}};
 await act(async()=>{tree=Renderer.create(<Screen/>);});
 expect(tree.root.findByType('Redirect').props.href).toBe('/(supplier)/settings');
});
it('traveler alias never opens guide-only settings',async()=>{
 mockAuth={isHydrated:true,user:{id:'traveler-1',userType:'customer'}};
 await act(async()=>{tree=Renderer.create(<Screen/>);});expect(tree.root.findByType('Redirect').props.href).toBe('/(app)/settings');
});
it('waits for actual hydration before selecting a role route',async()=>{
 mockAuth={isHydrated:false,user:{id:'unrestored',userType:'companion'}};
 await act(async()=>{tree=Renderer.create(<Screen/>);});expect(tree.root.findAllByType('Redirect')).toHaveLength(0);expect(tree.root.findByType('ActivityIndicator').props.accessibilityLabel).toBe('Loading account settings');
});
it('signed-out users go to auth after hydration',async()=>{
 mockAuth={isHydrated:true,user:null};await act(async()=>{tree=Renderer.create(<Screen/>);});expect(tree.root.findByType('Redirect').props.href).toBe('/auth');
});
