import { graphql } from 'react-relay';

export const ADMIN_QUERY = graphql`query AdminQuery {
  ...LayoutFragment
  viewer { id }
}`;
