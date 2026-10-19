import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { PAGE_QUERY } from './PageQuery';
import type { PageQuery } from './__generated__/PageQuery.graphql';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { usePageRouteContext, HomeURI, PageItemURI, PageURI } from '../../routes/__generated__/routes';
import { publicationDetails } from '../../publicationDetails';

// A page shows its content and, when it holds items, the published items it holds.
export function Page({ queryRef }: PageProps) {
  const page = usePage(queryRef);
  useHomeRedirect();
  return <Layout data={page.data} row={page.row}>
    <PublicContent row={page.row} />
    {page.row && page.holdsItems && <ContentList title={page.row.title} rows={page.items}
      next={page.next}
      detail={item => PageItemURI.getURI({ page: page.row?.slug ?? '', slug: item.slug })} />}
  </Layout>;
}

function usePage(queryRef: PreloadedQuery<PageQuery>) {
  const data = usePreloadedQuery<PageQuery>(PAGE_QUERY, queryRef);
  const row = data.pageBySlug;
  const items = data.pageItemsOfPage?.nodes?.map(item => item && { ...item, details: publicationDetails(item.publishedAt, item.content) });
  const connection = data.pageItemsOfPage?.pageInfo;
  const next = row && connection?.hasNextPage ? PageURI.getURI({ slug: row.slug, after: connection.endCursor ?? undefined }) : undefined;
  return { data, row, items, next, holdsItems: row?.defaultItemKind != null };
}

function useHomeRedirect() {
  const { input: { slug } } = usePageRouteContext(); const navigate = useNavigate();
  useEffect(() => { if (slug === 'home') navigate(HomeURI.getURI({}), { replace: true }); }, [slug, navigate]);
}

type PageProps = { queryRef: PreloadedQuery<PageQuery> };
