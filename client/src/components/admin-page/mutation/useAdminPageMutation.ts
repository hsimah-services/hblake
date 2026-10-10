import { graphql } from 'react-relay';
import { useContentMutation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminPageCreateMutation($input: CreatePageInput!) { createPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE = graphql`mutation AdminPageUpdateMutation($input: UpdatePageInput!) { updatePage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH = graphql`mutation AdminPagePublishMutation($input: PublishPageInput!) { publishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH = graphql`mutation AdminPageUnpublishMutation($input: UnpublishPageInput!) { unpublishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE = graphql`mutation AdminPageDeleteMutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }`;
const OPERATIONS = { create: CREATE, update: UPDATE, publish: PUBLISH, unpublish: UNPUBLISH, delete: DELETE };

export function useAdminPageMutation() { return useContentMutation(OPERATIONS); }
