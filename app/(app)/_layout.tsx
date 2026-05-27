import { logger } from '@/utils/logger';
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  ColorValue,
  Alert,
} from "react-native";
import { Tabs, router, usePathname } from "expo-router";
import { useAuthStoreHydrated } from "@/hooks/useAuthStoreHydrated";
import { designTokens } from "@/constants/design-tokens";
import * as Icons from "lucide-react-native";
import { ProfileImage } from "@/components/ui/ProfileImage";
import { RadialGradient } from "@/components/ui/RadialGradient";
import { AnimatedTabBar } from "@/components/ui/AnimatedTabBar";
import { LinearGradient } from "expo-linear-gradient";
import { useNotifications } from "@/app/api/notifications/notifications";
import { useTranslation } from 'react-i18next';
import { SoundManager } from '@/utils/sound-manager';
import { registerForBookingPushNotifications } from '@/utils/booking-notifications';

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.8;

// Define tab configuration
const TAB_ROUTES = [
  { name: "index", label: "Home", icon: { name: "Home" } },
  { name: "search", label: "Explore", icon: { name: "Search" } },
  { name: "bookings", label: "Bookings", icon: { name: "Calendar" } },
  { name: "messages", label: "Messages", icon: { name: "MessageCircle" } },
  { name: "favorites", label: "Favorites", icon: { name: "Heart" } },
];

