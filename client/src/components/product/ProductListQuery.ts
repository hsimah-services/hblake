import { graphql } from 'react-relay';

export const PRODUCT_LIST_QUERY = graphql`query ProductListQuery($after: String) {
  ...LayoutFragment
  products(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;
