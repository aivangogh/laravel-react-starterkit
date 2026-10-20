/** Two-letter avatar fallback derived from a name (`'Ada Lovelace' → 'AL'`, empty → `'?'`). */
export function initialsOf(name: string | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return '?'
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
