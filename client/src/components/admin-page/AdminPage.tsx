import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading } from '@astryxdesign/core';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { ADMIN_PAGE_LIST_QUERY } from './AdminPageListQuery';
import { ADMIN_PAGE_QUERY } from './AdminPageQuery';
import { ADMIN_PAGE_CREATE_QUERY } from './AdminPageCreateQuery';
import type { AdminPageListQuery } from './__generated__/AdminPageListQuery.graphql';
import type { AdminPageQuery } from './__generated__/AdminPageQuery.graphql';
import type { AdminPageCreateQuery } from './__generated__/AdminPageCreateQuery.graphql';
import { useAdminPageRouteContext, RouteName, AdminPageListURI, AdminPageCreateURI, AdminPageDetailURI, AdminPageEditURI } from '../../routes/__generated__/routes';
import { AdminTable } from '../admin-table/AdminTable';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminPageMutation } from './AdminPageMutation';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function AdminPage({ list, create, content }: AdminPageProps) {
  return list ? <AdminPage_List queryRef={list} /> : create ? <AdminPage_Create queryRef={create} /> : content ? <AdminPage_Content queryRef={content} /> : null;
}

function AdminPage_List({ queryRef }: { queryRef: PreloadedQuery<AdminPageListQuery> }) {
  const data = usePreloadedQuery<AdminPageListQuery>(ADMIN_PAGE_LIST_QUERY, queryRef);
  const mutate = AdminPageMutation();
  return <AdminLayout data={data} section="pages" title="Pages">
    <AdminTable kind="Page" plural="Pages" rows={data.pages?.nodes}
      create={AdminPageCreateURI.getURI({})} detail={id => AdminPageDetailURI.getURI({ id })} edit={id => AdminPageEditURI.getURI({ id })}
      remove={id => mutate('delete', { id })}
      next={data.pages?.pageInfo.hasNextPage ? AdminPageListURI.getURI({ after: data.pages.pageInfo.endCursor ?? undefined }) : undefined} />
  </AdminLayout>;
}

function AdminPage_Create({ queryRef }: { queryRef: PreloadedQuery<AdminPageCreateQuery> }) {
  const data = usePreloadedQuery<AdminPageCreateQuery>(ADMIN_PAGE_CREATE_QUERY, queryRef);
  const mutate = AdminPageMutation();
  const save = useAdminPage_Save(null, mutate);
  return <AdminLayout data={data} section="pages" title="Create Page">
    <Heading level={1}>Create Page</Heading>
    <ContentForm key="new" kind="Page" save={save} detail={id => AdminPageDetailURI.getURI({ id })} />
  </AdminLayout>;
}

function AdminPage_Content({ queryRef }: { queryRef: PreloadedQuery<AdminPageQuery> }) {
  const data = usePreloadedQuery<AdminPageQuery>(ADMIN_PAGE_QUERY, queryRef);
  const route = useAdminPageRouteContext(); const mutate = AdminPageMutation(); const row = data.page;
  const save = useAdminPage_Save(row, mutate);
  const editing = route.currentRoute === RouteName.AdminPageEdit && row != null;
  return <AdminLayout data={data} section="pages" row={row} title={editing ? `Edit ${row.title}` : undefined}>
    {editing ? <>
      <Heading level={1}>Edit Page</Heading>
      <ContentForm key={row.id} kind="Page" row={row} save={save} detail={id => AdminPageDetailURI.getURI({ id })} />
    </> : <AdminDetail kind="Page" row={row} edit={AdminPageEditURI.getURI({ id: row?.id ?? '' })} list={AdminPageListURI.getURI({})} mutate={mutate} />}
  </AdminLayout>;
}

function useAdminPage_Save(row: { readonly id: string } | null | undefined, mutate: ReturnType<typeof AdminPageMutation>) {
  return async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    return (response[action + 'Page'] as { page: { id: string } }).page.id;
  };
}

type AdminPageProps = { list?: PreloadedQuery<AdminPageListQuery>; create?: PreloadedQuery<AdminPageCreateQuery>; content?: PreloadedQuery<AdminPageQuery> };
