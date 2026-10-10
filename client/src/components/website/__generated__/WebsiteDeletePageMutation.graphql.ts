/**
 * @generated SignedSource<<f5d61cc5e4eef929a7bd53ca248c5de6>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeletePageInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type WebsiteDeletePageMutation$variables = {
  input: DeletePageInput;
};
export type WebsiteDeletePageMutation$data = {
  readonly deletePage: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type WebsiteDeletePageMutation = {
  response: WebsiteDeletePageMutation$data;
  variables: WebsiteDeletePageMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "DeletePagePayload",
    "kind": "LinkedField",
    "name": "deletePage",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "deletedId",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "WebsiteDeletePageMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "WebsiteDeletePageMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "7c5788b4d7072b5d75ac3f7070e445ed",
    "id": null,
    "metadata": {},
    "name": "WebsiteDeletePageMutation",
    "operationKind": "mutation",
    "text": "mutation WebsiteDeletePageMutation(\n  $input: DeletePageInput!\n) {\n  deletePage(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "1df963c2706ebfec54923a396b54b1e2";

export default node;
