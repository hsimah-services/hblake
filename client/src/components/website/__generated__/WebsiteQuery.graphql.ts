/**
 * @generated SignedSource<<2b52c47c4843ccd1ac5fd2d6afbe0256>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type UserRole = "ADMIN" | "EDITOR" | "%future added value";
export type WebsiteQuery$variables = {
  after?: string | null | undefined;
  id: string;
  page: boolean;
  pageId: boolean;
  post: boolean;
  postId: boolean;
  product: boolean;
  productId: boolean;
  profile: boolean;
  slug: string;
};
export type WebsiteQuery$data = {
  readonly adminPages: {
    readonly nodes: ReadonlyArray<{
      readonly excerpt: string;
      readonly id: string;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly adminUser?: {
    readonly active: boolean | null | undefined;
    readonly createdAt: string | null | undefined;
    readonly displayName: string | null | undefined;
    readonly email: string | null | undefined;
    readonly id: string;
    readonly role: UserRole | null | undefined;
    readonly updatedAt: string | null | undefined;
  } | null | undefined;
  readonly page?: {
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly pageBySlug?: {
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly pages: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly post?: {
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly postBySlug?: {
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly posts: {
    readonly nodes: ReadonlyArray<{
      readonly excerpt: string;
      readonly id: string;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly product?: {
    readonly content: string;
    readonly createdAt: string;
    readonly enquiryUrl: string | null | undefined;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly productBySlug?: {
    readonly content: string;
    readonly createdAt: string;
    readonly enquiryUrl: string | null | undefined;
    readonly excerpt: string;
    readonly id: string;
    readonly publishedAt: string | null | undefined;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly products: {
    readonly nodes: ReadonlyArray<{
      readonly excerpt: string;
      readonly id: string;
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
    readonly pageInfo: {
      readonly endCursor: string | null | undefined;
      readonly hasNextPage: boolean;
    };
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly viewer: {
    readonly displayName: string | null | undefined;
    readonly id: string | null | undefined;
    readonly role: UserRole | null | undefined;
  } | null | undefined;
};
export type WebsiteQuery = {
  response: WebsiteQuery$data;
  variables: WebsiteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "after"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "id"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "page"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "pageId"
},
v4 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "post"
},
v5 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "postId"
},
v6 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "product"
},
v7 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "productId"
},
v8 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "profile"
},
v9 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slug"
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v11 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "role",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v15 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v16 = [
  {
    "kind": "Variable",
    "name": "after",
    "variableName": "after"
  },
  {
    "kind": "Literal",
    "name": "first",
    "value": 20
  }
],
v17 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "excerpt",
  "storageKey": null
},
v18 = [
  (v10/*:: as any*/),
  (v13/*:: as any*/),
  (v14/*:: as any*/),
  (v17/*:: as any*/),
  (v15/*:: as any*/)
],
v19 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalCount",
  "storageKey": null
},
v20 = {
  "alias": null,
  "args": null,
  "concreteType": "PageInfo",
  "kind": "LinkedField",
  "name": "pageInfo",
  "plural": false,
  "selections": [
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "hasNextPage",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "endCursor",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v21 = [
  {
    "kind": "Variable",
    "name": "slug",
    "variableName": "slug"
  }
],
v22 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "content",
  "storageKey": null
},
v23 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "publishedAt",
  "storageKey": null
},
v24 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v25 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v26 = [
  (v10/*:: as any*/),
  (v13/*:: as any*/),
  (v14/*:: as any*/),
  (v22/*:: as any*/),
  (v17/*:: as any*/),
  (v15/*:: as any*/),
  (v23/*:: as any*/),
  (v24/*:: as any*/),
  (v25/*:: as any*/)
],
v27 = [
  (v10/*:: as any*/),
  (v13/*:: as any*/),
  (v14/*:: as any*/),
  (v22/*:: as any*/),
  (v17/*:: as any*/),
  (v15/*:: as any*/),
  (v23/*:: as any*/),
  (v24/*:: as any*/),
  (v25/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "enquiryUrl",
    "storageKey": null
  }
],
v28 = [
  {
    "kind": "Variable",
    "name": "id",
    "variableName": "id"
  }
],
v29 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Viewer",
    "kind": "LinkedField",
    "name": "viewer",
    "plural": false,
    "selections": [
      (v10/*:: as any*/),
      (v11/*:: as any*/),
      (v12/*:: as any*/)
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": [
      {
        "kind": "Literal",
        "name": "first",
        "value": 100
      }
    ],
    "concreteType": "RootQueryToPageConnection",
    "kind": "LinkedField",
    "name": "pages",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Page",
        "kind": "LinkedField",
        "name": "nodes",
        "plural": true,
        "selections": [
          (v10/*:: as any*/),
          (v13/*:: as any*/),
          (v14/*:: as any*/),
          (v15/*:: as any*/)
        ],
        "storageKey": null
      }
    ],
    "storageKey": "pages(first:100)"
  },
  {
    "alias": "adminPages",
    "args": (v16/*:: as any*/),
    "concreteType": "RootQueryToPageConnection",
    "kind": "LinkedField",
    "name": "pages",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Page",
        "kind": "LinkedField",
        "name": "nodes",
        "plural": true,
        "selections": (v18/*:: as any*/),
        "storageKey": null
      },
      (v19/*:: as any*/),
      (v20/*:: as any*/)
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": (v16/*:: as any*/),
    "concreteType": "RootQueryToPostConnection",
    "kind": "LinkedField",
    "name": "posts",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Post",
        "kind": "LinkedField",
        "name": "nodes",
        "plural": true,
        "selections": (v18/*:: as any*/),
        "storageKey": null
      },
      (v19/*:: as any*/),
      (v20/*:: as any*/)
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": (v16/*:: as any*/),
    "concreteType": "RootQueryToProductConnection",
    "kind": "LinkedField",
    "name": "products",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "nodes",
        "plural": true,
        "selections": (v18/*:: as any*/),
        "storageKey": null
      },
      (v19/*:: as any*/),
      (v20/*:: as any*/)
    ],
    "storageKey": null
  },
  {
    "condition": "page",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v21/*:: as any*/),
        "concreteType": "Page",
        "kind": "LinkedField",
        "name": "pageBySlug",
        "plural": false,
        "selections": (v26/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "post",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v21/*:: as any*/),
        "concreteType": "Post",
        "kind": "LinkedField",
        "name": "postBySlug",
        "plural": false,
        "selections": (v26/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "product",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v21/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "productBySlug",
        "plural": false,
        "selections": (v27/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "pageId",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v28/*:: as any*/),
        "concreteType": "Page",
        "kind": "LinkedField",
        "name": "page",
        "plural": false,
        "selections": (v26/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "postId",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v28/*:: as any*/),
        "concreteType": "Post",
        "kind": "LinkedField",
        "name": "post",
        "plural": false,
        "selections": (v26/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "productId",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v28/*:: as any*/),
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "product",
        "plural": false,
        "selections": (v27/*:: as any*/),
        "storageKey": null
      }
    ]
  },
  {
    "condition": "profile",
    "kind": "Condition",
    "passingValue": true,
    "selections": [
      {
        "alias": null,
        "args": (v28/*:: as any*/),
        "concreteType": "AdminUser",
        "kind": "LinkedField",
        "name": "adminUser",
        "plural": false,
        "selections": [
          (v10/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "email",
            "storageKey": null
          },
          (v11/*:: as any*/),
          (v12/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "active",
            "storageKey": null
          },
          (v24/*:: as any*/),
          (v25/*:: as any*/)
        ],
        "storageKey": null
      }
    ]
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/),
      (v4/*:: as any*/),
      (v5/*:: as any*/),
      (v6/*:: as any*/),
      (v7/*:: as any*/),
      (v8/*:: as any*/),
      (v9/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "WebsiteQuery",
    "selections": (v29/*:: as any*/),
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v9/*:: as any*/),
      (v0/*:: as any*/),
      (v2/*:: as any*/),
      (v4/*:: as any*/),
      (v6/*:: as any*/),
      (v3/*:: as any*/),
      (v5/*:: as any*/),
      (v7/*:: as any*/),
      (v8/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "WebsiteQuery",
    "selections": (v29/*:: as any*/)
  },
  "params": {
    "cacheID": "d2d218b70a27dbcb847657387fb6c6db",
    "id": null,
    "metadata": {},
    "name": "WebsiteQuery",
    "operationKind": "query",
    "text": "query WebsiteQuery(\n  $id: ID!\n  $slug: String!\n  $after: String\n  $page: Boolean!\n  $post: Boolean!\n  $product: Boolean!\n  $pageId: Boolean!\n  $postId: Boolean!\n  $productId: Boolean!\n  $profile: Boolean!\n) {\n  viewer {\n    id\n    displayName\n    role\n  }\n  pages(first: 100) {\n    nodes {\n      id\n      title\n      slug\n      status\n    }\n  }\n  adminPages: pages(first: 20, after: $after) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n    }\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  posts(first: 20, after: $after) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n    }\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  products(first: 20, after: $after) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n    }\n    totalCount\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  pageBySlug(slug: $slug) @include(if: $page) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n  postBySlug(slug: $slug) @include(if: $post) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n  productBySlug(slug: $slug) @include(if: $product) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    enquiryUrl\n  }\n  page(id: $id) @include(if: $pageId) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n  post(id: $id) @include(if: $postId) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n  product(id: $id) @include(if: $productId) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    enquiryUrl\n  }\n  adminUser(id: $id) @include(if: $profile) {\n    id\n    email\n    displayName\n    role\n    active\n    createdAt\n    updatedAt\n  }\n}\n"
  }
};
})();

(node as any).hash = "519ea354d901b706180e16c530efe638";

export default node;
