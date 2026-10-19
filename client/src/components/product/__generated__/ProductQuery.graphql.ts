/**
 * @generated SignedSource<<a122da48182ab5d4d9f445847fd26923>>
 * @relayHash fe08f28a953ca5fd3e6b5df722114859
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID fe08f28a953ca5fd3e6b5df722114859

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type ProductQuery$variables = {
  slug: string;
};
export type ProductQuery$data = {
  readonly productBySlug: {
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
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};
export type ProductQuery = {
  response: ProductQuery$data;
  variables: ProductQuery$variables;
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
  "args": [
    {
      "kind": "Variable",
      "name": "slug",
      "variableName": "slug"
    }
  ],
  "concreteType": "Product",
  "kind": "LinkedField",
  "name": "productBySlug",
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
      "kind": "ScalarField",
      "name": "enquiryUrl",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v6 = {
  "kind": "Literal",
  "name": "first",
  "value": 100
},
v7 = [
  (v6/*:: as any*/)
],
v8 = [
  (v4/*:: as any*/),
  (v1/*:: as any*/)
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ProductQuery",
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
    "name": "ProductQuery",
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
        "args": [
          (v6/*:: as any*/),
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
        "args": (v7/*:: as any*/),
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
            "selections": (v8/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "posts(first:100)"
      },
      {
        "alias": "navigationProducts",
        "args": (v7/*:: as any*/),
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
            "selections": (v8/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": "products(first:100)"
      },
      (v5/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "fe08f28a953ca5fd3e6b5df722114859",
    "id": "fe08f28a953ca5fd3e6b5df722114859",
    "metadata": {},
    "name": "ProductQuery",
    "operationKind": "query",
    "text": "query ProductQuery(\n  $slug: String!\n) {\n  ...LayoutFragment\n  productBySlug(slug: $slug) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    enquiryUrl\n  }\n}\n\nfragment LayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n    role\n  }\n  navigationPages: placedPages(where: {home: false}, first: 100) {\n    nodes {\n      id\n      title\n      slug\n      accent\n    }\n  }\n  navigationPosts: posts(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n  navigationProducts: products(first: 100) {\n    nodes {\n      status\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "2354339f03cca9fc63785e40268a2e54";

export default node;
