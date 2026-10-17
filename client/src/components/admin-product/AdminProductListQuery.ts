import { graphql } from 'react-relay';

export const ADMIN_PRODUCT_LIST_QUERY = graphql`query AdminProductListQuery($after: String) {
  ...AdminLayoutFragment
  products(first: 20, after: $after) { nodes { id title slug status updatedAt } pageInfo { hasNextPage endCursor } }
}`;
