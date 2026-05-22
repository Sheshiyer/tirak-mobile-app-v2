import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Edit2, Trash2 } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ServiceForm } from '@/components/ui/ServiceForm';
import { useSupplierStore } from '@/stores/supplier-store';
import { Service } from '@/types/supplier';

export default function ServicesScreen() {
  const router = useRouter();
  const { signupData, updateSignupData } = useSupplierStore();
  
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Omit<Service, 'id'> | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const handleAddService = () => {
    setEditingService(null);
    setEditingIndex(null);
    setModalVisible(true);
  };
  
  const handleEditService = (index: number) => {
    setEditingService({ ...signupData.services[index] });
    setEditingIndex(index);
    setModalVisible(true);
  };
  
  const handleDeleteService = (index: number) => {
    const newServices = [...signupData.services];
    newServices.splice(index, 1);
    updateSignupData({ services: newServices });
  };
  
  const handleSubmitService = (service: Omit<Service, 'id'>) => {
    if (editingIndex !== null) {
      // Update existing service
      const newServices = [...signupData.services];
      newServices[editingIndex] = {
        ...service,
        id: signupData.services[editingIndex].id,
      };
      updateSignupData({ services: newServices });
    } else {
      // Add new service
      const newService = {
        ...service,
        id: `service-${Date.now()}`,
      };
      updateSignupData({ services: [...signupData.services, newService] });
    }
    
    setModalVisible(false);
    setError(null);
  };
  
  const validate = () => {
    if (signupData.services.length === 0) {
      setError('Please add at least one service');
      return false;
    }
    
    setError(null);
    return true;
  };
  
  const handleNext = () => {
    if (validate()) {
      updateSignupData({ step: 6 });
      router.push('/supplier/signup/regions');
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US');
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Services & Pricing</Text>
          <Text style={styles.subtitle}>
            Define the services you offer and set your pricing. You can add multiple services.
          </Text>
          
          <ProgressBar
            currentStep={6}
            totalSteps={8}
          />
        </View>
        
        <View style={styles.form}>
          <View style={styles.servicesHeader}>
            <Text style={styles.servicesTitle}>Your Services</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddService}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
          
          {signupData.services.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No services added yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add Service" to define what you offer to customers
              </Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {signupData.services.map((service, index) => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <View style={styles.serviceActions}>
                      <TouchableOpacity
                        style={styles.serviceAction}
                        onPress={() => handleEditService(index)}
                      >
                        <Edit2 size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.serviceAction}
                        onPress={() => handleDeleteService(index)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.serviceDescription}>
                    {service.description}
                  </Text>
                  
                  <View style={styles.serviceDetails}>
                    <View style={styles.serviceDetail}>
                      <Text style={styles.serviceDetailLabel}>Price</Text>
                      <Text style={styles.serviceDetailValue}>
                        ฿{formatPrice(service.price)}
                      </Text>
                    </View>
                    
                    <View style={styles.serviceDetail}>
                      <Text style={styles.serviceDetailLabel}>Duration</Text>
                      <Text style={styles.serviceDetailValue}>
                        {service.duration} {service.duration === 1 ? 'hour' : 'hours'}
                      </Text>
                    </View>
                    
                    <View style={styles.serviceDetail}>
                      <Text style={styles.serviceDetailLabel}>Status</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          service.isActive
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            service.isActive
                              ? styles.statusActiveText
                              : styles.statusInactiveText,
                          ]}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Tips for setting services:</Text>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Be clear about what's included in each service</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Set competitive prices based on your experience and the market</Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipBullet} />
              <Text style={styles.tipText}>Consider offering different service tiers or packages</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.actions}>
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
          <Button
            title="Next"
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ServiceForm
              initialService={editingService || undefined}
              onSubmit={handleSubmitService}
              onCancel={() => setModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 22,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  servicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  servicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    padding: 32,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.darkGray,
    textAlign: 'center',
  },
  servicesList: {
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkText,
    flex: 1,
  },
  serviceActions: {
    flexDirection: 'row',
  },
  serviceAction: {
    padding: 6,
    marginLeft: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceDetail: {
    flex: 1,
  },
  serviceDetailLabel: {
    fontSize: 12,
    color: colors.darkGray,
    marginBottom: 4,
  },
  serviceDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: colors.successLight,
  },
  statusInactive: {
    backgroundColor: colors.errorLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusActiveText: {
    color: colors.success,
  },
  statusInactiveText: {
    color: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  infoContainer: {
    marginTop: 16,
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  tipText: {
    fontSize: 14,
    color: colors.darkGray,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
});