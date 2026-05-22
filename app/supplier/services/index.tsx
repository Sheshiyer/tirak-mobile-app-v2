import { logger } from '@/utils/logger';
// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   Switch,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import {
//   Plus,
//   Search,
//   Filter,
//   MoreVertical,
//   Eye,
//   Edit,
//   Copy,
//   Trash2,
//   TrendingUp,
//   Star,
//   Calendar,
//   DollarSign,
//   Users,
//   BarChart3,
//   Grid,
//   Target,
// } from 'lucide-react-native';
// import { RadialGradient } from '@/components/ui/RadialGradient';
// import { Card } from '@/components/ui/Card';
// import { Button } from '@/components/ui/Button';
// import { Heading, Subheading, Body, Caption } from '@/components/ui/Typography';
// import { designTokens, componentTokens } from '@/constants/design-tokens';
// import {
//   mockSupplierServices,
//   SupplierService,
//   getActiveServices,
//   getServiceAnalytics,
// } from '@/mocks/supplier-services';

// type ServiceFilter = 'all' | 'active' | 'inactive' | 'draft';
// type SortOption = 'name' | 'created' | 'bookings' | 'revenue' | 'rating';

// export default function ServicesManagementScreen() {
//   const router = useRouter();
//   const [refreshing, setRefreshing] = useState(false);
//   const [activeFilter, setActiveFilter] = useState<ServiceFilter>('all');
//   const [sortBy, setSortBy] = useState<SortOption>('created');
//   const [showAnalytics, setShowAnalytics] = useState(true);
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     setTimeout(() => {
//       setRefreshing(false);
//     }, 1000);
//   }, []);

//   const getFilteredServices = (): SupplierService[] => {
//     let filtered = [...mockSupplierServices];

//     // Apply filter
//     if (activeFilter !== 'all') {
//       filtered = filtered.filter(service => service.status === activeFilter);
//     }

//     // Apply sorting
//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case 'name':
//           return a.name.localeCompare(b.name);
//         case 'created':
//           return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
//         case 'bookings':
//           return b.totalBookings - a.totalBookings;
//         case 'revenue':
//           return b.revenue - a.revenue;
//         case 'rating':
//           return b.rating - a.rating;
//         default:
//           return 0;
//       }
//     });

//     return filtered;
//   };

//   const analytics = getServiceAnalytics();
//   const filteredServices = getFilteredServices();

//   const handleCreateService = () => {
//     router.push('/supplier/services/create');
//   };

//   const handleServiceAction = (serviceId: string, action: 'view' | 'edit' | 'duplicate' | 'delete') => {
//     switch (action) {
//       case 'view':
//         router.push(`/supplier/services/${serviceId}`);
//         break;
//       case 'edit':
//         router.push(`/supplier/services/${serviceId}/edit`);
//         break;
//       case 'duplicate':
//         logger.log('Duplicating service:', serviceId);
//         break;
//       case 'delete':
//         logger.log('Deleting service:', serviceId);
//         break;
//     }
//   };

//   const toggleServiceStatus = (serviceId: string, currentStatus: string) => {
//     const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
//     logger.log(`Toggling service ${serviceId} to ${newStatus}`);
//   };

//   const formatCurrency = (amount: number) => {
//     return `฿${amount.toLocaleString()}`;
//   };
//   const ServiceCard = ({ service }: { service: SupplierService }) => (
//     <Card style={styles.serviceCard} padding={16}>
//       {/* Service Header */}
//       <View style={styles.serviceHeader}>
//         <View style={styles.serviceImageContainer}>
//           <View style={styles.servicePlaceholderImage}>
//             <Text style={styles.serviceImageText}>📸</Text>
//           </View>
//           <View style={[
//             styles.statusIndicator,
//             { backgroundColor: service.status === 'active' ? designTokens.colors.semantic.success : designTokens.colors.semantic.textSecondary }
//           ]} />
//         </View>

//         <View style={styles.serviceInfo}>
//           <View style={styles.serviceTitleRow}>
//             <Subheading style={styles.serviceName} numberOfLines={1}>
//               {service.name}
//             </Subheading>
//             <TouchableOpacity style={styles.moreButton}>
//               <MoreVertical size={16} color={designTokens.colors.semantic.textSecondary} />
//             </TouchableOpacity>
//           </View>

//           <Caption style={styles.serviceCategory}>
//             {service.subcategory} • {service.duration} {service.durationUnit}
//           </Caption>

//           <View style={styles.serviceMetrics}>
//             <View style={styles.metricItem}>
//               <Star size={12} color="#FFD700" fill="#FFD700" />
//               <Caption style={styles.metricText}>
//                 {service.rating} ({service.reviewCount})
//               </Caption>
//             </View>
//             <View style={styles.metricItem}>
//               <Calendar size={12} color={designTokens.colors.semantic.primary} />
//               <Caption style={styles.metricText}>
//                 {service.totalBookings} bookings
//               </Caption>
//             </View>
//           </View>
//         </View>
//       </View>

//       {/* Service Stats */}
//       <View style={styles.serviceStats}>
//         <View style={styles.statItem}>
//           <DollarSign size={14} color={designTokens.colors.semantic.success} />
//           <View style={styles.statContent}>
//             <Caption style={styles.statLabel}>Revenue</Caption>
//             <Body style={styles.statValue}>{formatCurrency(service.revenue)}</Body>
//           </View>
//         </View>

//         <View style={styles.statItem}>
//           <TrendingUp size={14} color={designTokens.colors.semantic.primary} />
//           <View style={styles.statContent}>
//             <Caption style={styles.statLabel}>Conversion</Caption>
//             <Body style={styles.statValue}>{service.conversionRate}%</Body>
//           </View>
//         </View>

//         <View style={styles.statItem}>
//           <Eye size={14} color={designTokens.colors.semantic.accent} />
//           <View style={styles.statContent}>
//             <Caption style={styles.statLabel}>Views</Caption>
//             <Body style={styles.statValue}>{service.viewCount}</Body>
//           </View>
//         </View>
//       </View>

//       {/* Service Actions */}
//       <View style={styles.serviceActions}>
//         <View style={styles.statusToggle}>
//           <Caption style={styles.statusLabel}>
//             {service.status === 'active' ? 'Active' : 'Inactive'}
//           </Caption>
//           <Switch
//             value={service.status === 'active'}
//             onValueChange={() => toggleServiceStatus(service.id, service.status)}
//             trackColor={{
//               false: designTokens.colors.semantic.textSecondary + '40',
//               true: designTokens.colors.semantic.success + '40',
//             }}
//             thumbColor={service.status === 'active' ? designTokens.colors.semantic.success : designTokens.colors.semantic.textSecondary}
//           />
//         </View>

//         <View style={styles.actionButtons}>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => handleServiceAction(service.id, 'view')}
//           >
//             <Eye size={16} color={designTokens.colors.semantic.primary} />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => handleServiceAction(service.id, 'edit')}
//           >
//             <Edit size={16} color={designTokens.colors.semantic.primary} />
//           </TouchableOpacity>
//           <TouchableOpacity
//             style={styles.actionButton}
//             onPress={() => handleServiceAction(service.id, 'duplicate')}
//           >
//             <Copy size={16} color={designTokens.colors.semantic.primary} />
//           </TouchableOpacity>
//         </View>
//       </View>
//     </Card>
//   );
//   const FilterChip = ({
//     type,
//     label,
//     count
//   }: {
//     type: ServiceFilter;
//     label: string;
//     count: number;
//   }) => {
//     const isActive = activeFilter === type;
//     return (
//       <TouchableOpacity
//         style={[styles.filterChip, isActive && styles.filterChipActive]}
//         onPress={() => setActiveFilter(type)}
//       >
//         <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
//           {label}
//         </Text>
//         <View style={styles.filterChipBadge}>
//           <Text style={styles.filterChipBadgeText}>{count}</Text>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <RadialGradient variant="appBackground" style={styles.container}>
//       {/* Header */}
//       <SafeAreaView edges={['top']} style={styles.header}>
//         <View style={styles.headerContent}>
//           <View style={styles.titleSection}>
//             <Heading style={styles.title}>My Services</Heading>
//             <Caption style={styles.subtitle}>
//               {analytics.totalServices} service{analytics.totalServices !== 1 ? 's' : ''} • {analytics.activeServices} active
//             </Caption>
//           </View>

//           <View style={styles.headerButtons}>
//             <TouchableOpacity
//               style={styles.portfolioButton}
//               onPress={() => router.push('/supplier/portfolio')}
//             >
//               <Grid size={20} color={designTokens.colors.semantic.primary} />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.optimizationButton}
//               onPress={() => router.push('/supplier/portfolio/optimization')}
//             >
//               <Target size={20} color={designTokens.colors.semantic.primary} />
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.createButton}
//               onPress={handleCreateService}
//             >
//               <Plus size={20} color={designTokens.colors.semantic.surface} />
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Analytics Summary */}
//         {showAnalytics && (
//           <Card style={styles.analyticsCard} padding={16}>
//             <View style={styles.analyticsHeader}>
//               <Subheading style={styles.analyticsTitle}>Performance Overview</Subheading>
//               <TouchableOpacity onPress={() => setShowAnalytics(false)}>
//                 <Caption style={styles.hideAnalytics}>Hide</Caption>
//               </TouchableOpacity>
//             </View>

