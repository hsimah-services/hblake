import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { POST_LIST_QUERY } from './PostListQuery';
import { POST_QUERY } from './PostQuery';
import type { PostListQuery } from './__generated__/PostListQuery.graphql';
import type { PostQuery } from './__generated__/PostQuery.graphql';
import { PostURI, PostListURI } from '../../routes/__generated__/routes';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function Post({ list, content }: PostProps) {
  return list ? <Post_List queryRef={list} /> : content ? <Post_Detail queryRef={content} /> : null;
}

function Post_List({ queryRef }: { queryRef: PreloadedQuery<PostListQuery> }) {
  const data = usePreloadedQuery<PostListQuery>(POST_LIST_QUERY, queryRef);
  return <Layout data={data} title="Posts">
    <ContentList title="Posts" rows={data.posts?.nodes}
      next={data.posts?.pageInfo.hasNextPage ? PostListURI.getURI({ after: data.posts.pageInfo.endCursor ?? undefined }) : undefined}
      detail={row => PostURI.getURI({ slug: row.slug })} />
  </Layout>;
}

function Post_Detail({ queryRef }: { queryRef: PreloadedQuery<PostQuery> }) {
  const data = usePreloadedQuery<PostQuery>(POST_QUERY, queryRef);
  return <Layout data={data} row={data.postBySlug}><PublicContent row={data.postBySlug} /></Layout>;
}

type PostProps = { list?: PreloadedQuery<PostListQuery>; content?: PreloadedQuery<PostQuery> };
