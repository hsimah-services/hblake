import { Card, Link, Heading, Stack } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import type { publicationDetailsResult } from '../../publicationDetails';

const TONES = ['green', 'orange', 'blue'] as const;

/** The published items a page holds, newest first, as cards with a hero image, and a cursor link to older ones. */
export function ContentList({ title, rows, next, detail }: ContentListProps) {
  const list = useContentList(rows);
  return <section aria-label={`${title} items`}>
    {list.length === 0 && <p>No {title.toLowerCase()}.</p>}
    {next && <Link href={next} xstyle={styles.next}>Next</Link>}
    <ul {...stylex.props(styles.grid)}>{list.map((row, index) => <li key={row.id} {...stylex.props(styles.cell)}>
      <Card xstyle={[styles.card, styles[TONES[index % TONES.length]]]}>
        <article {...stylex.props(styles.article)}>
        {row.imageUrl && <div {...stylex.props(styles.media)}><img src={row.imageUrl} alt={row.imageAlt ?? ''} loading="lazy" decoding="async" {...stylex.props(styles.hero)} /></div>}
        <Stack gap={2} align="stretch" xstyle={styles.body}>
          <Heading level={2} xstyle={styles.heading}><Link href={detail(row)} type="inherit" color="inherit" xstyle={styles.link}>{row.title}</Link></Heading>
          {row.author && <p {...stylex.props(styles.meta)}>By {row.author.displayName}{row.details && <> · <time dateTime={row.details.iso}>{row.details.date}</time> · {row.details.minutes} min read</>}</p>}
          {row.excerpt && <p {...stylex.props(styles.excerpt)}>{row.excerpt}</p>}
        </Stack>
        </article>
      </Card>
    </li>)}</ul>
  </section>;
}

function useContentList(rows: ContentListProps['rows']) { return rows?.filter((row): row is NonNullable<typeof row> => row != null) ?? []; }
type ContentListRow = { readonly id: string; readonly slug: string; readonly title: string; readonly excerpt?: string | null; readonly imageUrl?: string | null; readonly imageAlt?: string | null; readonly author?: { readonly displayName: string } | null; readonly details?: publicationDetailsResult | null };
type ContentListProps = { title: string; rows?: readonly (ContentListRow | null | undefined)[] | null; next?: string; detail: (row: ContentListRow) => string };

const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem', listStyle: 'none', margin: 0, padding: 0 },
  cell: { display: 'flex', minWidth: 0 },
  // The coloured top edge echoes the admin dashboard cards. The title link stretches over the whole card, so it is one target.
  card: {
    position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', borderTopWidth: '4px', borderTopStyle: 'solid',
    boxShadow: { default: '0 6px 16px -12px rgb(0 0 0 / 0.5)', ':hover': '0 22px 40px -18px rgb(0 0 0 / 0.65)', ':focus-within': '0 22px 40px -18px rgb(0 0 0 / 0.65)' },
    transitionProperty: 'box-shadow', transitionDuration: 'var(--site-motion)', transitionTimingFunction: 'var(--ease-standard)',
  },
  green: { borderTopColor: 'var(--site-green)' },
  orange: { borderTopColor: 'var(--site-orange)' },
  blue: { borderTopColor: 'var(--site-blue)' },
  // The image sits at the start and is as tall as the text beside it, never taller: it fills a box the text sets the height of.
  article: { display: 'flex', flexDirection: { default: 'row', '@media (max-width: 640px)': 'column' }, flexGrow: 1 },
  media: {
    position: 'relative', flexShrink: 0, margin: '0.75rem', borderRadius: 'var(--radius-element)', overflow: 'hidden', backgroundColor: 'var(--site-hairline)',
    width: { default: 'min(40%, 16rem)', '@media (max-width: 640px)': 'auto' }, minHeight: { default: '8rem', '@media (max-width: 640px)': 'auto' },
    aspectRatio: { default: 'auto', '@media (max-width: 640px)': '16 / 9' },
  },
  hero: { position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%', objectFit: 'cover' },
  body: { padding: '1rem 1.25rem 1.25rem', flexGrow: 1, minWidth: 0, justifyContent: 'center' },
  heading: { fontSize: '1.4rem', letterSpacing: '-0.01em', margin: 0 },
  link: {
    textDecoration: { default: 'none', ':hover': 'underline', ':focus-visible': 'underline' }, textUnderlineOffset: '0.2em',
    '::after': { content: '""', position: 'absolute', inset: 0 },
    outline: { default: 'none', ':focus-visible': '2px solid var(--color-text-primary)' }, outlineOffset: '-2px',
  },
  meta: { margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem' },
  excerpt: { margin: 0, lineHeight: 1.6 },
  next: { display: 'inline-flex', alignItems: 'center', minHeight: '44px', marginBottom: '1.5rem' },
});
