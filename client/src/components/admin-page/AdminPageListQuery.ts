import { graphql } from 'react-relay';
import type { AdminPageListQuery$variables } from './__generated__/AdminPageListQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PAGE_LIST_QUERY = graphql`query AdminPageListQuery($after: String) {
  ...LayoutFragment
  pages(first: 20, after: $after) { nodes { id title slug excerpt status } pageInfo { hasNextPage endCursor } }
}`;

export function AdminPageListQueryVariables(route: EntryRoute): AdminPageListQuery$variables { return { after: route.after ?? null }; }
