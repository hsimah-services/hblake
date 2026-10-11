import { graphql } from 'react-relay';
import type { AdminPageCreateQuery$variables } from './__generated__/AdminPageCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PAGE_CREATE_QUERY = graphql`query AdminPageCreateQuery {
  ...LayoutFragment
  viewer { id }
}`;

export function AdminPageCreateQueryVariables(_route: EntryRoute): AdminPageCreateQuery$variables { return {}; }
