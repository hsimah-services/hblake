import { graphql } from 'react-relay';

export const POST_LIST_QUERY = graphql`query PostListQuery($after: String) {
  ...LayoutFragment
  posts(first: 20, after: $after) { nodes { id title slug excerpt content status publishedAt author { displayName } } pageInfo { hasNextPage endCursor } }
}`;
