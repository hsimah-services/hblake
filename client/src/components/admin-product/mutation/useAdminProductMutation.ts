import { graphql } from 'react-relay';
import { useMutationAction } from '@tsquid/routes/mutation';

const CREATE = graphql`mutation AdminProductCreateMutation($input: CreateProductInput!) { createProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UPDATE = graphql`mutation AdminProductUpdateMutation($input: UpdateProductInput!) { updateProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const PUBLISH = graphql`mutation AdminProductPublishMutation($input: PublishProductInput!) { publishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UNPUBLISH = graphql`mutation AdminProductUnpublishMutation($input: UnpublishProductInput!) { unpublishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const DELETE = graphql`mutation AdminProductDeleteMutation($input: DeleteProductInput!) { deleteProduct(input: $input) { deletedId } }`;

export function useAdminProductMutation() {
  const [create] = useMutationAction<Mutation>(CREATE);
  const [update] = useMutationAction<Mutation>(UPDATE);
  const [publish] = useMutationAction<Mutation>(PUBLISH);
  const [unpublish] = useMutationAction<Mutation>(UNPUBLISH);
  const [remove] = useMutationAction<Mutation>(DELETE);
  const operations: Record<string, typeof update> = { create, update, publish, unpublish, delete: remove };
  return (action: string, input: Record<string, unknown>) => {
    const commit = operations[action];
    if (!commit) return Promise.reject(new Error('Unsupported content operation.'));
    return commit({ variables: { input } });
  };
}

type Mutation = { response: Record<string, unknown>; variables: { input: Record<string, unknown> } };
