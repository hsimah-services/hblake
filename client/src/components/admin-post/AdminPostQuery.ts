import { graphql } from 'react-relay';

export const ADMIN_POST_QUERY = graphql`query AdminPostQuery($id: ID!) {
  ...AdminLayoutFragment
  post(id: $id) { id title slug content excerpt status publishedAt createdAt updatedAt }
}`;
