function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
        url.pathname !== '/' || url.search || url.hash) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function allowedRequestOrigin(
  origin: string | null,
  fallback: string,
  primary = '',
  aliases = '',
): boolean {
  if (!origin) return true; // Non-browser clients remain supported.
  const canonical = normalizeOrigin(primary.trim() || fallback);
  if (!canonical || normalizeOrigin(origin) !== origin) return false;
  if (origin === canonical) return true;
  return aliases.split(',').some(value => {
    const alias = normalizeOrigin(value);
    // A configured HTTPS deployment must not accept an HTTP alias.
    return alias === origin && (!canonical.startsWith('https:') || alias.startsWith('https:'));
  });
}
