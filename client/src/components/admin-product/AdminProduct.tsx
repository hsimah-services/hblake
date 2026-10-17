import { usePreloadedQuery, type PreloadedQuery } from 'react-relay';
import { Heading } from '@astryxdesign/core';
import { AdminLayout } from '../admin-layout/AdminLayout';
import { ADMIN_PRODUCT_LIST_QUERY } from './AdminProductListQuery';
import { ADMIN_PRODUCT_QUERY } from './AdminProductQuery';
import { ADMIN_PRODUCT_CREATE_QUERY } from './AdminProductCreateQuery';
import type { AdminProductListQuery } from './__generated__/AdminProductListQuery.graphql';
import type { AdminProductQuery } from './__generated__/AdminProductQuery.graphql';
import type { AdminProductCreateQuery } from './__generated__/AdminProductCreateQuery.graphql';
import { useAdminProductRouteContext, RouteName, AdminProductListURI, AdminProductCreateURI, AdminProductDetailURI, AdminProductEditURI } from '../../routes/__generated__/routes';
import { AdminTable } from '../admin-table/AdminTable';
import { ContentForm } from '../content-form/ContentForm';
import { AdminDetail } from '../admin-detail/AdminDetail';
import { AdminProductMutation } from './AdminProductMutation';

// Each route renders from its own URL-only query, which a server may inline (routes.json `query`).
export function AdminProduct({ list, create, content }: AdminProductProps) {
  return list ? <AdminProduct_List queryRef={list} /> : create ? <AdminProduct_Create queryRef={create} /> : content ? <AdminProduct_Content queryRef={content} /> : null;
}

function AdminProduct_List({ queryRef }: { queryRef: PreloadedQuery<AdminProductListQuery> }) {
  const data = usePreloadedQuery<AdminProductListQuery>(ADMIN_PRODUCT_LIST_QUERY, queryRef);
  const mutate = AdminProductMutation();
  return <AdminLayout data={data} section="products" title="Products">
    <AdminTable kind="Product" plural="Products" rows={data.products?.nodes}
      create={AdminProductCreateURI.getURI({})} detail={id => AdminProductDetailURI.getURI({ id })} edit={id => AdminProductEditURI.getURI({ id })}
      remove={id => mutate('delete', { id })}
      next={data.products?.pageInfo.hasNextPage ? AdminProductListURI.getURI({ after: data.products.pageInfo.endCursor ?? undefined }) : undefined} />
  </AdminLayout>;
}

function AdminProduct_Create({ queryRef }: { queryRef: PreloadedQuery<AdminProductCreateQuery> }) {
  const data = usePreloadedQuery<AdminProductCreateQuery>(ADMIN_PRODUCT_CREATE_QUERY, queryRef);
  const mutate = AdminProductMutation();
  const save = useAdminProduct_Save(null, mutate);
  return <AdminLayout data={data} section="products" title="Create Product">
    <Heading level={1}>Create Product</Heading>
    <ContentForm key="new" kind="Product" save={save} detail={id => AdminProductDetailURI.getURI({ id })} />
  </AdminLayout>;
}

function AdminProduct_Content({ queryRef }: { queryRef: PreloadedQuery<AdminProductQuery> }) {
  const data = usePreloadedQuery<AdminProductQuery>(ADMIN_PRODUCT_QUERY, queryRef);
  const route = useAdminProductRouteContext(); const mutate = AdminProductMutation(); const row = data.product;
  const save = useAdminProduct_Save(row, mutate);
  const editing = route.currentRoute === RouteName.AdminProductEdit && row != null;
  return <AdminLayout data={data} section="products" row={row} title={editing ? `Edit ${row.title}` : undefined}>
    {editing ? <>
      <Heading level={1}>Edit Product</Heading>
      <ContentForm key={row.id} kind="Product" row={row} save={save} detail={id => AdminProductDetailURI.getURI({ id })} />
    </> : <AdminDetail kind="Product" row={row} edit={AdminProductEditURI.getURI({ id: row?.id ?? '' })} list={AdminProductListURI.getURI({})} mutate={mutate} />}
  </AdminLayout>;
}

function useAdminProduct_Save(row: { readonly id: string } | null | undefined, mutate: ReturnType<typeof AdminProductMutation>) {
  return async function save(input: Record<string, unknown>): Promise<string> {
    const action = row ? 'update' : 'create'; const response = await mutate(action, input);
    return (response[action + 'Product'] as { product: { id: string } }).product.id;
  };
}

type AdminProductProps = { list?: PreloadedQuery<AdminProductListQuery>; create?: PreloadedQuery<AdminProductCreateQuery>; content?: PreloadedQuery<AdminProductQuery> };
