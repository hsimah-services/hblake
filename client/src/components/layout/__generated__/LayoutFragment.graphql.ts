/**
 * @generated SignedSource<<e82bf0c2c4e61c201410c3e8876812c7>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type PageAccent = "BERRY" | "BLUE" | "GREEN" | "INK" | "ORANGE" | "%future added value";
export type UserRole = "ADMIN" | "EDITOR" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LayoutFragment$data = {
  readonly navigationPages: {
    readonly nodes: ReadonlyArray<{
      readonly accent: PageAccent;
      readonly id: string;
      readonly slug: string;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly viewer: {
    readonly displayName: string | null | undefined;
    readonly id: string | null | undefined;
    readonly role: UserRole | null | undefined;
  } | null | undefined;
  readonly " $fragmentType": "LayoutFragment";
};
export type LayoutFragment$key = {
  readonly " $data"?: LayoutFragment$data;
  readonly " $fragmentSpreads": FragmentRefs<"LayoutFragment">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "LayoutFragment",
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
        {
          "kind": "Literal",
          "name": "first",
          "value": 100
        },
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
              "name": "slug",
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
        }
      ],
      "storageKey": "placedPages(first:100,where:{\"home\":false})"
    }
  ],
  "type": "RootQuery",
  "abstractKey": null
};
})();

(node as any).hash = "5748de58f88cb6542bada2850bb632a1";

export default node;