//             <View style={styles.analyticsGrid}>
//               <View style={styles.analyticItem}>
//                 <BarChart3 size={16} color={designTokens.colors.semantic.primary} />
//                 <View style={styles.analyticContent}>
//                   <Body style={styles.analyticValue}>{analytics.totalBookings}</Body>
//                   <Caption style={styles.analyticLabel}>Total Bookings</Caption>
//                 </View>
//               </View>

//               <View style={styles.analyticItem}>
//                 <DollarSign size={16} color={designTokens.colors.semantic.success} />
//                 <View style={styles.analyticContent}>
//                   <Body style={styles.analyticValue}>{formatCurrency(analytics.totalRevenue)}</Body>
//                   <Caption style={styles.analyticLabel}>Total Revenue</Caption>
//                 </View>
//               </View>

//               <View style={styles.analyticItem}>
//                 <Star size={16} color="#FFD700" />
//                 <View style={styles.analyticContent}>
//                   <Body style={styles.analyticValue}>{analytics.avgRating}</Body>
//                   <Caption style={styles.analyticLabel}>Avg Rating</Caption>
//                 </View>
//               </View>

//               <View style={styles.analyticItem}>
//                 <Users size={16} color={designTokens.colors.semantic.accent} />
//                 <View style={styles.analyticContent}>
//                   <Body style={styles.analyticValue}>{analytics.totalReviews}</Body>
//                   <Caption style={styles.analyticLabel}>Total Reviews</Caption>
//                 </View>
//               </View>
//             </View>
//           </Card>
//         )}

