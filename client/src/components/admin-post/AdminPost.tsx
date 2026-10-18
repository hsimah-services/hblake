import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading } from '@astryxdesign/core';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { ADMIN_POST_LIST_QUERY } from './AdminPostListQuery';
import { ADMIN_POST_QUERY } from './AdminPostQuery';
import { ADMIN_POST_CREATE_QUERY } from './AdminPostCreateQuery';
import type { AdminPostListQuery } from './__generated__/AdminPostListQuery.graphql';
import type { AdminPostQuery } from './__generated__/AdminPostQuery.graphql';
import type { AdminPostCreateQuery } from './__generated__/AdminPostCreateQuery.graphql';
import { useAdminPostRouteContext, RouteName, AdminPostListURI, AdminPostCreateURI, AdminPostDetailURI, AdminPostEditURI } from '../../routes/__generated__/routes';
import { AdminTable } from '../admin-table/AdminTable';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminPostMutation } from './AdminPostMutation';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function AdminPost({ list, create, content }: AdminPostProps) {
  return list ? <AdminPost_List queryRef={list} /> : create ? <AdminPost_Create queryRef={create} /> : content ? <AdminPost_Content queryRef={content} /> : null;
}

function AdminPost_List({ queryRef }: { queryRef: PreloadedQuery<AdminPostListQuery> }) {
  const data = usePreloadedQuery<AdminPostListQuery>(ADMIN_POST_LIST_QUERY, queryRef);
  const mutate = AdminPostMutation();
  const route = useAdminPostRouteContext();
  const status = 'status' in route.input && typeof route.input.status === 'string' ? route.input.status : undefined;
  return <AdminLayout data={data} section="posts" title="News">
    <AdminTable kind="Article" plural="News" rows={data.posts?.nodes} published
      create={AdminPostCreateURI.getURI({})} detail={id => AdminPostDetailURI.getURI({ id })} edit={id => AdminPostEditURI.getURI({ id })}
      remove={id => mutate('delete', { id })}
      status={status} filtered={value => AdminPostListURI.getURI({ status: value })}
      next={data.posts?.pageInfo.hasNextPage ? AdminPostListURI.getURI({ after: data.posts.pageInfo.endCursor ?? undefined, status }) : undefined} />
  </AdminLayout>;
}

function AdminPost_Create({ queryRef }: { queryRef: PreloadedQuery<AdminPostCreateQuery> }) {
  const data = usePreloadedQuery<AdminPostCreateQuery>(ADMIN_POST_CREATE_QUERY, queryRef);
  const mutate = AdminPostMutation();
  const save = useAdminPost_Save(null, mutate);
  return <AdminLayout data={data} section="posts" title="New article">
    <Heading level={1}>New article</Heading>
    <ContentForm key="new" kind="Post" save={save} detail={id => AdminPostDetailURI.getURI({ id })} />
  </AdminLayout>;
}

function AdminPost_Content({ queryRef }: { queryRef: PreloadedQuery<AdminPostQuery> }) {
  const data = usePreloadedQuery<AdminPostQuery>(ADMIN_POST_QUERY, queryRef);
  const route = useAdminPostRouteContext(); const mutate = AdminPostMutation(); const row = data.post;
  const save = useAdminPost_Save(row, mutate);
  const editing = route.currentRoute === RouteName.AdminPostEdit && row != null;
  return <AdminLayout data={data} section="posts" row={row} title={editing ? `Edit ${row.title}` : undefined}>
    {editing ? <>
      <Heading level={1}>Edit article</Heading>
      <ContentForm key={row.id} kind="Post" row={row} save={save} detail={id => AdminPostDetailURI.getURI({ id })} />
    </> : <AdminDetail kind="Article" row={row} edit={AdminPostEditURI.getURI({ id: row?.id ?? '' })} list={AdminPostListURI.getURI({})} mutate={mutate} />}
  </AdminLayout>;
}

function useAdminPost_Save(row: { readonly id: string } | null | undefined, mutate: ReturnType<typeof AdminPostMutation>) {
  return async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    return (response[action + 'Post'] as { post: { id: string } }).post.id;
  };
}

type AdminPostProps = { list?: PreloadedQuery<AdminPostListQuery>; create?: PreloadedQuery<AdminPostCreateQuery>; content?: PreloadedQuery<AdminPostQuery> };
