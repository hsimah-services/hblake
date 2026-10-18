/**
 * @generated SignedSource<<bf553d1a82d0aa523af3b8eb31808e8a>>
 * @relayHash b70a123f9323c35adc2c338bc7bcab1b
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID b70a123f9323c35adc2c338bc7bcab1b

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type AdminQuery$variables = Record<PropertyKey, never>;
export type AdminQuery$data = {
  readonly pages: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined> | null | undefined;
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly posts: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined> | null | undefined;
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly products: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined> | null | undefined;
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly viewer: {
    readonly id: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};
export type AdminQuery = {
  response: AdminQuery$data;
  variables: AdminQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "totalCount",
  "storageKey": null
},
v3 = [
  (v0/*:: as any*/),
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "title",
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "status",
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
v4 = {
  "alias": null,
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToPageConnection",
  "kind": "LinkedField",
  "name": "pages",
  "plural": false,
  "selections": [
    (v2/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Page",
      "kind": "LinkedField",
      "name": "nodes",
      "plural": true,
      "selections": (v3/*:: as any*/),
      "storageKey": null
    }
  ],
  "storageKey": "pages(first:100)"
},
v5 = {
  "alias": null,
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToPostConnection",
  "kind": "LinkedField",
  "name": "posts",
  "plural": false,
  "selections": [
    (v2/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Post",
      "kind": "LinkedField",
      "name": "nodes",
      "plural": true,
      "selections": (v3/*:: as any*/),
      "storageKey": null
    }
  ],
  "storageKey": "posts(first:100)"
},
v6 = {
  "alias": null,
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToProductConnection",
  "kind": "LinkedField",
  "name": "products",
  "plural": false,
  "selections": [
    (v2/*:: as any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "Product",
      "kind": "LinkedField",
      "name": "nodes",
      "plural": true,
      "selections": (v3/*:: as any*/),
      "storageKey": null
    }
  ],
  "storageKey": "products(first:100)"
},
v7 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
],
v8 = [
  (v2/*:: as any*/)
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "AdminLayoutFragment"
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*:: as any*/)
        ],
        "storageKey": null
      },
      (v4/*:: as any*/),
      (v5/*:: as any*/),
      (v6/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AdminQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "Viewer",
        "kind": "LinkedField",
        "name": "viewer",
        "plural": false,
        "selections": [
          (v0/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "displayName",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": "pageCount",
        "args": (v7/*:: as any*/),
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": (v8/*:: as any*/),
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "postCount",
        "args": (v7/*:: as any*/),
        "concreteType": "RootQueryToPostConnection",
        "kind": "LinkedField",
        "name": "posts",
        "plural": false,
        "selections": (v8/*:: as any*/),
        "storageKey": "posts(first:1)"
      },
      {
        "alias": "productCount",
        "args": (v7/*:: as any*/),
        "concreteType": "RootQueryToProductConnection",
        "kind": "LinkedField",
        "name": "products",
        "plural": false,
        "selections": (v8/*:: as any*/),
        "storageKey": "products(first:1)"
      },
      (v4/*:: as any*/),
      (v5/*:: as any*/),
      (v6/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "b70a123f9323c35adc2c338bc7bcab1b",
    "id": "b70a123f9323c35adc2c338bc7bcab1b",
    "metadata": {},
    "name": "AdminQuery",
    "operationKind": "query",
    "text": "query AdminQuery {\n  ...AdminLayoutFragment\n  viewer {\n    id\n  }\n  pages(first: 100) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  posts(first: 100) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  products(first: 100) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  postCount: posts(first: 1) {\n    totalCount\n  }\n  productCount: products(first: 1) {\n    totalCount\n  }\n}\n"
  }
};
})();

(node as any).hash = "25e28d46f03d81c682527026089742f3";

export default node;
