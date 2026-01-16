export const CURRENCIES = {
  KWD: { symbol: 'KD', name: 'Kuwaiti Dinar', decimals: 3 },
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '\u20AC', name: 'Euro', decimals: 2 },
  GBP: { symbol: '\u00A3', name: 'British Pound', decimals: 2 },
  AED: { symbol: 'AED', name: 'UAE Dirham', decimals: 2 },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal', decimals: 2 },
  BHD: { symbol: 'BD', name: 'Bahraini Dinar', decimals: 3 },
  QAR: { symbol: 'QR', name: 'Qatari Riyal', decimals: 2 },
  OMR: { symbol: 'OMR', name: 'Omani Rial', decimals: 3 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'KWD',
  options: { showSymbol?: boolean; compact?: boolean } = {},
): string {
  const { showSymbol = true, compact = false } = options;
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.KWD;

  let formattedAmount: string;

  if (compact && amount >= 1000000) {
    formattedAmount = (amount / 1000000).toFixed(1) + 'M';
  } else if (compact && amount >= 1000) {
    formattedAmount = (amount / 1000).toFixed(1) + 'K';
  } else {
    formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: currencyInfo.decimals,
      maximumFractionDigits: currencyInfo.decimals,
    });
  }

  return showSymbol
    ? `${currencyInfo.symbol} ${formattedAmount}`
    : formattedAmount;
}

export function parseCurrency(value: string): { amount: number; currency: CurrencyCode } | null {
  // Remove common currency symbols and whitespace
  const cleaned = value.replace(/[\s,]/g, '');

  // Try to match currency code or symbol
  for (const [code, info] of Object.entries(CURRENCIES)) {
    if (cleaned.startsWith(info.symbol) || cleaned.startsWith(code)) {
      const numPart = cleaned.replace(info.symbol, '').replace(code, '');
      const amount = parseFloat(numPart);
      if (!isNaN(amount)) {
        return { amount, currency: code as CurrencyCode };
      }
    }
  }

  // Try to parse as plain number
  const amount = parseFloat(cleaned);
  if (!isNaN(amount)) {
    return { amount, currency: 'KWD' };
  }

  return null;
}
