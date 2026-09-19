/**
 * Optional server-owned payment facts attached to a booking read model.
 *
 * This is deliberately provider-neutral: it describes what an authenticated
 * booking read returned and is not a request/charge creation contract.
 */
export type BookingPaymentReadModel = {
  provider?: string | null;
  method?: string | null;
  status?: string | null;
  amountSatang?: number | null;
  currency?: string | null;
  updatedAt?: string | null;
};