// Custom Header Component for Role-Based UI
const CustomHeader = ({
  isCompanion = false,
  onMenuPress,
  onNotificationPress,
  currentRoute,
  unreadCount,
  t,
}: {
  isCompanion: boolean;
  onMenuPress: () => void;
  onNotificationPress: () => void;
  currentRoute: string;
  unreadCount: number | undefined;
  t: (key: string) => string;
}) => {
  const getHeaderConfig = () => {
    if (isCompanion) {
      return {
        title: t('customHeader.culturalGuideDashboard'),
        icon: Icons.Award, // ✅ use icon component reference
        gradientColors: [
          designTokens.colors.semantic.primary,
          designTokens.colors.semantic.primary,
        ],
        accentColor: designTokens.colors.semantic.accent,
      };
    } else {
      return {
        title: t('customHeader.discoverThailand'),
        icon: Icons.Globe, // ✅ use icon component reference
        gradientColors: [
          designTokens.colors.semantic.primary,
          designTokens.colors.semantic.secondary,
        ],
        accentColor: designTokens.colors.semantic.accent,
      };
    }
  };

  const config = getHeaderConfig();
  const Icon = config.icon;

  return (
    <LinearGradient
      colors={config.gradientColors as [ColorValue, ColorValue]}
      style={styles.customHeader}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.headerButton} onPress={onMenuPress}>
          <Icons.Menu size={24} color={designTokens.colors.semantic.surface} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Icon size={20} color={designTokens.colors.semantic.accent} />
            <Text style={styles.headerTitle}>{config.title}</Text>
          </View>

          {/* <View
            style={[styles.roleBadge, { backgroundColor: config.accentColor }]}
          >
            <Text style={styles.roleBadgeText}>
              {isCompanion ? t('customHeader.localGuide') : t('customHeader.traveler')}
            </Text>
          </View> */}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={onNotificationPress}
        >
          <Icons.Bell size={24} color={designTokens.colors.semantic.surface} />
          {Number(unreadCount) > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default function AppLayout() {
  const { t } = useTranslation();
  const { isHydrated, user, logout } = useAuthStoreHydrated();
  const isCompanion =
    user?.userType === "companion" || user?.userType === "supplier";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnimation = useRef(new Animated.Value(0)).current;
  const pathname = usePathname();
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: errorNotifications,
  } = useNotifications();
  const unreadCount = notificationsData?.data?.unreadCount;

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/auth');
    }
  }, [isHydrated, user]);

  useEffect(() => {
    if (isHydrated && user) {
      registerForBookingPushNotifications(user).catch((error) => {
        logger.warn('[AppLayout] Failed to register for push notifications:', error);
      });
    }
  }, [isHydrated, user?.id]);

  // logger.log("notifications", notificationsData, unreadCount);

  // Update tab routes based on user role with professional terminology
  const getTabRoutes = () => {
    if (isCompanion) {
      return [
        { name: "index", label: t('customHeader.dashboard'), icon: { name: "Home" } },
        { name: "bookings", label: t('customHeader.bookings'), icon: { name: "Calendar" } },
        { name: "messages", label: t('customHeader.clients'), icon: { name: "MessageCircle" } },
      ];
    } else {
      return [
        { name: "index", label: t('customHeader.discover'), icon: { name: "Home" } },
        { name: "search", label: t('customHeader.explore'), icon: { name: "Search" } },
        { name: "bookings", label: t('customHeader.myTrips'), icon: { name: "Calendar" } },
        { name: "messages", label: t('customHeader.guides'), icon: { name: "MessageCircle" } },
        { name: "favorites", label: t('customHeader.wishlist'), icon: { name: "Heart" } },
      ];
    }
  };

  const currentTabRoutes = getTabRoutes();

  // Get current tab index
  const getCurrentTabIndex = () => {
    const currentRoute = pathname.split("/").pop() || "index";
    const index = currentTabRoutes.findIndex(
      (tab) => tab.name === currentRoute
    );
    return index >= 0 ? index : 0;
  };

  const [activeTabIndex, setActiveTabIndex] = useState(getCurrentTabIndex());

  // Update active tab when pathname changes
  useEffect(() => {
    const newIndex = getCurrentTabIndex();
    setActiveTabIndex(newIndex);
  }, [pathname, currentTabRoutes]);

  const toggleDrawer = () => {
    if (drawerOpen) {
      // Close drawer
      Animated.timing(drawerAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setDrawerOpen(false));
    } else {
      // Open drawer
      setDrawerOpen(true);
      Animated.timing(drawerAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const drawerTranslateX = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const overlayOpacity = drawerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleLogout = useCallback(() => {
    // Close drawer first
    toggleDrawer();

    // Use setTimeout to prevent useInsertionEffect warnings
    const performLogout = async () => {
      await SoundManager.unloadAll();
      await logout();
      
      // On web, force a page reload to ensure complete cleanup
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      } else {
        router.replace("/auth");
      }
    };

    // Web-compatible confirmation
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`${t('customHeader.logout')}\n\n${t('customHeader.logoutDescription')}`);
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(t('customHeader.logout'), t('customHeader.logoutDescription'), [
        { text: t('customHeader.cancel'), style: "cancel" },
        { text: t('customHeader.logout'), onPress: performLogout },
      ]);
    }
  }, [logout, router, t, toggleDrawer]);

  const handleTabPress = (index: number) => {
    setActiveTabIndex(index);
    const route = currentTabRoutes[index];
    if (route.name === "index") {
      router.push("/");
    } else {
      router.push(`/${route.name}` as any);
    }
  };

  const handleProfileEdit = () => {
    toggleDrawer();
    router.push("/profile/edit");
  };

  const navigateTo = (route: string) => {
    toggleDrawer();
    router.push(route as any);
  };

  const renderDrawer = () => {
    if (!drawerOpen) return null;

    return (
      <>
        <Animated.View
          style={[styles.overlay, { opacity: overlayOpacity }]}
          pointerEvents={drawerOpen ? "auto" : "none"}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={toggleDrawer}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { transform: [{ translateX: drawerTranslateX }] },
          ]}
        >
          <RadialGradient variant="drawer" style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={toggleDrawer}
              >
                <Icons.X size={24} color={designTokens.colors.semantic.surface} />
              </TouchableOpacity>

              <View style={styles.profileSection}>
                <TouchableOpacity onPress={handleProfileEdit}>
                  <ProfileImage
                    uri={user?.profileImage}
                    size={80}
                    editable={true}
                    onEdit={handleProfileEdit}
                    online={true}
                  />
                </TouchableOpacity>
                <Text style={styles.userName}>
                  {user?.name || "Guest User"}
                </Text>
                <Text style={styles.userPhone}>
                  {user?.phone || "+66 XX XXX XXXX"}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.menuItems}>
              {/* Role-specific header */}
              <View style={styles.roleHeader}>
                <View style={styles.roleIndicator}>
                  {isCompanion ? (
                    <Icons.Briefcase
                      size={18}
                      color={designTokens.colors.semantic.accent}
                    />
                  ) : (
                    <Icons.MapPin
                      size={18}
                      color={designTokens.colors.semantic.accent}
                    />
                  )}
                  <Text style={styles.roleText}>
                    {isCompanion ? t('customHeader.culturalGuide') : t('customHeader.thailandExplorer')}
                  </Text>
                </View>
              </View>

              {/* <TouchableOpacity
                style={styles.menuItem}
                onPress={handleProfileEdit}
              >
                <User size={22} color={designTokens.colors.semantic.surface} />
                <Text style={styles.menuItemText}>
                  {isCompanion ? 'Guide Profile' : 'Traveler Profile'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/messages')}
              >
                <MessageCircle size={22} color={designTokens.colors.semantic.surface} />
                <Text style={styles.menuItemText}>
                  {isCompanion ? 'Client Messages' : 'Guide Communications'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/bookings')}
              >
                <Calendar size={22} color={designTokens.colors.semantic.surface} />
                <Text style={styles.menuItemText}>
                  {isCompanion ? 'Service Bookings' : 'My Cultural Experiences'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/settings')}
              >
                <Shield size={22} color={designTokens.colors.semantic.surface} />
                <Text style={styles.menuItemText}>Trust & Safety</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo('/settings')}
              >
                <HelpCircle size={22} color={designTokens.colors.semantic.surface} />
                <Text style={styles.menuItemText}>Tourism Support</Text>
              </TouchableOpacity> */}

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigateTo("/settings")}
              >
                <Icons.Settings
                  size={22}
                  color={designTokens.colors.semantic.surface}
                />
                <Text style={styles.menuItemText}>{t('customHeader.appSettings')}</Text>
              </TouchableOpacity>
              

              <View style={styles.divider} />

              

              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Icons.LogOut
                  size={22}
                  color={designTokens.colors.semantic.surface}
                />
                <Text style={styles.menuItemText}>{t('customHeader.logout')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </RadialGradient>
        </Animated.View>
      </>
    );
  };

  // Show loading state while hydrating to prevent useInsertionEffect warnings
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <RadialGradient variant="primary" style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </RadialGradient>
      </View>
    );
  }

  // Show loading state for unauthenticated users to prevent flash
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <RadialGradient variant="primary" style={styles.loadingContent}>
          <Text style={styles.loadingText}>Signing out...</Text>
        </RadialGradient>
      </View>
    );
  }

  return (
    <>
      {/* Custom Header */}
      <CustomHeader
        isCompanion={isCompanion}
        onMenuPress={toggleDrawer}
        onNotificationPress={() => router.push("/notifications")}
        currentRoute={pathname}
        unreadCount={unreadCount}
        t={t}
      />

      <Tabs
        screenOptions={({ route }) => ({
          tabBarStyle: { display: "none" }, // Hide default tab bar
          headerShown: false, // Use custom header instead
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: isCompanion ? t('customHeader.guideDashboard') : t('customHeader.discoverThailand'),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: isCompanion
              ? t('customHeader.serviceOpportunities')
              : t('customHeader.exploreExperiences'),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: isCompanion ? t('customHeader.clientBookings') : t('customHeader.myCulturalTrips'),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: isCompanion ? t('customHeader.clientCommunications') : t('customHeader.guideMessages'),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: isCompanion ? t('customHeader.savedOpportunities') : t('customHeader.experienceWishlist'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('customHeader.profile'),
            href: null, // Hide from tab bar - accessed via drawer
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: t('customHeader.notifications'),
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('customHeader.settings'),
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>

      {/* Custom Animated Tab Bar */}
      <AnimatedTabBar
        activeIndex={activeTabIndex}
        onTabPress={handleTabPress}
        tabs={currentTabRoutes}
      />

      {renderDrawer()}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 16,
    fontWeight: "500",
  },
  // Custom Header Styles
  customHeader: {
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: designTokens.spacing.scale.md,
    
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: designTokens.spacing.scale.xs,
  },
  headerTitle: {
    fontSize: designTokens.typography.sizes.body,
    fontWeight: "600",
    color: designTokens.colors.semantic.surface,
    marginLeft: designTokens.spacing.scale.sm,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.surface,
    opacity: 0.9,
    textAlign: "center",
    marginBottom: designTokens.spacing.scale.sm,
  },
  roleBadge: {
    paddingHorizontal: designTokens.spacing.scale.sm,
    paddingVertical: designTokens.spacing.scale.xs / 2,
    borderRadius: 20,
    backgroundColor: designTokens.colors.semantic.accent,
  },
  roleBadgeText: {
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.surface,
    fontWeight: "600",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: designTokens.colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: designTokens.colors.semantic.primary,
  },
  notificationCount: {
    color: designTokens.colors.semantic.surface,
    fontSize: 10,
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 1001,
  },
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 20,
  },
  userName: {
    color: designTokens.colors.semantic.surface,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },
  userPhone: {
    color: designTokens.colors.semantic.surface,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  roleHeader: {
    marginBottom: designTokens.spacing.scale.lg,
    paddingBottom: designTokens.spacing.scale.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: designTokens.spacing.scale.md,
    paddingVertical: designTokens.spacing.scale.sm,
    borderRadius: designTokens.borderRadius.lg,
  },
  roleText: {
    fontSize: designTokens.typography.sizes.caption,
    color: designTokens.colors.semantic.surface,
    marginLeft: designTokens.spacing.scale.sm,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuItemText: {
    color: designTokens.colors.semantic.surface,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 16,
  },
});
