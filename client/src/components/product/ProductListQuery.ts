import { graphql } from 'react-relay';
import type { ProductListQuery$variables } from './__generated__/ProductListQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const PRODUCT_LIST_QUERY = graphql`query ProductListQuery($after: String) {
  ...LayoutFragment
  products(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;

export function ProductListQueryVariables(route: EntryRoute): ProductListQuery$variables { return { after: route.after ?? null }; }
