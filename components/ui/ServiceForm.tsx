import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Service } from '@/types/supplier';
import { X } from 'lucide-react-native';

interface ServiceFormProps {
  initialService?: Omit<Service, 'id'>;
  onSubmit: (service: Omit<Service, 'id'>) => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  initialService,
  onSubmit,
  onCancel,
}) => {
  const [service, setService] = useState<Omit<Service, 'id'>>({
    name: initialService?.name || '',
    description: initialService?.description || '',
    price: initialService?.price || 0,
    duration: initialService?.duration || 1,
    isActive: initialService?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof Omit<Service, 'id'>, value: any) => {
    setService(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!service.name.trim()) {
      newErrors.name = 'Service name is required';
    }
    
    if (!service.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (service.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (service.duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(service);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {initialService ? 'Edit Service' : 'Add New Service'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <X size={24} color={colors.darkGray} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Service Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={service.name}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="e.g. Bangkok City Tour"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={service.description}
            onChangeText={(text) => handleChange('description', text)}
            placeholder="Describe what's included in this service"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>
        
        <View style={styles.row}>
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Price (THB)</Text>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              value={service.price.toString()}
              onChangeText={(text) => {
                const numValue = text ? parseInt(text.replace(/[^0-9]/g, '')) : 0;
                handleChange('price', numValue);
              }}
              keyboardType="numeric"
              placeholder="0"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>
          
          <View style={[styles.formGroup, styles.halfWidth]}>
            <Text style={styles.label}>Duration (hours)</Text>
            <TextInput
              style={[styles.input, errors.duration && styles.inputError]}
              value={service.duration.toString()}
              onChangeText={(text) => {
                const numValue = text ? parseInt(text.replace(/[^0-9]/g, '')) : 0;
                handleChange('duration', numValue);
              }}
              keyboardType="numeric"
              placeholder="1"
            />
            {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Active</Text>
            <TouchableOpacity
              style={[
                styles.switch,
                service.isActive ? styles.switchActive : styles.switchInactive,
              ]}
              onPress={() => handleChange('isActive', !service.isActive)}
            >
              <View
                style={[
                  styles.switchThumb,
                  service.isActive ? styles.switchThumbActive : styles.switchThumbInactive,
                ]}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.switchHelp}>
            {service.isActive
              ? 'This service will be visible to customers'
              : 'This service will be hidden from customers'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Cancel"
          onPress={onCancel}
          variant="outline"
          style={styles.cancelButton}
        />
        <Button
          title={initialService ? 'Save Changes' : 'Add Service'}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.darkText,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.darkText,
    backgroundColor: colors.lightBackground,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.darkText,
    backgroundColor: colors.lightBackground,
    minHeight: 100,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  switchInactive: {
    backgroundColor: colors.lightGray,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  switchThumbInactive: {
    transform: [{ translateX: 0 }],
  },
  switchHelp: {
    fontSize: 12,
    color: colors.darkGray,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});