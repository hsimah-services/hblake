import { graphql } from 'react-relay';

export const ADMIN_PAGE_QUERY = graphql`query AdminPageQuery($id: ID!) {
  ...LayoutFragment
  page(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
