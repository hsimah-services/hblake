/**
 * @generated SignedSource<<9d184225cbd416327893c7d173c18b0b>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AdminLayoutFragment$data = {
  readonly pageCount: {
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly postCount: {
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly productCount: {
    readonly totalCount: number | null | undefined;
  } | null | undefined;
  readonly viewer: {
    readonly displayName: string | null | undefined;
    readonly id: string | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "AdminLayoutFragment";
};
export type AdminLayoutFragment$key = {
  readonly " $data"?: AdminLayoutFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"AdminLayoutFragment">;
};

const node: ReaderFragment = (function(){
var v0 = [
  {
    "kind": "Literal",
    "name": "first",
    "value": 1
  }
],
v1 = [
  {
    "alias": null,
    "args": null,
    "kind": "ScalarField",
    "name": "totalCount",
    "storageKey": null
  }
];
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "AdminLayoutFragment",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "Viewer",
      "kind": "LinkedField",
      "name": "viewer",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "id",
          "storageKey": null
        },
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
      "args": (v0/*:: as any*/),
      "concreteType": "RootQueryToPageConnection",
      "kind": "LinkedField",
      "name": "pages",
      "plural": false,
      "selections": (v1/*:: as any*/),
      "storageKey": "pages(first:1)"
    },
    {
      "alias": "postCount",
      "args": (v0/*:: as any*/),
      "concreteType": "RootQueryToPostConnection",
      "kind": "LinkedField",
      "name": "posts",
      "plural": false,
      "selections": (v1/*:: as any*/),
      "storageKey": "posts(first:1)"
    },
    {
      "alias": "productCount",
      "args": (v0/*:: as any*/),
      "concreteType": "RootQueryToProductConnection",
      "kind": "LinkedField",
      "name": "products",
      "plural": false,
      "selections": (v1/*:: as any*/),
      "storageKey": "products(first:1)"
    }
  ],
  "type": "RootQuery",
  "abstractKey": null
};
})();

(node as any).hash = "cc3270282f14f05476ee090be393f0be";

export default node;
