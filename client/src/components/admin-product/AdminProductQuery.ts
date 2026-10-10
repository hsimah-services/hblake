import { graphql } from 'react-relay';
import type { AdminProductQuery$variables } from './__generated__/AdminProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PRODUCT_QUERY = graphql`query AdminProductQuery($id: ID!, $after: String, $list: Boolean!, $detail: Boolean!) {
  ...LayoutFragment
  products(first: 20, after: $after) @include(if: $list) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
    product(id: $id) @include(if: $detail) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;

export function AdminProductQueryVariables(route: EntryRoute): AdminProductQuery$variables { return { id: route.id ?? '', after: route.after ?? null, list: route.mode === 'list', detail: route.mode === 'detail' || route.mode === 'edit' }; }
