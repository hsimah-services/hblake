/**
 * @generated SignedSource<<317b195648fbd49773a33e190cc9af34>>
 * @relayHash 9507ce88faf42861274aff138dfb666d
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 9507ce88faf42861274aff138dfb666d

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AdminPostCreateQuery$variables = Record<PropertyKey, never>;
export type AdminPostCreateQuery$data = {
  readonly viewer: {
    readonly id: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};
export type AdminPostCreateQuery = {
  response: AdminPostCreateQuery$data;
  variables: AdminPostCreateQuery$variables;
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
    "value": 1
  }
],
v2 = [
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
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminPostCreateQuery",
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
      }
    ],
    "type": "RootQuery",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "AdminPostCreateQuery",
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
        "args": (v1/*:: as any*/),
        "concreteType": "RootQueryToPageConnection",
        "kind": "LinkedField",
        "name": "pages",
        "plural": false,
        "selections": (v2/*:: as any*/),
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "postCount",
        "args": (v1/*:: as any*/),
        "concreteType": "RootQueryToPostConnection",
        "kind": "LinkedField",
        "name": "posts",
        "plural": false,
        "selections": (v2/*:: as any*/),
        "storageKey": "posts(first:1)"
      },
      {
        "alias": "productCount",
        "args": (v1/*:: as any*/),
        "concreteType": "RootQueryToProductConnection",
        "kind": "LinkedField",
        "name": "products",
        "plural": false,
        "selections": (v2/*:: as any*/),
        "storageKey": "products(first:1)"
      }
    ]
  },
  "params": {
    "cacheID": "9507ce88faf42861274aff138dfb666d",
    "id": "9507ce88faf42861274aff138dfb666d",
    "metadata": {},
    "name": "AdminPostCreateQuery",
    "operationKind": "query",
    "text": "query AdminPostCreateQuery {\n  ...AdminLayoutFragment\n  viewer {\n    id\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  postCount: posts(first: 1) {\n    totalCount\n  }\n  productCount: products(first: 1) {\n    totalCount\n  }\n}\n"
  }
};
})();

(node as any).hash = "11f2d9b02dd7a976a49acead62c332a5";

export default node;
