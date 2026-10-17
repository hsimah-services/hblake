import { graphql } from 'react-relay';

export const ADMIN_POST_CREATE_QUERY = graphql`query AdminPostCreateQuery {
  ...AdminLayoutFragment
  viewer { id }
}`;
