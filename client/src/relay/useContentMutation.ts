import { useRelayEnvironment } from 'react-relay';
import { commitMutation, type GraphQLTaggedNode } from 'relay-runtime';

export function useContentMutation(operations: Record<string, GraphQLTaggedNode>) {
  const environment = useRelayEnvironment();
  return (action: string, input: Record<string, unknown>): Promise<Record<string, unknown>> => new Promise((resolve, reject) => {
    const mutation = operations[action];
    if (!mutation) { reject(new Error('Unsupported content operation.')); return; }
    commitMutation<{ response: Record<string, unknown>; variables: { input: Record<string, unknown> } }>(environment, {
      mutation, variables: { input },
      onCompleted: (response, errors) => {
        if (errors?.length) reject(new Error(errors.map(error => error.message).join(' ')));
        else resolve(response);
      },
      onError: reject,
    });
  });
}
