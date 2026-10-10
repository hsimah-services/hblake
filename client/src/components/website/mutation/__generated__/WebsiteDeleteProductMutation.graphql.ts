/**
 * @generated SignedSource<<1e856e1f92920dbfbedfa80d4fc30a76>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type DeleteProductInput = {
  clientMutationId?: string | null | undefined;
  id: string;
};
export type WebsiteDeleteProductMutation$variables = {
  input: DeleteProductInput;
};
export type WebsiteDeleteProductMutation$data = {
  readonly deleteProduct: {
    readonly deletedId: string | null | undefined;
  } | null | undefined;
};
export type WebsiteDeleteProductMutation = {
  response: WebsiteDeleteProductMutation$data;
  variables: WebsiteDeleteProductMutation$variables;
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
    "concreteType": "DeleteProductPayload",
    "kind": "LinkedField",
    "name": "deleteProduct",
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
    "name": "WebsiteDeleteProductMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "WebsiteDeleteProductMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "d408652fb27e3c19736ff774e9aa13f3",
    "id": null,
    "metadata": {},
    "name": "WebsiteDeleteProductMutation",
    "operationKind": "mutation",
    "text": "mutation WebsiteDeleteProductMutation(\n  $input: DeleteProductInput!\n) {\n  deleteProduct(input: $input) {\n    deletedId\n  }\n}\n"
  }
};
})();

(node as any).hash = "9b46caf0370704462f539c38a9e69128";

export default node;
