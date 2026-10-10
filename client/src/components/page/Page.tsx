import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { PAGE_QUERY } from './PageQuery';
import type { PageQuery } from './__generated__/PageQuery.graphql';
import { PublicContent } from '../public-content/PublicContent';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { usePageRouteContext, HomeURI } from '../../routes/__generated__/routes';

export function Page({ queryRef }: PageProps) {
  const data = usePreloadedQuery<PageQuery>(PAGE_QUERY, queryRef);
  useHomeRedirect();
  return <Layout data={data} row={data.pageBySlug}><PublicContent row={data.pageBySlug}  /></Layout>;
}

function useHomeRedirect() {
  const { input: { slug } } = usePageRouteContext(); const navigate = useNavigate();
  useEffect(() => { if (slug === 'home') navigate(HomeURI.getURI({}), { replace: true }); }, [slug, navigate]);
}

type PageProps = { queryRef: PreloadedQuery<PageQuery> };
