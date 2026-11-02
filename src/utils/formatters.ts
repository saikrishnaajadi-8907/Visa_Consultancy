/**
 * Utility Formatters for VCMS
 */

export function formatINR(amount: number): string {
  // Format with standard Indian numbering convention e.g. 1,25,00,000
  const formatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });
  return `₹ ${formatter.format(amount)}`;
}

export function formatDifference(diff: number): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (diff === 0) {
    return { text: '₹ 0', isPositive: false, isNeutral: true };
  }
  const isPositive = diff > 0;
  const absFormatted = formatINR(Math.abs(diff));
  return {
    text: `${isPositive ? '+ ' : '- '}${absFormatted}`,
    isPositive,
    isNeutral: false,
  };
}

export function maskAccountNumber(accountNumber?: string): string {
  if (!accountNumber) return 'XXXX 0000';
  const clean = accountNumber.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `XXXX ${last4}`;
}

export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar) return 'Not Provided';
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length < 4) return 'XXXX-XXXX-XXXX';
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function maskPAN(pan: string): string {
  if (!pan) return '—';
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) return clean;
  // Format: ABCDE****F
  return `${clean.slice(0, 5)}****${clean.slice(-1)}`;
}

export function maskPassport(passport: string): string {
  if (!passport) return '—';
  const clean = passport.trim().toUpperCase();
  if (clean.length <= 4) return clean;
  // Mask middle characters: e.g. C****543
  const first = clean.slice(0, 1);
  const last3 = clean.slice(-3);
  return `${first}****${last3}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

