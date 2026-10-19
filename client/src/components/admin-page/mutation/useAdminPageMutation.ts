import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';
import { useContentMutation, type useContentMutationOperation } from '../../../relay/useContentMutation';

const CREATE = graphql`mutation AdminPageCreateMutation($input: CreatePageInput!) { createPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt showInNavigation navigationOrder featureOnHome homeOrder accent } } }`;
const UPDATE = graphql`mutation AdminPageUpdateMutation($input: UpdatePageInput!) { updatePage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt showInNavigation navigationOrder featureOnHome homeOrder accent } } }`;
const PUBLISH = graphql`mutation AdminPagePublishMutation($input: PublishPageInput!) { publishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt showInNavigation navigationOrder featureOnHome homeOrder accent } } }`;
const UNPUBLISH = graphql`mutation AdminPageUnpublishMutation($input: UnpublishPageInput!) { unpublishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt showInNavigation navigationOrder featureOnHome homeOrder accent } } }`;
const DELETE = graphql`mutation AdminPageDeleteMutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }`;

export function useAdminPageMutation() {
  const [create] = useMutationAction<useContentMutationOperation>(CREATE);
  const [update] = useMutationAction<useContentMutationOperation>(UPDATE);
  const [publish] = useMutationAction<useContentMutationOperation>(PUBLISH);
  const [unpublish] = useMutationAction<useContentMutationOperation>(UNPUBLISH);
  const [remove] = useMutationAction<useContentMutationOperation>(DELETE);
  return useContentMutation({ create, update, publish, unpublish, delete: remove });
}
