import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MapPin, Navigation, Clock, Star } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BookingStepFooter } from "../BookingStepFooter";
import { FormField } from "@/components/ui/FormField";
import { useBookingStore, BookingLocation } from "@/stores/booking-store";
import { designTokens, componentTokens } from "@/constants/design-tokens";
import { useTranslation } from "react-i18next";

interface LocationSelectionStepProps {
  onNext: () => void;
  onPrevious: () => void;
}

// Mock popular locations data




export const LocationSelectionStep: React.FC<LocationSelectionStepProps> = ({
  onNext,
  onPrevious,
}) => {

  const { t } = useTranslation();

  const POPULAR_AREAS = [
    {
      id: "bangkok",
      name: t('Thailand Cities & Meeting Hotspots.0.city'),
      // description: "Shopping, dining, and nightlife district",
      // estimatedDistance: 5.2,
      // travelTime: 15,
      // popularity: 4.8,
    },
    {
      id: "chiang_mai",
      name: t('Thailand Cities & Meeting Hotspots.1.city'),
      // description: "Business district with street food",
      // estimatedDistance: 7.1,
      // travelTime: 20,
      // popularity: 4.6,
    },
    {
      id: "phuket",
      name: t('Thailand Cities & Meeting Hotspots.2.city'),
      // description: "Weekend market and park area",
      // estimatedDistance: 12.3,
      // travelTime: 35,
      // popularity: 4.9,
    },
    {
      id: "pattaya",
      name: t('Thailand Cities & Meeting Hotspots.3.city'),
      // description: "Backpacker area with local culture",
      // estimatedDistance: 8.7,
      // travelTime: 25,
      // popularity: 4.4,
    },
    {
      id: "koh_samui",
      name: t('Thailand Cities & Meeting Hotspots.4.city'),
      // description: "Trendy area with cafes and galleries",
      // estimatedDistance: 6.8,
      // travelTime: 18,
      // popularity: 4.7,
    },
    {
      id: "krabi",
      name: t('Thailand Cities & Meeting Hotspots.5.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "hua_hin",
      name: t('Thailand Cities & Meeting Hotspots.6.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "udon_thani",
      name: t('Thailand Cities & Meeting Hotspots.7.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "khon_kaen",
      name: t('Thailand Cities & Meeting Hotspots.8.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "surat_thani",
      name: t('Thailand Cities & Meeting Hotspots.9.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "hat_yai",
      name: t('Thailand Cities & Meeting Hotspots.10.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "nakhon_ratchasima",
      name: t('Thailand Cities & Meeting Hotspots.11.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "ayutthaya",
      name: t('Thailand Cities & Meeting Hotspots.12.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "rayong",
      name: t('Thailand Cities & Meeting Hotspots.13.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "chonburi",
      name: t('Thailand Cities & Meeting Hotspots.14.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
    {
      id: "nakhon_sithammarat",
      name: t('Thailand Cities & Meeting Hotspots.15.city'),
      // description: "Historic temples and royal palace",
      // estimatedDistance: 9.5,
      // travelTime: 30,
      // popularity: 4.9,
    },
  ];

  const POPULAR_MEETING_POINTS = {
    bangkok: [
      t('Thailand Cities & Meeting Hotspots.0.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.0.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.0.hotspots.2'),
    ],
    chiang_mai: [
      t('Thailand Cities & Meeting Hotspots.1.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.1.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.1.hotspots.2'),
    ],
    phuket: [
      t('Thailand Cities & Meeting Hotspots.2.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.2.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.2.hotspots.2'),
    ],
    pattaya: [
     t('Thailand Cities & Meeting Hotspots.3.hotspots.0'),
     t('Thailand Cities & Meeting Hotspots.3.hotspots.1'),
     t('Thailand Cities & Meeting Hotspots.3.hotspots.2'),
    ],
    koh_samui: [
     t('Thailand Cities & Meeting Hotspots.4.hotspots.0'),
     t('Thailand Cities & Meeting Hotspots.4.hotspots.1'),
     t('Thailand Cities & Meeting Hotspots.4.hotspots.2'),
    ],
    krabi: [
      t('Thailand Cities & Meeting Hotspots.5.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.5.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.5.hotspots.2'),
    ],
    hua_hin: [
      t('Thailand Cities & Meeting Hotspots.6.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.6.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.6.hotspots.2'),
    ],
    udon_thani: [
      t('Thailand Cities & Meeting Hotspots.7.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.7.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.7.hotspots.2'),
    ],
    khon_kaen: [
     t('Thailand Cities & Meeting Hotspots.8.hotspots.0'),
     t('Thailand Cities & Meeting Hotspots.8.hotspots.1'),
     t('Thailand Cities & Meeting Hotspots.8.hotspots.2'),
    ],
    surat_thani: [
     t('Thailand Cities & Meeting Hotspots.9.hotspots.0'),
    t('Thailand Cities & Meeting Hotspots.9.hotspots.1'),
    t('Thailand Cities & Meeting Hotspots.9.hotspots.2'),
    ],
    hat_yai: [
     t('Thailand Cities & Meeting Hotspots.10.hotspots.0'),
     t('Thailand Cities & Meeting Hotspots.10.hotspots.1'),
     t('Thailand Cities & Meeting Hotspots.10.hotspots.2'),
    ],
    nakhon_ratchasima: [
     t('Thailand Cities & Meeting Hotspots.11.hotspots.0'),
     t('Thailand Cities & Meeting Hotspots.11.hotspots.1'),
     t('Thailand Cities & Meeting Hotspots.11.hotspots.2'),
    ],
    ayutthaya: [
      t('Thailand Cities & Meeting Hotspots.12.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.12.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.12.hotspots.2'),
    ],
    rayong: [
      t('Thailand Cities & Meeting Hotspots.13.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.13.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.13.hotspots.2'),
    ],
    chonburi: [
      t('Thailand Cities & Meeting Hotspots.14.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.14.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.14.hotspots.2'),
    ],
    nakhon_sithammarat: [
      t('Thailand Cities & Meeting Hotspots.15.hotspots.0'),
      t('Thailand Cities & Meeting Hotspots.15.hotspots.1'),
      t('Thailand Cities & Meeting Hotspots.15.hotspots.2'),
    ]
  };
  const { bookingData, updateLocation } = useBookingStore();
  const getAreaIdFromPersistedLocation = (area?: string) => {
    if (!area) return "";
    const areaMatch = POPULAR_AREAS.find(
      (item) => item.id === area || item.name === area
    );
    return areaMatch?.id || "";
  };
  
  const scrollViewRef = useRef<ScrollView>(null);
  const meetingPointRef = useRef<View>(null);
  
  const [selectedArea, setSelectedArea] = useState<string>(
    getAreaIdFromPersistedLocation(bookingData.location?.area)
  );
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>(
    bookingData.location?.meetingPoint || ""
  );
  const [customMeetingPoint, setCustomMeetingPoint] = useState<string>("");
  const [useCustomLocation, setUseCustomLocation] = useState<boolean>(false);
  const [meetingPointY, setMeetingPointY] = useState<number>(0);
  const [shouldScrollToMeetingPoint, setShouldScrollToMeetingPoint] = useState<boolean>(false);

  const handleAreaSelect = (areaId: string) => {
    setSelectedArea(areaId);
    setSelectedMeetingPoint(""); // Reset meeting point when area changes
    setUseCustomLocation(false);
    setShouldScrollToMeetingPoint(true);
  };

  // Handle scrolling when meeting point Y position is available
  useEffect(() => {
    if (shouldScrollToMeetingPoint && meetingPointY > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: meetingPointY - 100, animated: true });
        setShouldScrollToMeetingPoint(false);
      }, 150);
    }
  }, [meetingPointY, shouldScrollToMeetingPoint]);

  const handleMeetingPointSelect = (meetingPoint: string) => {
    setSelectedMeetingPoint(meetingPoint);
    setUseCustomLocation(false);
    setCustomMeetingPoint("");
  };

  const handleCustomMeetingPoint = () => {
    setUseCustomLocation(true);
    setSelectedMeetingPoint("");
  };

  const handleNext = () => {
    const finalMeetingPoint = useCustomLocation
      ? customMeetingPoint
      : selectedMeetingPoint;

    if (!selectedArea || (!finalMeetingPoint && !useCustomLocation)) {
      Alert.alert(
        t('meetingPointSelection.selectionRequired'),
        t('meetingPointSelection.selectionRequiredDescription')
      );
      return;
    }

    if (useCustomLocation && !customMeetingPoint.trim()) {
      Alert.alert(
        t('meetingPointSelection.meetingPointRequired'),
        t('meetingPointSelection.meetingPointRequiredDescription')
      );
      return;
    }

    const selectedAreaData = POPULAR_AREAS.find(
      (area) => area.id === selectedArea
    );

    const locationData: BookingLocation = {
      area: selectedAreaData?.name || selectedArea,
      meetingPoint: finalMeetingPoint,
      // estimatedDistance: selectedAreaData?.estimatedDistance,
      // travelTime: selectedAreaData?.travelTime,
    };

    updateLocation(locationData);
    onNext();
  };

  const AreaCard: React.FC<{ area: (typeof POPULAR_AREAS)[0] }> = ({
    area,
  }) => {
    const isSelected = selectedArea === area.id;

    return (
      <TouchableOpacity
        style={[styles.areaCard, isSelected && styles.selectedAreaCard]}
        onPress={() => handleAreaSelect(area.id)}
      >
        <View style={styles.areaHeader}>
          <View style={styles.areaInfo}>
            <Text style={styles.areaName}>{area.name}</Text>
            {/* <Text style={styles.areaDescription}>{area.description}</Text> */}
          </View>
          <View style={styles.areaStats}>
            {/* <View style={styles.statRow}>
              <Navigation
                size={14}
                color={designTokens.colors.semantic.textSecondary}
              />
              <Text style={styles.statText}>{area.estimatedDistance} km</Text>
            </View> */}
            {/* <View style={styles.statRow}>
              <Clock
                size={14}
                color={designTokens.colors.semantic.textSecondary}
              />
              <Text style={styles.statText}>{area.travelTime} min</Text>
            </View>
            <View style={styles.statRow}>
              <Star size={14} color={designTokens.colors.semantic.accent} />
              <Text style={styles.statText}>{area.popularity}</Text>
            </View> */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('meetingPointSelection.whereShallWeMeet')}</Text>
          <Text style={styles.subtitle}>
            {t('meetingPointSelection.chooseAnAreaAndSpecificMeetingPoint')}
          </Text>
        </View>

        {/* Area Selection */}
        <Card style={styles.sectionCard} padding={16}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={designTokens.colors.semantic.primary} />
            <Text style={styles.sectionTitle}>{t('meetingPointSelection.chooseArea')}</Text>
          </View>

          <View style={styles.areasContainer}>
            {POPULAR_AREAS.map((area) => (
              <AreaCard key={area.id} area={area} />
            ))}
          </View>
        </Card>

        {/* Meeting Point Selection */}
        {selectedArea && (
          <View 
            ref={meetingPointRef}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              setMeetingPointY(y);
            }}
          >
            <Card style={styles.sectionCard} padding={16}>
              <View style={styles.sectionHeader}>
                <Navigation
                  size={20}
                  color={designTokens.colors.semantic.primary}
                />
                <Text style={styles.sectionTitle}>{t('meetingPointSelection.meetingPoint')}</Text>
              </View>

            <Text style={styles.sectionSubtitle}>
              {t('meetingPointSelection.popularMeetingPoints')}{' '}
              {POPULAR_AREAS.find((a) => a.id === selectedArea)?.name}
            </Text>

            <View style={styles.meetingPointsContainer}>
              {POPULAR_MEETING_POINTS[
                selectedArea as keyof typeof POPULAR_MEETING_POINTS
              ]?.map((point, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.meetingPointOption,
                    selectedMeetingPoint === point &&
                      styles.selectedMeetingPointOption,
                  ]}
                  onPress={() => handleMeetingPointSelect(point)}
                >
                  <Text
                    style={[
                      styles.meetingPointText,
                      selectedMeetingPoint === point &&
                        styles.selectedMeetingPointText,
                    ]}
                  >
                    {point}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.meetingPointOption,
                  styles.customMeetingPointOption,
                  useCustomLocation && styles.selectedMeetingPointOption,
                ]}
                onPress={handleCustomMeetingPoint}
              >
                <Text
                  style={[
                    styles.meetingPointText,
                    styles.customMeetingPointText,
                    useCustomLocation && styles.selectedMeetingPointText,
                  ]}
                >
                  + {t('meetingPointSelection.customLocation')}
                </Text>
              </TouchableOpacity>
            </View>

            {useCustomLocation && (
              <View style={styles.customLocationContainer}>
                <FormField
                  label={t('meetingPointSelection.customLocation')}
                  placeholder="Enter specific address or landmark..."
                  value={customMeetingPoint}
                  onChangeText={setCustomMeetingPoint}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.customLocationNote}>
                  💡 {t('meetingPointSelection.customLocationNote')}

                </Text>
              </View>
            )}
            </Card>
          </View>
        )}

        {/* Location Summary */}
        {selectedArea &&
          (selectedMeetingPoint ||
            (useCustomLocation && customMeetingPoint)) && (
            <Card style={styles.sectionCard} padding={16}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>{t('meetingPointSelection.meetingDetails')}</Text>
              </View>

              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('meetingPointSelection.area')}:</Text>
                  <Text style={styles.summaryValue}>
                    {POPULAR_AREAS.find((a) => a.id === selectedArea)?.name}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('meetingPointSelection.meetingPoint')}:</Text>
                  <Text style={styles.summaryValue}>
                    {useCustomLocation
                      ? customMeetingPoint
                      : selectedMeetingPoint}
                  </Text>
                </View>
                {/* {!useCustomLocation && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('meetingPointSelection.distance')}:</Text>
                      <Text style={styles.summaryValue}>
                        ~
                        {
                          POPULAR_AREAS.find((a) => a.id === selectedArea)
                            ?.estimatedDistance
                        }{" "}
                        km
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('meetingPointSelection.travelTime')}:</Text>
                      <Text style={styles.summaryValue}>
                        ~
                        {
                          POPULAR_AREAS.find((a) => a.id === selectedArea)
                            ?.travelTime
                        }{" "}
                        {t('meetingPointSelection.minutes')}
                      </Text>
                    </View>
                  </>
                )} */}
              </View>
            </Card>
          )}
      </ScrollView>

      <BookingStepFooter
        onPrevious={onPrevious}
        onNext={handleNext}
        nextTitle={t('meetingPointSelection.continue')}
        nextDisabled={
          !selectedArea || (!selectedMeetingPoint && !useCustomLocation)
        }
        showPrevious={true}
        showNext={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designTokens.colors.semantic.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: designTokens.spacing.scale.lg,
  },
  header: {
    paddingVertical: designTokens.spacing.scale.xl,
    alignItems: "center",
  },
  title: {
    ...designTokens.typography.styles.heading,
    color: designTokens.colors.semantic.text,
    textAlign: "center",
    marginBottom: designTokens.spacing.scale.sm,
  },
  subtitle: {
    ...designTokens.typography.styles.body,
    color: designTokens.colors.semantic.textSecondary,
    textAlign: "center",
    lineHeight:
      designTokens.typography.lineHeights.normal *
      designTokens.typography.sizes.body,
  },
  sectionCard: {
    marginBottom: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.card,
    ...designTokens.shadows.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.scale.sm,
    marginBottom: designTokens.spacing.scale.md,
  },
  sectionTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
  },
  sectionSubtitle: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    marginBottom: designTokens.spacing.scale.md,
    lineHeight:
      designTokens.typography.lineHeights.normal *
      designTokens.typography.sizes.caption,
  },
  areasContainer: {
    gap: designTokens.spacing.scale.sm,
  },
  areaCard: {
    padding: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    ...designTokens.shadows.sm,
  },
  selectedAreaCard: {
    borderColor: designTokens.colors.semantic.primary,
    // backgroundColor: designTokens.colors.semantic.primary + "10",
    ...designTokens.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  areaInfo: {
    flex: 1,
    marginRight: designTokens.spacing.scale.md,
  },
  areaName: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    marginBottom: designTokens.spacing.scale.xs,
    fontSize: designTokens.typography.sizes.body,
  },
  areaDescription: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    lineHeight:
      designTokens.typography.lineHeights.normal *
      designTokens.typography.sizes.caption,
  },
  areaStats: {
    alignItems: "flex-end",
    gap: designTokens.spacing.scale.xs,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.scale.xs,
  },
  statText: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontWeight: designTokens.typography.weights.medium,
    fontSize: designTokens.typography.sizes.small,
  },
  meetingPointsContainer: {
    gap: designTokens.spacing.scale.sm,
  },
  meetingPointOption: {
    paddingVertical: designTokens.spacing.scale.md,
    paddingHorizontal: designTokens.spacing.scale.lg,
    borderRadius: designTokens.borderRadius.components.button,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.border,
    backgroundColor: designTokens.colors.semantic.surface,
    minHeight: 44, // Accessibility touch target
    justifyContent: "center",
    ...designTokens.shadows.sm,
  },
  selectedMeetingPointOption: {
    borderColor: designTokens.colors.semantic.primary,
    backgroundColor: designTokens.colors.semantic.primary,
    ...designTokens.shadows.md,
    transform: [{ scale: 1.02 }],
  },
  customMeetingPointOption: {
    borderStyle: "dashed",
    borderColor: designTokens.colors.semantic.accent,
  },
  meetingPointText: {
    ...designTokens.typography.styles.body,
    fontWeight: designTokens.typography.weights.medium,
    color: designTokens.colors.semantic.text,
    textAlign: "center",
  },
  selectedMeetingPointText: {
    color: designTokens.colors.semantic.surface,
  },
  customMeetingPointText: {
    color: designTokens.colors.semantic.accent,
  },
  customLocationContainer: {
    marginTop: designTokens.spacing.scale.md,
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.accent + "10",
    borderRadius: designTokens.borderRadius.components.card,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.accent + "20",
  },
  customLocationNote: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    fontStyle: "italic",
    marginTop: designTokens.spacing.scale.sm,
    lineHeight:
      designTokens.typography.lineHeights.normal *
      designTokens.typography.sizes.caption,
  },
  summaryHeader: {
    marginBottom: designTokens.spacing.scale.md,
  },
  summaryTitle: {
    ...designTokens.typography.styles.subheading,
    color: designTokens.colors.semantic.text,
    fontSize: designTokens.typography.sizes.body,
  },
  summaryContent: {
    backgroundColor: designTokens.colors.semantic.primary + "10",
    borderRadius: designTokens.borderRadius.components.card,
    padding: designTokens.spacing.scale.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.primary + "20",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: designTokens.spacing.scale.sm,
  },
  summaryLabel: {
    ...designTokens.typography.styles.caption,
    color: designTokens.colors.semantic.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...designTokens.typography.styles.caption,
    fontWeight: designTokens.typography.weights.semibold,
    color: designTokens.colors.semantic.text,
    flex: 2,
    textAlign: "right",
  },
  footer: {
    padding: designTokens.spacing.scale.lg,
    backgroundColor: designTokens.colors.semantic.surface,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.semantic.border,
    ...designTokens.shadows.sm,
  },
  footerButtons: {
    flexDirection: "row",
    gap: designTokens.spacing.scale.md,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
