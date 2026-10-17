import { graphql } from 'react-relay';

export const ADMIN_PAGE_CREATE_QUERY = graphql`query AdminPageCreateQuery {
  ...AdminLayoutFragment
  viewer { id }
}`;
