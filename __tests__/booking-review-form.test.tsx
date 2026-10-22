import React from "react";
const Renderer = require("react-test-renderer");
const { act } = Renderer;
let mockRouteId = "authoritative-booking";
let mockUser: any;
let mockBooking: any;
let mockCreate = jest.fn();
let mockInvalidate = jest.fn().mockResolvedValue(undefined);
jest.mock("react-native", () => ({
  Platform: { OS: "web", select: (x: any) => x.web ?? x.default },
  StyleSheet: { create: (x: any) => x },
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  TouchableOpacity: "TouchableOpacity",
  TextInput: "TextInput",
}));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: mockRouteId, companionId: "untrusted" }),
  useRouter: () => ({ back: jest.fn() }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));
jest.mock("../stores/auth-store", () => ({
  useAuthStore: () => ({ user: mockUser, isAuthenticated: true }),
}));
jest.mock("../services/api/booking/booking", () => ({
  useBookingQuery: () => ({
    data: { success: true, data: { booking: mockBooking } },
    isLoading: false,
    error: null,
  }),
}));
jest.mock("../services/api/reviews/reviews", () => ({
  createReview: (x: any) => mockCreate(x),
}));
import Screen from "../app/(app)/booking/[id]/review";
let tree: any;
const button = (label: string) =>
  tree.root
    .findAllByType("TouchableOpacity")
    .find((n: any) => n.props.accessibilityLabel === label);
beforeEach(() => {
  mockRouteId = "authoritative-booking";
  mockUser = { id: "traveler", userType: "customer" };
  mockBooking = {
    id: "authoritative-booking",
    companionId: "guide",
    customerId: "traveler",
    status: "completed",
    companion: { name: "Guide" },
  };
  mockCreate = jest.fn().mockResolvedValue(undefined);
  mockInvalidate.mockClear();
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
});
const render = async () => {
  await act(async () => {
    tree = Renderer.create(<Screen />);
  });
};
const rate = async () => {
  await act(async () => button("4 stars").props.onPress());
};
it("starts unrated and submits authoritative booking IDs once with cache refresh", async () => {
  await render();
  expect(button("Submit review").props.disabled).toBe(true);
  expect(
    tree.root
      .findAllByType("TouchableOpacity")
      .filter((n: any) => n.props.accessibilityRole === "radio")
      .every((n: any) => !n.props.accessibilityState.checked),
  ).toBe(true);
  await rate();
  await act(async () => button("Submit review").props.onPress());
  expect(mockCreate).toHaveBeenCalledWith({
    bookingId: "authoritative-booking",
    companionId: "guide",
    rating: 4,
    comment: "",
  });
  expect(mockInvalidate).toHaveBeenCalledWith({
    queryKey: ["companion", "guide"],
  });
  expect(button("Submit review")).toBeUndefined();
});
it.each(["supplier", "companion"])("gates guide role %s", async (role) => {
  mockUser.userType = role;
  await render();
  expect(button("Submit review")).toBeUndefined();
});
it.each(["pending", "confirmed", "cancelled"])(
  "gates status %s",
  async (status) => {
    mockBooking.status = status;
    await render();
    expect(button("Submit review")).toBeUndefined();
  },
);
it("gates a booking belonging to another traveler", async () => {
  mockBooking.customerId = "other";
  await render();
  expect(button("Submit review")).toBeUndefined();
});
it("preserves input and retries a failed submission", async () => {
  mockCreate.mockRejectedValueOnce(new Error("offline"));
  await render();
  await rate();
  await act(async () =>
    tree.root.findByType("TextInput").props.onChangeText("Good walk"),
  );
  await act(async () => button("Submit review").props.onPress());
  expect(tree.root.findByType("TextInput").props.value).toBe("Good walk");
  await act(async () => button("Retry submitting review").props.onPress());
  expect(mockCreate).toHaveBeenCalledTimes(2);
});
it("handles an already reviewed conflict without another submit", async () => {
  mockCreate.mockRejectedValue({ response: { status: 409 } });
  await render();
  await rate();
  await act(async () => button("Submit review").props.onPress());
  expect(button("Retry submitting review")).toBeUndefined();
  expect(
    tree.root
      .findAllByType("Text")
      .some(
        (n: any) =>
          n.props.children === "This booking has already been reviewed.",
      ),
  ).toBe(true);
});
it("guards rapid duplicate submits and limits the comment input", async () => {
  let finish: any;
  mockCreate.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  await render();
  expect(tree.root.findByType("TextInput").props.maxLength).toBe(1000);
  await rate();
  const press = button("Submit review").props.onPress;
  await act(async () => {
    press();
    press();
  });
  expect(mockCreate).toHaveBeenCalledTimes(1);
  expect(button("Submit review").props.disabled).toBe(true);
  await act(async () => finish());
});

it("removes stale completed form and prevents retained submit handler after account switch", async () => {
  await render();
  await rate();
  const press = button("Submit review").props.onPress;
  mockUser = { id: "other", userType: "customer" };
  await act(async () => tree.update(<Screen />));
  expect(button("Submit review")).toBeUndefined();
  await act(async () => press());
  expect(mockCreate).not.toHaveBeenCalled();
});
it("does not display old success for a different account or booking", async () => {
  await render();
  await rate();
  await act(async () => button("Submit review").props.onPress());
  mockUser = { id: "other", userType: "customer" };
  await act(async () => tree.update(<Screen />));
  expect(
    tree.root
      .findAllByType("Text")
      .some(
        (n: any) =>
          n.props.children === "Thank you. Your review was submitted.",
      ),
  ).toBe(false);
  mockUser = { id: "traveler", userType: "customer" };
  mockRouteId = "next-booking";
  mockBooking = { ...mockBooking, id: "next-booking" };
  await act(async () => tree.update(<Screen />));
  expect(button("Submit review").props.disabled).toBe(true);
});
it("discards an in-flight success after account switch", async () => {
  let finish: any;
  mockCreate.mockImplementation(
    () =>
      new Promise((r) => {
        finish = r;
      }),
  );
  await render();
  await rate();
  await act(async () => {
    button("Submit review").props.onPress();
  });
  mockUser = { id: "other", userType: "customer" };
  await act(async () => tree.update(<Screen />));
  await act(async () => finish());
  expect(
    tree.root
      .findAllByType("Text")
      .some(
        (n: any) =>
          n.props.children === "Thank you. Your review was submitted.",
      ),
  ).toBe(false);
  expect(button("Submit review")).toBeUndefined();
});
it("does not trust stale booking data for a different route id", async () => {
  mockRouteId = "another-booking";
  await render();
  expect(button("Submit review")).toBeUndefined();
});
it("wraps rating controls and bounds form/input within a narrow container", async () => {
  await render();
  const flatten = (x: any): any =>
    Array.isArray(x)
      ? Object.assign({}, ...x.filter(Boolean).map(flatten))
      : x || {};
  const ratings = tree.root
    .findAllByType("View")
    .find((n: any) => n.props.accessibilityRole === "radiogroup");
  expect(flatten(ratings.props.style).flexWrap).toBe("wrap");
  const card = tree.root
    .findAllByType("View")
    .find((n: any) => flatten(n.props.style).maxWidth === 520);
  expect(flatten(card.props.style)).toEqual(
    expect.objectContaining({ width: "100%", minWidth: 0, padding: 16 }),
  );
  expect(flatten(tree.root.findByType("TextInput").props.style)).toEqual(
    expect.objectContaining({ width: "100%", minWidth: 0 }),
  );
});
