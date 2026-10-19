import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading, Link } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { PageURI, PostURI } from '../../routes/__generated__/routes';
import { Layout } from '../layout/Layout';
import { HOME_QUERY } from './HomeQuery';
import type { HomeQuery } from './__generated__/HomeQuery.graphql';
import { PublicContent } from '../public-content/PublicContent';

const TILE_TONES: Readonly<Record<string, 'green' | 'orange' | 'blue' | 'berry'>> = { GREEN: 'green', ORANGE: 'orange', BLUE: 'blue', BERRY: 'berry' };

export function Home({ queryRef }: HomeProps) {
  const { data, tiles, latest } = useHome(queryRef);

  return <Layout data={data} row={data.pageBySlug}>
    <PublicContent row={data.pageBySlug} home />
    {data.pageBySlug && <>
      {tiles.length > 0 && <section aria-label="Explore the site" {...stylex.props(styles.grid)}>
        {tiles.map((page, index) => <Link key={page.id} href={PageURI.getURI({ slug: page.slug })} color="inherit" xstyle={[styles.tile, styles[page.tone]]}>
          <span {...stylex.props(styles.tileContent)}>
          <span aria-hidden="true" {...stylex.props(styles.number)}>{String(index + 1).padStart(2, '0')}</span>
          <span {...stylex.props(styles.label)}>{page.title} <span aria-hidden="true">↗</span></span>
          <span {...stylex.props(styles.excerpt)}>{page.excerpt}</span>
          </span>
        </Link>)}
      </section>}
      {latest && <section {...stylex.props(styles.latest)}>
        <Heading level={2}>Latest news</Heading>
        <Heading level={3}><Link href={PostURI.getURI({ slug: latest.slug })}>{latest.title}</Link></Heading>
        {latest.publishedAt && <time dateTime={latest.publishedAt}>{new Date(latest.publishedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time>}
        <p>{latest.excerpt}</p>
      </section>}
    </>}
  </Layout>;
}

function useHome(queryRef: PreloadedQuery<HomeQuery>) {
  const data = usePreloadedQuery<HomeQuery>(HOME_QUERY, queryRef);
  // The server returns published pages featured on the home page, in order; the first four
  // with a colour become tiles.
  const tiles = (data.homePages?.nodes ?? [])
    .flatMap(page => page && TILE_TONES[page.accent] ? [{ ...page, tone: TILE_TONES[page.accent] }] : [])
    .slice(0, 4);
  const latest = data.latestPosts?.nodes?.find(post => post?.status === 'PUBLISHED');
  return { data, tiles, latest };
}

type HomeProps = { queryRef: PreloadedQuery<HomeQuery> };

const styles = stylex.create({
  grid: { display: 'grid', gridTemplateColumns: { default: 'repeat(4, minmax(0, 1fr))', '@media (max-width: 900px)': 'repeat(2, minmax(0, 1fr))', '@media (max-width: 480px)': '1fr' }, gap: '1rem', marginBlock: { default: '3rem', '@media (max-width: 480px)': '2rem' } },
  // Hover and keyboard focus grow the tile where there is room, unless animations are off
  // (--site-tile-grow). On phones the single column stays flat so nothing overflows.
  tile: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', gap: '1.25rem', minHeight: { default: '17rem', '@media (max-width: 480px)': '0' }, padding: { default: '1.5rem', '@media (max-width: 480px)': '1.25rem' }, color: '#ffffff', textDecoration: 'none', borderRadius: 'var(--radius-container)',
    zIndex: { default: 0, ':hover': 1, ':focus-visible': 1 },
    transform: { default: 'none', ':hover': { default: 'var(--site-tile-grow)', '@media (max-width: 480px)': 'none' }, ':focus-visible': { default: 'var(--site-tile-grow)', '@media (max-width: 480px)': 'none' } },
    boxShadow: { default: '0 6px 16px -12px rgb(0 0 0 / 0.5)', ':hover': '0 22px 40px -18px rgb(0 0 0 / 0.65)', ':focus-visible': '0 22px 40px -18px rgb(0 0 0 / 0.65)' },
    transitionProperty: 'transform, box-shadow', transitionDuration: 'var(--site-motion)', transitionTimingFunction: 'var(--ease-standard)',
  },
  tileContent: { display: 'flex', flexDirection: 'column', gap: { default: '1.25rem', '@media (max-width: 480px)': '0.5rem' }, minHeight: { default: '14rem', '@media (max-width: 480px)': '0' } },
  green: { backgroundColor: 'var(--site-tile-green)' },
  orange: { backgroundColor: 'var(--site-tile-orange)' },
  blue: { backgroundColor: 'var(--site-tile-blue)' },
  berry: { backgroundColor: 'var(--site-tile-berry)' },
  number: { fontSize: { default: '3rem', '@media (max-width: 480px)': '2rem' }, lineHeight: 1, fontWeight: 300 },
  label: { fontSize: '1.4rem', fontWeight: 700 },
  excerpt: { fontSize: '0.9rem', lineHeight: 1.6 },
  latest: { marginBlock: '3rem', paddingBlock: '2rem', borderTop: '1px solid var(--site-hairline)' },
});
