import { graphql } from 'react-relay';
import type { AdminProductQuery$variables } from './__generated__/AdminProductQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const ADMIN_PRODUCT_QUERY = graphql`query AdminProductQuery($id: ID!) {
  ...LayoutFragment
  product(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl }
}`;

export function AdminProductQueryVariables(route: EntryRoute): AdminProductQuery$variables { return { id: route.id ?? '' }; }
