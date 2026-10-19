import { Link, Heading, Stack } from '@astryxdesign/core';
import type { publicationDetailsResult } from '../../publicationDetails';

/** The published items a page holds, newest first, with a cursor link to older ones. */
export function ContentList({ title, rows, next, detail }: ContentListProps) {
  const list = useContentList(rows);
  return <section aria-label={`${title} items`}>
    {list.length === 0 && <p>No {title.toLowerCase()}.</p>}
    {next && <Link href={next}>Next</Link>}
    <Stack gap={4}>{list.map(row => <article key={row.id}><Heading level={2}><Link href={detail(row)}>{row.title}</Link></Heading>{row.author && <p>By {row.author.displayName}{row.details && <> · <time dateTime={row.details.iso}>{row.details.date}</time> · {row.details.minutes} min read</>}</p>}<p>{row.excerpt}</p></article>)}</Stack>
  </section>;
}

function useContentList(rows: ContentListProps['rows']) { return rows?.filter((row): row is NonNullable<typeof row> => row != null) ?? []; }
type ContentListRow = { readonly id: string; readonly slug: string; readonly title: string; readonly excerpt?: string | null; readonly author?: { readonly displayName: string } | null; readonly details?: publicationDetailsResult | null };
type ContentListProps = { title: string; rows?: readonly (ContentListRow | null | undefined)[] | null; next?: string; detail: (row: ContentListRow) => string };
