import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { POST_QUERY } from './PostQuery';
import type { PostQuery } from './__generated__/PostQuery.graphql';
import { usePostRouteContext, RouteName, PostURI, PostListURI } from '../../routes/__generated__/routes';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';

export function Post({ queryRef }: PostProps) {
  const data = usePreloadedQuery<PostQuery>(POST_QUERY, queryRef);
  const route = usePostRouteContext();
  return <Layout data={data} row={data.postBySlug}>
    {route.currentRoute === RouteName.PostList ? <ContentList title="Posts" rows={data.posts?.nodes}
      next={data.posts?.pageInfo.hasNextPage ? PostListURI.getURI({ after: data.posts.pageInfo.endCursor ?? undefined }) : undefined}
      detail={row => PostURI.getURI({ slug: row.slug })} /> : <PublicContent row={data.postBySlug} />}
  </Layout>;
}


type PostProps = { queryRef: PreloadedQuery<PostQuery> };
