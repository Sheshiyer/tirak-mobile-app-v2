import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ColorValue,
  Image,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { Logo } from "@/components/ui/Logo";
import { SimpleInput } from "@/components/ui/SimpleInput";
import { Button } from "@/components/ui/Button";
import { designTokens } from "@/constants/design-tokens";
import { ArrowLeft, Calendar, ChevronDown } from "lucide-react-native";
import { UserRole } from "@/types/auth";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth-store";
import { AccountConsentFields } from '@/components/AccountConsentFields';
import { POLICY_VERSION } from '@/utils/account-consent';
import { formatLocalDate, latestAdultBirthDate, NATIVE_BIRTH_DATE_MINIMUM, parseLocalDate } from '@/utils/birth-date';
import { useTranslation } from "react-i18next";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function RegisterScreen() {
  const { t } = useTranslation();
  const maximumBirthDate = latestAdultBirthDate();
  const maximumBirthDateValue = formatLocalDate(maximumBirthDate);
  const invalidPhone = t('register.contactNumberInvalid');
  const registerSchema = z.object({
    name: z.string().trim()
      .min(1, t('register.nameRequired'))
      .max(100, t('register.nameMax')),
    email: z.string().trim()
      .min(1, t('register.emailRequired'))
      .email(t('register.emailInvalid')),
    contactNumber: z.string().trim()
      .min(1, t('register.contactNumberRequired'))
      .pipe(z.string()
        .min(8, invalidPhone)
        .max(32, invalidPhone)
        .regex(/^\+?[0-9\s()-]+$/, invalidPhone)
        .refine((phone) => /[0-9]/.test(phone), invalidPhone)),
    dateOfBirth: z.string().min(1, t('register.dateRequired'))
      .pipe(z.string().date(t('register.dateInvalidCalendar')))
      .refine((date) => date <= maximumBirthDateValue, t('register.dateInvalid')),
    gender: z.string().min(1, t('register.genderRequired')),
    role: z.string().optional(),
    password: z.string()
      .min(1, t('register.passwordRequired'))
      .min(6, t('register.passwordMin'))
      .max(100, t('register.passwordMax')),
    confirmPassword: z.string().min(1, t('register.confirmPasswordRequired')),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('register.confirmPasswordMatch'),
    path: ["confirmPassword"],
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  type FormErrors = {
    [K in keyof RegisterFormData]?: string;
  };

  const { role: roleParam } = useLocalSearchParams();
  const { register, isLoading, error: authError } = useAuthStore();
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const isWeb = Platform.OS === 'web';
  
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
    role: roleParam === "companion" ? "" : undefined,
  });
  const [role, setRole] = useState<UserRole>("customer");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingBirthDate, setPendingBirthDate] = useState(maximumBirthDate);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [consentError, setConsentError] = useState<string>();

  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    
    // Cleanup animation on unmount
    return () => animation.stop();
  }, []);

  // Create a slow diagonal pan effect - memoized to prevent re-renders
  const gradientAnimation = React.useMemo(() => ({
    startX: animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
    }),
    startY: animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1],
    }),
    endX: animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
    }),
    endY: animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2],
    }),
  }), [animatedValue]);

  const handleInputChange = React.useCallback((
    field: keyof RegisterFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleDatePickerOpen = () => {
    setPendingBirthDate(parseLocalDate(formData.dateOfBirth) ?? maximumBirthDate);
    setShowDatePicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (isAndroid) {
      setShowDatePicker(false);
      if (event.type === "set" && selectedDate) {
        handleInputChange("dateOfBirth", formatLocalDate(selectedDate));
      }
    } else if (selectedDate) {
      setPendingBirthDate(selectedDate);
    }
  };

  const handleDatePickerDone = () => {
    handleInputChange("dateOfBirth", formatLocalDate(pendingBirthDate));
    setShowDatePicker(false);
  };

  // Memoized input handlers to prevent re-renders
  const handleNameChange = React.useCallback((text: string) => {
    handleInputChange("name", text);
  }, [handleInputChange]);

  const handleEmailChange = React.useCallback((text: string) => {
    handleInputChange("email", text);
  }, [handleInputChange]);

  const handleContactChange = React.useCallback((text: string) => {
    handleInputChange("contactNumber", text);
  }, [handleInputChange]);

  const handlePasswordChange = React.useCallback((text: string) => {
    handleInputChange("password", text);
  }, [handleInputChange]);

  const handleConfirmPasswordChange = React.useCallback((text: string) => {
    handleInputChange("confirmPassword", text);
  }, [handleInputChange]);

  const genderOptions = [
    { label: t('register.male'), value: "male" },
    { label: t('register.female'), value: "female" },
    { label: t('register.other'), value: "other" },
  ];

  const roleOptions = [
    { label: t('register.supplier'), value: "supplier" },
    { label: t('register.companion'), value: "companion" },
  ];

  const handleRegister = async () => {
    const result = registerSchema.safeParse(formData);
    if (!acceptedPolicies) {
      setConsentError('Please read and accept the Terms of Service and Privacy Policy before creating your account.');
      return;
    }
    if (result.success) {
      let actualUserType: "customer" | "companion" | "supplier";
      if (roleParam === "companion") {
        actualUserType = "companion";
      } else {
        actualUserType = "customer";
      }
      try {
        await register(
          result.data.name,
          result.data.email,
          result.data.password,
          actualUserType,
          result.data.contactNumber,
          result.data.dateOfBirth,
          result.data.gender,
          { policyAcceptance: { termsVersion: POLICY_VERSION, privacyVersion: POLICY_VERSION }, marketingOptIn, analyticsOptIn }
        );
        router.replace('/auth/verify-email');
      } catch (err) {
        console.error('Registration error:', err);
      }
    } else {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof RegisterFormData] = err.message;
        }
      });
      setErrors(fieldErrors);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      enabled={Platform.OS === "ios"}
    >
      <LinearGradient
        colors={[
          `${designTokens.colors.semantic.primary}70`,
          `${designTokens.colors.reference.lightPink}60`,
          `${designTokens.colors.semantic.secondary}70`,
          `${designTokens.colors.reference.lightPink}60`,
          `${designTokens.colors.semantic.primary}70`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, isAndroid && { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isAndroid && { paddingTop: Math.max(24, 60 - insets.top) }]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.backButton, isAndroid && { top: Math.max(16, 50 - insets.top) }]}
            onPress={handleBack}
          >
            <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
          </TouchableOpacity>
          
          <View style={styles.header}>
            <Image
              source={require("@/assets/images/tirak.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>{t('register.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('register.joinTirakToday')}</Text>
          </View>
          
          <View style={styles.form}>
            {authError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{authError}</Text>
              </View>
            )}
            
            <SimpleInput
              label={t('register.fullName')}
              placeholder={t('register.fullNamePlaceholder')}
              value={formData.name}
              onChangeText={handleNameChange}
              error={errors.name}
            />
            
            <SimpleInput
              label={t('register.email')}
              placeholder={t('register.emailPlaceholder')}
              value={formData.email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            
            <SimpleInput
              label={t('register.contactNumber')}
              placeholder={t('register.contactNumberPlaceholder')}
              value={formData.contactNumber}
              onChangeText={handleContactChange}
              keyboardType="phone-pad"
              autoComplete="tel"
              helperText={t('register.contactNumberHint')}
              error={errors.contactNumber}
            />

            <Text style={styles.datePickerLabel}>{t('register.dateOfBirth')}</Text>

            {isWeb ? (
              <input
                aria-label={t('register.dateOfBirth')}
                aria-invalid={!!errors.dateOfBirth}
                aria-describedby={errors.dateOfBirth ? 'register-birth-date-error' : undefined}
                type="date"
                autoComplete="bday"
                max={maximumBirthDateValue}
                value={formData.dateOfBirth}
                onInput={event => handleInputChange("dateOfBirth", event.currentTarget.value)}
                onChange={event => handleInputChange("dateOfBirth", event.currentTarget.value)}
                style={{
                  boxSizing: 'border-box',
                  width: '100%',
                  minHeight: 48,
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  border: `1px solid ${designTokens.colors.semantic.border}`,
                  borderRadius: 12,
                  color: designTokens.colors.semantic.text,
                  backgroundColor: designTokens.colors.semantic.surface,
                }}
              />
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('register.dateOfBirth')}
                accessibilityValue={{ text: formData.dateOfBirth || t('register.dateRequired') }}
                style={styles.datePickerButton}
                onPress={handleDatePickerOpen}
              >
                <View style={styles.datePickerContent}>
                  <View style={styles.datePickerValue}>
                    <Text style={styles.datePickerText}>
                      {parseLocalDate(formData.dateOfBirth)?.toLocaleDateString() ?? t('register.dateRequired')}
                    </Text>
                    <Calendar size={20} color={designTokens.colors.semantic.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}
            {errors.dateOfBirth && (
              <Text nativeID="register-birth-date-error" accessibilityRole="alert" style={styles.fieldError}>
                {errors.dateOfBirth}
              </Text>
            )}

            {showDatePicker && Platform.OS === "ios" && (
              <View style={styles.datePickerModal}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={handleDatePickerDone}>
                    <Text style={styles.datePickerDoneButton}>{t('register.done')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={pendingBirthDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={NATIVE_BIRTH_DATE_MINIMUM}
                  maximumDate={maximumBirthDate}
                  style={styles.datePickerIOS}
                />
              </View>
            )}
            {showDatePicker && isAndroid && (
              <DateTimePicker
                value={pendingBirthDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={NATIVE_BIRTH_DATE_MINIMUM}
                maximumDate={maximumBirthDate}
              />
            )}
            <Text style={styles.genderPickerLabel}>{t('register.gender')}</Text>
            <TouchableOpacity
              style={styles.genderPickerButton}
              onPress={() => setShowGenderPicker(!showGenderPicker)}
            >
              <View style={styles.genderPickerContent}>
                <View style={styles.genderPickerValue}>
                  <Text style={styles.genderPickerText}>
                    {formData.gender
                      ? genderOptions.find((g) => g.value === formData.gender)
                          ?.label
                      : t('register.selectGender')}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={designTokens.colors.semantic.primary}
                  />
                </View>
              </View>
              {errors.gender && (
                <Text style={styles.fieldError}>{errors.gender}</Text>
              )}
            </TouchableOpacity>

            {showGenderPicker && (
              <View style={styles.genderOptions}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.genderOption}
                    onPress={() => {
                      handleInputChange("gender", option.value);
                      setShowGenderPicker(false);
                    }}
                  >
                    <Text style={styles.genderOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* {roleParam === "companion" && (
              <>
            <Text style={styles.genderPickerLabel}>{t('register.typeOfAccount')}</Text>
            <TouchableOpacity
              style={styles.genderPickerButton}
              onPress={() => setShowRolePicker(!showRolePicker)}
            >
              <View style={styles.genderPickerContent}>
                <View style={styles.genderPickerValue}>
                  <Text style={styles.genderPickerText}>
                    {formData.role
                      ? roleOptions.find((g) => g.value === formData.role)
                          ?.label
                      : t('register.selectType')}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={designTokens.colors.semantic.primary}
                  />
                </View>
              </View>
              {errors.role && (
                <Text style={styles.fieldError}>{errors.role}</Text>
                )}
              </TouchableOpacity>
              </>
            )} */}
            {showRolePicker && (
              <View style={styles.genderOptions}>
                {roleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.genderOption}
                    onPress={() => {
                      handleInputChange("role", option.value);
                      setShowRolePicker(false);
                    }}
                  >
                    <Text style={styles.genderOptionText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <SimpleInput
              label={t('register.password')}
              placeholder={t('register.passwordPlaceholder')}
              value={formData.password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              error={errors.password}
            />
            
            <SimpleInput
              label={t('register.confirmPassword')}
              placeholder={t('register.confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <AccountConsentFields
              accepted={acceptedPolicies}
              marketingOptIn={marketingOptIn}
              analyticsOptIn={analyticsOptIn}
              onAcceptedChange={(value) => { setAcceptedPolicies(value); setConsentError(undefined); }}
              onMarketingChange={setMarketingOptIn}
              onAnalyticsChange={setAnalyticsOptIn}
              error={consentError}
            />
            <Button
              title={t('register.createAccount')}
              onPress={handleRegister}
              loading={isLoading}
              fullWidth
              style={styles.button}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('register.alreadyHaveAnAccount')} </Text>
            <TouchableOpacity onPress={() => router.push("/auth/login")}>
              <Text style={styles.footerLink}>{t('register.signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );


  
}

// Add this component before the RegisterScreen component

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: designTokens.colors.semantic.text,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  form: {
    width: "100%",
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: designTokens.colors.semantic.error,
    fontSize: 14,
  },
  button: {
    marginTop: 10,
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingVertical: 20,
  },
  footerText: {
    color: designTokens.colors.semantic.text,
    fontSize: 14,
  },
  footerLink: {
    color: designTokens.colors.semantic.primary,
    fontSize: 14,
    fontWeight: "500",
  },
  logo: {
    width: 100,
    height: 100,
  },
  datePickerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  datePickerContent: {
    flexDirection: "column",
  },
  datePickerLabel: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: designTokens.typography.weights.medium,
    fontSize: designTokens.typography.sizes.small,
  },
  datePickerValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  genderPickerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  genderPickerContent: {
    flexDirection: "column",
  },
  genderPickerLabel: {
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.sm,
    fontWeight: designTokens.typography.weights.medium,
    fontSize: designTokens.typography.sizes.small,
  },
  webDateInput: {
    backgroundColor: "transparent",
    padding: 16,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
    borderWidth: 0,
    outlineWidth: 0,
  },
  genderPickerValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genderPickerText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  genderOptions: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  genderOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  genderOptionText: {
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  fieldError: {
    color: designTokens.colors.semantic.error,
    fontSize: 12,
    marginTop: 4,
  },
  datePickerModal: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  datePickerDoneButton: {
    color: designTokens.colors.semantic.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerIOS: {
    backgroundColor: "transparent",
  },
  webDatePickerContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    overflow: 'hidden',
  },
  webDatePickerContent: {
    flexDirection: 'row',
    height: 200,
  },
  webDateColumn: {
    flex: 1,
  },
  webDateOption: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webDateOptionSelected: {
    backgroundColor: designTokens.colors.semantic.primary + '20',
  },
  webDateOptionText: {
    fontSize: 14,
    color: designTokens.colors.semantic.text,
  },
  webDateOptionTextSelected: {
    color: designTokens.colors.semantic.primary,
    fontWeight: '600',
  },
});
