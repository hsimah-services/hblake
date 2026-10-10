import { graphql } from 'react-relay';
import type { AdminPageQuery$variables } from './__generated__/AdminPageQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PAGE_QUERY = graphql`query AdminPageQuery($id: ID!, $after: String, $list: Boolean!, $detail: Boolean!) {
  ...LayoutFragment
  pages(first: 20, after: $after) @include(if: $list) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
    page(id: $id) @include(if: $detail) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function AdminPageQueryVariables(route: EntryRoute): AdminPageQuery$variables { return { id: route.id ?? '', after: route.after ?? null, list: route.mode === 'list', detail: route.mode === 'detail' || route.mode === 'edit' }; }
