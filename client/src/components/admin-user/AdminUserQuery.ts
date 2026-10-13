import { graphql } from 'react-relay';

export const ADMIN_USER_QUERY = graphql`query AdminUserQuery($id: ID!) {
  ...LayoutFragment
  adminUser(id: $id) { id username displayName }
}`;
