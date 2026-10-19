/**
 * @generated SignedSource<<32f2bc21f04d568c809d7e05fd726651>>
 * @relayHash df6da31fccdfbbb4d2e17d9a9535a8fe
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID df6da31fccdfbbb4d2e17d9a9535a8fe

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
  readonly publishedPages: {
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly publishedPosts: {
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly publishedProducts: {
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
    "value": 5
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
  "alias": "pages",
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToRecentPagesConnection",
  "kind": "LinkedField",
  "name": "recentPages",
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
  "storageKey": "recentPages(first:5)"
},
v5 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 0
  },
  {
    "kind": "Literal",
    "name": "where",
    "value": {
      "status": "PUBLISHED"
    }
  }
],
v6 = [
  (v2/*:: as any*/)
],
v7 = {
  "alias": "publishedPages",
  "args": (v5/*:: as any*/),
  "concreteType": "RootQueryToRecentPagesConnection",
  "kind": "LinkedField",
  "name": "recentPages",
  "plural": false,
  "selections": (v6/*:: as any*/),
  "storageKey": "recentPages(first:0,where:{\"status\":\"PUBLISHED\"})"
},
v8 = {
  "alias": "posts",
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToRecentPostsConnection",
  "kind": "LinkedField",
  "name": "recentPosts",
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
  "storageKey": "recentPosts(first:5)"
},
v9 = {
  "alias": "publishedPosts",
  "args": (v5/*:: as any*/),
  "concreteType": "RootQueryToRecentPostsConnection",
  "kind": "LinkedField",
  "name": "recentPosts",
  "plural": false,
  "selections": (v6/*:: as any*/),
  "storageKey": "recentPosts(first:0,where:{\"status\":\"PUBLISHED\"})"
},
v10 = {
  "alias": "products",
  "args": (v1/*:: as any*/),
  "concreteType": "RootQueryToRecentProductsConnection",
  "kind": "LinkedField",
  "name": "recentProducts",
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
  "storageKey": "recentProducts(first:5)"
},
v11 = {
  "alias": "publishedProducts",
  "args": (v5/*:: as any*/),
  "concreteType": "RootQueryToRecentProductsConnection",
  "kind": "LinkedField",
  "name": "recentProducts",
  "plural": false,
  "selections": (v6/*:: as any*/),
  "storageKey": "recentProducts(first:0,where:{\"status\":\"PUBLISHED\"})"
},
v12 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
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
      (v7/*:: as any*/),
      (v8/*:: as any*/),
      (v9/*:: as any*/),
      (v10/*:: as any*/),
      (v11/*:: as any*/)
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
        "args": (v12/*:: as any*/),
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": (v6/*:: as any*/),
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "postCount",
        "args": (v12/*:: as any*/),
        "concreteType": "RootQueryToPostConnection",
        "kind": "LinkedField",
        "name": "posts",
        "plural": false,
        "selections": (v6/*:: as any*/),
        "storageKey": "posts(first:1)"
      },
      {
        "alias": "productCount",
        "args": (v12/*:: as any*/),
        "concreteType": "RootQueryToProductConnection",
        "kind": "LinkedField",
        "name": "products",
        "plural": false,
        "selections": (v6/*:: as any*/),
        "storageKey": "products(first:1)"
      },
      (v4/*:: as any*/),
      (v7/*:: as any*/),
      (v8/*:: as any*/),
      (v9/*:: as any*/),
      (v10/*:: as any*/),
      (v11/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "df6da31fccdfbbb4d2e17d9a9535a8fe",
    "id": "df6da31fccdfbbb4d2e17d9a9535a8fe",
    "metadata": {},
    "name": "AdminQuery",
    "operationKind": "query",
    "text": "query AdminQuery {\n  ...AdminLayoutFragment\n  viewer {\n    id\n  }\n  pages: recentPages(first: 5) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  publishedPages: recentPages(where: {status: PUBLISHED}, first: 0) {\n    totalCount\n  }\n  posts: recentPosts(first: 5) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  publishedPosts: recentPosts(where: {status: PUBLISHED}, first: 0) {\n    totalCount\n  }\n  products: recentProducts(first: 5) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  publishedProducts: recentProducts(where: {status: PUBLISHED}, first: 0) {\n    totalCount\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  postCount: posts(first: 1) {\n    totalCount\n  }\n  productCount: products(first: 1) {\n    totalCount\n  }\n}\n"
  }
};
})();

(node as any).hash = "fe451ddd39e2d8ddec5b40a7b5a8745f";

export default node;
