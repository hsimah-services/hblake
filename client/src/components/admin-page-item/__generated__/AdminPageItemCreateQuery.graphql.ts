/**
 * @generated SignedSource<<8ff59adc783cfbffc87c625c46c54e48>>
 * @relayHash 816de6cb94d21ad1432beca3ac3db2b6
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

// @relayRequestID 816de6cb94d21ad1432beca3ac3db2b6

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AdminPageItemCreateQuery$variables = {
  page: string;
};
export type AdminPageItemCreateQuery$data = {
  readonly pageBySlug: {
    readonly defaultItemKind: string | null | undefined;
    readonly id: string;
    readonly slug: string;
    readonly title: string;
  } | null | undefined;
  readonly viewer: {
    readonly id: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};
export type AdminPageItemCreateQuery = {
  response: AdminPageItemCreateQuery$data;
  variables: AdminPageItemCreateQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "page"
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
  "name": "defaultItemKind",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "slug",
      "variableName": "page"
    }
  ],
  "concreteType": "Page",
  "kind": "LinkedField",
  "name": "pageBySlug",
  "plural": false,
  "selections": [
    (v1/*:: as any*/),
    (v2/*:: as any*/),
    (v3/*:: as any*/),
    (v4/*:: as any*/)
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AdminPageItemCreateQuery",
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
          (v1/*:: as any*/)
        ],
        "storageKey": null
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
    "name": "AdminPageItemCreateQuery",
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
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "totalCount",
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:1)"
      },
      {
        "alias": "itemPages",
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
              (v2/*:: as any*/),
              (v3/*:: as any*/),
              (v4/*:: as any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "itemCount",
                "storageKey": null
              },
              (v1/*:: as any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": "pages(first:100)"
      },
      (v5/*:: as any*/)
    ]
  },
  "params": {
    "cacheID": "816de6cb94d21ad1432beca3ac3db2b6",
    "id": "816de6cb94d21ad1432beca3ac3db2b6",
    "metadata": {},
    "name": "AdminPageItemCreateQuery",
    "operationKind": "query",
    "text": "query AdminPageItemCreateQuery(\n  $page: String!\n) {\n  ...AdminLayoutFragment\n  viewer {\n    id\n  }\n  pageBySlug(slug: $page) {\n    id\n    title\n    slug\n    defaultItemKind\n  }\n}\n\nfragment AdminLayoutFragment on RootQuery {\n  viewer {\n    id\n    displayName\n  }\n  pageCount: pages(first: 1) {\n    totalCount\n  }\n  itemPages: pages(first: 100) {\n    nodes {\n      title\n      slug\n      defaultItemKind\n      itemCount\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "89290031ad85bbf13a52bab2069fad66";

export default node;
