import { Heading, Stack } from '@astryxdesign/core';
import { Link } from 'react-router';

export function ContentList({ title, rows, next, create, detail }: ContentListProps) {
  const list = useContentList(rows);
  return <><Heading level={1}>{title}</Heading>{create && <Link to={create}>Create {title.slice(0, -1)}</Link>}
    {list.length === 0 && <p>No {title.toLowerCase()}.</p>}
    {next && <Link to={next}>Next</Link>}
    <Stack gap={4}>{list.map(row => <article key={row.id}><Heading level={2}><Link to={detail(row)}>{row.title}</Link></Heading><p>{row.excerpt}</p></article>)}</Stack>
  </>;
}

function useContentList(rows: ContentListProps['rows']) { return rows?.filter((row): row is NonNullable<typeof row> => row != null) ?? []; }
type ContentListRow = { readonly id: string; readonly slug: string; readonly title: string; readonly excerpt?: string | null };
type ContentListProps = { title: string; rows?: readonly (ContentListRow | null | undefined)[] | null; next?: string; create?: string; detail: (row: ContentListRow) => string };
