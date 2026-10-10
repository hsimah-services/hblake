import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Layout } from '../layout/Layout';
import { ADMIN_POST_QUERY } from './AdminPostQuery';
import type { AdminPostQuery } from './__generated__/AdminPostQuery.graphql';
import { Heading } from '@astryxdesign/core';
import { useAdminPostRouteContext, RouteName, AdminPostListURI, AdminPostCreateURI, AdminPostDetailURI, AdminPostEditURI } from '../../routes/__generated__/routes';
import { ContentList } from '../content-list/ContentList';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminPostMutation } from './AdminPostMutation';

export function AdminPost({ queryRef }: AdminPostProps) {
  const screen = useAdminPost(queryRef);
  return <Layout data={screen.data} row={screen.row} admin>
    {screen.route.currentRoute === RouteName.AdminPostList ? <ContentList title="Posts" rows={screen.data.posts?.nodes}
      create={AdminPostCreateURI.getURI({})} detail={row => AdminPostDetailURI.getURI({ id: row.id })}
      next={screen.data.posts?.pageInfo.hasNextPage ? AdminPostListURI.getURI({ after: screen.data.posts.pageInfo.endCursor ?? undefined }) : undefined} />
      : screen.route.currentRoute === RouteName.AdminPostCreate || screen.route.currentRoute === RouteName.AdminPostEdit ? <>
        <Heading level={1}>{screen.row ? 'Edit' : 'Create'} Post</Heading>
        <ContentForm key={screen.row?.id ?? 'new'} kind="Post" row={screen.row} save={screen.save} detail={id => AdminPostDetailURI.getURI({ id })} />
      </> : <AdminDetail kind="Post" row={screen.row} edit={AdminPostEditURI.getURI({ id: screen.row?.id ?? '' })} list={AdminPostListURI.getURI({})} mutate={screen.mutate} />}
  </Layout>;
}

function useAdminPost(queryRef: PreloadedQuery<AdminPostQuery>) {
  const data = usePreloadedQuery<AdminPostQuery>(ADMIN_POST_QUERY, queryRef); const route = useAdminPostRouteContext();
  const mutate = AdminPostMutation(); const row = data.post;
  async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    const payload = response[action + 'Post'] as { post: { id: string } };
    return payload.post.id;
  }
  return { data, route, row, mutate, save };
}

type AdminPostProps = { queryRef: PreloadedQuery<AdminPostQuery> };
