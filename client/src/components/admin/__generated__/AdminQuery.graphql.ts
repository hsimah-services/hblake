/**
 * @generated SignedSource<<2498a9eaaecd82242710a5a28dae2f11>>
 * @relayHash fe6ba302ad7792cfdc34a49b507cafbb
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID fe6ba302ad7792cfdc34a49b507cafbb

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type AdminQuery$variables = Record<PropertyKey, never>;
export type AdminQuery$data = {
  readonly itemPages: {
    readonly nodes: ReadonlyArray<{
      readonly defaultItemKind: string | null | undefined;
      readonly id: string;
      readonly itemCount: number;
      readonly publishedItemCount: number;
      readonly slug: string;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly items: {
    readonly nodes: ReadonlyArray<{
      readonly id: string;
      readonly kind: string;
      readonly page: {
        readonly slug: string;
      } | null | undefined;
      readonly status: PublicationStatus;
      readonly title: string;
      readonly updatedAt: string;
    } | null | undefined> | null | undefined;
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly pages: {
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
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
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
  "name": "updatedAt",
  "storageKey": null
},
v6 = {
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
      "selections": [
        (v0/*:: as any*/),
        (v3/*:: as any*/),
        (v4/*:: as any*/),
        (v5/*:: as any*/)
      ],
      "storageKey": null
    }
  ],
  "storageKey": "recentPages(first:5)"
},
v7 = [
  (v2/*:: as any*/)
],
v8 = {
  "alias": "publishedPages",
  "args": [
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
  "concreteType": "RootQueryToRecentPagesConnection",
  "kind": "LinkedField",
  "name": "recentPages",
  "plural": false,
  "selections": (v7/*:: as any*/),
  "storageKey": "recentPages(first:0,where:{\"status\":\"PUBLISHED\"})"
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kind",
  "storageKey": null
},
v10 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "slug",
  "storageKey": null
},
v11 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 100
  }
],
v12 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "defaultItemKind",
  "storageKey": null
},
v13 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "itemCount",
  "storageKey": null
},
v14 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "publishedItemCount",
  "storageKey": null
};
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
      (v6/*:: as any*/),
      (v8/*:: as any*/),
      {
        "alias": "items",
        "args": (v1/*:: as any*/),
        "concreteType": "RootQueryToRecentPageItemsConnection",
        "kind": "LinkedField",
        "name": "recentPageItems",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "PageItem",
            "kind": "LinkedField",
            "name": "nodes",
            "plural": true,
            "selections": [
              (v0/*:: as any*/),
              (v3/*:: as any*/),
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              (v9/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Page",
                "kind": "LinkedField",
                "name": "page",
                "plural": false,
                "selections": [
                  (v10/*:: as any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "recentPageItems(first:5)"
      },
      {
        "alias": "itemPages",
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
              (v0/*:: as any*/),
              (v3/*:: as any*/),
              (v10/*:: as any*/),
              (v12/*:: as any*/),
              (v13/*:: as any*/),
              (v14/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      }
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
        "args": [
          {
            "kind": "Literal",
            "name": "first",
            "value": 1
          }
        ],
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": (v7/*:: as any*/),
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "itemPages",
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
              (v3/*:: as any*/),
              (v10/*:: as any*/),
              (v12/*:: as any*/),
              (v13/*:: as any*/),
              (v0/*:: as any*/),
              (v14/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      },
      (v6/*:: as any*/),
      (v8/*:: as any*/),
      {
        "alias": "items",
        "args": (v1/*:: as any*/),
        "concreteType": "RootQueryToRecentPageItemsConnection",
        "kind": "LinkedField",
        "name": "recentPageItems",
        "plural": false,
        "selections": [
          (v2/*:: as any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "PageItem",
            "kind": "LinkedField",
            "name": "nodes",
            "plural": true,
            "selections": [
              (v0/*:: as any*/),
              (v3/*:: as any*/),
              (v4/*:: as any*/),
              (v5/*:: as any*/),
              (v9/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "Page",
                "kind": "LinkedField",
                "name": "page",
                "plural": false,
                "selections": [
                  (v10/*:: as any*/),
                  (v0/*:: as any*/)
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": "recentPageItems(first:5)"
      }
    ]
  },
  "params": {
    "cacheID": "fe6ba302ad7792cfdc34a49b507cafbb",
    "id": "fe6ba302ad7792cfdc34a49b507cafbb",
    "metadata": {},
    "name": "AdminQuery",
    "operationKind": "query",
    "text": "query AdminQuery {\n  ...AdminLayoutFragment\n  viewer {\n    id\n  }\n  pages: recentPages(first: 5) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n    }\n  }\n  publishedPages: recentPages(where: {status: PUBLISHED}, first: 0) {\n    totalCount\n  }\n  items: recentPageItems(first: 5) {\n    totalCount\n    nodes {\n      id\n      title\n      status\n      updatedAt\n      kind\n      page {\n        slug\n        id\n      }\n    }\n  }\n  itemPages: pages(first: 100) {\n    nodes {\n      id\n      title\n      slug\n      defaultItemKind\n      itemCount\n      publishedItemCount\n    }\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  itemPages: pages(first: 100) {\n    nodes {\n      title\n      slug\n      defaultItemKind\n      itemCount\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "84370227bbb73f3ce5c6ceac4a404ba1";

export default node;
