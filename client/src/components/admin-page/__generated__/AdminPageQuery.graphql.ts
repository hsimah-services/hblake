/**
 * @generated SignedSource<<d4ac2ca533dbb7879c592b69a535530b>>
 * @relayHash afeea4bbb1763e1df2fb425509d3b68e
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID afeea4bbb1763e1df2fb425509d3b68e

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type PublicationStatus = "DRAFT" | "PUBLISHED" | "%future added value";
export type AdminPageQuery$variables = {
  id: string;
};
export type AdminPageQuery$data = {
  readonly page: {
    readonly accent: PageAccent;
    readonly content: string;
    readonly createdAt: string;
    readonly excerpt: string;
    readonly featureOnHome: boolean;
    readonly homeOrder: number;
    readonly id: string;
    readonly navigationOrder: number;
    readonly publishedAt: string | null | undefined;
    readonly showInNavigation: boolean;
    readonly slug: string;
    readonly status: PublicationStatus;
    readonly title: string;
    readonly updatedAt: string;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};
export type AdminPageQuery = {
  response: AdminPageQuery$data;
  variables: AdminPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
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
  "args": [
    {
      "kind": "Variable",
      "name": "id",
      "variableName": "id"
    }
  ],
  "concreteType": "Page",
  "kind": "LinkedField",
  "name": "page",
  "plural": false,
  "selections": [
    (v1/*:: as any*/),
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
      "name": "slug",
      "storageKey": null
    },
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
      "name": "showInNavigation",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "navigationOrder",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "featureOnHome",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "homeOrder",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "accent",
      "storageKey": null
    }
  ],
  "storageKey": null
},
v3 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
],
v4 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "totalCount",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminPageQuery",
    "selections": [
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "AdminLayoutFragment"
      },
      (v2/*:: as any*/)
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageQuery",
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
          }
        ],
        "storageKey": null
      },
      {
        "alias": "pageCount",
        "args": (v3/*:: as any*/),
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": (v4/*:: as any*/),
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "postCount",
        "args": (v3/*:: as any*/),
        "concreteType": "RootQueryToPostConnection",
        "kind": "LinkedField",
        "name": "posts",
        "plural": false,
        "selections": (v4/*:: as any*/),
        "storageKey": "posts(first:1)"
      },
      {
        "alias": "productCount",
        "args": (v3/*:: as any*/),
        "concreteType": "RootQueryToProductConnection",
        "kind": "LinkedField",
        "name": "products",
        "plural": false,
        "selections": (v4/*:: as any*/),
        "storageKey": "products(first:1)"
      },
      (v2/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "afeea4bbb1763e1df2fb425509d3b68e",
    "id": "afeea4bbb1763e1df2fb425509d3b68e",
    "metadata": {},
    "name": "AdminPageQuery",
    "operationKind": "query",
    "text": "query AdminPageQuery(\n  $id: ID!\n) {\n  ...AdminLayoutFragment\n  page(id: $id) {\n    id\n    title\n    slug\n    content\n    excerpt\n    status\n    publishedAt\n    createdAt\n    updatedAt\n    showInNavigation\n    navigationOrder\n    featureOnHome\n    homeOrder\n    accent\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  postCount: posts(first: 1) {\n    totalCount\n  }\n  productCount: products(first: 1) {\n    totalCount\n  }\n}\n"
  }
};
})();

(node as any).hash = "0989f15f23a00a3b5b91e0a89e032264";

export default node;
