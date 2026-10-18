/** A publication date for display and its reading time (200 words a minute, at least 1). */
export function publicationDetails(publishedAt: string | null | undefined, content: string | null | undefined): publicationDetailsResult | null {
  if (!publishedAt) return null;
  const words = (content ?? '').replace(/[#>*_`~[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    iso: publishedAt,
    date: new Date(publishedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    minutes: Math.max(1, Math.round(words / 200)),
  };
}

export type publicationDetailsResult = { iso: string; date: string; minutes: number };
