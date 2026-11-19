import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import {Share} from 'react-native';
import {router} from 'expo-router';
import {useFavoritesStore} from '../stores/favorites-store';
jest.mock('../utils/secure-storage',()=>({secureStorage:{getItemAsync:jest.fn().mockResolvedValue(null),setItemAsync:jest.fn().mockResolvedValue(undefined)}}));
jest.mock('expo-haptics',()=>({impactAsync:jest.fn(),ImpactFeedbackStyle:{Light:'light',Medium:'medium'}}));
jest.mock('expo-linking',()=>({openURL:jest.fn()}));
jest.mock('expo-image',()=>({Image:require('react-native').View}));
jest.mock('expo-router',()=>({useLocalSearchParams:()=>({id:'guide-real-1'}),router:{back:jest.fn(),push:jest.fn()},Link:require('react-native').View}));
jest.mock('@react-navigation/native',()=>({useNavigation:()=>({})}));
jest.mock('posthog-react-native',()=>({usePostHog:()=>({capture:jest.fn()})}));
jest.mock('../utils/demo-mode',()=>({isDemoModeEnabled:()=>false}));
jest.mock('../stores/auth-store',()=>({useAuthStore:()=>({user:{id:'traveler-1'}})}));
jest.mock('../stores/booking-store',()=>({useBookingStore:()=>({setCompanionData:jest.fn()})}));
jest.mock('../stores/toast-store',()=>({useToastStore:()=>({showToast:jest.fn()})}));
jest.mock('../utils/currency',()=>({useCurrencyConversion:()=>null,formatOriginalCurrencyContext:()=>null,formatTravelerCurrency:()=>''}));
jest.mock('react-i18next',()=>({useTranslation:()=>({t:(key:string)=>key})}));
jest.mock('../services/api/companion/companion',()=>({useCompanionQuery:()=>({data:{success:true,data:{id:'guide-real-1',name:'Canal Guide',displayName:'Canal Guide',location:'Bangkok',languages:['English'],experiences:[],reviews:[],bio:'Local walks'}}}),useCompanionWeeklyAvailability:()=>({data:{success:true,data:[]}})}));
jest.mock('../components/ui/Card',()=>({Card:require('react-native').View}));
jest.mock('../components/ui/GuideStartingPrice',()=>({GuideStartingPrice:require('react-native').View}));
jest.mock('../components/ui/CategoryChip',()=>({CategoryChip:require('react-native').View}));
jest.mock('../components/ui/RadialGradient',()=>({RadialGradient:require('react-native').View}));
jest.mock('../components/ui/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { TouchableOpacity, Text } = require('react-native');
    return <TouchableOpacity accessibilityRole="button" onPress={onPress}><Text>{title}</Text></TouchableOpacity>;
  },
}));
jest.mock('../components/ui/ImageCarousel',()=>({ImageCarousel:require('react-native').View}));
jest.mock('../components/ui/ProfileImage',()=>({ProfileImage:require('react-native').View}));
jest.mock('../components/ui/LoadingState',()=>({LoadingState:require('react-native').View}));
jest.mock('../components/ui/CompanionProfileShimmer',()=>({__esModule:true,default:require('react-native').View}));
import Screen from '../app/companion/[id]';
beforeEach(async()=>{jest.clearAllMocks();await useFavoritesStore.getState().bindOwner(null);await useFavoritesStore.getState().bindOwner('traveler-1');});
it('named favorite button saves and removes the actual guide through the owner-scoped store',()=>{
 const ui=render(<Screen/>);
 const save=ui.getByRole('button',{name:'Save guide to favorites',selected:false});
 fireEvent.press(save);
 expect(useFavoritesStore.getState().favorites).toEqual(['guide-real-1']);
 expect(useFavoritesStore.getState().favoriteCompanions['guide-real-1'].name).toBe('Canal Guide');
 fireEvent.press(ui.getByRole('button',{name:'Remove guide from favorites',selected:true}));
 expect(useFavoritesStore.getState().favorites).toEqual([]);
 expect(ui.getByRole('button',{name:'Save guide to favorites',selected:false})).toBeTruthy();
 ui.unmount();
});
it('keeps Back and Share and offers availability without simulated reporting or pre-booking chat',async()=>{
 const share=jest.spyOn(Share,'share').mockResolvedValue({action:Share.dismissedAction});
 const ui=render(<Screen/>);
 fireEvent.press(ui.getByRole('button',{name:'Back'}));expect(router.back).toHaveBeenCalledTimes(1);
 await act(async()=>{fireEvent.press(ui.getByRole('button',{name:'Share guide'}));});
 expect(share).toHaveBeenCalledWith(expect.objectContaining({title:'Canal Guide — Tirak Local Guide'}));
 expect(ui.getByRole('button', { name: 'companionDetails.viewAvailability' })).toBeTruthy();
 expect(ui.queryByRole('button', { name: 'Report guide' })).toBeNull();
 expect(ui.queryByRole('button', { name: 'companionDetails.chatNow' })).toBeNull();
 expect(useFavoritesStore.getState().favorites).toEqual([]);
 ui.unmount();share.mockRestore();
});
