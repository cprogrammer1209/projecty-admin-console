/** Up to two initials, e.g. "Northwind Labs" → "NL". */
export function initials(text: string | null | undefined): string {
  return (text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

const PROFILE_LABELS: Record<string, string> = {
  PORTAL_OWNER: 'Portal owner',
};

export function profileLabel(profile: string): string {
  return PROFILE_LABELS[profile] ?? profile;
}

/** Case-insensitive "does any of these contain the query". */
export function matches(query: string, ...values: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || values.some((v) => v?.toLowerCase().includes(q));
}
