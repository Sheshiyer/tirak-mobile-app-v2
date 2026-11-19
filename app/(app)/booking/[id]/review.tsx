import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useBookingQuery } from "@/services/api/booking/booking";
import { useAuthStore } from "@/stores/auth-store";
import { createReview } from "@/services/api/reviews/reviews";
import { designTokens } from "@/constants/design-tokens";

export default function BookingReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  // A different account or booking starts a new form, including any pending outcome.
  const scope = `${isAuthenticated ? user?.id : "signed-out"}:${user?.userType || "unknown"}:${typeof id === "string" ? id : ""}`;
  return (
    <ScopedBookingReview
      key={scope}
      bookingId={typeof id === "string" ? id : ""}
    />
  );
}
function ScopedBookingReview({ bookingId: id }: { bookingId: string }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const query = useBookingQuery(typeof id === "string" ? id : "");
  const client = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState<"submitted" | "already" | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const booking =
    query.data?.success === true && query.data.data.booking.id === id
      ? query.data.data.booking
      : undefined;
  const eligible =
    isAuthenticated &&
    user?.userType === "customer" &&
    booking?.status === "completed" &&
    booking.customerId === user.id &&
    !!booking.companionId;
  const submit = async () => {
    if (
      !mounted.current ||
      pending.current ||
      !eligible ||
      !booking ||
      rating === null ||
      comment.length > 1000 ||
      outcome
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await createReview({
        bookingId: booking.id,
        companionId: booking.companionId,
        rating,
        comment: comment.trim(),
      });
      if (mounted.current) setOutcome("submitted");
      // Submission is acknowledged before cache refresh; a refresh failure must not invite a duplicate review.
      await Promise.allSettled([
        client.invalidateQueries({ queryKey: ["reviews"] }),
        client.invalidateQueries({
          queryKey: ["companion", booking.companionId],
        }),
        client.invalidateQueries({ queryKey: ["companions"] }),
        client.invalidateQueries({ queryKey: ["booking", booking.id] }),
      ]);
    } catch (failure: any) {
      if (!mounted.current) return;
      if (failure?.response?.status === 409) setOutcome("already");
      else setError("Unable to submit your review. Please try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to booking"
          disabled={busy}
          onPress={() => router.back()}
        >
          <Text style={styles.link}>Back to booking</Text>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={styles.title}>
          Review your experience
        </Text>
        {query.isLoading ? (
          <Text>Loading booking…</Text>
        ) : query.error ? (
          <View>
            <Text accessibilityRole="alert">Unable to load your booking.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Retry loading booking"
              onPress={() => query.refetch()}
            >
              <Text style={styles.link}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : outcome ? (
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite">
            {outcome === "submitted"
              ? "Thank you. Your review was submitted."
              : "This booking has already been reviewed."}
          </Text>
        ) : !eligible ? (
          <Text>
            Reviews are available only to the traveler who completed this
            booking.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>
              {booking?.companion?.name || "Your guide"}
            </Text>
            <Text style={styles.body}>Choose your rating</Text>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel="Experience rating"
              style={styles.ratings}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${value} ${value === 1 ? "star" : "stars"}`}
                  accessibilityState={{
                    checked: rating === value,
                    disabled: busy,
                  }}
                  disabled={busy}
                  onPress={() => setRating(value)}
                  style={[styles.rating, rating === value && styles.selected]}
                >
                  <Text>{value} ★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.body}>Your review (optional)</Text>
            <TextInput
              accessibilityLabel="Your review"
              multiline
              maxLength={1000}
              editable={!busy}
              value={comment}
              onChangeText={setComment}
              style={styles.input}
            />
            <Text>{comment.length}/1000 characters</Text>
            {error ? (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
                style={styles.error}
              >
                {error}
              </Text>
            ) : null}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={
                error ? "Retry submitting review" : "Submit review"
              }
              accessibilityState={{ disabled: busy || rating === null, busy }}
              disabled={busy || rating === null}
              onPress={submit}
              style={[
                styles.submit,
                (busy || rating === null) && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.submitText}>
                {busy ? "Submitting…" : error ? "Try again" : "Submit review"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: designTokens.colors.semantic.background,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    minWidth: 0,
    gap: 18,
    padding: 16,
    borderRadius: 24,
    backgroundColor: designTokens.colors.semantic.surface,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: designTokens.colors.semantic.text,
  },
  body: { fontSize: 16, color: designTokens.colors.semantic.text },
  link: {
    fontSize: 16,
    color: designTokens.colors.semantic.primary,
    paddingVertical: 12,
  },
  ratings: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rating: {
    minWidth: 56,
    minHeight: 48,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.textSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    backgroundColor: "#eadbff",
    borderColor: designTokens.colors.semantic.primary,
  },
  input: {
    width: "100%",
    minWidth: 0,
    minHeight: 120,
    borderWidth: 1,
    borderColor: designTokens.colors.semantic.textSecondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: designTokens.colors.semantic.text,
  },
  error: { color: designTokens.colors.semantic.error },
  submit: {
    minHeight: 48,
    padding: 14,
    borderRadius: 12,
    backgroundColor: designTokens.colors.semantic.primary,
  },
  submitText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