//         {/* Filters */}
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           style={styles.filtersContainer}
//           contentContainerStyle={styles.filtersContent}
//         >
//           <FilterChip type="all" label="All" count={mockSupplierServices.length} />
//           <FilterChip type="active" label="Active" count={getActiveServices().length} />
//           <FilterChip type="inactive" label="Inactive" count={mockSupplierServices.filter(s => s.status === 'inactive').length} />
//           <FilterChip type="draft" label="Draft" count={mockSupplierServices.filter(s => s.status === 'draft').length} />
//         </ScrollView>
//       </SafeAreaView>

//       {/* Content */}
//       <ScrollView
//         style={styles.content}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor={designTokens.colors.semantic.primary}
//             colors={[designTokens.colors.semantic.primary]}
//           />
//         }
//       >
//         {filteredServices.length > 0 ? (
//           filteredServices.map((service) => (
//             <ServiceCard key={service.id} service={service} />
//           ))
//         ) : (
//           <View style={styles.emptyState}>
//             <Plus size={64} color={designTokens.colors.semantic.textSecondary} />
//             <Subheading style={styles.emptyStateTitle}>No services found</Subheading>
//             <Body style={styles.emptyStateText}>
//               {activeFilter === 'all'
//                 ? "You haven't created any services yet. Tap the + button to create your first service."
//                 : `No ${activeFilter} services found. Try adjusting your filter.`
//               }
//             </Body>
//             {activeFilter === 'all' && (
//               <Button
//                 title="Create Your First Service"
//                 onPress={handleCreateService}
//                 style={styles.emptyStateButton}
//               />
//             )}
//           </View>
//         )}
//       </ScrollView>
//     </RadialGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   header: {
//     backgroundColor: 'transparent',
//     paddingHorizontal: designTokens.spacing.scale.md,
//     paddingBottom: designTokens.spacing.scale.sm,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: designTokens.spacing.scale.md,
//   },
//   titleSection: {
//     flex: 1,
//   },
//   title: {
//     marginBottom: designTokens.spacing.scale.xs,
//   },
//   subtitle: {
//     color: designTokens.colors.semantic.textSecondary,
//   },
//   headerButtons: {
//     flexDirection: 'row',
//     gap: designTokens.spacing.scale.xs,
//   },
//   portfolioButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: designTokens.colors.semantic.surface,
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...componentTokens.card.shadow,
//   },
//   optimizationButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: designTokens.colors.semantic.surface,
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...componentTokens.card.shadow,
//   },
//   createButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: designTokens.colors.semantic.primary,
//     justifyContent: 'center',
//     alignItems: 'center',
//     ...componentTokens.card.shadow,
//   },
//   analyticsCard: {
//     marginBottom: designTokens.spacing.scale.md,
//   },
//   analyticsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: designTokens.spacing.scale.md,
//   },
//   analyticsTitle: {
//     flex: 1,
//   },
//   hideAnalytics: {
//     color: designTokens.colors.semantic.primary,
//   },
//   analyticsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: designTokens.spacing.scale.sm,
//   },
//   analyticItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: designTokens.colors.semantic.surface + '80',
//     padding: designTokens.spacing.scale.sm,
//     borderRadius: componentTokens.card.borderRadius,
//     flex: 1,
//     minWidth: '45%',
//   },
//   analyticContent: {
//     marginLeft: designTokens.spacing.scale.sm,
//     flex: 1,
//   },
//   analyticValue: {
//     fontWeight: '600',
//     marginBottom: 2,
//   },
//   analyticLabel: {
//     color: designTokens.colors.semantic.textSecondary,
//   },
//   filtersContainer: {
//     marginBottom: designTokens.spacing.scale.sm,
//   },
//   filtersContent: {
//     paddingRight: designTokens.spacing.scale.md,
//   },
//   filterChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: designTokens.colors.semantic.surface,
//     paddingHorizontal: designTokens.spacing.scale.md,
//     paddingVertical: designTokens.spacing.scale.sm,
//     borderRadius: 20,
//     marginRight: designTokens.spacing.scale.sm,
//     ...componentTokens.card.shadow,
//   },
//   filterChipActive: {
//     backgroundColor: designTokens.colors.semantic.primary,
//   },
//   filterChipText: {
//     color: designTokens.colors.semantic.text,
//     fontWeight: '500',
//     marginRight: designTokens.spacing.scale.xs,
//   },
//   filterChipTextActive: {
//     color: designTokens.colors.semantic.surface,
//   },
//   filterChipBadge: {
//     backgroundColor: designTokens.colors.semantic.accent,
//     borderRadius: 10,
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//   },
//   filterChipBadgeText: {
//     color: designTokens.colors.semantic.surface,
//     fontSize: 10,
//     fontWeight: '600',
//   },
//   content: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: designTokens.spacing.scale.md,
//     paddingTop: 0,
//   },
//   serviceCard: {
//     marginBottom: designTokens.spacing.scale.md,
//   },
//   serviceHeader: {
//     flexDirection: 'row',
//     marginBottom: designTokens.spacing.scale.md,
//   },
//   serviceImageContainer: {
//     position: 'relative',
//     marginRight: designTokens.spacing.scale.md,
//   },
//   servicePlaceholderImage: {
//     width: 60,
//     height: 60,
//     borderRadius: componentTokens.card.borderRadius,
//     backgroundColor: designTokens.colors.semantic.surface + '80',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   serviceImageText: {
//     fontSize: 24,
//   },
//   statusIndicator: {
//     position: 'absolute',
//     top: -2,
//     right: -2,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: designTokens.colors.semantic.surface,
//   },
//   serviceInfo: {
//     flex: 1,
//   },
//   serviceTitleRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: designTokens.spacing.scale.xs,
//   },
//   serviceName: {
//     flex: 1,
//     marginRight: designTokens.spacing.scale.sm,
//   },
//   moreButton: {
//     padding: designTokens.spacing.scale.xs,
//   },
//   serviceCategory: {
//     color: designTokens.colors.semantic.textSecondary,
//     marginBottom: designTokens.spacing.scale.sm,
//   },
//   serviceMetrics: {
//     flexDirection: 'row',
//     gap: designTokens.spacing.scale.md,
//   },
//   metricItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   metricText: {
//     marginLeft: designTokens.spacing.scale.xs,
//     color: designTokens.colors.semantic.textSecondary,
//   },
//   serviceStats: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: designTokens.spacing.scale.md,
//     paddingVertical: designTokens.spacing.scale.sm,
//     borderTopWidth: 1,
//     borderBottomWidth: 1,
//     borderColor: designTokens.colors.semantic.border,
//   },
//   statItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   statContent: {
//     marginLeft: designTokens.spacing.scale.xs,
//   },
//   statLabel: {
//     color: designTokens.colors.semantic.textSecondary,
//     marginBottom: 2,
//   },
//   statValue: {
//     fontWeight: '600',
//   },
//   serviceActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   statusToggle: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusLabel: {
//     marginRight: designTokens.spacing.scale.sm,
//     color: designTokens.colors.semantic.textSecondary,
//   },
//   actionButtons: {
//     flexDirection: 'row',
//     gap: designTokens.spacing.scale.sm,
//   },
//   actionButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: designTokens.colors.semantic.surface + '80',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   emptyState: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: designTokens.spacing.scale.xl * 2,
//   },
//   emptyStateTitle: {
//     marginTop: designTokens.spacing.scale.md,
//     marginBottom: designTokens.spacing.scale.sm,
//     textAlign: 'center',
//   },
//   emptyStateText: {
//     textAlign: 'center',
//     color: designTokens.colors.semantic.textSecondary,
//     paddingHorizontal: designTokens.spacing.scale.lg,
//     marginBottom: designTokens.spacing.scale.lg,
//   },
//   emptyStateButton: {
//     alignSelf: 'center',
//   },
// });

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designTokens, componentTokens } from '@/constants/design-tokens';
import { ArrowLeft, Save, Plus, X } from 'lucide-react-native';
import { useExperiences, useCreateExperience, ExperienceCreateRequest, Experience } from '@/app/api/companion/experience';
import { useAuthStore } from '@/stores/auth-store';

