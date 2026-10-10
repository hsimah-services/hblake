import { graphql, useRelayEnvironment } from 'react-relay';
import { commitMutation, type GraphQLTaggedNode } from 'relay-runtime';

const CREATE_PAGE = graphql`mutation WebsiteCreatePageMutation($input: CreatePageInput!) { createPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE_PAGE = graphql`mutation WebsiteUpdatePageMutation($input: UpdatePageInput!) { updatePage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH_PAGE = graphql`mutation WebsitePublishPageMutation($input: PublishPageInput!) { publishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH_PAGE = graphql`mutation WebsiteUnpublishPageMutation($input: UnpublishPageInput!) { unpublishPage(input: $input) { page { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE_PAGE = graphql`mutation WebsiteDeletePageMutation($input: DeletePageInput!) { deletePage(input: $input) { deletedId } }`;
const CREATE_POST = graphql`mutation WebsiteCreatePostMutation($input: CreatePostInput!) { createPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UPDATE_POST = graphql`mutation WebsiteUpdatePostMutation($input: UpdatePostInput!) { updatePost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const PUBLISH_POST = graphql`mutation WebsitePublishPostMutation($input: PublishPostInput!) { publishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const UNPUBLISH_POST = graphql`mutation WebsiteUnpublishPostMutation($input: UnpublishPostInput!) { unpublishPost(input: $input) { post { id title slug content excerpt status publishedAt createdAt updatedAt } } }`;
const DELETE_POST = graphql`mutation WebsiteDeletePostMutation($input: DeletePostInput!) { deletePost(input: $input) { deletedId } }`;
const CREATE_PRODUCT = graphql`mutation WebsiteCreateProductMutation($input: CreateProductInput!) { createProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UPDATE_PRODUCT = graphql`mutation WebsiteUpdateProductMutation($input: UpdateProductInput!) { updateProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const PUBLISH_PRODUCT = graphql`mutation WebsitePublishProductMutation($input: PublishProductInput!) { publishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const UNPUBLISH_PRODUCT = graphql`mutation WebsiteUnpublishProductMutation($input: UnpublishProductInput!) { unpublishProduct(input: $input) { product { id title slug content excerpt status publishedAt createdAt updatedAt enquiryUrl } } }`;
const DELETE_PRODUCT = graphql`mutation WebsiteDeleteProductMutation($input: DeleteProductInput!) { deleteProduct(input: $input) { deletedId } }`;
const UPDATE_USER = graphql`mutation WebsiteUpdateUserMutation($input: UpdateAdminUserInput!) { updateAdminUser(input: $input) { adminUser { id email displayName role active createdAt updatedAt } } }`;
const OPERATIONS: Record<string, GraphQLTaggedNode> = {
  'createPage': CREATE_PAGE,
  'updatePage': UPDATE_PAGE,
  'publishPage': PUBLISH_PAGE,
  'unpublishPage': UNPUBLISH_PAGE,
  'deletePage': DELETE_PAGE,
  'createPost': CREATE_POST,
  'updatePost': UPDATE_POST,
  'publishPost': PUBLISH_POST,
  'unpublishPost': UNPUBLISH_POST,
  'deletePost': DELETE_POST,
  'createProduct': CREATE_PRODUCT,
  'updateProduct': UPDATE_PRODUCT,
  'publishProduct': PUBLISH_PRODUCT,
  'unpublishProduct': UNPUBLISH_PRODUCT,
  'deleteProduct': DELETE_PRODUCT,
  updateUser: UPDATE_USER,
};

export function useWebsiteMutation() {
  const environment = useRelayEnvironment();
  return (action: string, kind: string, input: Record<string, unknown>): Promise<Record<string, unknown>> => new Promise((resolve, reject) => {
    const mutation = OPERATIONS[action + kind];
    if (!mutation) { reject(new Error('Unsupported content operation.')); return; }
    commitMutation<{ response: Record<string, unknown>; variables: { input: Record<string, unknown> } }>(environment, {
      mutation, variables: { input },
      onCompleted: (response, errors) => {
        if (errors?.length) reject(new Error(errors.map(error => error.message).join(' ')));
        else resolve(response as Record<string, unknown>);
      },
      onError: reject,
    });
  });
}
