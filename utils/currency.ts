import { useMemo } from 'react';

export type CurrencyCode = 'THB' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'AUD' | 'JPY';

type CurrencyMeta = {
  symbol: string;
  decimals: number;
  thbPerUnit: number;
};

// Static app rates. These avoid runtime network dependency and should be reviewed
// before production releases when new currencies are enabled.
export const LOCAL_CURRENCY_RATES: Record<CurrencyCode, CurrencyMeta> = {
  THB: { symbol: '฿', decimals: 0, thbPerUnit: 1 },
  USD: { symbol: '$', decimals: 0, thbPerUnit: 36 },
  EUR: { symbol: '€', decimals: 0, thbPerUnit: 39 },
  GBP: { symbol: '£', decimals: 0, thbPerUnit: 46 },
  SGD: { symbol: 'S$', decimals: 0, thbPerUnit: 27 },
  AUD: { symbol: 'A$', decimals: 0, thbPerUnit: 24 },
  JPY: { symbol: '¥', decimals: 0, thbPerUnit: 0.23 },
};

export const normalizeCurrency = (currency?: string | null): CurrencyCode => {
  const normalized = String(currency || 'THB').trim().toUpperCase();
  return normalized in LOCAL_CURRENCY_RATES ? normalized as CurrencyCode : 'THB';
};

export const convertCurrency = (
  amount: number | undefined | null,
  fromCurrency?: string | null,
  toCurrency: CurrencyCode = 'THB'
): number => {
  if (!amount || amount <= 0) return 0;
  const from = LOCAL_CURRENCY_RATES[normalizeCurrency(fromCurrency)];
  const to = LOCAL_CURRENCY_RATES[toCurrency];
  return amount * from.thbPerUnit / to.thbPerUnit;
};

export const formatCurrency = (
  amount: number | undefined | null,
  currency?: string | null,
  options?: { approximate?: boolean }
): string => {
  const code = normalizeCurrency(currency);
  const meta = LOCAL_CURRENCY_RATES[code];
  const value = amount || 0;
  const formatted = value.toLocaleString('en-US', {
    maximumFractionDigits: meta.decimals,
    minimumFractionDigits: 0,
  });
  return `${options?.approximate ? '~' : ''}${meta.symbol}${formatted}`;
};

export const formatTravelerCurrency = (
  amount: number | undefined | null,
  sourceCurrency?: string | null
): string => {
  return formatCurrency(Math.round(convertCurrency(amount, sourceCurrency, 'THB')), 'THB');
};

export const formatOriginalCurrencyContext = (
  amount: number | undefined | null,
  sourceCurrency?: string | null
): string | null => {
  const currency = normalizeCurrency(sourceCurrency);
  if (currency === 'THB' || !amount || amount <= 0) return null;
  return `${formatCurrency(amount, currency)} original guide rate`;
};

export function useCurrencyConversion(
  amount: number | undefined | null,
  sourceCurrency?: string | null,
  targetCurrency: CurrencyCode = 'THB'
): string | null {
  return useMemo(() => {
    if (!amount || amount <= 0) return null;
    const converted = convertCurrency(amount, sourceCurrency, targetCurrency);
    return formatCurrency(Math.round(converted), targetCurrency, { approximate: normalizeCurrency(sourceCurrency) !== targetCurrency });
  }, [amount, sourceCurrency, targetCurrency]);
}
