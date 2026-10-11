/**
 * @generated SignedSource<<59ca16286712bef66e2f3e3c704a5161>>
 * @relayHash 2f2bc11533eac7f3e47d5bd851ba653c
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 2f2bc11533eac7f3e47d5bd851ba653c

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PostListQuery$variables = {
  after?: string | null | undefined;
};
export type PostListQuery$data = {
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
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type PostListQuery = {
  response: PostListQuery$data;
  variables: PostListQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "after"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v5 = {
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
        (v1/*:: as any*/),
        (v2/*:: as any*/),
        (v3/*:: as any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "excerpt",
          "storageKey": null
        },
        (v4/*:: as any*/)
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
},
v6 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v7 = [
  (v4/*:: as any*/),
  (v1/*:: as any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PostListQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "LayoutFragment"
      },
      (v5/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "PostListQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v1/*:: as any*/),
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
        "args": (v6/*:: as any*/),
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
              (v1/*:: as any*/),
              (v2/*:: as any*/),
              (v3/*:: as any*/),
              (v4/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      },
      {
        "alias": "navigationPosts",
        "args": (v6/*:: as any*/),
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
            "selections": (v7/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      },
      {
        "alias": "navigationProducts",
        "args": (v6/*:: as any*/),
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
            "selections": (v7/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "products(first:100)"
      },
      (v5/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "2f2bc11533eac7f3e47d5bd851ba653c",
    "id": "2f2bc11533eac7f3e47d5bd851ba653c",
    "metadata": {},
    "name": "PostListQuery",
    "operationKind": "query",
    "text": "query PostListQuery(\n  $after: String\n) {\n  ...LayoutFragment\n  posts(first: 20, after: $after) {\n    nodes {\n      id\n      title\n      slug\n      excerpt\n      status\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: pages(first: 100) {\n    nodes {\n      id\n      title\n      slug\n      status\n    }\n  }\n  navigationPosts: posts(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n  navigationProducts: products(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b590d240ef1a4916a6398dbd21953b9e";

export default node;
