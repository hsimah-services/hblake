import { graphql } from 'react-relay';
import type { AdminPageQuery$variables } from './__generated__/AdminPageQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PAGE_QUERY = graphql`query AdminPageQuery($id: ID!) {
  ...LayoutFragment
  page(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function AdminPageQueryVariables(route: EntryRoute): AdminPageQuery$variables { return { id: route.id ?? '' }; }
