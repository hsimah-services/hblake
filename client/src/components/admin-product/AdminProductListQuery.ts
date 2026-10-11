import { graphql } from 'react-relay';
import type { AdminProductListQuery$variables } from './__generated__/AdminProductListQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PRODUCT_LIST_QUERY = graphql`query AdminProductListQuery($after: String) {
  ...LayoutFragment
  products(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;

export function AdminProductListQueryVariables(route: EntryRoute): AdminProductListQuery$variables { return { after: route.after ?? null }; }
