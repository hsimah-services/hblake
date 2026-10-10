import { graphql } from 'react-relay';
import type { AdminPostQuery$variables } from './__generated__/AdminPostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_POST_QUERY = graphql`query AdminPostQuery($id: ID!, $after: String, $list: Boolean!, $detail: Boolean!) {
  ...LayoutFragment
  posts(first: 20, after: $after) @include(if: $list) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
    post(id: $id) @include(if: $detail) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function AdminPostQueryVariables(route: EntryRoute): AdminPostQuery$variables { return { id: route.id ?? '', after: route.after ?? null, list: route.mode === 'list', detail: route.mode === 'detail' || route.mode === 'edit' }; }