type NewExperienceForm = Omit<ExperienceCreateRequest, 'durationMinutes'> & { durationMinutes: string };

export default function EditServices() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const companionId = user?.id;

  // Fetch experiences
  const { data, isLoading, error, refetch } = useExperiences(companionId || '');
  const experiences: Experience[] = data?.data?.items || [];
  // logger.log('COMPANION ID:', companionId);
  // logger.log('EXPERIENCE DATA:', data);
  // logger.log('EXPERIENCES ARRAY:', experiences);

  // Add experience mutation
  const createExperience = useCreateExperience(companionId || '');

  // Form state for new experience
  const [newExperience, setNewExperience] = useState<NewExperienceForm>({
    title: '',
    description: '',
    durationMinutes: '',
    keywords: [],
    price: 0,
    currency: 'THB',
    is_active: true,
  });

  const handleAddExperience = async () => {
    if (!newExperience.title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }
    if (!newExperience.description || newExperience.description.trim().length < 10) {
      Alert.alert('Validation Error', 'Description must be at least 10 characters');
      return;
    }
    if (!newExperience.price || newExperience.price <= 0) {
      Alert.alert('Validation Error', 'Price must be greater than 0');
      return;
    }
    if (!newExperience.durationMinutes || parseInt(newExperience.durationMinutes) <= 0) {
      Alert.alert('Validation Error', 'Duration must be greater than 0');
      return;
    }
    if (!newExperience.currency || newExperience.currency.trim().length < 2) {
      Alert.alert('Validation Error', 'Currency is required');
      return;
    }
    try {
      await createExperience.mutateAsync({
        ...newExperience,
        durationMinutes: parseInt(newExperience.durationMinutes) || 60,
      });
      setNewExperience({ title: '', description: '', durationMinutes: '', keywords: [], price: 0, currency: 'THB', is_active: true });
      refetch();
      Alert.alert('Success', 'Experience added successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to add experience');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Experiences</Text>
        <View style={{width: 44}} />

      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Loading/Error States */}
          {isLoading && <Text>Loading experiences...</Text>}
          {error && <Text style={{ color: 'red' }}>Failed to load experiences</Text>}
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Experiences</Text>
            {experiences.map((exp: Experience) => (
              <View key={exp.id} style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceTitle}>{exp.title}</Text>
                  {/* Add delete/edit buttons if needed */}
                </View>
                <Text style={styles.serviceDescription}>{exp.description}</Text>
                <View style={styles.serviceDetails}>
                  <Text style={styles.servicePrice}>฿{exp.price}</Text>
                  <Text style={styles.serviceDuration}>{Math.round(exp.durationMinutes / 60)}h</Text>
                </View>
              </View>
            ))}
          </View>
          {/* Add New Experience */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add New Experience</Text>
            <View style={styles.addServiceCard}>
              <TextInput
                style={styles.input}
                placeholder="Experience title"
                value={newExperience.title}
                onChangeText={(text) => setNewExperience({ ...newExperience, title: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Experience description"
                value={newExperience.description}
                onChangeText={(text) => setNewExperience({ ...newExperience, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Price (฿)"
                  value={newExperience.price ? String(newExperience.price) : ''}
                  onChangeText={(text) => setNewExperience({ ...newExperience, price: parseInt(text) || 0 })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Duration (minutes)"
                  value={newExperience.durationMinutes}
                  onChangeText={(text) => setNewExperience({ ...newExperience, durationMinutes: text })}
                  keyboardType="numeric"
                  placeholderTextColor={designTokens.colors.components.input.placeholder}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Keywords (comma separated)"
                value={newExperience.keywords.join(', ')}
                onChangeText={(text) => setNewExperience({ ...newExperience, keywords: text.split(',').map(k => k.trim()).filter(Boolean) })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TextInput
                style={styles.input}
                placeholder="Currency (e.g. THB)"
                value={newExperience.currency}
                onChangeText={(text) => setNewExperience({ ...newExperience, currency: text })}
                placeholderTextColor={designTokens.colors.components.input.placeholder}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddExperience} disabled={createExperience.isPending}>
                {createExperience.isPending ? (
                  <ActivityIndicator size="small" color={designTokens.colors.components.button.text} />
                ) : (
                  <>
                <Plus size={20} color={designTokens.colors.components.button.text} />
                    <Text style={styles.addButtonText}>Add Experience</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.scale.lg,
    paddingVertical: designTokens.spacing.scale.md,
    backgroundColor: designTokens.colors.semantic.surface,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
    marginTop: 40,
  },
  backButton: {
    padding: designTokens.spacing.scale.sm,
  },
  headerTitle: {
    ...componentTokens.text.subheading,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.scale.xs,
  },
  saveText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  content: {
    flex: 1,
    padding: designTokens.spacing.scale.lg,
  },
  section: {
    marginBottom: designTokens.spacing.scale.xl,
  },
  sectionTitle: {
    ...componentTokens.text.subheading,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceCard: {
    ...componentTokens.card.default,
    marginBottom: designTokens.spacing.scale.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceTitle: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.semibold,
    flex: 1,
  },
  removeButton: {
    padding: designTokens.spacing.scale.xs,
  },
  serviceDescription: {
    ...componentTokens.text.caption,
    marginBottom: designTokens.spacing.scale.sm,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.primary,
    fontWeight: designTokens.typography.weights.semibold,
  },
  serviceDuration: {
    ...componentTokens.text.caption,
  },
  addServiceCard: {
    ...componentTokens.card.default,
  },
  input: {
    ...designTokens.typography.styles.body,
    backgroundColor: designTokens.colors.components.input.background,
    borderWidth: 1,
    borderColor: designTokens.colors.components.input.border,
    borderRadius: designTokens.borderRadius.components.input,
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.scale.md,
  },
  halfInput: {
    flex: 1,
  },
  addButton: {
    ...componentTokens.button.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.scale.sm,
    marginTop: designTokens.spacing.scale.sm,
  },
  addButtonText: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.components.button.text,
    fontWeight: designTokens.typography.weights.semibold,
  },
});
