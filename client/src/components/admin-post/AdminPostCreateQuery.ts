import { graphql } from 'react-relay';
import type { AdminPostCreateQuery$variables } from './__generated__/AdminPostCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_POST_CREATE_QUERY = graphql`query AdminPostCreateQuery {
  ...LayoutFragment
  viewer { id }
}`;

export function AdminPostCreateQueryVariables(_route: EntryRoute): AdminPostCreateQuery$variables { return {}; }
