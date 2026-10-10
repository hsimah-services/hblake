/**
 * @generated SignedSource<<7c78d549892981e3910b5bd1c3e18372>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PostQuery$variables = {
  after?: string | null | undefined;
  detail: boolean;
  list: boolean;
  slug: string;
};
export type PostQuery$data = {
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
  readonly posts?: {
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
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type PostQuery = {
  response: PostQuery$data;
  variables: PostQuery$variables;
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
  "name": "detail"
},
v2 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "list"
},
v3 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "slug"
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "excerpt",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v9 = {
  "condition": "list",
  "kind": "Condition",
  "passingValue": true,
  "selections": [
    {
      "alias": null,
      "args": [
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
          "selections": [
            (v4/*:: as any*/),
            (v5/*:: as any*/),
            (v6/*:: as any*/),
            (v7/*:: as any*/),
            (v8/*:: as any*/)
          ],
          "storageKey": null
        },
        {
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
        }
      ],
      "storageKey": null
    }
  ]
},
v10 = {
  "condition": "detail",
  "kind": "Condition",
  "passingValue": true,
  "selections": [
    {
      "alias": null,
      "args": [
        {
          "kind": "Variable",
          "name": "slug",
          "variableName": "slug"
        }
      ],
      "concreteType": "Post",
      "kind": "LinkedField",
      "name": "postBySlug",
      "plural": false,
      "selections": [
        (v4/*:: as any*/),
        (v5/*:: as any*/),
        (v6/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "content",
          "storageKey": null
        },
        (v7/*:: as any*/),
        (v8/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "publishedAt",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "createdAt",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "updatedAt",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ]
},
v11 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v12 = [
  (v8/*:: as any*/),
  (v4/*:: as any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/),
      (v2/*:: as any*/),
      (v3/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "PostQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "LayoutFragment"
      },
      (v9/*:: as any*/),
      (v10/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v3/*:: as any*/),
      (v0/*:: as any*/),
      (v2/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "PostQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v4/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "role",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": "navigationPages",
        "args": (v11/*:: as any*/),
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
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              (v6/*:: as any*/),
              (v8/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      },
      {
        "alias": "navigationPosts",
        "args": (v11/*:: as any*/),
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
            "selections": (v12/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      },
      {
        "alias": "navigationProducts",
        "args": (v11/*:: as any*/),
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
            "selections": (v12/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "products(first:100)"
      },
      (v9/*:: as any*/),
      (v10/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "d4eb39c0aed86cc04053da8724a9d8fa",
    "id": null,
    "metadata": {},
    "name": "PostQuery",
    "operationKind": "query",
    "text": "query PostQuery(\n  $slug: String!\n  $after: String\n  $list: Boolean!\n  $detail: Boolean!\n) {\n  ...LayoutFragment\n  posts(first: 20, after: $after) @include(if: $list) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n  postBySlug(slug: $slug) @include(if: $detail) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: pages(first: 100) {\n    nodes {\n      id\n      title\n      slug\n      status\n    }\n  }\n  navigationPosts: posts(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n  navigationProducts: products(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "590212902eed63c0a69df7924bf285c0";

export default node;
