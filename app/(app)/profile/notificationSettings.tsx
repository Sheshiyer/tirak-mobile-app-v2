import { StyleSheet, Text, View, Switch, SafeAreaView, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { designTokens } from "@/constants/design-tokens";
import { RadialGradient } from "@/components/ui/RadialGradient";
import { router } from "expo-router";
import { ArrowLeft, Bell, Mail, Smartphone } from "lucide-react-native";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/app/api/notifications/notifications';

const NotificationSettings = () => {
  const { data } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  
  const [push, setPush] = useState(false);
  const [email, setEmail] = useState(false);
  const [sms, setSms] = useState(false);

  useEffect(() => {
    const preferences = data?.data?.preferences;
    if (!preferences) return;
    setPush(preferences.push);
    setEmail(preferences.email);
    setSms(preferences.sms);
  }, [data]);

  const updatePreference = (key: 'push' | 'email' | 'sms', value: boolean) => {
    if (key === 'push') setPush(value);
    if (key === 'email') setEmail(value);
    if (key === 'sms') setSms(value);

    updatePreferences.mutate(
      { [key]: value },
      {
        onError: () => {
          if (key === 'push') setPush(!value);
          if (key === 'email') setEmail(!value);
          if (key === 'sms') setSms(!value);
        },
      }
    );
  };

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={designTokens.colors.semantic.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
       <View style={{width: 40}} />
      </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <View style={styles.settingIcon}>
              <Smartphone size={20} color={designTokens.colors.semantic.warning} />
            </View>
            <Text style={styles.label}>Push alerts</Text>
          </View>
          <Switch
            value={push}
            onValueChange={(val) => updatePreference('push', val)}
            trackColor={{
              false: designTokens.colors.semantic.border,
              true: designTokens.colors.semantic.primary,
            }}
            thumbColor={push
              ? designTokens.colors.semantic.background
              : designTokens.colors.semantic.surface}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <View style={styles.settingIcon}>
              <Mail size={20} color={designTokens.colors.semantic.warning} />
            </View>
            <Text style={styles.label}>Email alerts</Text>
          </View>
          <Switch
            value={email}
            onValueChange={(val) => updatePreference('email', val)}
            trackColor={{
              false: designTokens.colors.semantic.border,
              true: designTokens.colors.semantic.primary,
            }}
            thumbColor={email
              ? designTokens.colors.semantic.background
              : designTokens.colors.semantic.surface}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <View style={styles.settingIcon}>
              <Bell size={20} color={designTokens.colors.semantic.primary} />
            </View>
            <Text style={styles.label}>SMS reminders</Text>
          </View>
          <Switch
            value={sms}
            onValueChange={(val) => updatePreference('sms', val)}
            trackColor={{
              false: designTokens.colors.semantic.border,
              true: designTokens.colors.semantic.primary,
            }}
            thumbColor={sms
              ? designTokens.colors.semantic.background
              : designTokens.colors.semantic.surface}
          />
        </View>
      </SafeAreaView>
    </RadialGradient>
  );
};

export default NotificationSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: designTokens.colors.semantic.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },  
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 32,
    color: designTokens.colors.semantic.text,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.semantic.border,
  },
  settingLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
});
