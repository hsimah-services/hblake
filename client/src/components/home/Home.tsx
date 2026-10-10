import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { HOME_QUERY } from './HomeQuery';
import type { HomeQuery } from './__generated__/HomeQuery.graphql';
import { PublicContent } from '../public-content/PublicContent';

export function Home({ queryRef }: HomeProps) {
  const data = usePreloadedQuery<HomeQuery>(HOME_QUERY, queryRef);

  return <Layout data={data} row={data.pageBySlug}><PublicContent row={data.pageBySlug} home /></Layout>;
}


type HomeProps = { queryRef: PreloadedQuery<HomeQuery> };
