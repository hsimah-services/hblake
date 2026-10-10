import { graphql } from 'react-relay';
import { useContentMutation } from '../../../relay/useContentMutation';

const UPDATE = graphql`mutation AdminUserUpdateMutation($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id email displayName role active createdAt updatedAt } } }`;
const OPERATIONS = { update: UPDATE };

export function useAdminUserMutation() { return useContentMutation(OPERATIONS); }
