import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RadialGradient } from '@/components/ui/RadialGradient';
import { designTokens } from '@/constants/design-tokens';
import { ArrowLeft } from 'lucide-react-native';

const PRIVACY_POLICY = `Last updated: May 2026

**1. Introduction**
Tirak ("we", "us", or "our") is a cultural travel experiences marketplace that connects travellers with verified local guides in Thailand. We are committed to protecting your privacy and handling your personal data responsibly.

**2. Information We Collect**
- Account information: name, email address, phone number
- Profile information: bio, profile photos, languages spoken, areas of expertise
- Usage data: searches, bookings, messages, and interactions within the app
- Device information: device type, operating system, app version
- Location: only when you explicitly grant permission, and only for guide location tags

**3. How We Use Your Information**
- To operate and improve the Tirak platform
- To match travellers with appropriate local guides
- To process bookings and facilitate communications
- To send booking confirmations and service updates
- To ensure platform safety and prevent fraud
- To comply with legal obligations

**4. Information Sharing**
We do not sell your personal data. We share information only:
- Between travellers and guides as needed to facilitate bookings and communication
- With service providers who help us operate the platform (e.g., cloud hosting via Cloudflare)
- If required by law or to protect user safety

**5. Data Retention**
We retain your account data for as long as your account is active. You may request deletion of your account at any time from Settings → Delete Account. Deleted accounts are anonymised within 30 days.

**6. Your Rights**
You have the right to access, correct, or delete your personal data. Contact us at support@tirak.app for any data requests.

**7. Security**
We use industry-standard encryption (TLS) for all data in transit. Passwords are hashed using bcrypt. We do not store payment card details.

**8. Children**
Tirak is not intended for users under 18 years of age.

**9. Contact**
For privacy concerns, contact: support@tirak.app`;

const TERMS_OF_SERVICE = `Last updated: May 2026

**1. Acceptance of Terms**
By using the Tirak app, you agree to these Terms of Service. If you do not agree, please do not use the app.

**2. What Tirak Is**
Tirak is a cultural travel experiences marketplace that connects international travellers with verified local guides and experience hosts in Thailand. All guides are independent contractors, not Tirak employees.

**3. Permitted Uses**
Tirak is a platform for:
- Booking cultural tours, day trips, and local experiences
- Language practice and cultural exchange sessions
- Guided exploration of food, arts, and traditions
- Business travel assistance and local introductions

**4. Prohibited Uses**
You must not use Tirak to:
- Arrange any sexual services or adult entertainment
- Engage in any illegal activities under Thai law
- Harass, intimidate, or harm other users
- Create fake accounts or provide false information
- Solicit personal contact information to bypass the platform

**5. Guide Verification**
Guides undergo identity verification before being listed. However, Tirak does not guarantee guide qualifications beyond stated information. Use your judgement and communicate clearly before booking.

**6. Bookings and Payment**
Bookings are confirmed once accepted by the guide. Payment terms are agreed directly between traveller and guide, facilitated through the platform. Tirak is not responsible for payment disputes between parties.

**7. Cancellations**
Cancellation policies are set by individual guides. Review the guide's policy before booking.

**8. Safety**
Your safety is our priority. If you feel unsafe or witness inappropriate behaviour, use the in-app Report function or contact us immediately at safety@tirak.app.

**9. Limitation of Liability**
Tirak provides a marketplace platform and is not liable for the actions of guides or travellers, or for any direct, indirect, or consequential damages arising from use of the platform.

**10. Governing Law**
These terms are governed by the laws of Thailand.

**11. Contact**
Questions? Email us at: support@tirak.app`;

export default function LegalScreen() {
  const { type } = useLocalSearchParams<{ type?: 'privacy' | 'terms' }>();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(type || 'privacy');

  const content = activeTab === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  const title = activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

  const renderContent = (text: string) =>
    text.split('\n').map((line, index) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <Text key={index} style={styles.sectionTitle}>
            {line.replace(/\*\*/g, '')}
          </Text>
        );
      }
      if (line.trim() === '') {
        return <View key={index} style={styles.spacer} />;
      }
      return (
        <Text key={index} style={styles.bodyText}>
          {line}
        </Text>
      );
    });

  return (
    <RadialGradient variant="appBackground" style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={designTokens.colors.semantic.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent(content)}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Tirak. All rights reserved.</Text>
          <Text style={styles.footerText}>support@tirak.app</Text>
        </View>
      </ScrollView>
    </RadialGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: designTokens.colors.semantic.text,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: designTokens.colors.semantic.border + '40',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: designTokens.colors.semantic.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: designTokens.colors.semantic.textSecondary,
  },
  activeTabText: {
    color: designTokens.colors.semantic.primary,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: designTokens.colors.semantic.text,
    marginTop: 20,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight: 22,
  },
  spacer: { height: 8 },
  footer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: designTokens.colors.semantic.textSecondary,
  },
});
