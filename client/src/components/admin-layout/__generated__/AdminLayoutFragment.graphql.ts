/**
 * @generated SignedSource<<f185a6293a555764c3ac685d6ff1710e>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type AdminLayoutFragment$data = {
  readonly itemPages: {
    readonly nodes: ReadonlyArray<{
      readonly defaultItemKind: string | null | undefined;
      readonly itemCount: number;
      readonly slug: string;
      readonly title: string;
    } | null | undefined> | null | undefined;
  } | null | undefined;
  readonly pageCount: {
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

const node: ReaderFragment = {
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
              "name": "defaultItemKind",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "itemCount",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": "pages(first:100)"
    }
  ],
  "type": "RootQuery",
  "abstractKey": null
};

(node as any).hash = "8f27095ac7cb0b6bdb346d1128c1aa3d";

export default node;
