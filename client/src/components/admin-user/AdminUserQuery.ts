import { graphql } from 'react-relay';

export const ADMIN_USER_QUERY = graphql`query AdminUserQuery($id: ID!) {
  ...AdminLayoutFragment
  adminUser(id: $id) { id username displayName }
}`;
