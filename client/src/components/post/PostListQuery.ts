import { graphql } from 'react-relay';
import type { PostListQuery$variables } from './__generated__/PostListQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const POST_LIST_QUERY = graphql`query PostListQuery($after: String) {
  ...LayoutFragment
  posts(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;

export function PostListQueryVariables(route: EntryRoute): PostListQuery$variables { return { after: route.after ?? null }; }
