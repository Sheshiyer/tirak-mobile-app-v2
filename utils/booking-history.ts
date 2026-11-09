import type {BookingListItem, BookingsListResponse} from '@/services/api/booking/booking';

export async function collectBookingHistory(
  fetchPage: (page: number) => Promise<BookingsListResponse>,
  signal?: AbortSignal,
): Promise<BookingsListResponse> {
  const items = new Map<string, BookingListItem>();
  let expectedTotal: number | undefined;
  let expectedPages: number | undefined;
  let expectedLimit: number | undefined;
  for (let page = 1; ; page++) {
    if (signal?.aborted) throw new Error('Booking history request cancelled.');
    const response = await fetchPage(page);
    if (signal?.aborted) throw new Error('Booking history request cancelled.');
    const pagination = response?.data?.pagination;
    const rows = response?.data?.items ?? response?.data?.bookings;
    if (response?.success !== true || !pagination || !Array.isArray(rows)) {
      throw new Error('Unable to load complete booking history: invalid page response.');
    }
    const {total, totalPages, limit} = pagination;
    if (![pagination.page, total, totalPages, limit].every(Number.isSafeInteger)
      || pagination.page !== page || total < 0 || totalPages < 0 || limit <= 0
      || totalPages !== Math.ceil(total / limit) || rows.length > limit
      || (expectedTotal !== undefined && (total !== expectedTotal || totalPages !== expectedPages || limit !== expectedLimit))) {
      throw new Error('Unable to load complete booking history: pagination changed or is invalid. Please retry.');
    }
    expectedTotal = total; expectedPages = totalPages; expectedLimit = limit;
    const previousSize = items.size;
    for (const row of rows) {
      if (typeof row?.id !== 'string' || !row.id.trim()) throw new Error('Unable to load complete booking history: invalid booking ID.');
      if (!items.has(row.id)) items.set(row.id, row);
    }
    if (items.size > total || (total > 0 && items.size === previousSize)) {
      throw new Error('Unable to load complete booking history: pagination made no valid progress.');
    }
    if (page >= totalPages) {
      if (items.size !== total) throw new Error('Unable to load complete booking history: some bookings are missing. Please retry.');
      const complete = [...items.values()];
      return {success:true,data:{items:complete,bookings:complete,pagination:{page:1,limit:complete.length || limit,total,totalPages:total ? 1 : 0}}};
    }
  }
}
