import { graphql } from 'react-relay';
import type { AdminProductCreateQuery$variables } from './__generated__/AdminProductCreateQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PRODUCT_CREATE_QUERY = graphql`query AdminProductCreateQuery {
  ...LayoutFragment
  viewer { id }
}`;

export function AdminProductCreateQueryVariables(_route: EntryRoute): AdminProductCreateQuery$variables { return {}; }
