import { graphql } from 'react-relay';
import type { AdminUserQuery$variables } from './__generated__/AdminUserQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_USER_QUERY = graphql`query AdminUserQuery($id: ID!) {
  ...LayoutFragment
  adminUser(id: $id) { id email displayName role active createdAt updatedAt }
}`;

export function AdminUserQueryVariables(route: EntryRoute): AdminUserQuery$variables { return { id: route.id ?? '' }; }
