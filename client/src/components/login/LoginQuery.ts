import { graphql } from 'react-relay';
import type { LoginQuery$variables } from './__generated__/LoginQuery.graphql';
import type { EntryRoute } from '../../routes/EntryRoute';

export const LOGIN_QUERY = graphql`query LoginQuery {
  ...LayoutFragment
  
}`;

export function LoginQueryVariables(_route: EntryRoute): LoginQuery$variables { return {}; }
