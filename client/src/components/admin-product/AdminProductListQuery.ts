import { graphql } from 'react-relay';

export const ADMIN_PRODUCT_LIST_QUERY = graphql`query AdminProductListQuery($after: String) {
  ...LayoutFragment
  products(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;
