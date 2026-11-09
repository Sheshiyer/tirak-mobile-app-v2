import React from 'react';
import { render } from '@testing-library/react-native';
const mockArchive = jest.fn();
let mockMutationIndex = 0;
const mockExperience = {id:'service-1',title:'Canal walk',description:'A local cultural walk',price:1800,currency:'THB',durationMinutes:180,keywords:[],isActive:true};
jest.mock('expo-router', () => ({ useRouter: () => ({ back:jest.fn(), replace:jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/stores/auth-store', () => ({ useAuthStore: (select: any) => select({ user: {id:'owner'} }) }));
jest.mock('@/stores/toast-store', () => ({ useToast: () => ({success:jest.fn(),error:jest.fn()}) }));
jest.mock('@/services/api/companion/experience', () => ({ useExperiences: () => ({data:{data:{items:[mockExperience]}}, isLoading:false, refetch:jest.fn()}), useInfiniteExperiences: () => ({data:{pages:[{data:{items:[mockExperience],pagination:{total:1,page:1,totalPages:1}}}]}, isLoading:false, refetch:jest.fn(), fetchNextPage:jest.fn(), hasNextPage:false, isFetchingNextPage:false}), useCreateExperience: () => ({isPending:false}), archiveExperience: jest.fn(), updateExperience: jest.fn(), invalidateExperienceQueries: jest.fn(), readExperienceDrafts: jest.fn() }));
jest.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({}), useQuery: () => ({data:[]}), useMutation: () => { mockMutationIndex++; return {mutate:mockArchive,isPending:false,isError:false,reset:jest.fn()}; } }));
const ServicesScreen = require('@/app/(supplier)/services/index').default;
test.each([
  [30, '30min'],
  [60, '1h'],
  [90, '1h 30min'],
  [135, '2h 15min'],
  [1439, '23h 59min'],
])('experience card preserves %i whole minutes as %s', (minutes, label) => {
  mockExperience.durationMinutes = minutes;
  const ui = render(<ServicesScreen />);
  expect(ui.getByText(label)).toBeTruthy();
  if (minutes === 30) expect(ui.queryByText('1h')).toBeNull();
  ui.unmount();
});
