import { graphql } from 'react-relay';
import type { AdminQuery$variables } from './__generated__/AdminQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...LayoutFragment
  viewer { id }
}`;

export function AdminQueryVariables(_route: EntryRoute): AdminQuery$variables { return {}; }
