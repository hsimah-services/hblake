/**
 * @generated SignedSource<<074af9124635f682d340bed5be92c613>>
 * @relayHash 888ac00703d0936daac4e6818de432d9
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 888ac00703d0936daac4e6818de432d9

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type PostQuery$variables = {
  slug: string;
};
export type PostQuery$data = {
  readonly newsOrder: {
    readonly nodes: ReadonlyArray<{
      readonly slug: string;
      readonly status: PublicationStatus;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly postBySlug: {
    readonly author: {
      readonly displayName: string;
    } | null | undefined;
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
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type PostQuery = {
  response: PostQuery$data;
  variables: PostQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "slug"
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
  "args": null,
  "kind": "ScalarField",
  "name": "displayName",
  "storageKey": null
},
v6 = {
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
    (v1/*:: as any*/),
    (v2/*:: as any*/),
    (v3/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "content",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "excerpt",
      "storageKey": null
    },
    (v4/*:: as any*/),
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
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "Author",
      "kind": "LinkedField",
      "name": "author",
      "plural": false,
      "selections": [
        (v5/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": null
},
v7 = {
  "kind": "Literal",
  "name": "first",
  "value": 100
},
v8 = [
  (v7/*:: as any*/)
],
v9 = [
  (v4/*:: as any*/),
  (v1/*:: as any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "PostQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "LayoutFragment"
      },
      (v6/*:: as any*/),
      {
        "alias": "newsOrder",
        "args": (v8/*:: as any*/),
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
              (v3/*:: as any*/),
              (v2/*:: as any*/),
              (v4/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      }
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
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
          (v1/*:: as any*/),
          (v5/*:: as any*/),
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
        "args": [
          (v7/*:: as any*/),
          {
            "kind": "Literal",
            "name": "where",
            "value": {
              "home": false
            }
          }
        ],
        "concreteType": "RootQueryToPlacedPagesConnection",
        "kind": "LinkedField",
        "name": "placedPages",
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
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "accent",
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "placedPages(first:100,where:{\"home\":false})"
      },
      {
        "alias": "navigationPosts",
        "args": (v8/*:: as any*/),
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
            "selections": (v9/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      },
      {
        "alias": "navigationProducts",
        "args": (v8/*:: as any*/),
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
            "selections": (v9/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "products(first:100)"
      },
      (v6/*:: as any*/),
      {
        "alias": "newsOrder",
        "args": (v8/*:: as any*/),
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
              (v3/*:: as any*/),
              (v2/*:: as any*/),
              (v4/*:: as any*/),
              (v1/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      }
    ]
  },
  "params": {
    "cacheID": "888ac00703d0936daac4e6818de432d9",
    "id": "888ac00703d0936daac4e6818de432d9",
    "metadata": {},
    "name": "PostQuery",
    "operationKind": "query",
    "text": "query PostQuery(\n  $slug: String!\n) {\n  ...LayoutFragment\n  postBySlug(slug: $slug) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    author {\n      displayName\n    }\n  }\n  newsOrder: posts(first: 100) {\n    nodes {\n      slug\n      title\n      status\n      id\n    }\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: placedPages(where: {home: false}, first: 100) {\n    nodes {\n      id\n      title\n      slug\n      accent\n    }\n  }\n  navigationPosts: posts(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n  navigationProducts: products(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "152a385b8f7a08772f5fec20a4f83db7";

export default node;
