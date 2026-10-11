import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';

const UPDATE = graphql`mutation AdminUserUpdateMutation($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id email displayName role active createdAt updatedAt } } }`;

export function useAdminUserMutation() {
  const [update] = useMutationAction<Mutation>(UPDATE);
  const operations: Record<string, typeof update> = { update };
  return (action: string, input: Record<string, unknown>) => {
    const commit = operations[action];
    if (!commit) return Promise.reject(new Error('Unsupported content operation.'));
    return commit({ variables: { input } });
  };
}

type Mutation = { response: Record<string, unknown>; variables: { input: Record<string, unknown> } };
