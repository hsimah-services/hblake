import { graphql } from 'react-relay';
import type { AdminPostQuery$variables } from './__generated__/AdminPostQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_POST_QUERY = graphql`query AdminPostQuery($id: ID!) {
  ...LayoutFragment
  post(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;

export function AdminPostQueryVariables(route: EntryRoute): AdminPostQuery$variables { return { id: route.id ?? '' }; }
