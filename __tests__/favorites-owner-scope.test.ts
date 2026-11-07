jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('expo-secure-store', () => ({ getItemAsync:jest.fn(),setItemAsync:jest.fn(),deleteItemAsync:jest.fn() }));
import { useFavoritesStore } from '../stores/favorites-store';
import { secureStorage } from '../utils/secure-storage';
import * as NativeStorage from 'expo-secure-store';
const values = new Map<string,string>();
beforeEach(async () => {
 values.clear();
 Object.defineProperty(globalThis,'window',{configurable:true,value:{localStorage:{getItem:(key:string)=>values.get(key)||null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)}}});
 await useFavoritesStore.getState().bindOwner(null);
});
afterEach(()=>{jest.restoreAllMocks();Reflect.deleteProperty(globalThis,'window');});
it('persists real store web roundtrip and isolates A → logout → B → A',async()=>{
 await useFavoritesStore.getState().bindOwner('user-A');
 useFavoritesStore.getState().toggleFavorite({id:'guide-A',name:'Favorite A'});
 expect([...values.values()].join()).toContain('guide-A');
 expect([...values.keys()].every(key => /^[A-Za-z0-9._-]+$/.test(key))).toBe(true);
 await useFavoritesStore.getState().bindOwner(null);
 expect(useFavoritesStore.getState().favorites).toEqual([]);
 await useFavoritesStore.getState().bindOwner('user-B');
 expect(useFavoritesStore.getState().favorites).toEqual([]);
 useFavoritesStore.getState().addFavorite('guide-B',{id:'guide-B',name:'Favorite B'});
 await useFavoritesStore.getState().bindOwner(null);
 await useFavoritesStore.getState().bindOwner('user-A');
 expect(useFavoritesStore.getState().favorites).toEqual(['guide-A']);
 expect(useFavoritesStore.getState().favoriteCompanions['guide-B']).toBeUndefined();
 expect(NativeStorage.setItemAsync).not.toHaveBeenCalled();
});
it('fences a late A storage read after logout and B hydration',async()=>{
 let completeA!:(value:string|null)=>void;
 jest.spyOn(secureStorage,'getItemAsync').mockImplementationOnce(()=>new Promise(resolve=>{completeA=resolve;}));
 const hydrationA=useFavoritesStore.getState().bindOwner('user-A');
 await useFavoritesStore.getState().bindOwner(null);
 await useFavoritesStore.getState().bindOwner('user-B');
 completeA(JSON.stringify({favorites:['private-A'],favoriteCompanions:{}}));await hydrationA;
 expect(useFavoritesStore.getState().ownerId).toBe('user-B');
 expect(useFavoritesStore.getState().favorites).toEqual([]);
});
it('never imports unowned legacy favorites and anonymous edits cannot persist',async()=>{
 values.set('favorites-storage',JSON.stringify({state:{favorites:['unowned-private']}}));
 useFavoritesStore.getState().addFavorite('anonymous');
 await useFavoritesStore.getState().bindOwner('new-owner');
 expect(useFavoritesStore.getState().favorites).toEqual([]);
 expect([...values.keys()]).toEqual(['favorites-storage']);
});
