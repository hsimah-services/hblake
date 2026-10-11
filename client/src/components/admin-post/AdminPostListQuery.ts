import { graphql } from 'react-relay';
import type { AdminPostListQuery$variables } from './__generated__/AdminPostListQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_POST_LIST_QUERY = graphql`query AdminPostListQuery($after: String) {
  ...LayoutFragment
  posts(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;

export function AdminPostListQueryVariables(route: EntryRoute): AdminPostListQuery$variables { return { after: route.after ?? null }; }
