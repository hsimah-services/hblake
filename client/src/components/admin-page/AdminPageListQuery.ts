import { graphql } from 'react-relay';

export const ADMIN_PAGE_LIST_QUERY = graphql`query AdminPageListQuery($after: String) {
  ...AdminLayoutFragment
  pages(first: 20, after: $after) { nodes { id title slug status updatedAt } pageInfo { hasNextPage endCursor } }
}`;
