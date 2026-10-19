import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Link } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { Layout } from '../layout/Layout';
import { PublicContent } from '../public-content/PublicContent';
import { PAGE_ITEM_QUERY } from './PageItemQuery';
import type { PageItemQuery } from './__generated__/PageItemQuery.graphql';
import { PageItemURI, usePageItemRouteContext } from '../../routes/__generated__/routes';

// An item of a page, at /<page>/<item>. It is found only under the page that holds it.
export function PageItem({ queryRef }: PageItemProps) {
  const item = usePageItem(queryRef);
  return <Layout data={item.data} row={item.row}>
    <PublicContent row={item.row} />
    {item.row && (item.newer || item.older) && <nav aria-label={`More ${item.pageTitle.toLowerCase()}`} {...stylex.props(styles.more)}>
      {item.newer && <p>Newer: <Link href={PageItemURI.getURI({ page: item.pageSlug, slug: item.newer.slug })} rel="prev" hasUnderline>{item.newer.title}</Link></p>}
      {item.older && <p>Older: <Link href={PageItemURI.getURI({ page: item.pageSlug, slug: item.older.slug })} rel="next" hasUnderline>{item.older.title}</Link></p>}
    </nav>}
  </Layout>;
}

// Neighbours in the page's order (newest first), among published items only.
function usePageItem(queryRef: PreloadedQuery<PageItemQuery>) {
  const data = usePreloadedQuery<PageItemQuery>(PAGE_ITEM_QUERY, queryRef);
  const { input } = usePageItemRouteContext();
  const found = data.pageItemBySlug;
  const row = found && data.pageBySlug && found.page?.id === data.pageBySlug.id ? found : null;
  const published = data.pageOrder?.nodes?.filter(node => node?.status === 'PUBLISHED') ?? [];
  const index = published.findIndex(node => node?.slug === row?.slug);
  return {
    data, row, pageSlug: input.page, pageTitle: data.pageBySlug?.title ?? '',
    newer: index > 0 ? published[index - 1] : null, older: index >= 0 ? published[index + 1] ?? null : null,
  };
}

type PageItemProps = { queryRef: PreloadedQuery<PageItemQuery> };

const styles = stylex.create({
  more: { maxWidth: '52rem', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--site-hairline)' },
});
