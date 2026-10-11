import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';
import { useContentMutation, type useContentMutationOperation } from '../../../relay/useContentMutation';

const UPDATE = graphql`mutation AdminUserUpdateMutation($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id email displayName role active createdAt updatedAt } } }`;

export function useAdminUserMutation() {
  const [update] = useMutationAction<useContentMutationOperation>(UPDATE);
  return useContentMutation({ update });
}
