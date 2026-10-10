/**
 * @generated SignedSource<<a0290fce1534e27ddf853fc75e2dc19c>>
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
export type AdminPageDeleteMutation$variables = {
  input: DeletePageInput;
};
export type AdminPageDeleteMutation$data = {
  readonly deletePage: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type AdminPageDeleteMutation = {
  response: AdminPageDeleteMutation$data;
  variables: AdminPageDeleteMutation$variables;
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
    "name": "AdminPageDeleteMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AdminPageDeleteMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "39a49e7327cee3fc6384452af4cf2f9b",
    "id": null,
    "metadata": {},
    "name": "AdminPageDeleteMutation",
    "operationKind": "mutation",
    "text": "mutation AdminPageDeleteMutation(\n  $input: DeletePageInput!\n) {\n  deletePage(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "e3bbef58d30c13a560eacee50a4afabc";

export default node;
