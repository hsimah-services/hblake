import { graphql } from 'react-relay';

export const ADMIN_PAGE_LIST_QUERY = graphql`query AdminPageListQuery($after: String) {
  ...LayoutFragment
  pages(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;
