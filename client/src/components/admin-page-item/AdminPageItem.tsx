import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading } from '@astryxdesign/core';
import { AdminLayout, type AdminLayoutSection } from '../admin-layout/AdminLayout';
import { ADMIN_PAGE_ITEM_LIST_QUERY } from './AdminPageItemListQuery';
import { ADMIN_PAGE_ITEM_QUERY } from './AdminPageItemQuery';
import { ADMIN_PAGE_ITEM_CREATE_QUERY } from './AdminPageItemCreateQuery';
import type { AdminPageItemListQuery } from './__generated__/AdminPageItemListQuery.graphql';
import type { AdminPageItemQuery } from './__generated__/AdminPageItemQuery.graphql';
import type { AdminPageItemCreateQuery } from './__generated__/AdminPageItemCreateQuery.graphql';
import { useAdminPageItemRouteContext, RouteName, AdminPageItemListURI, AdminPageItemCreateURI, AdminPageItemDetailURI, AdminPageItemEditURI } from '../../routes/__generated__/routes';
import { AdminTable } from '../admin-table/AdminTable';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminPageItemMutation } from './AdminPageItemMutation';

// The items of one page, at /admin/items/<page slug>. A page that holds no items has none.
// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function AdminPageItem({ list, create, content }: AdminPageItemProps) {
  return list ? <AdminPageItem_List queryRef={list} /> : create ? <AdminPageItem_Create queryRef={create} /> : content ? <AdminPageItem_Content queryRef={content} /> : null;
}

function AdminPageItem_List({ queryRef }: { queryRef: PreloadedQuery<AdminPageItemListQuery> }) {
  const data = usePreloadedQuery<AdminPageItemListQuery>(ADMIN_PAGE_ITEM_LIST_QUERY, queryRef);
  const mutate = AdminPageItemMutation();
  const route = useAdminPageItemRouteContext();
  const holder = holding(data.pageBySlug);
  const page = route.input.page;
  const status = 'status' in route.input && typeof route.input.status === 'string' ? route.input.status : undefined;
  const q = 'q' in route.input && typeof route.input.q === 'string' ? route.input.q : undefined;
  if (!holder) return <AdminPageItem_NotFound data={data} />;
  return <AdminLayout data={data} section={sectionOf(page)} title={holder.title}>
    <AdminTable kind={holder.kind} plural={holder.title} rows={data.pageItemsOfPage?.nodes} published
      create={AdminPageItemCreateURI.getURI({ page })} detail={id => AdminPageItemDetailURI.getURI({ page, id })} edit={id => AdminPageItemEditURI.getURI({ page, id })}
      remove={id => mutate('delete', { id })}
      status={status} q={q} listUrl={params => AdminPageItemListURI.getURI({ page, ...params })}
      publish={row => mutate(row.status === 'PUBLISHED' ? 'unpublish' : 'publish', { id: row.id })}
      next={data.pageItemsOfPage?.pageInfo.hasNextPage ? AdminPageItemListURI.getURI({ page, after: data.pageItemsOfPage.pageInfo.endCursor ?? undefined, status, q }) : undefined} />
  </AdminLayout>;
}

function AdminPageItem_Create({ queryRef }: { queryRef: PreloadedQuery<AdminPageItemCreateQuery> }) {
  const data = usePreloadedQuery<AdminPageItemCreateQuery>(ADMIN_PAGE_ITEM_CREATE_QUERY, queryRef);
  const mutate = AdminPageItemMutation();
  const page = useAdminPageItemRouteContext().input.page;
  const holder = holding(data.pageBySlug);
  const save = useAdminPageItem_Save(null, mutate, holder?.id);
  if (!holder) return <AdminPageItem_NotFound data={data} />;
  return <AdminLayout data={data} section={sectionOf(page)} title={`New ${holder.kind.toLowerCase()}`}>
    <Heading level={1}>New {holder.kind.toLowerCase()}</Heading>
    <ContentForm key="new" kind="Item" defaults={{ kind: holder.kind }} save={save} detail={id => AdminPageItemDetailURI.getURI({ page, id })} />
  </AdminLayout>;
}

function AdminPageItem_Content({ queryRef }: { queryRef: PreloadedQuery<AdminPageItemQuery> }) {
  const data = usePreloadedQuery<AdminPageItemQuery>(ADMIN_PAGE_ITEM_QUERY, queryRef);
  const route = useAdminPageItemRouteContext(); const mutate = AdminPageItemMutation();
  const holder = holding(data.pageBySlug); const page = route.input.page;
  // An item is found only under the page that holds it.
  const row = holder && data.pageItem?.page?.id === holder.id ? data.pageItem : null;
  const save = useAdminPageItem_Save(row, mutate, holder?.id);
  const editing = route.currentRoute === RouteName.AdminPageItemEdit && row != null;
  if (!holder) return <AdminPageItem_NotFound data={data} />;
  return <AdminLayout data={data} section={sectionOf(page)} row={row} title={editing ? `Edit ${row.title}` : undefined}>
    {editing ? <>
      <Heading level={1}>Edit {holder.kind.toLowerCase()}</Heading>
      <ContentForm key={row.id} kind="Item" row={row} save={save} detail={id => AdminPageItemDetailURI.getURI({ page, id })}
        publication={{ status: row.status, toggle: () => mutate(row.status === 'PUBLISHED' ? 'unpublish' : 'publish', { id: row.id }) }} />
    </> : <AdminDetail kind={holder.kind} row={row} edit={AdminPageItemEditURI.getURI({ page, id: row?.id ?? '' })} list={AdminPageItemListURI.getURI({ page })} mutate={mutate} />}
  </AdminLayout>;
}

function AdminPageItem_NotFound({ data }: { data: AdminPageItemNotFoundData }) {
  return <AdminLayout data={data} section="dashboard" title="Not found"><Heading level={1}>Not found</Heading><p>No page holds items here.</p></AdminLayout>;
}

/** The page whose items these are, if it holds items. */
function holding(page: { readonly id: string; readonly title: string; readonly defaultItemKind?: string | null } | null | undefined) {
  return page?.defaultItemKind != null ? { id: page.id, title: page.title, kind: page.defaultItemKind } : null;
}

const sectionOf = (page: string): AdminLayoutSection => `items:${page}`;

function useAdminPageItem_Save(row: { readonly id: string } | null | undefined, mutate: ReturnType<typeof AdminPageItemMutation>, pageId: string | undefined) {
  return async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, row ? input : { ...input, page: pageId });
    return (response[action + 'PageItem'] as { pageItem: { id: string } }).pageItem.id;
  };
}

type AdminPageItemNotFoundData = Parameters<typeof AdminLayout>[0]['data'];
type AdminPageItemProps = { list?: PreloadedQuery<AdminPageItemListQuery>; create?: PreloadedQuery<AdminPageItemCreateQuery>; content?: PreloadedQuery<AdminPageItemQuery> };
