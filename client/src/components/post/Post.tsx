import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { POST_LIST_QUERY } from './PostListQuery';
import { POST_QUERY } from './PostQuery';
import type { PostListQuery } from './__generated__/PostListQuery.graphql';
import type { PostQuery } from './__generated__/PostQuery.graphql';
import { PostURI, PostListURI } from '../../routes/__generated__/routes';
import { PublicContent } from '../public-content/PublicContent';
import { ContentList } from '../content-list/ContentList';
import { Link } from '@astryxdesign/core';
import * as stylex from '@stylexjs/stylex';
import { publicationDetails } from '../../publicationDetails';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function Post({ list, content }: PostProps) {
  return list ? <Post_List queryRef={list} /> : content ? <Post_Detail queryRef={content} /> : null;
}

function Post_List({ queryRef }: { queryRef: PreloadedQuery<PostListQuery> }) {
  const list = usePostList(queryRef);
  const data = list.data;
  return <Layout data={data} title="News">
    <ContentList title="News" rows={list.rows}
      next={data.posts?.pageInfo.hasNextPage ? PostListURI.getURI({ after: data.posts.pageInfo.endCursor ?? undefined }) : undefined}
      detail={row => PostURI.getURI({ slug: row.slug })} />
  </Layout>;
}

function Post_Detail({ queryRef }: { queryRef: PreloadedQuery<PostQuery> }) {
  const post = usePostDetail(queryRef);
  return <Layout data={post.data} row={post.data.postBySlug}>
    <PublicContent row={post.data.postBySlug} />
    {(post.newer || post.older) && <nav aria-label="More news" {...stylex.props(styles.more)}>
      {post.newer && <p>Newer: <Link href={PostURI.getURI({ slug: post.newer.slug })} rel="prev" hasUnderline>{post.newer.title}</Link></p>}
      {post.older && <p>Older: <Link href={PostURI.getURI({ slug: post.older.slug })} rel="next" hasUnderline>{post.older.title}</Link></p>}
    </nav>}
  </Layout>;
}

function usePostList(queryRef: PreloadedQuery<PostListQuery>) {
  const data = usePreloadedQuery<PostListQuery>(POST_LIST_QUERY, queryRef);
  const rows = data.posts?.nodes?.map(row => row && { ...row, details: publicationDetails(row.publishedAt, row.content) });
  return { data, rows };
}

// Neighbours in News order (newest first), among published articles only.
function usePostDetail(queryRef: PreloadedQuery<PostQuery>) {
  const data = usePreloadedQuery<PostQuery>(POST_QUERY, queryRef);
  const published = data.newsOrder?.nodes?.filter(node => node?.status === 'PUBLISHED') ?? [];
  const index = published.findIndex(node => node?.slug === data.postBySlug?.slug);
  return { data, newer: index > 0 ? published[index - 1] : null, older: index >= 0 ? published[index + 1] ?? null : null };
}

type PostProps = { list?: PreloadedQuery<PostListQuery>; content?: PreloadedQuery<PostQuery> };

const styles = stylex.create({
  more: { maxWidth: '52rem', marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--site-hairline)' },
});
