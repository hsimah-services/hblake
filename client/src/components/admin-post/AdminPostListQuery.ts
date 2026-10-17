import { graphql } from 'react-relay';

export const ADMIN_POST_LIST_QUERY = graphql`query AdminPostListQuery($after: String) {
  ...AdminLayoutFragment
  posts(first: 20, after: $after) { nodes { id title slug status updatedAt publishedAt } pageInfo { hasNextPage endCursor } }
}`;
