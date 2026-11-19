import {createRequire as __bnbRequire} from "node:module"; const require=__bnbRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/version.js
var version;
var init_version = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/version.js"() {
    version = "1.2.3";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/errors.js
var BaseError;
var init_errors = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/errors.js"() {
    init_version();
    BaseError = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = args.cause instanceof _BaseError ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
        const docsPath8 = args.cause instanceof _BaseError ? args.cause.docsPath || args.docsPath : args.docsPath;
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsPath8 ? [`Docs: https://abitype.dev${docsPath8}`] : [],
          ...details ? [`Details: ${details}`] : [],
          `Version: abitype@${version}`
        ].join("\n");
        super(message);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "AbiTypeError"
        });
        if (args.cause)
          this.cause = args.cause;
        this.details = details;
        this.docsPath = docsPath8;
        this.metaMessages = args.metaMessages;
        this.shortMessage = shortMessage;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/regex.js
function execTyped(regex, string) {
  const match = regex.exec(string);
  return match?.groups;
}
var bytesRegex, integerRegex, isTupleRegex;
var init_regex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/regex.js"() {
    bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
    integerRegex = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
    isTupleRegex = /^\(.+?\).*?$/;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
function formatAbiParameter(abiParameter) {
  let type = abiParameter.type;
  if (tupleRegex.test(abiParameter.type) && "components" in abiParameter) {
    type = "(";
    const length = abiParameter.components.length;
    for (let i = 0; i < length; i++) {
      const component = abiParameter.components[i];
      type += formatAbiParameter(component);
      if (i < length - 1)
        type += ", ";
    }
    const result = execTyped(tupleRegex, abiParameter.type);
    type += `)${result?.array || ""}`;
    return formatAbiParameter({
      ...abiParameter,
      type
    });
  }
  if ("indexed" in abiParameter && abiParameter.indexed)
    type = `${type} indexed`;
  if (abiParameter.name)
    return `${type} ${abiParameter.name}`;
  return type;
}
var tupleRegex;
var init_formatAbiParameter = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js"() {
    init_regex();
    tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
function formatAbiParameters(abiParameters) {
  let params = "";
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    params += formatAbiParameter(abiParameter);
    if (i !== length - 1)
      params += ", ";
  }
  return params;
}
var init_formatAbiParameters = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js"() {
    init_formatAbiParameter();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
function formatAbiItem(abiItem) {
  if (abiItem.type === "function")
    return `function ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability && abiItem.stateMutability !== "nonpayable" ? ` ${abiItem.stateMutability}` : ""}${abiItem.outputs?.length ? ` returns (${formatAbiParameters(abiItem.outputs)})` : ""}`;
  if (abiItem.type === "event")
    return `event ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "error")
    return `error ${abiItem.name}(${formatAbiParameters(abiItem.inputs)})`;
  if (abiItem.type === "constructor")
    return `constructor(${formatAbiParameters(abiItem.inputs)})${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  if (abiItem.type === "fallback")
    return `fallback() external${abiItem.stateMutability === "payable" ? " payable" : ""}`;
  return "receive() external payable";
}
var init_formatAbiItem = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js"() {
    init_formatAbiParameters();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
function isErrorSignature(signature) {
  return errorSignatureRegex.test(signature);
}
function execErrorSignature(signature) {
  return execTyped(errorSignatureRegex, signature);
}
function isEventSignature(signature) {
  return eventSignatureRegex.test(signature);
}
function execEventSignature(signature) {
  return execTyped(eventSignatureRegex, signature);
}
function isFunctionSignature(signature) {
  return functionSignatureRegex.test(signature);
}
function execFunctionSignature(signature) {
  return execTyped(functionSignatureRegex, signature);
}
function isStructSignature(signature) {
  return structSignatureRegex.test(signature);
}
function execStructSignature(signature) {
  return execTyped(structSignatureRegex, signature);
}
function isConstructorSignature(signature) {
  return constructorSignatureRegex.test(signature);
}
function execConstructorSignature(signature) {
  return execTyped(constructorSignatureRegex, signature);
}
function isFallbackSignature(signature) {
  return fallbackSignatureRegex.test(signature);
}
function execFallbackSignature(signature) {
  return execTyped(fallbackSignatureRegex, signature);
}
function isReceiveSignature(signature) {
  return receiveSignatureRegex.test(signature);
}
var errorSignatureRegex, eventSignatureRegex, functionSignatureRegex, structSignatureRegex, constructorSignatureRegex, fallbackSignatureRegex, receiveSignatureRegex, modifiers, eventModifiers, functionModifiers;
var init_signatures = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js"() {
    init_regex();
    errorSignatureRegex = /^error (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    eventSignatureRegex = /^event (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    functionSignatureRegex = /^function (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns\s?\((?<returns>.*?)\))?$/;
    structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
    constructorSignatureRegex = /^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/;
    fallbackSignatureRegex = /^fallback\(\) external(?:\s(?<stateMutability>payable{1}))?$/;
    receiveSignatureRegex = /^receive\(\) external payable$/;
    modifiers = /* @__PURE__ */ new Set([
      "memory",
      "indexed",
      "storage",
      "calldata"
    ]);
    eventModifiers = /* @__PURE__ */ new Set(["indexed"]);
    functionModifiers = /* @__PURE__ */ new Set([
      "calldata",
      "memory",
      "storage"
    ]);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
var InvalidAbiItemError, UnknownTypeError, UnknownSolidityTypeError;
var init_abiItem = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js"() {
    init_errors();
    InvalidAbiItemError = class extends BaseError {
      constructor({ signature }) {
        super("Failed to parse ABI item.", {
          details: `parseAbiItem(${JSON.stringify(signature, null, 2)})`,
          docsPath: "/api/human#parseabiitem-1"
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidAbiItemError"
        });
      }
    };
    UnknownTypeError = class extends BaseError {
      constructor({ type }) {
        super("Unknown type.", {
          metaMessages: [
            `Type "${type}" is not a valid ABI type. Perhaps you forgot to include a struct signature?`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownTypeError"
        });
      }
    };
    UnknownSolidityTypeError = class extends BaseError {
      constructor({ type }) {
        super("Unknown type.", {
          metaMessages: [`Type "${type}" is not a valid ABI type.`]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownSolidityTypeError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
var InvalidAbiParametersError, InvalidParameterError, SolidityProtectedKeywordError, InvalidModifierError, InvalidFunctionModifierError, InvalidAbiTypeParameterError;
var init_abiParameter = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js"() {
    init_errors();
    InvalidAbiParametersError = class extends BaseError {
      constructor({ params }) {
        super("Failed to parse ABI parameters.", {
          details: `parseAbiParameters(${JSON.stringify(params, null, 2)})`,
          docsPath: "/api/human#parseabiparameters-1"
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidAbiParametersError"
        });
      }
    };
    InvalidParameterError = class extends BaseError {
      constructor({ param }) {
        super("Invalid ABI parameter.", {
          details: param
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidParameterError"
        });
      }
    };
    SolidityProtectedKeywordError = class extends BaseError {
      constructor({ param, name }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `"${name}" is a protected Solidity keyword. More info: https://docs.soliditylang.org/en/latest/cheatsheet.html`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "SolidityProtectedKeywordError"
        });
      }
    };
    InvalidModifierError = class extends BaseError {
      constructor({ param, type, modifier }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidModifierError"
        });
      }
    };
    InvalidFunctionModifierError = class extends BaseError {
      constructor({ param, type, modifier }) {
        super("Invalid ABI parameter.", {
          details: param,
          metaMessages: [
            `Modifier "${modifier}" not allowed${type ? ` in "${type}" type` : ""}.`,
            `Data location can only be specified for array, struct, or mapping types, but "${modifier}" was given.`
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidFunctionModifierError"
        });
      }
    };
    InvalidAbiTypeParameterError = class extends BaseError {
      constructor({ abiParameter }) {
        super("Invalid ABI parameter.", {
          details: JSON.stringify(abiParameter, null, 2),
          metaMessages: ["ABI parameter type is invalid."]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidAbiTypeParameterError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/signature.js
var InvalidSignatureError, UnknownSignatureError, InvalidStructSignatureError;
var init_signature = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/signature.js"() {
    init_errors();
    InvalidSignatureError = class extends BaseError {
      constructor({ signature, type }) {
        super(`Invalid ${type} signature.`, {
          details: signature
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidSignatureError"
        });
      }
    };
    UnknownSignatureError = class extends BaseError {
      constructor({ signature }) {
        super("Unknown signature.", {
          details: signature
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "UnknownSignatureError"
        });
      }
    };
    InvalidStructSignatureError = class extends BaseError {
      constructor({ signature }) {
        super("Invalid struct signature.", {
          details: signature,
          metaMessages: ["No properties exist."]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidStructSignatureError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/struct.js
var CircularReferenceError;
var init_struct = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/struct.js"() {
    init_errors();
    CircularReferenceError = class extends BaseError {
      constructor({ type }) {
        super("Circular reference detected.", {
          metaMessages: [`Struct "${type}" is a circular reference.`]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "CircularReferenceError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
var InvalidParenthesisError;
var init_splitParameters = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js"() {
    init_errors();
    InvalidParenthesisError = class extends BaseError {
      constructor({ current, depth }) {
        super("Unbalanced parentheses.", {
          metaMessages: [
            `"${current.trim()}" has too many ${depth > 0 ? "opening" : "closing"} parentheses.`
          ],
          details: `Depth "${depth}"`
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "InvalidParenthesisError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/cache.js
function getParameterCacheKey(param, type, structs) {
  let structKey = "";
  if (structs)
    for (const struct of Object.entries(structs)) {
      if (!struct)
        continue;
      let propertyKey = "";
      for (const property of struct[1]) {
        propertyKey += `[${property.type}${property.name ? `:${property.name}` : ""}]`;
      }
      structKey += `(${struct[0]}{${propertyKey}})`;
    }
  if (type)
    return `${type}:${param}${structKey}`;
  return `${param}${structKey}`;
}
var parameterCache;
var init_cache = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/cache.js"() {
    parameterCache = /* @__PURE__ */ new Map([
      // Unnamed
      ["address", { type: "address" }],
      ["bool", { type: "bool" }],
      ["bytes", { type: "bytes" }],
      ["bytes32", { type: "bytes32" }],
      ["int", { type: "int256" }],
      ["int256", { type: "int256" }],
      ["string", { type: "string" }],
      ["uint", { type: "uint256" }],
      ["uint8", { type: "uint8" }],
      ["uint16", { type: "uint16" }],
      ["uint24", { type: "uint24" }],
      ["uint32", { type: "uint32" }],
      ["uint64", { type: "uint64" }],
      ["uint96", { type: "uint96" }],
      ["uint112", { type: "uint112" }],
      ["uint160", { type: "uint160" }],
      ["uint192", { type: "uint192" }],
      ["uint256", { type: "uint256" }],
      // Named
      ["address owner", { type: "address", name: "owner" }],
      ["address to", { type: "address", name: "to" }],
      ["bool approved", { type: "bool", name: "approved" }],
      ["bytes _data", { type: "bytes", name: "_data" }],
      ["bytes data", { type: "bytes", name: "data" }],
      ["bytes signature", { type: "bytes", name: "signature" }],
      ["bytes32 hash", { type: "bytes32", name: "hash" }],
      ["bytes32 r", { type: "bytes32", name: "r" }],
      ["bytes32 root", { type: "bytes32", name: "root" }],
      ["bytes32 s", { type: "bytes32", name: "s" }],
      ["string name", { type: "string", name: "name" }],
      ["string symbol", { type: "string", name: "symbol" }],
      ["string tokenURI", { type: "string", name: "tokenURI" }],
      ["uint tokenId", { type: "uint256", name: "tokenId" }],
      ["uint8 v", { type: "uint8", name: "v" }],
      ["uint256 balance", { type: "uint256", name: "balance" }],
      ["uint256 tokenId", { type: "uint256", name: "tokenId" }],
      ["uint256 value", { type: "uint256", name: "value" }],
      // Indexed
      [
        "event:address indexed from",
        { type: "address", name: "from", indexed: true }
      ],
      ["event:address indexed to", { type: "address", name: "to", indexed: true }],
      [
        "event:uint indexed tokenId",
        { type: "uint256", name: "tokenId", indexed: true }
      ],
      [
        "event:uint256 indexed tokenId",
        { type: "uint256", name: "tokenId", indexed: true }
      ]
    ]);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/utils.js
function parseSignature(signature, structs = {}) {
  if (isFunctionSignature(signature))
    return parseFunctionSignature(signature, structs);
  if (isEventSignature(signature))
    return parseEventSignature(signature, structs);
  if (isErrorSignature(signature))
    return parseErrorSignature(signature, structs);
  if (isConstructorSignature(signature))
    return parseConstructorSignature(signature, structs);
  if (isFallbackSignature(signature))
    return parseFallbackSignature(signature);
  if (isReceiveSignature(signature))
    return {
      type: "receive",
      stateMutability: "payable"
    };
  throw new UnknownSignatureError({ signature });
}
function parseFunctionSignature(signature, structs = {}) {
  const match = execFunctionSignature(signature);
  if (!match)
    throw new InvalidSignatureError({ signature, type: "function" });
  const inputParams = splitParameters(match.parameters);
  const inputs = [];
  const inputLength = inputParams.length;
  for (let i = 0; i < inputLength; i++) {
    inputs.push(parseAbiParameter(inputParams[i], {
      modifiers: functionModifiers,
      structs,
      type: "function"
    }));
  }
  const outputs = [];
  if (match.returns) {
    const outputParams = splitParameters(match.returns);
    const outputLength = outputParams.length;
    for (let i = 0; i < outputLength; i++) {
      outputs.push(parseAbiParameter(outputParams[i], {
        modifiers: functionModifiers,
        structs,
        type: "function"
      }));
    }
  }
  return {
    name: match.name,
    type: "function",
    stateMutability: match.stateMutability ?? "nonpayable",
    inputs,
    outputs
  };
}
function parseEventSignature(signature, structs = {}) {
  const match = execEventSignature(signature);
  if (!match)
    throw new InvalidSignatureError({ signature, type: "event" });
  const params = splitParameters(match.parameters);
  const abiParameters = [];
  const length = params.length;
  for (let i = 0; i < length; i++)
    abiParameters.push(parseAbiParameter(params[i], {
      modifiers: eventModifiers,
      structs,
      type: "event"
    }));
  return { name: match.name, type: "event", inputs: abiParameters };
}
function parseErrorSignature(signature, structs = {}) {
  const match = execErrorSignature(signature);
  if (!match)
    throw new InvalidSignatureError({ signature, type: "error" });
  const params = splitParameters(match.parameters);
  const abiParameters = [];
  const length = params.length;
  for (let i = 0; i < length; i++)
    abiParameters.push(parseAbiParameter(params[i], { structs, type: "error" }));
  return { name: match.name, type: "error", inputs: abiParameters };
}
function parseConstructorSignature(signature, structs = {}) {
  const match = execConstructorSignature(signature);
  if (!match)
    throw new InvalidSignatureError({ signature, type: "constructor" });
  const params = splitParameters(match.parameters);
  const abiParameters = [];
  const length = params.length;
  for (let i = 0; i < length; i++)
    abiParameters.push(parseAbiParameter(params[i], { structs, type: "constructor" }));
  return {
    type: "constructor",
    stateMutability: match.stateMutability ?? "nonpayable",
    inputs: abiParameters
  };
}
function parseFallbackSignature(signature) {
  const match = execFallbackSignature(signature);
  if (!match)
    throw new InvalidSignatureError({ signature, type: "fallback" });
  return {
    type: "fallback",
    stateMutability: match.stateMutability ?? "nonpayable"
  };
}
function parseAbiParameter(param, options) {
  const parameterCacheKey = getParameterCacheKey(param, options?.type, options?.structs);
  if (parameterCache.has(parameterCacheKey))
    return parameterCache.get(parameterCacheKey);
  const isTuple = isTupleRegex.test(param);
  const match = execTyped(isTuple ? abiParameterWithTupleRegex : abiParameterWithoutTupleRegex, param);
  if (!match)
    throw new InvalidParameterError({ param });
  if (match.name && isSolidityKeyword(match.name))
    throw new SolidityProtectedKeywordError({ param, name: match.name });
  const name = match.name ? { name: match.name } : {};
  const indexed = match.modifier === "indexed" ? { indexed: true } : {};
  const structs = options?.structs ?? {};
  let type;
  let components = {};
  if (isTuple) {
    type = "tuple";
    const params = splitParameters(match.type);
    const components_ = [];
    const length = params.length;
    for (let i = 0; i < length; i++) {
      components_.push(parseAbiParameter(params[i], { structs }));
    }
    components = { components: components_ };
  } else if (match.type in structs) {
    type = "tuple";
    components = { components: structs[match.type] };
  } else if (dynamicIntegerRegex.test(match.type)) {
    type = `${match.type}256`;
  } else if (match.type === "address payable") {
    type = "address";
  } else {
    type = match.type;
    if (!(options?.type === "struct") && !isSolidityType(type))
      throw new UnknownSolidityTypeError({ type });
  }
  if (match.modifier) {
    if (!options?.modifiers?.has?.(match.modifier))
      throw new InvalidModifierError({
        param,
        type: options?.type,
        modifier: match.modifier
      });
    if (functionModifiers.has(match.modifier) && !isValidDataLocation(type, !!match.array))
      throw new InvalidFunctionModifierError({
        param,
        type: options?.type,
        modifier: match.modifier
      });
  }
  const abiParameter = {
    type: `${type}${match.array ?? ""}`,
    ...name,
    ...indexed,
    ...components
  };
  parameterCache.set(parameterCacheKey, abiParameter);
  return abiParameter;
}
function splitParameters(params, result = [], current = "", depth = 0) {
  const length = params.trim().length;
  for (let i = 0; i < length; i++) {
    const char = params[i];
    const tail = params.slice(i + 1);
    switch (char) {
      case ",":
        return depth === 0 ? splitParameters(tail, [...result, current.trim()]) : splitParameters(tail, result, `${current}${char}`, depth);
      case "(":
        return splitParameters(tail, result, `${current}${char}`, depth + 1);
      case ")":
        return splitParameters(tail, result, `${current}${char}`, depth - 1);
      default:
        return splitParameters(tail, result, `${current}${char}`, depth);
    }
  }
  if (current === "")
    return result;
  if (depth !== 0)
    throw new InvalidParenthesisError({ current, depth });
  result.push(current.trim());
  return result;
}
function isSolidityType(type) {
  return type === "address" || type === "bool" || type === "function" || type === "string" || bytesRegex.test(type) || integerRegex.test(type);
}
function isSolidityKeyword(name) {
  return name === "address" || name === "bool" || name === "function" || name === "string" || name === "tuple" || bytesRegex.test(name) || integerRegex.test(name) || protectedKeywordsRegex.test(name);
}
function isValidDataLocation(type, isArray) {
  return isArray || type === "bytes" || type === "string" || type === "tuple";
}
var abiParameterWithoutTupleRegex, abiParameterWithTupleRegex, dynamicIntegerRegex, protectedKeywordsRegex;
var init_utils = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/utils.js"() {
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_splitParameters();
    init_cache();
    init_signatures();
    abiParameterWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*(?:\spayable)?)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
    abiParameterWithTupleRegex = /^\((?<type>.+?)\)(?<array>(?:\[\d*?\])+?)?(?:\s(?<modifier>calldata|indexed|memory|storage{1}))?(?:\s(?<name>[a-zA-Z$_][a-zA-Z0-9$_]*))?$/;
    dynamicIntegerRegex = /^u?int$/;
    protectedKeywordsRegex = /^(?:after|alias|anonymous|apply|auto|byte|calldata|case|catch|constant|copyof|default|defined|error|event|external|false|final|function|immutable|implements|in|indexed|inline|internal|let|mapping|match|memory|mutable|null|of|override|partial|private|promise|public|pure|reference|relocatable|return|returns|sizeof|static|storage|struct|super|supports|switch|this|true|try|typedef|typeof|var|view|virtual)$/;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/structs.js
function parseStructs(signatures) {
  const shallowStructs = {};
  const signaturesLength = signatures.length;
  for (let i = 0; i < signaturesLength; i++) {
    const signature = signatures[i];
    if (!isStructSignature(signature))
      continue;
    const match = execStructSignature(signature);
    if (!match)
      throw new InvalidSignatureError({ signature, type: "struct" });
    const properties = match.properties.split(";");
    const components = [];
    const propertiesLength = properties.length;
    for (let k = 0; k < propertiesLength; k++) {
      const property = properties[k];
      const trimmed = property.trim();
      if (!trimmed)
        continue;
      const abiParameter = parseAbiParameter(trimmed, {
        type: "struct"
      });
      components.push(abiParameter);
    }
    if (!components.length)
      throw new InvalidStructSignatureError({ signature });
    shallowStructs[match.name] = components;
  }
  const resolvedStructs = {};
  const entries = Object.entries(shallowStructs);
  const entriesLength = entries.length;
  for (let i = 0; i < entriesLength; i++) {
    const [name, parameters] = entries[i];
    resolvedStructs[name] = resolveStructs(parameters, shallowStructs);
  }
  return resolvedStructs;
}
function resolveStructs(abiParameters = [], structs = {}, ancestors = /* @__PURE__ */ new Set()) {
  const components = [];
  const length = abiParameters.length;
  for (let i = 0; i < length; i++) {
    const abiParameter = abiParameters[i];
    const isTuple = isTupleRegex.test(abiParameter.type);
    if (isTuple)
      components.push(abiParameter);
    else {
      const match = execTyped(typeWithoutTupleRegex, abiParameter.type);
      if (!match?.type)
        throw new InvalidAbiTypeParameterError({ abiParameter });
      const { array, type } = match;
      if (type in structs) {
        if (ancestors.has(type))
          throw new CircularReferenceError({ type });
        components.push({
          ...abiParameter,
          type: `tuple${array ?? ""}`,
          components: resolveStructs(structs[type], structs, /* @__PURE__ */ new Set([...ancestors, type]))
        });
      } else {
        if (isSolidityType(type))
          components.push(abiParameter);
        else
          throw new UnknownTypeError({ type });
      }
    }
  }
  return components;
}
var typeWithoutTupleRegex;
var init_structs = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/runtime/structs.js"() {
    init_regex();
    init_abiItem();
    init_abiParameter();
    init_signature();
    init_struct();
    init_signatures();
    init_utils();
    typeWithoutTupleRegex = /^(?<type>[a-zA-Z$_][a-zA-Z0-9$_]*)(?<array>(?:\[\d*?\])+?)?$/;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbi.js
function parseAbi(signatures) {
  const structs = parseStructs(signatures);
  const abi2 = [];
  const length = signatures.length;
  for (let i = 0; i < length; i++) {
    const signature = signatures[i];
    if (isStructSignature(signature))
      continue;
    abi2.push(parseSignature(signature, structs));
  }
  return abi2;
}
var init_parseAbi = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbi.js"() {
    init_signatures();
    init_structs();
    init_utils();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbiItem.js
function parseAbiItem(signature) {
  let abiItem;
  if (typeof signature === "string")
    abiItem = parseSignature(signature);
  else {
    const structs = parseStructs(signature);
    const length = signature.length;
    for (let i = 0; i < length; i++) {
      const signature_ = signature[i];
      if (isStructSignature(signature_))
        continue;
      abiItem = parseSignature(signature_, structs);
      break;
    }
  }
  if (!abiItem)
    throw new InvalidAbiItemError({ signature });
  return abiItem;
}
var init_parseAbiItem = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbiItem.js"() {
    init_abiItem();
    init_signatures();
    init_structs();
    init_utils();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js
function parseAbiParameters(params) {
  const abiParameters = [];
  if (typeof params === "string") {
    const parameters = splitParameters(params);
    const length = parameters.length;
    for (let i = 0; i < length; i++) {
      abiParameters.push(parseAbiParameter(parameters[i], { modifiers }));
    }
  } else {
    const structs = parseStructs(params);
    const length = params.length;
    for (let i = 0; i < length; i++) {
      const signature = params[i];
      if (isStructSignature(signature))
        continue;
      const parameters = splitParameters(signature);
      const length2 = parameters.length;
      for (let k = 0; k < length2; k++) {
        abiParameters.push(parseAbiParameter(parameters[k], { modifiers, structs }));
      }
    }
  }
  if (abiParameters.length === 0)
    throw new InvalidAbiParametersError({ params });
  return abiParameters;
}
var init_parseAbiParameters = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/human-readable/parseAbiParameters.js"() {
    init_abiParameter();
    init_signatures();
    init_structs();
    init_utils();
    init_utils();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/exports/index.js
var init_exports = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/abitype@1.2.3_zod@4.4.3/node_modules/abitype/dist/esm/exports/index.js"() {
    init_formatAbiItem();
    init_formatAbiParameters();
    init_parseAbi();
    init_parseAbiItem();
    init_parseAbiParameters();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/formatAbiItem.js
function formatAbiItem2(abiItem, { includeName = false } = {}) {
  if (abiItem.type !== "function" && abiItem.type !== "event" && abiItem.type !== "error")
    throw new InvalidDefinitionTypeError(abiItem.type);
  return `${abiItem.name}(${formatAbiParams(abiItem.inputs, { includeName })})`;
}
function formatAbiParams(params, { includeName = false } = {}) {
  if (!params)
    return "";
  return params.map((param) => formatAbiParam(param, { includeName })).join(includeName ? ", " : ",");
}
function formatAbiParam(param, { includeName }) {
  if (param.type.startsWith("tuple")) {
    return `(${formatAbiParams(param.components, { includeName })})${param.type.slice("tuple".length)}`;
  }
  return param.type + (includeName && param.name ? ` ${param.name}` : "");
}
var init_formatAbiItem2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/formatAbiItem.js"() {
    init_abi();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
  if (!value)
    return false;
  if (typeof value !== "string")
    return false;
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
var init_isHex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/isHex.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/size.js
function size(value) {
  if (isHex(value, { strict: false }))
    return Math.ceil((value.length - 2) / 2);
  return value.length;
}
var init_size = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/size.js"() {
    init_isHex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/version.js
var version2;
var init_version2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/version.js"() {
    version2 = "2.54.6";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/base.js
function walk(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
    return walk(err.cause, fn);
  return fn ? null : err;
}
var errorConfig, BaseError2;
var init_base = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/base.js"() {
    init_version2();
    errorConfig = {
      getDocsUrl: ({ docsBaseUrl, docsPath: docsPath8 = "", docsSlug }) => docsPath8 ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath8}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
      version: `viem@${version2}`
    };
    BaseError2 = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.details;
          if (args.cause?.message)
            return args.cause.message;
          return args.details;
        })();
        const docsPath8 = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.docsPath || args.docsPath;
          return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath: docsPath8 });
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsUrl ? [`Docs: ${docsUrl}`] : [],
          ...details ? [`Details: ${details}`] : [],
          ...errorConfig.version ? [`Version: ${errorConfig.version}`] : []
        ].join("\n");
        super(message, args.cause ? { cause: args.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "metaMessages", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.details = details;
        this.docsPath = docsPath8;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version2;
      }
      walk(fn) {
        return walk(this, fn);
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/abi.js
var AbiConstructorNotFoundError, AbiConstructorParamsNotFoundError, AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError, AbiEncodingArrayLengthMismatchError, AbiEncodingBytesSizeMismatchError, AbiEncodingLengthMismatchError, AbiErrorInputsNotFoundError, AbiErrorNotFoundError, AbiErrorSignatureNotFoundError, AbiEventSignatureEmptyTopicsError, AbiEventSignatureNotFoundError, AbiEventNotFoundError, AbiFunctionNotFoundError, AbiFunctionOutputsNotFoundError, AbiFunctionSignatureNotFoundError, AbiItemAmbiguityError, BytesSizeMismatchError, DecodeLogDataMismatch, DecodeLogTopicsMismatch, InvalidAbiEncodingTypeError, InvalidAbiDecodingTypeError, InvalidArrayError, InvalidDefinitionTypeError;
var init_abi = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/abi.js"() {
    init_formatAbiItem2();
    init_size();
    init_base();
    AbiConstructorNotFoundError = class extends BaseError2 {
      constructor({ docsPath: docsPath8 }) {
        super([
          "A constructor was not found on the ABI.",
          "Make sure you are using the correct ABI and that the constructor exists on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiConstructorNotFoundError"
        });
      }
    };
    AbiConstructorParamsNotFoundError = class extends BaseError2 {
      constructor({ docsPath: docsPath8 }) {
        super([
          "Constructor arguments were provided (`args`), but a constructor parameters (`inputs`) were not found on the ABI.",
          "Make sure you are using the correct ABI, and that the `inputs` attribute on the constructor exists."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiConstructorParamsNotFoundError"
        });
      }
    };
    AbiDecodingDataSizeTooSmallError = class extends BaseError2 {
      constructor({ data, params, size: size5 }) {
        super([`Data size of ${size5} bytes is too small for given parameters.`].join("\n"), {
          metaMessages: [
            `Params: (${formatAbiParams(params, { includeName: true })})`,
            `Data:   ${data} (${size5} bytes)`
          ],
          name: "AbiDecodingDataSizeTooSmallError"
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "params", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "size", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = data;
        this.params = params;
        this.size = size5;
      }
    };
    AbiDecodingZeroDataError = class extends BaseError2 {
      constructor({ cause } = {}) {
        super('Cannot decode zero data ("0x") with ABI parameters.', {
          name: "AbiDecodingZeroDataError",
          cause
        });
      }
    };
    AbiEncodingArrayLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength, type }) {
        super([
          `ABI encoding array length mismatch for type ${type}.`,
          `Expected length: ${expectedLength}`,
          `Given length: ${givenLength}`
        ].join("\n"), { name: "AbiEncodingArrayLengthMismatchError" });
      }
    };
    AbiEncodingBytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, value }) {
        super(`Size of bytes "${value}" (bytes${size(value)}) does not match expected size (bytes${expectedSize}).`, { name: "AbiEncodingBytesSizeMismatchError" });
      }
    };
    AbiEncodingLengthMismatchError = class extends BaseError2 {
      constructor({ expectedLength, givenLength }) {
        super([
          "ABI encoding params/values length mismatch.",
          `Expected length (params): ${expectedLength}`,
          `Given length (values): ${givenLength}`
        ].join("\n"), { name: "AbiEncodingLengthMismatchError" });
      }
    };
    AbiErrorInputsNotFoundError = class extends BaseError2 {
      constructor(errorName, { docsPath: docsPath8 }) {
        super([
          `Arguments (\`args\`) were provided to "${errorName}", but "${errorName}" on the ABI does not contain any parameters (\`inputs\`).`,
          "Cannot encode error result without knowing what the parameter types are.",
          "Make sure you are using the correct ABI and that the inputs exist on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiErrorInputsNotFoundError"
        });
      }
    };
    AbiErrorNotFoundError = class extends BaseError2 {
      constructor(errorName, { docsPath: docsPath8 } = {}) {
        super([
          `Error ${errorName ? `"${errorName}" ` : ""}not found on ABI.`,
          "Make sure you are using the correct ABI and that the error exists on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiErrorNotFoundError"
        });
      }
    };
    AbiErrorSignatureNotFoundError = class extends BaseError2 {
      constructor(signature, { docsPath: docsPath8, cause }) {
        super([
          `Encoded error signature "${signature}" not found on ABI.`,
          "Make sure you are using the correct ABI and that the error exists on it.",
          `You can look up the decoded signature here: https://4byte.sourcify.dev/?q=${signature}.`
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiErrorSignatureNotFoundError",
          cause
        });
        Object.defineProperty(this, "signature", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.signature = signature;
      }
    };
    AbiEventSignatureEmptyTopicsError = class extends BaseError2 {
      constructor({ docsPath: docsPath8 }) {
        super("Cannot extract event signature from empty topics.", {
          docsPath: docsPath8,
          name: "AbiEventSignatureEmptyTopicsError"
        });
      }
    };
    AbiEventSignatureNotFoundError = class extends BaseError2 {
      constructor(signature, { docsPath: docsPath8 }) {
        super([
          `Encoded event signature "${signature}" not found on ABI.`,
          "Make sure you are using the correct ABI and that the event exists on it.",
          `You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiEventSignatureNotFoundError"
        });
      }
    };
    AbiEventNotFoundError = class extends BaseError2 {
      constructor(eventName, { docsPath: docsPath8 } = {}) {
        super([
          `Event ${eventName ? `"${eventName}" ` : ""}not found on ABI.`,
          "Make sure you are using the correct ABI and that the event exists on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiEventNotFoundError"
        });
      }
    };
    AbiFunctionNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath8 } = {}) {
        super([
          `Function ${functionName ? `"${functionName}" ` : ""}not found on ABI.`,
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiFunctionNotFoundError"
        });
      }
    };
    AbiFunctionOutputsNotFoundError = class extends BaseError2 {
      constructor(functionName, { docsPath: docsPath8 }) {
        super([
          `Function "${functionName}" does not contain any \`outputs\` on ABI.`,
          "Cannot decode function result without knowing what the parameter types are.",
          "Make sure you are using the correct ABI and that the function exists on it."
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiFunctionOutputsNotFoundError"
        });
      }
    };
    AbiFunctionSignatureNotFoundError = class extends BaseError2 {
      constructor(signature, { docsPath: docsPath8 }) {
        super([
          `Encoded function signature "${signature}" not found on ABI.`,
          "Make sure you are using the correct ABI and that the function exists on it.",
          `You can look up the signature here: https://4byte.sourcify.dev/?q=${signature}.`
        ].join("\n"), {
          docsPath: docsPath8,
          name: "AbiFunctionSignatureNotFoundError"
        });
      }
    };
    AbiItemAmbiguityError = class extends BaseError2 {
      constructor(x, y) {
        super("Found ambiguous types in overloaded ABI items.", {
          metaMessages: [
            `\`${x.type}\` in \`${formatAbiItem2(x.abiItem)}\`, and`,
            `\`${y.type}\` in \`${formatAbiItem2(y.abiItem)}\``,
            "",
            "These types encode differently and cannot be distinguished at runtime.",
            "Remove one of the ambiguous items in the ABI."
          ],
          name: "AbiItemAmbiguityError"
        });
      }
    };
    BytesSizeMismatchError = class extends BaseError2 {
      constructor({ expectedSize, givenSize }) {
        super(`Expected bytes${expectedSize}, got bytes${givenSize}.`, {
          name: "BytesSizeMismatchError"
        });
      }
    };
    DecodeLogDataMismatch = class extends BaseError2 {
      constructor({ abiItem, data, params, size: size5 }) {
        super([
          `Data size of ${size5} bytes is too small for non-indexed event parameters.`
        ].join("\n"), {
          metaMessages: [
            `Params: (${formatAbiParams(params, { includeName: true })})`,
            `Data:   ${data} (${size5} bytes)`
          ],
          name: "DecodeLogDataMismatch"
        });
        Object.defineProperty(this, "abiItem", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "params", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "size", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.abiItem = abiItem;
        this.data = data;
        this.params = params;
        this.size = size5;
      }
    };
    DecodeLogTopicsMismatch = class extends BaseError2 {
      constructor({ abiItem, param }) {
        super([
          `Expected a topic for indexed event parameter${param.name ? ` "${param.name}"` : ""} on event "${formatAbiItem2(abiItem, { includeName: true })}".`
        ].join("\n"), { name: "DecodeLogTopicsMismatch" });
        Object.defineProperty(this, "abiItem", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.abiItem = abiItem;
      }
    };
    InvalidAbiEncodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath8 }) {
        super([
          `Type "${type}" is not a valid encoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath8, name: "InvalidAbiEncodingType" });
      }
    };
    InvalidAbiDecodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath: docsPath8 }) {
        super([
          `Type "${type}" is not a valid decoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath: docsPath8, name: "InvalidAbiDecodingType" });
      }
    };
    InvalidArrayError = class extends BaseError2 {
      constructor(value) {
        super([`Value "${value}" is not a valid array.`].join("\n"), {
          name: "InvalidArrayError"
        });
      }
    };
    InvalidDefinitionTypeError = class extends BaseError2 {
      constructor(type) {
        super([
          `"${type}" is not a valid definition type.`,
          'Valid types: "function", "event", "error"'
        ].join("\n"), { name: "InvalidDefinitionTypeError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError, InvalidBytesLengthError;
var init_data = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/data.js"() {
    init_base();
    SliceOffsetOutOfBoundsError = class extends BaseError2 {
      constructor({ offset, position, size: size5 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size5}).`, { name: "SliceOffsetOutOfBoundsError" });
      }
    };
    SizeExceedsPaddingSizeError = class extends BaseError2 {
      constructor({ size: size5, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size5}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
      }
    };
    InvalidBytesLengthError = class extends BaseError2 {
      constructor({ size: size5, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} is expected to be ${targetSize} ${type} long, but is ${size5} ${type} long.`, { name: "InvalidBytesLengthError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size: size5 = 32 } = {}) {
  if (typeof hexOrBytes === "string")
    return padHex(hexOrBytes, { dir, size: size5 });
  return padBytes(hexOrBytes, { dir, size: size5 });
}
function padHex(hex_, { dir, size: size5 = 32 } = {}) {
  if (size5 === null)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size5 * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size5,
      type: "hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size5 * 2, "0")}`;
}
function padBytes(bytes, { dir, size: size5 = 32 } = {}) {
  if (size5 === null)
    return bytes;
  if (bytes.length > size5)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size5,
      type: "bytes"
    });
  const paddedBytes = new Uint8Array(size5);
  for (let i = 0; i < size5; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size5 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var init_pad = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/pad.js"() {
    init_data();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError, InvalidBytesBooleanError, InvalidHexBooleanError, InvalidHexValueError, RlpDepthLimitExceededError, RlpListBoundaryExceededError, RlpTrailingBytesError, SizeOverflowError;
var init_encoding = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/encoding.js"() {
    init_base();
    IntegerOutOfRangeError = class extends BaseError2 {
      constructor({ max, min, signed, size: size5, value }) {
        super(`Number "${value}" is not in safe ${size5 ? `${size5 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
      }
    };
    InvalidBytesBooleanError = class extends BaseError2 {
      constructor(bytes) {
        super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, {
          name: "InvalidBytesBooleanError"
        });
      }
    };
    InvalidHexBooleanError = class extends BaseError2 {
      constructor(hex) {
        super(`Hex value "${hex}" is not a valid boolean. The hex value must be "0x0" (false) or "0x1" (true).`, { name: "InvalidHexBooleanError" });
      }
    };
    InvalidHexValueError = class extends BaseError2 {
      constructor(value) {
        super(`Hex value "${value}" is an odd length (${value.length}). It must be an even length.`, { name: "InvalidHexValueError" });
      }
    };
    RlpDepthLimitExceededError = class extends BaseError2 {
      constructor({ limit }) {
        super(`RLP depth limit of \`${limit}\` exceeded.`, {
          name: "RlpDepthLimitExceededError"
        });
      }
    };
    RlpListBoundaryExceededError = class extends BaseError2 {
      constructor({ consumed, declared }) {
        super(`RLP list items consumed \`${consumed}\` bytes but the list declared a length of \`${declared}\`.`, { name: "RlpListBoundaryExceededError" });
      }
    };
    RlpTrailingBytesError = class extends BaseError2 {
      constructor({ count }) {
        super(`RLP payload encodes a single item, but \`${count}\` trailing ${count === 1 ? "byte remains" : "bytes remain"}.`, { name: "RlpTrailingBytesError" });
      }
    };
    SizeOverflowError = class extends BaseError2 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/trim.js
function trim(hexOrBytes, { dir = "left" } = {}) {
  let data = typeof hexOrBytes === "string" ? hexOrBytes.replace("0x", "") : hexOrBytes;
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  if (typeof hexOrBytes === "string") {
    if (data.length === 1 && dir === "right")
      data = `${data}0`;
    return `0x${data.length % 2 === 1 ? `0${data}` : data}`;
  }
  return data;
}
var init_trim = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/trim.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size5 }) {
  if (size(hexOrBytes) > size5)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size5
    });
}
function hexToBigInt(hex, opts = {}) {
  const { signed } = opts;
  if (opts.size)
    assertSize(hex, { size: opts.size });
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size5 = (hex.length - 2) / 2;
  const max = (1n << BigInt(size5) * 8n - 1n) - 1n;
  if (value <= max)
    return value;
  return value - BigInt(`0x${"f".padStart(size5 * 2, "f")}`) - 1n;
}
function hexToBool(hex_, opts = {}) {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = trim(hex);
  }
  if (trim(hex) === "0x00")
    return false;
  if (trim(hex) === "0x01")
    return true;
  throw new InvalidHexBooleanError(hex);
}
function hexToNumber(hex, opts = {}) {
  const value = hexToBigInt(hex, opts);
  const number = Number(value);
  if (!Number.isSafeInteger(number))
    throw new IntegerOutOfRangeError({
      max: `${Number.MAX_SAFE_INTEGER}`,
      min: `${Number.MIN_SAFE_INTEGER}`,
      signed: opts.signed,
      size: opts.size,
      value: `${value}n`
    });
  return number;
}
function hexToString(hex, opts = {}) {
  let bytes = hexToBytes(hex);
  if (opts.size) {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: "right" });
  }
  return new TextDecoder().decode(bytes);
}
var init_fromHex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/fromHex.js"() {
    init_encoding();
    init_size();
    init_trim();
    init_toBytes();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/toHex.js
function toHex(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToHex(value, opts);
  if (typeof value === "string") {
    return stringToHex(value, opts);
  }
  if (typeof value === "boolean")
    return boolToHex(value, opts);
  return bytesToHex(value, opts);
}
function boolToHex(value, opts = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { size: opts.size });
  }
  return hex;
}
function bytesToHex(value, opts = {}) {
  let string = "";
  for (let i = 0; i < value.length; i++) {
    string += hexes[value[i]];
  }
  const hex = `0x${string}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { dir: "right", size: opts.size });
  }
  return hex;
}
function numberToHex(value_, opts = {}) {
  const { signed, size: size5 } = opts;
  const value = BigInt(value_);
  let maxValue;
  if (size5) {
    if (signed)
      maxValue = (1n << BigInt(size5) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size5) * 8n) - 1n;
  } else if (typeof value_ === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value > maxValue || value < minValue) {
    const suffix = typeof value_ === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size5,
      value: `${value_}${suffix}`
    });
  }
  const hex = `0x${(signed && value < 0 ? (1n << BigInt(size5 * 8)) + BigInt(value) : value).toString(16)}`;
  if (size5)
    return pad(hex, { size: size5 });
  return hex;
}
function stringToHex(value_, opts = {}) {
  const value = encoder.encode(value_);
  return bytesToHex(value, opts);
}
var hexes, encoder;
var init_toHex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/toHex.js"() {
    init_encoding();
    init_pad();
    init_fromHex();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    encoder = /* @__PURE__ */ new TextEncoder();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/toBytes.js
function toBytes(value, opts = {}) {
  if (typeof value === "number" || typeof value === "bigint")
    return numberToBytes(value, opts);
  if (typeof value === "boolean")
    return boolToBytes(value, opts);
  if (isHex(value))
    return hexToBytes(value, opts);
  return stringToBytes(value, opts);
}
function boolToBytes(value, opts = {}) {
  const bytes = new Uint8Array(1);
  bytes[0] = Number(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { size: opts.size });
  }
  return bytes;
}
function charCodeToBase16(char) {
  if (char >= charCodeMap.zero && char <= charCodeMap.nine)
    return char - charCodeMap.zero;
  if (char >= charCodeMap.A && char <= charCodeMap.F)
    return char - (charCodeMap.A - 10);
  if (char >= charCodeMap.a && char <= charCodeMap.f)
    return char - (charCodeMap.a - 10);
  return void 0;
}
function hexToBytes(hex_, opts = {}) {
  let hex = hex_;
  if (opts.size) {
    assertSize(hex, { size: opts.size });
    hex = pad(hex, { dir: "right", size: opts.size });
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index2 = 0, j = 0; index2 < length; index2++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index2] = nibbleLeft * 16 + nibbleRight;
  }
  return bytes;
}
function numberToBytes(value, opts) {
  const hex = numberToHex(value, opts);
  return hexToBytes(hex);
}
function stringToBytes(value, opts = {}) {
  const bytes = encoder2.encode(value);
  if (typeof opts.size === "number") {
    assertSize(bytes, { size: opts.size });
    return pad(bytes, { dir: "right", size: opts.size });
  }
  return bytes;
}
var encoder2, charCodeMap;
var init_toBytes = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/toBytes.js"() {
    init_base();
    init_isHex();
    init_pad();
    init_fromHex();
    init_toHex();
    encoder2 = /* @__PURE__ */ new TextEncoder();
    charCodeMap = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i = 0; i < len; i++) {
    const { h, l } = fromBig(lst[i], le);
    [Ah[i], Al[i]] = [h, l];
  }
  return [Ah, Al];
}
var U32_MASK64, _32n, rotlSH, rotlSL, rotlBH, rotlBL;
var init_u64 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/cryptoNode.js
import * as nc from "node:crypto";
var crypto2;
var init_cryptoNode = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/cryptoNode.js"() {
    crypto2 = nc && typeof nc === "object" && "webcrypto" in nc ? nc.webcrypto : nc && typeof nc === "object" && "randomBytes" in nc ? nc : void 0;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash should be wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
function rotl(word, shift) {
  return word << shift | word >>> 32 - shift >>> 0;
}
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
function bytesToHex2(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes2[bytes[i]];
  }
  return hex;
}
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes2(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes2(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function kdfInputToBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
function checkOpts(defaults, opts) {
  if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
    throw new Error("options should be object or undefined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes2(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto2 && typeof crypto2.getRandomValues === "function") {
    return crypto2.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto2 && typeof crypto2.randomBytes === "function") {
    return Uint8Array.from(crypto2.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}
var isLE, swap32IfBE, hasHexBuiltin, hexes2, asciis, Hash;
var init_utils2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js"() {
    init_cryptoNode();
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    hexes2 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    Hash = class {
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js
function keccakP(s, rounds = 24) {
  const B = new Uint32Array(5 * 2);
  for (let round = 24 - rounds; round < 24; round++) {
    for (let x = 0; x < 10; x++)
      B[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
    for (let x = 0; x < 10; x += 2) {
      const idx1 = (x + 8) % 10;
      const idx0 = (x + 2) % 10;
      const B0 = B[idx0];
      const B1 = B[idx0 + 1];
      const Th = rotlH(B0, B1, 1) ^ B[idx1];
      const Tl = rotlL(B0, B1, 1) ^ B[idx1 + 1];
      for (let y = 0; y < 50; y += 10) {
        s[x + y] ^= Th;
        s[x + y + 1] ^= Tl;
      }
    }
    let curH = s[2];
    let curL = s[3];
    for (let t = 0; t < 24; t++) {
      const shift = SHA3_ROTL[t];
      const Th = rotlH(curH, curL, shift);
      const Tl = rotlL(curH, curL, shift);
      const PI = SHA3_PI[t];
      curH = s[PI];
      curL = s[PI + 1];
      s[PI] = Th;
      s[PI + 1] = Tl;
    }
    for (let y = 0; y < 50; y += 10) {
      for (let x = 0; x < 10; x++)
        B[x] = s[y + x];
      for (let x = 0; x < 10; x++)
        s[y + x] ^= ~B[(x + 2) % 10] & B[(x + 4) % 10];
    }
    s[0] ^= SHA3_IOTA_H[round];
    s[1] ^= SHA3_IOTA_L[round];
  }
  clean(B);
}
var _0n, _1n, _2n, _7n, _256n, _0x71n, SHA3_PI, SHA3_ROTL, _SHA3_IOTA, IOTAS, SHA3_IOTA_H, SHA3_IOTA_L, rotlH, rotlL, Keccak, gen, keccak_256;
var init_sha3 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js"() {
    init_u64();
    init_utils2();
    _0n = BigInt(0);
    _1n = BigInt(1);
    _2n = BigInt(2);
    _7n = BigInt(7);
    _256n = BigInt(256);
    _0x71n = BigInt(113);
    SHA3_PI = [];
    SHA3_ROTL = [];
    _SHA3_IOTA = [];
    for (let round = 0, R = _1n, x = 1, y = 0; round < 24; round++) {
      [x, y] = [y, (2 * x + 3 * y) % 5];
      SHA3_PI.push(2 * (5 * y + x));
      SHA3_ROTL.push((round + 1) * (round + 2) / 2 % 64);
      let t = _0n;
      for (let j = 0; j < 7; j++) {
        R = (R << _1n ^ (R >> _7n) * _0x71n) % _256n;
        if (R & _2n)
          t ^= _1n << (_1n << /* @__PURE__ */ BigInt(j)) - _1n;
      }
      _SHA3_IOTA.push(t);
    }
    IOTAS = split(_SHA3_IOTA, true);
    SHA3_IOTA_H = IOTAS[0];
    SHA3_IOTA_L = IOTAS[1];
    rotlH = (h, l, s) => s > 32 ? rotlBH(h, l, s) : rotlSH(h, l, s);
    rotlL = (h, l, s) => s > 32 ? rotlBL(h, l, s) : rotlSL(h, l, s);
    Keccak = class _Keccak extends Hash {
      // NOTE: we accept arguments in bytes instead of bits here.
      constructor(blockLen, suffix, outputLen, enableXOF = false, rounds = 24) {
        super();
        this.pos = 0;
        this.posOut = 0;
        this.finished = false;
        this.destroyed = false;
        this.enableXOF = false;
        this.blockLen = blockLen;
        this.suffix = suffix;
        this.outputLen = outputLen;
        this.enableXOF = enableXOF;
        this.rounds = rounds;
        anumber(outputLen);
        if (!(0 < blockLen && blockLen < 200))
          throw new Error("only keccak-f1600 function is supported");
        this.state = new Uint8Array(200);
        this.state32 = u32(this.state);
      }
      clone() {
        return this._cloneInto();
      }
      keccak() {
        swap32IfBE(this.state32);
        keccakP(this.state32, this.rounds);
        swap32IfBE(this.state32);
        this.posOut = 0;
        this.pos = 0;
      }
      update(data) {
        aexists(this);
        data = toBytes2(data);
        abytes(data);
        const { blockLen, state } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          for (let i = 0; i < take; i++)
            state[this.pos++] ^= data[pos++];
          if (this.pos === blockLen)
            this.keccak();
        }
        return this;
      }
      finish() {
        if (this.finished)
          return;
        this.finished = true;
        const { state, suffix, pos, blockLen } = this;
        state[pos] ^= suffix;
        if ((suffix & 128) !== 0 && pos === blockLen - 1)
          this.keccak();
        state[blockLen - 1] ^= 128;
        this.keccak();
      }
      writeInto(out) {
        aexists(this, false);
        abytes(out);
        this.finish();
        const bufferOut = this.state;
        const { blockLen } = this;
        for (let pos = 0, len = out.length; pos < len; ) {
          if (this.posOut >= blockLen)
            this.keccak();
          const take = Math.min(blockLen - this.posOut, len - pos);
          out.set(bufferOut.subarray(this.posOut, this.posOut + take), pos);
          this.posOut += take;
          pos += take;
        }
        return out;
      }
      xofInto(out) {
        if (!this.enableXOF)
          throw new Error("XOF is not possible for this instance");
        return this.writeInto(out);
      }
      xof(bytes) {
        anumber(bytes);
        return this.xofInto(new Uint8Array(bytes));
      }
      digestInto(out) {
        aoutput(out, this);
        if (this.finished)
          throw new Error("digest() was already called");
        this.writeInto(out);
        this.destroy();
        return out;
      }
      digest() {
        return this.digestInto(new Uint8Array(this.outputLen));
      }
      destroy() {
        this.destroyed = true;
        clean(this.state);
      }
      _cloneInto(to) {
        const { blockLen, suffix, outputLen, rounds, enableXOF } = this;
        to || (to = new _Keccak(blockLen, suffix, outputLen, enableXOF, rounds));
        to.state32.set(this.state32);
        to.pos = this.pos;
        to.posOut = this.posOut;
        to.finished = this.finished;
        to.rounds = rounds;
        to.suffix = suffix;
        to.outputLen = outputLen;
        to.enableXOF = enableXOF;
        to.destroyed = this.destroyed;
        return to;
      }
    };
    gen = (suffix, blockLen, outputLen) => createHasher(() => new Keccak(blockLen, suffix, outputLen));
    keccak_256 = /* @__PURE__ */ (() => gen(1, 136, 256 / 8))();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
  const to = to_ || "hex";
  const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex(bytes);
}
var init_keccak256 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/keccak256.js"() {
    init_sha3();
    init_isHex();
    init_toBytes();
    init_toHex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/hashSignature.js
function hashSignature(sig) {
  return hash(sig);
}
var hash;
var init_hashSignature = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/hashSignature.js"() {
    init_toBytes();
    init_keccak256();
    hash = (value) => keccak256(toBytes(value));
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/normalizeSignature.js
function normalizeSignature(signature) {
  let active = true;
  let current = "";
  let level = 0;
  let result = "";
  let valid = false;
  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];
    if (["(", ")", ","].includes(char))
      active = true;
    if (char === "(")
      level++;
    if (char === ")")
      level--;
    if (!active)
      continue;
    if (level === 0) {
      if (char === " " && ["event", "function", ""].includes(result))
        result = "";
      else {
        result += char;
        if (char === ")") {
          valid = true;
          break;
        }
      }
      continue;
    }
    if (char === " ") {
      if (signature[i - 1] !== "," && current !== "," && current !== ",(") {
        current = "";
        active = false;
      }
      continue;
    }
    result += char;
    current += char;
  }
  if (!valid)
    throw new BaseError2("Unable to normalize signature.");
  return result;
}
var init_normalizeSignature = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/normalizeSignature.js"() {
    init_base();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toSignature.js
var toSignature;
var init_toSignature = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toSignature.js"() {
    init_exports();
    init_normalizeSignature();
    toSignature = (def) => {
      const def_ = (() => {
        if (typeof def === "string")
          return def;
        return formatAbiItem(def);
      })();
      return normalizeSignature(def_);
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toSignatureHash.js
function toSignatureHash(fn) {
  return hashSignature(toSignature(fn));
}
var init_toSignatureHash = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toSignatureHash.js"() {
    init_hashSignature();
    init_toSignature();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toEventSelector.js
var toEventSelector;
var init_toEventSelector = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toEventSelector.js"() {
    init_toSignatureHash();
    toEventSelector = toSignatureHash;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/address.js
var InvalidAddressError;
var init_address = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/address.js"() {
    init_base();
    InvalidAddressError = class extends BaseError2 {
      constructor({ address }) {
        super(`Address "${address}" is invalid.`, {
          metaMessages: [
            "- Address must be a hex value of 20 bytes (40 hex characters).",
            "- Address must match its checksum counterpart."
          ],
          name: "InvalidAddressError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/lru.js
var LruMap;
var init_lru = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/lru.js"() {
    LruMap = class extends Map {
      constructor(size5) {
        super();
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = size5;
      }
      get(key) {
        const value = super.get(key);
        if (super.has(key)) {
          super.delete(key);
          super.set(key, value);
        }
        return value;
      }
      set(key, value) {
        if (super.has(key))
          super.delete(key);
        super.set(key, value);
        if (this.maxSize && this.size > this.maxSize) {
          const firstKey = super.keys().next().value;
          if (firstKey !== void 0)
            super.delete(firstKey);
        }
        return this;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/getAddress.js
function checksumAddress(address_, chainId) {
  if (checksumAddressCache.has(`${address_}.${chainId}`))
    return checksumAddressCache.get(`${address_}.${chainId}`);
  const hexAddress = chainId ? `${chainId}${address_.toLowerCase()}` : address_.substring(2).toLowerCase();
  const hash3 = keccak256(stringToBytes(hexAddress), "bytes");
  const address = (chainId ? hexAddress.substring(`${chainId}0x`.length) : hexAddress).split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash3[i >> 1] >> 4 >= 8 && address[i]) {
      address[i] = address[i].toUpperCase();
    }
    if ((hash3[i >> 1] & 15) >= 8 && address[i + 1]) {
      address[i + 1] = address[i + 1].toUpperCase();
    }
  }
  const result = `0x${address.join("")}`;
  checksumAddressCache.set(`${address_}.${chainId}`, result);
  return result;
}
function getAddress(address, chainId) {
  if (!isAddress(address, { strict: false }))
    throw new InvalidAddressError({ address });
  return checksumAddress(address, chainId);
}
var checksumAddressCache;
var init_getAddress = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/getAddress.js"() {
    init_address();
    init_toBytes();
    init_keccak256();
    init_lru();
    init_isAddress();
    checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/isAddress.js
function isAddress(address, options) {
  const { strict = true } = options ?? {};
  const cacheKey2 = `${address}.${strict}`;
  if (isAddressCache.has(cacheKey2))
    return isAddressCache.get(cacheKey2);
  const result = (() => {
    if (!addressRegex.test(address))
      return false;
    if (address.toLowerCase() === address)
      return true;
    if (strict)
      return checksumAddress(address) === address;
    return true;
  })();
  isAddressCache.set(cacheKey2, result);
  return result;
}
var addressRegex, isAddressCache;
var init_isAddress = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/isAddress.js"() {
    init_lru();
    init_getAddress();
    addressRegex = /^0x[a-fA-F0-9]{40}$/;
    isAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/concat.js
function concat(values) {
  if (typeof values[0] === "string")
    return concatHex(values);
  return concatBytes2(values);
}
function concatBytes2(values) {
  let length = 0;
  for (const arr of values) {
    length += arr.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const arr of values) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
function concatHex(values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
var init_concat = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/concat.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/slice.js
function slice(value, start, end, { strict } = {}) {
  if (isHex(value, { strict: false }))
    return sliceHex(value, start, end, {
      strict
    });
  return sliceBytes(value, start, end, {
    strict
  });
}
function assertStartOffset(value, start) {
  if (typeof start === "number" && start > 0 && start > size(value) - 1)
    throw new SliceOffsetOutOfBoundsError({
      offset: start,
      position: "start",
      size: size(value)
    });
}
function assertEndOffset(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError({
      offset: end,
      position: "end",
      size: size(value)
    });
  }
}
function sliceBytes(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = value_.slice(start, end);
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
function sliceHex(value_, start, end, { strict } = {}) {
  assertStartOffset(value_, start);
  const value = `0x${value_.replace("0x", "").slice((start ?? 0) * 2, (end ?? value_.length) * 2)}`;
  if (strict)
    assertEndOffset(value, start, end);
  return value;
}
var init_slice = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/data/slice.js"() {
    init_data();
    init_isHex();
    init_size();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/regex.js
var bytesRegex2, integerRegex2;
var init_regex2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/regex.js"() {
    bytesRegex2 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
    integerRegex2 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
function encodeAbiParameters(params, values) {
  if (params.length !== values.length)
    throw new AbiEncodingLengthMismatchError({
      expectedLength: params.length,
      givenLength: values.length
    });
  const preparedParams = prepareParams({
    params,
    values
  });
  return encodeParams(preparedParams);
}
function prepareParams({ params, values }) {
  const preparedParams = [];
  for (let i = 0; i < params.length; i++) {
    preparedParams.push(prepareParam({ param: params[i], value: values[i] }));
  }
  return preparedParams;
}
function prepareParam({ param, value }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray(value, { length, param: { ...param, type } });
  }
  if (param.type === "tuple") {
    return encodeTuple(value, {
      param
    });
  }
  if (param.type === "address") {
    return encodeAddress(value);
  }
  if (param.type === "bool") {
    return encodeBool(value);
  }
  if (param.type.startsWith("uint") || param.type.startsWith("int")) {
    const signed = param.type.startsWith("int");
    const [, , size5 = "256"] = integerRegex2.exec(param.type) ?? [];
    return encodeNumber(value, {
      signed,
      size: Number(size5)
    });
  }
  if (param.type.startsWith("bytes")) {
    return encodeBytes(value, { param });
  }
  if (param.type === "string") {
    return encodeString(value);
  }
  throw new InvalidAbiEncodingTypeError(param.type, {
    docsPath: "/docs/contract/encodeAbiParameters"
  });
}
function encodeParams(preparedParams) {
  let staticSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic)
      staticSize += 32;
    else
      staticSize += size(encoded);
  }
  const staticParams = [];
  const dynamicParams = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParams.length; i++) {
    const { dynamic, encoded } = preparedParams[i];
    if (dynamic) {
      staticParams.push(numberToHex(staticSize + dynamicSize, { size: 32 }));
      dynamicParams.push(encoded);
      dynamicSize += size(encoded);
    } else {
      staticParams.push(encoded);
    }
  }
  return concatHex([...staticParams, ...dynamicParams]);
}
function encodeAddress(value) {
  if (!isAddress(value))
    throw new InvalidAddressError({ address: value });
  return { dynamic: false, encoded: padHex(value.toLowerCase()) };
}
function encodeArray(value, { length, param }) {
  const dynamic = length === null;
  if (!Array.isArray(value))
    throw new InvalidArrayError(value);
  if (!dynamic && value.length !== length)
    throw new AbiEncodingArrayLengthMismatchError({
      expectedLength: length,
      givenLength: value.length,
      type: `${param.type}[${length}]`
    });
  let dynamicChild = value.length === 0 && isDynamicType(param);
  const preparedParams = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParam({ param, value: value[i] });
    if (preparedParam.dynamic)
      dynamicChild = true;
    preparedParams.push(preparedParam);
  }
  if (dynamic || dynamicChild) {
    const data = encodeParams(preparedParams);
    if (dynamic) {
      const length2 = numberToHex(preparedParams.length, { size: 32 });
      return {
        dynamic: true,
        encoded: concatHex([length2, data])
      };
    }
    if (dynamicChild)
      return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concatHex(preparedParams.map(({ encoded }) => encoded))
  };
}
function encodeBytes(value, { param }) {
  const [, paramSize] = param.type.split("bytes");
  const bytesSize = size(value);
  if (!paramSize) {
    let value_ = value;
    if (bytesSize % 32 !== 0)
      value_ = padHex(value_, {
        dir: "right",
        size: Math.ceil((value.length - 2) / 2 / 32) * 32
      });
    return {
      dynamic: true,
      encoded: concatHex([
        padHex(numberToHex(bytesSize, { size: 32 })),
        value_
      ])
    };
  }
  if (bytesSize !== Number.parseInt(paramSize, 10))
    throw new AbiEncodingBytesSizeMismatchError({
      expectedSize: Number.parseInt(paramSize, 10),
      value
    });
  return { dynamic: false, encoded: padHex(value, { dir: "right" }) };
}
function encodeBool(value) {
  if (typeof value !== "boolean")
    throw new BaseError2(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
  return { dynamic: false, encoded: padHex(boolToHex(value)) };
}
function encodeNumber(value, { signed, size: size5 = 256 }) {
  if (typeof size5 === "number") {
    const max = 2n ** (BigInt(size5) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min)
      throw new IntegerOutOfRangeError({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size5 / 8,
        value: value.toString()
      });
  }
  return {
    dynamic: false,
    encoded: numberToHex(value, {
      size: 32,
      signed
    })
  };
}
function encodeString(value) {
  const hexValue = stringToHex(value);
  const partsLength = Math.ceil(size(hexValue) / 32);
  const parts = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(padHex(slice(hexValue, i * 32, (i + 1) * 32), {
      dir: "right"
    }));
  }
  return {
    dynamic: true,
    encoded: concatHex([
      padHex(numberToHex(size(hexValue), { size: 32 })),
      ...parts
    ])
  };
}
function encodeTuple(value, { param }) {
  let dynamic = false;
  const preparedParams = [];
  for (let i = 0; i < param.components.length; i++) {
    const param_ = param.components[i];
    const index2 = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParam({
      param: param_,
      value: value[index2]
    });
    preparedParams.push(preparedParam);
    if (preparedParam.dynamic)
      dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic ? encodeParams(preparedParams) : concatHex(preparedParams.map(({ encoded }) => encoded))
  };
}
function getArrayComponents(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}
function isDynamicType(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components.some(isDynamicType);
  const arrayComponents = getArrayComponents(type);
  if (arrayComponents)
    return isDynamicType({ ...param, type: arrayComponents[1] });
  return false;
}
var init_encodeAbiParameters = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
    init_abi();
    init_address();
    init_base();
    init_encoding();
    init_isAddress();
    init_concat();
    init_pad();
    init_size();
    init_slice();
    init_toHex();
    init_regex2();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toFunctionSelector.js
var toFunctionSelector;
var init_toFunctionSelector = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/toFunctionSelector.js"() {
    init_slice();
    init_toSignatureHash();
    toFunctionSelector = (fn) => slice(toSignatureHash(fn), 0, 4);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/getAbiItem.js
function getAbiItem(parameters) {
  const { abi: abi2, args = [], name } = parameters;
  const isSelector = isHex(name, { strict: false });
  const abiItems = abi2.filter((abiItem) => {
    if (isSelector) {
      if (abiItem.type === "function")
        return toFunctionSelector(abiItem) === name;
      if (abiItem.type === "event")
        return toEventSelector(abiItem) === name;
      return false;
    }
    return "name" in abiItem && abiItem.name === name;
  });
  if (abiItems.length === 0)
    return void 0;
  if (abiItems.length === 1)
    return abiItems[0];
  let matchedAbiItem;
  for (const abiItem of abiItems) {
    if (!("inputs" in abiItem))
      continue;
    if (!args || args.length === 0) {
      if (!abiItem.inputs || abiItem.inputs.length === 0)
        return abiItem;
      continue;
    }
    if (!abiItem.inputs)
      continue;
    if (abiItem.inputs.length === 0)
      continue;
    if (abiItem.inputs.length !== args.length)
      continue;
    const matched = args.every((arg, index2) => {
      const abiParameter = "inputs" in abiItem && abiItem.inputs[index2];
      if (!abiParameter)
        return false;
      return isArgOfType(arg, abiParameter);
    });
    if (matched) {
      if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
        const ambiguousTypes = getAmbiguousTypes(abiItem.inputs, matchedAbiItem.inputs, args);
        if (ambiguousTypes)
          throw new AbiItemAmbiguityError({
            abiItem,
            type: ambiguousTypes[0]
          }, {
            abiItem: matchedAbiItem,
            type: ambiguousTypes[1]
          });
      }
      matchedAbiItem = abiItem;
    }
  }
  if (matchedAbiItem)
    return matchedAbiItem;
  return abiItems[0];
}
function isArgOfType(arg, abiParameter) {
  const argType = typeof arg;
  const abiParameterType = abiParameter.type;
  switch (abiParameterType) {
    case "address":
      return isAddress(arg, { strict: false });
    case "bool":
      return argType === "boolean";
    case "function":
      return argType === "string";
    case "string":
      return argType === "string";
    default: {
      if (abiParameterType === "tuple" && "components" in abiParameter)
        return Object.values(abiParameter.components).every((component, index2) => {
          return argType === "object" && isArgOfType(Object.values(arg)[index2], component);
        });
      if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType))
        return argType === "number" || argType === "bigint";
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType))
        return argType === "string" || arg instanceof Uint8Array;
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return Array.isArray(arg) && arg.every((x) => isArgOfType(x, {
          ...abiParameter,
          // Pop off `[]` or `[M]` from end of type
          type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, "")
        }));
      }
      return false;
    }
  }
}
function getAmbiguousTypes(sourceParameters, targetParameters, args) {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex];
    const targetParameter = targetParameters[parameterIndex];
    if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter)
      return getAmbiguousTypes(sourceParameter.components, targetParameter.components, args[parameterIndex]);
    const types = [sourceParameter.type, targetParameter.type];
    const ambiguous = (() => {
      if (types.includes("address") && types.includes("bytes20"))
        return true;
      if (types.includes("address") && types.includes("string"))
        return isAddress(args[parameterIndex], { strict: false });
      if (types.includes("address") && types.includes("bytes"))
        return isAddress(args[parameterIndex], { strict: false });
      return false;
    })();
    if (ambiguous)
      return types;
  }
  return;
}
var init_getAbiItem = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/getAbiItem.js"() {
    init_abi();
    init_isHex();
    init_isAddress();
    init_toEventSelector();
    init_toFunctionSelector();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/parseAccount.js
function parseAccount(account) {
  if (typeof account === "string")
    return { address: account, type: "json-rpc" };
  return account;
}
var init_parseAccount = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/parseAccount.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js
function prepareEncodeFunctionData(parameters) {
  const { abi: abi2, args, functionName } = parameters;
  let abiItem = abi2[0];
  if (functionName) {
    const item = getAbiItem({
      abi: abi2,
      args,
      name: functionName
    });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath2 });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath2 });
  return {
    abi: [abiItem],
    functionName: toFunctionSelector(formatAbiItem2(abiItem))
  };
}
var docsPath2;
var init_prepareEncodeFunctionData = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/prepareEncodeFunctionData.js"() {
    init_abi();
    init_toFunctionSelector();
    init_formatAbiItem2();
    init_getAbiItem();
    docsPath2 = "/docs/contract/encodeFunctionData";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeFunctionData.js
function encodeFunctionData(parameters) {
  const { args } = parameters;
  const { abi: abi2, functionName } = (() => {
    if (parameters.abi.length === 1 && parameters.functionName?.startsWith("0x"))
      return parameters;
    return prepareEncodeFunctionData(parameters);
  })();
  const abiItem = abi2[0];
  const signature = functionName;
  const data = "inputs" in abiItem && abiItem.inputs ? encodeAbiParameters(abiItem.inputs, args ?? []) : void 0;
  return concatHex([signature, data ?? "0x"]);
}
var init_encodeFunctionData = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeFunctionData.js"() {
    init_concat();
    init_encodeAbiParameters();
    init_prepareEncodeFunctionData();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/solidity.js
var panicReasons, solidityError, solidityPanic;
var init_solidity = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/solidity.js"() {
    panicReasons = {
      1: "An `assert` condition failed.",
      17: "Arithmetic operation resulted in underflow or overflow.",
      18: "Division or modulo by zero (e.g. `5 / 0` or `23 % 0`).",
      33: "Attempted to convert to an invalid type.",
      34: "Attempted to access a storage byte array that is incorrectly encoded.",
      49: "Performed `.pop()` on an empty array",
      50: "Array index is out of bounds.",
      65: "Allocated too much memory or created an array which is too large.",
      81: "Attempted to call a zero-initialized variable of internal function type."
    };
    solidityError = {
      inputs: [
        {
          name: "message",
          type: "string"
        }
      ],
      name: "Error",
      type: "error"
    };
    solidityPanic = {
      inputs: [
        {
          name: "reason",
          type: "uint256"
        }
      ],
      name: "Panic",
      type: "error"
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
var init_cursor = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/cursor.js"() {
    init_base();
    NegativeOffsetError = class extends BaseError2 {
      constructor({ offset }) {
        super(`Offset \`${offset}\` cannot be negative.`, {
          name: "NegativeOffsetError"
        });
      }
    };
    PositionOutOfBoundsError = class extends BaseError2 {
      constructor({ length, position }) {
        super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`, { name: "PositionOutOfBoundsError" });
      }
    };
    RecursiveReadLimitExceededError = class extends BaseError2 {
      constructor({ count, limit }) {
        super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`, { name: "RecursiveReadLimitExceededError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/cursor.js
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
  const cursor = Object.create(staticCursor);
  cursor.bytes = bytes;
  cursor.dataView = new DataView(bytes.buffer ?? bytes, bytes.byteOffset, bytes.byteLength);
  cursor.positionReadCount = /* @__PURE__ */ new Map();
  cursor.recursiveReadLimit = recursiveReadLimit;
  return cursor;
}
var staticCursor;
var init_cursor2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/cursor.js"() {
    init_cursor();
    staticCursor = {
      bytes: new Uint8Array(),
      dataView: new DataView(new ArrayBuffer(0)),
      position: 0,
      positionReadCount: /* @__PURE__ */ new Map(),
      recursiveReadCount: 0,
      recursiveReadLimit: Number.POSITIVE_INFINITY,
      assertReadLimit() {
        if (this.recursiveReadCount >= this.recursiveReadLimit)
          throw new RecursiveReadLimitExceededError({
            count: this.recursiveReadCount + 1,
            limit: this.recursiveReadLimit
          });
      },
      assertPosition(position) {
        if (position < 0 || position > this.bytes.length - 1)
          throw new PositionOutOfBoundsError({
            length: this.bytes.length,
            position
          });
      },
      decrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position - offset;
        this.assertPosition(position);
        this.position = position;
      },
      getReadCount(position) {
        return this.positionReadCount.get(position || this.position) || 0;
      },
      incrementPosition(offset) {
        if (offset < 0)
          throw new NegativeOffsetError({ offset });
        const position = this.position + offset;
        this.assertPosition(position);
        this.position = position;
      },
      inspectByte(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectBytes(length, position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + length - 1);
        return this.bytes.subarray(position, position + length);
      },
      inspectUint8(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position);
        return this.bytes[position];
      },
      inspectUint16(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 1);
        return this.dataView.getUint16(position);
      },
      inspectUint24(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 2);
        return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
      },
      inspectUint32(position_) {
        const position = position_ ?? this.position;
        this.assertPosition(position + 3);
        return this.dataView.getUint32(position);
      },
      pushByte(byte) {
        this.assertPosition(this.position);
        this.bytes[this.position] = byte;
        this.position++;
      },
      pushBytes(bytes) {
        this.assertPosition(this.position + bytes.length - 1);
        this.bytes.set(bytes, this.position);
        this.position += bytes.length;
      },
      pushUint8(value) {
        this.assertPosition(this.position);
        this.bytes[this.position] = value;
        this.position++;
      },
      pushUint16(value) {
        this.assertPosition(this.position + 1);
        this.dataView.setUint16(this.position, value);
        this.position += 2;
      },
      pushUint24(value) {
        this.assertPosition(this.position + 2);
        this.dataView.setUint16(this.position, value >> 8);
        this.dataView.setUint8(this.position + 2, value & ~4294967040);
        this.position += 3;
      },
      pushUint32(value) {
        this.assertPosition(this.position + 3);
        this.dataView.setUint32(this.position, value);
        this.position += 4;
      },
      readByte() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectByte();
        this.position++;
        return value;
      },
      readBytes(length, size5) {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectBytes(length);
        this.position += size5 ?? length;
        return value;
      },
      readUint8() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint8();
        this.position += 1;
        return value;
      },
      readUint16() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint16();
        this.position += 2;
        return value;
      },
      readUint24() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint24();
        this.position += 3;
        return value;
      },
      readUint32() {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectUint32();
        this.position += 4;
        return value;
      },
      get remaining() {
        return this.bytes.length - this.position;
      },
      setPosition(position) {
        const oldPosition = this.position;
        this.assertPosition(position);
        this.position = position;
        return () => this.position = oldPosition;
      },
      _touch() {
        if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
          return;
        const count = this.getReadCount();
        this.positionReadCount.set(this.position, count + 1);
        if (count > 0)
          this.recursiveReadCount++;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/fromBytes.js
function bytesToBigInt(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToBigInt(hex, opts);
}
function bytesToBool(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes);
  }
  if (bytes.length > 1 || bytes[0] > 1)
    throw new InvalidBytesBooleanError(bytes);
  return Boolean(bytes[0]);
}
function bytesToNumber(bytes, opts = {}) {
  if (typeof opts.size !== "undefined")
    assertSize(bytes, { size: opts.size });
  const hex = bytesToHex(bytes, opts);
  return hexToNumber(hex, opts);
}
function bytesToString(bytes_, opts = {}) {
  let bytes = bytes_;
  if (typeof opts.size !== "undefined") {
    assertSize(bytes, { size: opts.size });
    bytes = trim(bytes, { dir: "right" });
  }
  return new TextDecoder().decode(bytes);
}
var init_fromBytes = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/fromBytes.js"() {
    init_encoding();
    init_trim();
    init_fromHex();
    init_toHex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
function decodeAbiParameters(params, data) {
  const bytes = typeof data === "string" ? hexToBytes(data) : data;
  const cursor = createCursor(bytes);
  if (size(bytes) === 0 && params.length > 0)
    throw new AbiDecodingZeroDataError();
  if (size(data) && size(data) < 32)
    throw new AbiDecodingDataSizeTooSmallError({
      data: typeof data === "string" ? data : bytesToHex(data),
      params,
      size: size(data)
    });
  let consumed = 0;
  const values = [];
  for (let i = 0; i < params.length; ++i) {
    const param = params[i];
    if (consumed < bytes.length)
      cursor.setPosition(consumed);
    const [data2, consumed_] = decodeParameter(cursor, param, {
      staticPosition: 0
    });
    consumed += consumed_;
    values.push(data2);
  }
  return values;
}
function decodeParameter(cursor, param, { staticPosition }) {
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return decodeArray(cursor, { ...param, type }, { length, staticPosition });
  }
  if (param.type === "tuple")
    return decodeTuple(cursor, param, { staticPosition });
  if (param.type === "address")
    return decodeAddress(cursor);
  if (param.type === "bool")
    return decodeBool(cursor);
  if (param.type.startsWith("bytes"))
    return decodeBytes(cursor, param, { staticPosition });
  if (param.type.startsWith("uint") || param.type.startsWith("int"))
    return decodeNumber(cursor, param);
  if (param.type === "string")
    return decodeString(cursor, { staticPosition });
  throw new InvalidAbiDecodingTypeError(param.type, {
    docsPath: "/docs/contract/decodeAbiParameters"
  });
}
function decodeAddress(cursor) {
  const value = cursor.readBytes(32);
  return [checksumAddress(bytesToHex(sliceBytes(value, -20))), 32];
}
function decodeArray(cursor, param, { length, staticPosition }) {
  if (length === null) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const startOfData = start + sizeOfLength;
    cursor.setPosition(start);
    const length2 = bytesToNumber(cursor.readBytes(sizeOfLength));
    const dynamicChild = hasDynamicChild(param);
    let consumed2 = 0;
    const value2 = [];
    for (let i = 0; i < length2; ++i) {
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed2));
      const [data, consumed_] = decodeParameter(cursor, param, {
        staticPosition: startOfData
      });
      consumed2 += consumed_;
      value2.push(data);
      if (consumed_ === 0) {
        cursor.assertReadLimit();
        cursor._touch();
      }
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    const value2 = [];
    for (let i = 0; i < length; ++i) {
      cursor.setPosition(start + i * 32);
      const [data] = decodeParameter(cursor, param, {
        staticPosition: start
      });
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  let consumed = 0;
  const value = [];
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter(cursor, param, {
      staticPosition: staticPosition + consumed
    });
    consumed += consumed_;
    value.push(data);
    if (consumed_ === 0) {
      cursor.assertReadLimit();
      cursor._touch();
    }
  }
  return [value, consumed];
}
function decodeBool(cursor) {
  return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes(cursor, param, { staticPosition }) {
  const [_, size5] = param.type.split("bytes");
  if (!size5) {
    const offset = bytesToNumber(cursor.readBytes(32));
    cursor.setPosition(staticPosition + offset);
    const length = bytesToNumber(cursor.readBytes(32));
    if (length === 0) {
      cursor.setPosition(staticPosition + 32);
      return ["0x", 32];
    }
    const data = cursor.readBytes(length);
    cursor.setPosition(staticPosition + 32);
    return [bytesToHex(data), 32];
  }
  const value = bytesToHex(cursor.readBytes(Number.parseInt(size5, 10), 32));
  return [value, 32];
}
function decodeNumber(cursor, param) {
  const signed = param.type.startsWith("int");
  const size5 = Number.parseInt(param.type.split("int")[1] || "256", 10);
  const value = cursor.readBytes(32);
  return [
    size5 > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }),
    32
  ];
}
function decodeTuple(cursor, param, { staticPosition }) {
  const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
  const value = hasUnnamedChild ? [] : {};
  let consumed = 0;
  if (hasDynamicChild(param)) {
    const offset = bytesToNumber(cursor.readBytes(sizeOfOffset));
    const start = staticPosition + offset;
    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i];
      cursor.setPosition(start + consumed);
      const [data, consumed_] = decodeParameter(cursor, component, {
        staticPosition: start
      });
      consumed += consumed_;
      value[hasUnnamedChild ? i : component?.name] = data;
    }
    cursor.setPosition(staticPosition + 32);
    return [value, 32];
  }
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i];
    const [data, consumed_] = decodeParameter(cursor, component, {
      staticPosition
    });
    value[hasUnnamedChild ? i : component?.name] = data;
    consumed += consumed_;
  }
  return [value, consumed];
}
function decodeString(cursor, { staticPosition }) {
  const offset = bytesToNumber(cursor.readBytes(32));
  const start = staticPosition + offset;
  cursor.setPosition(start);
  const length = bytesToNumber(cursor.readBytes(32));
  if (length === 0) {
    cursor.setPosition(staticPosition + 32);
    return ["", 32];
  }
  const data = cursor.readBytes(length, 32);
  const value = bytesToString(trim(data));
  cursor.setPosition(staticPosition + 32);
  return [value, 32];
}
function hasDynamicChild(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components?.some(hasDynamicChild);
  const arrayComponents = getArrayComponents(param.type);
  if (arrayComponents && hasDynamicChild({ ...param, type: arrayComponents[1] }))
    return true;
  return false;
}
var sizeOfLength, sizeOfOffset;
var init_decodeAbiParameters = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeAbiParameters.js"() {
    init_abi();
    init_getAddress();
    init_cursor2();
    init_size();
    init_slice();
    init_trim();
    init_fromBytes();
    init_toBytes();
    init_toHex();
    init_encodeAbiParameters();
    sizeOfLength = 32;
    sizeOfOffset = 32;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeErrorResult.js
function decodeErrorResult(parameters) {
  const { abi: abi2, data, cause } = parameters;
  const signature = slice(data, 0, 4);
  if (signature === "0x")
    throw new AbiDecodingZeroDataError({ cause });
  const abi_ = [...abi2 || [], solidityError, solidityPanic];
  const abiItem = abi_.find((x) => x.type === "error" && signature === toFunctionSelector(formatAbiItem2(x)));
  if (!abiItem)
    throw new AbiErrorSignatureNotFoundError(signature, {
      docsPath: "/docs/contract/decodeErrorResult",
      cause
    });
  return {
    abiItem,
    args: "inputs" in abiItem && abiItem.inputs && abiItem.inputs.length > 0 ? decodeAbiParameters(abiItem.inputs, slice(data, 4)) : void 0,
    errorName: abiItem.name
  };
}
var init_decodeErrorResult = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeErrorResult.js"() {
    init_solidity();
    init_abi();
    init_slice();
    init_toFunctionSelector();
    init_decodeAbiParameters();
    init_formatAbiItem2();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/stringify.js
var stringify;
var init_stringify = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/stringify.js"() {
    stringify = (value, replacer, space) => JSON.stringify(value, (key, value_) => {
      const value2 = typeof value_ === "bigint" ? value_.toString() : value_;
      return typeof replacer === "function" ? replacer(key, value2) : value2;
    }, space);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/formatAbiItemWithArgs.js
function formatAbiItemWithArgs({ abiItem, args, includeFunctionName = true, includeName = false }) {
  if (!("name" in abiItem))
    return;
  if (!("inputs" in abiItem))
    return;
  if (!abiItem.inputs)
    return;
  return `${includeFunctionName ? abiItem.name : ""}(${abiItem.inputs.map((input, i) => `${includeName && input.name ? `${input.name}: ` : ""}${typeof args[i] === "object" ? stringify(args[i]) : args[i]}`).join(", ")})`;
}
var init_formatAbiItemWithArgs = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/formatAbiItemWithArgs.js"() {
    init_stringify();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/unit.js
var etherUnits, gweiUnits;
var init_unit = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/unit.js"() {
    etherUnits = {
      gwei: 9,
      wei: 18
    };
    gweiUnits = {
      ether: -9,
      wei: 9
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatUnits.js
function formatUnits(value, decimals) {
  let display = value.toString();
  const negative = display.startsWith("-");
  if (negative)
    display = display.slice(1);
  display = display.padStart(decimals, "0");
  let [integer, fraction] = [
    display.slice(0, display.length - decimals),
    display.slice(display.length - decimals)
  ];
  fraction = fraction.replace(/(0+)$/, "");
  return `${negative ? "-" : ""}${integer || "0"}${fraction ? `.${fraction}` : ""}`;
}
var init_formatUnits = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatUnits.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatEther.js
function formatEther(wei, unit = "wei") {
  return formatUnits(wei, etherUnits[unit]);
}
var init_formatEther = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatEther.js"() {
    init_unit();
    init_formatUnits();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatGwei.js
function formatGwei(wei, unit = "wei") {
  return formatUnits(wei, gweiUnits[unit]);
}
var init_formatGwei = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/formatGwei.js"() {
    init_unit();
    init_formatUnits();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/stateOverride.js
function prettyStateMapping(stateMapping) {
  return stateMapping.reduce((pretty, { slot, value }) => {
    return `${pretty}        ${slot}: ${value}
`;
  }, "");
}
function prettyStateOverride(stateOverride) {
  return stateOverride.reduce((pretty, { address, ...state }) => {
    let val = `${pretty}    ${address}:
`;
    if (state.nonce)
      val += `      nonce: ${state.nonce}
`;
    if (state.balance)
      val += `      balance: ${state.balance}
`;
    if (state.code)
      val += `      code: ${state.code}
`;
    if (state.state) {
      val += "      state:\n";
      val += prettyStateMapping(state.state);
    }
    if (state.stateDiff) {
      val += "      stateDiff:\n";
      val += prettyStateMapping(state.stateDiff);
    }
    return val;
  }, "  State Override:\n").slice(0, -1);
}
var AccountStateConflictError, StateAssignmentConflictError;
var init_stateOverride = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/stateOverride.js"() {
    init_base();
    AccountStateConflictError = class extends BaseError2 {
      constructor({ address }) {
        super(`State for account "${address}" is set multiple times.`, {
          name: "AccountStateConflictError"
        });
      }
    };
    StateAssignmentConflictError = class extends BaseError2 {
      constructor() {
        super("state and stateDiff are set on the same account.", {
          name: "StateAssignmentConflictError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/transaction.js
function prettyPrint(args) {
  const entries = Object.entries(args).map(([key, value]) => {
    if (value === void 0 || value === false)
      return null;
    return [key, value];
  }).filter(Boolean);
  const maxLength = entries.reduce((acc, [key]) => Math.max(acc, key.length), 0);
  return entries.map(([key, value]) => `  ${`${key}:`.padEnd(maxLength + 1)}  ${value}`).join("\n");
}
var InvalidLegacyVError, InvalidYParityError, InvalidSerializableTransactionError, InvalidSerializedTransactionTypeError, InvalidSerializedTransactionError, InvalidStorageKeySizeError, TransactionExecutionError, TransactionNotFoundError, TransactionReceiptNotFoundError, TransactionReceiptRevertedError, WaitForTransactionReceiptTimeoutError;
var init_transaction = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/transaction.js"() {
    init_formatEther();
    init_formatGwei();
    init_base();
    InvalidLegacyVError = class extends BaseError2 {
      constructor({ v }) {
        super(`Invalid \`v\` value "${v}". Expected 27 or 28.`, {
          name: "InvalidLegacyVError"
        });
      }
    };
    InvalidYParityError = class extends BaseError2 {
      constructor({ yParity }) {
        super(`Invalid \`yParity\` value "${yParity}". Expected 0 or 1.`, {
          name: "InvalidYParityError"
        });
      }
    };
    InvalidSerializableTransactionError = class extends BaseError2 {
      constructor({ transaction }) {
        super("Cannot infer a transaction type from provided transaction.", {
          metaMessages: [
            "Provided Transaction:",
            "{",
            prettyPrint(transaction),
            "}",
            "",
            "To infer the type, either provide:",
            "- a `type` to the Transaction, or",
            "- an EIP-1559 Transaction with `maxFeePerGas`, or",
            "- an EIP-2930 Transaction with `gasPrice` & `accessList`, or",
            "- an EIP-4844 Transaction with `blobs`, `blobVersionedHashes`, `sidecars`, or",
            "- an EIP-7702 Transaction with `authorizationList`, or",
            "- a Legacy Transaction with `gasPrice`"
          ],
          name: "InvalidSerializableTransactionError"
        });
      }
    };
    InvalidSerializedTransactionTypeError = class extends BaseError2 {
      constructor({ serializedType }) {
        super(`Serialized transaction type "${serializedType}" is invalid.`, {
          name: "InvalidSerializedTransactionType"
        });
        Object.defineProperty(this, "serializedType", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.serializedType = serializedType;
      }
    };
    InvalidSerializedTransactionError = class extends BaseError2 {
      constructor({ attributes, serializedTransaction, type }) {
        const missing = Object.entries(attributes).map(([key, value]) => typeof value === "undefined" ? key : void 0).filter(Boolean);
        super(`Invalid serialized transaction of type "${type}" was provided.`, {
          metaMessages: [
            `Serialized Transaction: "${serializedTransaction}"`,
            missing.length > 0 ? `Missing Attributes: ${missing.join(", ")}` : ""
          ].filter(Boolean),
          name: "InvalidSerializedTransactionError"
        });
        Object.defineProperty(this, "serializedTransaction", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "type", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.serializedTransaction = serializedTransaction;
        this.type = type;
      }
    };
    InvalidStorageKeySizeError = class extends BaseError2 {
      constructor({ storageKey }) {
        super(`Size for storage key "${storageKey}" is invalid. Expected 32 bytes. Got ${Math.floor((storageKey.length - 2) / 2)} bytes.`, { name: "InvalidStorageKeySizeError" });
      }
    };
    TransactionExecutionError = class extends BaseError2 {
      constructor(cause, { account, docsPath: docsPath8, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }) {
        const prettyArgs = prettyPrint({
          chain: chain && `${chain?.name} (id: ${chain?.id})`,
          from: account?.address,
          to,
          value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
          data,
          gas,
          gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
          maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
          maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
          nonce
        });
        super(cause.shortMessage, {
          cause,
          docsPath: docsPath8,
          metaMessages: [
            ...cause.metaMessages ? [...cause.metaMessages, " "] : [],
            "Request Arguments:",
            prettyArgs
          ].filter(Boolean),
          name: "TransactionExecutionError"
        });
        Object.defineProperty(this, "cause", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.cause = cause;
      }
    };
    TransactionNotFoundError = class extends BaseError2 {
      constructor({ blockHash, blockNumber, blockTag, hash: hash3, index: index2 }) {
        let identifier = "Transaction";
        if (blockTag && index2 !== void 0)
          identifier = `Transaction at block time "${blockTag}" at index "${index2}"`;
        if (blockHash && index2 !== void 0)
          identifier = `Transaction at block hash "${blockHash}" at index "${index2}"`;
        if (blockNumber && index2 !== void 0)
          identifier = `Transaction at block number "${blockNumber}" at index "${index2}"`;
        if (hash3)
          identifier = `Transaction with hash "${hash3}"`;
        super(`${identifier} could not be found.`, {
          name: "TransactionNotFoundError"
        });
      }
    };
    TransactionReceiptNotFoundError = class extends BaseError2 {
      constructor({ hash: hash3 }) {
        super(`Transaction receipt with hash "${hash3}" could not be found. The Transaction may not be processed on a block yet.`, {
          name: "TransactionReceiptNotFoundError"
        });
      }
    };
    TransactionReceiptRevertedError = class extends BaseError2 {
      constructor({ receipt }) {
        super(`Transaction with hash "${receipt.transactionHash}" reverted.`, {
          metaMessages: [
            'The receipt marked the transaction as "reverted". This could mean that the function on the contract you are trying to call threw an error.',
            " ",
            "You can attempt to extract the revert reason by:",
            "- calling the `simulateContract` or `simulateCalls` Action with the `abi` and `functionName` of the contract",
            "- using the `call` Action with raw `data`"
          ],
          name: "TransactionReceiptRevertedError"
        });
        Object.defineProperty(this, "receipt", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.receipt = receipt;
      }
    };
    WaitForTransactionReceiptTimeoutError = class extends BaseError2 {
      constructor({ hash: hash3 }) {
        super(`Timed out while waiting for transaction with hash "${hash3}" to be confirmed.`, { name: "WaitForTransactionReceiptTimeoutError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/utils.js
function getAbortError(signal) {
  if (signal?.reason)
    return signal.reason;
  if (typeof DOMException === "function")
    return new DOMException("This operation was aborted", "AbortError");
  const error = new Error("This operation was aborted");
  error.name = "AbortError";
  return error;
}
function isAbortError(error) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AbortError";
}
var getContractAddress, getUrl;
var init_utils3 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/utils.js"() {
    getContractAddress = (address) => address;
    getUrl = (url) => {
      try {
        const parsed = new URL(url);
        if (!parsed.username && !parsed.password)
          return url;
        parsed.username = "";
        parsed.password = "";
        return parsed.toString();
      } catch {
        return url;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/contract.js
var CallExecutionError, ContractFunctionExecutionError, ContractFunctionRevertedError, ContractFunctionZeroDataError, CounterfactualDeploymentFailedError, RawContractError;
var init_contract = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/contract.js"() {
    init_parseAccount();
    init_solidity();
    init_decodeErrorResult();
    init_formatAbiItem2();
    init_formatAbiItemWithArgs();
    init_getAbiItem();
    init_formatEther();
    init_formatGwei();
    init_abi();
    init_base();
    init_stateOverride();
    init_transaction();
    init_utils3();
    CallExecutionError = class extends BaseError2 {
      constructor(cause, { account: account_, docsPath: docsPath8, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value, stateOverride }) {
        const account = account_ ? parseAccount(account_) : void 0;
        let prettyArgs = prettyPrint({
          from: account?.address,
          to,
          value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
          data,
          gas,
          gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
          maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
          maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
          nonce
        });
        if (stateOverride) {
          prettyArgs += `
${prettyStateOverride(stateOverride)}`;
        }
        super(cause.shortMessage, {
          cause,
          docsPath: docsPath8,
          metaMessages: [
            ...cause.metaMessages ? [...cause.metaMessages, " "] : [],
            "Raw Call Arguments:",
            prettyArgs
          ].filter(Boolean),
          name: "CallExecutionError"
        });
        Object.defineProperty(this, "cause", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.cause = cause;
      }
    };
    ContractFunctionExecutionError = class extends BaseError2 {
      constructor(cause, { abi: abi2, args, contractAddress, docsPath: docsPath8, functionName, sender }) {
        const abiItem = getAbiItem({ abi: abi2, args, name: functionName });
        const formattedArgs = abiItem ? formatAbiItemWithArgs({
          abiItem,
          args,
          includeFunctionName: false,
          includeName: false
        }) : void 0;
        const functionWithParams = abiItem ? formatAbiItem2(abiItem, { includeName: true }) : void 0;
        const prettyArgs = prettyPrint({
          address: contractAddress && getContractAddress(contractAddress),
          function: functionWithParams,
          args: formattedArgs && formattedArgs !== "()" && `${[...Array(functionName?.length ?? 0).keys()].map(() => " ").join("")}${formattedArgs}`,
          sender
        });
        super(cause.shortMessage || `An unknown error occurred while executing the contract function "${functionName}".`, {
          cause,
          docsPath: docsPath8,
          metaMessages: [
            ...cause.metaMessages ? [...cause.metaMessages, " "] : [],
            prettyArgs && "Contract Call:",
            prettyArgs
          ].filter(Boolean),
          name: "ContractFunctionExecutionError"
        });
        Object.defineProperty(this, "abi", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "args", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "cause", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "contractAddress", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "formattedArgs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "functionName", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "sender", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.abi = abi2;
        this.args = args;
        this.cause = cause;
        this.contractAddress = contractAddress;
        this.functionName = functionName;
        this.sender = sender;
      }
    };
    ContractFunctionRevertedError = class extends BaseError2 {
      constructor({ abi: abi2, data, functionName, message, cause: error }) {
        let cause;
        let decodedData;
        let metaMessages;
        let reason;
        if (data && data !== "0x") {
          try {
            decodedData = decodeErrorResult({ abi: abi2, data, cause: error });
            const { abiItem, errorName, args: errorArgs } = decodedData;
            if (errorName === "Error") {
              reason = errorArgs[0];
            } else if (errorName === "Panic") {
              const [firstArg] = errorArgs;
              reason = panicReasons[firstArg];
            } else {
              const errorWithParams = abiItem ? formatAbiItem2(abiItem, { includeName: true }) : void 0;
              const formattedArgs = abiItem && errorArgs ? formatAbiItemWithArgs({
                abiItem,
                args: errorArgs,
                includeFunctionName: false,
                includeName: false
              }) : void 0;
              metaMessages = [
                errorWithParams ? `Error: ${errorWithParams}` : "",
                formattedArgs && formattedArgs !== "()" ? `       ${[...Array(errorName?.length ?? 0).keys()].map(() => " ").join("")}${formattedArgs}` : ""
              ];
            }
          } catch (err) {
            cause = err;
          }
        } else if (message)
          reason = message;
        let signature;
        if (cause instanceof AbiErrorSignatureNotFoundError) {
          signature = cause.signature;
          metaMessages = [
            `Unable to decode signature "${signature}" as it was not found on the provided ABI.`,
            "Make sure you are using the correct ABI and that the error exists on it.",
            `You can look up the decoded signature here: https://4byte.sourcify.dev/?q=${signature}.`
          ];
        }
        super(reason && reason !== "execution reverted" || signature ? [
          `The contract function "${functionName}" reverted with the following ${signature ? "signature" : "reason"}:`,
          reason || signature
        ].join("\n") : `The contract function "${functionName}" reverted.`, {
          cause: cause ?? error,
          metaMessages,
          name: "ContractFunctionRevertedError"
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "raw", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "reason", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "signature", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = decodedData;
        this.raw = data;
        this.reason = reason;
        this.signature = signature;
      }
    };
    ContractFunctionZeroDataError = class extends BaseError2 {
      constructor({ functionName, cause }) {
        super(`The contract function "${functionName}" returned no data ("0x").`, {
          metaMessages: [
            "This could be due to any of the following:",
            `  - The contract does not have the function "${functionName}",`,
            "  - The parameters passed to the contract function may be invalid, or",
            "  - The address is not a contract."
          ],
          name: "ContractFunctionZeroDataError",
          cause
        });
      }
    };
    CounterfactualDeploymentFailedError = class extends BaseError2 {
      constructor({ factory }) {
        super(`Deployment for counterfactual contract call failed${factory ? ` for factory "${factory}".` : ""}`, {
          metaMessages: [
            "Please ensure:",
            "- The `factory` is a valid contract deployment factory (ie. Create2 Factory, ERC-4337 Factory, etc).",
            "- The `factoryData` is a valid encoded function call for contract deployment function on the factory."
          ],
          name: "CounterfactualDeploymentFailedError"
        });
      }
    };
    RawContractError = class extends BaseError2 {
      constructor({ data, message }) {
        super(message || "", { name: "RawContractError" });
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: 3
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = data;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/request.js
var HttpRequestError, ResponseBodyTooLargeError, RpcRequestError, TimeoutError;
var init_request = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/request.js"() {
    init_stringify();
    init_base();
    init_utils3();
    HttpRequestError = class extends BaseError2 {
      constructor({ body, cause, details, headers, status, url }) {
        super("HTTP request failed.", {
          cause,
          details,
          metaMessages: [
            status && `Status: ${status}`,
            `URL: ${getUrl(url)}`,
            body && `Request body: ${stringify(body)}`
          ].filter(Boolean),
          name: "HttpRequestError"
        });
        Object.defineProperty(this, "body", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "headers", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "status", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "url", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.body = body;
        this.headers = headers;
        this.status = status;
        this.url = url;
      }
    };
    ResponseBodyTooLargeError = class extends BaseError2 {
      constructor({ maxSize, size: size5 }) {
        super("HTTP response body exceeded the size limit.", {
          metaMessages: [`Max: ${maxSize} bytes`, `Received: ${size5} bytes`],
          name: "ResponseBodyTooLargeError"
        });
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "size", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = maxSize;
        this.size = size5;
      }
    };
    RpcRequestError = class extends BaseError2 {
      constructor({ body, error, url }) {
        super("RPC Request failed.", {
          cause: error,
          details: error.message,
          metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify(body)}`],
          name: "RpcRequestError"
        });
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "url", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.code = error.code;
        this.data = error.data;
        this.url = url;
      }
    };
    TimeoutError = class extends BaseError2 {
      constructor({ body, url }) {
        super("The request took too long to respond.", {
          details: "The request timed out.",
          metaMessages: [`URL: ${getUrl(url)}`, `Request body: ${stringify(body)}`],
          name: "TimeoutError"
        });
        Object.defineProperty(this, "url", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.url = url;
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/rpc.js
var unknownErrorCode, RpcError, ProviderRpcError, ParseRpcError, InvalidRequestRpcError, MethodNotFoundRpcError, InvalidParamsRpcError, InternalRpcError, InvalidInputRpcError, ResourceNotFoundRpcError, ResourceUnavailableRpcError, TransactionRejectedRpcError, MethodNotSupportedRpcError, LimitExceededRpcError, JsonRpcVersionUnsupportedError, UserRejectedRequestError, UnauthorizedProviderError, UnsupportedProviderMethodError, ProviderDisconnectedError, ChainDisconnectedError, SwitchChainError, UnsupportedNonOptionalCapabilityError, UnsupportedChainIdError, DuplicateIdError, UnknownBundleIdError, BundleTooLargeError, AtomicReadyWalletRejectedUpgradeError, AtomicityNotSupportedError, WalletConnectSessionSettlementError, UnknownRpcError;
var init_rpc = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/rpc.js"() {
    init_base();
    init_request();
    unknownErrorCode = -1;
    RpcError = class extends BaseError2 {
      constructor(cause, { code, docsPath: docsPath8, metaMessages, name, shortMessage }) {
        super(shortMessage, {
          cause,
          docsPath: docsPath8,
          metaMessages: metaMessages || cause?.metaMessages,
          name: name || "RpcError"
        });
        Object.defineProperty(this, "code", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.name = name || cause.name;
        this.code = cause instanceof RpcRequestError ? cause.code : code ?? unknownErrorCode;
      }
    };
    ProviderRpcError = class extends RpcError {
      constructor(cause, options) {
        super(cause, options);
        Object.defineProperty(this, "data", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.data = options.data;
      }
    };
    ParseRpcError = class _ParseRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ParseRpcError.code,
          name: "ParseRpcError",
          shortMessage: "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text."
        });
      }
    };
    Object.defineProperty(ParseRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32700
    });
    InvalidRequestRpcError = class _InvalidRequestRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidRequestRpcError.code,
          name: "InvalidRequestRpcError",
          shortMessage: "JSON is not a valid request object."
        });
      }
    };
    Object.defineProperty(InvalidRequestRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32600
    });
    MethodNotFoundRpcError = class _MethodNotFoundRpcError extends RpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _MethodNotFoundRpcError.code,
          name: "MethodNotFoundRpcError",
          shortMessage: `The method${method ? ` "${method}"` : ""} does not exist / is not available.`
        });
      }
    };
    Object.defineProperty(MethodNotFoundRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32601
    });
    InvalidParamsRpcError = class _InvalidParamsRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidParamsRpcError.code,
          name: "InvalidParamsRpcError",
          shortMessage: [
            "Invalid parameters were provided to the RPC method.",
            "Double check you have provided the correct parameters."
          ].join("\n")
        });
      }
    };
    Object.defineProperty(InvalidParamsRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32602
    });
    InternalRpcError = class _InternalRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InternalRpcError.code,
          name: "InternalRpcError",
          shortMessage: "An internal error was received."
        });
      }
    };
    Object.defineProperty(InternalRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32603
    });
    InvalidInputRpcError = class _InvalidInputRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _InvalidInputRpcError.code,
          name: "InvalidInputRpcError",
          shortMessage: [
            "Missing or invalid parameters.",
            "Double check you have provided the correct parameters."
          ].join("\n")
        });
      }
    };
    Object.defineProperty(InvalidInputRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32e3
    });
    ResourceNotFoundRpcError = class _ResourceNotFoundRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ResourceNotFoundRpcError.code,
          name: "ResourceNotFoundRpcError",
          shortMessage: "Requested resource not found."
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "ResourceNotFoundRpcError"
        });
      }
    };
    Object.defineProperty(ResourceNotFoundRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32001
    });
    ResourceUnavailableRpcError = class _ResourceUnavailableRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _ResourceUnavailableRpcError.code,
          name: "ResourceUnavailableRpcError",
          shortMessage: "Requested resource not available."
        });
      }
    };
    Object.defineProperty(ResourceUnavailableRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32002
    });
    TransactionRejectedRpcError = class _TransactionRejectedRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _TransactionRejectedRpcError.code,
          name: "TransactionRejectedRpcError",
          shortMessage: "Transaction creation failed."
        });
      }
    };
    Object.defineProperty(TransactionRejectedRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32003
    });
    MethodNotSupportedRpcError = class _MethodNotSupportedRpcError extends RpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _MethodNotSupportedRpcError.code,
          name: "MethodNotSupportedRpcError",
          shortMessage: `Method${method ? ` "${method}"` : ""} is not supported.`
        });
      }
    };
    Object.defineProperty(MethodNotSupportedRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32004
    });
    LimitExceededRpcError = class _LimitExceededRpcError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _LimitExceededRpcError.code,
          name: "LimitExceededRpcError",
          shortMessage: "Request exceeds defined limit."
        });
      }
    };
    Object.defineProperty(LimitExceededRpcError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32005
    });
    JsonRpcVersionUnsupportedError = class _JsonRpcVersionUnsupportedError extends RpcError {
      constructor(cause) {
        super(cause, {
          code: _JsonRpcVersionUnsupportedError.code,
          name: "JsonRpcVersionUnsupportedError",
          shortMessage: "Version of JSON-RPC protocol is not supported."
        });
      }
    };
    Object.defineProperty(JsonRpcVersionUnsupportedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: -32006
    });
    UserRejectedRequestError = class _UserRejectedRequestError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UserRejectedRequestError.code,
          name: "UserRejectedRequestError",
          shortMessage: "User rejected the request."
        });
      }
    };
    Object.defineProperty(UserRejectedRequestError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4001
    });
    UnauthorizedProviderError = class _UnauthorizedProviderError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnauthorizedProviderError.code,
          name: "UnauthorizedProviderError",
          shortMessage: "The requested method and/or account has not been authorized by the user."
        });
      }
    };
    Object.defineProperty(UnauthorizedProviderError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4100
    });
    UnsupportedProviderMethodError = class _UnsupportedProviderMethodError extends ProviderRpcError {
      constructor(cause, { method } = {}) {
        super(cause, {
          code: _UnsupportedProviderMethodError.code,
          name: "UnsupportedProviderMethodError",
          shortMessage: `The Provider does not support the requested method${method ? ` " ${method}"` : ""}.`
        });
      }
    };
    Object.defineProperty(UnsupportedProviderMethodError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4200
    });
    ProviderDisconnectedError = class _ProviderDisconnectedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _ProviderDisconnectedError.code,
          name: "ProviderDisconnectedError",
          shortMessage: "The Provider is disconnected from all chains."
        });
      }
    };
    Object.defineProperty(ProviderDisconnectedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4900
    });
    ChainDisconnectedError = class _ChainDisconnectedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _ChainDisconnectedError.code,
          name: "ChainDisconnectedError",
          shortMessage: "The Provider is not connected to the requested chain."
        });
      }
    };
    Object.defineProperty(ChainDisconnectedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4901
    });
    SwitchChainError = class _SwitchChainError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _SwitchChainError.code,
          name: "SwitchChainError",
          shortMessage: "An error occurred when attempting to switch chain."
        });
      }
    };
    Object.defineProperty(SwitchChainError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 4902
    });
    UnsupportedNonOptionalCapabilityError = class _UnsupportedNonOptionalCapabilityError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnsupportedNonOptionalCapabilityError.code,
          name: "UnsupportedNonOptionalCapabilityError",
          shortMessage: "This Wallet does not support a capability that was not marked as optional."
        });
      }
    };
    Object.defineProperty(UnsupportedNonOptionalCapabilityError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5700
    });
    UnsupportedChainIdError = class _UnsupportedChainIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnsupportedChainIdError.code,
          name: "UnsupportedChainIdError",
          shortMessage: "This Wallet does not support the requested chain ID."
        });
      }
    };
    Object.defineProperty(UnsupportedChainIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5710
    });
    DuplicateIdError = class _DuplicateIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _DuplicateIdError.code,
          name: "DuplicateIdError",
          shortMessage: "There is already a bundle submitted with this ID."
        });
      }
    };
    Object.defineProperty(DuplicateIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5720
    });
    UnknownBundleIdError = class _UnknownBundleIdError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _UnknownBundleIdError.code,
          name: "UnknownBundleIdError",
          shortMessage: "This bundle id is unknown / has not been submitted"
        });
      }
    };
    Object.defineProperty(UnknownBundleIdError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5730
    });
    BundleTooLargeError = class _BundleTooLargeError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _BundleTooLargeError.code,
          name: "BundleTooLargeError",
          shortMessage: "The call bundle is too large for the Wallet to process."
        });
      }
    };
    Object.defineProperty(BundleTooLargeError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5740
    });
    AtomicReadyWalletRejectedUpgradeError = class _AtomicReadyWalletRejectedUpgradeError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _AtomicReadyWalletRejectedUpgradeError.code,
          name: "AtomicReadyWalletRejectedUpgradeError",
          shortMessage: "The Wallet can support atomicity after an upgrade, but the user rejected the upgrade."
        });
      }
    };
    Object.defineProperty(AtomicReadyWalletRejectedUpgradeError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5750
    });
    AtomicityNotSupportedError = class _AtomicityNotSupportedError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _AtomicityNotSupportedError.code,
          name: "AtomicityNotSupportedError",
          shortMessage: "The wallet does not support atomic execution but the request requires it."
        });
      }
    };
    Object.defineProperty(AtomicityNotSupportedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 5760
    });
    WalletConnectSessionSettlementError = class _WalletConnectSessionSettlementError extends ProviderRpcError {
      constructor(cause) {
        super(cause, {
          code: _WalletConnectSessionSettlementError.code,
          name: "WalletConnectSessionSettlementError",
          shortMessage: "WalletConnect session settlement failed."
        });
      }
    };
    Object.defineProperty(WalletConnectSessionSettlementError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 7e3
    });
    UnknownRpcError = class extends RpcError {
      constructor(cause) {
        super(cause, {
          name: "UnknownRpcError",
          shortMessage: "An unknown RPC error occurred."
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE3) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE3);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE3 ? 4 : 0;
  const l = isLE3 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE3);
  view.setUint32(byteOffset + l, wl, isLE3);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD, SHA256_IV;
var init_md = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_md.js"() {
    init_utils2();
    HashMD = class extends Hash {
      constructor(blockLen, outputLen, padOffset, isLE3) {
        super();
        this.finished = false;
        this.length = 0;
        this.pos = 0;
        this.destroyed = false;
        this.blockLen = blockLen;
        this.outputLen = outputLen;
        this.padOffset = padOffset;
        this.isLE = isLE3;
        this.buffer = new Uint8Array(blockLen);
        this.view = createView(this.buffer);
      }
      update(data) {
        aexists(this);
        data = toBytes2(data);
        abytes(data);
        const { view, buffer: buffer2, blockLen } = this;
        const len = data.length;
        for (let pos = 0; pos < len; ) {
          const take = Math.min(blockLen - this.pos, len - pos);
          if (take === blockLen) {
            const dataView = createView(data);
            for (; blockLen <= len - pos; pos += blockLen)
              this.process(dataView, pos);
            continue;
          }
          buffer2.set(data.subarray(pos, pos + take), this.pos);
          this.pos += take;
          pos += take;
          if (this.pos === blockLen) {
            this.process(view, 0);
            this.pos = 0;
          }
        }
        this.length += data.length;
        this.roundClean();
        return this;
      }
      digestInto(out) {
        aexists(this);
        aoutput(out, this);
        this.finished = true;
        const { buffer: buffer2, view, blockLen, isLE: isLE3 } = this;
        let { pos } = this;
        buffer2[pos++] = 128;
        clean(this.buffer.subarray(pos));
        if (this.padOffset > blockLen - pos) {
          this.process(view, 0);
          pos = 0;
        }
        for (let i = pos; i < blockLen; i++)
          buffer2[i] = 0;
        setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE3);
        this.process(view, 0);
        const oview = createView(out);
        const len = this.outputLen;
        if (len % 4)
          throw new Error("_sha2: outputLen should be aligned to 32bit");
        const outLen = len / 4;
        const state = this.get();
        if (outLen > state.length)
          throw new Error("_sha2: outputLen bigger than state");
        for (let i = 0; i < outLen; i++)
          oview.setUint32(4 * i, state[i], isLE3);
      }
      digest() {
        const { buffer: buffer2, outputLen } = this;
        this.digestInto(buffer2);
        const res = buffer2.slice(0, outputLen);
        this.destroy();
        return res;
      }
      _cloneInto(to) {
        to || (to = new this.constructor());
        to.set(...this.get());
        const { blockLen, buffer: buffer2, length, finished, destroyed, pos } = this;
        to.destroyed = destroyed;
        to.finished = finished;
        to.length = length;
        to.pos = pos;
        if (length % blockLen)
          to.buffer.set(buffer2);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
    };
    SHA256_IV = /* @__PURE__ */ Uint32Array.from([
      1779033703,
      3144134277,
      1013904242,
      2773480762,
      1359893119,
      2600822924,
      528734635,
      1541459225
    ]);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha2.js
var SHA256_K, SHA256_W, SHA256, sha256;
var init_sha2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha2.js"() {
    init_md();
    init_utils2();
    SHA256_K = /* @__PURE__ */ Uint32Array.from([
      1116352408,
      1899447441,
      3049323471,
      3921009573,
      961987163,
      1508970993,
      2453635748,
      2870763221,
      3624381080,
      310598401,
      607225278,
      1426881987,
      1925078388,
      2162078206,
      2614888103,
      3248222580,
      3835390401,
      4022224774,
      264347078,
      604807628,
      770255983,
      1249150122,
      1555081692,
      1996064986,
      2554220882,
      2821834349,
      2952996808,
      3210313671,
      3336571891,
      3584528711,
      113926993,
      338241895,
      666307205,
      773529912,
      1294757372,
      1396182291,
      1695183700,
      1986661051,
      2177026350,
      2456956037,
      2730485921,
      2820302411,
      3259730800,
      3345764771,
      3516065817,
      3600352804,
      4094571909,
      275423344,
      430227734,
      506948616,
      659060556,
      883997877,
      958139571,
      1322822218,
      1537002063,
      1747873779,
      1955562222,
      2024104815,
      2227730452,
      2361852424,
      2428436474,
      2756734187,
      3204031479,
      3329325298
    ]);
    SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    SHA256 = class extends HashMD {
      constructor(outputLen = 32) {
        super(64, outputLen, 8, false);
        this.A = SHA256_IV[0] | 0;
        this.B = SHA256_IV[1] | 0;
        this.C = SHA256_IV[2] | 0;
        this.D = SHA256_IV[3] | 0;
        this.E = SHA256_IV[4] | 0;
        this.F = SHA256_IV[5] | 0;
        this.G = SHA256_IV[6] | 0;
        this.H = SHA256_IV[7] | 0;
      }
      get() {
        const { A, B, C, D, E, F, G, H } = this;
        return [A, B, C, D, E, F, G, H];
      }
      // prettier-ignore
      set(A, B, C, D, E, F, G, H) {
        this.A = A | 0;
        this.B = B | 0;
        this.C = C | 0;
        this.D = D | 0;
        this.E = E | 0;
        this.F = F | 0;
        this.G = G | 0;
        this.H = H | 0;
      }
      process(view, offset) {
        for (let i = 0; i < 16; i++, offset += 4)
          SHA256_W[i] = view.getUint32(offset, false);
        for (let i = 16; i < 64; i++) {
          const W15 = SHA256_W[i - 15];
          const W2 = SHA256_W[i - 2];
          const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
          const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
          SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
        }
        let { A, B, C, D, E, F, G, H } = this;
        for (let i = 0; i < 64; i++) {
          const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
          const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
          const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
          const T2 = sigma0 + Maj(A, B, C) | 0;
          H = G;
          G = F;
          F = E;
          E = D + T1 | 0;
          D = C;
          C = B;
          B = A;
          A = T1 + T2 | 0;
        }
        A = A + this.A | 0;
        B = B + this.B | 0;
        C = C + this.C | 0;
        D = D + this.D | 0;
        E = E + this.E | 0;
        F = F + this.F | 0;
        G = G + this.G | 0;
        H = H + this.H | 0;
        this.set(A, B, C, D, E, F, G, H);
      }
      roundClean() {
        clean(SHA256_W);
      }
      destroy() {
        this.set(0, 0, 0, 0, 0, 0, 0, 0);
        clean(this.buffer);
      }
    };
    sha256 = /* @__PURE__ */ createHasher(() => new SHA256());
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/hmac.js
var HMAC, hmac;
var init_hmac = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/hmac.js"() {
    init_utils2();
    HMAC = class extends Hash {
      constructor(hash3, _key) {
        super();
        this.finished = false;
        this.destroyed = false;
        ahash(hash3);
        const key = toBytes2(_key);
        this.iHash = hash3.create();
        if (typeof this.iHash.update !== "function")
          throw new Error("Expected instance of class which extends utils.Hash");
        this.blockLen = this.iHash.blockLen;
        this.outputLen = this.iHash.outputLen;
        const blockLen = this.blockLen;
        const pad4 = new Uint8Array(blockLen);
        pad4.set(key.length > blockLen ? hash3.create().update(key).digest() : key);
        for (let i = 0; i < pad4.length; i++)
          pad4[i] ^= 54;
        this.iHash.update(pad4);
        this.oHash = hash3.create();
        for (let i = 0; i < pad4.length; i++)
          pad4[i] ^= 54 ^ 92;
        this.oHash.update(pad4);
        clean(pad4);
      }
      update(buf) {
        aexists(this);
        this.iHash.update(buf);
        return this;
      }
      digestInto(out) {
        aexists(this);
        abytes(out, this.outputLen);
        this.finished = true;
        this.iHash.digestInto(out);
        this.oHash.update(out);
        this.oHash.digestInto(out);
        this.destroy();
      }
      digest() {
        const out = new Uint8Array(this.oHash.outputLen);
        this.digestInto(out);
        return out;
      }
      _cloneInto(to) {
        to || (to = Object.create(Object.getPrototypeOf(this), {}));
        const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
        to = to;
        to.finished = finished;
        to.destroyed = destroyed;
        to.blockLen = blockLen;
        to.outputLen = outputLen;
        to.oHash = oHash._cloneInto(to.oHash);
        to.iHash = iHash._cloneInto(to.iHash);
        return to;
      }
      clone() {
        return this._cloneInto();
      }
      destroy() {
        this.destroyed = true;
        this.oHash.destroy();
        this.iHash.destroy();
      }
    };
    hmac = (hash3, key, message) => new HMAC(hash3, key).update(message).digest();
    hmac.create = (hash3, key) => new HMAC(hash3, key);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/utils.js
function isBytes2(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes2(item) {
  if (!isBytes2(item))
    throw new Error("Uint8Array expected");
}
function abool(title, value) {
  if (typeof value !== "boolean")
    throw new Error(title + " boolean expected, got " + value);
}
function numberToHexUnpadded(num2) {
  const hex = num2.toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber2(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n2 : BigInt("0x" + hex);
}
function bytesToHex3(bytes) {
  abytes2(bytes);
  if (hasHexBuiltin2)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes3[bytes[i]];
  }
  return hex;
}
function asciiToBase162(ch) {
  if (ch >= asciis2._0 && ch <= asciis2._9)
    return ch - asciis2._0;
  if (ch >= asciis2.A && ch <= asciis2.F)
    return ch - (asciis2.A - 10);
  if (ch >= asciis2.a && ch <= asciis2.f)
    return ch - (asciis2.a - 10);
  return;
}
function hexToBytes3(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin2)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase162(hex.charCodeAt(hi));
    const n2 = asciiToBase162(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function bytesToNumberBE(bytes) {
  return hexToNumber2(bytesToHex3(bytes));
}
function bytesToNumberLE(bytes) {
  abytes2(bytes);
  return hexToNumber2(bytesToHex3(Uint8Array.from(bytes).reverse()));
}
function numberToBytesBE(n, len) {
  return hexToBytes3(n.toString(16).padStart(len * 2, "0"));
}
function numberToBytesLE(n, len) {
  return numberToBytesBE(n, len).reverse();
}
function ensureBytes(title, hex, expectedLength) {
  let res;
  if (typeof hex === "string") {
    try {
      res = hexToBytes3(hex);
    } catch (e) {
      throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
    }
  } else if (isBytes2(hex)) {
    res = Uint8Array.from(hex);
  } else {
    throw new Error(title + " must be hex string or Uint8Array");
  }
  const len = res.length;
  if (typeof expectedLength === "number" && len !== expectedLength)
    throw new Error(title + " of length " + expectedLength + " expected, got " + len);
  return res;
}
function concatBytes3(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    abytes2(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad4 = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad4);
    pad4 += a.length;
  }
  return res;
}
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function inRange(n, min, max) {
  return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
}
function aInRange(title, n, min, max) {
  if (!inRange(n, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
}
function bitLen(n) {
  let len;
  for (len = 0; n > _0n2; n >>= _1n2, len += 1)
    ;
  return len;
}
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  if (typeof hashLen !== "number" || hashLen < 2)
    throw new Error("hashLen must be a number");
  if (typeof qByteLen !== "number" || qByteLen < 2)
    throw new Error("qByteLen must be a number");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i = 0;
  };
  const h = (...b) => hmacFn(k, v, ...b);
  const reseed = (seed = u8n(0)) => {
    k = h(u8fr([0]), seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(u8fr([1]), seed);
    v = h();
  };
  const gen2 = () => {
    if (i++ >= 1e3)
      throw new Error("drbg: tried 1000 values");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes3(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen2())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, validators, optValidators = {}) {
  const checkField = (fieldName, type, isOptional) => {
    const checkVal = validatorFns[type];
    if (typeof checkVal !== "function")
      throw new Error("invalid validator function");
    const val = object[fieldName];
    if (isOptional && val === void 0)
      return;
    if (!checkVal(val, object)) {
      throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
    }
  };
  for (const [fieldName, type] of Object.entries(validators))
    checkField(fieldName, type, false);
  for (const [fieldName, type] of Object.entries(optValidators))
    checkField(fieldName, type, true);
  return object;
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}
var _0n2, _1n2, hasHexBuiltin2, hexes3, asciis2, isPosBig, bitMask, u8n, u8fr, validatorFns;
var init_utils4 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/utils.js"() {
    _0n2 = /* @__PURE__ */ BigInt(0);
    _1n2 = /* @__PURE__ */ BigInt(1);
    hasHexBuiltin2 = // @ts-ignore
    typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function";
    hexes3 = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    asciis2 = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    isPosBig = (n) => typeof n === "bigint" && _0n2 <= n;
    bitMask = (n) => (_1n2 << BigInt(n)) - _1n2;
    u8n = (len) => new Uint8Array(len);
    u8fr = (arr) => Uint8Array.from(arr);
    validatorFns = {
      bigint: (val) => typeof val === "bigint",
      function: (val) => typeof val === "function",
      boolean: (val) => typeof val === "boolean",
      string: (val) => typeof val === "string",
      stringOrUint8Array: (val) => typeof val === "string" || isBytes2(val),
      isSafeInteger: (val) => Number.isSafeInteger(val),
      array: (val) => Array.isArray(val),
      field: (val, object) => object.Fp.isValid(val),
      hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/modular.js
function mod(a, b) {
  const result = a % b;
  return result >= _0n3 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n3) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n3)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n3)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n3, y = _1n3, u = _1n3, v = _0n3;
  while (a !== _0n3) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n3)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function sqrt3mod4(Fp, n) {
  const p1div4 = (Fp.ORDER + _1n3) / _4n;
  const root = Fp.pow(n, p1div4);
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function sqrt5mod8(Fp, n) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n2 = Fp.mul(n, _2n2);
  const v = Fp.pow(n2, p5div8);
  const nv = Fp.mul(n, v);
  const i = Fp.mul(Fp.mul(nv, _2n2), v);
  const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
  if (!Fp.eql(Fp.sqr(root), n))
    throw new Error("Cannot find square root");
  return root;
}
function tonelliShanks(P) {
  if (P < BigInt(3))
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n3;
  let S = 0;
  while (Q % _2n2 === _0n3) {
    Q /= _2n2;
    S++;
  }
  let Z = _2n2;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n3) / _2n2;
  return function tonelliSlow(Fp, n) {
    if (Fp.is0(n))
      return n;
    if (FpLegendre(Fp, n) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c = Fp.mul(Fp.ONE, cc);
    let t = Fp.pow(n, Q);
    let R = Fp.pow(n, Q1div2);
    while (!Fp.eql(t, Fp.ONE)) {
      if (Fp.is0(t))
        return Fp.ZERO;
      let i = 1;
      let t_tmp = Fp.sqr(t);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i++;
        t_tmp = Fp.sqr(t_tmp);
        if (i === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n3 << BigInt(M - i - 1);
      const b = Fp.pow(c, exponent);
      M = i;
      c = Fp.sqr(b);
      t = Fp.mul(t, c);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  return tonelliShanks(P);
}
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    MASK: "bigint",
    BYTES: "isSafeInteger",
    BITS: "isSafeInteger"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  return validateObject(field, opts);
}
function FpPow(Fp, num2, power) {
  if (power < _0n3)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n3)
    return Fp.ONE;
  if (power === _1n3)
    return num2;
  let p = Fp.ONE;
  let d = num2;
  while (power > _0n3) {
    if (power & _1n3)
      p = Fp.mul(p, d);
    d = Fp.sqr(d);
    power >>= _1n3;
  }
  return p;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = acc;
    return Fp.mul(acc, num2);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num2, i) => {
    if (Fp.is0(num2))
      return acc;
    inverted[i] = Fp.mul(acc, inverted[i]);
    return Fp.mul(acc, num2);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n) {
  const p1mod2 = (Fp.ORDER - _1n3) / _2n2;
  const powered = Fp.pow(n, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero ? 0 : -1;
}
function nLength(n, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
function Field(ORDER, bitLen2, isLE3 = false, redef = {}) {
  if (ORDER <= _0n3)
    throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
  const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen2);
  if (BYTES > 2048)
    throw new Error("invalid field: expected ORDER of <= 2048 bytes");
  let sqrtP;
  const f = Object.freeze({
    ORDER,
    isLE: isLE3,
    BITS,
    BYTES,
    MASK: bitMask(BITS),
    ZERO: _0n3,
    ONE: _1n3,
    create: (num2) => mod(num2, ORDER),
    isValid: (num2) => {
      if (typeof num2 !== "bigint")
        throw new Error("invalid field element: expected bigint, got " + typeof num2);
      return _0n3 <= num2 && num2 < ORDER;
    },
    is0: (num2) => num2 === _0n3,
    isOdd: (num2) => (num2 & _1n3) === _1n3,
    neg: (num2) => mod(-num2, ORDER),
    eql: (lhs, rhs) => lhs === rhs,
    sqr: (num2) => mod(num2 * num2, ORDER),
    add: (lhs, rhs) => mod(lhs + rhs, ORDER),
    sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
    mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
    pow: (num2, power) => FpPow(f, num2, power),
    div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
    // Same as above, but doesn't normalize
    sqrN: (num2) => num2 * num2,
    addN: (lhs, rhs) => lhs + rhs,
    subN: (lhs, rhs) => lhs - rhs,
    mulN: (lhs, rhs) => lhs * rhs,
    inv: (num2) => invert(num2, ORDER),
    sqrt: redef.sqrt || ((n) => {
      if (!sqrtP)
        sqrtP = FpSqrt(ORDER);
      return sqrtP(f, n);
    }),
    toBytes: (num2) => isLE3 ? numberToBytesLE(num2, BYTES) : numberToBytesBE(num2, BYTES),
    fromBytes: (bytes) => {
      if (bytes.length !== BYTES)
        throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
      return isLE3 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    },
    // TODO: we don't need it here, move out to separate fn
    invertBatch: (lst) => FpInvertBatch(f, lst),
    // We can't move this out because Fp6, Fp12 implement it
    // and it's unclear what to return in there.
    cmov: (a, b, c) => c ? b : a
  });
  return Object.freeze(f);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length = getFieldBytesLength(fieldOrder);
  return length + Math.ceil(length / 2);
}
function mapHashToField(key, fieldOrder, isLE3 = false) {
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num2 = isLE3 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num2, fieldOrder - _1n3) + _1n3;
  return isLE3 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}
var _0n3, _1n3, _2n2, _3n, _4n, _5n, _8n, FIELD_FIELDS;
var init_modular = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/modular.js"() {
    init_utils2();
    init_utils4();
    _0n3 = BigInt(0);
    _1n3 = BigInt(1);
    _2n2 = /* @__PURE__ */ BigInt(2);
    _3n = /* @__PURE__ */ BigInt(3);
    _4n = /* @__PURE__ */ BigInt(4);
    _5n = /* @__PURE__ */ BigInt(5);
    _8n = /* @__PURE__ */ BigInt(8);
    FIELD_FIELDS = [
      "create",
      "isValid",
      "is0",
      "neg",
      "inv",
      "sqrt",
      "sqr",
      "eql",
      "add",
      "sub",
      "mul",
      "pow",
      "div",
      "addN",
      "subN",
      "mulN",
      "sqrN"
    ];
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/curve.js
function constTimeNegate(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n, window, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n & mask);
  let nextN = n >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n4;
  }
  const offsetStart = window * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
function validateMSMPoints(points, c) {
  if (!Array.isArray(points))
    throw new Error("array expected");
  points.forEach((p, i) => {
    if (!(p instanceof c))
      throw new Error("invalid point at index " + i);
  });
}
function validateMSMScalars(scalars, field) {
  if (!Array.isArray(scalars))
    throw new Error("array of scalars expected");
  scalars.forEach((s, i) => {
    if (!field.isValid(s))
      throw new Error("invalid scalar at index " + i);
  });
}
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function wNAF(c, bits) {
  return {
    constTimeNegate,
    hasPrecomputes(elm) {
      return getW(elm) !== 1;
    },
    // non-const time multiplication ladder
    unsafeLadder(elm, n, p = c.ZERO) {
      let d = elm;
      while (n > _0n4) {
        if (n & _1n4)
          p = p.add(d);
        d = d.double();
        n >>= _1n4;
      }
      return p;
    },
    /**
     * Creates a wNAF precomputation window. Used for caching.
     * Default window size is set by `utils.precompute()` and is equal to 8.
     * Number of precomputed points depends on the curve size:
     * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
     * - 𝑊 is the window size
     * - 𝑛 is the bitlength of the curve order.
     * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
     * @param elm Point instance
     * @param W window size
     * @returns precomputed point tables flattened to a single array
     */
    precomputeWindow(elm, W) {
      const { windows, windowSize } = calcWOpts(W, bits);
      const points = [];
      let p = elm;
      let base = p;
      for (let window = 0; window < windows; window++) {
        base = p;
        points.push(base);
        for (let i = 1; i < windowSize; i++) {
          base = base.add(p);
          points.push(base);
        }
        p = base.double();
      }
      return points;
    },
    /**
     * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @returns real and fake (for const-time) points
     */
    wNAF(W, precomputes, n) {
      let p = c.ZERO;
      let f = c.BASE;
      const wo = calcWOpts(W, bits);
      for (let window = 0; window < wo.windows; window++) {
        const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window, wo);
        n = nextN;
        if (isZero) {
          f = f.add(constTimeNegate(isNegF, precomputes[offsetF]));
        } else {
          p = p.add(constTimeNegate(isNeg, precomputes[offset]));
        }
      }
      return { p, f };
    },
    /**
     * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
     * @param W window size
     * @param precomputes precomputed tables
     * @param n scalar (we don't check here, but should be less than curve order)
     * @param acc accumulator point to add result of multiplication
     * @returns point
     */
    wNAFUnsafe(W, precomputes, n, acc = c.ZERO) {
      const wo = calcWOpts(W, bits);
      for (let window = 0; window < wo.windows; window++) {
        if (n === _0n4)
          break;
        const { nextN, offset, isZero, isNeg } = calcOffsets(n, window, wo);
        n = nextN;
        if (isZero) {
          continue;
        } else {
          const item = precomputes[offset];
          acc = acc.add(isNeg ? item.negate() : item);
        }
      }
      return acc;
    },
    getPrecomputes(W, P, transform) {
      let comp = pointPrecomputes.get(P);
      if (!comp) {
        comp = this.precomputeWindow(P, W);
        if (W !== 1)
          pointPrecomputes.set(P, transform(comp));
      }
      return comp;
    },
    wNAFCached(P, n, transform) {
      const W = getW(P);
      return this.wNAF(W, this.getPrecomputes(W, P, transform), n);
    },
    wNAFCachedUnsafe(P, n, transform, prev) {
      const W = getW(P);
      if (W === 1)
        return this.unsafeLadder(P, n, prev);
      return this.wNAFUnsafe(W, this.getPrecomputes(W, P, transform), n, prev);
    },
    // We calculate precomputes for elliptic curve point multiplication
    // using windowed method. This specifies window size and
    // stores precomputed values. Usually only base point would be precomputed.
    setWindowSize(P, W) {
      validateW(W, bits);
      pointWindowSizes.set(P, W);
      pointPrecomputes.delete(P);
    }
  };
}
function pippenger(c, fieldN, points, scalars) {
  validateMSMPoints(points, c);
  validateMSMScalars(scalars, fieldN);
  const plength = points.length;
  const slength = scalars.length;
  if (plength !== slength)
    throw new Error("arrays of points and scalars must have equal length");
  const zero = c.ZERO;
  const wbits = bitLen(BigInt(plength));
  let windowSize = 1;
  if (wbits > 12)
    windowSize = wbits - 3;
  else if (wbits > 4)
    windowSize = wbits - 2;
  else if (wbits > 0)
    windowSize = 2;
  const MASK = bitMask(windowSize);
  const buckets = new Array(Number(MASK) + 1).fill(zero);
  const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
  let sum = zero;
  for (let i = lastBits; i >= 0; i -= windowSize) {
    buckets.fill(zero);
    for (let j = 0; j < slength; j++) {
      const scalar = scalars[j];
      const wbits2 = Number(scalar >> BigInt(i) & MASK);
      buckets[wbits2] = buckets[wbits2].add(points[j]);
    }
    let resI = zero;
    for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
      sumI = sumI.add(buckets[j]);
      resI = resI.add(sumI);
    }
    sum = sum.add(resI);
    if (i !== 0)
      for (let j = 0; j < windowSize; j++)
        sum = sum.double();
  }
  return sum;
}
function validateBasic(curve) {
  validateField(curve.Fp);
  validateObject(curve, {
    n: "bigint",
    h: "bigint",
    Gx: "field",
    Gy: "field"
  }, {
    nBitLength: "isSafeInteger",
    nByteLength: "isSafeInteger"
  });
  return Object.freeze({
    ...nLength(curve.n, curve.nBitLength),
    ...curve,
    ...{ p: curve.Fp.ORDER }
  });
}
var _0n4, _1n4, pointPrecomputes, pointWindowSizes;
var init_curve = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/curve.js"() {
    init_modular();
    init_utils4();
    _0n4 = BigInt(0);
    _1n4 = BigInt(1);
    pointPrecomputes = /* @__PURE__ */ new WeakMap();
    pointWindowSizes = /* @__PURE__ */ new WeakMap();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/weierstrass.js
function validateSigVerOpts(opts) {
  if (opts.lowS !== void 0)
    abool("lowS", opts.lowS);
  if (opts.prehash !== void 0)
    abool("prehash", opts.prehash);
}
function validatePointOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    a: "field",
    b: "field"
  }, {
    allowInfinityPoint: "boolean",
    allowedPrivateKeyLengths: "array",
    clearCofactor: "function",
    fromBytes: "function",
    isTorsionFree: "function",
    toBytes: "function",
    wrapPrivateKey: "boolean"
  });
  const { endo, Fp, a } = opts;
  if (endo) {
    if (!Fp.eql(a, Fp.ZERO)) {
      throw new Error("invalid endo: CURVE.a must be 0");
    }
    if (typeof endo !== "object" || typeof endo.beta !== "bigint" || typeof endo.splitScalar !== "function") {
      throw new Error('invalid endo: expected "beta": bigint and "splitScalar": function');
    }
  }
  return Object.freeze({ ...opts });
}
function numToSizedHex(num2, size5) {
  return bytesToHex3(numberToBytesBE(num2, size5));
}
function weierstrassPoints(opts) {
  const CURVE = validatePointOpts(opts);
  const { Fp } = CURVE;
  const Fn = Field(CURVE.n, CURVE.nBitLength);
  const toBytes4 = CURVE.toBytes || ((_c, point, _isCompressed) => {
    const a = point.toAffine();
    return concatBytes3(Uint8Array.from([4]), Fp.toBytes(a.x), Fp.toBytes(a.y));
  });
  const fromBytes4 = CURVE.fromBytes || ((bytes) => {
    const tail = bytes.subarray(1);
    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
    return { x, y };
  });
  function weierstrassEquation(x) {
    const { a, b } = CURVE;
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, a)), b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n2), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function isWithinCurveOrder(num2) {
    return inRange(num2, _1n5, CURVE.n);
  }
  function normPrivateKeyToScalar(key) {
    const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n: N } = CURVE;
    if (lengths && typeof key !== "bigint") {
      if (isBytes2(key))
        key = bytesToHex3(key);
      if (typeof key !== "string" || !lengths.includes(key.length))
        throw new Error("invalid private key");
      key = key.padStart(nByteLength * 2, "0");
    }
    let num2;
    try {
      num2 = typeof key === "bigint" ? key : bytesToNumberBE(ensureBytes("private key", key, nByteLength));
    } catch (error) {
      throw new Error("invalid private key, expected hex or " + nByteLength + " bytes, got " + typeof key);
    }
    if (wrapPrivateKey)
      num2 = mod(num2, N);
    aInRange("private key", num2, _1n5, N);
    return num2;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point2))
      throw new Error("ProjectivePoint expected");
  }
  const toAffineMemo = memoized((p, iz) => {
    const { px: x, py: y, pz: z } = p;
    if (Fp.eql(z, Fp.ONE))
      return { x, y };
    const is0 = p.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(z);
    const ax = Fp.mul(x, iz);
    const ay = Fp.mul(y, iz);
    const zz = Fp.mul(z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x: ax, y: ay };
  });
  const assertValidMemo = memoized((p) => {
    if (p.is0()) {
      if (CURVE.allowInfinityPoint && !Fp.is0(p.py))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not FE");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  class Point2 {
    constructor(px, py, pz) {
      if (px == null || !Fp.isValid(px))
        throw new Error("x required");
      if (py == null || !Fp.isValid(py) || Fp.is0(py))
        throw new Error("y required");
      if (pz == null || !Fp.isValid(pz))
        throw new Error("z required");
      this.px = px;
      this.py = py;
      this.pz = pz;
      Object.freeze(this);
    }
    // Does not validate if the point is on-curve.
    // Use fromHex instead, or call assertValidity() later.
    static fromAffine(p) {
      const { x, y } = p || {};
      if (!p || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p instanceof Point2)
        throw new Error("projective point not allowed");
      const is0 = (i) => Fp.eql(i, Fp.ZERO);
      if (is0(x) && is0(y))
        return Point2.ZERO;
      return new Point2(x, y, Fp.ONE);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     * Takes a bunch of Projective Points but executes only one
     * inversion on all of them. Inversion is very slow operation,
     * so this improves performance massively.
     * Optimization: converts a list of projective points to a list of identical points with Z=1.
     */
    static normalizeZ(points) {
      const toInv = FpInvertBatch(Fp, points.map((p) => p.pz));
      return points.map((p, i) => p.toAffine(toInv[i])).map(Point2.fromAffine);
    }
    /**
     * Converts hash string or Uint8Array to Point.
     * @param hex short/long ECDSA hex
     */
    static fromHex(hex) {
      const P = Point2.fromAffine(fromBytes4(ensureBytes("pointHex", hex)));
      P.assertValidity();
      return P;
    }
    // Multiplies generator point by privateKey.
    static fromPrivateKey(privateKey) {
      return Point2.BASE.multiply(normPrivateKeyToScalar(privateKey));
    }
    // Multiscalar Multiplication
    static msm(points, scalars) {
      return pippenger(Point2, Fn, points, scalars);
    }
    // "Private method", don't use it directly
    _setWindowSize(windowSize) {
      wnaf.setWindowSize(this, windowSize);
    }
    // A point on curve is valid if it conforms to equation.
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (Fp.isOdd)
        return !Fp.isOdd(y);
      throw new Error("Field doesn't support isOdd");
    }
    /**
     * Compare one point to another.
     */
    equals(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /**
     * Flips point to one corresponding to (x, -y) in Affine coordinates.
     */
    negate() {
      return new Point2(this.px, Fp.neg(this.py), this.pz);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a, b } = CURVE;
      const b3 = Fp.mul(b, _3n2);
      const { px: X1, py: Y1, pz: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point2(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { px: X1, py: Y1, pz: Z1 } = this;
      const { px: X2, py: Y2, pz: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n2);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point2(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point2.ZERO);
    }
    wNAF(n) {
      return wnaf.wNAFCached(this, n, Point2.normalizeZ);
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed private key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", sc, _0n5, N);
      const I = Point2.ZERO;
      if (sc === _0n5)
        return I;
      if (this.is0() || sc === _1n5)
        return this;
      if (!endo2 || wnaf.hasPrecomputes(this))
        return wnaf.wNAFCachedUnsafe(this, sc, Point2.normalizeZ);
      let { k1neg, k1, k2neg, k2 } = endo2.splitScalar(sc);
      let k1p = I;
      let k2p = I;
      let d = this;
      while (k1 > _0n5 || k2 > _0n5) {
        if (k1 & _1n5)
          k1p = k1p.add(d);
        if (k2 & _1n5)
          k2p = k2p.add(d);
        d = d.double();
        k1 >>= _1n5;
        k2 >>= _1n5;
      }
      if (k1neg)
        k1p = k1p.negate();
      if (k2neg)
        k2p = k2p.negate();
      k2p = new Point2(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
      return k1p.add(k2p);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2, n: N } = CURVE;
      aInRange("scalar", scalar, _1n5, N);
      let point, fake;
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = endo2.splitScalar(scalar);
        let { p: k1p, f: f1p } = this.wNAF(k1);
        let { p: k2p, f: f2p } = this.wNAF(k2);
        k1p = wnaf.constTimeNegate(k1neg, k1p);
        k2p = wnaf.constTimeNegate(k2neg, k2p);
        k2p = new Point2(Fp.mul(k2p.px, endo2.beta), k2p.py, k2p.pz);
        point = k1p.add(k2p);
        fake = f1p.add(f2p);
      } else {
        const { p, f } = this.wNAF(scalar);
        point = p;
        fake = f;
      }
      return Point2.normalizeZ([point, fake])[0];
    }
    /**
     * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
     * Not using Strauss-Shamir trick: precomputation tables are faster.
     * The trick could be useful if both P and Q are not G (not in our case).
     * @returns non-zero affine point
     */
    multiplyAndAddUnsafe(Q, a, b) {
      const G = Point2.BASE;
      const mul3 = (P, a2) => a2 === _0n5 || a2 === _1n5 || !P.equals(G) ? P.multiplyUnsafe(a2) : P.multiply(a2);
      const sum = mul3(this, a).add(mul3(Q, b));
      return sum.is0() ? void 0 : sum;
    }
    // Converts Projective point to affine (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    // (x, y, z) ∋ (x=x/z, y=y/z)
    toAffine(iz) {
      return toAffineMemo(this, iz);
    }
    isTorsionFree() {
      const { h: cofactor, isTorsionFree } = CURVE;
      if (cofactor === _1n5)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point2, this);
      throw new Error("isTorsionFree() has not been declared for the elliptic curve");
    }
    clearCofactor() {
      const { h: cofactor, clearCofactor } = CURVE;
      if (cofactor === _1n5)
        return this;
      if (clearCofactor)
        return clearCofactor(Point2, this);
      return this.multiplyUnsafe(CURVE.h);
    }
    toRawBytes(isCompressed = true) {
      abool("isCompressed", isCompressed);
      this.assertValidity();
      return toBytes4(Point2, this, isCompressed);
    }
    toHex(isCompressed = true) {
      abool("isCompressed", isCompressed);
      return bytesToHex3(this.toRawBytes(isCompressed));
    }
  }
  Point2.BASE = new Point2(CURVE.Gx, CURVE.Gy, Fp.ONE);
  Point2.ZERO = new Point2(Fp.ZERO, Fp.ONE, Fp.ZERO);
  const { endo, nBitLength } = CURVE;
  const wnaf = wNAF(Point2, endo ? Math.ceil(nBitLength / 2) : nBitLength);
  return {
    CURVE,
    ProjectivePoint: Point2,
    normPrivateKeyToScalar,
    weierstrassEquation,
    isWithinCurveOrder
  };
}
function validateOpts(curve) {
  const opts = validateBasic(curve);
  validateObject(opts, {
    hash: "hash",
    hmac: "function",
    randomBytes: "function"
  }, {
    bits2int: "function",
    bits2int_modN: "function",
    lowS: "boolean"
  });
  return Object.freeze({ lowS: true, ...opts });
}
function weierstrass(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { Fp, n: CURVE_ORDER, nByteLength, nBitLength } = CURVE;
  const compressedLen = Fp.BYTES + 1;
  const uncompressedLen = 2 * Fp.BYTES + 1;
  function modN2(a) {
    return mod(a, CURVE_ORDER);
  }
  function invN(a) {
    return invert(a, CURVE_ORDER);
  }
  const { ProjectivePoint: Point2, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder } = weierstrassPoints({
    ...CURVE,
    toBytes(_c, point, isCompressed) {
      const a = point.toAffine();
      const x = Fp.toBytes(a.x);
      const cat = concatBytes3;
      abool("isCompressed", isCompressed);
      if (isCompressed) {
        return cat(Uint8Array.from([point.hasEvenY() ? 2 : 3]), x);
      } else {
        return cat(Uint8Array.from([4]), x, Fp.toBytes(a.y));
      }
    },
    fromBytes(bytes) {
      const len = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      if (len === compressedLen && (head === 2 || head === 3)) {
        const x = bytesToNumberBE(tail);
        if (!inRange(x, _1n5, Fp.ORDER))
          throw new Error("Point is not on curve");
        const y2 = weierstrassEquation(x);
        let y;
        try {
          y = Fp.sqrt(y2);
        } catch (sqrtError) {
          const suffix = sqrtError instanceof Error ? ": " + sqrtError.message : "";
          throw new Error("Point is not on curve" + suffix);
        }
        const isYOdd = (y & _1n5) === _1n5;
        const isHeadOdd = (head & 1) === 1;
        if (isHeadOdd !== isYOdd)
          y = Fp.neg(y);
        return { x, y };
      } else if (len === uncompressedLen && head === 4) {
        const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
        const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
        return { x, y };
      } else {
        const cl = compressedLen;
        const ul = uncompressedLen;
        throw new Error("invalid Point, expected length of " + cl + ", or uncompressed " + ul + ", got " + len);
      }
    }
  });
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n5;
    return number > HALF;
  }
  function normalizeS(s) {
    return isBiggerThanHalfOrder(s) ? modN2(-s) : s;
  }
  const slcNum = (b, from14, to) => bytesToNumberBE(b.slice(from14, to));
  class Signature {
    constructor(r, s, recovery) {
      aInRange("r", r, _1n5, CURVE_ORDER);
      aInRange("s", s, _1n5, CURVE_ORDER);
      this.r = r;
      this.s = s;
      if (recovery != null)
        this.recovery = recovery;
      Object.freeze(this);
    }
    // pair (bytes of r, bytes of s)
    static fromCompact(hex) {
      const l = nByteLength;
      hex = ensureBytes("compactSignature", hex, l * 2);
      return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
    }
    // DER encoded ECDSA signature
    // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
    static fromDER(hex) {
      const { r, s } = DER.toSig(ensureBytes("DER", hex));
      return new Signature(r, s);
    }
    /**
     * @todo remove
     * @deprecated
     */
    assertValidity() {
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(msgHash) {
      const { r, s, recovery: rec } = this;
      const h = bits2int_modN(ensureBytes("msgHash", msgHash));
      if (rec == null || ![0, 1, 2, 3].includes(rec))
        throw new Error("recovery id invalid");
      const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
      if (radj >= Fp.ORDER)
        throw new Error("recovery id 2 or 3 invalid");
      const prefix = (rec & 1) === 0 ? "02" : "03";
      const R = Point2.fromHex(prefix + numToSizedHex(radj, Fp.BYTES));
      const ir = invN(radj);
      const u1 = modN2(-h * ir);
      const u2 = modN2(s * ir);
      const Q = Point2.BASE.multiplyAndAddUnsafe(R, u1, u2);
      if (!Q)
        throw new Error("point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    normalizeS() {
      return this.hasHighS() ? new Signature(this.r, modN2(-this.s), this.recovery) : this;
    }
    // DER-encoded
    toDERRawBytes() {
      return hexToBytes3(this.toDERHex());
    }
    toDERHex() {
      return DER.hexFromSig(this);
    }
    // padded bytes of r, then padded bytes of s
    toCompactRawBytes() {
      return hexToBytes3(this.toCompactHex());
    }
    toCompactHex() {
      const l = nByteLength;
      return numToSizedHex(this.r, l) + numToSizedHex(this.s, l);
    }
  }
  const utils = {
    isValidPrivateKey(privateKey) {
      try {
        normPrivateKeyToScalar(privateKey);
        return true;
      } catch (error) {
        return false;
      }
    },
    normPrivateKeyToScalar,
    /**
     * Produces cryptographically secure private key from random of size
     * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
     */
    randomPrivateKey: () => {
      const length = getMinHashLength(CURVE.n);
      return mapHashToField(CURVE.randomBytes(length), CURVE.n);
    },
    /**
     * Creates precompute table for an arbitrary EC point. Makes point "cached".
     * Allows to massively speed-up `point.multiply(scalar)`.
     * @returns cached point
     * @example
     * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
     * fast.multiply(privKey); // much faster ECDH now
     */
    precompute(windowSize = 8, point = Point2.BASE) {
      point._setWindowSize(windowSize);
      point.multiply(BigInt(3));
      return point;
    }
  };
  function getPublicKey(privateKey, isCompressed = true) {
    return Point2.fromPrivateKey(privateKey).toRawBytes(isCompressed);
  }
  function isProbPub(item) {
    if (typeof item === "bigint")
      return false;
    if (item instanceof Point2)
      return true;
    const arr = ensureBytes("key", item);
    const len = arr.length;
    const fpl = Fp.BYTES;
    const compLen = fpl + 1;
    const uncompLen = 2 * fpl + 1;
    if (CURVE.allowedPrivateKeyLengths || nByteLength === compLen) {
      return void 0;
    } else {
      return len === compLen || len === uncompLen;
    }
  }
  function getSharedSecret(privateA, publicB, isCompressed = true) {
    if (isProbPub(privateA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicB) === false)
      throw new Error("second arg must be public key");
    const b = Point2.fromHex(publicB);
    return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
  }
  const bits2int = CURVE.bits2int || function(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num2 = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - nBitLength;
    return delta > 0 ? num2 >> BigInt(delta) : num2;
  };
  const bits2int_modN = CURVE.bits2int_modN || function(bytes) {
    return modN2(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(nBitLength);
  function int2octets(num2) {
    aInRange("num < 2^" + nBitLength, num2, _0n5, ORDER_MASK);
    return numberToBytesBE(num2, nByteLength);
  }
  function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
    if (["recovered", "canonical"].some((k) => k in opts))
      throw new Error("sign() legacy options not supported");
    const { hash: hash3, randomBytes: randomBytes2 } = CURVE;
    let { lowS, prehash, extraEntropy: ent } = opts;
    if (lowS == null)
      lowS = true;
    msgHash = ensureBytes("msgHash", msgHash);
    validateSigVerOpts(opts);
    if (prehash)
      msgHash = ensureBytes("prehashed msgHash", hash3(msgHash));
    const h1int = bits2int_modN(msgHash);
    const d = normPrivateKeyToScalar(privateKey);
    const seedArgs = [int2octets(d), int2octets(h1int)];
    if (ent != null && ent !== false) {
      const e = ent === true ? randomBytes2(Fp.BYTES) : ent;
      seedArgs.push(ensureBytes("extraEntropy", e));
    }
    const seed = concatBytes3(...seedArgs);
    const m = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!isWithinCurveOrder(k))
        return;
      const ik = invN(k);
      const q = Point2.BASE.multiply(k).toAffine();
      const r = modN2(q.x);
      if (r === _0n5)
        return;
      const s = modN2(ik * modN2(m + r * d));
      if (s === _0n5)
        return;
      let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n5);
      let normS = s;
      if (lowS && isBiggerThanHalfOrder(s)) {
        normS = normalizeS(s);
        recovery ^= 1;
      }
      return new Signature(r, normS, recovery);
    }
    return { seed, k2sig };
  }
  const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
  const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
  function sign2(msgHash, privKey, opts = defaultSigOpts) {
    const { seed, k2sig } = prepSig(msgHash, privKey, opts);
    const C = CURVE;
    const drbg = createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
    return drbg(seed, k2sig);
  }
  Point2.BASE._setWindowSize(8);
  function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
    const sg = signature;
    msgHash = ensureBytes("msgHash", msgHash);
    publicKey = ensureBytes("publicKey", publicKey);
    const { lowS, prehash, format } = opts;
    validateSigVerOpts(opts);
    if ("strict" in opts)
      throw new Error("options.strict was renamed to lowS");
    if (format !== void 0 && format !== "compact" && format !== "der")
      throw new Error("format must be compact or der");
    const isHex2 = typeof sg === "string" || isBytes2(sg);
    const isObj = !isHex2 && !format && typeof sg === "object" && sg !== null && typeof sg.r === "bigint" && typeof sg.s === "bigint";
    if (!isHex2 && !isObj)
      throw new Error("invalid signature, expected Uint8Array, hex string or Signature instance");
    let _sig = void 0;
    let P;
    try {
      if (isObj)
        _sig = new Signature(sg.r, sg.s);
      if (isHex2) {
        try {
          if (format !== "compact")
            _sig = Signature.fromDER(sg);
        } catch (derError) {
          if (!(derError instanceof DER.Err))
            throw derError;
        }
        if (!_sig && format !== "der")
          _sig = Signature.fromCompact(sg);
      }
      P = Point2.fromHex(publicKey);
    } catch (error) {
      return false;
    }
    if (!_sig)
      return false;
    if (lowS && _sig.hasHighS())
      return false;
    if (prehash)
      msgHash = CURVE.hash(msgHash);
    const { r, s } = _sig;
    const h = bits2int_modN(msgHash);
    const is = invN(s);
    const u1 = modN2(h * is);
    const u2 = modN2(r * is);
    const R = Point2.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine();
    if (!R)
      return false;
    const v = modN2(R.x);
    return v === r;
  }
  return {
    CURVE,
    getPublicKey,
    getSharedSecret,
    sign: sign2,
    verify,
    ProjectivePoint: Point2,
    Signature,
    utils
  };
}
function SWUFpSqrtRatio(Fp, Z) {
  const q = Fp.ORDER;
  let l = _0n5;
  for (let o = q - _1n5; o % _2n3 === _0n5; o /= _2n3)
    l += _1n5;
  const c1 = l;
  const _2n_pow_c1_1 = _2n3 << c1 - _1n5 - _1n5;
  const _2n_pow_c1 = _2n_pow_c1_1 * _2n3;
  const c2 = (q - _1n5) / _2n_pow_c1;
  const c3 = (c2 - _1n5) / _2n3;
  const c4 = _2n_pow_c1 - _1n5;
  const c5 = _2n_pow_c1_1;
  const c6 = Fp.pow(Z, c2);
  const c7 = Fp.pow(Z, (c2 + _1n5) / _2n3);
  let sqrtRatio = (u, v) => {
    let tv1 = c6;
    let tv2 = Fp.pow(v, c4);
    let tv3 = Fp.sqr(tv2);
    tv3 = Fp.mul(tv3, v);
    let tv5 = Fp.mul(u, tv3);
    tv5 = Fp.pow(tv5, c3);
    tv5 = Fp.mul(tv5, tv2);
    tv2 = Fp.mul(tv5, v);
    tv3 = Fp.mul(tv5, u);
    let tv4 = Fp.mul(tv3, tv2);
    tv5 = Fp.pow(tv4, c5);
    let isQR = Fp.eql(tv5, Fp.ONE);
    tv2 = Fp.mul(tv3, c7);
    tv5 = Fp.mul(tv4, tv1);
    tv3 = Fp.cmov(tv2, tv3, isQR);
    tv4 = Fp.cmov(tv5, tv4, isQR);
    for (let i = c1; i > _1n5; i--) {
      let tv52 = i - _2n3;
      tv52 = _2n3 << tv52 - _1n5;
      let tvv5 = Fp.pow(tv4, tv52);
      const e1 = Fp.eql(tvv5, Fp.ONE);
      tv2 = Fp.mul(tv3, tv1);
      tv1 = Fp.mul(tv1, tv1);
      tvv5 = Fp.mul(tv4, tv1);
      tv3 = Fp.cmov(tv2, tv3, e1);
      tv4 = Fp.cmov(tvv5, tv4, e1);
    }
    return { isValid: isQR, value: tv3 };
  };
  if (Fp.ORDER % _4n2 === _3n2) {
    const c12 = (Fp.ORDER - _3n2) / _4n2;
    const c22 = Fp.sqrt(Fp.neg(Z));
    sqrtRatio = (u, v) => {
      let tv1 = Fp.sqr(v);
      const tv2 = Fp.mul(u, v);
      tv1 = Fp.mul(tv1, tv2);
      let y1 = Fp.pow(tv1, c12);
      y1 = Fp.mul(y1, tv2);
      const y2 = Fp.mul(y1, c22);
      const tv3 = Fp.mul(Fp.sqr(y1), v);
      const isQR = Fp.eql(tv3, u);
      let y = Fp.cmov(y2, y1, isQR);
      return { isValid: isQR, value: y };
    };
  }
  return sqrtRatio;
}
function mapToCurveSimpleSWU(Fp, opts) {
  validateField(Fp);
  if (!Fp.isValid(opts.A) || !Fp.isValid(opts.B) || !Fp.isValid(opts.Z))
    throw new Error("mapToCurveSimpleSWU: invalid opts");
  const sqrtRatio = SWUFpSqrtRatio(Fp, opts.Z);
  if (!Fp.isOdd)
    throw new Error("Fp.isOdd is not implemented!");
  return (u) => {
    let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
    tv1 = Fp.sqr(u);
    tv1 = Fp.mul(tv1, opts.Z);
    tv2 = Fp.sqr(tv1);
    tv2 = Fp.add(tv2, tv1);
    tv3 = Fp.add(tv2, Fp.ONE);
    tv3 = Fp.mul(tv3, opts.B);
    tv4 = Fp.cmov(opts.Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO));
    tv4 = Fp.mul(tv4, opts.A);
    tv2 = Fp.sqr(tv3);
    tv6 = Fp.sqr(tv4);
    tv5 = Fp.mul(tv6, opts.A);
    tv2 = Fp.add(tv2, tv5);
    tv2 = Fp.mul(tv2, tv3);
    tv6 = Fp.mul(tv6, tv4);
    tv5 = Fp.mul(tv6, opts.B);
    tv2 = Fp.add(tv2, tv5);
    x = Fp.mul(tv1, tv3);
    const { isValid, value } = sqrtRatio(tv2, tv6);
    y = Fp.mul(tv1, u);
    y = Fp.mul(y, value);
    x = Fp.cmov(x, tv3, isValid);
    y = Fp.cmov(y, value, isValid);
    const e1 = Fp.isOdd(u) === Fp.isOdd(y);
    y = Fp.cmov(Fp.neg(y), y, e1);
    const tv4_inv = FpInvertBatch(Fp, [tv4], true)[0];
    x = Fp.mul(x, tv4_inv);
    return { x, y };
  };
}
var DERErr, DER, _0n5, _1n5, _2n3, _3n2, _4n2;
var init_weierstrass = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/weierstrass.js"() {
    init_curve();
    init_modular();
    init_utils4();
    DERErr = class extends Error {
      constructor(m = "") {
        super(m);
      }
    };
    DER = {
      // asn.1 DER encoding utils
      Err: DERErr,
      // Basic building block is TLV (Tag-Length-Value)
      _tlv: {
        encode: (tag, data) => {
          const { Err: E } = DER;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length & 1)
            throw new E("tlv.encode: unpadded data");
          const dataLen = data.length / 2;
          const len = numberToHexUnpadded(dataLen);
          if (len.length / 2 & 128)
            throw new E("tlv.encode: long form length too big");
          const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
          const t = numberToHexUnpadded(tag);
          return t + lenLen + len + data;
        },
        // v - value, l - left bytes (unparsed)
        decode(tag, data) {
          const { Err: E } = DER;
          let pos = 0;
          if (tag < 0 || tag > 256)
            throw new E("tlv.encode: wrong tag");
          if (data.length < 2 || data[pos++] !== tag)
            throw new E("tlv.decode: wrong tlv");
          const first = data[pos++];
          const isLong = !!(first & 128);
          let length = 0;
          if (!isLong)
            length = first;
          else {
            const lenLen = first & 127;
            if (!lenLen)
              throw new E("tlv.decode(long): indefinite length not supported");
            if (lenLen > 4)
              throw new E("tlv.decode(long): byte length is too big");
            const lengthBytes = data.subarray(pos, pos + lenLen);
            if (lengthBytes.length !== lenLen)
              throw new E("tlv.decode: length bytes not complete");
            if (lengthBytes[0] === 0)
              throw new E("tlv.decode(long): zero leftmost byte");
            for (const b of lengthBytes)
              length = length << 8 | b;
            pos += lenLen;
            if (length < 128)
              throw new E("tlv.decode(long): not minimal encoding");
          }
          const v = data.subarray(pos, pos + length);
          if (v.length !== length)
            throw new E("tlv.decode: wrong value length");
          return { v, l: data.subarray(pos + length) };
        }
      },
      // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
      // since we always use positive integers here. It must always be empty:
      // - add zero byte if exists
      // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
      _int: {
        encode(num2) {
          const { Err: E } = DER;
          if (num2 < _0n5)
            throw new E("integer: negative integers are not allowed");
          let hex = numberToHexUnpadded(num2);
          if (Number.parseInt(hex[0], 16) & 8)
            hex = "00" + hex;
          if (hex.length & 1)
            throw new E("unexpected DER parsing assertion: unpadded hex");
          return hex;
        },
        decode(data) {
          const { Err: E } = DER;
          if (data[0] & 128)
            throw new E("invalid signature integer: negative");
          if (data[0] === 0 && !(data[1] & 128))
            throw new E("invalid signature integer: unnecessary leading zero");
          return bytesToNumberBE(data);
        }
      },
      toSig(hex) {
        const { Err: E, _int: int, _tlv: tlv } = DER;
        const data = ensureBytes("signature", hex);
        const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
        if (seqLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
        const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
        if (sLeftBytes.length)
          throw new E("invalid signature: left bytes after parsing");
        return { r: int.decode(rBytes), s: int.decode(sBytes) };
      },
      hexFromSig(sig) {
        const { _tlv: tlv, _int: int } = DER;
        const rs = tlv.encode(2, int.encode(sig.r));
        const ss = tlv.encode(2, int.encode(sig.s));
        const seq = rs + ss;
        return tlv.encode(48, seq);
      }
    };
    _0n5 = BigInt(0);
    _1n5 = BigInt(1);
    _2n3 = BigInt(2);
    _3n2 = BigInt(3);
    _4n2 = BigInt(4);
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/_shortw_utils.js
function getHash(hash3) {
  return {
    hash: hash3,
    hmac: (key, ...msgs) => hmac(hash3, key, concatBytes(...msgs)),
    randomBytes
  };
}
function createCurve(curveDef, defHash) {
  const create2 = (hash3) => weierstrass({ ...curveDef, ...getHash(hash3) });
  return { ...create2(defHash), create: create2 };
}
var init_shortw_utils = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/_shortw_utils.js"() {
    init_hmac();
    init_utils2();
    init_weierstrass();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/hash-to-curve.js
function i2osp(value, length) {
  anum(value);
  anum(length);
  if (value < 0 || value >= 1 << 8 * length)
    throw new Error("invalid I2OSP input: " + value);
  const res = Array.from({ length }).fill(0);
  for (let i = length - 1; i >= 0; i--) {
    res[i] = value & 255;
    value >>>= 8;
  }
  return new Uint8Array(res);
}
function strxor(a, b) {
  const arr = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    arr[i] = a[i] ^ b[i];
  }
  return arr;
}
function anum(item) {
  if (!Number.isSafeInteger(item))
    throw new Error("number expected");
}
function expand_message_xmd(msg, DST, lenInBytes, H) {
  abytes2(msg);
  abytes2(DST);
  anum(lenInBytes);
  if (DST.length > 255)
    DST = H(concatBytes3(utf8ToBytes2("H2C-OVERSIZE-DST-"), DST));
  const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
  const ell = Math.ceil(lenInBytes / b_in_bytes);
  if (lenInBytes > 65535 || ell > 255)
    throw new Error("expand_message_xmd: invalid lenInBytes");
  const DST_prime = concatBytes3(DST, i2osp(DST.length, 1));
  const Z_pad = i2osp(0, r_in_bytes);
  const l_i_b_str = i2osp(lenInBytes, 2);
  const b = new Array(ell);
  const b_0 = H(concatBytes3(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
  b[0] = H(concatBytes3(b_0, i2osp(1, 1), DST_prime));
  for (let i = 1; i <= ell; i++) {
    const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
    b[i] = H(concatBytes3(...args));
  }
  const pseudo_random_bytes = concatBytes3(...b);
  return pseudo_random_bytes.slice(0, lenInBytes);
}
function expand_message_xof(msg, DST, lenInBytes, k, H) {
  abytes2(msg);
  abytes2(DST);
  anum(lenInBytes);
  if (DST.length > 255) {
    const dkLen = Math.ceil(2 * k / 8);
    DST = H.create({ dkLen }).update(utf8ToBytes2("H2C-OVERSIZE-DST-")).update(DST).digest();
  }
  if (lenInBytes > 65535 || DST.length > 255)
    throw new Error("expand_message_xof: invalid lenInBytes");
  return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
}
function hash_to_field(msg, count, options) {
  validateObject(options, {
    DST: "stringOrUint8Array",
    p: "bigint",
    m: "isSafeInteger",
    k: "isSafeInteger",
    hash: "hash"
  });
  const { p, k, m, hash: hash3, expand, DST: _DST } = options;
  abytes2(msg);
  anum(count);
  const DST = typeof _DST === "string" ? utf8ToBytes2(_DST) : _DST;
  const log2p = p.toString(2).length;
  const L = Math.ceil((log2p + k) / 8);
  const len_in_bytes = count * m * L;
  let prb;
  if (expand === "xmd") {
    prb = expand_message_xmd(msg, DST, len_in_bytes, hash3);
  } else if (expand === "xof") {
    prb = expand_message_xof(msg, DST, len_in_bytes, k, hash3);
  } else if (expand === "_internal_pass") {
    prb = msg;
  } else {
    throw new Error('expand must be "xmd" or "xof"');
  }
  const u = new Array(count);
  for (let i = 0; i < count; i++) {
    const e = new Array(m);
    for (let j = 0; j < m; j++) {
      const elm_offset = L * (j + i * m);
      const tv = prb.subarray(elm_offset, elm_offset + L);
      e[j] = mod(os2ip(tv), p);
    }
    u[i] = e;
  }
  return u;
}
function isogenyMap(field, map) {
  const coeff = map.map((i) => Array.from(i).reverse());
  return (x, y) => {
    const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
    const [xd_inv, yd_inv] = FpInvertBatch(field, [xd, yd], true);
    x = field.mul(xn, xd_inv);
    y = field.mul(y, field.mul(yn, yd_inv));
    return { x, y };
  };
}
function createHasher2(Point2, mapToCurve, defaults) {
  if (typeof mapToCurve !== "function")
    throw new Error("mapToCurve() must be defined");
  function map(num2) {
    return Point2.fromAffine(mapToCurve(num2));
  }
  function clear(initial) {
    const P = initial.clearCofactor();
    if (P.equals(Point2.ZERO))
      return Point2.ZERO;
    P.assertValidity();
    return P;
  }
  return {
    defaults,
    // Encodes byte string to elliptic curve.
    // hash_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
    hashToCurve(msg, options) {
      const u = hash_to_field(msg, 2, { ...defaults, DST: defaults.DST, ...options });
      const u0 = map(u[0]);
      const u1 = map(u[1]);
      return clear(u0.add(u1));
    },
    // Encodes byte string to elliptic curve.
    // encode_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
    encodeToCurve(msg, options) {
      const u = hash_to_field(msg, 1, { ...defaults, DST: defaults.encodeDST, ...options });
      return clear(map(u[0]));
    },
    // Same as encodeToCurve, but without hash
    mapToCurve(scalars) {
      if (!Array.isArray(scalars))
        throw new Error("expected array of bigints");
      for (const i of scalars)
        if (typeof i !== "bigint")
          throw new Error("expected array of bigints");
      return clear(map(scalars));
    }
  };
}
var os2ip;
var init_hash_to_curve = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/abstract/hash-to-curve.js"() {
    init_modular();
    init_utils4();
    os2ip = bytesToNumberBE;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/secp256k1.js
var secp256k1_exports = {};
__export(secp256k1_exports, {
  encodeToCurve: () => encodeToCurve,
  hashToCurve: () => hashToCurve,
  schnorr: () => schnorr,
  secp256k1: () => secp256k1,
  secp256k1_hasher: () => secp256k1_hasher
});
function sqrtMod(y) {
  const P = secp256k1P;
  const _3n3 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n3, P) * b3 % P;
  const b9 = pow2(b6, _3n3, P) * b3 % P;
  const b11 = pow2(b9, _2n4, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n3, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n4, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === void 0) {
    const tagH = sha256(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
    tagP = concatBytes3(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes3(tagP, ...messages));
}
function schnorrGetExtPubKey(priv) {
  let d_ = secp256k1.utils.normPrivateKeyToScalar(priv);
  let p = Point.fromPrivateKey(d_);
  const scalar = p.hasEvenY() ? d_ : modN(-d_);
  return { scalar, bytes: pointToBytes(p) };
}
function lift_x(x) {
  aInRange("x", x, _1n6, secp256k1P);
  const xx = modP(x * x);
  const c = modP(xx * x + BigInt(7));
  let y = sqrtMod(c);
  if (y % _2n4 !== _0n6)
    y = modP(-y);
  const p = new Point(x, y, _1n6);
  p.assertValidity();
  return p;
}
function challenge(...args) {
  return modN(num(taggedHash("BIP0340/challenge", ...args)));
}
function schnorrGetPublicKey(privateKey) {
  return schnorrGetExtPubKey(privateKey).bytes;
}
function schnorrSign(message, privateKey, auxRand = randomBytes(32)) {
  const m = ensureBytes("message", message);
  const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey);
  const a = ensureBytes("auxRand", auxRand, 32);
  const t = numTo32b(d ^ num(taggedHash("BIP0340/aux", a)));
  const rand = taggedHash("BIP0340/nonce", t, px, m);
  const k_ = modN(num(rand));
  if (k_ === _0n6)
    throw new Error("sign failed: k is zero");
  const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_);
  const e = challenge(rx, px, m);
  const sig = new Uint8Array(64);
  sig.set(rx, 0);
  sig.set(numTo32b(modN(k + e * d)), 32);
  if (!schnorrVerify(sig, m, px))
    throw new Error("sign: Invalid signature produced");
  return sig;
}
function schnorrVerify(signature, message, publicKey) {
  const sig = ensureBytes("signature", signature, 64);
  const m = ensureBytes("message", message);
  const pub = ensureBytes("publicKey", publicKey, 32);
  try {
    const P = lift_x(num(pub));
    const r = num(sig.subarray(0, 32));
    if (!inRange(r, _1n6, secp256k1P))
      return false;
    const s = num(sig.subarray(32, 64));
    if (!inRange(s, _1n6, secp256k1N))
      return false;
    const e = challenge(numTo32b(r), pointToBytes(P), m);
    const R = GmulAdd(P, s, modN(-e));
    if (!R || !R.hasEvenY() || R.toAffine().x !== r)
      return false;
    return true;
  } catch (error) {
    return false;
  }
}
var secp256k1P, secp256k1N, _0n6, _1n6, _2n4, divNearest, Fpk1, secp256k1, TAGGED_HASH_PREFIXES, pointToBytes, numTo32b, modP, modN, Point, GmulAdd, num, schnorr, isoMap, mapSWU, secp256k1_hasher, hashToCurve, encodeToCurve;
var init_secp256k1 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/@noble+curves@1.9.1/node_modules/@noble/curves/esm/secp256k1.js"() {
    init_sha2();
    init_utils2();
    init_shortw_utils();
    init_hash_to_curve();
    init_modular();
    init_utils4();
    init_weierstrass();
    secp256k1P = BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
    secp256k1N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
    _0n6 = BigInt(0);
    _1n6 = BigInt(1);
    _2n4 = BigInt(2);
    divNearest = (a, b) => (a + b / _2n4) / b;
    Fpk1 = Field(secp256k1P, void 0, void 0, { sqrt: sqrtMod });
    secp256k1 = createCurve({
      a: _0n6,
      b: BigInt(7),
      Fp: Fpk1,
      n: secp256k1N,
      Gx: BigInt("55066263022277343669578718895168534326250603453777594175500187360389116729240"),
      Gy: BigInt("32670510020758816978083085130507043184471273380659243275938904335757337482424"),
      h: BigInt(1),
      lowS: true,
      // Allow only low-S signatures by default in sign() and verify()
      endo: {
        // Endomorphism, see above
        beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
        splitScalar: (k) => {
          const n = secp256k1N;
          const a1 = BigInt("0x3086d221a7d46bcde86c90e49284eb15");
          const b1 = -_1n6 * BigInt("0xe4437ed6010e88286f547fa90abfe4c3");
          const a2 = BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8");
          const b2 = a1;
          const POW_2_128 = BigInt("0x100000000000000000000000000000000");
          const c1 = divNearest(b2 * k, n);
          const c2 = divNearest(-b1 * k, n);
          let k1 = mod(k - c1 * a1 - c2 * a2, n);
          let k2 = mod(-c1 * b1 - c2 * b2, n);
          const k1neg = k1 > POW_2_128;
          const k2neg = k2 > POW_2_128;
          if (k1neg)
            k1 = n - k1;
          if (k2neg)
            k2 = n - k2;
          if (k1 > POW_2_128 || k2 > POW_2_128) {
            throw new Error("splitScalar: Endomorphism failed, k=" + k);
          }
          return { k1neg, k1, k2neg, k2 };
        }
      }
    }, sha256);
    TAGGED_HASH_PREFIXES = {};
    pointToBytes = (point) => point.toRawBytes(true).slice(1);
    numTo32b = (n) => numberToBytesBE(n, 32);
    modP = (x) => mod(x, secp256k1P);
    modN = (x) => mod(x, secp256k1N);
    Point = /* @__PURE__ */ (() => secp256k1.ProjectivePoint)();
    GmulAdd = (Q, a, b) => Point.BASE.multiplyAndAddUnsafe(Q, a, b);
    num = bytesToNumberBE;
    schnorr = /* @__PURE__ */ (() => ({
      getPublicKey: schnorrGetPublicKey,
      sign: schnorrSign,
      verify: schnorrVerify,
      utils: {
        randomPrivateKey: secp256k1.utils.randomPrivateKey,
        lift_x,
        pointToBytes,
        numberToBytesBE,
        bytesToNumberBE,
        taggedHash,
        mod
      }
    }))();
    isoMap = /* @__PURE__ */ (() => isogenyMap(Fpk1, [
      // xNum
      [
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7",
        "0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581",
        "0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262",
        "0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c"
      ],
      // xDen
      [
        "0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b",
        "0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ],
      // yNum
      [
        "0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c",
        "0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3",
        "0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931",
        "0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84"
      ],
      // yDen
      [
        "0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b",
        "0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573",
        "0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
        // LAST 1
      ]
    ].map((i) => i.map((j) => BigInt(j)))))();
    mapSWU = /* @__PURE__ */ (() => mapToCurveSimpleSWU(Fpk1, {
      A: BigInt("0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533"),
      B: BigInt("1771"),
      Z: Fpk1.create(BigInt("-11"))
    }))();
    secp256k1_hasher = /* @__PURE__ */ (() => createHasher2(secp256k1.ProjectivePoint, (scalars) => {
      const { x, y } = mapSWU(Fpk1.create(scalars[0]));
      return isoMap(x, y);
    }, {
      DST: "secp256k1_XMD:SHA-256_SSWU_RO_",
      encodeDST: "secp256k1_XMD:SHA-256_SSWU_NU_",
      p: Fpk1.ORDER,
      m: 1,
      k: 128,
      expand: "xmd",
      hash: sha256
    }))();
    hashToCurve = /* @__PURE__ */ (() => secp256k1_hasher.hashToCurve)();
    encodeToCurve = /* @__PURE__ */ (() => secp256k1_hasher.encodeToCurve)();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/node.js
var ExecutionRevertedError, FeeCapTooHighError, FeeCapTooLowError, NonceTooHighError, NonceTooLowError, NonceMaxValueError, InsufficientFundsError, IntrinsicGasTooHighError, IntrinsicGasTooLowError, TransactionTypeNotSupportedError, TipAboveFeeCapError, UnknownNodeError;
var init_node = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/node.js"() {
    init_formatGwei();
    init_base();
    ExecutionRevertedError = class extends BaseError2 {
      constructor({ cause, message } = {}) {
        const reason = message?.replace("execution reverted: ", "")?.replace("execution reverted", "");
        super(`Execution reverted ${reason ? `with reason: ${reason}` : "for an unknown reason"}.`, {
          cause,
          name: "ExecutionRevertedError"
        });
      }
    };
    Object.defineProperty(ExecutionRevertedError, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: 3
    });
    Object.defineProperty(ExecutionRevertedError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /execution reverted|gas required exceeds allowance/
    });
    FeeCapTooHighError = class extends BaseError2 {
      constructor({ cause, maxFeePerGas } = {}) {
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}) cannot be higher than the maximum allowed value (2^256-1).`, {
          cause,
          name: "FeeCapTooHighError"
        });
      }
    };
    Object.defineProperty(FeeCapTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max fee per gas higher than 2\^256-1|fee cap higher than 2\^256-1/
    });
    FeeCapTooLowError = class extends BaseError2 {
      constructor({ cause, maxFeePerGas } = {}) {
        super(`The fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)}` : ""} gwei) cannot be lower than the block base fee.`, {
          cause,
          name: "FeeCapTooLowError"
        });
      }
    };
    Object.defineProperty(FeeCapTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max fee per gas less than block base fee|fee cap less than block base fee|transaction is outdated/
    });
    NonceTooHighError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is higher than the next one expected.`, { cause, name: "NonceTooHighError" });
      }
    };
    Object.defineProperty(NonceTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce too high/
    });
    NonceTooLowError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super([
          `Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}is lower than the current nonce of the account.`,
          "Try increasing the nonce or find the latest nonce with `getTransactionCount`."
        ].join("\n"), { cause, name: "NonceTooLowError" });
      }
    };
    Object.defineProperty(NonceTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce too low|transaction already imported|already known/
    });
    NonceMaxValueError = class extends BaseError2 {
      constructor({ cause, nonce } = {}) {
        super(`Nonce provided for the transaction ${nonce ? `(${nonce}) ` : ""}exceeds the maximum allowed nonce.`, { cause, name: "NonceMaxValueError" });
      }
    };
    Object.defineProperty(NonceMaxValueError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /nonce has max value/
    });
    InsufficientFundsError = class extends BaseError2 {
      constructor({ cause } = {}) {
        super([
          "The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."
        ].join("\n"), {
          cause,
          metaMessages: [
            "This error could arise when the account does not have enough funds to:",
            " - pay for the total gas fee,",
            " - pay for the value to send.",
            " ",
            "The cost of the transaction is calculated as `gas * gas fee + value`, where:",
            " - `gas` is the amount of gas needed for transaction to execute,",
            " - `gas fee` is the gas fee,",
            " - `value` is the amount of ether to send to the recipient."
          ],
          name: "InsufficientFundsError"
        });
      }
    };
    Object.defineProperty(InsufficientFundsError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /insufficient funds|exceeds transaction sender account balance/
    });
    IntrinsicGasTooHighError = class extends BaseError2 {
      constructor({ cause, gas } = {}) {
        super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction exceeds the limit allowed for the block.`, {
          cause,
          name: "IntrinsicGasTooHighError"
        });
      }
    };
    Object.defineProperty(IntrinsicGasTooHighError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /intrinsic gas too high|gas limit reached/
    });
    IntrinsicGasTooLowError = class extends BaseError2 {
      constructor({ cause, gas } = {}) {
        super(`The amount of gas ${gas ? `(${gas}) ` : ""}provided for the transaction is too low.`, {
          cause,
          name: "IntrinsicGasTooLowError"
        });
      }
    };
    Object.defineProperty(IntrinsicGasTooLowError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /intrinsic gas too low/
    });
    TransactionTypeNotSupportedError = class extends BaseError2 {
      constructor({ cause }) {
        super("The transaction type is not supported for this chain.", {
          cause,
          name: "TransactionTypeNotSupportedError"
        });
      }
    };
    Object.defineProperty(TransactionTypeNotSupportedError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /transaction type not valid/
    });
    TipAboveFeeCapError = class extends BaseError2 {
      constructor({ cause, maxPriorityFeePerGas, maxFeePerGas } = {}) {
        super([
          `The provided tip (\`maxPriorityFeePerGas\`${maxPriorityFeePerGas ? ` = ${formatGwei(maxPriorityFeePerGas)} gwei` : ""}) cannot be higher than the fee cap (\`maxFeePerGas\`${maxFeePerGas ? ` = ${formatGwei(maxFeePerGas)} gwei` : ""}).`
        ].join("\n"), {
          cause,
          name: "TipAboveFeeCapError"
        });
      }
    };
    Object.defineProperty(TipAboveFeeCapError, "nodeMessage", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: /max priority fee per gas higher than max fee per gas|tip higher than fee cap/
    });
    UnknownNodeError = class extends BaseError2 {
      constructor({ cause }) {
        super(`An error occurred while executing: ${cause?.shortMessage}`, {
          cause,
          name: "UnknownNodeError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getNodeError.js
function getNodeError(err, args) {
  const message = (err.details || "").toLowerCase();
  const executionRevertedError = err instanceof BaseError2 ? err.walk((e) => e?.code === ExecutionRevertedError.code) : err;
  if (executionRevertedError instanceof BaseError2)
    return new ExecutionRevertedError({
      cause: err,
      message: executionRevertedError.details
    });
  if (ExecutionRevertedError.nodeMessage.test(message))
    return new ExecutionRevertedError({
      cause: err,
      message: err.details
    });
  if (FeeCapTooHighError.nodeMessage.test(message))
    return new FeeCapTooHighError({
      cause: err,
      maxFeePerGas: args?.maxFeePerGas
    });
  if (FeeCapTooLowError.nodeMessage.test(message))
    return new FeeCapTooLowError({
      cause: err,
      maxFeePerGas: args?.maxFeePerGas
    });
  if (NonceTooHighError.nodeMessage.test(message))
    return new NonceTooHighError({ cause: err, nonce: args?.nonce });
  if (NonceTooLowError.nodeMessage.test(message))
    return new NonceTooLowError({ cause: err, nonce: args?.nonce });
  if (NonceMaxValueError.nodeMessage.test(message))
    return new NonceMaxValueError({ cause: err, nonce: args?.nonce });
  if (InsufficientFundsError.nodeMessage.test(message))
    return new InsufficientFundsError({ cause: err });
  if (IntrinsicGasTooHighError.nodeMessage.test(message))
    return new IntrinsicGasTooHighError({ cause: err, gas: args?.gas });
  if (IntrinsicGasTooLowError.nodeMessage.test(message))
    return new IntrinsicGasTooLowError({ cause: err, gas: args?.gas });
  if (TransactionTypeNotSupportedError.nodeMessage.test(message))
    return new TransactionTypeNotSupportedError({ cause: err });
  if (TipAboveFeeCapError.nodeMessage.test(message))
    return new TipAboveFeeCapError({
      cause: err,
      maxFeePerGas: args?.maxFeePerGas,
      maxPriorityFeePerGas: args?.maxPriorityFeePerGas
    });
  return new UnknownNodeError({
    cause: err
  });
}
var init_getNodeError = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getNodeError.js"() {
    init_base();
    init_node();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/extract.js
function extract(value_, { format }) {
  if (!format)
    return {};
  const value = {};
  function extract_(formatted2) {
    const keys = Object.keys(formatted2);
    for (const key of keys) {
      if (key in value_)
        value[key] = value_[key];
      if (formatted2[key] && typeof formatted2[key] === "object" && !Array.isArray(formatted2[key]))
        extract_(formatted2[key]);
    }
  }
  const formatted = format(value_ || {});
  extract_(formatted);
  return value;
}
var init_extract = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/extract.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/transactionRequest.js
function formatTransactionRequest(request, _) {
  const rpcRequest = {};
  if (typeof request.authorizationList !== "undefined")
    rpcRequest.authorizationList = formatAuthorizationList(request.authorizationList);
  if (typeof request.accessList !== "undefined")
    rpcRequest.accessList = request.accessList;
  if (typeof request.blobVersionedHashes !== "undefined")
    rpcRequest.blobVersionedHashes = request.blobVersionedHashes;
  if (typeof request.blobs !== "undefined") {
    if (typeof request.blobs[0] !== "string")
      rpcRequest.blobs = request.blobs.map((x) => bytesToHex(x));
    else
      rpcRequest.blobs = request.blobs;
  }
  if (typeof request.data !== "undefined")
    rpcRequest.data = request.data;
  if (request.account)
    rpcRequest.from = request.account.address;
  if (typeof request.from !== "undefined")
    rpcRequest.from = request.from;
  if (typeof request.gas !== "undefined")
    rpcRequest.gas = numberToHex(request.gas);
  if (typeof request.gasPrice !== "undefined")
    rpcRequest.gasPrice = numberToHex(request.gasPrice);
  if (typeof request.maxFeePerBlobGas !== "undefined")
    rpcRequest.maxFeePerBlobGas = numberToHex(request.maxFeePerBlobGas);
  if (typeof request.maxFeePerGas !== "undefined")
    rpcRequest.maxFeePerGas = numberToHex(request.maxFeePerGas);
  if (typeof request.maxPriorityFeePerGas !== "undefined")
    rpcRequest.maxPriorityFeePerGas = numberToHex(request.maxPriorityFeePerGas);
  if (typeof request.nonce !== "undefined")
    rpcRequest.nonce = numberToHex(request.nonce);
  if (typeof request.to !== "undefined")
    rpcRequest.to = request.to;
  if (typeof request.type !== "undefined")
    rpcRequest.type = rpcTransactionType[request.type];
  if (typeof request.value !== "undefined")
    rpcRequest.value = numberToHex(request.value);
  return rpcRequest;
}
function formatAuthorizationList(authorizationList) {
  return authorizationList.map((authorization) => ({
    address: authorization.address,
    r: authorization.r ? numberToHex(BigInt(authorization.r)) : authorization.r,
    s: authorization.s ? numberToHex(BigInt(authorization.s)) : authorization.s,
    chainId: numberToHex(authorization.chainId),
    nonce: numberToHex(authorization.nonce),
    ...typeof authorization.yParity !== "undefined" ? { yParity: numberToHex(authorization.yParity) } : {},
    ...typeof authorization.v !== "undefined" && typeof authorization.yParity === "undefined" ? { v: numberToHex(authorization.v) } : {}
  }));
}
var rpcTransactionType;
var init_transactionRequest = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/transactionRequest.js"() {
    init_toHex();
    rpcTransactionType = {
      legacy: "0x0",
      eip2930: "0x1",
      eip1559: "0x2",
      eip4844: "0x3",
      eip7702: "0x4"
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/stateOverride.js
function serializeStateMapping(stateMapping) {
  if (!stateMapping || stateMapping.length === 0)
    return void 0;
  return stateMapping.reduce((acc, { slot, value }) => {
    if (slot.length !== 66)
      throw new InvalidBytesLengthError({
        size: slot.length,
        targetSize: 66,
        type: "hex"
      });
    if (value.length !== 66)
      throw new InvalidBytesLengthError({
        size: value.length,
        targetSize: 66,
        type: "hex"
      });
    acc[slot] = value;
    return acc;
  }, {});
}
function serializeAccountStateOverride(parameters) {
  const { balance, nonce, state, stateDiff, code } = parameters;
  const rpcAccountStateOverride = {};
  if (code !== void 0)
    rpcAccountStateOverride.code = code;
  if (balance !== void 0)
    rpcAccountStateOverride.balance = numberToHex(balance);
  if (nonce !== void 0)
    rpcAccountStateOverride.nonce = numberToHex(nonce);
  if (state !== void 0)
    rpcAccountStateOverride.state = serializeStateMapping(state);
  if (stateDiff !== void 0) {
    if (rpcAccountStateOverride.state)
      throw new StateAssignmentConflictError();
    rpcAccountStateOverride.stateDiff = serializeStateMapping(stateDiff);
  }
  return rpcAccountStateOverride;
}
function serializeStateOverride(parameters) {
  if (!parameters)
    return void 0;
  const rpcStateOverride = {};
  for (const { address, ...accountState } of parameters) {
    if (!isAddress(address, { strict: false }))
      throw new InvalidAddressError({ address });
    if (rpcStateOverride[address])
      throw new AccountStateConflictError({ address });
    rpcStateOverride[address] = serializeAccountStateOverride(accountState);
  }
  return rpcStateOverride;
}
var init_stateOverride2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/stateOverride.js"() {
    init_address();
    init_data();
    init_stateOverride();
    init_isAddress();
    init_toHex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/number.js
var maxInt8, maxInt16, maxInt24, maxInt32, maxInt40, maxInt48, maxInt56, maxInt64, maxInt72, maxInt80, maxInt88, maxInt96, maxInt104, maxInt112, maxInt120, maxInt128, maxInt136, maxInt144, maxInt152, maxInt160, maxInt168, maxInt176, maxInt184, maxInt192, maxInt200, maxInt208, maxInt216, maxInt224, maxInt232, maxInt240, maxInt248, maxInt256, minInt8, minInt16, minInt24, minInt32, minInt40, minInt48, minInt56, minInt64, minInt72, minInt80, minInt88, minInt96, minInt104, minInt112, minInt120, minInt128, minInt136, minInt144, minInt152, minInt160, minInt168, minInt176, minInt184, minInt192, minInt200, minInt208, minInt216, minInt224, minInt232, minInt240, minInt248, minInt256, maxUint8, maxUint16, maxUint24, maxUint32, maxUint40, maxUint48, maxUint56, maxUint64, maxUint72, maxUint80, maxUint88, maxUint96, maxUint104, maxUint112, maxUint120, maxUint128, maxUint136, maxUint144, maxUint152, maxUint160, maxUint168, maxUint176, maxUint184, maxUint192, maxUint200, maxUint208, maxUint216, maxUint224, maxUint232, maxUint240, maxUint248, maxUint256;
var init_number = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/number.js"() {
    maxInt8 = 2n ** (8n - 1n) - 1n;
    maxInt16 = 2n ** (16n - 1n) - 1n;
    maxInt24 = 2n ** (24n - 1n) - 1n;
    maxInt32 = 2n ** (32n - 1n) - 1n;
    maxInt40 = 2n ** (40n - 1n) - 1n;
    maxInt48 = 2n ** (48n - 1n) - 1n;
    maxInt56 = 2n ** (56n - 1n) - 1n;
    maxInt64 = 2n ** (64n - 1n) - 1n;
    maxInt72 = 2n ** (72n - 1n) - 1n;
    maxInt80 = 2n ** (80n - 1n) - 1n;
    maxInt88 = 2n ** (88n - 1n) - 1n;
    maxInt96 = 2n ** (96n - 1n) - 1n;
    maxInt104 = 2n ** (104n - 1n) - 1n;
    maxInt112 = 2n ** (112n - 1n) - 1n;
    maxInt120 = 2n ** (120n - 1n) - 1n;
    maxInt128 = 2n ** (128n - 1n) - 1n;
    maxInt136 = 2n ** (136n - 1n) - 1n;
    maxInt144 = 2n ** (144n - 1n) - 1n;
    maxInt152 = 2n ** (152n - 1n) - 1n;
    maxInt160 = 2n ** (160n - 1n) - 1n;
    maxInt168 = 2n ** (168n - 1n) - 1n;
    maxInt176 = 2n ** (176n - 1n) - 1n;
    maxInt184 = 2n ** (184n - 1n) - 1n;
    maxInt192 = 2n ** (192n - 1n) - 1n;
    maxInt200 = 2n ** (200n - 1n) - 1n;
    maxInt208 = 2n ** (208n - 1n) - 1n;
    maxInt216 = 2n ** (216n - 1n) - 1n;
    maxInt224 = 2n ** (224n - 1n) - 1n;
    maxInt232 = 2n ** (232n - 1n) - 1n;
    maxInt240 = 2n ** (240n - 1n) - 1n;
    maxInt248 = 2n ** (248n - 1n) - 1n;
    maxInt256 = 2n ** (256n - 1n) - 1n;
    minInt8 = -(2n ** (8n - 1n));
    minInt16 = -(2n ** (16n - 1n));
    minInt24 = -(2n ** (24n - 1n));
    minInt32 = -(2n ** (32n - 1n));
    minInt40 = -(2n ** (40n - 1n));
    minInt48 = -(2n ** (48n - 1n));
    minInt56 = -(2n ** (56n - 1n));
    minInt64 = -(2n ** (64n - 1n));
    minInt72 = -(2n ** (72n - 1n));
    minInt80 = -(2n ** (80n - 1n));
    minInt88 = -(2n ** (88n - 1n));
    minInt96 = -(2n ** (96n - 1n));
    minInt104 = -(2n ** (104n - 1n));
    minInt112 = -(2n ** (112n - 1n));
    minInt120 = -(2n ** (120n - 1n));
    minInt128 = -(2n ** (128n - 1n));
    minInt136 = -(2n ** (136n - 1n));
    minInt144 = -(2n ** (144n - 1n));
    minInt152 = -(2n ** (152n - 1n));
    minInt160 = -(2n ** (160n - 1n));
    minInt168 = -(2n ** (168n - 1n));
    minInt176 = -(2n ** (176n - 1n));
    minInt184 = -(2n ** (184n - 1n));
    minInt192 = -(2n ** (192n - 1n));
    minInt200 = -(2n ** (200n - 1n));
    minInt208 = -(2n ** (208n - 1n));
    minInt216 = -(2n ** (216n - 1n));
    minInt224 = -(2n ** (224n - 1n));
    minInt232 = -(2n ** (232n - 1n));
    minInt240 = -(2n ** (240n - 1n));
    minInt248 = -(2n ** (248n - 1n));
    minInt256 = -(2n ** (256n - 1n));
    maxUint8 = 2n ** 8n - 1n;
    maxUint16 = 2n ** 16n - 1n;
    maxUint24 = 2n ** 24n - 1n;
    maxUint32 = 2n ** 32n - 1n;
    maxUint40 = 2n ** 40n - 1n;
    maxUint48 = 2n ** 48n - 1n;
    maxUint56 = 2n ** 56n - 1n;
    maxUint64 = 2n ** 64n - 1n;
    maxUint72 = 2n ** 72n - 1n;
    maxUint80 = 2n ** 80n - 1n;
    maxUint88 = 2n ** 88n - 1n;
    maxUint96 = 2n ** 96n - 1n;
    maxUint104 = 2n ** 104n - 1n;
    maxUint112 = 2n ** 112n - 1n;
    maxUint120 = 2n ** 120n - 1n;
    maxUint128 = 2n ** 128n - 1n;
    maxUint136 = 2n ** 136n - 1n;
    maxUint144 = 2n ** 144n - 1n;
    maxUint152 = 2n ** 152n - 1n;
    maxUint160 = 2n ** 160n - 1n;
    maxUint168 = 2n ** 168n - 1n;
    maxUint176 = 2n ** 176n - 1n;
    maxUint184 = 2n ** 184n - 1n;
    maxUint192 = 2n ** 192n - 1n;
    maxUint200 = 2n ** 200n - 1n;
    maxUint208 = 2n ** 208n - 1n;
    maxUint216 = 2n ** 216n - 1n;
    maxUint224 = 2n ** 224n - 1n;
    maxUint232 = 2n ** 232n - 1n;
    maxUint240 = 2n ** 240n - 1n;
    maxUint248 = 2n ** 248n - 1n;
    maxUint256 = 2n ** 256n - 1n;
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/assertRequest.js
function assertRequest(args) {
  const { account: account_, maxFeePerGas, maxPriorityFeePerGas, to } = args;
  const account = account_ ? parseAccount(account_) : void 0;
  if (account && !isAddress(account.address))
    throw new InvalidAddressError({ address: account.address });
  if (to && !isAddress(to))
    throw new InvalidAddressError({ address: to });
  if (maxFeePerGas && maxFeePerGas > maxUint256)
    throw new FeeCapTooHighError({ maxFeePerGas });
  if (maxPriorityFeePerGas && maxFeePerGas && maxPriorityFeePerGas > maxFeePerGas)
    throw new TipAboveFeeCapError({ maxFeePerGas, maxPriorityFeePerGas });
}
var init_assertRequest = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/assertRequest.js"() {
    init_parseAccount();
    init_number();
    init_address();
    init_node();
    init_isAddress();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/block/formatBlockParameter.js
function formatBlockParameter(parameters) {
  const { blockHash, blockNumber, blockTag, requireCanonical } = parameters;
  if (requireCanonical !== void 0 && !blockHash)
    throw new BaseError2("`requireCanonical` can only be provided when `blockHash` is set.");
  if (blockHash)
    return requireCanonical ? { blockHash, requireCanonical } : { blockHash };
  if (typeof blockNumber === "bigint")
    return numberToHex(blockNumber);
  return blockTag ?? "latest";
}
var init_formatBlockParameter = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/block/formatBlockParameter.js"() {
    init_base();
    init_toHex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/isAddressEqual.js
function isAddressEqual(a, b) {
  if (!isAddress(a, { strict: false }))
    throw new InvalidAddressError({ address: a });
  if (!isAddress(b, { strict: false }))
    throw new InvalidAddressError({ address: b });
  return a.toLowerCase() === b.toLowerCase();
}
var init_isAddressEqual = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/address/isAddressEqual.js"() {
    init_address();
    init_isAddress();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeFunctionResult.js
function decodeFunctionResult(parameters) {
  const { abi: abi2, args, functionName, data } = parameters;
  let abiItem = abi2[0];
  if (functionName) {
    const item = getAbiItem({ abi: abi2, args, name: functionName });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath4 });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath4 });
  if (!abiItem.outputs)
    throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath: docsPath4 });
  const values = decodeAbiParameters(abiItem.outputs, data);
  if (values && values.length > 1)
    return values;
  if (values && values.length === 1)
    return values[0];
  return void 0;
}
var docsPath4;
var init_decodeFunctionResult = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeFunctionResult.js"() {
    init_abi();
    init_decodeAbiParameters();
    init_getAbiItem();
    docsPath4 = "/docs/contract/decodeFunctionResult";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/version.js
var version3;
var init_version3 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/version.js"() {
    version3 = "0.1.1";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/errors.js
function getVersion() {
  return version3;
}
var init_errors2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/errors.js"() {
    init_version3();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Errors.js
function walk2(err, fn) {
  if (fn?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause)
    return walk2(err.cause, fn);
  return fn ? null : err;
}
var BaseError3;
var init_Errors = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Errors.js"() {
    init_errors2();
    BaseError3 = class _BaseError extends Error {
      static setStaticOptions(options) {
        _BaseError.prototype.docsOrigin = options.docsOrigin;
        _BaseError.prototype.showVersion = options.showVersion;
        _BaseError.prototype.version = options.version;
      }
      constructor(shortMessage, options = {}) {
        const details = (() => {
          if (options.cause instanceof _BaseError) {
            if (options.cause.details)
              return options.cause.details;
            if (options.cause.shortMessage)
              return options.cause.shortMessage;
          }
          if (options.cause && "details" in options.cause && typeof options.cause.details === "string")
            return options.cause.details;
          if (options.cause?.message)
            return options.cause.message;
          return options.details;
        })();
        const docsPath8 = (() => {
          if (options.cause instanceof _BaseError)
            return options.cause.docsPath || options.docsPath;
          return options.docsPath;
        })();
        const docsBaseUrl = options.docsOrigin ?? _BaseError.prototype.docsOrigin;
        const docs = `${docsBaseUrl}${docsPath8 ?? ""}`;
        const showVersion = Boolean(options.version ?? _BaseError.prototype.showVersion);
        const version4 = options.version ?? _BaseError.prototype.version;
        const message = [
          shortMessage || "An error occurred.",
          ...options.metaMessages ? ["", ...options.metaMessages] : [],
          ...details || docsPath8 || showVersion ? [
            "",
            details ? `Details: ${details}` : void 0,
            docsPath8 ? `See: ${docs}` : void 0,
            showVersion ? `Version: ${version4}` : void 0
          ] : []
        ].filter((x) => typeof x === "string").join("\n");
        super(message, options.cause ? { cause: options.cause } : void 0);
        Object.defineProperty(this, "details", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docs", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsOrigin", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "docsPath", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "shortMessage", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "showVersion", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "version", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "cause", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "BaseError"
        });
        this.cause = options.cause;
        this.details = details;
        this.docs = docs;
        this.docsOrigin = docsBaseUrl;
        this.docsPath = docsPath8;
        this.shortMessage = shortMessage;
        this.showVersion = showVersion;
        this.version = version4;
      }
      walk(fn) {
        return walk2(this, fn);
      }
    };
    Object.defineProperty(BaseError3, "defaultStaticOptions", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {
        docsOrigin: "https://oxlib.sh",
        showVersion: false,
        version: `ox@${getVersion()}`
      }
    });
    (() => {
      BaseError3.setStaticOptions(BaseError3.defaultStaticOptions);
    })();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/bytes.js
function assertSize2(bytes, size_) {
  if (size2(bytes) > size_)
    throw new SizeOverflowError2({
      givenSize: size2(bytes),
      maxSize: size_
    });
}
function assertStartOffset2(value, start) {
  if (typeof start === "number" && start > 0 && start > size2(value) - 1)
    throw new SliceOffsetOutOfBoundsError2({
      offset: start,
      position: "start",
      size: size2(value)
    });
}
function assertEndOffset2(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size2(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError2({
      offset: end,
      position: "end",
      size: size2(value)
    });
  }
}
function charCodeToBase162(char) {
  if (char >= charCodeMap2.zero && char <= charCodeMap2.nine)
    return char - charCodeMap2.zero;
  if (char >= charCodeMap2.A && char <= charCodeMap2.F)
    return char - (charCodeMap2.A - 10);
  if (char >= charCodeMap2.a && char <= charCodeMap2.f)
    return char - (charCodeMap2.a - 10);
  return void 0;
}
function pad2(bytes, options = {}) {
  const { dir, size: size5 = 32 } = options;
  if (size5 === 0)
    return bytes;
  if (bytes.length > size5)
    throw new SizeExceedsPaddingSizeError2({
      size: bytes.length,
      targetSize: size5,
      type: "Bytes"
    });
  const paddedBytes = new Uint8Array(size5);
  for (let i = 0; i < size5; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size5 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
function trim2(value, options = {}) {
  const { dir = "left" } = options;
  let data = value;
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  return data;
}
var charCodeMap2;
var init_bytes = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/bytes.js"() {
    init_Bytes();
    charCodeMap2 = {
      zero: 48,
      nine: 57,
      A: 65,
      F: 70,
      a: 97,
      f: 102
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/hex.js
function assertSize3(hex, size_) {
  if (size3(hex) > size_)
    throw new SizeOverflowError3({
      givenSize: size3(hex),
      maxSize: size_
    });
}
function assertStartOffset3(value, start) {
  if (typeof start === "number" && start > 0 && start > size3(value) - 1)
    throw new SliceOffsetOutOfBoundsError3({
      offset: start,
      position: "start",
      size: size3(value)
    });
}
function assertEndOffset3(value, start, end) {
  if (typeof start === "number" && typeof end === "number" && size3(value) !== end - start) {
    throw new SliceOffsetOutOfBoundsError3({
      offset: end,
      position: "end",
      size: size3(value)
    });
  }
}
function pad3(hex_, options = {}) {
  const { dir, size: size5 = 32 } = options;
  if (size5 === 0)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size5 * 2)
    throw new SizeExceedsPaddingSizeError3({
      size: Math.ceil(hex.length / 2),
      targetSize: size5,
      type: "Hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size5 * 2, "0")}`;
}
function trim3(value, options = {}) {
  const { dir = "left" } = options;
  let data = value.replace("0x", "");
  let sliceLength = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[dir === "left" ? i : data.length - i - 1].toString() === "0")
      sliceLength++;
    else
      break;
  }
  data = dir === "left" ? data.slice(sliceLength) : data.slice(0, data.length - sliceLength);
  if (data === "0")
    return "0x";
  if (dir === "right" && data.length % 2 === 1)
    return `0x${data}0`;
  return `0x${data}`;
}
var init_hex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/hex.js"() {
    init_Hex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Json.js
function stringify2(value, replacer, space) {
  return JSON.stringify(value, (key, value2) => {
    if (typeof replacer === "function")
      return replacer(key, value2);
    if (typeof value2 === "bigint")
      return value2.toString() + bigIntSuffix;
    return value2;
  }, space);
}
var bigIntSuffix;
var init_Json = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Json.js"() {
    bigIntSuffix = "#__bigint";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Bytes.js
function assert(value) {
  if (value instanceof Uint8Array)
    return;
  if (!value)
    throw new InvalidBytesTypeError(value);
  if (typeof value !== "object")
    throw new InvalidBytesTypeError(value);
  if (!("BYTES_PER_ELEMENT" in value))
    throw new InvalidBytesTypeError(value);
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== "Uint8Array")
    throw new InvalidBytesTypeError(value);
}
function from(value) {
  if (value instanceof Uint8Array)
    return value;
  if (typeof value === "string")
    return fromHex(value);
  return fromArray(value);
}
function fromArray(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}
function fromHex(value, options = {}) {
  const { size: size5 } = options;
  let hex = value;
  if (size5) {
    assertSize3(value, size5);
    hex = padRight(value, size5);
  }
  let hexString = hex.slice(2);
  if (hexString.length % 2)
    hexString = `0${hexString}`;
  const length = hexString.length / 2;
  const bytes = new Uint8Array(length);
  for (let index2 = 0, j = 0; index2 < length; index2++) {
    const nibbleLeft = charCodeToBase162(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase162(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError3(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index2] = nibbleLeft << 4 | nibbleRight;
  }
  return bytes;
}
function fromString(value, options = {}) {
  const { size: size5 } = options;
  const bytes = encoder3.encode(value);
  if (typeof size5 === "number") {
    assertSize2(bytes, size5);
    return padRight2(bytes, size5);
  }
  return bytes;
}
function padRight2(value, size5) {
  return pad2(value, { dir: "right", size: size5 });
}
function size2(value) {
  return value.length;
}
function slice2(value, start, end, options = {}) {
  const { strict } = options;
  assertStartOffset2(value, start);
  const value_ = value.slice(start, end);
  if (strict)
    assertEndOffset2(value_, start, end);
  return value_;
}
function toBigInt2(bytes, options = {}) {
  const { size: size5 } = options;
  if (typeof size5 !== "undefined")
    assertSize2(bytes, size5);
  const hex = fromBytes(bytes, options);
  return toBigInt(hex, options);
}
function toBoolean(bytes, options = {}) {
  const { size: size5 } = options;
  let bytes_ = bytes;
  if (typeof size5 !== "undefined") {
    assertSize2(bytes_, size5);
    bytes_ = trimLeft(bytes_);
  }
  if (bytes_.length > 1 || bytes_[0] > 1)
    throw new InvalidBytesBooleanError2(bytes_);
  return Boolean(bytes_[0]);
}
function toNumber2(bytes, options = {}) {
  const { size: size5 } = options;
  if (typeof size5 !== "undefined")
    assertSize2(bytes, size5);
  const hex = fromBytes(bytes, options);
  return toNumber(hex, options);
}
function toString(bytes, options = {}) {
  const { size: size5 } = options;
  let bytes_ = bytes;
  if (typeof size5 !== "undefined") {
    assertSize2(bytes_, size5);
    bytes_ = trimRight(bytes_);
  }
  return decoder.decode(bytes_);
}
function trimLeft(value) {
  return trim2(value, { dir: "left" });
}
function trimRight(value) {
  return trim2(value, { dir: "right" });
}
function validate(value) {
  try {
    assert(value);
    return true;
  } catch {
    return false;
  }
}
var decoder, encoder3, InvalidBytesBooleanError2, InvalidBytesTypeError, SizeOverflowError2, SliceOffsetOutOfBoundsError2, SizeExceedsPaddingSizeError2;
var init_Bytes = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Bytes.js"() {
    init_Errors();
    init_Hex();
    init_bytes();
    init_hex();
    init_Json();
    decoder = /* @__PURE__ */ new TextDecoder();
    encoder3 = /* @__PURE__ */ new TextEncoder();
    InvalidBytesBooleanError2 = class extends BaseError3 {
      constructor(bytes) {
        super(`Bytes value \`${bytes}\` is not a valid boolean.`, {
          metaMessages: [
            "The bytes array must contain a single byte of either a `0` or `1` value."
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.InvalidBytesBooleanError"
        });
      }
    };
    InvalidBytesTypeError = class extends BaseError3 {
      constructor(value) {
        super(`Value \`${typeof value === "object" ? stringify2(value) : value}\` of type \`${typeof value}\` is an invalid Bytes value.`, {
          metaMessages: ["Bytes values must be of type `Bytes`."]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.InvalidBytesTypeError"
        });
      }
    };
    SizeOverflowError2 = class extends BaseError3 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.SizeOverflowError"
        });
      }
    };
    SliceOffsetOutOfBoundsError2 = class extends BaseError3 {
      constructor({ offset, position, size: size5 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size5}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.SliceOffsetOutOfBoundsError"
        });
      }
    };
    SizeExceedsPaddingSizeError2 = class extends BaseError3 {
      constructor({ size: size5, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size5}\`) exceeds padding size (\`${targetSize}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Bytes.SizeExceedsPaddingSizeError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Hex.js
function assert2(value, options = {}) {
  const { strict = false } = options;
  if (!value)
    throw new InvalidHexTypeError(value);
  if (typeof value !== "string")
    throw new InvalidHexTypeError(value);
  if (strict) {
    if (!/^0x[0-9a-fA-F]*$/.test(value))
      throw new InvalidHexValueError2(value);
  }
  if (!value.startsWith("0x"))
    throw new InvalidHexValueError2(value);
}
function concat2(...values) {
  return `0x${values.reduce((acc, x) => acc + x.replace("0x", ""), "")}`;
}
function from2(value) {
  if (value instanceof Uint8Array)
    return fromBytes(value);
  if (Array.isArray(value))
    return fromBytes(new Uint8Array(value));
  return value;
}
function fromBoolean(value, options = {}) {
  const hex = `0x${Number(value)}`;
  if (typeof options.size === "number") {
    assertSize3(hex, options.size);
    return padLeft(hex, options.size);
  }
  return hex;
}
function fromBytes(value, options = {}) {
  let string = "";
  for (let i = 0; i < value.length; i++)
    string += hexes4[value[i]];
  const hex = `0x${string}`;
  if (typeof options.size === "number") {
    assertSize3(hex, options.size);
    return padRight(hex, options.size);
  }
  return hex;
}
function fromNumber(value, options = {}) {
  const { signed, size: size5 } = options;
  const value_ = BigInt(value);
  let maxValue;
  if (size5) {
    if (signed)
      maxValue = (1n << BigInt(size5) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size5) * 8n) - 1n;
  } else if (typeof value === "number") {
    maxValue = BigInt(Number.MAX_SAFE_INTEGER);
  }
  const minValue = typeof maxValue === "bigint" && signed ? -maxValue - 1n : 0;
  if (maxValue && value_ > maxValue || value_ < minValue) {
    const suffix = typeof value === "bigint" ? "n" : "";
    throw new IntegerOutOfRangeError2({
      max: maxValue ? `${maxValue}${suffix}` : void 0,
      min: `${minValue}${suffix}`,
      signed,
      size: size5,
      value: `${value}${suffix}`
    });
  }
  const stringValue = (signed && value_ < 0 ? BigInt.asUintN(size5 * 8, BigInt(value_)) : value_).toString(16);
  const hex = `0x${stringValue}`;
  if (size5)
    return padLeft(hex, size5);
  return hex;
}
function fromString2(value, options = {}) {
  return fromBytes(encoder4.encode(value), options);
}
function padLeft(value, size5) {
  return pad3(value, { dir: "left", size: size5 });
}
function padRight(value, size5) {
  return pad3(value, { dir: "right", size: size5 });
}
function slice3(value, start, end, options = {}) {
  const { strict } = options;
  assertStartOffset3(value, start);
  const value_ = `0x${value.replace("0x", "").slice((start ?? 0) * 2, (end ?? value.length) * 2)}`;
  if (strict)
    assertEndOffset3(value_, start, end);
  return value_;
}
function size3(value) {
  return Math.ceil((value.length - 2) / 2);
}
function trimLeft2(value) {
  return trim3(value, { dir: "left" });
}
function toBigInt(hex, options = {}) {
  const { signed } = options;
  if (options.size)
    assertSize3(hex, options.size);
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size5 = (hex.length - 2) / 2;
  const max_unsigned = (1n << BigInt(size5) * 8n) - 1n;
  const max_signed = max_unsigned >> 1n;
  if (value <= max_signed)
    return value;
  return value - max_unsigned - 1n;
}
function toNumber(hex, options = {}) {
  const { signed, size: size5 } = options;
  if (!signed && !size5)
    return Number(hex);
  return Number(toBigInt(hex, options));
}
function validate2(value, options = {}) {
  const { strict = false } = options;
  try {
    assert2(value, { strict });
    return true;
  } catch {
    return false;
  }
}
var encoder4, hexes4, IntegerOutOfRangeError2, InvalidHexTypeError, InvalidHexValueError2, SizeOverflowError3, SliceOffsetOutOfBoundsError3, SizeExceedsPaddingSizeError3;
var init_Hex = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Hex.js"() {
    init_Errors();
    init_hex();
    init_Json();
    encoder4 = /* @__PURE__ */ new TextEncoder();
    hexes4 = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    IntegerOutOfRangeError2 = class extends BaseError3 {
      constructor({ max, min, signed, size: size5, value }) {
        super(`Number \`${value}\` is not in safe${size5 ? ` ${size5 * 8}-bit` : ""}${signed ? " signed" : " unsigned"} integer range ${max ? `(\`${min}\` to \`${max}\`)` : `(above \`${min}\`)`}`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.IntegerOutOfRangeError"
        });
      }
    };
    InvalidHexTypeError = class extends BaseError3 {
      constructor(value) {
        super(`Value \`${typeof value === "object" ? stringify2(value) : value}\` of type \`${typeof value}\` is an invalid hex type.`, {
          metaMessages: ['Hex types must be represented as `"0x${string}"`.']
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.InvalidHexTypeError"
        });
      }
    };
    InvalidHexValueError2 = class extends BaseError3 {
      constructor(value) {
        super(`Value \`${value}\` is an invalid hex value.`, {
          metaMessages: [
            'Hex values must start with `"0x"` and contain only hexadecimal characters (0-9, a-f, A-F).'
          ]
        });
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.InvalidHexValueError"
        });
      }
    };
    SizeOverflowError3 = class extends BaseError3 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.SizeOverflowError"
        });
      }
    };
    SliceOffsetOutOfBoundsError3 = class extends BaseError3 {
      constructor({ offset, position, size: size5 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset \`${offset}\` is out-of-bounds (size: \`${size5}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.SliceOffsetOutOfBoundsError"
        });
      }
    };
    SizeExceedsPaddingSizeError3 = class extends BaseError3 {
      constructor({ size: size5, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (\`${size5}\`) exceeds padding size (\`${targetSize}\`).`);
        Object.defineProperty(this, "name", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: "Hex.SizeExceedsPaddingSizeError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Withdrawal.js
function toRpc(withdrawal) {
  return {
    address: withdrawal.address,
    amount: fromNumber(withdrawal.amount),
    index: fromNumber(withdrawal.index),
    validatorIndex: fromNumber(withdrawal.validatorIndex)
  };
}
var init_Withdrawal = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Withdrawal.js"() {
    init_Hex();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/BlockOverrides.js
function toRpc2(blockOverrides) {
  return {
    ...typeof blockOverrides.baseFeePerGas === "bigint" && {
      baseFeePerGas: fromNumber(blockOverrides.baseFeePerGas)
    },
    ...typeof blockOverrides.blobBaseFee === "bigint" && {
      blobBaseFee: fromNumber(blockOverrides.blobBaseFee)
    },
    ...typeof blockOverrides.feeRecipient === "string" && {
      feeRecipient: blockOverrides.feeRecipient
    },
    ...typeof blockOverrides.gasLimit === "bigint" && {
      gasLimit: fromNumber(blockOverrides.gasLimit)
    },
    ...typeof blockOverrides.number === "bigint" && {
      number: fromNumber(blockOverrides.number)
    },
    ...typeof blockOverrides.prevRandao === "bigint" && {
      prevRandao: fromNumber(blockOverrides.prevRandao)
    },
    ...typeof blockOverrides.time === "bigint" && {
      time: fromNumber(blockOverrides.time)
    },
    ...blockOverrides.withdrawals && {
      withdrawals: blockOverrides.withdrawals.map(toRpc)
    }
  };
}
var init_BlockOverrides = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/BlockOverrides.js"() {
    init_Hex();
    init_Withdrawal();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/abis.js
var multicall3Abi, batchGatewayAbi, universalResolverErrors, universalResolverResolveAbi, universalResolverReverseAbi, textResolverAbi, addressResolverAbi, erc1271Abi, erc6492SignatureValidatorAbi, erc20Abi;
var init_abis = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/abis.js"() {
    multicall3Abi = [
      {
        inputs: [
          {
            components: [
              {
                name: "target",
                type: "address"
              },
              {
                name: "allowFailure",
                type: "bool"
              },
              {
                name: "callData",
                type: "bytes"
              }
            ],
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "aggregate3",
        outputs: [
          {
            components: [
              {
                name: "success",
                type: "bool"
              },
              {
                name: "returnData",
                type: "bytes"
              }
            ],
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            name: "addr",
            type: "address"
          }
        ],
        name: "getEthBalance",
        outputs: [
          {
            name: "balance",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCurrentBlockTimestamp",
        outputs: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];
    batchGatewayAbi = [
      {
        name: "query",
        type: "function",
        stateMutability: "view",
        inputs: [
          {
            type: "tuple[]",
            name: "queries",
            components: [
              {
                type: "address",
                name: "sender"
              },
              {
                type: "string[]",
                name: "urls"
              },
              {
                type: "bytes",
                name: "data"
              }
            ]
          }
        ],
        outputs: [
          {
            type: "bool[]",
            name: "failures"
          },
          {
            type: "bytes[]",
            name: "responses"
          }
        ]
      },
      {
        name: "HttpError",
        type: "error",
        inputs: [
          {
            type: "uint16",
            name: "status"
          },
          {
            type: "string",
            name: "message"
          }
        ]
      }
    ];
    universalResolverErrors = [
      {
        inputs: [
          {
            name: "dns",
            type: "bytes"
          }
        ],
        name: "DNSDecodingFailed",
        type: "error"
      },
      {
        inputs: [
          {
            name: "ens",
            type: "string"
          }
        ],
        name: "DNSEncodingFailed",
        type: "error"
      },
      {
        inputs: [],
        name: "EmptyAddress",
        type: "error"
      },
      {
        inputs: [
          {
            name: "status",
            type: "uint16"
          },
          {
            name: "message",
            type: "string"
          }
        ],
        name: "HttpError",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidBatchGatewayResponse",
        type: "error"
      },
      {
        inputs: [
          {
            name: "errorData",
            type: "bytes"
          }
        ],
        name: "ResolverError",
        type: "error"
      },
      {
        inputs: [
          {
            name: "name",
            type: "bytes"
          },
          {
            name: "resolver",
            type: "address"
          }
        ],
        name: "ResolverNotContract",
        type: "error"
      },
      {
        inputs: [
          {
            name: "name",
            type: "bytes"
          }
        ],
        name: "ResolverNotFound",
        type: "error"
      },
      {
        inputs: [
          {
            name: "primary",
            type: "string"
          },
          {
            name: "primaryAddress",
            type: "bytes"
          }
        ],
        name: "ReverseAddressMismatch",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "selector",
            type: "bytes4"
          }
        ],
        name: "UnsupportedResolverProfile",
        type: "error"
      }
    ];
    universalResolverResolveAbi = [
      ...universalResolverErrors,
      {
        name: "resolveWithGateways",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "name", type: "bytes" },
          { name: "data", type: "bytes" },
          { name: "gateways", type: "string[]" }
        ],
        outputs: [
          { name: "", type: "bytes" },
          { name: "address", type: "address" }
        ]
      }
    ];
    universalResolverReverseAbi = [
      ...universalResolverErrors,
      {
        name: "reverseWithGateways",
        type: "function",
        stateMutability: "view",
        inputs: [
          { type: "bytes", name: "reverseName" },
          { type: "uint256", name: "coinType" },
          { type: "string[]", name: "gateways" }
        ],
        outputs: [
          { type: "string", name: "resolvedName" },
          { type: "address", name: "resolver" },
          { type: "address", name: "reverseResolver" }
        ]
      }
    ];
    textResolverAbi = [
      {
        name: "text",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "name", type: "bytes32" },
          { name: "key", type: "string" }
        ],
        outputs: [{ name: "", type: "string" }]
      }
    ];
    addressResolverAbi = [
      {
        name: "addr",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "name", type: "bytes32" }],
        outputs: [{ name: "", type: "address" }]
      },
      {
        name: "addr",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "name", type: "bytes32" },
          { name: "coinType", type: "uint256" }
        ],
        outputs: [{ name: "", type: "bytes" }]
      }
    ];
    erc1271Abi = [
      {
        name: "isValidSignature",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "hash", type: "bytes32" },
          { name: "signature", type: "bytes" }
        ],
        outputs: [{ name: "", type: "bytes4" }]
      }
    ];
    erc6492SignatureValidatorAbi = [
      {
        inputs: [
          {
            name: "_signer",
            type: "address"
          },
          {
            name: "_hash",
            type: "bytes32"
          },
          {
            name: "_signature",
            type: "bytes"
          }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [
          {
            name: "_signer",
            type: "address"
          },
          {
            name: "_hash",
            type: "bytes32"
          },
          {
            name: "_signature",
            type: "bytes"
          }
        ],
        outputs: [
          {
            type: "bool"
          }
        ],
        stateMutability: "nonpayable",
        type: "function",
        name: "isValidSig"
      }
    ];
    erc20Abi = [
      {
        type: "event",
        name: "Approval",
        inputs: [
          {
            indexed: true,
            name: "owner",
            type: "address"
          },
          {
            indexed: true,
            name: "spender",
            type: "address"
          },
          {
            indexed: false,
            name: "value",
            type: "uint256"
          }
        ]
      },
      {
        type: "event",
        name: "Transfer",
        inputs: [
          {
            indexed: true,
            name: "from",
            type: "address"
          },
          {
            indexed: true,
            name: "to",
            type: "address"
          },
          {
            indexed: false,
            name: "value",
            type: "uint256"
          }
        ]
      },
      {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
          {
            name: "owner",
            type: "address"
          },
          {
            name: "spender",
            type: "address"
          }
        ],
        outputs: [
          {
            type: "uint256"
          }
        ]
      },
      {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "spender",
            type: "address"
          },
          {
            name: "amount",
            type: "uint256"
          }
        ],
        outputs: [
          {
            type: "bool"
          }
        ]
      },
      {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [
          {
            name: "account",
            type: "address"
          }
        ],
        outputs: [
          {
            type: "uint256"
          }
        ]
      },
      {
        type: "function",
        name: "decimals",
        stateMutability: "view",
        inputs: [],
        outputs: [
          {
            type: "uint8"
          }
        ]
      },
      {
        type: "function",
        name: "name",
        stateMutability: "view",
        inputs: [],
        outputs: [
          {
            type: "string"
          }
        ]
      },
      {
        type: "function",
        name: "symbol",
        stateMutability: "view",
        inputs: [],
        outputs: [
          {
            type: "string"
          }
        ]
      },
      {
        type: "function",
        name: "totalSupply",
        stateMutability: "view",
        inputs: [],
        outputs: [
          {
            type: "uint256"
          }
        ]
      },
      {
        type: "function",
        name: "transfer",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "recipient",
            type: "address"
          },
          {
            name: "amount",
            type: "uint256"
          }
        ],
        outputs: [
          {
            type: "bool"
          }
        ]
      },
      {
        type: "function",
        name: "transferFrom",
        stateMutability: "nonpayable",
        inputs: [
          {
            name: "sender",
            type: "address"
          },
          {
            name: "recipient",
            type: "address"
          },
          {
            name: "amount",
            type: "uint256"
          }
        ],
        outputs: [
          {
            type: "bool"
          }
        ]
      }
    ];
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/contract.js
var aggregate3Signature;
var init_contract2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/contract.js"() {
    aggregate3Signature = "0x82ad56cb";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/contracts.js
var deploylessCallViaBytecodeBytecode, deploylessCallViaFactoryBytecode, erc6492SignatureValidatorByteCode, multicall3Bytecode;
var init_contracts = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/contracts.js"() {
    deploylessCallViaBytecodeBytecode = "0x608060405234801561001057600080fd5b5060405161018e38038061018e83398101604081905261002f91610124565b6000808351602085016000f59050803b61004857600080fd5b6000808351602085016000855af16040513d6000823e81610067573d81fd5b3d81f35b634e487b7160e01b600052604160045260246000fd5b600082601f83011261009257600080fd5b81516001600160401b038111156100ab576100ab61006b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156100d9576100d961006b565b6040528181528382016020018510156100f157600080fd5b60005b82811015610110576020818601810151838301820152016100f4565b506000918101602001919091529392505050565b6000806040838503121561013757600080fd5b82516001600160401b0381111561014d57600080fd5b61015985828601610081565b602085015190935090506001600160401b0381111561017757600080fd5b61018385828601610081565b915050925092905056fe";
    deploylessCallViaFactoryBytecode = "0x608060405234801561001057600080fd5b506040516102c03803806102c083398101604081905261002f916101e6565b836001600160a01b03163b6000036100e457600080836001600160a01b03168360405161005c9190610270565b6000604051808303816000865af19150503d8060008114610099576040519150601f19603f3d011682016040523d82523d6000602084013e61009e565b606091505b50915091508115806100b857506001600160a01b0386163b155b156100e1578060405163101bb98d60e01b81526004016100d8919061028c565b60405180910390fd5b50505b6000808451602086016000885af16040513d6000823e81610103573d81fd5b3d81f35b80516001600160a01b038116811461011e57600080fd5b919050565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561015457818101518382015260200161013c565b50506000910152565b600082601f83011261016e57600080fd5b81516001600160401b0381111561018757610187610123565b604051601f8201601f19908116603f011681016001600160401b03811182821017156101b5576101b5610123565b6040528181528382016020018510156101cd57600080fd5b6101de826020830160208701610139565b949350505050565b600080600080608085870312156101fc57600080fd5b61020585610107565b60208601519094506001600160401b0381111561022157600080fd5b61022d8782880161015d565b93505061023c60408601610107565b60608601519092506001600160401b0381111561025857600080fd5b6102648782880161015d565b91505092959194509250565b60008251610282818460208701610139565b9190910192915050565b60208152600082518060208401526102ab816040850160208701610139565b601f01601f1916919091016040019291505056fe";
    erc6492SignatureValidatorByteCode = "0x608060405234801561001057600080fd5b5060405161069438038061069483398101604081905261002f9161051e565b600061003c848484610048565b9050806000526001601ff35b60007f64926492649264926492649264926492649264926492649264926492649264926100748361040c565b036101e7576000606080848060200190518101906100929190610577565b60405192955090935091506000906001600160a01b038516906100b69085906105dd565b6000604051808303816000865af19150503d80600081146100f3576040519150601f19603f3d011682016040523d82523d6000602084013e6100f8565b606091505b50509050876001600160a01b03163b60000361016057806101605760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90610190908b9087906004016105f9565b602060405180830381865afa1580156101ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d19190610633565b6001600160e01b03191614945050505050610405565b6001600160a01b0384163b1561027a57604051630b135d3f60e11b808252906001600160a01b03861690631626ba7e9061022790879087906004016105f9565b602060405180830381865afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102689190610633565b6001600160e01b031916149050610405565b81516041146102df5760405162461bcd60e51b815260206004820152603a602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e6774680000000000006064820152608401610157565b6102e7610425565b5060208201516040808401518451859392600091859190811061030c5761030c61065d565b016020015160f81c9050601b811480159061032b57508060ff16601c14155b1561038c5760405162461bcd60e51b815260206004820152603b602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c756500000000006064820152608401610157565b60408051600081526020810180835289905260ff83169181019190915260608101849052608081018390526001600160a01b0389169060019060a0016020604051602081039080840390855afa1580156103ea573d6000803e3d6000fd5b505050602060405103516001600160a01b0316149450505050505b9392505050565b600060208251101561041d57600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b038116811461045857600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561048c578181015183820152602001610474565b50506000910152565b600082601f8301126104a657600080fd5b81516001600160401b038111156104bf576104bf61045b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156104ed576104ed61045b565b60405281815283820160200185101561050557600080fd5b610516826020830160208701610471565b949350505050565b60008060006060848603121561053357600080fd5b835161053e81610443565b6020850151604086015191945092506001600160401b0381111561056157600080fd5b61056d86828701610495565b9150509250925092565b60008060006060848603121561058c57600080fd5b835161059781610443565b60208501519093506001600160401b038111156105b357600080fd5b6105bf86828701610495565b604086015190935090506001600160401b0381111561056157600080fd5b600082516105ef818460208701610471565b9190910192915050565b828152604060208201526000825180604084015261061e816060850160208701610471565b601f01601f1916919091016060019392505050565b60006020828403121561064557600080fd5b81516001600160e01b03198116811461040557600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572";
    multicall3Bytecode = "0x608060405234801561001057600080fd5b506115b9806100206000396000f3fe6080604052600436106100f35760003560e01c80634d2301cc1161008a578063a8b0574e11610059578063a8b0574e14610325578063bce38bd714610350578063c3077fa914610380578063ee82ac5e146103b2576100f3565b80634d2301cc1461026257806372425d9d1461029f57806382ad56cb146102ca57806386d516e8146102fa576100f3565b80633408e470116100c65780633408e470146101af578063399542e9146101da5780633e64a6961461020c57806342cbb15c14610237576100f3565b80630f28c97d146100f8578063174dea7114610123578063252dba421461015357806327e86d6e14610184575b600080fd5b34801561010457600080fd5b5061010d6103ef565b60405161011a9190610c0a565b60405180910390f35b61013d60048036038101906101389190610c94565b6103f7565b60405161014a9190610e94565b60405180910390f35b61016d60048036038101906101689190610f0c565b610615565b60405161017b92919061101b565b60405180910390f35b34801561019057600080fd5b506101996107ab565b6040516101a69190611064565b60405180910390f35b3480156101bb57600080fd5b506101c46107b7565b6040516101d19190610c0a565b60405180910390f35b6101f460048036038101906101ef91906110ab565b6107bf565b6040516102039392919061110b565b60405180910390f35b34801561021857600080fd5b506102216107e1565b60405161022e9190610c0a565b60405180910390f35b34801561024357600080fd5b5061024c6107e9565b6040516102599190610c0a565b60405180910390f35b34801561026e57600080fd5b50610289600480360381019061028491906111a7565b6107f1565b6040516102969190610c0a565b60405180910390f35b3480156102ab57600080fd5b506102b4610812565b6040516102c19190610c0a565b60405180910390f35b6102e460048036038101906102df919061122a565b61081a565b6040516102f19190610e94565b60405180910390f35b34801561030657600080fd5b5061030f6109e4565b60405161031c9190610c0a565b60405180910390f35b34801561033157600080fd5b5061033a6109ec565b6040516103479190611286565b60405180910390f35b61036a600480360381019061036591906110ab565b6109f4565b6040516103779190610e94565b60405180910390f35b61039a60048036038101906103959190610f0c565b610ba6565b6040516103a99392919061110b565b60405180910390f35b3480156103be57600080fd5b506103d960048036038101906103d491906112cd565b610bca565b6040516103e69190611064565b60405180910390f35b600042905090565b60606000808484905090508067ffffffffffffffff81111561041c5761041b6112fa565b5b60405190808252806020026020018201604052801561045557816020015b610442610bd5565b81526020019060019003908161043a5790505b5092503660005b828110156105c957600085828151811061047957610478611329565b5b6020026020010151905087878381811061049657610495611329565b5b90506020028101906104a89190611367565b925060008360400135905080860195508360000160208101906104cb91906111a7565b73ffffffffffffffffffffffffffffffffffffffff16818580606001906104f2919061138f565b604051610500929190611431565b60006040518083038185875af1925050503d806000811461053d576040519150601f19603f3d011682016040523d82523d6000602084013e610542565b606091505b5083600001846020018290528215151515815250505081516020850135176105bc577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260846000fd5b826001019250505061045c565b5082341461060c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610603906114a7565b60405180910390fd5b50505092915050565b6000606043915060008484905090508067ffffffffffffffff81111561063e5761063d6112fa565b5b60405190808252806020026020018201604052801561067157816020015b606081526020019060019003908161065c5790505b5091503660005b828110156107a157600087878381811061069557610694611329565b5b90506020028101906106a791906114c7565b92508260000160208101906106bc91906111a7565b73ffffffffffffffffffffffffffffffffffffffff168380602001906106e2919061138f565b6040516106f0929190611431565b6000604051808303816000865af19150503d806000811461072d576040519150601f19603f3d011682016040523d82523d6000602084013e610732565b606091505b5086848151811061074657610745611329565b5b60200260200101819052819250505080610795576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161078c9061153b565b60405180910390fd5b81600101915050610678565b5050509250929050565b60006001430340905090565b600046905090565b6000806060439250434091506107d68686866109f4565b905093509350939050565b600048905090565b600043905090565b60008173ffffffffffffffffffffffffffffffffffffffff16319050919050565b600044905090565b606060008383905090508067ffffffffffffffff81111561083e5761083d6112fa565b5b60405190808252806020026020018201604052801561087757816020015b610864610bd5565b81526020019060019003908161085c5790505b5091503660005b828110156109db57600084828151811061089b5761089a611329565b5b602002602001015190508686838181106108b8576108b7611329565b5b90506020028101906108ca919061155b565b92508260000160208101906108df91906111a7565b73ffffffffffffffffffffffffffffffffffffffff16838060400190610905919061138f565b604051610913929190611431565b6000604051808303816000865af19150503d8060008114610950576040519150601f19603f3d011682016040523d82523d6000602084013e610955565b606091505b5082600001836020018290528215151515815250505080516020840135176109cf577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260646000fd5b8160010191505061087e565b50505092915050565b600045905090565b600041905090565b606060008383905090508067ffffffffffffffff811115610a1857610a176112fa565b5b604051908082528060200260200182016040528015610a5157816020015b610a3e610bd5565b815260200190600190039081610a365790505b5091503660005b82811015610b9c576000848281518110610a7557610a74611329565b5b60200260200101519050868683818110610a9257610a91611329565b5b9050602002810190610aa491906114c7565b9250826000016020810190610ab991906111a7565b73ffffffffffffffffffffffffffffffffffffffff16838060200190610adf919061138f565b604051610aed929190611431565b6000604051808303816000865af19150503d8060008114610b2a576040519150601f19603f3d011682016040523d82523d6000602084013e610b2f565b606091505b508260000183602001829052821515151581525050508715610b90578060000151610b8f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b869061153b565b60405180910390fd5b5b81600101915050610a58565b5050509392505050565b6000806060610bb7600186866107bf565b8093508194508295505050509250925092565b600081409050919050565b6040518060400160405280600015158152602001606081525090565b6000819050919050565b610c0481610bf1565b82525050565b6000602082019050610c1f6000830184610bfb565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f840112610c5457610c53610c2f565b5b8235905067ffffffffffffffff811115610c7157610c70610c34565b5b602083019150836020820283011115610c8d57610c8c610c39565b5b9250929050565b60008060208385031215610cab57610caa610c25565b5b600083013567ffffffffffffffff811115610cc957610cc8610c2a565b5b610cd585828601610c3e565b92509250509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b60008115159050919050565b610d2281610d0d565b82525050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610d62578082015181840152602081019050610d47565b83811115610d71576000848401525b50505050565b6000601f19601f8301169050919050565b6000610d9382610d28565b610d9d8185610d33565b9350610dad818560208601610d44565b610db681610d77565b840191505092915050565b6000604083016000830151610dd96000860182610d19565b5060208301518482036020860152610df18282610d88565b9150508091505092915050565b6000610e0a8383610dc1565b905092915050565b6000602082019050919050565b6000610e2a82610ce1565b610e348185610cec565b935083602082028501610e4685610cfd565b8060005b85811015610e825784840389528151610e638582610dfe565b9450610e6e83610e12565b925060208a01995050600181019050610e4a565b50829750879550505050505092915050565b60006020820190508181036000830152610eae8184610e1f565b905092915050565b60008083601f840112610ecc57610ecb610c2f565b5b8235905067ffffffffffffffff811115610ee957610ee8610c34565b5b602083019150836020820283011115610f0557610f04610c39565b5b9250929050565b60008060208385031215610f2357610f22610c25565b5b600083013567ffffffffffffffff811115610f4157610f40610c2a565b5b610f4d85828601610eb6565b92509250509250929050565b600081519050919050565b600082825260208201905092915050565b6000819050602082019050919050565b6000610f918383610d88565b905092915050565b6000602082019050919050565b6000610fb182610f59565b610fbb8185610f64565b935083602082028501610fcd85610f75565b8060005b858110156110095784840389528151610fea8582610f85565b9450610ff583610f99565b925060208a01995050600181019050610fd1565b50829750879550505050505092915050565b60006040820190506110306000830185610bfb565b81810360208301526110428184610fa6565b90509392505050565b6000819050919050565b61105e8161104b565b82525050565b60006020820190506110796000830184611055565b92915050565b61108881610d0d565b811461109357600080fd5b50565b6000813590506110a58161107f565b92915050565b6000806000604084860312156110c4576110c3610c25565b5b60006110d286828701611096565b935050602084013567ffffffffffffffff8111156110f3576110f2610c2a565b5b6110ff86828701610eb6565b92509250509250925092565b60006060820190506111206000830186610bfb565b61112d6020830185611055565b818103604083015261113f8184610e1f565b9050949350505050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061117482611149565b9050919050565b61118481611169565b811461118f57600080fd5b50565b6000813590506111a18161117b565b92915050565b6000602082840312156111bd576111bc610c25565b5b60006111cb84828501611192565b91505092915050565b60008083601f8401126111ea576111e9610c2f565b5b8235905067ffffffffffffffff81111561120757611206610c34565b5b60208301915083602082028301111561122357611222610c39565b5b9250929050565b6000806020838503121561124157611240610c25565b5b600083013567ffffffffffffffff81111561125f5761125e610c2a565b5b61126b858286016111d4565b92509250509250929050565b61128081611169565b82525050565b600060208201905061129b6000830184611277565b92915050565b6112aa81610bf1565b81146112b557600080fd5b50565b6000813590506112c7816112a1565b92915050565b6000602082840312156112e3576112e2610c25565b5b60006112f1848285016112b8565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600080fd5b600080fd5b600080fd5b60008235600160800383360303811261138357611382611358565b5b80830191505092915050565b600080833560016020038436030381126113ac576113ab611358565b5b80840192508235915067ffffffffffffffff8211156113ce576113cd61135d565b5b6020830192506001820236038313156113ea576113e9611362565b5b509250929050565b600081905092915050565b82818337600083830152505050565b600061141883856113f2565b93506114258385846113fd565b82840190509392505050565b600061143e82848661140c565b91508190509392505050565b600082825260208201905092915050565b7f4d756c746963616c6c333a2076616c7565206d69736d61746368000000000000600082015250565b6000611491601a8361144a565b915061149c8261145b565b602082019050919050565b600060208201905081810360008301526114c081611484565b9050919050565b6000823560016040038336030381126114e3576114e2611358565b5b80830191505092915050565b7f4d756c746963616c6c333a2063616c6c206661696c6564000000000000000000600082015250565b600061152560178361144a565b9150611530826114ef565b602082019050919050565b6000602082019050818103600083015261155481611518565b9050919050565b60008235600160600383360303811261157757611576611358565b5b8083019150509291505056fea264697066735822122020c1bc9aacf8e4a6507193432a895a8e77094f45a1395583f07b24e860ef06cd64736f6c634300080c0033";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/chain.js
var ChainDoesNotSupportContract, ClientChainNotConfiguredError, InvalidChainIdError;
var init_chain = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/chain.js"() {
    init_base();
    ChainDoesNotSupportContract = class extends BaseError2 {
      constructor({ blockNumber, chain, contract }) {
        super(`Chain "${chain.name}" does not support contract "${contract.name}".`, {
          metaMessages: [
            "This could be due to any of the following:",
            ...blockNumber && contract.blockCreated && contract.blockCreated > blockNumber ? [
              `- The contract "${contract.name}" was not deployed until block ${contract.blockCreated} (current block ${blockNumber}).`
            ] : [
              `- The chain does not have the contract "${contract.name}" configured.`
            ]
          ],
          name: "ChainDoesNotSupportContract"
        });
      }
    };
    ClientChainNotConfiguredError = class extends BaseError2 {
      constructor() {
        super("No chain was provided to the Client.", {
          name: "ClientChainNotConfiguredError"
        });
      }
    };
    InvalidChainIdError = class extends BaseError2 {
      constructor({ chainId }) {
        super(typeof chainId === "number" ? `Chain ID "${chainId}" is invalid.` : "Chain ID is invalid.", { name: "InvalidChainIdError" });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeDeployData.js
function encodeDeployData(parameters) {
  const { abi: abi2, args, bytecode } = parameters;
  if (!args || args.length === 0)
    return bytecode;
  const description = abi2.find((x) => "type" in x && x.type === "constructor");
  if (!description)
    throw new AbiConstructorNotFoundError({ docsPath: docsPath5 });
  if (!("inputs" in description))
    throw new AbiConstructorParamsNotFoundError({ docsPath: docsPath5 });
  if (!description.inputs || description.inputs.length === 0)
    throw new AbiConstructorParamsNotFoundError({ docsPath: docsPath5 });
  const data = encodeAbiParameters(description.inputs, args);
  return concatHex([bytecode, data]);
}
var docsPath5;
var init_encodeDeployData = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeDeployData.js"() {
    init_abi();
    init_concat();
    init_encodeAbiParameters();
    docsPath5 = "/docs/contract/encodeDeployData";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/chain/getChainContractAddress.js
function getChainContractAddress({ blockNumber, chain, contract: name }) {
  const contract = chain?.contracts?.[name];
  if (!contract)
    throw new ChainDoesNotSupportContract({
      chain,
      contract: { name }
    });
  if (blockNumber && contract.blockCreated && contract.blockCreated > blockNumber)
    throw new ChainDoesNotSupportContract({
      blockNumber,
      chain,
      contract: {
        name,
        blockCreated: contract.blockCreated
      }
    });
  return contract.address;
}
var init_getChainContractAddress = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/chain/getChainContractAddress.js"() {
    init_chain();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getCallError.js
function getCallError(err, { docsPath: docsPath8, ...args }) {
  const cause = (() => {
    const cause2 = getNodeError(err, args);
    if (cause2 instanceof UnknownNodeError)
      return err;
    return cause2;
  })();
  return new CallExecutionError(cause, {
    docsPath: docsPath8,
    ...args
  });
}
var init_getCallError = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getCallError.js"() {
    init_contract();
    init_node();
    init_getNodeError();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withResolvers.js
function withResolvers() {
  let resolve = () => void 0;
  let reject = () => void 0;
  const promise = new Promise((resolve_, reject_) => {
    resolve = resolve_;
    reject = reject_;
  });
  return { promise, resolve, reject };
}
var init_withResolvers = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withResolvers.js"() {
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/createBatchScheduler.js
function createBatchScheduler({ fn, id, shouldSplitBatch, wait: wait2 = 0, sort }) {
  const exec = async () => {
    const scheduler = getScheduler();
    flush();
    const args = scheduler.map(({ args: args2 }) => args2);
    if (args.length === 0)
      return;
    fn(args).then((data) => {
      if (sort && Array.isArray(data))
        data.sort(sort);
      for (let i = 0; i < scheduler.length; i++) {
        const { resolve } = scheduler[i];
        resolve?.([data[i], data]);
      }
    }).catch((err) => {
      for (let i = 0; i < scheduler.length; i++) {
        const { reject } = scheduler[i];
        reject?.(err);
      }
    });
  };
  const flush = () => schedulerCache.delete(id);
  const getBatchedArgs = () => getScheduler().map(({ args }) => args);
  const getScheduler = () => schedulerCache.get(id) || [];
  const setScheduler = (item) => schedulerCache.set(id, [...getScheduler(), item]);
  return {
    flush,
    async schedule(args) {
      const { promise, resolve, reject } = withResolvers();
      const split2 = shouldSplitBatch?.([...getBatchedArgs(), args]);
      if (split2)
        exec();
      const hasActiveScheduler = getScheduler().length > 0;
      if (hasActiveScheduler) {
        setScheduler({ args, resolve, reject });
        return promise;
      }
      setScheduler({ args, resolve, reject });
      setTimeout(exec, wait2);
      return promise;
    }
  };
}
var schedulerCache;
var init_createBatchScheduler = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/createBatchScheduler.js"() {
    init_withResolvers();
    schedulerCache = /* @__PURE__ */ new Map();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/ccip.js
var OffchainLookupError, OffchainLookupResponseMalformedError, OffchainLookupSenderMismatchError;
var init_ccip = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/ccip.js"() {
    init_stringify();
    init_base();
    init_utils3();
    OffchainLookupError = class extends BaseError2 {
      constructor({ callbackSelector, cause, data, extraData, sender, urls }) {
        super(cause.shortMessage || "An error occurred while fetching for an offchain result.", {
          cause,
          metaMessages: [
            ...cause.metaMessages || [],
            cause.metaMessages?.length ? "" : [],
            "Offchain Gateway Call:",
            urls && [
              "  Gateway URL(s):",
              ...urls.map((url) => `    ${getUrl(url)}`)
            ],
            `  Sender: ${sender}`,
            `  Data: ${data}`,
            `  Callback selector: ${callbackSelector}`,
            `  Extra data: ${extraData}`
          ].flat(),
          name: "OffchainLookupError"
        });
      }
    };
    OffchainLookupResponseMalformedError = class extends BaseError2 {
      constructor({ result, url }) {
        super("Offchain gateway response is malformed. Response data must be a hex value.", {
          metaMessages: [
            `Gateway URL: ${getUrl(url)}`,
            `Response: ${stringify(result)}`
          ],
          name: "OffchainLookupResponseMalformedError"
        });
      }
    };
    OffchainLookupSenderMismatchError = class extends BaseError2 {
      constructor({ sender, to }) {
        super("Reverted sender address does not match target contract address (`to`).", {
          metaMessages: [
            `Contract address: ${to}`,
            `OffchainLookup sender address: ${sender}`
          ],
          name: "OffchainLookupSenderMismatchError"
        });
      }
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeFunctionData.js
function decodeFunctionData(parameters) {
  const { abi: abi2, data } = parameters;
  const signature = slice(data, 0, 4);
  const description = abi2.find((x) => x.type === "function" && signature === toFunctionSelector(formatAbiItem2(x)));
  if (!description)
    throw new AbiFunctionSignatureNotFoundError(signature, {
      docsPath: "/docs/contract/decodeFunctionData"
    });
  return {
    functionName: description.name,
    args: "inputs" in description && description.inputs && description.inputs.length > 0 ? decodeAbiParameters(description.inputs, slice(data, 4)) : void 0
  };
}
var init_decodeFunctionData = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeFunctionData.js"() {
    init_abi();
    init_slice();
    init_toFunctionSelector();
    init_decodeAbiParameters();
    init_formatAbiItem2();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeErrorResult.js
function encodeErrorResult(parameters) {
  const { abi: abi2, errorName, args } = parameters;
  let abiItem = abi2[0];
  if (errorName) {
    const item = getAbiItem({ abi: abi2, args, name: errorName });
    if (!item)
      throw new AbiErrorNotFoundError(errorName, { docsPath: docsPath6 });
    abiItem = item;
  }
  if (abiItem.type !== "error")
    throw new AbiErrorNotFoundError(void 0, { docsPath: docsPath6 });
  const definition = formatAbiItem2(abiItem);
  const signature = toFunctionSelector(definition);
  let data = "0x";
  if (args && args.length > 0) {
    if (!abiItem.inputs)
      throw new AbiErrorInputsNotFoundError(abiItem.name, { docsPath: docsPath6 });
    data = encodeAbiParameters(abiItem.inputs, args);
  }
  return concatHex([signature, data]);
}
var docsPath6;
var init_encodeErrorResult = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeErrorResult.js"() {
    init_abi();
    init_concat();
    init_toFunctionSelector();
    init_encodeAbiParameters();
    init_formatAbiItem2();
    init_getAbiItem();
    docsPath6 = "/docs/contract/encodeErrorResult";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeFunctionResult.js
function encodeFunctionResult(parameters) {
  const { abi: abi2, functionName, result } = parameters;
  let abiItem = abi2[0];
  if (functionName) {
    const item = getAbiItem({ abi: abi2, name: functionName });
    if (!item)
      throw new AbiFunctionNotFoundError(functionName, { docsPath: docsPath7 });
    abiItem = item;
  }
  if (abiItem.type !== "function")
    throw new AbiFunctionNotFoundError(void 0, { docsPath: docsPath7 });
  if (!abiItem.outputs)
    throw new AbiFunctionOutputsNotFoundError(abiItem.name, { docsPath: docsPath7 });
  const values = (() => {
    if (abiItem.outputs.length === 0)
      return [];
    if (abiItem.outputs.length === 1)
      return [result];
    if (Array.isArray(result))
      return result;
    throw new InvalidArrayError(result);
  })();
  return encodeAbiParameters(abiItem.outputs, values);
}
var docsPath7;
var init_encodeFunctionResult = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeFunctionResult.js"() {
    init_abi();
    init_encodeAbiParameters();
    init_getAbiItem();
    docsPath7 = "/docs/contract/encodeFunctionResult";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/localBatchGatewayRequest.js
async function localBatchGatewayRequest(parameters) {
  const { data, ccipRequest: ccipRequest2 } = parameters;
  const { args: [queries] } = decodeFunctionData({ abi: batchGatewayAbi, data });
  const failures = [];
  const responses = [];
  await Promise.all(queries.map(async (query, i) => {
    try {
      responses[i] = query.urls.includes(localBatchGatewayUrl) ? await localBatchGatewayRequest({ data: query.data, ccipRequest: ccipRequest2 }) : await ccipRequest2(query);
      failures[i] = false;
    } catch (err) {
      failures[i] = true;
      responses[i] = encodeError(err);
    }
  }));
  return encodeFunctionResult({
    abi: batchGatewayAbi,
    functionName: "query",
    result: [failures, responses]
  });
}
function encodeError(error) {
  if (error.name === "HttpRequestError" && error.status)
    return encodeErrorResult({
      abi: batchGatewayAbi,
      errorName: "HttpError",
      args: [error.status, error.shortMessage]
    });
  return encodeErrorResult({
    abi: [solidityError],
    errorName: "Error",
    args: ["shortMessage" in error ? error.shortMessage : error.message]
  });
}
var localBatchGatewayUrl;
var init_localBatchGatewayRequest = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/localBatchGatewayRequest.js"() {
    init_abis();
    init_solidity();
    init_decodeFunctionData();
    init_encodeErrorResult();
    init_encodeFunctionResult();
    localBatchGatewayUrl = "x-batch-gateway:true";
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ccip.js
var ccip_exports = {};
__export(ccip_exports, {
  ccipRequest: () => ccipRequest,
  offchainLookup: () => offchainLookup,
  offchainLookupAbiItem: () => offchainLookupAbiItem,
  offchainLookupSignature: () => offchainLookupSignature
});
async function offchainLookup(client, { blockNumber, blockTag, data, requestOptions, to }) {
  const { args } = decodeErrorResult({
    data,
    abi: [offchainLookupAbiItem]
  });
  const [sender, urls, callData, callbackSelector, extraData] = args;
  const { ccipRead } = client;
  const ccipRequest_ = ccipRead && typeof ccipRead?.request === "function" ? ccipRead.request : ccipRequest;
  try {
    if (!isAddressEqual(to, sender))
      throw new OffchainLookupSenderMismatchError({ sender, to });
    const result = urls.includes(localBatchGatewayUrl) ? await localBatchGatewayRequest({
      data: callData,
      ccipRequest: (parameters) => ccipRequest_({ ...parameters, requestOptions })
    }) : await ccipRequest_({ data: callData, requestOptions, sender, urls });
    const { data: data_ } = await call(client, {
      blockNumber,
      blockTag,
      data: concat([
        callbackSelector,
        encodeAbiParameters([{ type: "bytes" }, { type: "bytes" }], [result, extraData])
      ]),
      requestOptions,
      to
    });
    return data_;
  } catch (err) {
    if (requestOptions?.signal?.aborted)
      throw getAbortError(requestOptions.signal);
    if (isAbortError(err))
      throw err;
    throw new OffchainLookupError({
      callbackSelector,
      cause: err,
      data,
      extraData,
      sender,
      urls
    });
  }
}
async function ccipRequest({ data, requestOptions, sender, urls }) {
  let error = new Error("An unknown error occurred.");
  for (let i = 0; i < urls.length; i++) {
    if (requestOptions?.signal?.aborted)
      throw getAbortError(requestOptions.signal);
    const url = urls[i];
    const method = url.includes("{data}") ? "GET" : "POST";
    const body = method === "POST" ? { data, sender } : void 0;
    const headers = method === "POST" ? { "Content-Type": "application/json" } : {};
    try {
      const response = await fetch(url.replace("{sender}", sender.toLowerCase()).replace("{data}", data), {
        body: JSON.stringify(body),
        headers,
        method,
        ...requestOptions?.signal ? { signal: requestOptions.signal } : {}
      });
      let result;
      if (response.headers.get("Content-Type")?.startsWith("application/json")) {
        result = (await response.json()).data;
      } else {
        result = await response.text();
      }
      if (!response.ok) {
        error = new HttpRequestError({
          body,
          details: result?.error ? stringify(result.error) : response.statusText,
          headers: response.headers,
          status: response.status,
          url
        });
        continue;
      }
      if (!isHex(result)) {
        error = new OffchainLookupResponseMalformedError({
          result,
          url
        });
        continue;
      }
      return result;
    } catch (err) {
      if (requestOptions?.signal?.aborted)
        throw getAbortError(requestOptions.signal);
      if (isAbortError(err))
        throw err;
      error = new HttpRequestError({
        body,
        details: err.message,
        url
      });
    }
  }
  throw error;
}
var offchainLookupSignature, offchainLookupAbiItem;
var init_ccip2 = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ccip.js"() {
    init_call();
    init_ccip();
    init_request();
    init_utils3();
    init_decodeErrorResult();
    init_encodeAbiParameters();
    init_isAddressEqual();
    init_concat();
    init_isHex();
    init_localBatchGatewayRequest();
    init_stringify();
    offchainLookupSignature = "0x556f1830";
    offchainLookupAbiItem = {
      name: "OffchainLookup",
      type: "error",
      inputs: [
        {
          name: "sender",
          type: "address"
        },
        {
          name: "urls",
          type: "string[]"
        },
        {
          name: "callData",
          type: "bytes"
        },
        {
          name: "callbackFunction",
          type: "bytes4"
        },
        {
          name: "extraData",
          type: "bytes"
        }
      ]
    };
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/call.js
async function call(client, args) {
  const { account: account_ = client.account, authorizationList, batch = Boolean(client.batch?.multicall), blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical, accessList, blobs, blockOverrides, code, data: data_, factory, factoryData, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, requestOptions, to, value, stateOverride, ...rest } = args;
  const account = account_ ? parseAccount(account_) : void 0;
  if (code && (factory || factoryData))
    throw new BaseError2("Cannot provide both `code` & `factory`/`factoryData` as parameters.");
  if (code && to)
    throw new BaseError2("Cannot provide both `code` & `to` as parameters.");
  const deploylessCallViaBytecode = code && data_;
  const deploylessCallViaFactory = factory && factoryData && to && data_;
  const deploylessCall = deploylessCallViaBytecode || deploylessCallViaFactory;
  const data = (() => {
    if (deploylessCallViaBytecode)
      return toDeploylessCallViaBytecodeData({
        code,
        data: data_
      });
    if (deploylessCallViaFactory)
      return toDeploylessCallViaFactoryData({
        data: data_,
        factory,
        factoryData,
        to
      });
    return data_;
  })();
  try {
    assertRequest(args);
    const block = formatBlockParameter({
      blockHash,
      blockNumber,
      blockTag,
      requireCanonical
    });
    const rpcBlockOverrides = blockOverrides ? toRpc2(blockOverrides) : void 0;
    const rpcStateOverride = serializeStateOverride(stateOverride);
    const chainFormat = client.chain?.formatters?.transactionRequest?.format;
    const format = chainFormat || formatTransactionRequest;
    const request = format({
      // Pick out extra data that might exist on the chain's transaction request type.
      ...extract(rest, { format: chainFormat }),
      accessList,
      account,
      authorizationList,
      blobs,
      data,
      gas,
      gasPrice,
      maxFeePerBlobGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      to: deploylessCall ? void 0 : to,
      value
    }, "call");
    if (batch && shouldPerformMulticall({ request }) && !rpcBlockOverrides && blockHash === void 0) {
      try {
        const { deployless = false } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
        const multicallAddress = getMulticallAddress(client, {
          blockNumber,
          deployless
        });
        if (!multicallAddress || !hasStateOverrideForAddress(rpcStateOverride, multicallAddress))
          return await scheduleMulticall(client, {
            ...request,
            blockHash,
            blockNumber,
            blockTag,
            multicallAddress,
            requestOptions,
            requireCanonical,
            rpcStateOverride
          });
      } catch (err) {
        if (!(err instanceof ClientChainNotConfiguredError) && !(err instanceof ChainDoesNotSupportContract))
          throw err;
      }
    }
    const params = (() => {
      const base = [
        request,
        block
      ];
      if (rpcStateOverride && rpcBlockOverrides)
        return [...base, rpcStateOverride, rpcBlockOverrides];
      if (rpcStateOverride)
        return [...base, rpcStateOverride];
      if (rpcBlockOverrides)
        return [...base, {}, rpcBlockOverrides];
      return base;
    })();
    const response = await client.request({
      method: "eth_call",
      params
    }, requestOptions);
    if (response === "0x")
      return { data: void 0 };
    return { data: response };
  } catch (err) {
    if (requestOptions?.signal?.aborted)
      throw getAbortError(requestOptions.signal);
    if (isAbortError(err))
      throw err;
    const data2 = getRevertErrorData(err);
    const { offchainLookup: offchainLookup2, offchainLookupSignature: offchainLookupSignature2 } = await Promise.resolve().then(() => (init_ccip2(), ccip_exports));
    if (client.ccipRead !== false && data2?.slice(0, 10) === offchainLookupSignature2 && to)
      return {
        data: await offchainLookup2(client, { data: data2, requestOptions, to })
      };
    if (deploylessCall && data2?.slice(0, 10) === "0x101bb98d")
      throw new CounterfactualDeploymentFailedError({ factory });
    throw getCallError(err, {
      ...args,
      account,
      chain: client.chain
    });
  }
}
function shouldPerformMulticall({ request }) {
  const { data, to, ...request_ } = request;
  if (!data)
    return false;
  if (data.startsWith(aggregate3Signature))
    return false;
  if (!to)
    return false;
  if (Object.values(request_).filter((x) => typeof x !== "undefined").length > 0)
    return false;
  return true;
}
function getRequestOptionsId(requestOptions) {
  if (!requestOptions)
    return "default";
  const id = requestOptionsIds.get(requestOptions);
  if (id !== void 0)
    return id;
  const nextId = requestOptionsId++;
  requestOptionsIds.set(requestOptions, nextId);
  return nextId;
}
async function scheduleMulticall(client, args) {
  const { batchSize = 1024, deployless = false, wait: wait2 = 0 } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
  const { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical, data, multicallAddress: multicallAddress_, requestOptions, rpcStateOverride, to } = args;
  const multicallAddress = multicallAddress_ !== void 0 ? multicallAddress_ : getMulticallAddress(client, {
    blockNumber,
    deployless
  });
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const blockId = typeof block === "string" ? block : JSON.stringify(block);
  const stateOverrideKey = rpcStateOverride ? `.${JSON.stringify(rpcStateOverride)}` : "";
  const { schedule } = createBatchScheduler({
    id: `${client.uid}.${blockId}.${getRequestOptionsId(requestOptions)}${stateOverrideKey}`,
    wait: wait2,
    shouldSplitBatch(args2) {
      const size5 = args2.reduce((size6, { data: data2 }) => size6 + (data2.length - 2), 0);
      return size5 > batchSize * 2;
    },
    fn: async (requests) => {
      const calls = requests.map((request) => ({
        allowFailure: true,
        callData: request.data,
        target: request.to
      }));
      const calldata = encodeFunctionData({
        abi: multicall3Abi,
        args: [calls],
        functionName: "aggregate3"
      });
      const multicallRequest = {
        ...multicallAddress === null ? {
          data: toDeploylessCallViaBytecodeData({
            code: multicall3Bytecode,
            data: calldata
          })
        } : { to: multicallAddress, data: calldata }
      };
      const data2 = await client.request({
        method: "eth_call",
        params: rpcStateOverride ? [multicallRequest, block, rpcStateOverride] : [multicallRequest, block]
      }, requestOptions);
      return decodeFunctionResult({
        abi: multicall3Abi,
        args: [calls],
        functionName: "aggregate3",
        data: data2 || "0x"
      });
    }
  });
  const [{ returnData, success }] = await schedule({ data, to });
  if (!success)
    throw new RawContractError({ data: returnData });
  if (returnData === "0x")
    return { data: void 0 };
  return { data: returnData };
}
function getMulticallAddress(client, parameters) {
  const { blockNumber, deployless } = parameters;
  if (deployless)
    return null;
  if (client.chain)
    return getChainContractAddress({
      blockNumber,
      chain: client.chain,
      contract: "multicall3"
    });
  throw new ClientChainNotConfiguredError();
}
function hasStateOverrideForAddress(rpcStateOverride, address) {
  if (!rpcStateOverride)
    return false;
  return Object.keys(rpcStateOverride).some((stateOverrideAddress) => isAddressEqual(stateOverrideAddress, address));
}
function toDeploylessCallViaBytecodeData(parameters) {
  const { code, data } = parameters;
  return encodeDeployData({
    abi: parseAbi(["constructor(bytes, bytes)"]),
    bytecode: deploylessCallViaBytecodeBytecode,
    args: [code, data]
  });
}
function toDeploylessCallViaFactoryData(parameters) {
  const { data, factory, factoryData, to } = parameters;
  return encodeDeployData({
    abi: parseAbi(["constructor(address, bytes, address, bytes)"]),
    bytecode: deploylessCallViaFactoryBytecode,
    args: [to, data, factory, factoryData]
  });
}
function getRevertErrorData(err) {
  if (!(err instanceof BaseError2))
    return void 0;
  const error = err.walk();
  return typeof error?.data === "object" ? error.data?.data : error.data;
}
var requestOptionsId, requestOptionsIds;
var init_call = __esm({
  "packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/call.js"() {
    init_exports();
    init_BlockOverrides();
    init_parseAccount();
    init_abis();
    init_contract2();
    init_contracts();
    init_base();
    init_chain();
    init_contract();
    init_utils3();
    init_decodeFunctionResult();
    init_encodeDeployData();
    init_encodeFunctionData();
    init_isAddressEqual();
    init_formatBlockParameter();
    init_getChainContractAddress();
    init_getCallError();
    init_extract();
    init_transactionRequest();
    init_createBatchScheduler();
    init_stateOverride2();
    init_assertRequest();
    requestOptionsId = 0;
    requestOptionsIds = /* @__PURE__ */ new WeakMap();
  }
});

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/index.js
init_exports();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/getAction.js
function getAction(client, actionFn, name) {
  const action_implicit = client[actionFn.name];
  if (typeof action_implicit === "function")
    return action_implicit;
  const action_explicit = client[name];
  if (typeof action_explicit === "function")
    return action_explicit;
  return (params) => actionFn(client, params);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeEventTopics.js
init_abi();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/log.js
init_base();
var FilterTypeNotSupportedError = class extends BaseError2 {
  constructor(type) {
    super(`Filter type "${type}" is not supported.`, {
      name: "FilterTypeNotSupportedError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/encodeEventTopics.js
init_toBytes();
init_keccak256();
init_toEventSelector();
init_encodeAbiParameters();
init_formatAbiItem2();
init_getAbiItem();
var docsPath = "/docs/contract/encodeEventTopics";
function encodeEventTopics(parameters) {
  const { abi: abi2, eventName, args } = parameters;
  let abiItem = abi2[0];
  if (eventName) {
    const item = getAbiItem({ abi: abi2, name: eventName });
    if (!item)
      throw new AbiEventNotFoundError(eventName, { docsPath });
    abiItem = item;
  }
  if (abiItem.type !== "event")
    throw new AbiEventNotFoundError(void 0, { docsPath });
  let topics = [];
  if (args && "inputs" in abiItem) {
    const indexedInputs = abiItem.inputs?.filter((param) => "indexed" in param && param.indexed);
    const args_ = Array.isArray(args) ? args : Object.values(args).length > 0 ? indexedInputs?.map((x) => args[x.name]) ?? [] : [];
    if (args_.length > 0) {
      topics = indexedInputs?.map((param, i) => {
        if (Array.isArray(args_[i]))
          return args_[i].map((_, j) => encodeArg({ param, value: args_[i][j] }));
        return typeof args_[i] !== "undefined" && args_[i] !== null ? encodeArg({ param, value: args_[i] }) : null;
      }) ?? [];
    }
  }
  if (abiItem.anonymous)
    return topics;
  const definition = formatAbiItem2(abiItem);
  const signature = toEventSelector(definition);
  return [signature, ...topics];
}
function encodeArg({ param, value }) {
  if (param.type === "string" || param.type === "bytes")
    return keccak256(toBytes(value));
  if (param.type === "tuple" || param.type.match(/^(.*)\[(\d+)?\]$/))
    throw new FilterTypeNotSupportedError(param.type);
  return encodeAbiParameters([param], [value]);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createContractEventFilter.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/filters/createFilterRequestScope.js
function createFilterRequestScope(client, { method }) {
  const requestMap = {};
  if (client.transport.type === "fallback")
    client.transport.onResponse?.(({ method: method_, response: id, status, transport }) => {
      if (status === "success" && method === method_)
        requestMap[id] = transport.request;
    });
  return ((id) => requestMap[id] || client.request);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createContractEventFilter.js
async function createContractEventFilter(client, parameters) {
  const { address, abi: abi2, args, eventName, fromBlock, strict, toBlock } = parameters;
  const getRequest = createFilterRequestScope(client, {
    method: "eth_newFilter"
  });
  const topics = eventName ? encodeEventTopics({
    abi: abi2,
    args,
    eventName
  }) : void 0;
  const id = await client.request({
    method: "eth_newFilter",
    params: [
      {
        address,
        fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
        toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock,
        topics
      }
    ]
  });
  return {
    abi: abi2,
    args,
    eventName,
    id,
    request: getRequest(id),
    strict: Boolean(strict),
    type: "event"
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateContractGas.js
init_parseAccount();
init_encodeFunctionData();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getContractError.js
init_abi();
init_base();
init_contract();
init_request();
init_rpc();
var EXECUTION_REVERTED_ERROR_CODE = 3;
function getContractError(err, { abi: abi2, address, args, docsPath: docsPath8, functionName, sender }) {
  const error = err instanceof RawContractError ? err : err instanceof BaseError2 ? err.walk((err2) => "data" in err2) || err.walk() : {};
  const { code, data, details, message, shortMessage } = error;
  const cause = (() => {
    if (err instanceof AbiDecodingZeroDataError)
      return new ContractFunctionZeroDataError({ functionName, cause: err });
    if ([EXECUTION_REVERTED_ERROR_CODE, InternalRpcError.code].includes(code) && (data || details || message || shortMessage) || code === InvalidInputRpcError.code && details === "execution reverted" && data) {
      return new ContractFunctionRevertedError({
        abi: abi2,
        data: typeof data === "object" ? data.data : data,
        functionName,
        message: error instanceof RpcRequestError ? details : shortMessage ?? message,
        cause: err
      });
    }
    return err;
  })();
  return new ContractFunctionExecutionError(cause, {
    abi: abi2,
    args,
    contractAddress: address,
    docsPath: docsPath8,
    functionName,
    sender
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateGas.js
init_parseAccount();
init_base();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/publicKeyToAddress.js
init_getAddress();
init_keccak256();
function publicKeyToAddress(publicKey) {
  const address = keccak256(`0x${publicKey.substring(4)}`).substring(26);
  return checksumAddress(`0x${address}`);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/recoverPublicKey.js
init_isHex();
init_size();
init_fromHex();
init_toHex();
async function recoverPublicKey({ hash: hash3, signature }) {
  const hashHex = isHex(hash3) ? hash3 : toHex(hash3);
  const { secp256k1: secp256k12 } = await Promise.resolve().then(() => (init_secp256k1(), secp256k1_exports));
  const signature_ = (() => {
    if (typeof signature === "object" && "r" in signature && "s" in signature) {
      const { r, s, v, yParity } = signature;
      const yParityOrV2 = Number(yParity ?? v);
      const recoveryBit2 = toRecoveryBit(yParityOrV2);
      return new secp256k12.Signature(hexToBigInt(r), hexToBigInt(s)).addRecoveryBit(recoveryBit2);
    }
    const signatureHex = isHex(signature) ? signature : toHex(signature);
    if (size(signatureHex) !== 65)
      throw new Error("invalid signature length");
    const yParityOrV = hexToNumber(`0x${signatureHex.slice(130)}`);
    const recoveryBit = toRecoveryBit(yParityOrV);
    return secp256k12.Signature.fromCompact(signatureHex.substring(2, 130)).addRecoveryBit(recoveryBit);
  })();
  const publicKey = signature_.recoverPublicKey(hashHex.substring(2)).toHex(false);
  return `0x${publicKey}`;
}
function toRecoveryBit(yParityOrV) {
  if (yParityOrV === 0 || yParityOrV === 1)
    return yParityOrV;
  if (yParityOrV === 27)
    return 0;
  if (yParityOrV === 28)
    return 1;
  throw new Error("Invalid yParityOrV value");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/recoverAddress.js
async function recoverAddress({ hash: hash3, signature }) {
  return publicKeyToAddress(await recoverPublicKey({ hash: hash3, signature }));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/hashAuthorization.js
init_concat();
init_toBytes();
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/toRlp.js
init_base();
init_cursor2();
init_toBytes();
init_toHex();
function toRlp(bytes, to = "hex") {
  const encodable = getEncodable(bytes);
  const cursor = createCursor(new Uint8Array(encodable.length));
  encodable.encode(cursor);
  if (to === "hex")
    return bytesToHex(cursor.bytes);
  return cursor.bytes;
}
function getEncodable(bytes) {
  if (Array.isArray(bytes))
    return getEncodableList(bytes.map((x) => getEncodable(x)));
  return getEncodableBytes(bytes);
}
function getEncodableList(list) {
  const bodyLength = list.reduce((acc, x) => acc + x.length, 0);
  const sizeOfBodyLength = getSizeOfLength(bodyLength);
  const length = (() => {
    if (bodyLength <= 55)
      return 1 + bodyLength;
    return 1 + sizeOfBodyLength + bodyLength;
  })();
  return {
    length,
    encode(cursor) {
      if (bodyLength <= 55) {
        cursor.pushByte(192 + bodyLength);
      } else {
        cursor.pushByte(192 + 55 + sizeOfBodyLength);
        if (sizeOfBodyLength === 1)
          cursor.pushUint8(bodyLength);
        else if (sizeOfBodyLength === 2)
          cursor.pushUint16(bodyLength);
        else if (sizeOfBodyLength === 3)
          cursor.pushUint24(bodyLength);
        else
          cursor.pushUint32(bodyLength);
      }
      for (const { encode: encode4 } of list) {
        encode4(cursor);
      }
    }
  };
}
function getEncodableBytes(bytesOrHex) {
  const bytes = typeof bytesOrHex === "string" ? hexToBytes(bytesOrHex) : bytesOrHex;
  const sizeOfBytesLength = getSizeOfLength(bytes.length);
  const length = (() => {
    if (bytes.length === 1 && bytes[0] < 128)
      return 1;
    if (bytes.length <= 55)
      return 1 + bytes.length;
    return 1 + sizeOfBytesLength + bytes.length;
  })();
  return {
    length,
    encode(cursor) {
      if (bytes.length === 1 && bytes[0] < 128) {
        cursor.pushBytes(bytes);
      } else if (bytes.length <= 55) {
        cursor.pushByte(128 + bytes.length);
        cursor.pushBytes(bytes);
      } else {
        cursor.pushByte(128 + 55 + sizeOfBytesLength);
        if (sizeOfBytesLength === 1)
          cursor.pushUint8(bytes.length);
        else if (sizeOfBytesLength === 2)
          cursor.pushUint16(bytes.length);
        else if (sizeOfBytesLength === 3)
          cursor.pushUint24(bytes.length);
        else
          cursor.pushUint32(bytes.length);
        cursor.pushBytes(bytes);
      }
    }
  };
}
function getSizeOfLength(length) {
  if (length < 2 ** 8)
    return 1;
  if (length < 2 ** 16)
    return 2;
  if (length < 2 ** 24)
    return 3;
  if (length < 2 ** 32)
    return 4;
  throw new BaseError2("Length is too large.");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/hashAuthorization.js
init_keccak256();
function hashAuthorization(parameters) {
  const { chainId, nonce, to } = parameters;
  const address = parameters.contractAddress ?? parameters.address;
  const hash3 = keccak256(concatHex([
    "0x05",
    toRlp([
      chainId ? numberToHex(chainId) : "0x",
      address,
      nonce ? numberToHex(nonce) : "0x"
    ])
  ]));
  if (to === "bytes")
    return hexToBytes(hash3);
  return hash3;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/recoverAuthorizationAddress.js
async function recoverAuthorizationAddress(parameters) {
  const { authorization, signature } = parameters;
  return recoverAddress({
    hash: hashAuthorization(authorization),
    signature: signature ?? authorization
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateGas.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/estimateGas.js
init_formatEther();
init_formatGwei();
init_base();
init_transaction();
var EstimateGasExecutionError = class extends BaseError2 {
  constructor(cause, { account, docsPath: docsPath8, chain, data, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, nonce, to, value }) {
    const prettyArgs = prettyPrint({
      from: account?.address,
      to,
      value: typeof value !== "undefined" && `${formatEther(value)} ${chain?.nativeCurrency?.symbol || "ETH"}`,
      data,
      gas,
      gasPrice: typeof gasPrice !== "undefined" && `${formatGwei(gasPrice)} gwei`,
      maxFeePerGas: typeof maxFeePerGas !== "undefined" && `${formatGwei(maxFeePerGas)} gwei`,
      maxPriorityFeePerGas: typeof maxPriorityFeePerGas !== "undefined" && `${formatGwei(maxPriorityFeePerGas)} gwei`,
      nonce
    });
    super(cause.shortMessage, {
      cause,
      docsPath: docsPath8,
      metaMessages: [
        ...cause.metaMessages ? [...cause.metaMessages, " "] : [],
        "Estimate Gas Arguments:",
        prettyArgs
      ].filter(Boolean),
      name: "EstimateGasExecutionError"
    });
    Object.defineProperty(this, "cause", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.cause = cause;
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getEstimateGasError.js
init_node();
init_getNodeError();
function getEstimateGasError(err, { docsPath: docsPath8, ...args }) {
  const cause = (() => {
    const cause2 = getNodeError(err, args);
    if (cause2 instanceof UnknownNodeError)
      return err;
    return cause2;
  })();
  return new EstimateGasExecutionError(cause, {
    docsPath: docsPath8,
    ...args
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateGas.js
init_extract();
init_transactionRequest();
init_stateOverride2();
init_assertRequest();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js
init_parseAccount();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/fee.js
init_formatGwei();
init_base();
var BaseFeeScalarError = class extends BaseError2 {
  constructor() {
    super("`baseFeeMultiplier` must be greater than 1.", {
      name: "BaseFeeScalarError"
    });
  }
};
var Eip1559FeesNotSupportedError = class extends BaseError2 {
  constructor() {
    super("Chain does not support EIP-1559 fees.", {
      name: "Eip1559FeesNotSupportedError"
    });
  }
};
var MaxFeePerGasTooLowError = class extends BaseError2 {
  constructor({ maxPriorityFeePerGas }) {
    super(`\`maxFeePerGas\` cannot be less than the \`maxPriorityFeePerGas\` (${formatGwei(maxPriorityFeePerGas)} gwei).`, { name: "MaxFeePerGasTooLowError" });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateMaxPriorityFeePerGas.js
init_fromHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/block.js
init_base();
var BlockNotFoundError = class extends BaseError2 {
  constructor({ blockHash, blockNumber }) {
    let identifier = "Block";
    if (blockHash)
      identifier = `Block at hash "${blockHash}"`;
    if (blockNumber)
      identifier = `Block at number "${blockNumber}"`;
    super(`${identifier} could not be found.`, { name: "BlockNotFoundError" });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlock.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/transaction.js
init_fromHex();
var transactionType = {
  "0x0": "legacy",
  "0x1": "eip2930",
  "0x2": "eip1559",
  "0x3": "eip4844",
  "0x4": "eip7702"
};
function formatTransaction(transaction, _) {
  const transaction_ = {
    ...transaction,
    blockHash: transaction.blockHash ? transaction.blockHash : null,
    blockNumber: transaction.blockNumber ? BigInt(transaction.blockNumber) : null,
    ...transaction.blockTimestamp != null && {
      blockTimestamp: BigInt(transaction.blockTimestamp)
    },
    chainId: transaction.chainId ? hexToNumber(transaction.chainId) : void 0,
    gas: transaction.gas ? BigInt(transaction.gas) : void 0,
    gasPrice: transaction.gasPrice ? BigInt(transaction.gasPrice) : void 0,
    maxFeePerBlobGas: transaction.maxFeePerBlobGas ? BigInt(transaction.maxFeePerBlobGas) : void 0,
    maxFeePerGas: transaction.maxFeePerGas ? BigInt(transaction.maxFeePerGas) : void 0,
    maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? BigInt(transaction.maxPriorityFeePerGas) : void 0,
    nonce: transaction.nonce ? hexToNumber(transaction.nonce) : void 0,
    to: transaction.to ? transaction.to : null,
    transactionIndex: transaction.transactionIndex ? Number(transaction.transactionIndex) : null,
    type: transaction.type ? transactionType[transaction.type] : void 0,
    typeHex: transaction.type ? transaction.type : void 0,
    value: transaction.value ? BigInt(transaction.value) : void 0,
    v: transaction.v ? BigInt(transaction.v) : void 0
  };
  if (transaction.authorizationList)
    transaction_.authorizationList = formatAuthorizationList2(transaction.authorizationList);
  transaction_.yParity = (() => {
    if (transaction.yParity)
      return Number(transaction.yParity);
    if (typeof transaction_.v === "bigint") {
      if (transaction_.v === 0n || transaction_.v === 27n)
        return 0;
      if (transaction_.v === 1n || transaction_.v === 28n)
        return 1;
      if (transaction_.v >= 35n)
        return transaction_.v % 2n === 0n ? 1 : 0;
    }
    return void 0;
  })();
  if (transaction_.type === "legacy") {
    delete transaction_.accessList;
    delete transaction_.maxFeePerBlobGas;
    delete transaction_.maxFeePerGas;
    delete transaction_.maxPriorityFeePerGas;
    delete transaction_.yParity;
  }
  if (transaction_.type === "eip2930") {
    delete transaction_.maxFeePerBlobGas;
    delete transaction_.maxFeePerGas;
    delete transaction_.maxPriorityFeePerGas;
  }
  if (transaction_.type === "eip1559")
    delete transaction_.maxFeePerBlobGas;
  return transaction_;
}
function formatAuthorizationList2(authorizationList) {
  return authorizationList.map((authorization) => ({
    address: authorization.address,
    chainId: Number(authorization.chainId),
    nonce: Number(authorization.nonce),
    r: authorization.r,
    s: authorization.s,
    yParity: Number(authorization.yParity)
  }));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/block.js
function formatBlock(block, _) {
  const transactions = (block.transactions ?? []).map((transaction) => {
    if (typeof transaction === "string")
      return transaction;
    return formatTransaction(transaction);
  });
  return {
    ...block,
    baseFeePerGas: block.baseFeePerGas ? BigInt(block.baseFeePerGas) : null,
    blobGasUsed: block.blobGasUsed ? BigInt(block.blobGasUsed) : void 0,
    difficulty: block.difficulty ? BigInt(block.difficulty) : void 0,
    excessBlobGas: block.excessBlobGas ? BigInt(block.excessBlobGas) : void 0,
    gasLimit: block.gasLimit ? BigInt(block.gasLimit) : void 0,
    gasUsed: block.gasUsed ? BigInt(block.gasUsed) : void 0,
    hash: block.hash ? block.hash : null,
    logsBloom: block.logsBloom ? block.logsBloom : null,
    nonce: block.nonce ? block.nonce : null,
    number: block.number ? BigInt(block.number) : null,
    size: block.size ? BigInt(block.size) : void 0,
    timestamp: block.timestamp ? BigInt(block.timestamp) : void 0,
    transactions,
    totalDifficulty: block.totalDifficulty ? BigInt(block.totalDifficulty) : null
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlock.js
async function getBlock(client, { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", includeTransactions: includeTransactions_ } = {}) {
  const includeTransactions = includeTransactions_ ?? false;
  const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
  let block = null;
  if (blockHash) {
    block = await client.request({
      method: "eth_getBlockByHash",
      params: [blockHash, includeTransactions]
    }, { dedupe: true });
  } else {
    block = await client.request({
      method: "eth_getBlockByNumber",
      params: [blockNumberHex || blockTag, includeTransactions]
    }, { dedupe: Boolean(blockNumberHex) });
  }
  if (!block)
    throw new BlockNotFoundError({ blockHash, blockNumber });
  const format = client.chain?.formatters?.block?.format || formatBlock;
  return format(block, "getBlock");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getGasPrice.js
async function getGasPrice(client) {
  const gasPrice = await client.request({
    method: "eth_gasPrice"
  });
  return BigInt(gasPrice);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateMaxPriorityFeePerGas.js
async function estimateMaxPriorityFeePerGas(client, args) {
  return internal_estimateMaxPriorityFeePerGas(client, args);
}
async function internal_estimateMaxPriorityFeePerGas(client, args) {
  const { block: block_, chain = client.chain, request } = args || {};
  try {
    const maxPriorityFeePerGas = chain?.fees?.maxPriorityFeePerGas ?? chain?.fees?.defaultPriorityFee;
    if (typeof maxPriorityFeePerGas === "function") {
      const block = block_ || await getAction(client, getBlock, "getBlock")({});
      const maxPriorityFeePerGas_ = await maxPriorityFeePerGas({
        block,
        client,
        request
      });
      if (maxPriorityFeePerGas_ === null)
        throw new Error();
      return maxPriorityFeePerGas_;
    }
    if (typeof maxPriorityFeePerGas !== "undefined")
      return maxPriorityFeePerGas;
    const maxPriorityFeePerGasHex = await client.request({
      method: "eth_maxPriorityFeePerGas"
    });
    return hexToBigInt(maxPriorityFeePerGasHex);
  } catch {
    const [block, gasPrice] = await Promise.all([
      block_ ? Promise.resolve(block_) : getAction(client, getBlock, "getBlock")({}),
      getAction(client, getGasPrice, "getGasPrice")({})
    ]);
    if (typeof block.baseFeePerGas !== "bigint")
      throw new Eip1559FeesNotSupportedError();
    const maxPriorityFeePerGas = gasPrice - block.baseFeePerGas;
    if (maxPriorityFeePerGas < 0n)
      return 0n;
    return maxPriorityFeePerGas;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateFeesPerGas.js
async function estimateFeesPerGas(client, args) {
  return internal_estimateFeesPerGas(client, args);
}
async function internal_estimateFeesPerGas(client, args) {
  const { block: block_, chain = client.chain, request, type = "eip1559" } = args || {};
  const baseFeeMultiplier = await (async () => {
    if (typeof chain?.fees?.baseFeeMultiplier === "function")
      return chain.fees.baseFeeMultiplier({
        block: block_,
        client,
        request
      });
    return chain?.fees?.baseFeeMultiplier ?? 1.2;
  })();
  if (baseFeeMultiplier < 1)
    throw new BaseFeeScalarError();
  const decimals = baseFeeMultiplier.toString().split(".")[1]?.length ?? 0;
  const denominator = 10 ** decimals;
  const multiply = (base) => base * BigInt(Math.ceil(baseFeeMultiplier * denominator)) / BigInt(denominator);
  const block = block_ ? block_ : await getAction(client, getBlock, "getBlock")({});
  if (typeof chain?.fees?.estimateFeesPerGas === "function") {
    const fees = await chain.fees.estimateFeesPerGas({
      block: block_,
      client,
      multiply,
      request,
      type
    });
    if (fees !== null)
      return fees;
  }
  if (type === "eip1559") {
    if (typeof block.baseFeePerGas !== "bigint")
      throw new Eip1559FeesNotSupportedError();
    const maxPriorityFeePerGas = typeof request?.maxPriorityFeePerGas === "bigint" ? request.maxPriorityFeePerGas : await internal_estimateMaxPriorityFeePerGas(client, {
      block,
      chain,
      request
    });
    const baseFeePerGas = multiply(block.baseFeePerGas);
    const maxFeePerGas = request?.maxFeePerGas ?? baseFeePerGas + maxPriorityFeePerGas;
    return {
      maxFeePerGas,
      maxPriorityFeePerGas
    };
  }
  const gasPrice = request?.gasPrice ?? multiply(await getAction(client, getGasPrice, "getGasPrice")({}));
  return {
    gasPrice
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getTransactionCount.js
init_formatBlockParameter();
init_fromHex();
async function getTransactionCount(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const count = await client.request({
    method: "eth_getTransactionCount",
    params: [address, block]
  }, {
    dedupe: typeof blockNumber === "bigint" || blockHash !== void 0
  });
  return hexToNumber(count);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/blobsToCommitments.js
init_toBytes();
init_toHex();
function blobsToCommitments(parameters) {
  const { kzg } = parameters;
  const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
  const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes(x)) : parameters.blobs;
  const commitments = [];
  for (const blob of blobs)
    commitments.push(Uint8Array.from(kzg.blobToKzgCommitment(blob)));
  return to === "bytes" ? commitments : commitments.map((x) => bytesToHex(x));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/blobsToProofs.js
init_toBytes();
init_toHex();
function blobsToProofs(parameters) {
  const { kzg } = parameters;
  const to = parameters.to ?? (typeof parameters.blobs[0] === "string" ? "hex" : "bytes");
  const blobs = typeof parameters.blobs[0] === "string" ? parameters.blobs.map((x) => hexToBytes(x)) : parameters.blobs;
  const commitments = typeof parameters.commitments[0] === "string" ? parameters.commitments.map((x) => hexToBytes(x)) : parameters.commitments;
  const proofs = [];
  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const commitment = commitments[i];
    proofs.push(Uint8Array.from(kzg.computeBlobKzgProof(blob, commitment)));
  }
  return to === "bytes" ? proofs : proofs.map((x) => bytesToHex(x));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha256.js
init_sha2();
var sha2562 = sha256;

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/sha256.js
init_isHex();
init_toBytes();
init_toHex();
function sha2563(value, to_) {
  const to = to_ || "hex";
  const bytes = sha2562(isHex(value, { strict: false }) ? toBytes(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex(bytes);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/commitmentToVersionedHash.js
function commitmentToVersionedHash(parameters) {
  const { commitment, version: version4 = 1 } = parameters;
  const to = parameters.to ?? (typeof commitment === "string" ? "hex" : "bytes");
  const versionedHash = sha2563(commitment, "bytes");
  versionedHash.set([version4], 0);
  return to === "bytes" ? versionedHash : bytesToHex(versionedHash);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/commitmentsToVersionedHashes.js
function commitmentsToVersionedHashes(parameters) {
  const { commitments, version: version4 } = parameters;
  const to = parameters.to ?? (typeof commitments[0] === "string" ? "hex" : "bytes");
  const hashes = [];
  for (const commitment of commitments) {
    hashes.push(commitmentToVersionedHash({
      commitment,
      to,
      version: version4
    }));
  }
  return hashes;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/blob.js
var blobsPerTransaction = 6;
var bytesPerFieldElement = 32;
var fieldElementsPerBlob = 4096;
var bytesPerBlob = bytesPerFieldElement * fieldElementsPerBlob;
var maxBytesPerTransaction = bytesPerBlob * blobsPerTransaction - // terminator byte (0x80).
1 - // zero byte (0x00) appended to each field element.
1 * fieldElementsPerBlob * blobsPerTransaction;

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/kzg.js
var versionedHashVersionKzg = 1;

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/blob.js
init_base();
var BlobSizeTooLargeError = class extends BaseError2 {
  constructor({ maxSize, size: size5 }) {
    super("Blob size is too large.", {
      metaMessages: [`Max: ${maxSize} bytes`, `Given: ${size5} bytes`],
      name: "BlobSizeTooLargeError"
    });
  }
};
var EmptyBlobError = class extends BaseError2 {
  constructor() {
    super("Blob data must not be empty.", { name: "EmptyBlobError" });
  }
};
var InvalidVersionedHashSizeError = class extends BaseError2 {
  constructor({ hash: hash3, size: size5 }) {
    super(`Versioned hash "${hash3}" size is invalid.`, {
      metaMessages: ["Expected: 32", `Received: ${size5}`],
      name: "InvalidVersionedHashSizeError"
    });
  }
};
var InvalidVersionedHashVersionError = class extends BaseError2 {
  constructor({ hash: hash3, version: version4 }) {
    super(`Versioned hash "${hash3}" version is invalid.`, {
      metaMessages: [
        `Expected: ${versionedHashVersionKzg}`,
        `Received: ${version4}`
      ],
      name: "InvalidVersionedHashVersionError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/toBlobs.js
init_cursor2();
init_size();
init_toBytes();
init_toHex();
function toBlobs(parameters) {
  const to = parameters.to ?? (typeof parameters.data === "string" ? "hex" : "bytes");
  const data = typeof parameters.data === "string" ? hexToBytes(parameters.data) : parameters.data;
  const size_ = size(data);
  if (!size_)
    throw new EmptyBlobError();
  if (size_ > maxBytesPerTransaction)
    throw new BlobSizeTooLargeError({
      maxSize: maxBytesPerTransaction,
      size: size_
    });
  const blobs = [];
  let active = true;
  let position = 0;
  while (active) {
    const blob = createCursor(new Uint8Array(bytesPerBlob));
    let size5 = 0;
    while (size5 < fieldElementsPerBlob) {
      const bytes = data.slice(position, position + (bytesPerFieldElement - 1));
      blob.pushByte(0);
      blob.pushBytes(bytes);
      if (bytes.length < 31) {
        blob.pushByte(128);
        active = false;
        break;
      }
      size5++;
      position += 31;
    }
    blobs.push(blob);
  }
  return to === "bytes" ? blobs.map((x) => x.bytes) : blobs.map((x) => bytesToHex(x.bytes));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/blob/toBlobSidecars.js
function toBlobSidecars(parameters) {
  const { data, kzg, to } = parameters;
  const blobs = parameters.blobs ?? toBlobs({ data, to });
  const commitments = parameters.commitments ?? blobsToCommitments({ blobs, kzg, to });
  const proofs = parameters.proofs ?? blobsToProofs({ blobs, commitments, kzg, to });
  const sidecars = [];
  for (let i = 0; i < blobs.length; i++)
    sidecars.push({
      blob: blobs[i],
      commitment: commitments[i],
      proof: proofs[i]
    });
  return sidecars;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js
init_lru();
init_assertRequest();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/getTransactionType.js
init_transaction();
function getTransactionType(transaction) {
  if (transaction.type)
    return transaction.type;
  if (typeof transaction.authorizationList !== "undefined")
    return "eip7702";
  if (typeof transaction.blobs !== "undefined" || typeof transaction.blobVersionedHashes !== "undefined" || typeof transaction.maxFeePerBlobGas !== "undefined" || typeof transaction.sidecars !== "undefined")
    return "eip4844";
  if (typeof transaction.maxFeePerGas !== "undefined" || typeof transaction.maxPriorityFeePerGas !== "undefined") {
    return "eip1559";
  }
  if (typeof transaction.gasPrice !== "undefined") {
    if (typeof transaction.accessList !== "undefined")
      return "eip2930";
    return "legacy";
  }
  throw new InvalidSerializableTransactionError({ transaction });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/fillTransaction.js
init_parseAccount();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/errors/getTransactionError.js
init_node();
init_transaction();
init_getNodeError();
function getTransactionError(err, { docsPath: docsPath8, ...args }) {
  const cause = (() => {
    const cause2 = getNodeError(err, args);
    if (cause2 instanceof UnknownNodeError)
      return err;
    return cause2;
  })();
  return new TransactionExecutionError(cause, {
    docsPath: docsPath8,
    ...args
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/fillTransaction.js
init_extract();
init_transactionRequest();
init_assertRequest();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getChainId.js
init_fromHex();
async function getChainId(client) {
  const chainIdHex = await client.request({
    method: "eth_chainId"
  }, { dedupe: true });
  return hexToNumber(chainIdHex);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/fillTransaction.js
async function fillTransaction(client, parameters) {
  const { account = client.account, accessList, authorizationList, chain = client.chain, blobVersionedHashes, blobs, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce: nonce_, nonceManager, to, type, value, ...rest } = parameters;
  const nonce = await (async () => {
    if (!account)
      return nonce_;
    if (!nonceManager)
      return nonce_;
    if (typeof nonce_ !== "undefined")
      return nonce_;
    const account_ = parseAccount(account);
    const chainId = chain ? chain.id : await getAction(client, getChainId, "getChainId")({});
    return await nonceManager.consume({
      address: account_.address,
      chainId,
      client
    });
  })();
  assertRequest(parameters);
  const chainFormat = chain?.formatters?.transactionRequest?.format;
  const format = chainFormat || formatTransactionRequest;
  const request = format({
    // Pick out extra data that might exist on the chain's transaction request type.
    ...extract(rest, { format: chainFormat }),
    account: account ? parseAccount(account) : void 0,
    accessList,
    authorizationList,
    blobs,
    blobVersionedHashes,
    data,
    gas,
    gasPrice,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    nonce,
    to,
    type,
    value
  }, "fillTransaction");
  try {
    const response = await client.request({
      method: "eth_fillTransaction",
      params: [request]
    });
    const format2 = chain?.formatters?.transaction?.format || formatTransaction;
    const transaction = format2(response.tx);
    delete transaction.blockHash;
    delete transaction.blockNumber;
    delete transaction.r;
    delete transaction.s;
    delete transaction.transactionIndex;
    delete transaction.v;
    delete transaction.yParity;
    transaction.data = transaction.input;
    if (transaction.gas)
      transaction.gas = parameters.gas ?? transaction.gas;
    if (transaction.gasPrice)
      transaction.gasPrice = parameters.gasPrice ?? transaction.gasPrice;
    if (transaction.maxFeePerBlobGas)
      transaction.maxFeePerBlobGas = parameters.maxFeePerBlobGas ?? transaction.maxFeePerBlobGas;
    if (transaction.maxFeePerGas)
      transaction.maxFeePerGas = parameters.maxFeePerGas ?? transaction.maxFeePerGas;
    if (transaction.maxPriorityFeePerGas)
      transaction.maxPriorityFeePerGas = parameters.maxPriorityFeePerGas ?? transaction.maxPriorityFeePerGas;
    if (typeof transaction.nonce !== "undefined")
      transaction.nonce = parameters.nonce ?? transaction.nonce;
    const feeMultiplier = await (async () => {
      if (typeof chain?.fees?.baseFeeMultiplier === "function") {
        const block = await getAction(client, getBlock, "getBlock")({});
        return chain.fees.baseFeeMultiplier({
          block,
          client,
          request: parameters
        });
      }
      return chain?.fees?.baseFeeMultiplier ?? 1.2;
    })();
    if (feeMultiplier < 1)
      throw new BaseFeeScalarError();
    const decimals = feeMultiplier.toString().split(".")[1]?.length ?? 0;
    const denominator = 10 ** decimals;
    const multiplyFee = (base) => base * BigInt(Math.ceil(feeMultiplier * denominator)) / BigInt(denominator);
    if (!transaction.feePayerSignature) {
      if (transaction.maxFeePerGas && !parameters.maxFeePerGas)
        transaction.maxFeePerGas = multiplyFee(transaction.maxFeePerGas);
      if (transaction.gasPrice && !parameters.gasPrice)
        transaction.gasPrice = multiplyFee(transaction.gasPrice);
    }
    return {
      raw: response.raw,
      transaction: {
        from: request.from,
        ...transaction
      },
      ...response.capabilities ? { capabilities: response.capabilities } : {}
    };
  } catch (err) {
    throw getTransactionError(err, {
      ...parameters,
      chain: client.chain
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/wallet/prepareTransactionRequest.js
var defaultParameters = [
  "blobVersionedHashes",
  "chainId",
  "fees",
  "gas",
  "nonce",
  "type"
];
var eip1559NetworkCache = /* @__PURE__ */ new Map();
var supportsFillTransaction = /* @__PURE__ */ new LruMap(128);
async function prepareTransactionRequest(client, args) {
  let request = args;
  request.account ??= client.account;
  request.parameters ??= defaultParameters;
  const { account: account_, chain = client.chain, nonceManager, parameters } = request;
  const prepareTransactionRequest2 = (() => {
    if (typeof chain?.prepareTransactionRequest === "function")
      return {
        fn: chain.prepareTransactionRequest,
        runAt: ["beforeFillTransaction"]
      };
    if (Array.isArray(chain?.prepareTransactionRequest))
      return {
        fn: chain.prepareTransactionRequest[0],
        runAt: chain.prepareTransactionRequest[1].runAt
      };
    return void 0;
  })();
  let chainId;
  async function getChainId2() {
    if (chainId)
      return chainId;
    if (typeof request.chainId !== "undefined")
      return request.chainId;
    if (chain)
      return chain.id;
    const chainId_ = await getAction(client, getChainId, "getChainId")({});
    chainId = chainId_;
    return chainId;
  }
  const account = account_ ? parseAccount(account_) : account_;
  let nonce = request.nonce;
  if (parameters.includes("nonce") && typeof nonce === "undefined" && account && nonceManager) {
    const chainId2 = await getChainId2();
    nonce = await nonceManager.consume({
      address: account.address,
      chainId: chainId2,
      client
    });
  }
  if (prepareTransactionRequest2?.fn && prepareTransactionRequest2.runAt?.includes("beforeFillTransaction")) {
    request = await prepareTransactionRequest2.fn({ ...request, chain }, {
      client,
      phase: "beforeFillTransaction"
    });
    nonce ??= request.nonce;
  }
  const attemptFill = (() => {
    if ((parameters.includes("blobVersionedHashes") || parameters.includes("sidecars")) && request.kzg && request.blobs)
      return false;
    if (supportsFillTransaction.get(client.uid) === false)
      return false;
    const shouldAttempt = ["fees", "gas"].some((parameter) => parameters.includes(parameter));
    if (!shouldAttempt)
      return false;
    if (parameters.includes("chainId") && typeof request.chainId !== "number")
      return true;
    if (parameters.includes("nonce") && typeof nonce !== "number")
      return true;
    if (parameters.includes("fees") && typeof request.gasPrice !== "bigint" && (typeof request.maxFeePerGas !== "bigint" || typeof request.maxPriorityFeePerGas !== "bigint"))
      return true;
    if (parameters.includes("gas") && typeof request.gas !== "bigint")
      return true;
    return false;
  })();
  const fillResult = attemptFill ? await getAction(client, fillTransaction, "fillTransaction")({ ...request, nonce }).then((result) => {
    const { chainId: chainId2, from: from14, gas: gas2, gasPrice, nonce: nonce2, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, type: type2, ...rest } = result.transaction;
    const feeToken = "feeToken" in rest ? rest.feeToken : void 0;
    const hasFilledFeePayerSignature = "feePayerSignature" in rest && rest.feePayerSignature !== null && typeof rest.feePayerSignature !== "undefined";
    const shouldUseFilledFeeToken = typeof feeToken !== "undefined" && feeToken !== null && (!("feeToken" in request) || hasFilledFeePayerSignature);
    supportsFillTransaction.set(client.uid, true);
    return {
      ...request,
      ...from14 ? { from: from14 } : {},
      ...type2 && !request.type ? { type: type2 } : {},
      ...typeof chainId2 !== "undefined" ? { chainId: chainId2 } : {},
      ...typeof gas2 !== "undefined" ? { gas: gas2 } : {},
      ...typeof gasPrice !== "undefined" ? { gasPrice } : {},
      ...typeof nonce2 !== "undefined" ? { nonce: nonce2 } : {},
      ...typeof maxFeePerBlobGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxFeePerBlobGas } : {},
      ...typeof maxFeePerGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxFeePerGas } : {},
      ...typeof maxPriorityFeePerGas !== "undefined" && request.type !== "legacy" && request.type !== "eip2930" ? { maxPriorityFeePerGas } : {},
      ..."nonceKey" in rest && typeof rest.nonceKey !== "undefined" ? { nonceKey: rest.nonceKey } : {},
      ..."keyAuthorization" in rest && typeof rest.keyAuthorization !== "undefined" && rest.keyAuthorization !== null && !("keyAuthorization" in request) ? { keyAuthorization: rest.keyAuthorization } : {},
      ..."feePayerSignature" in rest && typeof rest.feePayerSignature !== "undefined" && rest.feePayerSignature !== null ? { feePayerSignature: rest.feePayerSignature } : {},
      ...shouldUseFilledFeeToken ? { feeToken } : {},
      ...result.capabilities ? { _capabilities: result.capabilities } : {}
    };
  }).catch((e) => {
    const error = e;
    if (error.name !== "TransactionExecutionError")
      return request;
    const executionReverted = error.walk?.((e2) => {
      const error2 = e2;
      return error2.name === "ExecutionRevertedError";
    });
    if (executionReverted)
      throw e;
    const unsupported = error.walk?.((e2) => {
      const error2 = e2;
      return error2.name === "MethodNotFoundRpcError" || error2.name === "MethodNotSupportedRpcError" || error2.message?.includes("eth_fillTransaction is not available");
    });
    if (unsupported)
      supportsFillTransaction.set(client.uid, false);
    return request;
  }) : request;
  nonce ??= fillResult.nonce;
  request = {
    ...fillResult,
    ...account ? { from: account?.address } : {},
    ...typeof nonce !== "undefined" ? { nonce } : {}
  };
  const { blobs, gas, kzg, type } = request;
  if (prepareTransactionRequest2?.fn && prepareTransactionRequest2.runAt?.includes("beforeFillParameters")) {
    request = await prepareTransactionRequest2.fn({ ...request, chain }, {
      client,
      phase: "beforeFillParameters"
    });
  }
  let block;
  async function getBlock2() {
    if (block)
      return block;
    block = await getAction(client, getBlock, "getBlock")({ blockTag: "latest" });
    return block;
  }
  if (parameters.includes("nonce") && typeof nonce === "undefined" && account && !nonceManager)
    request.nonce = await getAction(client, getTransactionCount, "getTransactionCount")({
      address: account.address,
      blockTag: "pending"
    });
  if ((parameters.includes("blobVersionedHashes") || parameters.includes("sidecars")) && blobs && kzg) {
    const commitments = blobsToCommitments({ blobs, kzg });
    if (parameters.includes("blobVersionedHashes")) {
      const versionedHashes = commitmentsToVersionedHashes({
        commitments,
        to: "hex"
      });
      request.blobVersionedHashes = versionedHashes;
    }
    if (parameters.includes("sidecars")) {
      const proofs = blobsToProofs({ blobs, commitments, kzg });
      const sidecars = toBlobSidecars({
        blobs,
        commitments,
        proofs,
        to: "hex"
      });
      request.sidecars = sidecars;
    }
  }
  if (parameters.includes("chainId"))
    request.chainId = await getChainId2();
  if ((parameters.includes("fees") || parameters.includes("type")) && typeof type === "undefined") {
    try {
      request.type = getTransactionType(request);
    } catch {
      let isEip1559Network = eip1559NetworkCache.get(client.uid);
      if (typeof isEip1559Network === "undefined") {
        const block2 = await getBlock2();
        isEip1559Network = typeof block2?.baseFeePerGas === "bigint";
        eip1559NetworkCache.set(client.uid, isEip1559Network);
      }
      request.type = isEip1559Network ? "eip1559" : "legacy";
    }
  }
  if (parameters.includes("fees")) {
    if (request.type !== "legacy" && request.type !== "eip2930") {
      if (typeof request.maxFeePerGas === "undefined" || typeof request.maxPriorityFeePerGas === "undefined") {
        const block2 = await getBlock2();
        const { maxFeePerGas, maxPriorityFeePerGas } = await internal_estimateFeesPerGas(client, {
          block: block2,
          chain,
          request
        });
        if (typeof request.maxPriorityFeePerGas === "undefined" && request.maxFeePerGas && request.maxFeePerGas < maxPriorityFeePerGas)
          throw new MaxFeePerGasTooLowError({
            maxPriorityFeePerGas
          });
        request.maxPriorityFeePerGas = maxPriorityFeePerGas;
        request.maxFeePerGas = maxFeePerGas;
      }
    } else {
      if (typeof request.maxFeePerGas !== "undefined" || typeof request.maxPriorityFeePerGas !== "undefined")
        throw new Eip1559FeesNotSupportedError();
      if (typeof request.gasPrice === "undefined") {
        const block2 = await getBlock2();
        const { gasPrice: gasPrice_ } = await internal_estimateFeesPerGas(client, {
          block: block2,
          chain,
          request,
          type: "legacy"
        });
        request.gasPrice = gasPrice_;
      }
    }
  }
  if (parameters.includes("gas") && typeof gas === "undefined")
    request.gas = await getAction(client, estimateGas, "estimateGas")({
      ...request,
      account,
      prepare: account?.type === "local" ? [] : ["blobVersionedHashes"]
    });
  if (prepareTransactionRequest2?.fn && prepareTransactionRequest2.runAt?.includes("afterFillParameters"))
    request = await prepareTransactionRequest2.fn({ ...request, chain }, {
      client,
      phase: "afterFillParameters"
    });
  assertRequest(request);
  delete request.parameters;
  return request;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateGas.js
async function estimateGas(client, args) {
  const { account: account_ = client.account, prepare = true } = args;
  const account = account_ ? parseAccount(account_) : void 0;
  const parameters = (() => {
    if (Array.isArray(prepare))
      return prepare;
    if (account?.type !== "local")
      return ["blobVersionedHashes"];
    return void 0;
  })();
  try {
    const to = await (async () => {
      if (args.to)
        return args.to;
      if (args.authorizationList && args.authorizationList.length > 0)
        return await recoverAuthorizationAddress({
          authorization: args.authorizationList[0]
        }).catch(() => {
          throw new BaseError2("`to` is required. Could not infer from `authorizationList`");
        });
      return void 0;
    })();
    const { accessList, authorizationList, blobs, blobVersionedHashes, blockNumber, blockTag, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, nonce, value, stateOverride, ...rest } = prepare ? await prepareTransactionRequest(client, {
      ...args,
      parameters,
      to
    }) : args;
    if (gas && args.gas !== gas)
      return gas;
    const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0;
    const block = blockNumberHex || blockTag;
    const rpcStateOverride = serializeStateOverride(stateOverride);
    assertRequest(args);
    const chainFormat = client.chain?.formatters?.transactionRequest?.format;
    const format = chainFormat || formatTransactionRequest;
    const request = format({
      // Pick out extra data that might exist on the chain's transaction request type.
      ...extract(rest, { format: chainFormat }),
      account,
      accessList,
      authorizationList,
      blobs,
      blobVersionedHashes,
      data,
      gasPrice,
      maxFeePerBlobGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      to,
      value
    }, "estimateGas");
    return BigInt(await client.request({
      method: "eth_estimateGas",
      params: rpcStateOverride ? [
        request,
        block ?? client.experimental_blockTag ?? "latest",
        rpcStateOverride
      ] : block ? [request, block] : [request]
    }));
  } catch (err) {
    throw getEstimateGasError(err, {
      ...args,
      account,
      chain: client.chain
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/estimateContractGas.js
async function estimateContractGas(client, parameters) {
  const { abi: abi2, address, args, functionName, dataSuffix = typeof client.dataSuffix === "string" ? client.dataSuffix : client.dataSuffix?.value, ...request } = parameters;
  const data = encodeFunctionData({
    abi: abi2,
    args,
    functionName
  });
  try {
    const gas = await getAction(client, estimateGas, "estimateGas")({
      data: `${data}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
      to: address,
      ...request
    });
    return gas;
  } catch (error) {
    const account = request.account ? parseAccount(request.account) : void 0;
    throw getContractError(error, {
      abi: abi2,
      address,
      args,
      docsPath: "/docs/contract/estimateContractGas",
      functionName,
      sender: account?.address
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getContractEvents.js
init_getAbiItem();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/parseEventLogs.js
init_isAddressEqual();
init_toBytes();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/log.js
function formatLog(log, { args, eventName } = {}) {
  return {
    ...log,
    blockHash: log.blockHash ? log.blockHash : null,
    blockNumber: log.blockNumber ? BigInt(log.blockNumber) : null,
    blockTimestamp: log.blockTimestamp ? BigInt(log.blockTimestamp) : log.blockTimestamp === null ? null : void 0,
    logIndex: log.logIndex ? Number(log.logIndex) : null,
    transactionHash: log.transactionHash ? log.transactionHash : null,
    transactionIndex: log.transactionIndex ? Number(log.transactionIndex) : null,
    ...eventName ? { args, eventName } : {}
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/parseEventLogs.js
init_keccak256();
init_toEventSelector();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/decodeEventLog.js
init_abi();
init_cursor();
init_size();
init_toEventSelector();
init_decodeAbiParameters();
init_formatAbiItem2();
var docsPath3 = "/docs/contract/decodeEventLog";
function decodeEventLog(parameters) {
  const { abi: abi2, data, strict: strict_, topics } = parameters;
  const strict = strict_ ?? true;
  const [signature, ...argTopics] = topics;
  if (!signature)
    throw new AbiEventSignatureEmptyTopicsError({ docsPath: docsPath3 });
  const abiItem = abi2.find((x) => x.type === "event" && signature === toEventSelector(formatAbiItem2(x)));
  if (!(abiItem && "name" in abiItem) || abiItem.type !== "event")
    throw new AbiEventSignatureNotFoundError(signature, { docsPath: docsPath3 });
  const { name, inputs } = abiItem;
  const isUnnamed = inputs?.some((x) => !("name" in x && x.name));
  const args = isUnnamed ? [] : {};
  const indexedInputs = inputs.map((x, i) => [x, i]).filter(([x]) => "indexed" in x && x.indexed);
  const missingIndexedInputs = [];
  for (let i = 0; i < indexedInputs.length; i++) {
    const [param, argIndex] = indexedInputs[i];
    const topic = argTopics[i];
    if (!topic) {
      if (strict)
        throw new DecodeLogTopicsMismatch({
          abiItem,
          param
        });
      missingIndexedInputs.push([param, argIndex]);
      continue;
    }
    args[isUnnamed ? argIndex : param.name || argIndex] = decodeTopic({
      param,
      value: topic
    });
  }
  const nonIndexedInputs = inputs.filter((x) => !("indexed" in x && x.indexed));
  const inputsToDecode = strict ? nonIndexedInputs : [...missingIndexedInputs.map(([param]) => param), ...nonIndexedInputs];
  if (inputsToDecode.length > 0) {
    if (data && data !== "0x") {
      try {
        const decodedData = decodeAbiParameters(inputsToDecode, data);
        if (decodedData) {
          let dataIndex = 0;
          if (!strict) {
            for (const [param, argIndex] of missingIndexedInputs) {
              args[isUnnamed ? argIndex : param.name || argIndex] = decodedData[dataIndex++];
            }
          }
          if (isUnnamed) {
            for (let i = 0; i < inputs.length; i++)
              if (args[i] === void 0 && dataIndex < decodedData.length)
                args[i] = decodedData[dataIndex++];
          } else
            for (let i = 0; i < nonIndexedInputs.length; i++)
              args[nonIndexedInputs[i].name] = decodedData[dataIndex++];
        }
      } catch (err) {
        if (strict) {
          if (err instanceof AbiDecodingDataSizeTooSmallError || err instanceof PositionOutOfBoundsError)
            throw new DecodeLogDataMismatch({
              abiItem,
              data,
              params: inputsToDecode,
              size: size(data)
            });
          throw err;
        }
      }
    } else if (strict) {
      throw new DecodeLogDataMismatch({
        abiItem,
        data: "0x",
        params: inputsToDecode,
        size: 0
      });
    }
  }
  return {
    eventName: name,
    args: Object.values(args).length > 0 ? args : void 0
  };
}
function decodeTopic({ param, value }) {
  if (param.type === "string" || param.type === "bytes" || param.type === "tuple" || param.type.match(/^(.*)\[(\d+)?\]$/))
    return value;
  const decodedArg = decodeAbiParameters([param], value) || [];
  return decodedArg[0];
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/abi/parseEventLogs.js
function parseEventLogs(parameters) {
  const { abi: abi2, args, logs, strict = true } = parameters;
  const eventName = (() => {
    if (!parameters.eventName)
      return void 0;
    if (Array.isArray(parameters.eventName))
      return parameters.eventName;
    return [parameters.eventName];
  })();
  const abiTopics = abi2.filter((abiItem) => abiItem.type === "event").map((abiItem) => ({
    abi: abiItem,
    selector: toEventSelector(abiItem)
  }));
  return logs.map((log) => {
    const formattedLog = typeof log.blockNumber === "string" ? formatLog(log) : log;
    const abiItems = abiTopics.filter((abiTopic) => formattedLog.topics[0] === abiTopic.selector);
    if (abiItems.length === 0)
      return null;
    let event;
    let abiItem;
    for (const item of abiItems) {
      try {
        event = decodeEventLog({
          ...formattedLog,
          abi: [item.abi],
          strict: true
        });
        abiItem = item;
        break;
      } catch {
      }
    }
    if (!event && !strict) {
      abiItem = abiItems[0];
      try {
        event = decodeEventLog({
          data: formattedLog.data,
          topics: formattedLog.topics,
          abi: [abiItem.abi],
          strict: false
        });
      } catch {
        const isUnnamed = abiItem.abi.inputs?.some((x) => !("name" in x && x.name));
        return {
          ...formattedLog,
          args: isUnnamed ? [] : {},
          eventName: abiItem.abi.name
        };
      }
    }
    if (!event || !abiItem)
      return null;
    if (eventName && !eventName.includes(event.eventName))
      return null;
    if (!includesArgs({
      args: event.args,
      inputs: abiItem.abi.inputs,
      matchArgs: args
    }))
      return null;
    return { ...event, ...formattedLog };
  }).filter(Boolean);
}
function includesArgs(parameters) {
  const { args, inputs, matchArgs } = parameters;
  if (!matchArgs)
    return true;
  if (!args)
    return false;
  function isEqual2(input, value, arg) {
    try {
      if (input.type === "address")
        return isAddressEqual(value, arg);
      if (input.type === "string" || input.type === "bytes")
        return keccak256(toBytes(value)) === arg;
      return value === arg;
    } catch {
      return false;
    }
  }
  if (Array.isArray(args) && Array.isArray(matchArgs)) {
    return matchArgs.every((value, index2) => {
      if (value === null || value === void 0)
        return true;
      const input = inputs[index2];
      if (!input)
        return false;
      const value_ = Array.isArray(value) ? value : [value];
      return value_.some((value2) => isEqual2(input, value2, args[index2]));
    });
  }
  if (typeof args === "object" && !Array.isArray(args) && typeof matchArgs === "object" && !Array.isArray(matchArgs))
    return Object.entries(matchArgs).every(([key, value]) => {
      if (value === null || value === void 0)
        return true;
      const input = inputs.find((input2) => input2.name === key);
      if (!input)
        return false;
      const value_ = Array.isArray(value) ? value : [value];
      return value_.some((value2) => isEqual2(input, value2, args[key]));
    });
  return false;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getLogs.js
init_toHex();
async function getLogs(client, { address, blockHash, fromBlock, toBlock, event, events: events_, args, strict: strict_ } = {}) {
  const strict = strict_ ?? false;
  const events = events_ ?? (event ? [event] : void 0);
  let topics = [];
  if (events) {
    const encoded = events.flatMap((event2) => encodeEventTopics({
      abi: [event2],
      eventName: event2.name,
      args: events_ ? void 0 : args
    }));
    topics = [encoded];
    if (event)
      topics = topics[0];
  }
  let logs;
  if (blockHash) {
    logs = await client.request({
      method: "eth_getLogs",
      params: [{ address, topics, blockHash }]
    });
  } else {
    logs = await client.request({
      method: "eth_getLogs",
      params: [
        {
          address,
          topics,
          fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
          toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock
        }
      ]
    });
  }
  const formattedLogs = logs.map((log) => formatLog(log));
  if (!events)
    return formattedLogs;
  return parseEventLogs({
    abi: events,
    args,
    logs: formattedLogs,
    strict
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getContractEvents.js
async function getContractEvents(client, parameters) {
  const { abi: abi2, address, args, blockHash, eventName, fromBlock, toBlock, strict } = parameters;
  const event = eventName ? getAbiItem({ abi: abi2, name: eventName }) : void 0;
  const events = !event ? abi2.filter((x) => x.type === "event") : void 0;
  return getAction(client, getLogs, "getLogs")({
    address,
    args,
    blockHash,
    event,
    events,
    fromBlock,
    toBlock,
    strict
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/readContract.js
init_decodeFunctionResult();
init_encodeFunctionData();
init_call();
async function readContract(client, parameters) {
  const { abi: abi2, address, args, functionName, ...rest } = parameters;
  const calldata = encodeFunctionData({
    abi: abi2,
    args,
    functionName
  });
  try {
    const { data } = await getAction(client, call, "call")({
      ...rest,
      data: calldata,
      to: address
    });
    return decodeFunctionResult({
      abi: abi2,
      args,
      functionName,
      data: data || "0x"
    });
  } catch (error) {
    throw getContractError(error, {
      abi: abi2,
      address,
      args,
      docsPath: "/docs/contract/readContract",
      functionName
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/simulateContract.js
init_parseAccount();
init_decodeFunctionResult();
init_encodeFunctionData();
init_call();
async function simulateContract(client, parameters) {
  const { abi: abi2, address, args, functionName, dataSuffix = typeof client.dataSuffix === "string" ? client.dataSuffix : client.dataSuffix?.value, ...callRequest } = parameters;
  const account = callRequest.account ? parseAccount(callRequest.account) : client.account;
  const calldata = encodeFunctionData({ abi: abi2, args, functionName });
  try {
    const { data } = await getAction(client, call, "call")({
      batch: false,
      data: `${calldata}${dataSuffix ? dataSuffix.replace("0x", "") : ""}`,
      to: address,
      ...callRequest,
      account
    });
    const result = decodeFunctionResult({
      abi: abi2,
      args,
      functionName,
      data: data || "0x"
    });
    const minimizedAbi = abi2.filter((abiItem) => "name" in abiItem && abiItem.name === parameters.functionName);
    return {
      result,
      request: {
        abi: minimizedAbi,
        address,
        args,
        dataSuffix,
        functionName,
        ...callRequest,
        account
      }
    };
  } catch (error) {
    throw getContractError(error, {
      abi: abi2,
      address,
      args,
      docsPath: "/docs/contract/simulateContract",
      functionName,
      sender: account?.address
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchContractEvent.js
init_abi();
init_rpc();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/observe.js
var listenersCache = /* @__PURE__ */ new Map();
var cleanupCache = /* @__PURE__ */ new Map();
var callbackCount = 0;
function observe(observerId, callbacks, fn) {
  const callbackId = ++callbackCount;
  const getListeners = () => listenersCache.get(observerId) || [];
  const unsubscribe = () => {
    const listeners2 = getListeners();
    const nextListeners = listeners2.filter((cb) => cb.id !== callbackId);
    if (nextListeners.length === 0) {
      listenersCache.delete(observerId);
      cleanupCache.delete(observerId);
      return;
    }
    listenersCache.set(observerId, nextListeners);
  };
  const unwatch = () => {
    const listeners2 = getListeners();
    if (!listeners2.some((cb) => cb.id === callbackId))
      return;
    const cleanup2 = cleanupCache.get(observerId);
    if (listeners2.length === 1 && cleanup2) {
      const p = cleanup2();
      if (p instanceof Promise)
        p.catch(() => {
        });
    }
    unsubscribe();
  };
  const listeners = getListeners();
  listenersCache.set(observerId, [
    ...listeners,
    { id: callbackId, fns: callbacks }
  ]);
  if (listeners && listeners.length > 0)
    return unwatch;
  const emit = {};
  for (const key in callbacks) {
    emit[key] = ((...args) => {
      const listeners2 = getListeners();
      if (listeners2.length === 0)
        return;
      for (const listener of listeners2)
        listener.fns[key]?.(...args);
    });
  }
  const cleanup = fn(emit);
  if (typeof cleanup === "function")
    cleanupCache.set(observerId, cleanup);
  return unwatch;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/wait.js
init_utils3();
async function wait(time, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(getAbortError(signal));
      return;
    }
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, time);
    const onAbort = () => {
      clearTimeout(timeout);
      cleanup();
      reject(getAbortError(signal));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/poll.js
function poll(fn, { emitOnBegin, initialWaitTime, interval }) {
  let active = true;
  const unwatch = () => active = false;
  const watch = async () => {
    let data;
    if (emitOnBegin)
      data = await fn({ unpoll: unwatch });
    const initialWait = await initialWaitTime?.(data) ?? interval;
    await wait(initialWait);
    const poll2 = async () => {
      if (!active)
        return;
      await fn({ unpoll: unwatch });
      await wait(interval);
      poll2();
    };
    poll2();
  };
  watch();
  return unwatch;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchContractEvent.js
init_stringify();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withCache.js
var promiseCache = /* @__PURE__ */ new Map();
var responseCache = /* @__PURE__ */ new Map();
function getCache(cacheKey2) {
  const buildCache = (cacheKey3, cache) => ({
    clear: () => cache.delete(cacheKey3),
    get: () => cache.get(cacheKey3),
    set: (data) => cache.set(cacheKey3, data)
  });
  const promise = buildCache(cacheKey2, promiseCache);
  const response = buildCache(cacheKey2, responseCache);
  return {
    clear: () => {
      promise.clear();
      response.clear();
    },
    promise,
    response
  };
}
async function withCache(fn, { cacheKey: cacheKey2, cacheTime = Number.POSITIVE_INFINITY }) {
  const cache = getCache(cacheKey2);
  const response = cache.response.get();
  if (response && cacheTime > 0) {
    const age = Date.now() - response.created.getTime();
    if (age < cacheTime)
      return response.data;
  }
  let promise = cache.promise.get();
  if (!promise) {
    promise = fn();
    cache.promise.set(promise);
  }
  try {
    const data = await promise;
    cache.response.set({ created: /* @__PURE__ */ new Date(), data });
    return data;
  } finally {
    cache.promise.clear();
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlockNumber.js
var cacheKey = (id) => `blockNumber.${id}`;
async function getBlockNumber(client, { cacheTime = client.cacheTime } = {}) {
  const blockNumberHex = await withCache(() => client.request({
    method: "eth_blockNumber"
  }), { cacheKey: cacheKey(client.uid), cacheTime });
  return BigInt(blockNumberHex);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getFilterChanges.js
async function getFilterChanges(_client, { filter }) {
  const strict = "strict" in filter && filter.strict;
  const logs = await filter.request({
    method: "eth_getFilterChanges",
    params: [filter.id]
  });
  if (typeof logs[0] === "string")
    return logs;
  const formattedLogs = logs.map((log) => formatLog(log));
  if (!("abi" in filter) || !filter.abi)
    return formattedLogs;
  return parseEventLogs({
    abi: filter.abi,
    logs: formattedLogs,
    strict
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/uninstallFilter.js
async function uninstallFilter(_client, { filter }) {
  return filter.request({
    method: "eth_uninstallFilter",
    params: [filter.id]
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchContractEvent.js
function watchContractEvent(client, parameters) {
  const { abi: abi2, address, args, batch = true, eventName, fromBlock, onError, onLogs, poll: poll_, pollingInterval = client.pollingInterval, strict: strict_ } = parameters;
  const enablePolling = (() => {
    if (typeof poll_ !== "undefined")
      return poll_;
    if (typeof fromBlock === "bigint")
      return true;
    if (client.transport.type === "webSocket" || client.transport.type === "ipc")
      return false;
    if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc"))
      return false;
    return true;
  })();
  const pollContractEvent = () => {
    const strict = strict_ ?? false;
    const observerId = stringify([
      "watchContractEvent",
      address,
      args,
      batch,
      client.uid,
      eventName,
      pollingInterval,
      strict,
      fromBlock
    ]);
    return observe(observerId, { onLogs, onError }, (emit) => {
      let previousBlockNumber;
      if (fromBlock !== void 0)
        previousBlockNumber = fromBlock - 1n;
      let filter;
      let initialized = false;
      const unwatch = poll(async () => {
        if (!initialized) {
          try {
            filter = await getAction(client, createContractEventFilter, "createContractEventFilter")({
              abi: abi2,
              address,
              args,
              eventName,
              strict,
              fromBlock
            });
          } catch {
          }
          initialized = true;
          return;
        }
        try {
          let logs;
          if (filter) {
            logs = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
          } else {
            const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({});
            if (previousBlockNumber && previousBlockNumber < blockNumber) {
              logs = await getAction(client, getContractEvents, "getContractEvents")({
                abi: abi2,
                address,
                args,
                eventName,
                fromBlock: previousBlockNumber + 1n,
                toBlock: blockNumber,
                strict
              });
            } else {
              logs = [];
            }
            previousBlockNumber = blockNumber;
          }
          if (logs.length === 0)
            return;
          if (batch)
            emit.onLogs(logs);
          else
            for (const log of logs)
              emit.onLogs([log]);
        } catch (err) {
          if (filter && err instanceof InvalidInputRpcError)
            initialized = false;
          emit.onError?.(err);
        }
      }, {
        emitOnBegin: true,
        interval: pollingInterval
      });
      return async () => {
        if (filter)
          await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
        unwatch();
      };
    });
  };
  const subscribeContractEvent = () => {
    const strict = strict_ ?? false;
    const observerId = stringify([
      "watchContractEvent",
      address,
      args,
      batch,
      client.uid,
      eventName,
      pollingInterval,
      strict
    ]);
    let active = true;
    let unsubscribe = () => active = false;
    return observe(observerId, { onLogs, onError }, (emit) => {
      ;
      (async () => {
        try {
          const transport = (() => {
            if (client.transport.type === "fallback") {
              const transport2 = client.transport.transports.find((transport3) => transport3.config.type === "webSocket" || transport3.config.type === "ipc");
              if (!transport2)
                return client.transport;
              return transport2.value;
            }
            return client.transport;
          })();
          const topics = eventName ? encodeEventTopics({
            abi: abi2,
            eventName,
            args
          }) : [];
          const { unsubscribe: unsubscribe_ } = await transport.subscribe({
            params: ["logs", { address, topics }],
            onData(data) {
              if (!active)
                return;
              const log = data.result;
              try {
                const { eventName: eventName2, args: args2 } = decodeEventLog({
                  abi: abi2,
                  data: log.data,
                  topics: log.topics,
                  strict: strict_
                });
                const formatted = formatLog(log, {
                  args: args2,
                  eventName: eventName2
                });
                emit.onLogs([formatted]);
              } catch (err) {
                let eventName2;
                let isUnnamed;
                if (err instanceof DecodeLogDataMismatch || err instanceof DecodeLogTopicsMismatch) {
                  if (strict_)
                    return;
                  eventName2 = err.abiItem.name;
                  isUnnamed = err.abiItem.inputs?.some((x) => !("name" in x && x.name));
                }
                const formatted = formatLog(log, {
                  args: isUnnamed ? [] : {},
                  eventName: eventName2
                });
                emit.onLogs([formatted]);
              }
            },
            onError(error) {
              emit.onError?.(error);
            }
          });
          unsubscribe = unsubscribe_;
          if (!active)
            unsubscribe();
        } catch (err) {
          onError?.(err);
        }
      })();
      return () => unsubscribe();
    });
  };
  return enablePolling ? pollContractEvent() : subscribeContractEvent();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/account.js
init_base();
var AccountNotFoundError = class extends BaseError2 {
  constructor({ docsPath: docsPath8 } = {}) {
    super([
      "Could not find an Account to execute with this Action.",
      "Please provide an Account with the `account` argument on the Action, or by supplying an `account` to the Client."
    ].join("\n"), {
      docsPath: docsPath8,
      docsSlug: "account",
      name: "AccountNotFoundError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/wallet/sendRawTransaction.js
async function sendRawTransaction(client, { serializedTransaction }) {
  return client.request({
    method: "eth_sendRawTransaction",
    params: [serializedTransaction]
  }, { retryCount: 0 });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withRetry.js
init_utils3();
function withRetry(fn, { delay: delay_ = 100, retryCount = 2, shouldRetry: shouldRetry2 = () => true, signal } = {}) {
  return new Promise((resolve, reject) => {
    const attemptRetry = async ({ count = 0 } = {}) => {
      if (signal?.aborted) {
        reject(getAbortError(signal));
        return;
      }
      const retry = async ({ error }) => {
        const delay = typeof delay_ === "function" ? delay_({ count, error }) : delay_;
        if (delay) {
          try {
            await wait(delay, { signal });
          } catch (err) {
            reject(err);
            return;
          }
        }
        attemptRetry({ count: count + 1 });
      };
      try {
        const data = await fn();
        resolve(data);
      } catch (err) {
        if (signal?.aborted) {
          reject(getAbortError(signal));
          return;
        }
        if (isAbortError(err)) {
          reject(err);
          return;
        }
        if (count < retryCount && await shouldRetry2({ count, error: err }))
          return retry({ error: err });
        reject(err);
      }
    };
    attemptRetry();
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/transactionReceipt.js
init_fromHex();
var receiptStatuses = {
  "0x0": "reverted",
  "0x1": "success"
};
function formatTransactionReceipt(transactionReceipt, _) {
  const receipt = {
    ...transactionReceipt,
    blockNumber: transactionReceipt.blockNumber ? BigInt(transactionReceipt.blockNumber) : null,
    contractAddress: transactionReceipt.contractAddress ? transactionReceipt.contractAddress : null,
    cumulativeGasUsed: transactionReceipt.cumulativeGasUsed ? BigInt(transactionReceipt.cumulativeGasUsed) : null,
    effectiveGasPrice: transactionReceipt.effectiveGasPrice ? BigInt(transactionReceipt.effectiveGasPrice) : null,
    gasUsed: transactionReceipt.gasUsed ? BigInt(transactionReceipt.gasUsed) : null,
    logs: transactionReceipt.logs ? transactionReceipt.logs.map((log) => formatLog(log)) : null,
    to: transactionReceipt.to ? transactionReceipt.to : null,
    transactionIndex: transactionReceipt.transactionIndex ? hexToNumber(transactionReceipt.transactionIndex) : null,
    status: transactionReceipt.status ? receiptStatuses[transactionReceipt.status] : null,
    type: transactionReceipt.type ? transactionType[transactionReceipt.type] || transactionReceipt.type : null
  };
  if (transactionReceipt.blobGasPrice)
    receipt.blobGasPrice = BigInt(transactionReceipt.blobGasPrice);
  if (transactionReceipt.blobGasUsed)
    receipt.blobGasUsed = BigInt(transactionReceipt.blobGasUsed);
  return receipt;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/createClient.js
init_parseAccount();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/uid.js
var size4 = 256;
var index = size4;
var buffer;
function uid(length = 11) {
  if (!buffer || index + length > size4 * 2) {
    buffer = "";
    index = 0;
    for (let i = 0; i < size4; i++) {
      buffer += (256 + Math.random() * 256 | 0).toString(16).substring(1);
    }
  }
  return buffer.substring(index, index++ + length);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/createClient.js
function createClient(parameters) {
  const { batch, chain, ccipRead, dataSuffix, key = "base", name = "Base Client", tokens, type = "base" } = parameters;
  const experimental_blockTag = parameters.experimental_blockTag ?? (typeof chain?.experimental_preconfirmationTime === "number" ? "pending" : void 0);
  const blockTime = chain?.blockTime ?? 12e3;
  const defaultPollingInterval = Math.min(Math.max(Math.floor(blockTime / 2), 500), 4e3);
  const pollingInterval = parameters.pollingInterval ?? defaultPollingInterval;
  const cacheTime = parameters.cacheTime ?? pollingInterval;
  const account = parameters.account ? parseAccount(parameters.account) : void 0;
  const { config, request, value } = parameters.transport({
    account,
    chain,
    pollingInterval
  });
  const transport = { ...config, ...value };
  const client = {
    account,
    batch,
    cacheTime,
    ccipRead,
    chain,
    dataSuffix,
    key,
    name,
    pollingInterval,
    request,
    tokens,
    transport,
    type,
    uid: uid(),
    ...experimental_blockTag ? { experimental_blockTag } : {}
  };
  function extend(base) {
    return (extendFn) => {
      const extended = extendFn(base);
      for (const key2 in client)
        delete extended[key2];
      const combined = { ...base, ...extended };
      for (const key2 in extended) {
        const a = base[key2];
        const b = extended[key2];
        if (isPlainObject(a) && isPlainObject(b))
          combined[key2] = { ...a, ...b };
      }
      return Object.assign(combined, { extend: extend(combined) });
    };
  }
  return Object.assign(client, { extend: extend(client) });
}
function isPlainObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function bindActionDecorators(client, action) {
  const wrapped = (parameters = {}) => action(client, parameters);
  for (const key of [
    "call",
    "calls",
    "callWithPeriod",
    "estimateGas",
    "prepare",
    "simulate"
  ])
    if (Object.hasOwn(action, key)) {
      const helper = action[key];
      wrapped[key] = (args = {}) => {
        if (helper.length === 1)
          return helper(args);
        return helper(client, args);
      };
    }
  for (const key of ["extractEvent", "extractEvents"])
    if (Object.hasOwn(action, key))
      wrapped[key] = action[key];
  return wrapped;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsAddress.js
init_abis();
init_decodeFunctionResult();
init_encodeFunctionData();
init_getAddress();
init_getChainContractAddress();
init_size();
init_trim();
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/errors.js
init_base();
init_contract();
function isNullUniversalResolverError(err) {
  if (!(err instanceof BaseError2))
    return false;
  const cause = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(cause instanceof ContractFunctionRevertedError))
    return false;
  if (cause.data?.errorName === "HttpError")
    return true;
  if (cause.data?.errorName === "ResolverError")
    return true;
  if (cause.data?.errorName === "ResolverNotContract")
    return true;
  if (cause.data?.errorName === "ResolverNotFound")
    return true;
  if (cause.data?.errorName === "ReverseAddressMismatch")
    return true;
  if (cause.data?.errorName === "UnsupportedResolverProfile")
    return true;
  return false;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsAddress.js
init_localBatchGatewayRequest();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/namehash.js
init_concat();
init_toBytes();
init_toHex();
init_keccak256();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/encodedLabelToLabelhash.js
init_isHex();
function encodedLabelToLabelhash(label) {
  if (label.length !== 66)
    return null;
  if (label.indexOf("[") !== 0)
    return null;
  if (label.indexOf("]") !== 65)
    return null;
  const hash3 = `0x${label.slice(1, 65)}`;
  if (!isHex(hash3))
    return null;
  return hash3;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/namehash.js
function namehash(name) {
  let result = new Uint8Array(32).fill(0);
  if (!name)
    return bytesToHex(result);
  const labels = name.split(".");
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    const hashFromEncodedLabel = encodedLabelToLabelhash(labels[i]);
    const hashed = hashFromEncodedLabel ? toBytes(hashFromEncodedLabel) : keccak256(stringToBytes(labels[i]), "bytes");
    result = keccak256(concat([result, hashed]), "bytes");
  }
  return bytesToHex(result);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/packetToBytes.js
init_toBytes();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/encodeLabelhash.js
function encodeLabelhash(hash3) {
  return `[${hash3.slice(2)}]`;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/labelhash.js
init_toBytes();
init_toHex();
init_keccak256();
function labelhash(label) {
  const result = new Uint8Array(32).fill(0);
  if (!label)
    return bytesToHex(result);
  return encodedLabelToLabelhash(label) || keccak256(stringToBytes(label));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/packetToBytes.js
function packetToBytes(packet) {
  const value = packet.replace(/^\.|\.$/gm, "");
  if (value.length === 0)
    return new Uint8Array(1);
  const bytes = new Uint8Array(stringToBytes(value).byteLength + 2);
  let offset = 0;
  const list = value.split(".");
  for (let i = 0; i < list.length; i++) {
    let encoded = stringToBytes(list[i]);
    if (encoded.byteLength > 255)
      encoded = stringToBytes(encodeLabelhash(labelhash(list[i])));
    bytes[offset] = encoded.length;
    bytes.set(encoded, offset + 1);
    offset += encoded.length + 1;
  }
  if (bytes.byteLength !== offset + 1)
    return bytes.slice(0, offset + 1);
  return bytes;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsAddress.js
async function getEnsAddress(client, parameters) {
  const { blockNumber, blockTag, coinType, name, gatewayUrls, strict } = parameters;
  const { chain } = client;
  const universalResolverAddress = (() => {
    if (parameters.universalResolverAddress)
      return parameters.universalResolverAddress;
    if (!chain)
      throw new Error("client chain not configured. universalResolverAddress is required.");
    return getChainContractAddress({
      blockNumber,
      chain,
      contract: "ensUniversalResolver"
    });
  })();
  const tlds = chain?.ensTlds;
  if (tlds && !tlds.some((tld) => name.endsWith(tld)))
    return null;
  const args = (() => {
    if (coinType != null)
      return [namehash(name), BigInt(coinType)];
    return [namehash(name)];
  })();
  try {
    const functionData = encodeFunctionData({
      abi: addressResolverAbi,
      functionName: "addr",
      args
    });
    const readContractParameters = {
      address: universalResolverAddress,
      abi: universalResolverResolveAbi,
      functionName: "resolveWithGateways",
      args: [
        toHex(packetToBytes(name)),
        functionData,
        gatewayUrls ?? [localBatchGatewayUrl]
      ],
      blockNumber,
      blockTag
    };
    const readContractAction = getAction(client, readContract, "readContract");
    const res = await readContractAction(readContractParameters);
    if (res[0] === "0x")
      return null;
    const address = decodeAddress2({ coinType, data: res[0], args });
    if (address === "0x")
      return null;
    if (trim(address) === "0x00")
      return null;
    return address;
  } catch (err) {
    if (strict)
      throw err;
    if (isNullUniversalResolverError(err))
      return null;
    throw err;
  }
}
function decodeAddress2({ coinType, data, args }) {
  try {
    return decodeFunctionResult({
      abi: addressResolverAbi,
      args,
      functionName: "addr",
      data
    });
  } catch (err) {
    if (coinType == null)
      throw err;
    const address = trim(data);
    if (size(address) === 20)
      return getAddress(address);
    throw err;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/ens.js
init_base();
var EnsAvatarInvalidMetadataError = class extends BaseError2 {
  constructor({ data }) {
    super("Unable to extract image from metadata. The metadata may be malformed or invalid.", {
      metaMessages: [
        "- Metadata must be a JSON object with at least an `image`, `image_url` or `image_data` property.",
        "",
        `Provided data: ${JSON.stringify(data)}`
      ],
      name: "EnsAvatarInvalidMetadataError"
    });
  }
};
var EnsAvatarInvalidNftUriError = class extends BaseError2 {
  constructor({ reason }) {
    super(`ENS NFT avatar URI is invalid. ${reason}`, {
      name: "EnsAvatarInvalidNftUriError"
    });
  }
};
var EnsAvatarUriResolutionError = class extends BaseError2 {
  constructor({ uri }) {
    super(`Unable to resolve ENS avatar URI "${uri}". The URI may be malformed, invalid, or does not respond with a valid image.`, { name: "EnsAvatarUriResolutionError" });
  }
};
var EnsAvatarUnsupportedNamespaceError = class extends BaseError2 {
  constructor({ namespace }) {
    super(`ENS NFT avatar namespace "${namespace}" is not supported. Must be "erc721" or "erc1155".`, { name: "EnsAvatarUnsupportedNamespaceError" });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/avatar/utils.js
var networkRegex = /(?<protocol>https?:\/\/[^/]*|ipfs:\/|ipns:\/|ar:\/)?(?<root>\/)?(?<subpath>ipfs\/|ipns\/)?(?<target>[\w\-.]+)(?<subtarget>\/.*)?/;
var ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})(\/(?<target>[\w\-.]+))?(?<subtarget>\/.*)?$/;
var base64Regex = /^data:([a-zA-Z\-/+]*);base64,([^"].*)/;
var dataURIRegex = /^data:([a-zA-Z\-/+]*)?(;[a-zA-Z0-9].*?)?(,)/;
async function isImageUri(uri) {
  try {
    const res = await fetch(uri, { method: "HEAD" });
    if (res.status === 200) {
      const contentType = res.headers.get("content-type");
      return contentType?.startsWith("image/");
    }
    return false;
  } catch (error) {
    if (typeof error === "object" && typeof error.response !== "undefined") {
      return false;
    }
    if (!Object.hasOwn(globalThis, "Image"))
      return false;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = uri;
    });
  }
}
function getGateway(custom, defaultGateway) {
  if (!custom)
    return defaultGateway;
  if (custom.endsWith("/"))
    return custom.slice(0, -1);
  return custom;
}
function resolveAvatarUri({ uri, gatewayUrls }) {
  const isEncoded = base64Regex.test(uri);
  if (isEncoded)
    return { uri, isOnChain: true, isEncoded };
  const ipfsGateway = getGateway(gatewayUrls?.ipfs, "https://ipfs.io");
  const arweaveGateway = getGateway(gatewayUrls?.arweave, "https://arweave.net");
  const networkRegexMatch = uri.match(networkRegex);
  const { protocol, subpath, target, subtarget = "" } = networkRegexMatch?.groups || {};
  const isIPNS = protocol === "ipns:/" || subpath === "ipns/";
  const isIPFS = protocol === "ipfs:/" || subpath === "ipfs/" || ipfsHashRegex.test(uri);
  if (uri.startsWith("http") && !isIPNS && !isIPFS) {
    let replacedUri = uri;
    if (gatewayUrls?.arweave)
      replacedUri = uri.replace(/https:\/\/arweave.net/g, gatewayUrls?.arweave);
    return { uri: replacedUri, isOnChain: false, isEncoded: false };
  }
  if ((isIPNS || isIPFS) && target) {
    return {
      uri: `${ipfsGateway}/${isIPNS ? "ipns" : "ipfs"}/${target}${subtarget}`,
      isOnChain: false,
      isEncoded: false
    };
  }
  if (protocol === "ar:/" && target) {
    return {
      uri: `${arweaveGateway}/${target}${subtarget || ""}`,
      isOnChain: false,
      isEncoded: false
    };
  }
  let parsedUri = uri.replace(dataURIRegex, "");
  if (parsedUri.startsWith("<svg")) {
    parsedUri = `data:image/svg+xml;base64,${btoa(parsedUri)}`;
  }
  if (parsedUri.startsWith("data:") || parsedUri.startsWith("{")) {
    return {
      uri: parsedUri,
      isOnChain: true,
      isEncoded: false
    };
  }
  throw new EnsAvatarUriResolutionError({ uri });
}
function getJsonImage(data) {
  if (typeof data !== "object" || !("image" in data) && !("image_url" in data) && !("image_data" in data)) {
    throw new EnsAvatarInvalidMetadataError({ data });
  }
  return data.image || data.image_url || data.image_data;
}
async function getMetadataAvatarUri({ gatewayUrls, uri }) {
  try {
    const res = await fetch(uri).then((res2) => res2.json());
    const image = await parseAvatarUri({
      gatewayUrls,
      uri: getJsonImage(res)
    });
    return image;
  } catch {
    throw new EnsAvatarUriResolutionError({ uri });
  }
}
async function parseAvatarUri({ gatewayUrls, uri }) {
  const { uri: resolvedURI, isOnChain } = resolveAvatarUri({ uri, gatewayUrls });
  if (isOnChain)
    return resolvedURI;
  const isImage = await isImageUri(resolvedURI);
  if (isImage)
    return resolvedURI;
  throw new EnsAvatarUriResolutionError({ uri });
}
function parseNftUri(uri_) {
  let uri = uri_;
  if (uri.startsWith("did:nft:")) {
    uri = uri.replace("did:nft:", "").replace(/_/g, "/");
  }
  const [reference, asset_namespace, tokenID] = uri.split("/");
  const [eip_namespace, chainID] = reference.split(":");
  const [erc_namespace, contractAddress] = asset_namespace.split(":");
  if (!eip_namespace || eip_namespace.toLowerCase() !== "eip155")
    throw new EnsAvatarInvalidNftUriError({ reason: "Only EIP-155 supported" });
  if (!chainID)
    throw new EnsAvatarInvalidNftUriError({ reason: "Chain ID not found" });
  if (!contractAddress)
    throw new EnsAvatarInvalidNftUriError({
      reason: "Contract address not found"
    });
  if (!tokenID)
    throw new EnsAvatarInvalidNftUriError({ reason: "Token ID not found" });
  if (!erc_namespace)
    throw new EnsAvatarInvalidNftUriError({ reason: "ERC namespace not found" });
  return {
    chainID: Number.parseInt(chainID, 10),
    namespace: erc_namespace.toLowerCase(),
    contractAddress,
    tokenID
  };
}
async function getNftTokenUri(client, { nft }) {
  if (nft.namespace === "erc721") {
    return readContract(client, {
      address: nft.contractAddress,
      abi: [
        {
          name: "tokenURI",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "tokenId", type: "uint256" }],
          outputs: [{ name: "", type: "string" }]
        }
      ],
      functionName: "tokenURI",
      args: [BigInt(nft.tokenID)]
    });
  }
  if (nft.namespace === "erc1155") {
    return readContract(client, {
      address: nft.contractAddress,
      abi: [
        {
          name: "uri",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "_id", type: "uint256" }],
          outputs: [{ name: "", type: "string" }]
        }
      ],
      functionName: "uri",
      args: [BigInt(nft.tokenID)]
    });
  }
  throw new EnsAvatarUnsupportedNamespaceError({ namespace: nft.namespace });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/ens/avatar/parseAvatarRecord.js
async function parseAvatarRecord(client, { gatewayUrls, record }) {
  if (/eip155:/i.test(record))
    return parseNftAvatarUri(client, { gatewayUrls, record });
  return parseAvatarUri({ uri: record, gatewayUrls });
}
async function parseNftAvatarUri(client, { gatewayUrls, record }) {
  const nft = parseNftUri(record);
  const nftUri = await getNftTokenUri(client, { nft });
  const { uri: resolvedNftUri, isOnChain, isEncoded } = resolveAvatarUri({ uri: nftUri, gatewayUrls });
  if (isOnChain && (resolvedNftUri.includes("data:application/json;base64,") || resolvedNftUri.startsWith("{"))) {
    const encodedJson = isEncoded ? (
      // if it is encoded, decode it
      atob(resolvedNftUri.replace("data:application/json;base64,", ""))
    ) : (
      // if it isn't encoded assume it is a JSON string, but it could be anything (it will error if it is)
      resolvedNftUri
    );
    const decoded = JSON.parse(encodedJson);
    return parseAvatarUri({ uri: getJsonImage(decoded), gatewayUrls });
  }
  let uriTokenId = nft.tokenID;
  if (nft.namespace === "erc1155")
    uriTokenId = uriTokenId.replace("0x", "").padStart(64, "0");
  return getMetadataAvatarUri({
    gatewayUrls,
    uri: resolvedNftUri.replace(/(?:0x)?{id}/, uriTokenId)
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsText.js
init_abis();
init_decodeFunctionResult();
init_encodeFunctionData();
init_getChainContractAddress();
init_toHex();
init_localBatchGatewayRequest();
async function getEnsText(client, parameters) {
  const { blockNumber, blockTag, key, name, gatewayUrls, strict } = parameters;
  const { chain } = client;
  const universalResolverAddress = (() => {
    if (parameters.universalResolverAddress)
      return parameters.universalResolverAddress;
    if (!chain)
      throw new Error("client chain not configured. universalResolverAddress is required.");
    return getChainContractAddress({
      blockNumber,
      chain,
      contract: "ensUniversalResolver"
    });
  })();
  const tlds = chain?.ensTlds;
  if (tlds && !tlds.some((tld) => name.endsWith(tld)))
    return null;
  try {
    const readContractParameters = {
      address: universalResolverAddress,
      abi: universalResolverResolveAbi,
      args: [
        toHex(packetToBytes(name)),
        encodeFunctionData({
          abi: textResolverAbi,
          functionName: "text",
          args: [namehash(name), key]
        }),
        gatewayUrls ?? [localBatchGatewayUrl]
      ],
      functionName: "resolveWithGateways",
      blockNumber,
      blockTag
    };
    const readContractAction = getAction(client, readContract, "readContract");
    const res = await readContractAction(readContractParameters);
    if (res[0] === "0x")
      return null;
    const record = decodeFunctionResult({
      abi: textResolverAbi,
      functionName: "text",
      data: res[0]
    });
    return record === "" ? null : record;
  } catch (err) {
    if (strict)
      throw err;
    if (isNullUniversalResolverError(err))
      return null;
    throw err;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsAvatar.js
async function getEnsAvatar(client, { blockNumber, blockTag, assetGatewayUrls, name, gatewayUrls, strict, universalResolverAddress }) {
  const record = await getAction(client, getEnsText, "getEnsText")({
    blockNumber,
    blockTag,
    key: "avatar",
    name,
    universalResolverAddress,
    gatewayUrls,
    strict
  });
  if (!record)
    return null;
  try {
    return await parseAvatarRecord(client, {
      record,
      gatewayUrls: assetGatewayUrls
    });
  } catch {
    return null;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsName.js
init_abis();
init_getChainContractAddress();
init_localBatchGatewayRequest();
async function getEnsName(client, parameters) {
  const { address, blockNumber, blockTag, coinType = 60n, gatewayUrls, strict } = parameters;
  const { chain } = client;
  const universalResolverAddress = (() => {
    if (parameters.universalResolverAddress)
      return parameters.universalResolverAddress;
    if (!chain)
      throw new Error("client chain not configured. universalResolverAddress is required.");
    return getChainContractAddress({
      blockNumber,
      chain,
      contract: "ensUniversalResolver"
    });
  })();
  try {
    const readContractParameters = {
      address: universalResolverAddress,
      abi: universalResolverReverseAbi,
      args: [address, coinType, gatewayUrls ?? [localBatchGatewayUrl]],
      functionName: "reverseWithGateways",
      blockNumber,
      blockTag
    };
    const readContractAction = getAction(client, readContract, "readContract");
    const [name] = await readContractAction(readContractParameters);
    return name || null;
  } catch (err) {
    if (strict)
      throw err;
    if (isNullUniversalResolverError(err))
      return null;
    throw err;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/ens/getEnsResolver.js
init_getChainContractAddress();
init_toHex();
async function getEnsResolver(client, parameters) {
  const { blockNumber, blockTag, name } = parameters;
  const { chain } = client;
  const universalResolverAddress = (() => {
    if (parameters.universalResolverAddress)
      return parameters.universalResolverAddress;
    if (!chain)
      throw new Error("client chain not configured. universalResolverAddress is required.");
    return getChainContractAddress({
      blockNumber,
      chain,
      contract: "ensUniversalResolver"
    });
  })();
  const tlds = chain?.ensTlds;
  if (tlds && !tlds.some((tld) => name.endsWith(tld)))
    throw new Error(`${name} is not a valid ENS TLD (${tlds?.join(", ")}) for chain "${chain.name}" (id: ${chain.id}).`);
  const [resolverAddress] = await getAction(client, readContract, "readContract")({
    address: universalResolverAddress,
    abi: [
      {
        inputs: [{ type: "bytes" }],
        name: "findResolver",
        outputs: [
          { type: "address" },
          { type: "bytes32" },
          { type: "uint256" }
        ],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: "findResolver",
    args: [toHex(packetToBytes(name))],
    blockNumber,
    blockTag
  });
  return resolverAddress;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/decorators/public.js
init_call();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createAccessList.js
init_parseAccount();
init_base();
init_toHex();
init_getCallError();
init_extract();
init_transactionRequest();
init_assertRequest();
async function createAccessList(client, args) {
  const { account: account_ = client.account, blockNumber, blockTag = "latest", blobs, data, gas, gasPrice, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, to, value, ...rest } = args;
  const account = account_ ? parseAccount(account_) : void 0;
  try {
    assertRequest(args);
    const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0;
    const block = blockNumberHex || blockTag;
    const chainFormat = client.chain?.formatters?.transactionRequest?.format;
    const format = chainFormat || formatTransactionRequest;
    const request = format({
      // Pick out extra data that might exist on the chain's transaction request type.
      ...extract(rest, { format: chainFormat }),
      account,
      blobs,
      data,
      gas,
      gasPrice,
      maxFeePerBlobGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to,
      value
    }, "createAccessList");
    const response = await client.request({
      method: "eth_createAccessList",
      params: [request, block]
    });
    if (response.error)
      throw new BaseError2(response.error, { details: response.error });
    return {
      accessList: response.accessList,
      gasUsed: BigInt(response.gasUsed)
    };
  } catch (err) {
    throw getCallError(err, {
      ...args,
      account,
      chain: client.chain
    });
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createBlockFilter.js
async function createBlockFilter(client) {
  const getRequest = createFilterRequestScope(client, {
    method: "eth_newBlockFilter"
  });
  const id = await client.request({
    method: "eth_newBlockFilter"
  });
  return { id, request: getRequest(id), type: "block" };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createEventFilter.js
init_toHex();
async function createEventFilter(client, { address, args, event, events: events_, fromBlock, strict, toBlock } = {}) {
  const events = events_ ?? (event ? [event] : void 0);
  const getRequest = createFilterRequestScope(client, {
    method: "eth_newFilter"
  });
  let topics = [];
  if (events) {
    const encoded = events.flatMap((event2) => encodeEventTopics({
      abi: [event2],
      eventName: event2.name,
      args
    }));
    topics = [encoded];
    if (event)
      topics = topics[0];
  }
  const id = await client.request({
    method: "eth_newFilter",
    params: [
      {
        address,
        fromBlock: typeof fromBlock === "bigint" ? numberToHex(fromBlock) : fromBlock,
        toBlock: typeof toBlock === "bigint" ? numberToHex(toBlock) : toBlock,
        ...topics.length ? { topics } : {}
      }
    ]
  });
  return {
    abi: events,
    args,
    eventName: event ? event.name : void 0,
    fromBlock,
    id,
    request: getRequest(id),
    strict: Boolean(strict),
    toBlock,
    type: "event"
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/createPendingTransactionFilter.js
async function createPendingTransactionFilter(client) {
  const getRequest = createFilterRequestScope(client, {
    method: "eth_newPendingTransactionFilter"
  });
  const id = await client.request({
    method: "eth_newPendingTransactionFilter"
  });
  return { id, request: getRequest(id), type: "transaction" };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBalance.js
init_abis();
init_decodeFunctionResult();
init_encodeFunctionData();
init_formatBlockParameter();
init_call();
async function getBalance(client, { address, blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest", requireCanonical }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  if (client.batch?.multicall && client.chain?.contracts?.multicall3) {
    const multicall3Address = client.chain.contracts.multicall3.address;
    const calldata = encodeFunctionData({
      abi: multicall3Abi,
      functionName: "getEthBalance",
      args: [address]
    });
    const { data } = await getAction(client, call, "call")({
      to: multicall3Address,
      data: calldata,
      blockHash,
      blockNumber,
      blockTag,
      requireCanonical
    });
    return decodeFunctionResult({
      abi: multicall3Abi,
      functionName: "getEthBalance",
      args: [address],
      data: data || "0x"
    });
  }
  const balance = await client.request({
    method: "eth_getBalance",
    params: [address, block]
  });
  return BigInt(balance);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlobBaseFee.js
async function getBlobBaseFee(client) {
  const baseFee = await client.request({
    method: "eth_blobBaseFee"
  });
  return BigInt(baseFee);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlockReceipts.js
init_toHex();
async function getBlockReceipts(client, { blockHash, blockNumber, blockTag = client.experimental_blockTag ?? "latest" } = {}) {
  const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
  const receipts = await client.request({
    method: "eth_getBlockReceipts",
    params: [blockHash || blockNumberHex || blockTag]
  }, { dedupe: Boolean(blockHash || blockNumberHex) });
  if (!receipts)
    throw new BlockNotFoundError({ blockHash, blockNumber });
  const format = client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt;
  return receipts.map((receipt) => format(receipt, "getBlockReceipts"));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getBlockTransactionCount.js
init_fromHex();
init_toHex();
async function getBlockTransactionCount(client, { blockHash, blockNumber, blockTag = "latest" } = {}) {
  const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
  let count;
  if (blockHash) {
    count = await client.request({
      method: "eth_getBlockTransactionCountByHash",
      params: [blockHash]
    }, { dedupe: true });
  } else {
    count = await client.request({
      method: "eth_getBlockTransactionCountByNumber",
      params: [blockNumberHex || blockTag]
    }, { dedupe: Boolean(blockNumberHex) });
  }
  return hexToNumber(count);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getCode.js
init_formatBlockParameter();
async function getCode(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const hex = await client.request({
    method: "eth_getCode",
    params: [address, block]
  }, {
    dedupe: typeof blockNumber === "bigint" || blockHash !== void 0
  });
  if (hex === "0x")
    return void 0;
  return hex;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getDelegation.js
init_getAddress();
init_size();
init_slice();
async function getDelegation(client, { address, blockNumber, blockTag = "latest" }) {
  const code = await getCode(client, {
    address,
    ...blockNumber !== void 0 ? { blockNumber } : { blockTag }
  });
  if (!code)
    return void 0;
  if (size(code) !== 23)
    return void 0;
  if (!code.startsWith("0xef0100"))
    return void 0;
  return getAddress(slice(code, 3, 23));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/eip712.js
init_base();
var Eip712DomainNotFoundError = class extends BaseError2 {
  constructor({ address }) {
    super(`No EIP-712 domain found on contract "${address}".`, {
      metaMessages: [
        "Ensure that:",
        `- The contract is deployed at the address "${address}".`,
        "- `eip712Domain()` function exists on the contract.",
        "- `eip712Domain()` function matches signature to ERC-5267 specification."
      ],
      name: "Eip712DomainNotFoundError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getEip712Domain.js
async function getEip712Domain(client, parameters) {
  const { address, factory, factoryData } = parameters;
  try {
    const [fields, name, version4, chainId, verifyingContract, salt, extensions] = await getAction(client, readContract, "readContract")({
      abi,
      address,
      functionName: "eip712Domain",
      factory,
      factoryData
    });
    return {
      domain: {
        name,
        version: version4,
        chainId: Number(chainId),
        verifyingContract,
        salt
      },
      extensions,
      fields
    };
  } catch (e) {
    const error = e;
    if (error.name === "ContractFunctionExecutionError" && error.cause.name === "ContractFunctionZeroDataError") {
      throw new Eip712DomainNotFoundError({ address });
    }
    throw error;
  }
}
var abi = [
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      { name: "fields", type: "bytes1" },
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
      { name: "extensions", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getFeeHistory.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/feeHistory.js
function formatFeeHistory(feeHistory) {
  return {
    baseFeePerGas: feeHistory.baseFeePerGas.map((value) => BigInt(value)),
    gasUsedRatio: feeHistory.gasUsedRatio,
    oldestBlock: BigInt(feeHistory.oldestBlock),
    reward: feeHistory.reward?.map((reward) => reward.map((value) => BigInt(value)))
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getFeeHistory.js
async function getFeeHistory(client, { blockCount, blockNumber, blockTag = "latest", rewardPercentiles }) {
  const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0;
  const feeHistory = await client.request({
    method: "eth_feeHistory",
    params: [
      numberToHex(blockCount),
      blockNumberHex || blockTag,
      rewardPercentiles
    ]
  }, { dedupe: Boolean(blockNumberHex) });
  return formatFeeHistory(feeHistory);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getFilterLogs.js
async function getFilterLogs(_client, { filter }) {
  const strict = filter.strict ?? false;
  const logs = await filter.request({
    method: "eth_getFilterLogs",
    params: [filter.id]
  });
  const formattedLogs = logs.map((log) => formatLog(log));
  if (!filter.abi)
    return formattedLogs;
  return parseEventLogs({
    abi: filter.abi,
    logs: formattedLogs,
    strict
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getProof.js
init_formatBlockParameter();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/index.js
init_encodeFunctionData();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/serializeTransaction.js
init_transaction();
init_concat();
init_trim();
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/assertTransaction.js
init_number();
init_address();
init_base();
init_chain();
init_node();
init_isAddress();
init_size();
init_slice();
init_fromHex();
function assertTransactionEIP7702(transaction) {
  const { authorizationList } = transaction;
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { chainId } = authorization;
      const address = authorization.address;
      if (!isAddress(address))
        throw new InvalidAddressError({ address });
      if (chainId < 0)
        throw new InvalidChainIdError({ chainId });
    }
  }
  assertTransactionEIP1559(transaction);
}
function assertTransactionEIP4844(transaction) {
  const { blobVersionedHashes } = transaction;
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new EmptyBlobError();
    for (const hash3 of blobVersionedHashes) {
      const size_ = size(hash3);
      const version4 = hexToNumber(slice(hash3, 0, 1));
      if (size_ !== 32)
        throw new InvalidVersionedHashSizeError({ hash: hash3, size: size_ });
      if (version4 !== versionedHashVersionKzg)
        throw new InvalidVersionedHashVersionError({
          hash: hash3,
          version: version4
        });
    }
  }
  assertTransactionEIP1559(transaction);
}
function assertTransactionEIP1559(transaction) {
  const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = transaction;
  if (chainId <= 0)
    throw new InvalidChainIdError({ chainId });
  if (to && !isAddress(to))
    throw new InvalidAddressError({ address: to });
  if (maxFeePerGas && maxFeePerGas > maxUint256)
    throw new FeeCapTooHighError({ maxFeePerGas });
  if (maxPriorityFeePerGas && maxFeePerGas && maxPriorityFeePerGas > maxFeePerGas)
    throw new TipAboveFeeCapError({ maxFeePerGas, maxPriorityFeePerGas });
}
function assertTransactionEIP2930(transaction) {
  const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
  if (chainId <= 0)
    throw new InvalidChainIdError({ chainId });
  if (to && !isAddress(to))
    throw new InvalidAddressError({ address: to });
  if (maxPriorityFeePerGas || maxFeePerGas)
    throw new BaseError2("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid EIP-2930 Transaction attribute.");
  if (gasPrice && gasPrice > maxUint256)
    throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
}
function assertTransactionLegacy(transaction) {
  const { chainId, maxPriorityFeePerGas, gasPrice, maxFeePerGas, to } = transaction;
  if (to && !isAddress(to))
    throw new InvalidAddressError({ address: to });
  if (typeof chainId !== "undefined" && chainId <= 0)
    throw new InvalidChainIdError({ chainId });
  if (maxPriorityFeePerGas || maxFeePerGas)
    throw new BaseError2("`maxFeePerGas`/`maxPriorityFeePerGas` is not a valid Legacy Transaction attribute.");
  if (gasPrice && gasPrice > maxUint256)
    throw new FeeCapTooHighError({ maxFeePerGas: gasPrice });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/serializeAccessList.js
init_address();
init_transaction();
init_isAddress();
function serializeAccessList(accessList) {
  if (!accessList || accessList.length === 0)
    return [];
  const serializedAccessList = [];
  for (let i = 0; i < accessList.length; i++) {
    const { address, storageKeys } = accessList[i];
    for (let j = 0; j < storageKeys.length; j++) {
      if (storageKeys[j].length - 2 !== 64) {
        throw new InvalidStorageKeySizeError({ storageKey: storageKeys[j] });
      }
    }
    if (!isAddress(address, { strict: false })) {
      throw new InvalidAddressError({ address });
    }
    serializedAccessList.push([address, storageKeys]);
  }
  return serializedAccessList;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/serializeTransaction.js
function serializeTransaction(transaction, signature) {
  const type = getTransactionType(transaction);
  if (type === "eip1559")
    return serializeTransactionEIP1559(transaction, signature);
  if (type === "eip2930")
    return serializeTransactionEIP2930(transaction, signature);
  if (type === "eip4844")
    return serializeTransactionEIP4844(transaction, signature);
  if (type === "eip7702")
    return serializeTransactionEIP7702(transaction, signature);
  return serializeTransactionLegacy(transaction, signature);
}
function serializeTransactionEIP7702(transaction, signature) {
  const { authorizationList, chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
  assertTransactionEIP7702(transaction);
  const serializedAccessList = serializeAccessList(accessList);
  const serializedAuthorizationList = serializeAuthorizationList(authorizationList);
  return concatHex([
    "0x04",
    toRlp([
      numberToHex(chainId),
      nonce ? numberToHex(nonce) : "0x",
      maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
      maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
      gas ? numberToHex(gas) : "0x",
      to ?? "0x",
      value ? numberToHex(value) : "0x",
      data ?? "0x",
      serializedAccessList,
      serializedAuthorizationList,
      ...toYParitySignatureArray(transaction, signature)
    ])
  ]);
}
function serializeTransactionEIP4844(transaction, signature) {
  const { chainId, gas, nonce, to, value, maxFeePerBlobGas, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
  assertTransactionEIP4844(transaction);
  let blobVersionedHashes = transaction.blobVersionedHashes;
  let sidecars = transaction.sidecars;
  if (transaction.blobs && (typeof blobVersionedHashes === "undefined" || typeof sidecars === "undefined")) {
    const blobs2 = typeof transaction.blobs[0] === "string" ? transaction.blobs : transaction.blobs.map((x) => bytesToHex(x));
    const kzg = transaction.kzg;
    const commitments2 = blobsToCommitments({
      blobs: blobs2,
      kzg
    });
    if (typeof blobVersionedHashes === "undefined")
      blobVersionedHashes = commitmentsToVersionedHashes({
        commitments: commitments2
      });
    if (typeof sidecars === "undefined") {
      const proofs2 = blobsToProofs({ blobs: blobs2, commitments: commitments2, kzg });
      sidecars = toBlobSidecars({ blobs: blobs2, commitments: commitments2, proofs: proofs2 });
    }
  }
  const serializedAccessList = serializeAccessList(accessList);
  const serializedTransaction = [
    numberToHex(chainId),
    nonce ? numberToHex(nonce) : "0x",
    maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
    maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
    gas ? numberToHex(gas) : "0x",
    to ?? "0x",
    value ? numberToHex(value) : "0x",
    data ?? "0x",
    serializedAccessList,
    maxFeePerBlobGas ? numberToHex(maxFeePerBlobGas) : "0x",
    blobVersionedHashes ?? [],
    ...toYParitySignatureArray(transaction, signature)
  ];
  const blobs = [];
  const commitments = [];
  const proofs = [];
  if (sidecars)
    for (let i = 0; i < sidecars.length; i++) {
      const { blob, commitment, proof } = sidecars[i];
      blobs.push(blob);
      commitments.push(commitment);
      proofs.push(proof);
    }
  return concatHex([
    "0x03",
    sidecars ? (
      // If sidecars are enabled, envelope turns into a "wrapper":
      toRlp([serializedTransaction, blobs, commitments, proofs])
    ) : (
      // If sidecars are disabled, standard envelope is used:
      toRlp(serializedTransaction)
    )
  ]);
}
function serializeTransactionEIP1559(transaction, signature) {
  const { chainId, gas, nonce, to, value, maxFeePerGas, maxPriorityFeePerGas, accessList, data } = transaction;
  assertTransactionEIP1559(transaction);
  const serializedAccessList = serializeAccessList(accessList);
  const serializedTransaction = [
    numberToHex(chainId),
    nonce ? numberToHex(nonce) : "0x",
    maxPriorityFeePerGas ? numberToHex(maxPriorityFeePerGas) : "0x",
    maxFeePerGas ? numberToHex(maxFeePerGas) : "0x",
    gas ? numberToHex(gas) : "0x",
    to ?? "0x",
    value ? numberToHex(value) : "0x",
    data ?? "0x",
    serializedAccessList,
    ...toYParitySignatureArray(transaction, signature)
  ];
  return concatHex([
    "0x02",
    toRlp(serializedTransaction)
  ]);
}
function serializeTransactionEIP2930(transaction, signature) {
  const { chainId, gas, data, nonce, to, value, accessList, gasPrice } = transaction;
  assertTransactionEIP2930(transaction);
  const serializedAccessList = serializeAccessList(accessList);
  const serializedTransaction = [
    numberToHex(chainId),
    nonce ? numberToHex(nonce) : "0x",
    gasPrice ? numberToHex(gasPrice) : "0x",
    gas ? numberToHex(gas) : "0x",
    to ?? "0x",
    value ? numberToHex(value) : "0x",
    data ?? "0x",
    serializedAccessList,
    ...toYParitySignatureArray(transaction, signature)
  ];
  return concatHex([
    "0x01",
    toRlp(serializedTransaction)
  ]);
}
function serializeTransactionLegacy(transaction, signature) {
  const { chainId = 0, gas, data, nonce, to, value, gasPrice } = transaction;
  assertTransactionLegacy(transaction);
  let serializedTransaction = [
    nonce ? numberToHex(nonce) : "0x",
    gasPrice ? numberToHex(gasPrice) : "0x",
    gas ? numberToHex(gas) : "0x",
    to ?? "0x",
    value ? numberToHex(value) : "0x",
    data ?? "0x"
  ];
  if (signature) {
    const v = (() => {
      if (signature.v >= 35n) {
        const inferredChainId = (signature.v - 35n) / 2n;
        if (inferredChainId > 0)
          return signature.v;
        return 27n + (signature.v === 35n ? 0n : 1n);
      }
      if (chainId > 0)
        return BigInt(chainId * 2) + BigInt(35n + signature.v - 27n);
      const v2 = 27n + (signature.v === 27n ? 0n : 1n);
      if (signature.v !== v2)
        throw new InvalidLegacyVError({ v: signature.v });
      return v2;
    })();
    const r = trim(signature.r);
    const s = trim(signature.s);
    serializedTransaction = [
      ...serializedTransaction,
      numberToHex(v),
      r === "0x00" ? "0x" : r,
      s === "0x00" ? "0x" : s
    ];
  } else if (chainId > 0) {
    serializedTransaction = [
      ...serializedTransaction,
      numberToHex(chainId),
      "0x",
      "0x"
    ];
  }
  return toRlp(serializedTransaction);
}
function toYParitySignatureArray(transaction, signature_) {
  const signature = signature_ ?? transaction;
  const { v, yParity } = signature;
  if (typeof signature.r === "undefined")
    return [];
  if (typeof signature.s === "undefined")
    return [];
  if (typeof v === "undefined" && typeof yParity === "undefined")
    return [];
  const r = trim(signature.r);
  const s = trim(signature.s);
  const yParity_ = (() => {
    if (typeof yParity === "number")
      return yParity ? numberToHex(1) : "0x";
    if (v === 0n)
      return "0x";
    if (v === 1n)
      return numberToHex(1);
    return v === 27n ? "0x" : numberToHex(1);
  })();
  return [yParity_, r === "0x00" ? "0x" : r, s === "0x00" ? "0x" : s];
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/serializeAuthorizationList.js
function serializeAuthorizationList(authorizationList) {
  if (!authorizationList || authorizationList.length === 0)
    return [];
  const serializedAuthorizationList = [];
  for (const authorization of authorizationList) {
    const { chainId, nonce, ...signature } = authorization;
    const contractAddress = authorization.address;
    serializedAuthorizationList.push([
      chainId ? toHex(chainId) : "0x",
      contractAddress,
      nonce ? toHex(nonce) : "0x",
      ...toYParitySignatureArray({}, signature)
    ]);
  }
  return serializedAuthorizationList;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/authorization/verifyAuthorization.js
init_getAddress();
init_isAddressEqual();
async function verifyAuthorization({ address, authorization, signature }) {
  return isAddressEqual(getAddress(address), await recoverAuthorizationAddress({
    authorization,
    signature
  }));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/buildRequest.js
init_base();
init_request();
init_rpc();
init_utils3();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withDedupe.js
init_lru();
var promiseCache2 = /* @__PURE__ */ new LruMap(8192);
function withDedupe(fn, { enabled = true, id }) {
  if (!enabled || !id)
    return fn();
  if (promiseCache2.get(id))
    return promiseCache2.get(id);
  const promise = fn().finally(() => promiseCache2.delete(id));
  promiseCache2.set(id, promise);
  return promise;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/buildRequest.js
init_stringify();
function buildRequest(request, options = {}) {
  return async (args, overrideOptions = {}) => {
    const { dedupe = false, methods, retryDelay = 150, retryCount = 3, signal, uid: uid2 } = {
      ...options,
      ...overrideOptions
    };
    const { method } = args;
    if (methods?.exclude?.includes(method))
      throw new MethodNotSupportedRpcError(new Error("method not supported"), {
        method
      });
    if (methods?.include && !methods.include.includes(method))
      throw new MethodNotSupportedRpcError(new Error("method not supported"), {
        method
      });
    if (signal?.aborted)
      throw getAbortError(signal);
    const requestId = dedupe ? hashString(`${uid2}.${stringify(args)}`) : void 0;
    return withDedupe(() => withRetry(async () => {
      try {
        return await request(args, signal ? { signal } : void 0);
      } catch (err_) {
        if (signal?.aborted)
          throw getAbortError(signal);
        if (isAbortError(err_))
          throw err_;
        const err = err_;
        switch (err.code) {
          // -32700
          case ParseRpcError.code:
            throw new ParseRpcError(err);
          // -32600
          case InvalidRequestRpcError.code:
            throw new InvalidRequestRpcError(err);
          // -32601
          case MethodNotFoundRpcError.code:
            throw new MethodNotFoundRpcError(err, { method: args.method });
          // -32602
          case InvalidParamsRpcError.code:
            throw new InvalidParamsRpcError(err);
          // -32603
          case InternalRpcError.code:
            throw new InternalRpcError(err);
          // -32000
          case InvalidInputRpcError.code:
            throw new InvalidInputRpcError(err);
          // -32001
          case ResourceNotFoundRpcError.code:
            throw new ResourceNotFoundRpcError(err);
          // -32002
          case ResourceUnavailableRpcError.code:
            throw new ResourceUnavailableRpcError(err);
          // -32003
          case TransactionRejectedRpcError.code:
            throw new TransactionRejectedRpcError(err);
          // -32004
          case MethodNotSupportedRpcError.code:
            throw new MethodNotSupportedRpcError(err, {
              method: args.method
            });
          // -32005
          case LimitExceededRpcError.code:
            throw new LimitExceededRpcError(err);
          // -32006
          case JsonRpcVersionUnsupportedError.code:
            throw new JsonRpcVersionUnsupportedError(err);
          // 4001
          case UserRejectedRequestError.code:
            throw new UserRejectedRequestError(err);
          // 4100
          case UnauthorizedProviderError.code:
            throw new UnauthorizedProviderError(err);
          // 4200
          case UnsupportedProviderMethodError.code:
            throw new UnsupportedProviderMethodError(err);
          // 4900
          case ProviderDisconnectedError.code:
            throw new ProviderDisconnectedError(err);
          // 4901
          case ChainDisconnectedError.code:
            throw new ChainDisconnectedError(err);
          // 4902
          case SwitchChainError.code:
            throw new SwitchChainError(err);
          // 5700
          case UnsupportedNonOptionalCapabilityError.code:
            throw new UnsupportedNonOptionalCapabilityError(err);
          // 5710
          case UnsupportedChainIdError.code:
            throw new UnsupportedChainIdError(err);
          // 5720
          case DuplicateIdError.code:
            throw new DuplicateIdError(err);
          // 5730
          case UnknownBundleIdError.code:
            throw new UnknownBundleIdError(err);
          // 5740
          case BundleTooLargeError.code:
            throw new BundleTooLargeError(err);
          // 5750
          case AtomicReadyWalletRejectedUpgradeError.code:
            throw new AtomicReadyWalletRejectedUpgradeError(err);
          // 5760
          case AtomicityNotSupportedError.code:
            throw new AtomicityNotSupportedError(err);
          // CAIP-25: User Rejected Error
          // https://docs.walletconnect.com/2.0/specs/clients/sign/error-codes#rejected-caip-25
          case 5e3:
            throw new UserRejectedRequestError(err);
          // WalletConnect: Session Settlement Failed
          // https://docs.walletconnect.com/2.0/specs/clients/sign/error-codes
          case WalletConnectSessionSettlementError.code:
            throw new WalletConnectSessionSettlementError(err);
          default:
            if (err_ instanceof BaseError2)
              throw err_;
            throw new UnknownRpcError(err);
        }
      }
    }, {
      delay: ({ count, error }) => {
        if (error && error instanceof HttpRequestError) {
          const retryAfter = error?.headers?.get("Retry-After");
          if (retryAfter?.match(/\d/))
            return Number.parseInt(retryAfter, 10) * 1e3;
        }
        return ~~(1 << count) * retryDelay;
      },
      retryCount,
      signal,
      shouldRetry: ({ error }) => shouldRetry(error)
    }), { enabled: dedupe, id: requestId });
  };
}
function shouldRetry(error) {
  if (isAbortError(error))
    return false;
  if ("code" in error && typeof error.code === "number") {
    if (error.code === -1)
      return true;
    if (error.code === LimitExceededRpcError.code)
      return true;
    if (error.code === InternalRpcError.code)
      return true;
    if (error.code === 429)
      return true;
    return false;
  }
  if (error instanceof HttpRequestError && error.status) {
    if (error.status === 403)
      return true;
    if (error.status === 408)
      return true;
    if (error.status === 413)
      return true;
    if (error.status === 429)
      return true;
    if (error.status === 500)
      return true;
    if (error.status === 502)
      return true;
    if (error.status === 503)
      return true;
    if (error.status === 504)
      return true;
    return false;
  }
  return true;
}
function hashString(str, seed = 0) {
  let h1 = 3735928559 ^ seed;
  let h2 = 1103547991 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507);
  h1 ^= Math.imul(h2 ^ h2 >>> 16, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507);
  h2 ^= Math.imul(h1 ^ h1 >>> 16, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/index.js
init_fromHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/encoding/fromRlp.js
init_base();
init_encoding();
init_cursor2();
init_toBytes();
init_toHex();
var rlpDepthLimit = 1024;
function fromRlp(value, to = "hex") {
  const bytes = (() => {
    if (typeof value === "string") {
      if (value.length > 3 && value.length % 2 !== 0)
        throw new InvalidHexValueError(value);
      return hexToBytes(value);
    }
    return value;
  })();
  const cursor = createCursor(bytes, {
    recursiveReadLimit: Number.POSITIVE_INFINITY
  });
  const result = fromRlpCursor(cursor, to);
  if (cursor.position < cursor.bytes.length)
    throw new RlpTrailingBytesError({
      count: cursor.bytes.length - cursor.position
    });
  return result;
}
function fromRlpCursor(cursor, to = "hex", recursiveDepth = 0) {
  if (recursiveDepth >= rlpDepthLimit)
    throw new RlpDepthLimitExceededError({ limit: rlpDepthLimit });
  if (cursor.bytes.length === 0)
    return to === "hex" ? bytesToHex(cursor.bytes) : cursor.bytes;
  const prefix = cursor.readByte();
  if (prefix < 128)
    cursor.decrementPosition(1);
  if (prefix < 192) {
    const length2 = readLength(cursor, prefix, 128);
    const bytes = cursor.readBytes(length2);
    return to === "hex" ? bytesToHex(bytes) : bytes;
  }
  const length = readLength(cursor, prefix, 192);
  return readList(cursor, length, to, recursiveDepth + 1);
}
function readLength(cursor, prefix, offset) {
  if (offset === 128 && prefix < 128)
    return 1;
  if (prefix <= offset + 55)
    return prefix - offset;
  if (prefix === offset + 55 + 1)
    return cursor.readUint8();
  if (prefix === offset + 55 + 2)
    return cursor.readUint16();
  if (prefix === offset + 55 + 3)
    return cursor.readUint24();
  if (prefix === offset + 55 + 4)
    return cursor.readUint32();
  throw new BaseError2("Invalid RLP prefix");
}
function readList(cursor, length, to, recursiveDepth) {
  const position = cursor.position;
  const value = [];
  while (cursor.position - position < length)
    value.push(fromRlpCursor(cursor, to, recursiveDepth));
  if (cursor.position - position !== length)
    throw new RlpListBoundaryExceededError({
      consumed: cursor.position - position,
      declared: length
    });
  return value;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/hash/isHash.js
init_isHex();
init_size();
function isHash(hash3) {
  return isHex(hash3) && size(hash3) === 32;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/rpc/http.js
init_request();
init_utils3();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/promise/withTimeout.js
init_utils3();
function withTimeout(fn, { errorInstance = new Error("timed out"), timeout, signal }) {
  return new Promise((resolve, reject) => {
    ;
    (async () => {
      let timeoutId;
      const controller = new AbortController();
      try {
        if (timeout > 0) {
          timeoutId = setTimeout(() => {
            if (signal) {
              controller.abort();
            } else {
              reject(errorInstance);
            }
          }, timeout);
        }
        resolve(await fn({ signal: controller?.signal || null }));
      } catch (err) {
        if (controller?.signal.aborted && isAbortError(err)) {
          reject(errorInstance);
          return;
        }
        reject(err);
      } finally {
        clearTimeout(timeoutId);
      }
    })();
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/rpc/http.js
init_stringify();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/rpc/id.js
function createIdStore() {
  return {
    current: 0,
    take() {
      return this.current++;
    },
    reset() {
      this.current = 0;
    }
  };
}
var idCache = /* @__PURE__ */ createIdStore();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/rpc/http.js
var defaultMaxResponseBodySize = 10485760;
function getHttpRpcClient(url_, options = {}) {
  const { url, headers: headers_url } = parseUrl(url_);
  return {
    async request(params) {
      const { body, fetchFn = options.fetchFn ?? fetch, maxResponseBodySize = options.maxResponseBodySize ?? defaultMaxResponseBodySize, onRequest = options.onRequest, onResponse = options.onResponse, timeout = options.timeout ?? 1e4 } = params;
      const fetchOptions = {
        ...options.fetchOptions ?? {},
        ...params.fetchOptions ?? {}
      };
      const { headers, method, signal: signal_ } = fetchOptions;
      try {
        const response = await withTimeout(async ({ signal }) => {
          const init = {
            ...fetchOptions,
            body: Array.isArray(body) ? stringify(body.map((body2) => ({
              jsonrpc: "2.0",
              id: body2.id ?? idCache.take(),
              ...body2
            }))) : stringify({
              jsonrpc: "2.0",
              id: body.id ?? idCache.take(),
              ...body
            }),
            headers: {
              ...headers_url,
              "Content-Type": "application/json",
              ...headers
            },
            method: method || "POST",
            signal: signal_ || (timeout > 0 ? signal : null)
          };
          const request = new Request(url, init);
          const args = await onRequest?.(request, init) ?? { ...init, url };
          const response2 = await fetchFn(args.url ?? url, args);
          return response2;
        }, {
          errorInstance: new TimeoutError({ body, url }),
          timeout,
          signal: true
        });
        if (onResponse)
          await onResponse(response);
        let data;
        const responseBody = await readResponseBody(response, {
          maxResponseBodySize
        });
        if (response.headers.get("Content-Type")?.startsWith("application/json"))
          data = JSON.parse(responseBody);
        else {
          data = responseBody;
          try {
            data = JSON.parse(data || "{}");
          } catch (err) {
            if (response.ok)
              throw err;
            data = { error: data };
          }
        }
        if (!response.ok) {
          if (typeof data.error?.code === "number" && typeof data.error?.message === "string")
            return data;
          throw new HttpRequestError({
            body,
            details: stringify(data.error) || response.statusText,
            headers: response.headers,
            status: response.status,
            url
          });
        }
        return data;
      } catch (err) {
        if (signal_?.aborted)
          throw getAbortError(signal_);
        if (isAbortError(err))
          throw err;
        if (err instanceof HttpRequestError)
          throw err;
        if (err instanceof ResponseBodyTooLargeError)
          throw err;
        if (err instanceof TimeoutError)
          throw err;
        throw new HttpRequestError({
          body,
          cause: err,
          url
        });
      }
    }
  };
}
async function readResponseBody(response, { maxResponseBodySize }) {
  if (maxResponseBodySize === false)
    return response.text();
  const contentLength = response.headers.get("Content-Length");
  if (contentLength) {
    const size6 = Number(contentLength);
    if (size6 > maxResponseBodySize)
      throw new ResponseBodyTooLargeError({
        maxSize: maxResponseBodySize,
        size: size6
      });
  }
  if (!response.body) {
    const body2 = await response.text();
    const size6 = new TextEncoder().encode(body2).length;
    if (size6 > maxResponseBodySize)
      throw new ResponseBodyTooLargeError({
        maxSize: maxResponseBodySize,
        size: size6
      });
    return body2;
  }
  const reader = response.body.getReader();
  const decoder2 = new TextDecoder();
  let body = "";
  let size5 = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      size5 += value.byteLength;
      if (size5 > maxResponseBodySize) {
        await reader.cancel();
        throw new ResponseBodyTooLargeError({
          maxSize: maxResponseBodySize,
          size: size5
        });
      }
      body += decoder2.decode(value, { stream: true });
    }
    body += decoder2.decode();
    return body;
  } finally {
    reader.releaseLock();
  }
}
function parseUrl(url_) {
  try {
    const url = new URL(url_);
    const result = (() => {
      if (url.username) {
        const credentials = `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`;
        url.username = "";
        url.password = "";
        return {
          url: url.toString(),
          headers: { Authorization: `Basic ${btoa(credentials)}` }
        };
      }
      return;
    })();
    return { url: url.toString(), ...result };
  } catch {
    return { url: url_ };
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/hashMessage.js
init_keccak256();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/strings.js
var presignMessagePrefix = "Ethereum Signed Message:\n";

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/toPrefixedMessage.js
init_concat();
init_size();
init_toHex();
function toPrefixedMessage(message_) {
  const message = (() => {
    if (typeof message_ === "string")
      return stringToHex(message_);
    if (typeof message_.raw === "string")
      return message_.raw;
    return bytesToHex(message_.raw);
  })();
  const prefix = stringToHex(`${presignMessagePrefix}${size(message)}`);
  return concat([prefix, message]);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/hashMessage.js
function hashMessage(message, to_) {
  return keccak256(toPrefixedMessage(message), to_);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/hashTypedData.js
init_encodeAbiParameters();
init_concat();
init_toHex();
init_keccak256();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/typedData.js
init_abi();
init_address();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/typedData.js
init_stringify();
init_base();
var InvalidDomainError = class extends BaseError2 {
  constructor({ domain }) {
    super(`Invalid domain "${stringify(domain)}".`, {
      metaMessages: ["Must be a valid EIP-712 domain."]
    });
  }
};
var InvalidPrimaryTypeError = class extends BaseError2 {
  constructor({ primaryType, types }) {
    super(`Invalid primary type \`${primaryType}\` must be one of \`${JSON.stringify(Object.keys(types))}\`.`, {
      docsPath: "/api/glossary/Errors#typeddatainvalidprimarytypeerror",
      metaMessages: ["Check that the primary type is a key in `types`."]
    });
  }
};
var InvalidStructTypeError = class extends BaseError2 {
  constructor({ type }) {
    super(`Struct type "${type}" is invalid.`, {
      metaMessages: ["Struct type must not be a Solidity type."],
      name: "InvalidStructTypeError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/typedData.js
init_isAddress();
init_size();
init_toHex();
init_regex2();
function validateTypedData(parameters) {
  const { domain, message, primaryType, types } = parameters;
  const validateData = (struct, data) => {
    for (const param of struct) {
      const { name, type } = param;
      const value = data[name];
      const integerMatch = type.match(integerRegex2);
      if (integerMatch && (typeof value === "number" || typeof value === "bigint")) {
        const [_type, base, size_] = integerMatch;
        numberToHex(value, {
          signed: base === "int",
          size: Number.parseInt(size_, 10) / 8
        });
      }
      if (type === "address" && typeof value === "string" && !isAddress(value))
        throw new InvalidAddressError({ address: value });
      const bytesMatch = type.match(bytesRegex2);
      if (bytesMatch) {
        const [_type, size_] = bytesMatch;
        if (size_ && size(value) !== Number.parseInt(size_, 10))
          throw new BytesSizeMismatchError({
            expectedSize: Number.parseInt(size_, 10),
            givenSize: size(value)
          });
      }
      const struct2 = types[type];
      if (struct2) {
        validateReference(type);
        validateData(struct2, value);
      }
    }
  };
  if (types.EIP712Domain && domain) {
    if (typeof domain !== "object")
      throw new InvalidDomainError({ domain });
    validateData(types.EIP712Domain, domain);
  }
  if (primaryType !== "EIP712Domain") {
    if (types[primaryType])
      validateData(types[primaryType], message);
    else
      throw new InvalidPrimaryTypeError({ primaryType, types });
  }
}
function getTypesForEIP712Domain({ domain }) {
  return [
    typeof domain?.name === "string" && { name: "name", type: "string" },
    domain?.version && { name: "version", type: "string" },
    (typeof domain?.chainId === "number" || typeof domain?.chainId === "bigint") && {
      name: "chainId",
      type: "uint256"
    },
    domain?.verifyingContract && {
      name: "verifyingContract",
      type: "address"
    },
    domain?.salt && { name: "salt", type: "bytes32" }
  ].filter(Boolean);
}
function validateReference(type) {
  if (type === "address" || type === "bool" || type === "string" || type.startsWith("bytes") || type.startsWith("uint") || type.startsWith("int"))
    throw new InvalidStructTypeError({ type });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/hashTypedData.js
function hashTypedData(parameters) {
  const { domain = {}, message, primaryType } = parameters;
  const types = {
    EIP712Domain: getTypesForEIP712Domain({ domain }),
    ...parameters.types
  };
  validateTypedData({
    domain,
    message,
    primaryType,
    types
  });
  const parts = ["0x1901"];
  if (domain)
    parts.push(hashDomain({
      domain,
      types
    }));
  if (primaryType !== "EIP712Domain")
    parts.push(hashStruct({
      data: message,
      primaryType,
      types
    }));
  return keccak256(concat(parts));
}
function hashDomain({ domain, types }) {
  return hashStruct({
    data: domain,
    primaryType: "EIP712Domain",
    types
  });
}
function hashStruct({ data, primaryType, types }) {
  const encoded = encodeData({
    data,
    primaryType,
    types
  });
  return keccak256(encoded);
}
function encodeData({ data, primaryType, types }) {
  const encodedTypes = [{ type: "bytes32" }];
  const encodedValues = [hashType({ primaryType, types })];
  for (const field of types[primaryType]) {
    const [type, value] = encodeField({
      types,
      name: field.name,
      type: field.type,
      value: data[field.name]
    });
    encodedTypes.push(type);
    encodedValues.push(value);
  }
  return encodeAbiParameters(encodedTypes, encodedValues);
}
function hashType({ primaryType, types }) {
  const encodedHashType = toHex(encodeType({ primaryType, types }));
  return keccak256(encodedHashType);
}
function encodeType({ primaryType, types }) {
  let result = "";
  const unsortedDeps = findTypeDependencies({ primaryType, types });
  unsortedDeps.delete(primaryType);
  const deps = [primaryType, ...Array.from(unsortedDeps).sort()];
  for (const type of deps) {
    result += `${type}(${types[type].map(({ name, type: t }) => `${t} ${name}`).join(",")})`;
  }
  return result;
}
function findTypeDependencies({ primaryType: primaryType_, types }, results = /* @__PURE__ */ new Set()) {
  const match = primaryType_.match(/^\w*/u);
  const primaryType = match?.[0];
  if (results.has(primaryType) || types[primaryType] === void 0) {
    return results;
  }
  results.add(primaryType);
  for (const field of types[primaryType]) {
    findTypeDependencies({ primaryType: field.type, types }, results);
  }
  return results;
}
function encodeField({ types, name, type, value }) {
  if (types[type] !== void 0) {
    return [
      { type: "bytes32" },
      keccak256(encodeData({ data: value, primaryType: type, types }))
    ];
  }
  if (type === "bytes")
    return [{ type: "bytes32" }, keccak256(value)];
  if (type === "string")
    return [{ type: "bytes32" }, keccak256(toHex(value))];
  if (type.lastIndexOf("]") === type.length - 1) {
    const parsedType = type.slice(0, type.lastIndexOf("["));
    const typeValuePairs = value.map((item) => encodeField({
      name,
      type: parsedType,
      types,
      value: item
    }));
    return [
      { type: "bytes32" },
      keccak256(encodeAbiParameters(typeValuePairs.map(([t]) => t), typeValuePairs.map(([, v]) => v)))
    ];
  }
  return [{ type }, value];
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/erc8010/SignatureErc8010.js
var SignatureErc8010_exports = {};
__export(SignatureErc8010_exports, {
  InvalidWrappedSignatureError: () => InvalidWrappedSignatureError,
  assert: () => assert6,
  from: () => from9,
  magicBytes: () => magicBytes,
  suffixParameters: () => suffixParameters,
  unwrap: () => unwrap,
  validate: () => validate4,
  wrap: () => wrap
});

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiParameters.js
init_exports();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Address.js
init_Bytes();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/lru.js
var LruMap2 = class extends Map {
  constructor(size5) {
    super();
    Object.defineProperty(this, "maxSize", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.maxSize = size5;
  }
  get(key) {
    const value = super.get(key);
    if (super.has(key) && value !== void 0) {
      this.delete(key);
      super.set(key, value);
    }
    return value;
  }
  set(key, value) {
    super.set(key, value);
    if (this.maxSize && this.size > this.maxSize) {
      const firstKey = this.keys().next().value;
      if (firstKey)
        this.delete(firstKey);
    }
    return this;
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Caches.js
var caches = {
  checksum: /* @__PURE__ */ new LruMap2(8192)
};
var checksum = caches.checksum;

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Address.js
init_Errors();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Hash.js
init_sha3();
init_Bytes();
init_Hex();
function keccak2562(value, options = {}) {
  const { as = typeof value === "string" ? "Hex" : "Bytes" } = options;
  const bytes = keccak_256(from(value));
  if (as === "Bytes")
    return bytes;
  return fromBytes(bytes);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/PublicKey.js
init_Bytes();
init_Errors();
init_Hex();
init_Json();
function assert3(publicKey, options = {}) {
  const { compressed } = options;
  const { prefix, x, y } = publicKey;
  if (compressed === false || typeof x === "bigint" && typeof y === "bigint") {
    if (prefix !== 4)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidUncompressedPrefixError()
      });
    return;
  }
  if (compressed === true || typeof x === "bigint" && typeof y === "undefined") {
    if (prefix !== 3 && prefix !== 2)
      throw new InvalidPrefixError({
        prefix,
        cause: new InvalidCompressedPrefixError()
      });
    return;
  }
  throw new InvalidError({ publicKey });
}
function from3(value) {
  const publicKey = (() => {
    if (validate2(value))
      return fromHex2(value);
    if (validate(value))
      return fromBytes2(value);
    const { prefix, x, y } = value;
    if (typeof x === "bigint" && typeof y === "bigint")
      return { prefix: prefix ?? 4, x, y };
    return { prefix, x };
  })();
  assert3(publicKey);
  return publicKey;
}
function fromBytes2(publicKey) {
  return fromHex2(fromBytes(publicKey));
}
function fromHex2(publicKey) {
  if (publicKey.length !== 132 && publicKey.length !== 130 && publicKey.length !== 68)
    throw new InvalidSerializedSizeError({ publicKey });
  if (publicKey.length === 130) {
    const x2 = BigInt(slice3(publicKey, 0, 32));
    const y = BigInt(slice3(publicKey, 32, 64));
    return {
      prefix: 4,
      x: x2,
      y
    };
  }
  if (publicKey.length === 132) {
    const prefix2 = Number(slice3(publicKey, 0, 1));
    const x2 = BigInt(slice3(publicKey, 1, 33));
    const y = BigInt(slice3(publicKey, 33, 65));
    return {
      prefix: prefix2,
      x: x2,
      y
    };
  }
  const prefix = Number(slice3(publicKey, 0, 1));
  const x = BigInt(slice3(publicKey, 1, 33));
  return {
    prefix,
    x
  };
}
function toHex2(publicKey, options = {}) {
  assert3(publicKey);
  const { prefix, x, y } = publicKey;
  const { includePrefix = true } = options;
  const publicKey_ = concat2(
    includePrefix ? fromNumber(prefix, { size: 1 }) : "0x",
    fromNumber(x, { size: 32 }),
    // If the public key is not compressed, add the y coordinate.
    typeof y === "bigint" ? fromNumber(y, { size: 32 }) : "0x"
  );
  return publicKey_;
}
var InvalidError = class extends BaseError3 {
  constructor({ publicKey }) {
    super(`Value \`${stringify2(publicKey)}\` is not a valid public key.`, {
      metaMessages: [
        "Public key must contain:",
        "- an `x` and `prefix` value (compressed)",
        "- an `x`, `y`, and `prefix` value (uncompressed)"
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidError"
    });
  }
};
var InvalidPrefixError = class extends BaseError3 {
  constructor({ prefix, cause }) {
    super(`Prefix "${prefix}" is invalid.`, {
      cause
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidPrefixError"
    });
  }
};
var InvalidCompressedPrefixError = class extends BaseError3 {
  constructor() {
    super("Prefix must be 2 or 3 for compressed public keys.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidCompressedPrefixError"
    });
  }
};
var InvalidUncompressedPrefixError = class extends BaseError3 {
  constructor() {
    super("Prefix must be 4 for uncompressed public keys.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidUncompressedPrefixError"
    });
  }
};
var InvalidSerializedSizeError = class extends BaseError3 {
  constructor({ publicKey }) {
    super(`Value \`${publicKey}\` is an invalid public key size.`, {
      metaMessages: [
        "Expected: 33 bytes (compressed + prefix), 64 bytes (uncompressed) or 65 bytes (uncompressed + prefix).",
        `Received ${size3(from2(publicKey))} bytes.`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "PublicKey.InvalidSerializedSizeError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Address.js
var addressRegex2 = /^0x[a-fA-F0-9]{40}$/;
function assert4(value, options = {}) {
  const { strict = true } = options;
  if (!addressRegex2.test(value))
    throw new InvalidAddressError2({
      address: value,
      cause: new InvalidInputError()
    });
  if (strict) {
    if (value.toLowerCase() === value)
      return;
    if (checksum2(value) !== value)
      throw new InvalidAddressError2({
        address: value,
        cause: new InvalidChecksumError()
      });
  }
}
function checksum2(address) {
  if (checksum.has(address))
    return checksum.get(address);
  assert4(address, { strict: false });
  const hexAddress = address.substring(2).toLowerCase();
  const hash3 = keccak2562(fromString(hexAddress), { as: "Bytes" });
  const characters = hexAddress.split("");
  for (let i = 0; i < 40; i += 2) {
    if (hash3[i >> 1] >> 4 >= 8 && characters[i]) {
      characters[i] = characters[i].toUpperCase();
    }
    if ((hash3[i >> 1] & 15) >= 8 && characters[i + 1]) {
      characters[i + 1] = characters[i + 1].toUpperCase();
    }
  }
  const result = `0x${characters.join("")}`;
  checksum.set(address, result);
  return result;
}
function from4(address, options = {}) {
  const { checksum: checksumVal = false } = options;
  assert4(address);
  if (checksumVal)
    return checksum2(address);
  return address;
}
function fromPublicKey(publicKey, options = {}) {
  const address = keccak2562(`0x${toHex2(publicKey).slice(4)}`).substring(26);
  return from4(`0x${address}`, options);
}
function validate3(address, options = {}) {
  const { strict = true } = options ?? {};
  try {
    assert4(address, { strict });
    return true;
  } catch {
    return false;
  }
}
var InvalidAddressError2 = class extends BaseError3 {
  constructor({ address, cause }) {
    super(`Address "${address}" is invalid.`, {
      cause
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidAddressError"
    });
  }
};
var InvalidInputError = class extends BaseError3 {
  constructor() {
    super("Address is not a 20 byte (40 hexadecimal character) value.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidInputError"
    });
  }
};
var InvalidChecksumError = class extends BaseError3 {
  constructor() {
    super("Address does not match its checksum counterpart.");
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Address.InvalidChecksumError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiParameters.js
init_Bytes();
init_Errors();
init_Hex();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/abiParameters.js
init_Bytes();
init_Errors();
init_Hex();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Solidity.js
var arrayRegex = /^(.*)\[([0-9]*)\]$/;
var bytesRegex3 = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
var integerRegex3 = /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
var maxInt82 = 2n ** (8n - 1n) - 1n;
var maxInt162 = 2n ** (16n - 1n) - 1n;
var maxInt242 = 2n ** (24n - 1n) - 1n;
var maxInt322 = 2n ** (32n - 1n) - 1n;
var maxInt402 = 2n ** (40n - 1n) - 1n;
var maxInt482 = 2n ** (48n - 1n) - 1n;
var maxInt562 = 2n ** (56n - 1n) - 1n;
var maxInt642 = 2n ** (64n - 1n) - 1n;
var maxInt722 = 2n ** (72n - 1n) - 1n;
var maxInt802 = 2n ** (80n - 1n) - 1n;
var maxInt882 = 2n ** (88n - 1n) - 1n;
var maxInt962 = 2n ** (96n - 1n) - 1n;
var maxInt1042 = 2n ** (104n - 1n) - 1n;
var maxInt1122 = 2n ** (112n - 1n) - 1n;
var maxInt1202 = 2n ** (120n - 1n) - 1n;
var maxInt1282 = 2n ** (128n - 1n) - 1n;
var maxInt1362 = 2n ** (136n - 1n) - 1n;
var maxInt1442 = 2n ** (144n - 1n) - 1n;
var maxInt1522 = 2n ** (152n - 1n) - 1n;
var maxInt1602 = 2n ** (160n - 1n) - 1n;
var maxInt1682 = 2n ** (168n - 1n) - 1n;
var maxInt1762 = 2n ** (176n - 1n) - 1n;
var maxInt1842 = 2n ** (184n - 1n) - 1n;
var maxInt1922 = 2n ** (192n - 1n) - 1n;
var maxInt2002 = 2n ** (200n - 1n) - 1n;
var maxInt2082 = 2n ** (208n - 1n) - 1n;
var maxInt2162 = 2n ** (216n - 1n) - 1n;
var maxInt2242 = 2n ** (224n - 1n) - 1n;
var maxInt2322 = 2n ** (232n - 1n) - 1n;
var maxInt2402 = 2n ** (240n - 1n) - 1n;
var maxInt2482 = 2n ** (248n - 1n) - 1n;
var maxInt2562 = 2n ** (256n - 1n) - 1n;
var minInt82 = -(2n ** (8n - 1n));
var minInt162 = -(2n ** (16n - 1n));
var minInt242 = -(2n ** (24n - 1n));
var minInt322 = -(2n ** (32n - 1n));
var minInt402 = -(2n ** (40n - 1n));
var minInt482 = -(2n ** (48n - 1n));
var minInt562 = -(2n ** (56n - 1n));
var minInt642 = -(2n ** (64n - 1n));
var minInt722 = -(2n ** (72n - 1n));
var minInt802 = -(2n ** (80n - 1n));
var minInt882 = -(2n ** (88n - 1n));
var minInt962 = -(2n ** (96n - 1n));
var minInt1042 = -(2n ** (104n - 1n));
var minInt1122 = -(2n ** (112n - 1n));
var minInt1202 = -(2n ** (120n - 1n));
var minInt1282 = -(2n ** (128n - 1n));
var minInt1362 = -(2n ** (136n - 1n));
var minInt1442 = -(2n ** (144n - 1n));
var minInt1522 = -(2n ** (152n - 1n));
var minInt1602 = -(2n ** (160n - 1n));
var minInt1682 = -(2n ** (168n - 1n));
var minInt1762 = -(2n ** (176n - 1n));
var minInt1842 = -(2n ** (184n - 1n));
var minInt1922 = -(2n ** (192n - 1n));
var minInt2002 = -(2n ** (200n - 1n));
var minInt2082 = -(2n ** (208n - 1n));
var minInt2162 = -(2n ** (216n - 1n));
var minInt2242 = -(2n ** (224n - 1n));
var minInt2322 = -(2n ** (232n - 1n));
var minInt2402 = -(2n ** (240n - 1n));
var minInt2482 = -(2n ** (248n - 1n));
var minInt2562 = -(2n ** (256n - 1n));
var maxUint82 = 2n ** 8n - 1n;
var maxUint162 = 2n ** 16n - 1n;
var maxUint242 = 2n ** 24n - 1n;
var maxUint322 = 2n ** 32n - 1n;
var maxUint402 = 2n ** 40n - 1n;
var maxUint482 = 2n ** 48n - 1n;
var maxUint562 = 2n ** 56n - 1n;
var maxUint642 = 2n ** 64n - 1n;
var maxUint722 = 2n ** 72n - 1n;
var maxUint802 = 2n ** 80n - 1n;
var maxUint882 = 2n ** 88n - 1n;
var maxUint962 = 2n ** 96n - 1n;
var maxUint1042 = 2n ** 104n - 1n;
var maxUint1122 = 2n ** 112n - 1n;
var maxUint1202 = 2n ** 120n - 1n;
var maxUint1282 = 2n ** 128n - 1n;
var maxUint1362 = 2n ** 136n - 1n;
var maxUint1442 = 2n ** 144n - 1n;
var maxUint1522 = 2n ** 152n - 1n;
var maxUint1602 = 2n ** 160n - 1n;
var maxUint1682 = 2n ** 168n - 1n;
var maxUint1762 = 2n ** 176n - 1n;
var maxUint1842 = 2n ** 184n - 1n;
var maxUint1922 = 2n ** 192n - 1n;
var maxUint2002 = 2n ** 200n - 1n;
var maxUint2082 = 2n ** 208n - 1n;
var maxUint2162 = 2n ** 216n - 1n;
var maxUint2242 = 2n ** 224n - 1n;
var maxUint2322 = 2n ** 232n - 1n;
var maxUint2402 = 2n ** 240n - 1n;
var maxUint2482 = 2n ** 248n - 1n;
var maxUint2562 = 2n ** 256n - 1n;

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/abiParameters.js
function decodeParameter2(cursor, param, options) {
  const { checksumAddress: checksumAddress2, staticPosition } = options;
  const arrayComponents = getArrayComponents2(param.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return decodeArray2(cursor, { ...param, type }, { checksumAddress: checksumAddress2, length, staticPosition });
  }
  if (param.type === "tuple")
    return decodeTuple2(cursor, param, {
      checksumAddress: checksumAddress2,
      staticPosition
    });
  if (param.type === "address")
    return decodeAddress3(cursor, { checksum: checksumAddress2 });
  if (param.type === "bool")
    return decodeBool2(cursor);
  if (param.type.startsWith("bytes"))
    return decodeBytes2(cursor, param, { staticPosition });
  if (param.type.startsWith("uint") || param.type.startsWith("int"))
    return decodeNumber2(cursor, param);
  if (param.type === "string")
    return decodeString2(cursor, { staticPosition });
  throw new InvalidTypeError(param.type);
}
var sizeOfLength2 = 32;
var sizeOfOffset2 = 32;
function decodeAddress3(cursor, options = {}) {
  const { checksum: checksum3 = false } = options;
  const value = cursor.readBytes(32);
  const wrap3 = (address) => checksum3 ? checksum2(address) : address;
  return [wrap3(fromBytes(slice2(value, -20))), 32];
}
function decodeArray2(cursor, param, options) {
  const { checksumAddress: checksumAddress2, length, staticPosition } = options;
  if (!length) {
    const offset = toNumber2(cursor.readBytes(sizeOfOffset2));
    const start = staticPosition + offset;
    const startOfData = start + sizeOfLength2;
    cursor.setPosition(start);
    const length2 = toNumber2(cursor.readBytes(sizeOfLength2));
    const dynamicChild = hasDynamicChild2(param);
    let consumed2 = 0;
    const value2 = [];
    for (let i = 0; i < length2; ++i) {
      cursor.setPosition(startOfData + (dynamicChild ? i * 32 : consumed2));
      const [data, consumed_] = decodeParameter2(cursor, param, {
        checksumAddress: checksumAddress2,
        staticPosition: startOfData
      });
      consumed2 += consumed_;
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  if (hasDynamicChild2(param)) {
    const offset = toNumber2(cursor.readBytes(sizeOfOffset2));
    const start = staticPosition + offset;
    const value2 = [];
    for (let i = 0; i < length; ++i) {
      cursor.setPosition(start + i * 32);
      const [data] = decodeParameter2(cursor, param, {
        checksumAddress: checksumAddress2,
        staticPosition: start
      });
      value2.push(data);
    }
    cursor.setPosition(staticPosition + 32);
    return [value2, 32];
  }
  let consumed = 0;
  const value = [];
  for (let i = 0; i < length; ++i) {
    const [data, consumed_] = decodeParameter2(cursor, param, {
      checksumAddress: checksumAddress2,
      staticPosition: staticPosition + consumed
    });
    consumed += consumed_;
    value.push(data);
  }
  return [value, consumed];
}
function decodeBool2(cursor) {
  return [toBoolean(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes2(cursor, param, { staticPosition }) {
  const [_, size5] = param.type.split("bytes");
  if (!size5) {
    const offset = toNumber2(cursor.readBytes(32));
    cursor.setPosition(staticPosition + offset);
    const length = toNumber2(cursor.readBytes(32));
    if (length === 0) {
      cursor.setPosition(staticPosition + 32);
      return ["0x", 32];
    }
    const data = cursor.readBytes(length);
    cursor.setPosition(staticPosition + 32);
    return [fromBytes(data), 32];
  }
  const value = fromBytes(cursor.readBytes(Number.parseInt(size5, 10), 32));
  return [value, 32];
}
function decodeNumber2(cursor, param) {
  const signed = param.type.startsWith("int");
  const size5 = Number.parseInt(param.type.split("int")[1] || "256", 10);
  const value = cursor.readBytes(32);
  return [
    size5 > 48 ? toBigInt2(value, { signed }) : toNumber2(value, { signed }),
    32
  ];
}
function decodeTuple2(cursor, param, options) {
  const { checksumAddress: checksumAddress2, staticPosition } = options;
  const hasUnnamedChild = param.components.length === 0 || param.components.some(({ name }) => !name);
  const value = hasUnnamedChild ? [] : {};
  let consumed = 0;
  if (hasDynamicChild2(param)) {
    const offset = toNumber2(cursor.readBytes(sizeOfOffset2));
    const start = staticPosition + offset;
    for (let i = 0; i < param.components.length; ++i) {
      const component = param.components[i];
      cursor.setPosition(start + consumed);
      const [data, consumed_] = decodeParameter2(cursor, component, {
        checksumAddress: checksumAddress2,
        staticPosition: start
      });
      consumed += consumed_;
      value[hasUnnamedChild ? i : component?.name] = data;
    }
    cursor.setPosition(staticPosition + 32);
    return [value, 32];
  }
  for (let i = 0; i < param.components.length; ++i) {
    const component = param.components[i];
    const [data, consumed_] = decodeParameter2(cursor, component, {
      checksumAddress: checksumAddress2,
      staticPosition
    });
    value[hasUnnamedChild ? i : component?.name] = data;
    consumed += consumed_;
  }
  return [value, consumed];
}
function decodeString2(cursor, { staticPosition }) {
  const offset = toNumber2(cursor.readBytes(32));
  const start = staticPosition + offset;
  cursor.setPosition(start);
  const length = toNumber2(cursor.readBytes(32));
  if (length === 0) {
    cursor.setPosition(staticPosition + 32);
    return ["", 32];
  }
  const data = cursor.readBytes(length, 32);
  const value = toString(trimLeft(data));
  cursor.setPosition(staticPosition + 32);
  return [value, 32];
}
function prepareParameters({ checksumAddress: checksumAddress2, parameters, values }) {
  const preparedParameters = [];
  for (let i = 0; i < parameters.length; i++) {
    preparedParameters.push(prepareParameter({
      checksumAddress: checksumAddress2,
      parameter: parameters[i],
      value: values[i]
    }));
  }
  return preparedParameters;
}
function prepareParameter({ checksumAddress: checksumAddress2 = false, parameter: parameter_, value }) {
  const parameter = parameter_;
  const arrayComponents = getArrayComponents2(parameter.type);
  if (arrayComponents) {
    const [length, type] = arrayComponents;
    return encodeArray2(value, {
      checksumAddress: checksumAddress2,
      length,
      parameter: {
        ...parameter,
        type
      }
    });
  }
  if (parameter.type === "tuple") {
    return encodeTuple2(value, {
      checksumAddress: checksumAddress2,
      parameter
    });
  }
  if (parameter.type === "address") {
    return encodeAddress2(value, {
      checksum: checksumAddress2
    });
  }
  if (parameter.type === "bool") {
    return encodeBoolean(value);
  }
  if (parameter.type.startsWith("uint") || parameter.type.startsWith("int")) {
    const signed = parameter.type.startsWith("int");
    const [, , size5 = "256"] = integerRegex3.exec(parameter.type) ?? [];
    return encodeNumber2(value, {
      signed,
      size: Number(size5)
    });
  }
  if (parameter.type.startsWith("bytes")) {
    return encodeBytes2(value, { type: parameter.type });
  }
  if (parameter.type === "string") {
    return encodeString2(value);
  }
  throw new InvalidTypeError(parameter.type);
}
function encode(preparedParameters) {
  let staticSize = 0;
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i];
    if (dynamic)
      staticSize += 32;
    else
      staticSize += size3(encoded);
  }
  const staticParameters = [];
  const dynamicParameters = [];
  let dynamicSize = 0;
  for (let i = 0; i < preparedParameters.length; i++) {
    const { dynamic, encoded } = preparedParameters[i];
    if (dynamic) {
      staticParameters.push(fromNumber(staticSize + dynamicSize, { size: 32 }));
      dynamicParameters.push(encoded);
      dynamicSize += size3(encoded);
    } else {
      staticParameters.push(encoded);
    }
  }
  return concat2(...staticParameters, ...dynamicParameters);
}
function encodeAddress2(value, options) {
  const { checksum: checksum3 = false } = options;
  assert4(value, { strict: checksum3 });
  return {
    dynamic: false,
    encoded: padLeft(value.toLowerCase())
  };
}
function encodeArray2(value, options) {
  const { checksumAddress: checksumAddress2, length, parameter } = options;
  const dynamic = length === null;
  if (!Array.isArray(value))
    throw new InvalidArrayError2(value);
  if (!dynamic && value.length !== length)
    throw new ArrayLengthMismatchError({
      expectedLength: length,
      givenLength: value.length,
      type: `${parameter.type}[${length}]`
    });
  let dynamicChild = false;
  const preparedParameters = [];
  for (let i = 0; i < value.length; i++) {
    const preparedParam = prepareParameter({
      checksumAddress: checksumAddress2,
      parameter,
      value: value[i]
    });
    if (preparedParam.dynamic)
      dynamicChild = true;
    preparedParameters.push(preparedParam);
  }
  if (dynamic || dynamicChild) {
    const data = encode(preparedParameters);
    if (dynamic) {
      const length2 = fromNumber(preparedParameters.length, { size: 32 });
      return {
        dynamic: true,
        encoded: preparedParameters.length > 0 ? concat2(length2, data) : length2
      };
    }
    if (dynamicChild)
      return { dynamic: true, encoded: data };
  }
  return {
    dynamic: false,
    encoded: concat2(...preparedParameters.map(({ encoded }) => encoded))
  };
}
function encodeBytes2(value, { type }) {
  const [, parametersize] = type.split("bytes");
  const bytesSize = size3(value);
  if (!parametersize) {
    let value_ = value;
    if (bytesSize % 32 !== 0)
      value_ = padRight(value_, Math.ceil((value.length - 2) / 2 / 32) * 32);
    return {
      dynamic: true,
      encoded: concat2(padLeft(fromNumber(bytesSize, { size: 32 })), value_)
    };
  }
  if (bytesSize !== Number.parseInt(parametersize, 10))
    throw new BytesSizeMismatchError2({
      expectedSize: Number.parseInt(parametersize, 10),
      value
    });
  return { dynamic: false, encoded: padRight(value) };
}
function encodeBoolean(value) {
  if (typeof value !== "boolean")
    throw new BaseError3(`Invalid boolean value: "${value}" (type: ${typeof value}). Expected: \`true\` or \`false\`.`);
  return { dynamic: false, encoded: padLeft(fromBoolean(value)) };
}
function encodeNumber2(value, { signed, size: size5 }) {
  if (typeof size5 === "number") {
    const max = 2n ** (BigInt(size5) - (signed ? 1n : 0n)) - 1n;
    const min = signed ? -max - 1n : 0n;
    if (value > max || value < min)
      throw new IntegerOutOfRangeError2({
        max: max.toString(),
        min: min.toString(),
        signed,
        size: size5 / 8,
        value: value.toString()
      });
  }
  return {
    dynamic: false,
    encoded: fromNumber(value, {
      size: 32,
      signed
    })
  };
}
function encodeString2(value) {
  const hexValue = fromString2(value);
  const partsLength = Math.ceil(size3(hexValue) / 32);
  const parts = [];
  for (let i = 0; i < partsLength; i++) {
    parts.push(padRight(slice3(hexValue, i * 32, (i + 1) * 32)));
  }
  return {
    dynamic: true,
    encoded: concat2(padRight(fromNumber(size3(hexValue), { size: 32 })), ...parts)
  };
}
function encodeTuple2(value, options) {
  const { checksumAddress: checksumAddress2, parameter } = options;
  let dynamic = false;
  const preparedParameters = [];
  for (let i = 0; i < parameter.components.length; i++) {
    const param_ = parameter.components[i];
    const index2 = Array.isArray(value) ? i : param_.name;
    const preparedParam = prepareParameter({
      checksumAddress: checksumAddress2,
      parameter: param_,
      value: value[index2]
    });
    preparedParameters.push(preparedParam);
    if (preparedParam.dynamic)
      dynamic = true;
  }
  return {
    dynamic,
    encoded: dynamic ? encode(preparedParameters) : concat2(...preparedParameters.map(({ encoded }) => encoded))
  };
}
function getArrayComponents2(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}
function hasDynamicChild2(param) {
  const { type } = param;
  if (type === "string")
    return true;
  if (type === "bytes")
    return true;
  if (type.endsWith("[]"))
    return true;
  if (type === "tuple")
    return param.components?.some(hasDynamicChild2);
  const arrayComponents = getArrayComponents2(param.type);
  if (arrayComponents && hasDynamicChild2({
    ...param,
    type: arrayComponents[1]
  }))
    return true;
  return false;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/cursor.js
init_Errors();
var staticCursor2 = {
  bytes: new Uint8Array(),
  dataView: new DataView(new ArrayBuffer(0)),
  position: 0,
  positionReadCount: /* @__PURE__ */ new Map(),
  recursiveReadCount: 0,
  recursiveReadLimit: Number.POSITIVE_INFINITY,
  assertReadLimit() {
    if (this.recursiveReadCount >= this.recursiveReadLimit)
      throw new RecursiveReadLimitExceededError2({
        count: this.recursiveReadCount + 1,
        limit: this.recursiveReadLimit
      });
  },
  assertPosition(position) {
    if (position < 0 || position > this.bytes.length - 1)
      throw new PositionOutOfBoundsError2({
        length: this.bytes.length,
        position
      });
  },
  decrementPosition(offset) {
    if (offset < 0)
      throw new NegativeOffsetError2({ offset });
    const position = this.position - offset;
    this.assertPosition(position);
    this.position = position;
  },
  getReadCount(position) {
    return this.positionReadCount.get(position || this.position) || 0;
  },
  incrementPosition(offset) {
    if (offset < 0)
      throw new NegativeOffsetError2({ offset });
    const position = this.position + offset;
    this.assertPosition(position);
    this.position = position;
  },
  inspectByte(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position);
    return this.bytes[position];
  },
  inspectBytes(length, position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + length - 1);
    return this.bytes.subarray(position, position + length);
  },
  inspectUint8(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position);
    return this.bytes[position];
  },
  inspectUint16(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 1);
    return this.dataView.getUint16(position);
  },
  inspectUint24(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 2);
    return (this.dataView.getUint16(position) << 8) + this.dataView.getUint8(position + 2);
  },
  inspectUint32(position_) {
    const position = position_ ?? this.position;
    this.assertPosition(position + 3);
    return this.dataView.getUint32(position);
  },
  pushByte(byte) {
    this.assertPosition(this.position);
    this.bytes[this.position] = byte;
    this.position++;
  },
  pushBytes(bytes) {
    this.assertPosition(this.position + bytes.length - 1);
    this.bytes.set(bytes, this.position);
    this.position += bytes.length;
  },
  pushUint8(value) {
    this.assertPosition(this.position);
    this.bytes[this.position] = value;
    this.position++;
  },
  pushUint16(value) {
    this.assertPosition(this.position + 1);
    this.dataView.setUint16(this.position, value);
    this.position += 2;
  },
  pushUint24(value) {
    this.assertPosition(this.position + 2);
    this.dataView.setUint16(this.position, value >> 8);
    this.dataView.setUint8(this.position + 2, value & ~4294967040);
    this.position += 3;
  },
  pushUint32(value) {
    this.assertPosition(this.position + 3);
    this.dataView.setUint32(this.position, value);
    this.position += 4;
  },
  readByte() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectByte();
    this.position++;
    return value;
  },
  readBytes(length, size5) {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectBytes(length);
    this.position += size5 ?? length;
    return value;
  },
  readUint8() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint8();
    this.position += 1;
    return value;
  },
  readUint16() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint16();
    this.position += 2;
    return value;
  },
  readUint24() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint24();
    this.position += 3;
    return value;
  },
  readUint32() {
    this.assertReadLimit();
    this._touch();
    const value = this.inspectUint32();
    this.position += 4;
    return value;
  },
  get remaining() {
    return this.bytes.length - this.position;
  },
  setPosition(position) {
    const oldPosition = this.position;
    this.assertPosition(position);
    this.position = position;
    return () => this.position = oldPosition;
  },
  _touch() {
    if (this.recursiveReadLimit === Number.POSITIVE_INFINITY)
      return;
    const count = this.getReadCount();
    this.positionReadCount.set(this.position, count + 1);
    if (count > 0)
      this.recursiveReadCount++;
  }
};
function create(bytes, { recursiveReadLimit = 8192 } = {}) {
  const cursor = Object.create(staticCursor2);
  cursor.bytes = bytes;
  cursor.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  cursor.positionReadCount = /* @__PURE__ */ new Map();
  cursor.recursiveReadLimit = recursiveReadLimit;
  return cursor;
}
var NegativeOffsetError2 = class extends BaseError3 {
  constructor({ offset }) {
    super(`Offset \`${offset}\` cannot be negative.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.NegativeOffsetError"
    });
  }
};
var PositionOutOfBoundsError2 = class extends BaseError3 {
  constructor({ length, position }) {
    super(`Position \`${position}\` is out of bounds (\`0 < position < ${length}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.PositionOutOfBoundsError"
    });
  }
};
var RecursiveReadLimitExceededError2 = class extends BaseError3 {
  constructor({ count, limit }) {
    super(`Recursive read limit of \`${limit}\` exceeded (recursive read count: \`${count}\`).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Cursor.RecursiveReadLimitExceededError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiParameters.js
function decode(parameters, data, options = {}) {
  const { as = "Array", checksumAddress: checksumAddress2 = false } = options;
  const bytes = typeof data === "string" ? fromHex(data) : data;
  const cursor = create(bytes);
  if (size2(bytes) === 0 && parameters.length > 0)
    throw new ZeroDataError();
  if (size2(bytes) && size2(bytes) < 32)
    throw new DataSizeTooSmallError({
      data: typeof data === "string" ? data : fromBytes(data),
      parameters,
      size: size2(bytes)
    });
  let consumed = 0;
  const values = as === "Array" ? [] : {};
  for (let i = 0; i < parameters.length; ++i) {
    const param = parameters[i];
    cursor.setPosition(consumed);
    const [data2, consumed_] = decodeParameter2(cursor, param, {
      checksumAddress: checksumAddress2,
      staticPosition: 0
    });
    consumed += consumed_;
    if (as === "Array")
      values.push(data2);
    else
      values[param.name ?? i] = data2;
  }
  return values;
}
function encode2(parameters, values, options) {
  const { checksumAddress: checksumAddress2 = false } = options ?? {};
  if (parameters.length !== values.length)
    throw new LengthMismatchError({
      expectedLength: parameters.length,
      givenLength: values.length
    });
  const preparedParameters = prepareParameters({
    checksumAddress: checksumAddress2,
    parameters,
    values
  });
  const data = encode(preparedParameters);
  if (data.length === 0)
    return "0x";
  return data;
}
function encodePacked(types, values) {
  if (types.length !== values.length)
    throw new LengthMismatchError({
      expectedLength: types.length,
      givenLength: values.length
    });
  const data = [];
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];
    data.push(encodePacked.encode(type, value));
  }
  return concat2(...data);
}
(function(encodePacked2) {
  function encode4(type, value, isArray = false) {
    if (type === "address") {
      const address = value;
      assert4(address);
      return padLeft(address.toLowerCase(), isArray ? 32 : 0);
    }
    if (type === "string")
      return fromString2(value);
    if (type === "bytes")
      return value;
    if (type === "bool")
      return padLeft(fromBoolean(value), isArray ? 32 : 1);
    const intMatch = type.match(integerRegex3);
    if (intMatch) {
      const [_type, baseType, bits = "256"] = intMatch;
      const size5 = Number.parseInt(bits, 10) / 8;
      return fromNumber(value, {
        size: isArray ? 32 : size5,
        signed: baseType === "int"
      });
    }
    const bytesMatch = type.match(bytesRegex3);
    if (bytesMatch) {
      const [_type, size5] = bytesMatch;
      if (Number.parseInt(size5, 10) !== (value.length - 2) / 2)
        throw new BytesSizeMismatchError2({
          expectedSize: Number.parseInt(size5, 10),
          value
        });
      return padRight(value, isArray ? 32 : 0);
    }
    const arrayMatch = type.match(arrayRegex);
    if (arrayMatch && Array.isArray(value)) {
      const [_type, childType] = arrayMatch;
      const data = [];
      for (let i = 0; i < value.length; i++) {
        data.push(encode4(childType, value[i], true));
      }
      if (data.length === 0)
        return "0x";
      return concat2(...data);
    }
    throw new InvalidTypeError(type);
  }
  encodePacked2.encode = encode4;
})(encodePacked || (encodePacked = {}));
function from5(parameters) {
  if (Array.isArray(parameters) && typeof parameters[0] === "string")
    return parseAbiParameters(parameters);
  if (typeof parameters === "string")
    return parseAbiParameters(parameters);
  return parameters;
}
var DataSizeTooSmallError = class extends BaseError3 {
  constructor({ data, parameters, size: size5 }) {
    super(`Data size of ${size5} bytes is too small for given parameters.`, {
      metaMessages: [
        `Params: (${formatAbiParameters(parameters)})`,
        `Data:   ${data} (${size5} bytes)`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.DataSizeTooSmallError"
    });
  }
};
var ZeroDataError = class extends BaseError3 {
  constructor() {
    super('Cannot decode zero data ("0x") with ABI parameters.');
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.ZeroDataError"
    });
  }
};
var ArrayLengthMismatchError = class extends BaseError3 {
  constructor({ expectedLength, givenLength, type }) {
    super(`Array length mismatch for type \`${type}\`. Expected: \`${expectedLength}\`. Given: \`${givenLength}\`.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.ArrayLengthMismatchError"
    });
  }
};
var BytesSizeMismatchError2 = class extends BaseError3 {
  constructor({ expectedSize, value }) {
    super(`Size of bytes "${value}" (bytes${size3(value)}) does not match expected size (bytes${expectedSize}).`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.BytesSizeMismatchError"
    });
  }
};
var LengthMismatchError = class extends BaseError3 {
  constructor({ expectedLength, givenLength }) {
    super([
      "ABI encoding parameters/values length mismatch.",
      `Expected length (parameters): ${expectedLength}`,
      `Given length (values): ${givenLength}`
    ].join("\n"));
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.LengthMismatchError"
    });
  }
};
var InvalidArrayError2 = class extends BaseError3 {
  constructor(value) {
    super(`Value \`${value}\` is not a valid array.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.InvalidArrayError"
    });
  }
};
var InvalidTypeError = class extends BaseError3 {
  constructor(type) {
    super(`Type \`${type}\` is not a valid ABI Type.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiParameters.InvalidTypeError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Authorization.js
init_Hex();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Rlp.js
init_Bytes();
init_Errors();
init_Hex();
function from6(value, options) {
  const { as } = options;
  const encodable = getEncodable2(value);
  const cursor = create(new Uint8Array(encodable.length));
  encodable.encode(cursor);
  if (as === "Hex")
    return fromBytes(cursor.bytes);
  return cursor.bytes;
}
function fromHex3(hex, options = {}) {
  const { as = "Hex" } = options;
  return from6(hex, { as });
}
function getEncodable2(bytes) {
  if (Array.isArray(bytes))
    return getEncodableList2(bytes.map((x) => getEncodable2(x)));
  return getEncodableBytes2(bytes);
}
function getEncodableList2(list) {
  const bodyLength = list.reduce((acc, x) => acc + x.length, 0);
  const sizeOfBodyLength = getSizeOfLength2(bodyLength);
  const length = (() => {
    if (bodyLength <= 55)
      return 1 + bodyLength;
    return 1 + sizeOfBodyLength + bodyLength;
  })();
  return {
    length,
    encode(cursor) {
      if (bodyLength <= 55) {
        cursor.pushByte(192 + bodyLength);
      } else {
        cursor.pushByte(192 + 55 + sizeOfBodyLength);
        if (sizeOfBodyLength === 1)
          cursor.pushUint8(bodyLength);
        else if (sizeOfBodyLength === 2)
          cursor.pushUint16(bodyLength);
        else if (sizeOfBodyLength === 3)
          cursor.pushUint24(bodyLength);
        else
          cursor.pushUint32(bodyLength);
      }
      for (const { encode: encode4 } of list) {
        encode4(cursor);
      }
    }
  };
}
function getEncodableBytes2(bytesOrHex) {
  const bytes = typeof bytesOrHex === "string" ? fromHex(bytesOrHex) : bytesOrHex;
  const sizeOfBytesLength = getSizeOfLength2(bytes.length);
  const length = (() => {
    if (bytes.length === 1 && bytes[0] < 128)
      return 1;
    if (bytes.length <= 55)
      return 1 + bytes.length;
    return 1 + sizeOfBytesLength + bytes.length;
  })();
  return {
    length,
    encode(cursor) {
      if (bytes.length === 1 && bytes[0] < 128) {
        cursor.pushBytes(bytes);
      } else if (bytes.length <= 55) {
        cursor.pushByte(128 + bytes.length);
        cursor.pushBytes(bytes);
      } else {
        cursor.pushByte(128 + 55 + sizeOfBytesLength);
        if (sizeOfBytesLength === 1)
          cursor.pushUint8(bytes.length);
        else if (sizeOfBytesLength === 2)
          cursor.pushUint16(bytes.length);
        else if (sizeOfBytesLength === 3)
          cursor.pushUint24(bytes.length);
        else
          cursor.pushUint32(bytes.length);
        cursor.pushBytes(bytes);
      }
    }
  };
}
function getSizeOfLength2(length) {
  if (length <= 255)
    return 1;
  if (length <= 65535)
    return 2;
  if (length <= 16777215)
    return 3;
  if (length <= 4294967295)
    return 4;
  throw new BaseError3("Length is too large.");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Signature.js
init_Errors();
init_Hex();
init_Json();
function assert5(signature, options = {}) {
  const { recovered } = options;
  if (typeof signature.r === "undefined")
    throw new MissingPropertiesError({ signature });
  if (typeof signature.s === "undefined")
    throw new MissingPropertiesError({ signature });
  if (recovered && typeof signature.yParity === "undefined")
    throw new MissingPropertiesError({ signature });
  if (signature.r < 0n || signature.r > maxUint2562)
    throw new InvalidRError({ value: signature.r });
  if (signature.s < 0n || signature.s > maxUint2562)
    throw new InvalidSError({ value: signature.s });
  if (typeof signature.yParity === "number" && signature.yParity !== 0 && signature.yParity !== 1)
    throw new InvalidYParityError2({ value: signature.yParity });
}
function fromBytes3(signature) {
  return fromHex4(fromBytes(signature));
}
function fromHex4(signature) {
  if (signature.length !== 130 && signature.length !== 132)
    throw new InvalidSerializedSizeError2({ signature });
  const r = BigInt(slice3(signature, 0, 32));
  const s = BigInt(slice3(signature, 32, 64));
  const yParity = (() => {
    const yParity2 = Number(`0x${signature.slice(130)}`);
    if (Number.isNaN(yParity2))
      return void 0;
    try {
      return vToYParity(yParity2);
    } catch {
      throw new InvalidYParityError2({ value: yParity2 });
    }
  })();
  if (typeof yParity === "undefined")
    return {
      r,
      s
    };
  return {
    r,
    s,
    yParity
  };
}
function extract2(value) {
  if (typeof value.r === "undefined")
    return void 0;
  if (typeof value.s === "undefined")
    return void 0;
  return from7(value);
}
function from7(signature) {
  const signature_ = (() => {
    if (typeof signature === "string")
      return fromHex4(signature);
    if (signature instanceof Uint8Array)
      return fromBytes3(signature);
    if (typeof signature.r === "string")
      return fromRpc2(signature);
    if (signature.v)
      return fromLegacy(signature);
    return {
      r: signature.r,
      s: signature.s,
      ...typeof signature.yParity !== "undefined" ? { yParity: signature.yParity } : {}
    };
  })();
  assert5(signature_);
  return signature_;
}
function fromLegacy(signature) {
  return {
    r: signature.r,
    s: signature.s,
    yParity: vToYParity(signature.v)
  };
}
function fromRpc2(signature) {
  const yParity = (() => {
    const v = signature.v ? Number(signature.v) : void 0;
    let yParity2 = signature.yParity ? Number(signature.yParity) : void 0;
    if (typeof v === "number" && typeof yParity2 !== "number")
      yParity2 = vToYParity(v);
    if (typeof yParity2 !== "number")
      throw new InvalidYParityError2({ value: signature.yParity });
    return yParity2;
  })();
  return {
    r: BigInt(signature.r),
    s: BigInt(signature.s),
    yParity
  };
}
function toTuple(signature) {
  const { r, s, yParity } = signature;
  return [
    yParity ? "0x01" : "0x",
    r === 0n ? "0x" : trimLeft2(fromNumber(r)),
    s === 0n ? "0x" : trimLeft2(fromNumber(s))
  ];
}
function vToYParity(v) {
  if (v === 0 || v === 27)
    return 0;
  if (v === 1 || v === 28)
    return 1;
  if (v >= 35)
    return v % 2 === 0 ? 1 : 0;
  throw new InvalidVError({ value: v });
}
var InvalidSerializedSizeError2 = class extends BaseError3 {
  constructor({ signature }) {
    super(`Value \`${signature}\` is an invalid signature size.`, {
      metaMessages: [
        "Expected: 64 bytes or 65 bytes.",
        `Received ${size3(from2(signature))} bytes.`
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.InvalidSerializedSizeError"
    });
  }
};
var MissingPropertiesError = class extends BaseError3 {
  constructor({ signature }) {
    super(`Signature \`${stringify2(signature)}\` is missing either an \`r\`, \`s\`, or \`yParity\` property.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.MissingPropertiesError"
    });
  }
};
var InvalidRError = class extends BaseError3 {
  constructor({ value }) {
    super(`Value \`${value}\` is an invalid r value. r must be a positive integer less than 2^256.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.InvalidRError"
    });
  }
};
var InvalidSError = class extends BaseError3 {
  constructor({ value }) {
    super(`Value \`${value}\` is an invalid s value. s must be a positive integer less than 2^256.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.InvalidSError"
    });
  }
};
var InvalidYParityError2 = class extends BaseError3 {
  constructor({ value }) {
    super(`Value \`${value}\` is an invalid y-parity value. Y-parity must be 0 or 1.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.InvalidYParityError"
    });
  }
};
var InvalidVError = class extends BaseError3 {
  constructor({ value }) {
    super(`Value \`${value}\` is an invalid v value. v must be 27, 28 or >=35.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "Signature.InvalidVError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Authorization.js
function from8(authorization, options = {}) {
  if (typeof authorization.chainId === "string")
    return fromRpc3(authorization);
  return { ...authorization, ...options.signature };
}
function fromRpc3(authorization) {
  const { address, chainId, nonce } = authorization;
  const signature = extract2(authorization);
  return {
    address,
    chainId: Number(chainId),
    nonce: BigInt(nonce),
    ...signature
  };
}
function getSignPayload(authorization) {
  return hash2(authorization, { presign: true });
}
function hash2(authorization, options = {}) {
  const { presign } = options;
  return keccak2562(concat2("0x05", fromHex3(toTuple2(presign ? {
    address: authorization.address,
    chainId: authorization.chainId,
    nonce: authorization.nonce
  } : authorization))));
}
function toTuple2(authorization) {
  const { address, chainId, nonce } = authorization;
  const signature = extract2(authorization);
  return [
    chainId ? fromNumber(chainId) : "0x",
    address,
    nonce ? fromNumber(nonce) : "0x",
    ...signature ? toTuple(signature) : []
  ];
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/erc8010/SignatureErc8010.js
init_Errors();
init_Hex();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/Secp256k1.js
init_secp256k1();
init_Hex();
function recoverAddress2(options) {
  return fromPublicKey(recoverPublicKey2(options));
}
function recoverPublicKey2(options) {
  const { payload, signature } = options;
  const { r, s, yParity } = signature;
  const signature_ = new secp256k1.Signature(BigInt(r), BigInt(s)).addRecoveryBit(yParity);
  const point = signature_.recoverPublicKey(from2(payload).substring(2));
  return from3(point);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/erc8010/SignatureErc8010.js
var magicBytes = "0x8010801080108010801080108010801080108010801080108010801080108010";
var suffixParameters = from5("(uint256 chainId, address delegation, uint256 nonce, uint8 yParity, uint256 r, uint256 s), address to, bytes data");
function assert6(value) {
  if (typeof value === "string") {
    if (slice3(value, -32) !== magicBytes)
      throw new InvalidWrappedSignatureError(value);
  } else
    assert5(value.authorization);
}
function from9(value) {
  if (typeof value === "string")
    return unwrap(value);
  return value;
}
function unwrap(wrapped) {
  assert6(wrapped);
  const suffixLength = toNumber(slice3(wrapped, -64, -32));
  const suffix = slice3(wrapped, -suffixLength - 64, -64);
  const signature = slice3(wrapped, 0, -suffixLength - 64);
  const [auth, to, data] = decode(suffixParameters, suffix);
  const authorization = from8({
    address: auth.delegation,
    chainId: Number(auth.chainId),
    nonce: auth.nonce,
    yParity: auth.yParity,
    r: auth.r,
    s: auth.s
  });
  return {
    authorization,
    signature,
    ...data && data !== "0x" ? { data, to } : {}
  };
}
function wrap(value) {
  const { data, signature } = value;
  assert6(value);
  const self = recoverAddress2({
    payload: getSignPayload(value.authorization),
    signature: from7(value.authorization)
  });
  const suffix = encode2(suffixParameters, [
    {
      ...value.authorization,
      delegation: value.authorization.address,
      chainId: BigInt(value.authorization.chainId)
    },
    value.to ?? self,
    data ?? "0x"
  ]);
  const suffixLength = fromNumber(size3(suffix), { size: 32 });
  return concat2(signature, suffix, suffixLength, magicBytes);
}
function validate4(value) {
  try {
    assert6(value);
    return true;
  } catch {
    return false;
  }
}
var InvalidWrappedSignatureError = class extends BaseError3 {
  constructor(wrapped) {
    super(`Value \`${wrapped}\` is an invalid ERC-8010 wrapped signature.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "SignatureErc8010.InvalidWrappedSignatureError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/recoverMessageAddress.js
async function recoverMessageAddress({ message, signature }) {
  return recoverAddress({ hash: hashMessage(message), signature });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/recoverTypedDataAddress.js
async function recoverTypedDataAddress(parameters) {
  const { domain, message, primaryType, signature, types } = parameters;
  return recoverAddress({
    hash: hashTypedData({
      domain,
      message,
      primaryType,
      types
    }),
    signature
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/verifyTypedData.js
init_getAddress();
init_isAddressEqual();
async function verifyTypedData(parameters) {
  const { address, domain, message, primaryType, signature, types } = parameters;
  return isAddressEqual(getAddress(address), await recoverTypedDataAddress({
    domain,
    message,
    primaryType,
    signature,
    types
  }));
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/getSerializedTransactionType.js
init_transaction();
init_slice();
init_fromHex();
function getSerializedTransactionType(serializedTransaction) {
  const serializedType = sliceHex(serializedTransaction, 0, 1);
  if (serializedType === "0x04")
    return "eip7702";
  if (serializedType === "0x03")
    return "eip4844";
  if (serializedType === "0x02")
    return "eip1559";
  if (serializedType === "0x01")
    return "eip2930";
  if (serializedType !== "0x" && hexToNumber(serializedType) >= 192)
    return "legacy";
  throw new InvalidSerializedTransactionTypeError({ serializedType });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/transaction/parseTransaction.js
init_address();
init_transaction();
init_isAddress();
init_isHex();
init_pad();
init_trim();
init_fromHex();
function parseTransaction(serializedTransaction) {
  const type = getSerializedTransactionType(serializedTransaction);
  if (type === "eip1559")
    return parseTransactionEIP1559(serializedTransaction);
  if (type === "eip2930")
    return parseTransactionEIP2930(serializedTransaction);
  if (type === "eip4844")
    return parseTransactionEIP4844(serializedTransaction);
  if (type === "eip7702")
    return parseTransactionEIP7702(serializedTransaction);
  return parseTransactionLegacy(serializedTransaction);
}
function parseTransactionEIP7702(serializedTransaction) {
  const transactionArray = toTransactionArray(serializedTransaction);
  const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, authorizationList, v, r, s] = transactionArray;
  if (transactionArray.length !== 10 && transactionArray.length !== 13)
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        to,
        value,
        data,
        accessList,
        authorizationList,
        ...transactionArray.length > 9 ? {
          v,
          r,
          s
        } : {}
      },
      serializedTransaction,
      type: "eip7702"
    });
  const transaction = {
    chainId: hexToNumber(chainId),
    type: "eip7702"
  };
  if (isHex(to) && to !== "0x")
    transaction.to = to;
  if (isHex(gas) && gas !== "0x")
    transaction.gas = hexToBigInt(gas);
  if (isHex(data) && data !== "0x")
    transaction.data = data;
  if (isHex(nonce))
    transaction.nonce = nonce === "0x" ? 0 : hexToNumber(nonce);
  if (isHex(value) && value !== "0x")
    transaction.value = hexToBigInt(value);
  if (isHex(maxFeePerGas) && maxFeePerGas !== "0x")
    transaction.maxFeePerGas = hexToBigInt(maxFeePerGas);
  if (isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== "0x")
    transaction.maxPriorityFeePerGas = hexToBigInt(maxPriorityFeePerGas);
  if (accessList.length !== 0 && accessList !== "0x")
    transaction.accessList = parseAccessList(accessList);
  if (authorizationList.length !== 0 && authorizationList !== "0x")
    transaction.authorizationList = parseAuthorizationList(authorizationList);
  assertTransactionEIP7702(transaction);
  const signature = transactionArray.length === 13 ? parseEIP155Signature(transactionArray) : void 0;
  return { ...signature, ...transaction };
}
function parseTransactionEIP4844(serializedTransaction) {
  const transactionOrWrapperArray = toTransactionArray(serializedTransaction);
  const hasNetworkWrapper = transactionOrWrapperArray.length === 4;
  const transactionArray = hasNetworkWrapper ? transactionOrWrapperArray[0] : transactionOrWrapperArray;
  const wrapperArray = hasNetworkWrapper ? transactionOrWrapperArray.slice(1) : [];
  const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, maxFeePerBlobGas, blobVersionedHashes, v, r, s] = transactionArray;
  const [blobs, commitments, proofs] = wrapperArray;
  if (!(transactionArray.length === 11 || transactionArray.length === 14))
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        to,
        value,
        data,
        accessList,
        ...transactionArray.length > 9 ? {
          v,
          r,
          s
        } : {}
      },
      serializedTransaction,
      type: "eip4844"
    });
  const transaction = {
    blobVersionedHashes,
    chainId: hexToNumber(chainId),
    to,
    type: "eip4844"
  };
  if (isHex(gas) && gas !== "0x")
    transaction.gas = hexToBigInt(gas);
  if (isHex(data) && data !== "0x")
    transaction.data = data;
  if (isHex(nonce))
    transaction.nonce = nonce === "0x" ? 0 : hexToNumber(nonce);
  if (isHex(value) && value !== "0x")
    transaction.value = hexToBigInt(value);
  if (isHex(maxFeePerBlobGas) && maxFeePerBlobGas !== "0x")
    transaction.maxFeePerBlobGas = hexToBigInt(maxFeePerBlobGas);
  if (isHex(maxFeePerGas) && maxFeePerGas !== "0x")
    transaction.maxFeePerGas = hexToBigInt(maxFeePerGas);
  if (isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== "0x")
    transaction.maxPriorityFeePerGas = hexToBigInt(maxPriorityFeePerGas);
  if (accessList.length !== 0 && accessList !== "0x")
    transaction.accessList = parseAccessList(accessList);
  if (blobs && commitments && proofs)
    transaction.sidecars = toBlobSidecars({
      blobs,
      commitments,
      proofs
    });
  assertTransactionEIP4844(transaction);
  const signature = transactionArray.length === 14 ? parseEIP155Signature(transactionArray) : void 0;
  return { ...signature, ...transaction };
}
function parseTransactionEIP1559(serializedTransaction) {
  const transactionArray = toTransactionArray(serializedTransaction);
  const [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gas, to, value, data, accessList, v, r, s] = transactionArray;
  if (!(transactionArray.length === 9 || transactionArray.length === 12))
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        to,
        value,
        data,
        accessList,
        ...transactionArray.length > 9 ? {
          v,
          r,
          s
        } : {}
      },
      serializedTransaction,
      type: "eip1559"
    });
  const transaction = {
    chainId: hexToNumber(chainId),
    type: "eip1559"
  };
  if (isHex(to) && to !== "0x")
    transaction.to = to;
  if (isHex(gas) && gas !== "0x")
    transaction.gas = hexToBigInt(gas);
  if (isHex(data) && data !== "0x")
    transaction.data = data;
  if (isHex(nonce))
    transaction.nonce = nonce === "0x" ? 0 : hexToNumber(nonce);
  if (isHex(value) && value !== "0x")
    transaction.value = hexToBigInt(value);
  if (isHex(maxFeePerGas) && maxFeePerGas !== "0x")
    transaction.maxFeePerGas = hexToBigInt(maxFeePerGas);
  if (isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== "0x")
    transaction.maxPriorityFeePerGas = hexToBigInt(maxPriorityFeePerGas);
  if (accessList.length !== 0 && accessList !== "0x")
    transaction.accessList = parseAccessList(accessList);
  assertTransactionEIP1559(transaction);
  const signature = transactionArray.length === 12 ? parseEIP155Signature(transactionArray) : void 0;
  return { ...signature, ...transaction };
}
function parseTransactionEIP2930(serializedTransaction) {
  const transactionArray = toTransactionArray(serializedTransaction);
  const [chainId, nonce, gasPrice, gas, to, value, data, accessList, v, r, s] = transactionArray;
  if (!(transactionArray.length === 8 || transactionArray.length === 11))
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        gasPrice,
        gas,
        to,
        value,
        data,
        accessList,
        ...transactionArray.length > 8 ? {
          v,
          r,
          s
        } : {}
      },
      serializedTransaction,
      type: "eip2930"
    });
  const transaction = {
    chainId: hexToNumber(chainId),
    type: "eip2930"
  };
  if (isHex(to) && to !== "0x")
    transaction.to = to;
  if (isHex(gas) && gas !== "0x")
    transaction.gas = hexToBigInt(gas);
  if (isHex(data) && data !== "0x")
    transaction.data = data;
  if (isHex(nonce))
    transaction.nonce = nonce === "0x" ? 0 : hexToNumber(nonce);
  if (isHex(value) && value !== "0x")
    transaction.value = hexToBigInt(value);
  if (isHex(gasPrice) && gasPrice !== "0x")
    transaction.gasPrice = hexToBigInt(gasPrice);
  if (accessList.length !== 0 && accessList !== "0x")
    transaction.accessList = parseAccessList(accessList);
  assertTransactionEIP2930(transaction);
  const signature = transactionArray.length === 11 ? parseEIP155Signature(transactionArray) : void 0;
  return { ...signature, ...transaction };
}
function parseTransactionLegacy(serializedTransaction) {
  const transactionArray = fromRlp(serializedTransaction, "hex");
  const [nonce, gasPrice, gas, to, value, data, chainIdOrV_, r, s] = transactionArray;
  if (!(transactionArray.length === 6 || transactionArray.length === 9))
    throw new InvalidSerializedTransactionError({
      attributes: {
        nonce,
        gasPrice,
        gas,
        to,
        value,
        data,
        ...transactionArray.length > 6 ? {
          v: chainIdOrV_,
          r,
          s
        } : {}
      },
      serializedTransaction,
      type: "legacy"
    });
  const transaction = {
    type: "legacy"
  };
  if (isHex(to) && to !== "0x")
    transaction.to = to;
  if (isHex(gas) && gas !== "0x")
    transaction.gas = hexToBigInt(gas);
  if (isHex(data) && data !== "0x")
    transaction.data = data;
  if (isHex(nonce))
    transaction.nonce = nonce === "0x" ? 0 : hexToNumber(nonce);
  if (isHex(value) && value !== "0x")
    transaction.value = hexToBigInt(value);
  if (isHex(gasPrice) && gasPrice !== "0x")
    transaction.gasPrice = hexToBigInt(gasPrice);
  assertTransactionLegacy(transaction);
  if (transactionArray.length === 6)
    return transaction;
  const chainIdOrV = isHex(chainIdOrV_) && chainIdOrV_ !== "0x" ? hexToBigInt(chainIdOrV_) : 0n;
  if (s === "0x" && r === "0x") {
    if (chainIdOrV > 0)
      transaction.chainId = Number(chainIdOrV);
    return transaction;
  }
  const v = chainIdOrV;
  const chainId = Number((v - 35n) / 2n);
  if (chainId > 0)
    transaction.chainId = chainId;
  else if (v !== 27n && v !== 28n)
    throw new InvalidLegacyVError({ v });
  transaction.v = v;
  transaction.s = s;
  transaction.r = r;
  transaction.yParity = v % 2n === 0n ? 1 : 0;
  return transaction;
}
function toTransactionArray(serializedTransaction) {
  return fromRlp(`0x${serializedTransaction.slice(4)}`, "hex");
}
function parseAccessList(accessList_) {
  const accessList = [];
  for (let i = 0; i < accessList_.length; i++) {
    const [address, storageKeys] = accessList_[i];
    if (!isAddress(address, { strict: false }))
      throw new InvalidAddressError({ address });
    accessList.push({
      address,
      storageKeys: storageKeys.map((key) => isHash(key) ? key : trim(key))
    });
  }
  return accessList;
}
function parseAuthorizationList(serializedAuthorizationList) {
  const authorizationList = [];
  for (let i = 0; i < serializedAuthorizationList.length; i++) {
    const [chainId, address, nonce, yParity, r, s] = serializedAuthorizationList[i];
    authorizationList.push({
      address,
      chainId: chainId === "0x" ? 0 : hexToNumber(chainId),
      nonce: nonce === "0x" ? 0 : hexToNumber(nonce),
      ...parseEIP155Signature([yParity, r, s])
    });
  }
  return authorizationList;
}
function parseEIP155Signature(transactionArray) {
  const signature = transactionArray.slice(-3);
  const yParity = signature[0] === "0x" ? 0n : hexToBigInt(signature[0]);
  if (yParity !== 0n && yParity !== 1n)
    throw new InvalidYParityError({ yParity });
  const v = yParity === 0n ? 27n : 28n;
  return {
    r: padHex(signature[1], { size: 32 }),
    s: padHex(signature[2], { size: 32 }),
    v,
    yParity: v === 27n ? 0 : 1
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/parseEther.js
init_unit();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/unit.js
init_base();
var InvalidDecimalNumberError = class extends BaseError2 {
  constructor({ value }) {
    super(`Number \`${value}\` is not a valid decimal number.`, {
      name: "InvalidDecimalNumberError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/parseUnits.js
function parseUnits(value, decimals) {
  if (!/^(-?)([0-9]*)\.?([0-9]*)$/.test(value))
    throw new InvalidDecimalNumberError({ value });
  let [integer, fraction = "0"] = value.split(".");
  const negative = integer.startsWith("-");
  if (negative)
    integer = integer.slice(1);
  fraction = fraction.replace(/(0+)$/, "");
  if (decimals === 0) {
    if (Math.round(Number(`.${fraction}`)) === 1)
      integer = `${BigInt(integer) + 1n}`;
    fraction = "";
  } else if (fraction.length > decimals) {
    const [left, unit, right] = [
      fraction.slice(0, decimals - 1),
      fraction.slice(decimals - 1, decimals),
      fraction.slice(decimals)
    ];
    const rounded = Math.round(Number(`${unit}.${right}`));
    if (rounded > 9)
      fraction = `${BigInt(left) + BigInt(1)}0`.padStart(left.length + 1, "0");
    else
      fraction = `${left}${rounded}`;
    if (fraction.length > decimals) {
      fraction = fraction.slice(1);
      integer = `${BigInt(integer) + 1n}`;
    }
    fraction = fraction.slice(0, decimals);
  } else {
    fraction = fraction.padEnd(decimals, "0");
  }
  return BigInt(`${negative ? "-" : ""}${integer}${fraction}`);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/unit/parseEther.js
function parseEther(ether, unit = "wei") {
  return parseUnits(ether, etherUnits[unit]);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/formatters/proof.js
function formatStorageProof(storageProof) {
  return storageProof.map((proof) => ({
    ...proof,
    value: BigInt(proof.value)
  }));
}
function formatProof(proof) {
  return {
    ...proof,
    balance: proof.balance ? BigInt(proof.balance) : void 0,
    nonce: proof.nonce ? hexToNumber(proof.nonce) : void 0,
    storageProof: proof.storageProof ? formatStorageProof(proof.storageProof) : void 0
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getProof.js
async function getProof(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical, storageKeys }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const proof = await client.request({
    method: "eth_getProof",
    params: [address, storageKeys, block]
  });
  return formatProof(proof);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getRawTransaction.js
init_transaction();
async function getRawTransaction(client, { hash: hash3 }) {
  const rawTransaction = await client.request({
    method: "eth_getRawTransactionByHash",
    params: [hash3]
  }, { dedupe: true });
  if (!rawTransaction)
    throw new TransactionNotFoundError({ hash: hash3 });
  return rawTransaction;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getStorageAt.js
init_formatBlockParameter();
async function getStorageAt(client, { address, blockHash, blockNumber, blockTag = "latest", requireCanonical, slot }) {
  const block = formatBlockParameter({
    blockHash,
    blockNumber,
    blockTag,
    requireCanonical
  });
  const data = await client.request({
    method: "eth_getStorageAt",
    params: [address, slot, block]
  });
  return data;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getTransaction.js
init_transaction();
init_toHex();
async function getTransaction(client, { blockHash, blockNumber, blockTag: blockTag_, hash: hash3, index: index2, sender, nonce }) {
  const blockTag = blockTag_ || "latest";
  const blockNumberHex = blockNumber !== void 0 ? numberToHex(blockNumber) : void 0;
  let transaction = null;
  if (hash3) {
    transaction = await client.request({
      method: "eth_getTransactionByHash",
      params: [hash3]
    }, { dedupe: true });
  } else if (blockHash) {
    transaction = await client.request({
      method: "eth_getTransactionByBlockHashAndIndex",
      params: [blockHash, numberToHex(index2)]
    }, { dedupe: true });
  } else if ((blockNumberHex || blockTag) && typeof index2 === "number") {
    transaction = await client.request({
      method: "eth_getTransactionByBlockNumberAndIndex",
      params: [blockNumberHex || blockTag, numberToHex(index2)]
    }, { dedupe: Boolean(blockNumberHex) });
  } else if (sender && typeof nonce === "number") {
    transaction = await client.request({
      method: "eth_getTransactionBySenderAndNonce",
      params: [sender, numberToHex(nonce)]
    }, { dedupe: true });
  }
  if (!transaction)
    throw new TransactionNotFoundError({
      blockHash,
      blockNumber,
      blockTag,
      hash: hash3,
      index: index2
    });
  const format = client.chain?.formatters?.transaction?.format || formatTransaction;
  return format(transaction, "getTransaction");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getTransactionConfirmations.js
async function getTransactionConfirmations(client, { hash: hash3, transactionReceipt }) {
  const [blockNumber, transaction] = await Promise.all([
    getAction(client, getBlockNumber, "getBlockNumber")({}),
    hash3 ? getAction(client, getTransaction, "getTransaction")({ hash: hash3 }) : void 0
  ]);
  const transactionBlockNumber = transactionReceipt?.blockNumber || transaction?.blockNumber;
  if (!transactionBlockNumber)
    return 0n;
  return blockNumber - transactionBlockNumber + 1n;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/getTransactionReceipt.js
init_transaction();
async function getTransactionReceipt(client, { hash: hash3 }) {
  const receipt = await client.request({
    method: "eth_getTransactionReceipt",
    params: [hash3]
  }, { dedupe: true });
  if (!receipt)
    throw new TransactionReceiptNotFoundError({ hash: hash3 });
  const format = client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt;
  return format(receipt, "getTransactionReceipt");
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/multicall.js
init_abis();
init_contracts();
init_abi();
init_base();
init_contract();
init_decodeFunctionResult();
init_encodeFunctionData();
init_getChainContractAddress();
async function multicall(client, parameters) {
  const { account, authorizationList, allowFailure = true, blockHash, blockNumber, blockOverrides, blockTag, requireCanonical, stateOverride } = parameters;
  const contracts = parameters.contracts;
  const { batchSize = parameters.batchSize ?? 1024, deployless = parameters.deployless ?? false } = typeof client.batch?.multicall === "object" ? client.batch.multicall : {};
  const multicallAddress = (() => {
    if (parameters.multicallAddress)
      return parameters.multicallAddress;
    if (deployless)
      return null;
    if (client.chain) {
      return getChainContractAddress({
        blockNumber,
        chain: client.chain,
        contract: "multicall3"
      });
    }
    throw new Error("client chain not configured. multicallAddress is required.");
  })();
  const chunkedCalls = [[]];
  let currentChunk = 0;
  let currentChunkSize = 0;
  for (let i = 0; i < contracts.length; i++) {
    const { abi: abi2, address, args, functionName } = contracts[i];
    try {
      const callData = encodeFunctionData({ abi: abi2, args, functionName });
      currentChunkSize += (callData.length - 2) / 2;
      if (
        // Check if batching is enabled.
        batchSize > 0 && // Check if the current size of the batch exceeds the size limit.
        currentChunkSize > batchSize && // Check if the current chunk is not already empty.
        chunkedCalls[currentChunk].length > 0
      ) {
        currentChunk++;
        currentChunkSize = (callData.length - 2) / 2;
        chunkedCalls[currentChunk] = [];
      }
      chunkedCalls[currentChunk] = [
        ...chunkedCalls[currentChunk],
        {
          allowFailure: true,
          callData,
          target: address
        }
      ];
    } catch (err) {
      const error = getContractError(err, {
        abi: abi2,
        address,
        args,
        docsPath: "/docs/contract/multicall",
        functionName,
        sender: account
      });
      if (!allowFailure)
        throw error;
      chunkedCalls[currentChunk] = [
        ...chunkedCalls[currentChunk],
        {
          allowFailure: true,
          callData: "0x",
          target: address
        }
      ];
    }
  }
  const aggregate3Results = await Promise.allSettled(chunkedCalls.map((calls) => getAction(client, readContract, "readContract")({
    ...multicallAddress === null ? { code: multicall3Bytecode } : { address: multicallAddress },
    abi: multicall3Abi,
    account,
    args: [calls],
    authorizationList,
    blockHash,
    blockNumber,
    blockOverrides,
    blockTag,
    functionName: "aggregate3",
    requireCanonical,
    stateOverride
  })));
  const results = [];
  for (let i = 0; i < aggregate3Results.length; i++) {
    const result = aggregate3Results[i];
    if (result.status === "rejected") {
      if (!allowFailure)
        throw result.reason;
      for (let j = 0; j < chunkedCalls[i].length; j++) {
        results.push({
          status: "failure",
          error: result.reason,
          result: void 0
        });
      }
      continue;
    }
    const aggregate3Result = result.value;
    for (let j = 0; j < aggregate3Result.length; j++) {
      const { returnData, success } = aggregate3Result[j];
      const { callData } = chunkedCalls[i][j];
      const { abi: abi2, address, functionName, args } = contracts[results.length];
      try {
        if (callData === "0x")
          throw new AbiDecodingZeroDataError();
        if (!success)
          throw new RawContractError({ data: returnData });
        const result2 = decodeFunctionResult({
          abi: abi2,
          args,
          data: returnData,
          functionName
        });
        results.push(allowFailure ? { result: result2, status: "success" } : result2);
      } catch (err) {
        const error = getContractError(err, {
          abi: abi2,
          address,
          args,
          docsPath: "/docs/contract/multicall",
          functionName
        });
        if (!allowFailure)
          throw error;
        results.push({ error, result: void 0, status: "failure" });
      }
    }
  }
  if (results.length !== contracts.length)
    throw new BaseError2("multicall results mismatch");
  return results;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/simulateBlocks.js
init_BlockOverrides();
init_parseAccount();
init_abi();
init_contract();
init_node();
init_decodeFunctionResult();
init_encodeFunctionData();
init_concat();
init_toHex();
init_getNodeError();
init_transactionRequest();
init_stateOverride2();
init_assertRequest();
async function simulateBlocks(client, parameters) {
  const { blockNumber, blockTag = client.experimental_blockTag ?? "latest", blocks, returnFullTransactions, traceTransfers, validation } = parameters;
  try {
    const blockStateCalls = [];
    for (const block2 of blocks) {
      const blockOverrides = block2.blockOverrides ? toRpc2(block2.blockOverrides) : void 0;
      const calls = block2.calls.map((call_) => {
        const call2 = call_;
        const account = call2.account ? parseAccount(call2.account) : void 0;
        const data = call2.abi ? encodeFunctionData(call2) : call2.data;
        const request = {
          ...call2,
          account,
          data: call2.dataSuffix ? concat([data || "0x", call2.dataSuffix]) : data,
          from: call2.from ?? account?.address
        };
        assertRequest(request);
        return formatTransactionRequest(request);
      });
      const stateOverrides = block2.stateOverrides ? serializeStateOverride(block2.stateOverrides) : void 0;
      blockStateCalls.push({
        blockOverrides,
        calls,
        stateOverrides
      });
    }
    const blockNumberHex = typeof blockNumber === "bigint" ? numberToHex(blockNumber) : void 0;
    const block = blockNumberHex || blockTag;
    const result = await client.request({
      method: "eth_simulateV1",
      params: [
        { blockStateCalls, returnFullTransactions, traceTransfers, validation },
        block
      ]
    });
    return result.map((block2, i) => ({
      ...formatBlock(block2),
      calls: block2.calls.map((call2, j) => {
        const { abi: abi2, args, functionName, to } = blocks[i].calls[j];
        const data = call2.error?.data ?? call2.returnData;
        const gasUsed = BigInt(call2.gasUsed);
        const logs = call2.logs?.map((log) => formatLog(log));
        const status = call2.status === "0x1" ? "success" : "failure";
        const result2 = abi2 && status === "success" && data !== "0x" ? decodeFunctionResult({
          abi: abi2,
          data,
          functionName
        }) : null;
        const error = (() => {
          if (status === "success")
            return void 0;
          let error2;
          if (data === "0x")
            error2 = new AbiDecodingZeroDataError();
          else if (data)
            error2 = new RawContractError({ data });
          if (!error2)
            return void 0;
          return getContractError(error2, {
            abi: abi2 ?? [],
            address: to ?? "0x",
            args,
            functionName: functionName ?? "<unknown>"
          });
        })();
        return {
          data,
          gasUsed,
          logs,
          status,
          ...status === "success" ? {
            result: result2
          } : {
            error
          }
        };
      })
    }));
  } catch (e) {
    const cause = e;
    const error = getNodeError(cause, {});
    if (error instanceof UnknownNodeError)
      throw cause;
    throw error;
  }
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiItem.js
init_exports();
init_Errors();
init_Hex();

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/internal/abiItem.js
init_Errors();
function normalizeSignature2(signature) {
  let active = true;
  let current = "";
  let level = 0;
  let result = "";
  let valid = false;
  for (let i = 0; i < signature.length; i++) {
    const char = signature[i];
    if (["(", ")", ","].includes(char))
      active = true;
    if (char === "(")
      level++;
    if (char === ")")
      level--;
    if (!active)
      continue;
    if (level === 0) {
      if (char === " " && ["event", "function", "error", ""].includes(result))
        result = "";
      else {
        result += char;
        if (char === ")") {
          valid = true;
          break;
        }
      }
      continue;
    }
    if (char === " ") {
      if (signature[i - 1] !== "," && current !== "," && current !== ",(") {
        current = "";
        active = false;
      }
      continue;
    }
    result += char;
    current += char;
  }
  if (!valid)
    throw new BaseError3("Unable to normalize signature.");
  return result;
}
function isArgOfType2(arg, abiParameter) {
  const argType = typeof arg;
  const abiParameterType = abiParameter.type;
  switch (abiParameterType) {
    case "address":
      return validate3(arg, { strict: false });
    case "bool":
      return argType === "boolean";
    case "function":
      return argType === "string";
    case "string":
      return argType === "string";
    default: {
      if (abiParameterType === "tuple" && "components" in abiParameter)
        return Object.values(abiParameter.components).every((component, index2) => {
          return isArgOfType2(Object.values(arg)[index2], component);
        });
      if (/^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/.test(abiParameterType))
        return argType === "number" || argType === "bigint";
      if (/^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/.test(abiParameterType))
        return argType === "string" || arg instanceof Uint8Array;
      if (/[a-z]+[1-9]{0,3}(\[[0-9]{0,}\])+$/.test(abiParameterType)) {
        return Array.isArray(arg) && arg.every((x) => isArgOfType2(x, {
          ...abiParameter,
          // Pop off `[]` or `[M]` from end of type
          type: abiParameterType.replace(/(\[[0-9]{0,}\])$/, "")
        }));
      }
      return false;
    }
  }
}
function getAmbiguousTypes2(sourceParameters, targetParameters, args) {
  for (const parameterIndex in sourceParameters) {
    const sourceParameter = sourceParameters[parameterIndex];
    const targetParameter = targetParameters[parameterIndex];
    if (sourceParameter.type === "tuple" && targetParameter.type === "tuple" && "components" in sourceParameter && "components" in targetParameter)
      return getAmbiguousTypes2(sourceParameter.components, targetParameter.components, args[parameterIndex]);
    const types = [sourceParameter.type, targetParameter.type];
    const ambiguous = (() => {
      if (types.includes("address") && types.includes("bytes20"))
        return true;
      if (types.includes("address") && types.includes("string"))
        return validate3(args[parameterIndex], {
          strict: false
        });
      if (types.includes("address") && types.includes("bytes"))
        return validate3(args[parameterIndex], {
          strict: false
        });
      return false;
    })();
    if (ambiguous)
      return types;
  }
  return;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiItem.js
function from10(abiItem, options = {}) {
  const { prepare = true } = options;
  const item = (() => {
    if (Array.isArray(abiItem))
      return parseAbiItem(abiItem);
    if (typeof abiItem === "string")
      return parseAbiItem(abiItem);
    return abiItem;
  })();
  return {
    ...item,
    ...prepare ? { hash: getSignatureHash(item) } : {}
  };
}
function fromAbi(abi2, name, options) {
  const { args = [], prepare = true } = options ?? {};
  const isSelector = validate2(name, { strict: false });
  const abiItems = abi2.filter((abiItem2) => {
    if (isSelector) {
      if (abiItem2.type === "function" || abiItem2.type === "error")
        return getSelector(abiItem2) === slice3(name, 0, 4);
      if (abiItem2.type === "event")
        return getSignatureHash(abiItem2) === name;
      return false;
    }
    return "name" in abiItem2 && abiItem2.name === name;
  });
  if (abiItems.length === 0)
    throw new NotFoundError({ name });
  if (abiItems.length === 1)
    return {
      ...abiItems[0],
      ...prepare ? { hash: getSignatureHash(abiItems[0]) } : {}
    };
  let matchedAbiItem;
  for (const abiItem2 of abiItems) {
    if (!("inputs" in abiItem2))
      continue;
    if (!args || args.length === 0) {
      if (!abiItem2.inputs || abiItem2.inputs.length === 0)
        return {
          ...abiItem2,
          ...prepare ? { hash: getSignatureHash(abiItem2) } : {}
        };
      continue;
    }
    if (!abiItem2.inputs)
      continue;
    if (abiItem2.inputs.length === 0)
      continue;
    if (abiItem2.inputs.length !== args.length)
      continue;
    const matched = args.every((arg, index2) => {
      const abiParameter = "inputs" in abiItem2 && abiItem2.inputs[index2];
      if (!abiParameter)
        return false;
      return isArgOfType2(arg, abiParameter);
    });
    if (matched) {
      if (matchedAbiItem && "inputs" in matchedAbiItem && matchedAbiItem.inputs) {
        const ambiguousTypes = getAmbiguousTypes2(abiItem2.inputs, matchedAbiItem.inputs, args);
        if (ambiguousTypes)
          throw new AmbiguityError({
            abiItem: abiItem2,
            type: ambiguousTypes[0]
          }, {
            abiItem: matchedAbiItem,
            type: ambiguousTypes[1]
          });
      }
      matchedAbiItem = abiItem2;
    }
  }
  const abiItem = (() => {
    if (matchedAbiItem)
      return matchedAbiItem;
    const [abiItem2, ...overloads] = abiItems;
    return { ...abiItem2, overloads };
  })();
  if (!abiItem)
    throw new NotFoundError({ name });
  return {
    ...abiItem,
    ...prepare ? { hash: getSignatureHash(abiItem) } : {}
  };
}
function getSelector(...parameters) {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi2, name] = parameters;
      return fromAbi(abi2, name);
    }
    return parameters[0];
  })();
  return slice3(getSignatureHash(abiItem), 0, 4);
}
function getSignature(...parameters) {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi2, name] = parameters;
      return fromAbi(abi2, name);
    }
    return parameters[0];
  })();
  const signature = (() => {
    if (typeof abiItem === "string")
      return abiItem;
    return formatAbiItem(abiItem);
  })();
  return normalizeSignature2(signature);
}
function getSignatureHash(...parameters) {
  const abiItem = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi2, name] = parameters;
      return fromAbi(abi2, name);
    }
    return parameters[0];
  })();
  if (typeof abiItem !== "string" && "hash" in abiItem && abiItem.hash)
    return abiItem.hash;
  return keccak2562(fromString2(getSignature(abiItem)));
}
var AmbiguityError = class extends BaseError3 {
  constructor(x, y) {
    super("Found ambiguous types in overloaded ABI Items.", {
      metaMessages: [
        // TODO: abitype to add support for signature-formatted ABI items.
        `\`${x.type}\` in \`${normalizeSignature2(formatAbiItem(x.abiItem))}\`, and`,
        `\`${y.type}\` in \`${normalizeSignature2(formatAbiItem(y.abiItem))}\``,
        "",
        "These types encode differently and cannot be distinguished at runtime.",
        "Remove one of the ambiguous items in the ABI."
      ]
    });
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiItem.AmbiguityError"
    });
  }
};
var NotFoundError = class extends BaseError3 {
  constructor({ name, data, type = "item" }) {
    const selector = (() => {
      if (name)
        return ` with name "${name}"`;
      if (data)
        return ` with data "${data}"`;
      return "";
    })();
    super(`ABI ${type}${selector} not found.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "AbiItem.NotFoundError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiConstructor.js
init_Hex();
function encode3(...parameters) {
  const [abiConstructor, options] = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi2, options2] = parameters;
      return [fromAbi2(abi2), options2];
    }
    return parameters;
  })();
  const { bytecode, args } = options;
  return concat2(bytecode, abiConstructor.inputs?.length && args?.length ? encode2(abiConstructor.inputs, args) : "0x");
}
function from11(abiConstructor) {
  return from10(abiConstructor);
}
function fromAbi2(abi2) {
  const item = abi2.find((item2) => item2.type === "constructor");
  if (!item)
    throw new NotFoundError({ name: "constructor" });
  return item;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/core/AbiFunction.js
init_Hex();
function encodeData2(...parameters) {
  const [abiFunction, args = []] = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi2, name, args3] = parameters;
      return [fromAbi3(abi2, name, { args: args3 }), args3];
    }
    const [abiFunction2, args2] = parameters;
    return [abiFunction2, args2];
  })();
  const { overloads } = abiFunction;
  const item = overloads ? fromAbi3([abiFunction, ...overloads], abiFunction.name, {
    args
  }) : abiFunction;
  const selector = getSelector2(item);
  const data = args.length > 0 ? encode2(item.inputs, args) : void 0;
  return data ? concat2(selector, data) : selector;
}
function from12(abiFunction, options = {}) {
  return from10(abiFunction, options);
}
function fromAbi3(abi2, name, options) {
  const item = fromAbi(abi2, name, options);
  if (item.type !== "function")
    throw new NotFoundError({ name, type: "function" });
  return item;
}
function getSelector2(abiItem) {
  return getSelector(abiItem);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/simulateCalls.js
init_parseAccount();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/constants/address.js
var ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
var zeroAddress = "0x0000000000000000000000000000000000000000";

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/simulateCalls.js
init_contracts();
init_base();
init_encodeFunctionData();
var getBalanceCode = "0x6080604052348015600e575f80fd5b5061016d8061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610029575f3560e01c8063f8b2cb4f1461002d575b5f80fd5b610047600480360381019061004291906100db565b61005d565b604051610054919061011e565b60405180910390f35b5f8173ffffffffffffffffffffffffffffffffffffffff16319050919050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6100aa82610081565b9050919050565b6100ba816100a0565b81146100c4575f80fd5b50565b5f813590506100d5816100b1565b92915050565b5f602082840312156100f0576100ef61007d565b5b5f6100fd848285016100c7565b91505092915050565b5f819050919050565b61011881610106565b82525050565b5f6020820190506101315f83018461010f565b9291505056fea26469706673582212203b9fe929fe995c7cf9887f0bdba8a36dd78e8b73f149b17d2d9ad7cd09d2dc6264736f6c634300081a0033";
async function simulateCalls(client, parameters) {
  const { blockNumber, blockTag, calls, stateOverrides, traceAssetChanges, traceTransfers, validation } = parameters;
  const account = parameters.account ? parseAccount(parameters.account) : void 0;
  if (traceAssetChanges && !account)
    throw new BaseError2("`account` is required when `traceAssetChanges` is true");
  const getBalanceData = account ? encode3(from11("constructor(bytes, bytes)"), {
    bytecode: deploylessCallViaBytecodeBytecode,
    args: [
      getBalanceCode,
      encodeData2(from12("function getBalance(address)"), [account.address])
    ]
  }) : void 0;
  const assetAddresses = traceAssetChanges ? await Promise.all(parameters.calls.map(async (call2) => {
    if (!call2.data && !call2.abi)
      return;
    const { accessList } = await createAccessList(client, {
      account: account.address,
      ...call2,
      data: call2.abi ? encodeFunctionData(call2) : call2.data
    });
    return accessList.map(({ address, storageKeys }) => storageKeys.length > 0 ? address : null);
  })).then((x) => x.flat().filter(Boolean)) : [];
  const blocks = await simulateBlocks(client, {
    blockNumber,
    blockTag,
    blocks: [
      ...traceAssetChanges ? [
        // ETH pre balances
        {
          calls: [{ data: getBalanceData }],
          stateOverrides
        },
        // Asset pre balances
        {
          calls: assetAddresses.map((address, i) => ({
            abi: [
              from12("function balanceOf(address) returns (uint256)")
            ],
            functionName: "balanceOf",
            args: [account.address],
            to: address,
            from: zeroAddress,
            nonce: i
          })),
          stateOverrides: [
            {
              address: zeroAddress,
              nonce: 0
            }
          ]
        }
      ] : [],
      {
        calls: [...calls, { to: zeroAddress }].map((call2) => ({
          ...call2,
          from: account?.address
        })),
        stateOverrides
      },
      ...traceAssetChanges ? [
        // ETH post balances
        {
          calls: [{ data: getBalanceData }]
        },
        // Asset post balances
        {
          calls: assetAddresses.map((address, i) => ({
            abi: [
              from12("function balanceOf(address) returns (uint256)")
            ],
            functionName: "balanceOf",
            args: [account.address],
            to: address,
            from: zeroAddress,
            nonce: i
          })),
          stateOverrides: [
            {
              address: zeroAddress,
              nonce: 0
            }
          ]
        },
        // Decimals
        {
          calls: assetAddresses.map((address, i) => ({
            to: address,
            abi: [
              from12("function decimals() returns (uint256)")
            ],
            functionName: "decimals",
            from: zeroAddress,
            nonce: i
          })),
          stateOverrides: [
            {
              address: zeroAddress,
              nonce: 0
            }
          ]
        },
        // Token URI
        {
          calls: assetAddresses.map((address, i) => ({
            to: address,
            abi: [
              from12("function tokenURI(uint256) returns (string)")
            ],
            functionName: "tokenURI",
            args: [0n],
            from: zeroAddress,
            nonce: i
          })),
          stateOverrides: [
            {
              address: zeroAddress,
              nonce: 0
            }
          ]
        },
        // Symbols
        {
          calls: assetAddresses.map((address, i) => ({
            to: address,
            abi: [from12("function symbol() returns (string)")],
            functionName: "symbol",
            from: zeroAddress,
            nonce: i
          })),
          stateOverrides: [
            {
              address: zeroAddress,
              nonce: 0
            }
          ]
        }
      ] : []
    ],
    traceTransfers,
    validation
  });
  const block_results = traceAssetChanges ? blocks[2] : blocks[0];
  const [block_ethPre, block_assetsPre, , block_ethPost, block_assetsPost, block_decimals, block_tokenURI, block_symbols] = traceAssetChanges ? blocks : [];
  const { calls: block_calls, ...block } = block_results;
  const results = block_calls.slice(0, -1) ?? [];
  const ethPre = block_ethPre?.calls ?? [];
  const assetsPre = block_assetsPre?.calls ?? [];
  const balancesPre = [...ethPre, ...assetsPre].map((call2) => call2.status === "success" ? hexToBigInt(call2.data) : null);
  const ethPost = block_ethPost?.calls ?? [];
  const assetsPost = block_assetsPost?.calls ?? [];
  const balancesPost = [...ethPost, ...assetsPost].map((call2) => call2.status === "success" ? hexToBigInt(call2.data) : null);
  const decimals = (block_decimals?.calls ?? []).map((x) => x.status === "success" ? x.result : null);
  const symbols = (block_symbols?.calls ?? []).map((x) => x.status === "success" ? x.result : null);
  const tokenURI = (block_tokenURI?.calls ?? []).map((x) => x.status === "success" ? x.result : null);
  const changes = [];
  for (const [i, balancePost] of balancesPost.entries()) {
    const balancePre = balancesPre[i];
    if (typeof balancePost !== "bigint")
      continue;
    if (typeof balancePre !== "bigint")
      continue;
    const decimals_ = decimals[i - 1];
    const symbol_ = symbols[i - 1];
    const tokenURI_ = tokenURI[i - 1];
    const token = (() => {
      if (i === 0)
        return {
          address: ethAddress,
          decimals: 18,
          symbol: "ETH"
        };
      return {
        address: assetAddresses[i - 1],
        decimals: tokenURI_ || decimals_ ? Number(decimals_ ?? 1) : void 0,
        symbol: symbol_ ?? void 0
      };
    })();
    if (changes.some((change) => change.token.address === token.address))
      continue;
    changes.push({
      token,
      value: {
        pre: balancePre,
        post: balancePost,
        diff: balancePost - balancePre
      }
    });
  }
  return {
    assetChanges: changes,
    block,
    results
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/ox@0.14.30_zod@4.4.3/node_modules/ox/_esm/erc6492/SignatureErc6492.js
var SignatureErc6492_exports = {};
__export(SignatureErc6492_exports, {
  InvalidWrappedSignatureError: () => InvalidWrappedSignatureError2,
  assert: () => assert7,
  from: () => from13,
  magicBytes: () => magicBytes2,
  universalSignatureValidatorAbi: () => universalSignatureValidatorAbi,
  universalSignatureValidatorBytecode: () => universalSignatureValidatorBytecode,
  unwrap: () => unwrap2,
  validate: () => validate5,
  wrap: () => wrap2
});
init_Errors();
init_Hex();
var magicBytes2 = "0x6492649264926492649264926492649264926492649264926492649264926492";
var universalSignatureValidatorBytecode = "0x608060405234801561001057600080fd5b5060405161069438038061069483398101604081905261002f9161051e565b600061003c848484610048565b9050806000526001601ff35b60007f64926492649264926492649264926492649264926492649264926492649264926100748361040c565b036101e7576000606080848060200190518101906100929190610577565b60405192955090935091506000906001600160a01b038516906100b69085906105dd565b6000604051808303816000865af19150503d80600081146100f3576040519150601f19603f3d011682016040523d82523d6000602084013e6100f8565b606091505b50509050876001600160a01b03163b60000361016057806101605760405162461bcd60e51b815260206004820152601e60248201527f5369676e617475726556616c696461746f723a206465706c6f796d656e74000060448201526064015b60405180910390fd5b604051630b135d3f60e11b808252906001600160a01b038a1690631626ba7e90610190908b9087906004016105f9565b602060405180830381865afa1580156101ad573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101d19190610633565b6001600160e01b03191614945050505050610405565b6001600160a01b0384163b1561027a57604051630b135d3f60e11b808252906001600160a01b03861690631626ba7e9061022790879087906004016105f9565b602060405180830381865afa158015610244573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906102689190610633565b6001600160e01b031916149050610405565b81516041146102df5760405162461bcd60e51b815260206004820152603a602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e6174757265206c656e6774680000000000006064820152608401610157565b6102e7610425565b5060208201516040808401518451859392600091859190811061030c5761030c61065d565b016020015160f81c9050601b811480159061032b57508060ff16601c14155b1561038c5760405162461bcd60e51b815260206004820152603b602482015260008051602061067483398151915260448201527f3a20696e76616c6964207369676e617475726520762076616c756500000000006064820152608401610157565b60408051600081526020810180835289905260ff83169181019190915260608101849052608081018390526001600160a01b0389169060019060a0016020604051602081039080840390855afa1580156103ea573d6000803e3d6000fd5b505050602060405103516001600160a01b0316149450505050505b9392505050565b600060208251101561041d57600080fd5b508051015190565b60405180606001604052806003906020820280368337509192915050565b6001600160a01b038116811461045857600080fd5b50565b634e487b7160e01b600052604160045260246000fd5b60005b8381101561048c578181015183820152602001610474565b50506000910152565b600082601f8301126104a657600080fd5b81516001600160401b038111156104bf576104bf61045b565b604051601f8201601f19908116603f011681016001600160401b03811182821017156104ed576104ed61045b565b60405281815283820160200185101561050557600080fd5b610516826020830160208701610471565b949350505050565b60008060006060848603121561053357600080fd5b835161053e81610443565b6020850151604086015191945092506001600160401b0381111561056157600080fd5b61056d86828701610495565b9150509250925092565b60008060006060848603121561058c57600080fd5b835161059781610443565b60208501519093506001600160401b038111156105b357600080fd5b6105bf86828701610495565b604086015190935090506001600160401b0381111561056157600080fd5b600082516105ef818460208701610471565b9190910192915050565b828152604060208201526000825180604084015261061e816060850160208701610471565b601f01601f1916919091016060019392505050565b60006020828403121561064557600080fd5b81516001600160e01b03198116811461040557600080fd5b634e487b7160e01b600052603260045260246000fdfe5369676e617475726556616c696461746f72237265636f7665725369676e6572";
var universalSignatureValidatorAbi = [
  {
    inputs: [
      {
        name: "_signer",
        type: "address"
      },
      {
        name: "_hash",
        type: "bytes32"
      },
      {
        name: "_signature",
        type: "bytes"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [
      {
        name: "_signer",
        type: "address"
      },
      {
        name: "_hash",
        type: "bytes32"
      },
      {
        name: "_signature",
        type: "bytes"
      }
    ],
    outputs: [
      {
        type: "bool"
      }
    ],
    stateMutability: "nonpayable",
    type: "function",
    name: "isValidSig"
  }
];
function assert7(wrapped) {
  if (slice3(wrapped, -32) !== magicBytes2)
    throw new InvalidWrappedSignatureError2(wrapped);
}
function from13(wrapped) {
  if (typeof wrapped === "string")
    return unwrap2(wrapped);
  return wrapped;
}
function unwrap2(wrapped) {
  assert7(wrapped);
  const [to, data, signature] = decode(from5("address, bytes, bytes"), wrapped);
  return { data, signature, to };
}
function wrap2(value) {
  const { data, signature, to } = value;
  return concat2(encode2(from5("address, bytes, bytes"), [
    to,
    data,
    signature
  ]), magicBytes2);
}
function validate5(wrapped) {
  try {
    assert7(wrapped);
    return true;
  } catch {
    return false;
  }
}
var InvalidWrappedSignatureError2 = class extends BaseError3 {
  constructor(wrapped) {
    super(`Value \`${wrapped}\` is an invalid ERC-6492 wrapped signature.`);
    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "SignatureErc6492.InvalidWrappedSignatureError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/verifyHash.js
init_abis();
init_contracts();
init_contract();
init_encodeDeployData();
init_encodeFunctionData();
init_getAddress();
init_isAddressEqual();
init_concat();
init_isHex();
init_fromHex();
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/serializeSignature.js
init_secp256k1();
init_fromHex();
init_toBytes();
function serializeSignature({ r, s, to = "hex", v, yParity }) {
  const yParity_ = (() => {
    if (yParity === 0 || yParity === 1)
      return yParity;
    if (v && (v === 27n || v === 28n || v >= 35n))
      return v % 2n === 0n ? 1 : 0;
    throw new Error("Invalid `v` or `yParity` value");
  })();
  const signature = `0x${new secp256k1.Signature(hexToBigInt(r), hexToBigInt(s)).toCompactHex()}${yParity_ === 0 ? "1b" : "1c"}`;
  if (to === "hex")
    return signature;
  return hexToBytes(signature);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/verifyHash.js
init_call();
async function verifyHash(client, parameters) {
  const { address, chain = client.chain, hash: hash3, erc6492VerifierAddress: verifierAddress = parameters.universalSignatureVerifierAddress ?? chain?.contracts?.erc6492Verifier?.address, multicallAddress = parameters.multicallAddress ?? chain?.contracts?.multicall3?.address, mode = "auto" } = parameters;
  if (chain?.verifyHash)
    return await chain.verifyHash(client, parameters);
  const signature = (() => {
    const signature2 = parameters.signature;
    if (isHex(signature2))
      return signature2;
    if (typeof signature2 === "object" && "r" in signature2 && "s" in signature2)
      return serializeSignature(signature2);
    return bytesToHex(signature2);
  })();
  try {
    if (mode === "eoa") {
      try {
        const verified = isAddressEqual(getAddress(address), await recoverAddress({ hash: hash3, signature }));
        if (verified)
          return true;
      } catch {
      }
    }
    if (SignatureErc8010_exports.validate(signature))
      return await verifyErc8010(client, {
        ...parameters,
        multicallAddress,
        signature
      });
    return await verifyErc6492(client, {
      ...parameters,
      verifierAddress,
      signature
    });
  } catch (error) {
    if (mode !== "eoa") {
      try {
        const verified = isAddressEqual(getAddress(address), await recoverAddress({ hash: hash3, signature }));
        if (verified)
          return true;
      } catch {
      }
    }
    if (error instanceof VerificationError) {
      return false;
    }
    throw error;
  }
}
async function verifyErc8010(client, parameters) {
  const { address, blockNumber, blockTag, hash: hash3, multicallAddress } = parameters;
  const { authorization: authorization_ox, data: initData, signature, to } = SignatureErc8010_exports.unwrap(parameters.signature);
  const code = await getCode(client, {
    address,
    blockNumber,
    blockTag
  });
  if (code === concatHex(["0xef0100", authorization_ox.address]))
    return await verifyErc1271(client, {
      address,
      blockNumber,
      blockTag,
      hash: hash3,
      signature
    });
  const authorization = {
    address: authorization_ox.address,
    chainId: Number(authorization_ox.chainId),
    nonce: Number(authorization_ox.nonce),
    r: numberToHex(authorization_ox.r, { size: 32 }),
    s: numberToHex(authorization_ox.s, { size: 32 }),
    yParity: authorization_ox.yParity
  };
  const valid = await verifyAuthorization({
    address,
    authorization
  });
  if (!valid)
    throw new VerificationError();
  const results = await getAction(client, readContract, "readContract")({
    ...multicallAddress ? { address: multicallAddress } : { code: multicall3Bytecode },
    authorizationList: [authorization],
    abi: multicall3Abi,
    blockNumber,
    blockTag: "pending",
    functionName: "aggregate3",
    args: [
      [
        ...initData ? [
          {
            allowFailure: true,
            target: to ?? address,
            callData: initData
          }
        ] : [],
        {
          allowFailure: true,
          target: address,
          callData: encodeFunctionData({
            abi: erc1271Abi,
            functionName: "isValidSignature",
            args: [hash3, signature]
          })
        }
      ]
    ]
  });
  const data = results[results.length - 1]?.returnData;
  if (data?.startsWith("0x1626ba7e"))
    return true;
  throw new VerificationError();
}
async function verifyErc6492(client, parameters) {
  const { address, factory, factoryData, hash: hash3, signature, verifierAddress, ...rest } = parameters;
  const wrappedSignature = await (async () => {
    if (!factory && !factoryData)
      return signature;
    if (SignatureErc6492_exports.validate(signature))
      return signature;
    return SignatureErc6492_exports.wrap({
      data: factoryData,
      signature,
      to: factory
    });
  })();
  const args = verifierAddress ? {
    to: verifierAddress,
    data: encodeFunctionData({
      abi: erc6492SignatureValidatorAbi,
      functionName: "isValidSig",
      args: [address, hash3, wrappedSignature]
    }),
    ...rest
  } : {
    data: encodeDeployData({
      abi: erc6492SignatureValidatorAbi,
      args: [address, hash3, wrappedSignature],
      bytecode: erc6492SignatureValidatorByteCode
    }),
    ...rest
  };
  const { data } = await getAction(client, call, "call")(args).catch((error) => {
    if (error instanceof CallExecutionError)
      throw new VerificationError();
    throw error;
  });
  if (hexToBool(data ?? "0x0"))
    return true;
  throw new VerificationError();
}
async function verifyErc1271(client, parameters) {
  const { address, blockNumber, blockTag, hash: hash3, signature } = parameters;
  const result = await getAction(client, readContract, "readContract")({
    address,
    abi: erc1271Abi,
    args: [hash3, signature],
    blockNumber,
    blockTag,
    functionName: "isValidSignature"
  }).catch((error) => {
    if (error instanceof ContractFunctionExecutionError)
      throw new VerificationError();
    throw error;
  });
  if (result.startsWith("0x1626ba7e"))
    return true;
  throw new VerificationError();
}
var VerificationError = class extends Error {
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/verifyMessage.js
async function verifyMessage(client, { address, message, factory, factoryData, signature, ...callRequest }) {
  const hash3 = hashMessage(message);
  return getAction(client, verifyHash, "verifyHash")({
    address,
    factory,
    factoryData,
    hash: hash3,
    signature,
    ...callRequest
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/verifyTypedData.js
async function verifyTypedData2(client, parameters) {
  const { address, factory, factoryData, signature, message, primaryType, types, domain, ...callRequest } = parameters;
  const hash3 = hashTypedData({ message, primaryType, types, domain });
  return getAction(client, verifyHash, "verifyHash")({
    address,
    factory,
    factoryData,
    hash: hash3,
    signature,
    ...callRequest
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/waitForTransactionReceipt.js
init_transaction();
init_withResolvers();
init_stringify();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchBlockNumber.js
init_fromHex();
init_stringify();
function watchBlockNumber(client, { emitOnBegin = false, emitMissed = false, onBlockNumber, onError, poll: poll_, pollingInterval = client.pollingInterval }) {
  const enablePolling = (() => {
    if (typeof poll_ !== "undefined")
      return poll_;
    if (client.transport.type === "webSocket" || client.transport.type === "ipc")
      return false;
    if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc"))
      return false;
    return true;
  })();
  let prevBlockNumber;
  const pollBlockNumber = () => {
    const observerId = stringify([
      "watchBlockNumber",
      client.uid,
      emitOnBegin,
      emitMissed,
      pollingInterval
    ]);
    return observe(observerId, { onBlockNumber, onError }, (emit) => poll(async () => {
      try {
        const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({ cacheTime: 0 });
        if (prevBlockNumber !== void 0) {
          if (blockNumber === prevBlockNumber)
            return;
          if (blockNumber - prevBlockNumber > 1 && emitMissed) {
            for (let i = prevBlockNumber + 1n; i < blockNumber; i++) {
              emit.onBlockNumber(i, prevBlockNumber);
              prevBlockNumber = i;
            }
          }
        }
        if (prevBlockNumber === void 0 || blockNumber > prevBlockNumber) {
          emit.onBlockNumber(blockNumber, prevBlockNumber);
          prevBlockNumber = blockNumber;
        }
      } catch (err) {
        emit.onError?.(err);
      }
    }, {
      emitOnBegin,
      interval: pollingInterval
    }));
  };
  const subscribeBlockNumber = () => {
    const observerId = stringify([
      "watchBlockNumber",
      client.uid,
      emitOnBegin,
      emitMissed
    ]);
    return observe(observerId, { onBlockNumber, onError }, (emit) => {
      let active = true;
      let unsubscribe = () => active = false;
      (async () => {
        try {
          const transport = (() => {
            if (client.transport.type === "fallback") {
              const transport2 = client.transport.transports.find((transport3) => transport3.config.type === "webSocket" || transport3.config.type === "ipc");
              if (!transport2)
                return client.transport;
              return transport2.value;
            }
            return client.transport;
          })();
          const { unsubscribe: unsubscribe_ } = await transport.subscribe({
            params: ["newHeads"],
            onData(data) {
              if (!active)
                return;
              const blockNumber = hexToBigInt(data.result?.number);
              emit.onBlockNumber(blockNumber, prevBlockNumber);
              prevBlockNumber = blockNumber;
            },
            onError(error) {
              emit.onError?.(error);
            }
          });
          unsubscribe = unsubscribe_;
          if (!active)
            unsubscribe();
        } catch (err) {
          onError?.(err);
        }
      })();
      return () => unsubscribe();
    });
  };
  return enablePolling ? pollBlockNumber() : subscribeBlockNumber();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/waitForTransactionReceipt.js
async function waitForTransactionReceipt(client, parameters) {
  const {
    checkReplacement = true,
    confirmations = 1,
    hash: hash3,
    onReplaced,
    retryCount = 6,
    retryDelay = ({ count }) => ~~(1 << count) * 200,
    // exponential backoff
    timeout = 18e4
  } = parameters;
  const observerId = stringify(["waitForTransactionReceipt", client.uid, hash3]);
  const pollingInterval = (() => {
    if (parameters.pollingInterval)
      return parameters.pollingInterval;
    if (client.chain?.experimental_preconfirmationTime)
      return client.chain.experimental_preconfirmationTime;
    return client.pollingInterval;
  })();
  let transaction;
  let replacedTransaction;
  let receipt;
  let retrying = false;
  let _unobserve;
  let _unwatch;
  const { promise, resolve, reject } = withResolvers();
  const timer = timeout ? setTimeout(() => {
    _unwatch?.();
    _unobserve?.();
    reject(new WaitForTransactionReceiptTimeoutError({ hash: hash3 }));
  }, timeout) : void 0;
  _unobserve = observe(observerId, { onReplaced, resolve, reject }, async (emit) => {
    receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash: hash3 }).catch(() => void 0);
    if (receipt && confirmations <= 1) {
      clearTimeout(timer);
      emit.resolve(receipt);
      _unobserve?.();
      return;
    }
    _unwatch = getAction(client, watchBlockNumber, "watchBlockNumber")({
      emitMissed: true,
      emitOnBegin: true,
      poll: true,
      pollingInterval,
      async onBlockNumber(blockNumber_) {
        const done = (fn) => {
          clearTimeout(timer);
          _unwatch?.();
          fn();
          _unobserve?.();
        };
        let blockNumber = blockNumber_;
        if (retrying)
          return;
        try {
          if (receipt) {
            if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations))
              return;
            done(() => emit.resolve(receipt));
            return;
          }
          if (checkReplacement && !transaction) {
            retrying = true;
            await withRetry(async () => {
              transaction = await getAction(client, getTransaction, "getTransaction")({ hash: hash3 });
              if (transaction.blockNumber)
                blockNumber = transaction.blockNumber;
            }, {
              delay: retryDelay,
              retryCount
            });
            retrying = false;
          }
          receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({ hash: hash3 });
          if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations))
            return;
          done(() => emit.resolve(receipt));
        } catch (err) {
          if (err instanceof TransactionNotFoundError || err instanceof TransactionReceiptNotFoundError) {
            if (!transaction) {
              retrying = false;
              return;
            }
            try {
              replacedTransaction = transaction;
              retrying = true;
              const block = await withRetry(() => getAction(client, getBlock, "getBlock")({
                blockNumber,
                includeTransactions: true
              }), {
                delay: retryDelay,
                retryCount,
                shouldRetry: ({ error }) => error instanceof BlockNotFoundError
              });
              retrying = false;
              const replacementTransaction = block.transactions.find(({ from: from14, nonce }) => from14 === replacedTransaction.from && nonce === replacedTransaction.nonce);
              if (!replacementTransaction)
                return;
              receipt = await getAction(client, getTransactionReceipt, "getTransactionReceipt")({
                hash: replacementTransaction.hash
              });
              if (confirmations > 1 && (!receipt.blockNumber || blockNumber - receipt.blockNumber + 1n < confirmations))
                return;
              let reason = "replaced";
              if (replacementTransaction.to === replacedTransaction.to && replacementTransaction.value === replacedTransaction.value && replacementTransaction.input === replacedTransaction.input) {
                reason = "repriced";
              } else if (replacementTransaction.from === replacementTransaction.to && replacementTransaction.value === 0n) {
                reason = "cancelled";
              }
              done(() => {
                emit.onReplaced?.({
                  reason,
                  replacedTransaction,
                  transaction: replacementTransaction,
                  transactionReceipt: receipt
                });
                emit.resolve(receipt);
              });
            } catch (err_) {
              done(() => emit.reject(err_));
            }
          } else {
            done(() => emit.reject(err));
          }
        }
      }
    });
  });
  return promise;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchBlocks.js
init_stringify();
function watchBlocks(client, { blockTag = client.experimental_blockTag ?? "latest", emitMissed = false, emitOnBegin = false, onBlock, onError, includeTransactions: includeTransactions_, poll: poll_, pollingInterval = client.pollingInterval }) {
  const enablePolling = (() => {
    if (typeof poll_ !== "undefined")
      return poll_;
    if (client.transport.type === "webSocket" || client.transport.type === "ipc")
      return false;
    if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc"))
      return false;
    return true;
  })();
  const includeTransactions = includeTransactions_ ?? false;
  let prevBlock;
  const pollBlocks = () => {
    const observerId = stringify([
      "watchBlocks",
      client.uid,
      blockTag,
      emitMissed,
      emitOnBegin,
      includeTransactions,
      pollingInterval
    ]);
    return observe(observerId, { onBlock, onError }, (emit) => poll(async () => {
      try {
        const block = await getAction(client, getBlock, "getBlock")({
          blockTag,
          includeTransactions
        });
        if (block.number !== null && prevBlock?.number != null) {
          if (block.number === prevBlock.number)
            return;
          if (block.number - prevBlock.number > 1 && emitMissed) {
            for (let i = prevBlock?.number + 1n; i < block.number; i++) {
              const block2 = await getAction(client, getBlock, "getBlock")({
                blockNumber: i,
                includeTransactions
              });
              emit.onBlock(block2, prevBlock);
              prevBlock = block2;
            }
          }
        }
        if (
          // If no previous block exists, emit.
          prevBlock?.number == null || // If the block tag is "pending" with no block number, emit.
          blockTag === "pending" && block?.number == null || // If the next block number is greater than the previous block number, emit.
          // We don't want to emit blocks in the past.
          block.number !== null && block.number > prevBlock.number
        ) {
          emit.onBlock(block, prevBlock);
          prevBlock = block;
        }
      } catch (err) {
        emit.onError?.(err);
      }
    }, {
      emitOnBegin,
      interval: pollingInterval
    }));
  };
  const subscribeBlocks = () => {
    let active = true;
    let emitFetched = true;
    let unsubscribe = () => active = false;
    (async () => {
      try {
        if (emitOnBegin) {
          getAction(client, getBlock, "getBlock")({
            blockTag,
            includeTransactions
          }).then((block) => {
            if (!active)
              return;
            if (!emitFetched)
              return;
            onBlock(block, void 0);
            emitFetched = false;
          }).catch(onError);
        }
        const transport = (() => {
          if (client.transport.type === "fallback") {
            const transport2 = client.transport.transports.find((transport3) => transport3.config.type === "webSocket" || transport3.config.type === "ipc");
            if (!transport2)
              return client.transport;
            return transport2.value;
          }
          return client.transport;
        })();
        const { unsubscribe: unsubscribe_ } = await transport.subscribe({
          params: ["newHeads"],
          async onData(data) {
            if (!active)
              return;
            const block = await getAction(client, getBlock, "getBlock")({
              blockNumber: data.result?.number,
              includeTransactions
            }).catch(() => {
            });
            if (!active)
              return;
            onBlock(block, prevBlock);
            emitFetched = false;
            prevBlock = block;
          },
          onError(error) {
            onError?.(error);
          }
        });
        unsubscribe = unsubscribe_;
        if (!active)
          unsubscribe();
      } catch (err) {
        onError?.(err);
      }
    })();
    return () => unsubscribe();
  };
  return enablePolling ? pollBlocks() : subscribeBlocks();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchEvent.js
init_abi();
init_rpc();
init_stringify();
function watchEvent(client, { address, args, batch = true, event, events, fromBlock, onError, onLogs, poll: poll_, pollingInterval = client.pollingInterval, strict: strict_ }) {
  const enablePolling = (() => {
    if (typeof poll_ !== "undefined")
      return poll_;
    if (typeof fromBlock === "bigint")
      return true;
    if (client.transport.type === "webSocket" || client.transport.type === "ipc")
      return false;
    if (client.transport.type === "fallback" && (client.transport.transports[0].config.type === "webSocket" || client.transport.transports[0].config.type === "ipc"))
      return false;
    return true;
  })();
  const strict = strict_ ?? false;
  const pollEvent = () => {
    const observerId = stringify([
      "watchEvent",
      address,
      args,
      batch,
      client.uid,
      event,
      pollingInterval,
      fromBlock
    ]);
    return observe(observerId, { onLogs, onError }, (emit) => {
      let previousBlockNumber;
      if (fromBlock !== void 0)
        previousBlockNumber = fromBlock - 1n;
      let filter;
      let initialized = false;
      const unwatch = poll(async () => {
        if (!initialized) {
          try {
            filter = await getAction(client, createEventFilter, "createEventFilter")({
              address,
              args,
              event,
              events,
              strict,
              fromBlock
            });
          } catch {
          }
          initialized = true;
          return;
        }
        try {
          let logs;
          if (filter) {
            logs = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
          } else {
            const blockNumber = await getAction(client, getBlockNumber, "getBlockNumber")({});
            if (previousBlockNumber && previousBlockNumber !== blockNumber) {
              logs = await getAction(client, getLogs, "getLogs")({
                address,
                args,
                event,
                events,
                fromBlock: previousBlockNumber + 1n,
                toBlock: blockNumber
              });
            } else {
              logs = [];
            }
            previousBlockNumber = blockNumber;
          }
          if (logs.length === 0)
            return;
          if (batch)
            emit.onLogs(logs);
          else
            for (const log of logs)
              emit.onLogs([log]);
        } catch (err) {
          if (filter && err instanceof InvalidInputRpcError)
            initialized = false;
          emit.onError?.(err);
        }
      }, {
        emitOnBegin: true,
        interval: pollingInterval
      });
      return async () => {
        if (filter)
          await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
        unwatch();
      };
    });
  };
  const subscribeEvent = () => {
    let active = true;
    let unsubscribe = () => active = false;
    (async () => {
      try {
        const transport = (() => {
          if (client.transport.type === "fallback") {
            const transport2 = client.transport.transports.find((transport3) => transport3.config.type === "webSocket" || transport3.config.type === "ipc");
            if (!transport2)
              return client.transport;
            return transport2.value;
          }
          return client.transport;
        })();
        const events_ = events ?? (event ? [event] : void 0);
        let topics = [];
        if (events_) {
          const encoded = events_.flatMap((event2) => encodeEventTopics({
            abi: [event2],
            eventName: event2.name,
            args
          }));
          topics = [encoded];
          if (event)
            topics = topics[0];
        }
        const { unsubscribe: unsubscribe_ } = await transport.subscribe({
          params: ["logs", { address, topics }],
          onData(data) {
            if (!active)
              return;
            const log = data.result;
            try {
              const { eventName, args: args2 } = decodeEventLog({
                abi: events_ ?? [],
                data: log.data,
                topics: log.topics,
                strict
              });
              const formatted = formatLog(log, { args: args2, eventName });
              onLogs([formatted]);
            } catch (err) {
              let eventName;
              let isUnnamed;
              if (err instanceof DecodeLogDataMismatch || err instanceof DecodeLogTopicsMismatch) {
                if (strict_)
                  return;
                eventName = err.abiItem.name;
                isUnnamed = err.abiItem.inputs?.some((x) => !("name" in x && x.name));
              }
              const formatted = formatLog(log, {
                args: isUnnamed ? [] : {},
                eventName
              });
              onLogs([formatted]);
            }
          },
          onError(error) {
            onError?.(error);
          }
        });
        unsubscribe = unsubscribe_;
        if (!active)
          unsubscribe();
      } catch (err) {
        onError?.(err);
      }
    })();
    return () => unsubscribe();
  };
  return enablePolling ? pollEvent() : subscribeEvent();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/public/watchPendingTransactions.js
init_stringify();
function watchPendingTransactions(client, { batch = true, onError, onTransactions, poll: poll_, pollingInterval = client.pollingInterval }) {
  const enablePolling = typeof poll_ !== "undefined" ? poll_ : client.transport.type !== "webSocket" && client.transport.type !== "ipc";
  const pollPendingTransactions = () => {
    const observerId = stringify([
      "watchPendingTransactions",
      client.uid,
      batch,
      pollingInterval
    ]);
    return observe(observerId, { onTransactions, onError }, (emit) => {
      let filter;
      const unwatch = poll(async () => {
        try {
          if (!filter) {
            try {
              filter = await getAction(client, createPendingTransactionFilter, "createPendingTransactionFilter")({});
              return;
            } catch (err) {
              unwatch();
              throw err;
            }
          }
          const hashes = await getAction(client, getFilterChanges, "getFilterChanges")({ filter });
          if (hashes.length === 0)
            return;
          if (batch)
            emit.onTransactions(hashes);
          else
            for (const hash3 of hashes)
              emit.onTransactions([hash3]);
        } catch (err) {
          emit.onError?.(err);
        }
      }, {
        emitOnBegin: true,
        interval: pollingInterval
      });
      return async () => {
        if (filter)
          await getAction(client, uninstallFilter, "uninstallFilter")({ filter });
        unwatch();
      };
    });
  };
  const subscribePendingTransactions = () => {
    let active = true;
    let unsubscribe = () => active = false;
    (async () => {
      try {
        const { unsubscribe: unsubscribe_ } = await client.transport.subscribe({
          params: ["newPendingTransactions"],
          onData(data) {
            if (!active)
              return;
            const transaction = data.result;
            onTransactions([transaction]);
          },
          onError(error) {
            onError?.(error);
          }
        });
        unsubscribe = unsubscribe_;
        if (!active)
          unsubscribe();
      } catch (err) {
        onError?.(err);
      }
    })();
    return () => unsubscribe();
  };
  return enablePolling ? pollPendingTransactions() : subscribePendingTransactions();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/siwe/parseSiweMessage.js
function parseSiweMessage(message) {
  const { scheme, statement, ...prefix } = message.match(prefixRegex)?.groups ?? {};
  const { chainId, expirationTime, issuedAt, notBefore, requestId, ...suffix } = message.match(suffixRegex)?.groups ?? {};
  const resources = message.split("Resources:")[1]?.split("\n- ").slice(1);
  return {
    ...prefix,
    ...suffix,
    ...chainId ? { chainId: Number(chainId) } : {},
    ...expirationTime ? { expirationTime: new Date(expirationTime) } : {},
    ...issuedAt ? { issuedAt: new Date(issuedAt) } : {},
    ...notBefore ? { notBefore: new Date(notBefore) } : {},
    ...requestId ? { requestId } : {},
    ...resources ? { resources } : {},
    ...scheme ? { scheme } : {},
    ...statement ? { statement } : {}
  };
}
var prefixRegex = /^(?:(?<scheme>[a-zA-Z][a-zA-Z0-9+-.]*):\/\/)?(?<domain>[a-zA-Z0-9+-.]*(?::[0-9]{1,5})?) (?:wants you to sign in with your Ethereum account:\n)(?<address>0x[a-fA-F0-9]{40})\n\n(?:(?<statement>.*)\n\n)?/;
var suffixRegex = /(?:URI: (?<uri>.+))\n(?:Version: (?<version>.+))\n(?:Chain ID: (?<chainId>\d+))\n(?:Nonce: (?<nonce>[a-zA-Z0-9]+))\n(?:Issued At: (?<issuedAt>.+))(?:\nExpiration Time: (?<expirationTime>.+))?(?:\nNot Before: (?<notBefore>.+))?(?:\nRequest ID: (?<requestId>.+))?/;

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/siwe/validateSiweMessage.js
init_isAddress();
init_isAddressEqual();
function validateSiweMessage(parameters) {
  const { address, domain, message, nonce, scheme, time = /* @__PURE__ */ new Date() } = parameters;
  if (domain && message.domain !== domain)
    return false;
  if (nonce && message.nonce !== nonce)
    return false;
  if (scheme && message.scheme !== scheme)
    return false;
  if (message.expirationTime && time >= message.expirationTime)
    return false;
  if (message.notBefore && time < message.notBefore)
    return false;
  try {
    if (!message.address)
      return false;
    if (!isAddress(message.address, { strict: false }))
      return false;
    if (address && !isAddressEqual(message.address, address))
      return false;
  } catch {
    return false;
  }
  return true;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/siwe/verifySiweMessage.js
async function verifySiweMessage(client, parameters) {
  const { address, domain, message, nonce, scheme, signature, time = /* @__PURE__ */ new Date(), ...callRequest } = parameters;
  const parsed = parseSiweMessage(message);
  if (!parsed.address)
    return false;
  const isValid = validateSiweMessage({
    address,
    domain,
    message: parsed,
    nonce,
    scheme,
    time
  });
  if (!isValid)
    return false;
  const hash3 = hashMessage(message);
  return verifyHash(client, {
    address: parsed.address,
    hash: hash3,
    signature,
    ...callRequest
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/token/internal.js
init_abis();
init_isAddress();
init_isAddressEqual();
init_formatUnits();
function toAmount(amount, decimals) {
  return { amount, decimals, formatted: formatUnits(amount, decimals) };
}
function resolveToken(client, parameters) {
  const { decimals, token } = parameters;
  const declared = findDeclaredToken(client, token);
  if (declared)
    return {
      address: declared.address,
      decimals: decimals ?? declared.decimals
    };
  if (isAddress(token, { strict: false }))
    return {
      address: token,
      decimals: decimals ?? inferDecimals(client, token)
    };
  throw new Error(`Token "${token}" is not a declared ERC-20 token on the client's \`tokens\` array (with an address for the client's chain), and is not a valid address.`);
}
function findDeclaredToken(client, token) {
  const tokens = client.tokens;
  const chainId = client.chain?.id;
  if (!tokens || chainId === void 0)
    return void 0;
  const bySymbol = findTokenBySymbol(tokens, token);
  if (bySymbol)
    return resolveTokenForChain(bySymbol, chainId);
  if (isAddress(token, { strict: false }))
    for (const token_ of tokens) {
      const resolved = resolveTokenForChain(token_, chainId);
      if (resolved && isAddressEqual(resolved.address, token))
        return resolved;
    }
  return void 0;
}
function resolveTokenForChain(token, chainId) {
  const address = token.addresses[chainId];
  if (!address)
    return void 0;
  return {
    address,
    currency: token.currency,
    decimals: token.decimals,
    name: token.name,
    popular: token.popular,
    symbol: token.symbol
  };
}
function findTokenBySymbol(tokens, symbol) {
  const lowerSymbol = symbol.toLowerCase();
  for (const token of tokens) {
    if (token.symbol?.toLowerCase() === lowerSymbol)
      return token;
  }
  return void 0;
}
function inferDecimals(client, address) {
  const tokens = client.tokens;
  const chainId = client.chain?.id;
  if (tokens && chainId !== void 0)
    for (const token of tokens) {
      const resolved = resolveTokenForChain(token, chainId);
      if (resolved && isAddressEqual(resolved.address, address))
        return resolved.decimals;
    }
  return void 0;
}
async function resolveTokenWithDecimals(client, parameters) {
  const { address, decimals } = resolveToken(client, parameters);
  if (decimals !== void 0)
    return { address, decimals };
  return {
    address,
    decimals: await readContract(client, {
      abi: erc20Abi,
      address,
      functionName: "decimals"
    })
  };
}
function defineCall(call2) {
  return {
    ...call2,
    data: encodeFunctionData(call2),
    to: call2.address
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/wallet/sendRawTransactionSync.js
init_transaction();
async function sendRawTransactionSync(client, { serializedTransaction, throwOnReceiptRevert, timeout }) {
  const receipt = await client.request({
    method: "eth_sendRawTransactionSync",
    params: timeout ? [serializedTransaction, timeout] : [serializedTransaction]
  }, { retryCount: 0 });
  const format = client.chain?.formatters?.transactionReceipt?.format || formatTransactionReceipt;
  const formatted = format(receipt);
  if (formatted.status === "reverted" && throwOnReceiptRevert)
    throw new TransactionReceiptRevertedError({ receipt: formatted });
  return formatted;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/token/getAllowance.js
init_abis();
async function getAllowance(client, parameters) {
  const { account, decimals, spender, token, ...rest } = parameters;
  const [amount, { decimals: resolved }] = await Promise.all([
    readContract(client, {
      ...rest,
      ...getAllowance.call(client, { account, spender, token })
    }),
    resolveTokenWithDecimals(client, {
      decimals,
      token
    })
  ]);
  return toAmount(amount, resolved);
}
(function(getAllowance2) {
  function call2(client, args) {
    return defineCall({
      address: resolveToken(client, args).address,
      abi: erc20Abi,
      functionName: "allowance",
      args: [args.account, args.spender]
    });
  }
  getAllowance2.call = call2;
})(getAllowance || (getAllowance = {}));

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/token/getBalance.js
init_parseAccount();
init_abis();
async function getBalance2(client, parameters) {
  const { account: account_ = client.account, decimals, token, ...rest } = parameters;
  if (!account_)
    throw new AccountNotFoundError();
  const account = parseAccount(account_).address;
  const [amount, { decimals: resolved }] = await Promise.all([
    readContract(client, {
      ...rest,
      ...getBalance2.call(client, { account, token })
    }),
    resolveTokenWithDecimals(client, {
      decimals,
      token
    })
  ]);
  return toAmount(amount, resolved);
}
(function(getBalance3) {
  function call2(client, args) {
    const account_ = args.account ?? client.account;
    if (!account_)
      throw new AccountNotFoundError();
    const account = parseAccount(account_).address;
    return defineCall({
      address: resolveToken(client, args).address,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [account]
    });
  }
  getBalance3.call = call2;
})(getBalance2 || (getBalance2 = {}));

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/token/getMetadata.js
init_abis();
async function getMetadata(client, parameters) {
  const { token, ...rest } = parameters;
  const { address } = resolveToken(client, { token });
  const declared = findDeclaredToken(client, token);
  const [decimals_, name, symbol] = await Promise.all([
    declared?.decimals ?? readContract(client, {
      ...rest,
      abi: erc20Abi,
      address,
      functionName: "decimals"
    }),
    declared?.name ?? readContract(client, {
      ...rest,
      abi: erc20Abi,
      address,
      functionName: "name"
    }),
    declared?.symbol ?? readContract(client, {
      ...rest,
      abi: erc20Abi,
      address,
      functionName: "symbol"
    })
  ]);
  return {
    decimals: decimals_,
    name,
    symbol
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/actions/token/getTotalSupply.js
init_abis();
async function getTotalSupply(client, parameters) {
  const { decimals, token, ...rest } = parameters;
  const [amount, { decimals: resolved }] = await Promise.all([
    readContract(client, {
      ...rest,
      ...getTotalSupply.call(client, { token })
    }),
    resolveTokenWithDecimals(client, {
      decimals,
      token
    })
  ]);
  return toAmount(amount, resolved);
}
(function(getTotalSupply2) {
  function call2(client, args) {
    return defineCall({
      address: resolveToken(client, args).address,
      abi: erc20Abi,
      args: [],
      functionName: "totalSupply"
    });
  }
  getTotalSupply2.call = call2;
})(getTotalSupply || (getTotalSupply = {}));

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/decorators/public.js
function publicActions(client) {
  return {
    call: (args) => call(client, args),
    createAccessList: (args) => createAccessList(client, args),
    createBlockFilter: () => createBlockFilter(client),
    createContractEventFilter: (args) => createContractEventFilter(client, args),
    createEventFilter: (args) => createEventFilter(client, args),
    createPendingTransactionFilter: () => createPendingTransactionFilter(client),
    estimateContractGas: (args) => estimateContractGas(client, args),
    estimateGas: (args) => estimateGas(client, args),
    getBalance: (args) => getBalance(client, args),
    getBlobBaseFee: () => getBlobBaseFee(client),
    getBlock: (args) => getBlock(client, args),
    getBlockNumber: (args) => getBlockNumber(client, args),
    getBlockReceipts: (args) => getBlockReceipts(client, args),
    getBlockTransactionCount: (args) => getBlockTransactionCount(client, args),
    getBytecode: (args) => getCode(client, args),
    getChainId: () => getChainId(client),
    getCode: (args) => getCode(client, args),
    getContractEvents: (args) => getContractEvents(client, args),
    getDelegation: (args) => getDelegation(client, args),
    getEip712Domain: (args) => getEip712Domain(client, args),
    getEnsAddress: (args) => getEnsAddress(client, args),
    getEnsAvatar: (args) => getEnsAvatar(client, args),
    getEnsName: (args) => getEnsName(client, args),
    getEnsResolver: (args) => getEnsResolver(client, args),
    getEnsText: (args) => getEnsText(client, args),
    getFeeHistory: (args) => getFeeHistory(client, args),
    estimateFeesPerGas: (args) => estimateFeesPerGas(client, args),
    getFilterChanges: (args) => getFilterChanges(client, args),
    getFilterLogs: (args) => getFilterLogs(client, args),
    getGasPrice: () => getGasPrice(client),
    getLogs: (args) => getLogs(client, args),
    getProof: (args) => getProof(client, args),
    estimateMaxPriorityFeePerGas: (args) => estimateMaxPriorityFeePerGas(client, args),
    fillTransaction: (args) => fillTransaction(client, args),
    getRawTransaction: (args) => getRawTransaction(client, args),
    getStorageAt: (args) => getStorageAt(client, args),
    getTransaction: (args) => getTransaction(client, args),
    getTransactionConfirmations: (args) => getTransactionConfirmations(client, args),
    getTransactionCount: (args) => getTransactionCount(client, args),
    getTransactionReceipt: (args) => getTransactionReceipt(client, args),
    multicall: (args) => multicall(client, args),
    prepareTransactionRequest: (args) => prepareTransactionRequest(client, args),
    readContract: (args) => readContract(client, args),
    sendRawTransaction: (args) => sendRawTransaction(client, args),
    sendRawTransactionSync: (args) => sendRawTransactionSync(client, args),
    simulate: (args) => simulateBlocks(client, args),
    simulateBlocks: (args) => simulateBlocks(client, args),
    simulateCalls: (args) => simulateCalls(client, args),
    simulateContract: (args) => simulateContract(client, args),
    verifyHash: (args) => verifyHash(client, args),
    verifyMessage: (args) => verifyMessage(client, args),
    verifySiweMessage: (args) => verifySiweMessage(client, args),
    verifyTypedData: (args) => verifyTypedData2(client, args),
    uninstallFilter: (args) => uninstallFilter(client, args),
    waitForTransactionReceipt: (args) => waitForTransactionReceipt(client, args),
    watchBlocks: (args) => watchBlocks(client, args),
    watchBlockNumber: (args) => watchBlockNumber(client, args),
    watchContractEvent: (args) => watchContractEvent(client, args),
    watchEvent: (args) => watchEvent(client, args),
    watchPendingTransactions: (args) => watchPendingTransactions(client, args),
    token: bindPublicToken(client)
  };
}
function bindPublicToken(client) {
  return {
    getAllowance: bindActionDecorators(client, getAllowance),
    getBalance: bindActionDecorators(client, getBalance2),
    getMetadata: bindActionDecorators(client, getMetadata),
    getTotalSupply: bindActionDecorators(client, getTotalSupply)
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/createPublicClient.js
function createPublicClient(parameters) {
  const { key = "public", name = "Public Client" } = parameters;
  const client = createClient({
    ...parameters,
    key,
    name,
    type: "publicClient"
  });
  return client.extend(publicActions);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/transports/createTransport.js
function createTransport({ key, methods, name, request, retryCount = 3, retryDelay = 150, timeout, type }, value) {
  const uid2 = uid();
  return {
    config: {
      key,
      methods,
      name,
      request,
      retryCount,
      retryDelay,
      timeout,
      type
    },
    request: buildRequest(request, { methods, retryCount, retryDelay, uid: uid2 }),
    value
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/transports/http.js
init_request();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/errors/transport.js
init_base();
var UrlRequiredError = class extends BaseError2 {
  constructor() {
    super("No URL was provided to the Transport. Please provide a valid RPC URL to the Transport.", {
      docsPath: "/docs/clients/intro",
      name: "UrlRequiredError"
    });
  }
};

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/clients/transports/http.js
init_createBatchScheduler();
var signalId = 0;
var signalIds = /* @__PURE__ */ new WeakMap();
function getSignalId(signal) {
  if (!signal)
    return "default";
  const id = signalIds.get(signal);
  if (id !== void 0)
    return id;
  const nextId = signalId++;
  signalIds.set(signal, nextId);
  return nextId;
}
function http(url, config = {}) {
  const { batch, fetchFn, fetchOptions, key = "http", maxResponseBodySize, methods, name = "HTTP JSON-RPC", onFetchRequest, onFetchResponse, retryDelay, raw } = config;
  return ({ chain, retryCount: retryCount_, timeout: timeout_ }) => {
    const { batchSize = 1e3, wait: wait2 = 0 } = typeof batch === "object" ? batch : {};
    const retryCount = config.retryCount ?? retryCount_;
    const timeout = timeout_ ?? config.timeout ?? 1e4;
    const url_ = url || chain?.rpcUrls.default.http[0];
    if (!url_)
      throw new UrlRequiredError();
    const rpcClient = getHttpRpcClient(url_, {
      fetchFn,
      fetchOptions,
      maxResponseBodySize,
      onRequest: onFetchRequest,
      onResponse: onFetchResponse,
      timeout
    });
    return createTransport({
      key,
      methods,
      name,
      async request({ method, params }, options) {
        const body = { method, params };
        const fetchOptions2 = options?.signal ? { signal: options.signal } : void 0;
        const { schedule } = createBatchScheduler({
          id: `${url_}.${getSignalId(options?.signal)}`,
          wait: wait2,
          shouldSplitBatch(requests) {
            return requests.length > batchSize;
          },
          fn: (body2) => rpcClient.request({
            body: body2,
            fetchOptions: fetchOptions2
          }),
          sort: (a, b) => a.id - b.id
        });
        const fn = async (body2) => batch ? schedule(body2) : [
          await rpcClient.request({
            body: body2,
            fetchOptions: fetchOptions2
          })
        ];
        const [{ error, result }] = await fn(body);
        if (raw)
          return { error, result };
        if (error)
          throw new RpcRequestError({
            body,
            error,
            url: url_
          });
        return result;
      },
      retryCount,
      retryDelay,
      timeout,
      type: "http"
    }, {
      fetchOptions,
      url: url_
    });
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/index.js
init_base();
init_contract();
init_encodeFunctionData();
init_getAbiItem();
init_getAddress();
init_isAddress();
init_size();
init_fromHex();
init_toBytes();
init_toHex();
init_keccak256();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/utils/signature/parseSignature.js
init_secp256k1();
init_toHex();
function parseSignature2(signatureHex) {
  const { r, s } = secp256k1.Signature.fromCompact(signatureHex.slice(2, 130));
  const yParityOrV = Number(`0x${signatureHex.slice(130)}`);
  const [v, yParity] = (() => {
    if (yParityOrV === 0 || yParityOrV === 1)
      return [void 0, yParityOrV];
    if (yParityOrV === 27)
      return [BigInt(yParityOrV), 0];
    if (yParityOrV === 28)
      return [BigInt(yParityOrV), 1];
    throw new Error("Invalid yParityOrV value");
  })();
  if (typeof v !== "undefined")
    return {
      r: numberToHex(r, { size: 32 }),
      s: numberToHex(s, { size: 32 }),
      v,
      yParity
    };
  return {
    r: numberToHex(r, { size: 32 }),
    s: numberToHex(s, { size: 32 }),
    yParity
  };
}

// packages/bnb-sdk-lab/vendor/typescript/src/constants.ts
var SCAN_API_URL = "https://www.8004scan.io/api/v1";

// packages/bnb-sdk-lab/vendor/typescript/src/errors.ts
var BNBAgentError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BNBAgentError";
  }
};
var NetworkError = class extends BNBAgentError {
  constructor(message) {
    super(message);
    this.name = "NetworkError";
  }
};
var RpcRangeLimitError = class extends NetworkError {
  constructor(message) {
    super(message);
    this.name = "RpcRangeLimitError";
  }
};
var JobError = class extends BNBAgentError {
  constructor(message) {
    super(message);
    this.name = "JobError";
  }
};
var JobPaymentTokenMismatchError = class extends JobError {
  constructor(jobId, expectedToken, actualToken) {
    super(
      `job ${jobId} payment token mismatch: expected ${expectedToken}, got ${actualToken}`
    );
    this.jobId = jobId;
    this.expectedToken = expectedToken;
    this.actualToken = actualToken;
    this.name = "JobPaymentTokenMismatchError";
  }
  jobId;
  expectedToken;
  actualToken;
};
var TransactionPendingError = class extends BNBAgentError {
  constructor(txHash, timeoutSeconds, message) {
    super(
      message || `Transaction ${txHash} not confirmed within ${timeoutSeconds}s; reconcile this hash before any rebroadcast.`
    );
    this.txHash = txHash;
    this.timeoutSeconds = timeoutSeconds;
    this.name = "TransactionPendingError";
  }
  txHash;
  timeoutSeconds;
  /**
   * Where in the relay-observability state machine this timeout sits:
   * `"public_tx_pending"` (default — wait, do not re-send the nonce) or
   * `"receipt_timeout_but_tx_visible"` (a relay hash the RPC has seen but
   * that never mined within the timeout — likely stuck in the mempool;
   * escalate rather than retry).
   */
  relayStatus = "public_tx_pending";
};
var RelaySubmissionUnverifiedError = class extends BNBAgentError {
  constructor(txHash, timeoutSeconds, message) {
    super(
      message || `Relay returned transaction ${txHash}, but the chain RPC never observed it within ${timeoutSeconds}s. This matches a known MegaFuel relay failure mode (a hash is returned but the tx is never broadcast, seen most often on testnet). To bypass sponsorship and self-pay gas, set BNBAGENT_USE_PAYMASTER=0 or pass resolveNetwork a NetworkConfig with usePaymaster: false.`
    );
    this.txHash = txHash;
    this.timeoutSeconds = timeoutSeconds;
    this.name = "RelaySubmissionUnverifiedError";
  }
  txHash;
  timeoutSeconds;
  relayStatus = "relay_submission_unverified";
  /**
   * Verdict of the multi-RPC secondary confirmation that ran before this
   * error was acted on: `"confirmed-unseen"` (fallback RPCs corroborate),
   * `"inconclusive"` (the quorum was unavailable or conflicting), or
   * `"not-checked"`.
   * Assigned by the executor after the error is raised by the receipt wait.
   */
  secondaryRpcResult = "not-checked";
};
var RelayFallbackFailedError = class extends RelaySubmissionUnverifiedError {
  constructor(txHash, timeoutSeconds, fallbackReason, options) {
    super(
      txHash,
      timeoutSeconds,
      `Relay returned transaction ${txHash} but never broadcast it, and the self-pay fallback could not be sent: ${fallbackReason}. Fund the wallet (tBNB faucet on testnet) and retry, or wait for the relay to recover.`
    );
    this.fallbackReason = fallbackReason;
    this.name = "RelayFallbackFailedError";
    if (options?.cause !== void 0) {
      this.cause = options.cause;
    }
  }
  fallbackReason;
};
var RelayRejectedError = class extends BNBAgentError {
  constructor(reason, definite, options) {
    super(
      definite ? `Relay rejected the sponsored transaction: ${reason}. No nonce was consumed; the transaction can be safely retried or self-paid.` : `Relay submission failed before acknowledgment: ${reason}. It is unknown whether the relay accepted the transaction \u2014 do not blindly resubmit; verify wallet nonce state first.`
    );
    this.reason = reason;
    this.definite = definite;
    this.name = "RelayRejectedError";
    this.rpcErrorCode = options?.rpcErrorCode;
    if (options?.cause !== void 0) {
      this.cause = options.cause;
    }
  }
  reason;
  definite;
  relayStatus = "relay_rejected";
  rpcErrorCode;
};
var ERC8004PartialRegistrationError = class extends BNBAgentError {
  constructor(agentId, agentUri, cause, txHash = null, retryable = true) {
    let msg = `agent registered (agent_id=${agentId}) but agent_uri/registrations completion failed: ${cause}.`;
    msg += retryable ? " Retry setAgentURI / `bag erc8004 update-endpoint`." : " Reconcile the relay transaction before retrying setAgentURI / `bag erc8004 update-endpoint`.";
    if (txHash) {
      msg += ` pending tx_hash=${txHash}`;
    }
    super(msg);
    this.agentId = agentId;
    this.agentUri = agentUri;
    this.cause = cause;
    this.txHash = txHash;
    this.retryable = retryable;
    this.name = "ERC8004PartialRegistrationError";
  }
  agentId;
  agentUri;
  cause;
  txHash;
  retryable;
};

// packages/bnb-sdk-lab/vendor/typescript/src/core/rpcError.ts
function rpcErrorReason(error) {
  const seen = /* @__PURE__ */ new Set();
  let reason = "";
  let current = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const value = current;
    const text = typeof value.details === "string" ? value.details : value.message;
    if (typeof text === "string") {
      reason = text.split(/\n\s*\n|\n(?:URL|Request body|Details):/u)[0] ?? "";
    }
    current = value.cause;
  }
  return reason.toLowerCase();
}
function isAmbiguousBroadcast(error) {
  if (isRateLimited(error)) return true;
  const reason = rpcErrorReason(error);
  return /already known|known transaction|replacement transaction underpriced|\b429\b|too many requests|timeout|timed out|connection|network/iu.test(
    reason
  );
}
function isRateLimited(error) {
  const seen = /* @__PURE__ */ new Set();
  let current = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const value = current;
    if (value.status === 429) return true;
    current = value.cause;
  }
  return /\b429\b|too many requests/iu.test(rpcErrorReason(error));
}

// packages/bnb-sdk-lab/vendor/typescript/src/core/paymaster.ts
var RPC_TIMEOUT_MS = 3e4;
var PaymasterRequestError = class extends Error {
  constructor(message, kind, code) {
    super(message);
    this.kind = kind;
    this.code = code;
    this.name = "PaymasterRequestError";
  }
  kind;
  code;
};
function toHex3(value, defaultValue = "0x0") {
  if (value === null || value === void 0) {
    return defaultValue;
  }
  if (typeof value === "bigint" || typeof value === "number") {
    return numberToHex(value);
  }
  if (value instanceof Uint8Array) {
    return value.length > 0 ? bytesToHex(value) : defaultValue;
  }
  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      return value;
    }
    return value.length > 0 ? `0x${value}` : defaultValue;
  }
  return defaultValue;
}
function toAddressHex(address, defaultValue = "0x0") {
  if (!address) {
    return defaultValue;
  }
  try {
    return getAddress(address);
  } catch (error) {
    console.warn(
      `Invalid address '${address}', using default '${defaultValue}': ${error}`
    );
    return defaultValue;
  }
}
var Paymaster = class {
  /**
   * The paymaster endpoint. Public (mirrors Python's `paymaster_url`):
   * self-broadcasting wallets forward it to their own broadcast machinery
   * (e.g. twak's `--paymaster-url`) instead of sending through this client.
   */
  paymasterUrl;
  debug;
  /**
   * @param paymasterUrl - URL of the paymaster service.
   * @param debug - Enable verbose debug logging (default: false).
   */
  constructor(paymasterUrl, debug = false) {
    this.paymasterUrl = paymasterUrl;
    this.debug = debug;
    if (this.debug) {
      console.debug(`Initialized Paymaster with URL: ${paymasterUrl}`);
    }
  }
  /**
   * POST a JSON-RPC 2.0 request to the paymaster service.
   *
   * Throws on a non-2xx HTTP response, on a network/transport error (the
   * underlying `fetch` rejection propagates unchanged), and when the
   * response body carries a JSON-RPC `error` object.
   */
  async makeRpcRequest(method, params, options) {
    const requestId = options?.requestId ?? 1;
    const payload = {
      jsonrpc: "2.0",
      id: requestId,
      method,
      params
    };
    const mergedHeaders = {
      ...options?.headers ?? {}
    };
    if (!("Content-Type" in mergedHeaders)) {
      mergedHeaders["Content-Type"] = "application/json";
    }
    if (this.debug) {
      console.debug(`Making RPC request: ${method} to ${this.paymasterUrl}`);
    }
    let response;
    try {
      response = await fetch(this.paymasterUrl, {
        method: "POST",
        headers: mergedHeaders,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(RPC_TIMEOUT_MS)
      });
    } catch (error) {
      console.error(`Failed to make RPC request: ${error}`);
      throw error;
    }
    if (!response.ok) {
      throw new PaymasterRequestError(
        `HTTP error ${response.status}${response.statusText ? `: ${response.statusText}` : ""}`,
        "http",
        response.status
      );
    }
    const result = await response.json();
    if (result.error) {
      const errorMsg = result.error.message ?? "Unknown error";
      const errorCode = result.error.code ?? -1;
      console.error(`RPC error [${errorCode}]: ${errorMsg}`);
      if (result.error.data) {
        console.error(`Error data: ${JSON.stringify(result.error.data)}`);
      }
      throw new PaymasterRequestError(
        `RPC error [${errorCode}]: ${errorMsg}`,
        "rpc",
        errorCode
      );
    }
    return result;
  }
  /**
   * Get the transaction count (nonce) for an address.
   *
   * @param address - Ethereum address (0x prefix optional; checksummed
   * before sending).
   * @param block - Block number or tag (default: "latest").
   */
  async ethGetTransactionCount(address, block = "latest") {
    const prefixed = address.startsWith("0x") ? address : `0x${address}`;
    const checksummed = getAddress(prefixed);
    const result = await this.makeRpcRequest("eth_getTransactionCount", [
      checksummed,
      block
    ]);
    const nonceHex = result.result;
    if (nonceHex === void 0 || nonceHex === null) {
      throw new Error(
        "Failed to get transaction count: missing 'result' field"
      );
    }
    const nonce = Number.parseInt(nonceHex, 16);
    if (this.debug) {
      console.debug(`Transaction count for ${checksummed}: ${nonce}`);
    }
    return nonce;
  }
  /**
   * Send a signed raw transaction to the paymaster service.
   *
   * @param signedTransaction - Signed transaction hex string (0x prefix
   * optional).
   * @param txOptions - Extra values forwarded as HTTP headers on the
   * request (e.g. a sponsorship API key).
   * @returns The transaction hash.
   */
  async ethSendRawTransaction(signedTransaction, txOptions) {
    const prefixed = signedTransaction.startsWith("0x") ? signedTransaction : `0x${signedTransaction}`;
    let result;
    try {
      result = await this.makeRpcRequest("eth_sendRawTransaction", [prefixed], {
        headers: txOptions
      });
    } catch (error) {
      if (error instanceof PaymasterRequestError && error.kind === "rpc") {
        const ambiguous = /already known|known transaction|nonce too low/iu.test(
          rpcErrorReason(error)
        );
        throw new RelayRejectedError(error.message, !ambiguous, {
          rpcErrorCode: error.code,
          cause: error
        });
      }
      throw new RelayRejectedError(
        error instanceof Error ? error.message : String(error),
        false,
        { cause: error }
      );
    }
    const txHash = result.result;
    if (txHash === void 0 || txHash === null) {
      throw new RelayRejectedError(
        "Failed to send raw transaction: missing 'result' field",
        false
      );
    }
    return txHash;
  }
  /**
   * Check whether a transaction is sponsorable by the paymaster.
   *
   * Unlike the other RPC methods, a missing `result` field is not an
   * error here — it is logged and treated as "not sponsorable" (`false`).
   * A JSON-RPC `error` object still throws (via `makeRpcRequest`).
   */
  async isSponsorable(tx) {
    const toHexAddr = toAddressHex(tx.to);
    const fromHexAddr = toAddressHex(tx.from);
    const valueHex = toHex3(tx.value ?? 0);
    const dataHex = toHex3(tx.data ?? "");
    const gasHex = toHex3(tx.gas ?? 0);
    if (this.debug) {
      console.debug(
        `Checking if transaction is sponsorable: ${toHexAddr}, ${fromHexAddr}, ${valueHex}, ${dataHex}, ${gasHex}`
      );
    }
    const result = await this.makeRpcRequest("pm_isSponsorable", [
      {
        to: toHexAddr,
        from: fromHexAddr,
        value: valueHex,
        data: dataHex,
        gas: gasHex
      }
    ]);
    const sponsorship = result.result;
    if (sponsorship === void 0 || sponsorship === null) {
      console.error("Invalid response: missing 'result' field");
      return false;
    }
    return sponsorship.sponsorable ?? false;
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/core/nonceManager.ts
var NONCE_ERROR_PATTERNS = [
  "nonce too low",
  "already known",
  "replacement transaction underpriced"
];
var AsyncMutex = class {
  tail = Promise.resolve();
  run(fn) {
    const result = this.tail.then(fn, fn);
    this.tail = result.then(
      () => void 0,
      () => void 0
    );
    return result;
  }
};
var NonceManager = class _NonceManager {
  static instances = /* @__PURE__ */ new Map();
  client;
  account;
  mutex = new AsyncMutex();
  nonce = null;
  constructor(client, account) {
    this.client = client;
    this.account = account;
  }
  /**
   * Get or create a NonceManager singleton for this account + RPC endpoint.
   *
   * Two client instances sharing the same wallet and RPC will automatically
   * share the same NonceManager.
   */
  static forAccount(client, account) {
    const checksummed = getAddress(account);
    const rpcUrl = getRpcUrl(client);
    const key = `${rpcUrl}:${checksummed}`;
    let instance = _NonceManager.instances.get(key);
    if (!instance) {
      instance = new _NonceManager(client, checksummed);
      _NonceManager.instances.set(key, instance);
    }
    return instance;
  }
  /** Clear all singleton instances. For testing only. */
  static _clearAll() {
    _NonceManager.instances.clear();
  }
  /**
   * Get the next nonce to use.
   *
   * The first call seeds from chain ("pending"). Subsequent calls increment
   * locally without RPC. Safe under concurrency — concurrent callers each
   * get a unique nonce.
   */
  async getNonce() {
    return this.mutex.run(async () => {
      if (this.nonce === null) {
        this.nonce = await this.client.getTransactionCount({
          address: this.account,
          blockTag: "pending"
        });
      }
      const nonce = this.nonce;
      this.nonce += 1;
      return nonce;
    });
  }
  /**
   * Re-sync after a nonce-too-low rejection. Already-known and underpriced
   * responses must instead be reconciled using the original transaction hash.
   *
   * @param error - The error raised by broadcasting the transaction.
   * @param usedNonce - The nonce that was used in the failed transaction
   * (kept for logging/debugging parity with the Python implementation).
   * @returns True for a nonce-too-low rejection that allows a retry.
   */
  async handleError(error, usedNonce) {
    void usedNonce;
    const errorStr = String(error).toLowerCase();
    if (errorStr.includes("already known") || errorStr.includes("replacement transaction underpriced")) {
      return false;
    }
    if (!NONCE_ERROR_PATTERNS.some((pattern) => errorStr.includes(pattern))) {
      return false;
    }
    await this.mutex.run(async () => {
      this.nonce = await this.client.getTransactionCount({
        address: this.account,
        blockTag: "pending"
      });
    });
    return true;
  }
  /**
   * Force re-sync from chain on the next `getNonce()` call.
   *
   * Useful after submitting transactions outside this manager.
   *
   * The null-write is enqueued on the same mutex as `getNonce()` /
   * `handleError()` (fire-and-forget — this method stays synchronous) so it
   * is FIFO-ordered: if a seed or resync is already in flight, the reset is
   * applied only after that operation completes, and any `getNonce()` call
   * made after `reset()` returns is queued behind the reset and is
   * guaranteed to observe the cleared cache. This prevents an in-flight
   * seed from clobbering a reset that raced ahead of it.
   */
  reset() {
    void this.mutex.run(async () => {
      this.nonce = null;
    });
  }
};
function getRpcUrl(client) {
  return client.transport?.url ?? String(client.uid);
}

// packages/bnb-sdk-lab/vendor/typescript/src/networks/addresses.ts
var BSC_MAINNET_CHAIN_ID = 56;
var BSC_TESTNET_CHAIN_ID = 97;
var PAYMENT_TOKEN_EIP712_NAME = "United Stables";
var PAYMENT_TOKEN_EIP712_VERSION = "1";
var RAW = {
  [BSC_TESTNET_CHAIN_ID]: {
    paymentToken: "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565",
    treasury: "0x1001b2C085345f388778A975648aA50bcfd0D134",
    commerceProxy: "0xa206c0517b6371c6638cd9e4a42cc9f02a33b0de",
    commerceImpl: "0x153783ddbdf5233c591965f04644b1df2d1a7815",
    routerProxy: "0xd7d36d66d2f1b608a0f943f722d27e3744f66f25",
    routerImpl: "0x40c0254610d92f1eb9c2d7d5d2114bc4c99d935e",
    policy: "0xd6a4217588f6b1f5657a92a3e94e6422ad771cea"
  },
  [BSC_MAINNET_CHAIN_ID]: {
    paymentToken: "0xcE24439F2D9C6a2289F741120FE202248B666666",
    treasury: "0x000000000000000000000000000000000000dEaD",
    commerceProxy: "0xea4daa3100a767e86fded867729ae7446476eba6",
    commerceImpl: "0xd5f9b570c96b5d67702d508c0bfb8b3b09209787",
    routerProxy: "0x51895229e12f9876011789b04f8698af06ccd6da",
    routerImpl: "0xf0cf8f47e5c035f16247ff16e9f367e477ee5007",
    policy: "0x9c01845705b3078aa2e8cff7520a6376fd766de5"
  }
};
function build() {
  const out = {};
  for (const [chainIdStr, raw] of Object.entries(RAW)) {
    const chainId = Number(chainIdStr);
    const checksummed = Object.fromEntries(
      Object.entries(raw).map(([field, addr]) => [
        field,
        getAddress(addr)
      ])
    );
    out[chainId] = Object.freeze(checksummed);
  }
  return Object.freeze(out);
}
var BNB_CHAIN_ADDRESSES = build();

// packages/bnb-sdk-lab/vendor/typescript/src/core/envUtil.ts
function getEnv(key, defaultValue, prefix = "") {
  const fullKey = `${prefix}${key}`;
  const value = process.env[fullKey];
  if (value === void 0 || value === "") {
    return defaultValue;
  }
  return value;
}

// packages/bnb-sdk-lab/vendor/typescript/src/core/txConfig.ts
var MAX_RETRIES = 5;
var RETRY_BASE_DELAY = 1;
var MIN_GAS_PRICE_WEI = 100000000n;
var MIN_GAS_PRICE_WEI_PER_CHAIN = {
  [BSC_MAINNET_CHAIN_ID]: 100000000n,
  // 0.1 Gwei
  [BSC_TESTNET_CHAIN_ID]: 1000000000n
  // 1 Gwei — above the testnet validator cutoff
};
var DEFAULT_GAS_FALLBACK = 2000000n;
var DEFAULT_RECEIPT_TIMEOUT = 300;
var DEFAULT_RELAY_UNSEEN_TIMEOUT = 30;
var minGasPriceOverride = null;
var receiptTimeoutOverride = null;
var relayUnseenTimeoutOverride = null;
function minGasPriceWei(chainId) {
  if (minGasPriceOverride !== null) {
    return minGasPriceOverride;
  }
  const raw = getEnv("BNBAGENT_MIN_GAS_PRICE_WEI");
  if (raw !== void 0) {
    const parsed = parseBigIntStrict(raw);
    if (parsed !== null) {
      return parsed;
    }
    console.warn(
      `Ignoring invalid BNBAGENT_MIN_GAS_PRICE_WEI=${JSON.stringify(raw)}`
    );
  }
  return MIN_GAS_PRICE_WEI_PER_CHAIN[chainId] ?? MIN_GAS_PRICE_WEI;
}
function getDefaultReceiptTimeout() {
  if (receiptTimeoutOverride !== null) {
    return receiptTimeoutOverride;
  }
  const raw = getEnv("BNBAGENT_RECEIPT_TIMEOUT");
  if (raw !== void 0) {
    const parsed = parseIntStrict(raw);
    if (parsed !== null) {
      return parsed;
    }
    console.warn(
      `Ignoring invalid BNBAGENT_RECEIPT_TIMEOUT=${JSON.stringify(raw)}`
    );
  }
  return DEFAULT_RECEIPT_TIMEOUT;
}
function getRelayUnseenTimeout() {
  if (relayUnseenTimeoutOverride !== null) {
    return relayUnseenTimeoutOverride;
  }
  const raw = getEnv("BNBAGENT_RELAY_UNSEEN_TIMEOUT");
  if (raw !== void 0) {
    const parsed = parseIntStrict(raw);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
    console.warn(
      `Ignoring invalid BNBAGENT_RELAY_UNSEEN_TIMEOUT=${JSON.stringify(raw)}`
    );
  }
  return DEFAULT_RELAY_UNSEEN_TIMEOUT;
}
function parseBigIntStrict(raw) {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}
function parseIntStrict(raw) {
  const trimmed = raw.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }
  const n = Number(trimmed);
  return Number.isSafeInteger(n) ? n : null;
}

// packages/bnb-sdk-lab/vendor/typescript/src/core/txSender.ts
var PREFLIGHT_TIMEOUT_MS = 1e4;
var RECEIPT_POLL_INTERVAL_MS = 250;
var ReceiptWaitTimeout = class extends Error {
  constructor(transactionSeen, waitedSeconds) {
    super();
    this.transactionSeen = transactionSeen;
    this.waitedSeconds = waitedSeconds;
  }
  transactionSeen;
  waitedSeconds;
};
async function preflightCall(client, params) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ kind: "timeout" });
      }
    }, PREFLIGHT_TIMEOUT_MS);
    client.call({
      account: params.account,
      to: params.to,
      data: params.data,
      value: params.value,
      gas: params.gas
    }).then(
      () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ kind: "ok" });
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve({ kind: "error", error });
        }
      }
    );
  });
}
async function estimateGasLimit(client, params, opts) {
  const logPrefix = opts?.logPrefix ?? "[txSender]";
  if (params.skipPreflight) {
    return DEFAULT_GAS_FALLBACK;
  }
  try {
    const estimate = await client.estimateGas({
      account: params.account,
      to: params.to,
      data: params.data,
      value: params.value,
      prepare: false
    });
    return estimate * 12n / 10n;
  } catch (error) {
    if (isOpaqueRevert(error)) {
      console.warn(
        `${logPrefix} Gas estimation unavailable (opaque revert); falling back to gas=${DEFAULT_GAS_FALLBACK}`
      );
      return DEFAULT_GAS_FALLBACK;
    }
    if (describeError(error).toLowerCase().includes("revert")) {
      throw new Error(`Transaction would revert: ${describeError(error)}`, {
        cause: error
      });
    }
    console.warn(
      `${logPrefix} Gas estimation unavailable (${describeError(error)}); falling back to gas=${DEFAULT_GAS_FALLBACK}`
    );
    return DEFAULT_GAS_FALLBACK;
  }
}
async function waitForReceipt(client, hash3, timeoutSeconds, opts = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let transactionSeen = false;
    let transactionPresenceTimer;
    let unseenAbortTimer;
    const clearAuxTimers = () => {
      if (transactionPresenceTimer) {
        clearTimeout(transactionPresenceTimer);
      }
      if (unseenAbortTimer) {
        clearTimeout(unseenAbortTimer);
      }
    };
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        clearAuxTimers();
        reject(new ReceiptWaitTimeout(transactionSeen, timeoutSeconds));
      }
    }, timeoutSeconds * 1e3);
    const scheduleNextReceiptPoll = () => {
      if (!settled) {
        setTimeout(poll2, RECEIPT_POLL_INTERVAL_MS);
      }
    };
    const scheduleNextTransactionPresencePoll = () => {
      if (!settled && !transactionSeen) {
        transactionPresenceTimer = setTimeout(
          pollTransactionPresence,
          RECEIPT_POLL_INTERVAL_MS * 4
        );
      }
    };
    const pollTransactionPresence = () => {
      if (settled || transactionSeen) {
        return;
      }
      client.getTransaction({ hash: hash3 }).then(
        () => {
          if (!settled) {
            transactionSeen = true;
            if (unseenAbortTimer) {
              clearTimeout(unseenAbortTimer);
            }
          }
        },
        () => {
          scheduleNextTransactionPresencePoll();
        }
      );
    };
    const poll2 = () => {
      if (settled) {
        return;
      }
      client.getTransactionReceipt({ hash: hash3 }).then(
        (receipt) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timer);
          clearAuxTimers();
          resolve(receipt);
        },
        () => {
          scheduleNextReceiptPoll();
        }
      );
    };
    poll2();
    if (opts.trackTransactionPresence) {
      pollTransactionPresence();
      const abortSeconds = opts.unseenAbortSeconds;
      if (abortSeconds !== void 0 && abortSeconds > 0 && abortSeconds < timeoutSeconds) {
        unseenAbortTimer = setTimeout(() => {
          if (!settled && !transactionSeen) {
            settled = true;
            clearTimeout(timer);
            if (transactionPresenceTimer) {
              clearTimeout(transactionPresenceTimer);
            }
            reject(new ReceiptWaitTimeout(false, abortSeconds));
          }
        }, abortSeconds * 1e3);
      }
    }
  });
}
async function waitForReceiptAndInterpret(client, hash3, timeoutSeconds, opts = {}) {
  let receipt;
  try {
    receipt = await waitForReceipt(client, hash3, timeoutSeconds, {
      trackTransactionPresence: opts.requireTransactionSeen,
      unseenAbortSeconds: opts.requireTransactionSeen ? opts.unseenAbortSeconds ?? getRelayUnseenTimeout() : void 0
    });
  } catch (error) {
    if (error instanceof ReceiptWaitTimeout) {
      if (opts.requireTransactionSeen && !error.transactionSeen) {
        throw new RelaySubmissionUnverifiedError(hash3, error.waitedSeconds);
      }
      const pending = new TransactionPendingError(hash3, timeoutSeconds);
      if (opts.requireTransactionSeen && error.transactionSeen) {
        pending.relayStatus = "receipt_timeout_but_tx_visible";
      }
      throw pending;
    }
    throw error;
  }
  if (receipt.status === "reverted") {
    throw new Error(
      `Transaction reverted on-chain: ${receipt.transactionHash}`
    );
  }
  return {
    transactionHash: receipt.transactionHash,
    status: receipt.status === "success" ? 1 : 0,
    receipt
  };
}
async function sendSelfPayTx(params) {
  const {
    client,
    walletProvider,
    to,
    data,
    value,
    gas,
    skipPreflight = false,
    logPrefix = "[txSender]"
  } = params;
  const account = walletProvider.address;
  let chainId = null;
  let floorWei;
  try {
    chainId = await client.getChainId();
    floorWei = minGasPriceWei(chainId);
  } catch {
    floorWei = MIN_GAS_PRICE_WEI;
  }
  const nonceMgr = NonceManager.forAccount(
    client,
    account
  );
  let lastError;
  let txHash;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const nonce = await nonceMgr.getNonce();
    try {
      let gasPrice;
      try {
        const networkGasPrice = await client.getGasPrice();
        gasPrice = maxBigint(networkGasPrice * 12n / 10n, floorWei);
      } catch {
        gasPrice = floorWei;
      }
      if (!skipPreflight) {
        const preflight = await preflightCall(client, {
          account,
          to,
          data,
          value,
          gas
        });
        if (preflight.kind === "timeout") {
          console.warn(
            `${logPrefix} Pre-flight eth_call timed out, proceeding anyway`
          );
        } else if (preflight.kind === "error") {
          if (isOpaqueRevert(preflight.error)) {
            console.warn(
              `${logPrefix} Pre-flight returned opaque 0x revert, proceeding to on-chain tx`
            );
          } else {
            throw new Error(
              `Transaction would revert: ${describeError(preflight.error)}`,
              { cause: preflight.error }
            );
          }
        }
      }
      const txChainId = chainId ?? await client.getChainId();
      const tx = {
        from: account,
        to,
        data,
        value,
        gas,
        gasPrice,
        nonce,
        chainId: txChainId
      };
      const signed = await walletProvider.signTransaction(tx);
      const localHash = keccak256(signed.rawTransaction);
      try {
        txHash = await client.sendRawTransaction({
          serializedTransaction: signed.rawTransaction
        });
      } catch (error) {
        if (!isAmbiguousBroadcast(error)) {
          throw error;
        }
        txHash = localHash;
      }
      break;
    } catch (error) {
      if (error instanceof TransactionPendingError) {
        throw error;
      }
      lastError = error;
      if (await nonceMgr.handleError(error, nonce) && attempt < MAX_RETRIES - 1) {
        console.warn(
          `${logPrefix} Nonce error, retry ${attempt + 1}/${MAX_RETRIES}`
        );
        continue;
      }
      if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
        const delaySeconds = RETRY_BASE_DELAY * 2 ** attempt;
        console.warn(
          `${logPrefix} Rate limited, retry ${attempt + 1}/${MAX_RETRIES} in ${delaySeconds.toFixed(1)}s`
        );
        nonceMgr.reset();
        await sleep(delaySeconds * 1e3);
        continue;
      }
      nonceMgr.reset();
      throw error;
    }
  }
  if (!txHash) {
    throw lastError;
  }
  const timeoutSeconds = params.receiptTimeoutSeconds ?? getDefaultReceiptTimeout();
  return waitForReceiptAndInterpret(client, txHash, timeoutSeconds);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function maxBigint(a, b) {
  return a > b ? a : b;
}
function isRateLimitError(error) {
  return isRateLimited(error);
}
function isInsufficientFundsError(error) {
  return describeError(error).toLowerCase().includes("insufficient funds");
}
function describeError(error) {
  if (error instanceof Error) {
    const own = error.message;
    const causeText = error.cause !== void 0 ? describeError(error.cause) : "";
    return causeText && causeText !== own ? `${own}: ${causeText}` : own;
  }
  return String(error);
}
function isOpaqueRevert(error) {
  let current = error;
  const seen = /* @__PURE__ */ new Set();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const data = current.data;
    if (data === "0x") {
      return true;
    }
    current = current.cause;
  }
  const text = describeError(error).trim();
  return text.includes("'0x'") || /,\s*'0x'\)$/.test(text) || text === "0x";
}

// packages/bnb-sdk-lab/vendor/typescript/src/utils/publicHttp.ts
import { lookup as dnsLookup } from "node:dns/promises";
import * as http2 from "node:http";
import * as https from "node:https";
import { BlockList, isIP } from "node:net";
import { performance } from "node:perf_hooks";
var BLOCKED_HOSTNAMES = /* @__PURE__ */ new Set([
  "metadata.google.internal",
  "metadata.goog",
  "169.254.169.254"
]);
var MAX_AGENT_URI_BYTES = 1 * 1024 * 1024;
var DNS_TIMEOUT_MS = 5e3;
var HTTP_TIMEOUT_MS = 1e4;
var cachedBlockList = null;
var pendingDns = 0;
async function resolveHost(host) {
  if (isIP(host)) return [{ address: host, family: isIP(host) }];
  if (pendingDns >= 16) throw new Error("Public DNS resolver is busy");
  pendingDns++;
  try {
    return await dnsLookup(host, { all: true });
  } finally {
    pendingDns--;
  }
}
function getBlockList() {
  if (cachedBlockList) {
    return cachedBlockList;
  }
  const bl = new BlockList();
  bl.addSubnet("10.0.0.0", 8, "ipv4");
  bl.addSubnet("172.16.0.0", 12, "ipv4");
  bl.addSubnet("192.168.0.0", 16, "ipv4");
  bl.addSubnet("127.0.0.0", 8, "ipv4");
  bl.addSubnet("169.254.0.0", 16, "ipv4");
  bl.addSubnet("100.64.0.0", 10, "ipv4");
  bl.addSubnet("0.0.0.0", 8, "ipv4");
  bl.addSubnet("240.0.0.0", 4, "ipv4");
  bl.addAddress("255.255.255.255", "ipv4");
  bl.addSubnet("192.0.0.0", 24, "ipv4");
  bl.addSubnet("192.0.2.0", 24, "ipv4");
  bl.addSubnet("198.18.0.0", 15, "ipv4");
  bl.addSubnet("198.51.100.0", 24, "ipv4");
  bl.addSubnet("203.0.113.0", 24, "ipv4");
  bl.addAddress("::1", "ipv6");
  bl.addSubnet("fc00::", 7, "ipv6");
  bl.addSubnet("fe80::", 10, "ipv6");
  bl.addSubnet("224.0.0.0", 4, "ipv4");
  bl.addSubnet("192.88.99.0", 24, "ipv4");
  bl.addSubnet("2001::", 23, "ipv6");
  bl.addSubnet("2001:db8::", 32, "ipv6");
  bl.addSubnet("2002::", 16, "ipv6");
  bl.addSubnet("3fff::", 20, "ipv6");
  cachedBlockList = bl;
  return bl;
}
function unmapIpv4(address) {
  const match = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return match ? match[1] : address;
}
function isBlockedIp(ip) {
  if (ip.includes("%") || !isIP(ip)) return true;
  const unmapped = unmapIpv4(ip);
  const type = unmapped.includes(":") ? "ipv6" : "ipv4";
  if (unmapped === "169.254.169.254") {
    return true;
  }
  if (type === "ipv6") {
    const allowed = new BlockList();
    allowed.addSubnet("2000::", 3, "ipv6");
    allowed.addSubnet("::ffff:0:0", 96, "ipv6");
    if (!allowed.check(unmapped, "ipv6")) return true;
  }
  return getBlockList().check(unmapped, type);
}
function fetchViaResolvedIp(params) {
  const {
    isHttps,
    resolvedIp,
    port,
    path,
    hostname,
    hostHeader,
    maxBytes,
    timeoutMs
  } = params;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(value);
      }
    };
    const mod2 = isHttps ? https : http2;
    const req = mod2.request(
      {
        host: resolvedIp,
        port,
        path: path || "/",
        method: "GET",
        headers: { Host: hostHeader, "Accept-Encoding": "identity" },
        timeout: timeoutMs,
        agent: false,
        // Connect to the DNS-resolved IP (preventing a rebind between the
        // check and the request) while still presenting the original
        // hostname for TLS server-name/cert-hostname validation.
        ...isHttps ? { servername: hostname } : {}
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          res.destroy();
          finish(null);
          return;
        }
        if ((res.headers["content-encoding"] ?? "identity") !== "identity") {
          res.destroy();
          finish(null);
          return;
        }
        const contentLength = res.headers["content-length"];
        if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > maxBytes)) {
          res.destroy();
          finish(null);
          return;
        }
        const chunks = [];
        let total = 0;
        res.on("data", (chunk) => {
          if (settled) return;
          total += chunk.length;
          if (total > maxBytes) {
            res.destroy();
            finish(null);
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => finish(Buffer.concat(chunks)));
        res.on("error", () => finish(null));
        res.on("aborted", () => finish(null));
        res.on("close", () => finish(null));
      }
    );
    req.on("timeout", () => {
      req.destroy();
      finish(null);
    });
    req.on("error", () => finish(null));
    const timer = setTimeout(() => {
      req.destroy();
      finish(null);
    }, timeoutMs);
    req.end();
  });
}
async function fetchPublicJson(agentUri, opts = {}) {
  const maxBytes = opts.maxBytes ?? MAX_AGENT_URI_BYTES;
  const timeoutMs = opts.timeoutMs ?? HTTP_TIMEOUT_MS;
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0 || !Number.isFinite(timeoutMs) || timeoutMs <= 0)
    return null;
  const deadline = performance.now() + timeoutMs;
  if (agentUri.length > 4096 || Array.from(agentUri).some(
    (c) => c.charCodeAt(0) <= 32 || c.charCodeAt(0) === 127 || c === "\\"
  ))
    return null;
  let parsed;
  try {
    parsed = new URL(agentUri);
  } catch {
    return null;
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.port === "0")
    return null;
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!hostname) {
    return null;
  }
  if (BLOCKED_HOSTNAMES.has(hostname.toLowerCase())) {
    return null;
  }
  let resolvedIp;
  let dnsTimer;
  try {
    const timeout = new Promise((_, reject) => {
      dnsTimer = setTimeout(
        () => reject(new Error("dns lookup timed out")),
        Math.min(DNS_TIMEOUT_MS, timeoutMs)
      );
    });
    const results = await Promise.race([resolveHost(hostname), timeout]);
    if (results.length === 0 || results.some((r) => isBlockedIp(r.address))) {
      return null;
    }
    resolvedIp = results[0].address;
  } catch {
    return null;
  } finally {
    clearTimeout(dnsTimer);
  }
  const isHttps = parsed.protocol === "https:";
  const port = parsed.port ? Number(parsed.port) : isHttps ? 443 : 80;
  const hostHeader = parsed.host;
  if (performance.now() >= deadline) return null;
  try {
    const body = await fetchViaResolvedIp({
      isHttps,
      resolvedIp,
      port,
      path: `${parsed.pathname}${parsed.search}`,
      hostname,
      hostHeader,
      maxBytes,
      timeoutMs: deadline - performance.now()
    });
    if (body === null) {
      return null;
    }
    const data = JSON.parse(body.toString("utf-8"));
    return data !== null && typeof data === "object" && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// packages/bnb-sdk-lab/vendor/typescript/src/core/canonicalJson.ts
function sortValue(v) {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v !== null && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      out[k] = sortValue(v[k]);
    }
    return out;
  }
  if (typeof v === "number" && !Number.isFinite(v)) {
    throw new TypeError(
      `canonicalJson: non-finite numbers are not allowed (got ${v})`
    );
  }
  return v;
}
function canonicalJson(value) {
  return JSON.stringify(sortValue(value)).replace(
    /[\u007f-\uffff]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}
function keccakOfText(text) {
  return keccak256(toBytes(text));
}
function keccakOfCanonicalJson(value) {
  return keccakOfText(canonicalJson(value));
}

// packages/bnb-sdk-lab/vendor/typescript/src/erc8004/agentUri.ts
var DATA_URI_PREFIX = "data:application/json;base64,";
function endpointToDict(endpoint) {
  const maybeToDict = endpoint.toDict;
  if (typeof maybeToDict === "function") {
    return endpoint.toDict();
  }
  if (endpoint && typeof endpoint === "object") {
    return endpoint;
  }
  throw new TypeError(
    `Expected AgentEndpoint or object, got ${typeof endpoint}`
  );
}
var AgentURIGenerator = {
  /**
   * Generate an EIP-8004 compliant agent registration file.
   *
   * `registrations` is populated only when `agentId`, `identityRegistry` and
   * `chainId` are ALL present; otherwise it is an empty array.
   */
  generateRegistrationFile(opts) {
    const {
      name,
      description,
      endpoints,
      image = null,
      agentId = null,
      identityRegistry = null,
      chainId = null,
      supportedTrust = null
    } = opts;
    if (!name || !description) {
      throw new Error("name and description are required");
    }
    if (!endpoints || endpoints.length === 0) {
      throw new Error(
        "endpoints is required and must contain at least one endpoint"
      );
    }
    const endpointDicts = endpoints.map(endpointToDict);
    const registrations = [];
    if (agentId !== null && agentId !== void 0 && identityRegistry && chainId !== null && chainId !== void 0) {
      registrations.push({
        // Coerce bigint → number so the registration file stays
        // canonicalJson-serializable (JSON.stringify throws on bigint).
        agentId: typeof agentId === "bigint" ? Number(agentId) : agentId,
        agentRegistry: `eip155:${chainId}:${identityRegistry}`
      });
    }
    const registrationFile = {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name,
      description,
      image: image || "",
      services: endpointDicts,
      registrations
    };
    if (supportedTrust && supportedTrust.length > 0) {
      registrationFile.supportedTrust = supportedTrust;
    }
    return registrationFile;
  },
  /**
   * Calculate the hash of a registration file: keccak256 of its canonical
   * JSON serialization (byte-identical to Python's
   * `json.dumps(x, sort_keys=True, separators=(",", ":"))`).
   */
  calculateFileHash(registrationFile) {
    return keccakOfCanonicalJson(registrationFile);
  },
  /**
   * Generate the agent URI for an agent registration.
   *
   * Always returns a base64 data URI (`data:application/json;base64,...`).
   */
  generateAgentUri(opts) {
    const registrationFile = AgentURIGenerator.generateRegistrationFile(opts);
    const base64Str = AgentURIGenerator.encodeRegistrationFileToBase64(registrationFile);
    return `${DATA_URI_PREFIX}${base64Str}`;
  },
  /**
   * Encode a registration file to a base64 string of its canonical JSON
   * serialization. NOT a plain `JSON.stringify` — this must be
   * byte-identical to the Python SDK's encoding for cross-SDK
   * interoperability.
   */
  encodeRegistrationFileToBase64(registrationFile) {
    return Buffer.from(canonicalJson(registrationFile), "utf-8").toString(
      "base64"
    );
  },
  /**
   * Decode a base64 string (with or without the `data:` URI prefix) back to
   * a registration file object.
   */
  decodeRegistrationFileFromBase64(base64Str) {
    const stripped = base64Str.startsWith(DATA_URI_PREFIX) ? base64Str.slice(DATA_URI_PREFIX.length) : base64Str;
    const json = Buffer.from(stripped, "base64").toString("utf-8");
    return JSON.parse(json);
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/config.ts
var NETWORKS = {
  "bsc-testnet": {
    name: "bsc-testnet",
    chainId: 97,
    rpcUrl: "https://data-seed-prebsc-2-s2.binance.org:8545",
    paymasterUrl: "https://bsc-megafuel-testnet.nodereal.io",
    // Sponsored by default: gasless UX is the paymaster's purpose (0-tBNB
    // onboarding). The MegaFuel testnet relay can be flaky (BUG-022/029);
    // that is handled by the executor's self-pay fallback, relay broadcast
    // verification (RelaySubmissionUnverifiedError), and the
    // BNBAGENT_USE_PAYMASTER=0 escape hatch — NOT by flipping this default.
    usePaymaster: true,
    registryContract: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
    commerceContract: "0xa206c0517b6371c6638cd9e4a42cc9f02a33b0de",
    routerContract: "0xd7d36d66d2f1b608a0f943f722d27e3744f66f25",
    policyContract: "0xd6a4217588f6b1f5657a92a3e94e6422ad771cea"
  },
  "bsc-mainnet": {
    name: "bsc-mainnet",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    paymasterUrl: "https://bsc-megafuel.nodereal.io/",
    usePaymaster: true,
    registryContract: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    commerceContract: "0xea4daa3100a767e86fded867729ae7446476eba6",
    routerContract: "0x51895229e12f9876011789b04f8698af06ccd6da",
    policyContract: "0x9c01845705b3078aa2e8cff7520a6376fd766de5"
  }
};
function resolveNetwork(network = "bsc-testnet") {
  if (typeof network !== "string") {
    return network;
  }
  const nc2 = NETWORKS[network];
  if (nc2 === void 0) {
    throw new Error(`Unknown network: ${network}`);
  }
  const perNetworkKey = `RPC_URL_${nc2.name.toUpperCase().replace(/-/g, "_")}`;
  const rpcOverride = getEnv(perNetworkKey) ?? getEnv("RPC_URL");
  const envPaymaster = paymasterEnvOverride();
  if (rpcOverride) {
    const usePaymaster = envPaymaster ?? (isLocalRpcUrl(rpcOverride) ? false : nc2.usePaymaster);
    return { ...nc2, rpcUrl: rpcOverride, usePaymaster };
  }
  if (envPaymaster !== void 0 && envPaymaster !== nc2.usePaymaster) {
    return { ...nc2, usePaymaster: envPaymaster };
  }
  return nc2;
}
function paymasterEnvOverride() {
  const raw = getEnv("BNBAGENT_USE_PAYMASTER");
  if (raw === void 0) return void 0;
  if (raw === "1") return true;
  if (raw === "0") return false;
  console.warn(
    `[resolveNetwork] ignoring BNBAGENT_USE_PAYMASTER='${raw}' \u2014 expected '0' or '1'.`
  );
  return void 0;
}
function isLocalRpcUrl(url) {
  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

// packages/bnb-sdk-lab/vendor/typescript/package.json
var package_default = {
  name: "@bnbagent/sdk",
  version: "0.6.1",
  description: "TypeScript SDK for building on-chain AI agents on BNB Chain (ERC-8004 identity, ERC-8183 agentic commerce, x402 payments).",
  license: "MIT",
  repository: {
    type: "git",
    url: "https://github.com/bnb-chain/bnbagent-sdk.git",
    directory: "typescript"
  },
  type: "module",
  packageManager: "pnpm@10.24.0",
  engines: {
    node: ">=20"
  },
  publishConfig: {
    access: "public"
  },
  files: [
    "dist"
  ],
  main: "./dist/index.cjs",
  module: "./dist/index.js",
  types: "./dist/index.d.ts",
  exports: {
    ".": {
      types: "./dist/index.d.ts",
      import: "./dist/index.js",
      require: "./dist/index.cjs"
    },
    "./erc8004": {
      types: "./dist/erc8004/index.d.ts",
      import: "./dist/erc8004/index.js",
      require: "./dist/erc8004/index.cjs"
    },
    "./erc8183": {
      types: "./dist/erc8183/index.d.ts",
      import: "./dist/erc8183/index.js",
      require: "./dist/erc8183/index.cjs"
    },
    "./x402": {
      types: "./dist/x402/index.d.ts",
      import: "./dist/x402/index.js",
      require: "./dist/x402/index.cjs"
    },
    "./storage": {
      types: "./dist/storage/index.d.ts",
      import: "./dist/storage/index.js",
      require: "./dist/storage/index.cjs"
    },
    "./wallets": {
      types: "./dist/wallets/index.d.ts",
      import: "./dist/wallets/index.js",
      require: "./dist/wallets/index.cjs"
    },
    "./signing": {
      types: "./dist/signing/index.d.ts",
      import: "./dist/signing/index.js",
      require: "./dist/signing/index.cjs"
    },
    "./networks": {
      types: "./dist/networks/index.d.ts",
      import: "./dist/networks/index.js",
      require: "./dist/networks/index.cjs"
    },
    "./utils": {
      types: "./dist/utils/index.d.ts",
      import: "./dist/utils/index.js",
      require: "./dist/utils/index.cjs"
    }
  },
  scripts: {
    codegen: "node scripts/abi-codegen.mjs",
    build: "tsup",
    test: "vitest run",
    lint: "biome check src tests",
    typecheck: "tsc --noEmit",
    "typecheck:examples": "tsc --noEmit -p examples",
    check: "pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build",
    "example:x402": "tsx examples/x402/buyerDemo.ts",
    "example:security": "tsx examples/security/e2e.ts",
    "example:agent-server": "tsx examples/agent-server/src/service.ts",
    "example:a2a-server": "tsx examples/a2a-agent/src/server.ts",
    "example:a2a-buyer": "tsx examples/a2a-agent/scripts/buyer.ts",
    "smoke:testnet": "tsx examples/smoke/readonly.ts",
    "e2e:altana": "tsx examples/altana/e2e.ts",
    "e2e:turnkey": "tsx examples/turnkey/e2e.ts"
  },
  dependencies: {
    "@noble/ciphers": "^1.0.0",
    "@noble/hashes": "^1.4.0",
    dotenv: "^16.4.0",
    viem: "^2.24.2"
  },
  devDependencies: {
    "@altananetwork/sdk": "0.7.1",
    "@biomejs/biome": "^1.8.0",
    "@turnkey/sdk-server": "8.1.0",
    "@turnkey/viem": "0.14.34",
    "@types/node": "^20.0.0",
    tsup: "^8.0.0",
    tsx: "^4.23.0",
    typescript: "^5.5.0",
    vitest: "^2.0.0"
  },
  peerDependencies: {
    "@altananetwork/sdk": "0.7.1",
    "@turnkey/sdk-server": ">=7.0.0 <9.0.0",
    "@turnkey/viem": ">=0.14.32 <0.15.0"
  },
  peerDependenciesMeta: {
    "@altananetwork/sdk": {
      optional: true
    },
    "@turnkey/sdk-server": {
      optional: true
    },
    "@turnkey/viem": {
      optional: true
    }
  },
  pnpm: {
    onlyBuiltDependencies: [
      "@biomejs/biome",
      "esbuild"
    ]
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/version.ts
var SDK_VERSION = package_default.version;

// packages/bnb-sdk-lab/vendor/typescript/src/erc8004/constants.ts
var ERC8004_ENV_PREFIX = "ERC8004_";
function getErc8004Config(network = "bsc-testnet") {
  const nc2 = resolveNetwork(network);
  const registryOverride = getEnv(
    "REGISTRY_ADDRESS",
    void 0,
    ERC8004_ENV_PREFIX
  );
  return {
    name: nc2.name,
    chainId: nc2.chainId,
    rpcUrl: nc2.rpcUrl,
    paymasterUrl: nc2.paymasterUrl || "",
    paymaster: nc2.usePaymaster,
    registryContract: registryOverride || nc2.registryContract
  };
}
var BUILT_WITH_KEY = "built_with";
var BUILT_WITH_URL = "https://github.com/bnb-chain/bnbagent-sdk";
function getBuiltWithValue() {
  return `${BUILT_WITH_URL}#v${SDK_VERSION}`;
}

// packages/bnb-sdk-lab/vendor/typescript/src/abis/identityRegistry.ts
var identityRegistryAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ECDSAInvalidSignature",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "ECDSAInvalidSignatureLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "ECDSAInvalidSignatureS",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721IncorrectOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721InsufficientApproval",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOperator",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC721InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ERC721NonexistentToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "approved",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_fromTokenId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_toTokenId",
        "type": "uint256"
      }
    ],
    "name": "BatchMetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [],
    "name": "EIP712DomainChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "string",
        "name": "indexedMetadataKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "metadataValue",
        "type": "bytes"
      }
    ],
    "name": "MetadataSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_tokenId",
        "type": "uint256"
      }
    ],
    "name": "MetadataUpdate",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "Registered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newURI",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "updatedBy",
        "type": "address"
      }
    ],
    "name": "URIUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "eip712Domain",
    "outputs": [
      {
        "internalType": "bytes1",
        "name": "fields",
        "type": "bytes1"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "version",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "chainId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifyingContract",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "salt",
        "type": "bytes32"
      },
      {
        "internalType": "uint256[]",
        "name": "extensions",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "getAgentWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getApproved",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      }
    ],
    "name": "getMetadata",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getVersion",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "ownerOf",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "metadataKey",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "metadataValue",
            "type": "bytes"
          }
        ],
        "internalType": "struct IdentityRegistryUpgradeable.MetadataEntry[]",
        "name": "metadata",
        "type": "tuple[]"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "agentURI",
        "type": "string"
      }
    ],
    "name": "register",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "newURI",
        "type": "string"
      }
    ],
    "name": "setAgentURI",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "signature",
        "type": "bytes"
      }
    ],
    "name": "setAgentWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "operator",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "approved",
        "type": "bool"
      }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "metadataKey",
        "type": "string"
      },
      {
        "internalType": "bytes",
        "name": "metadataValue",
        "type": "bytes"
      }
    ],
    "name": "setMetadata",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "tokenURI",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "agentId",
        "type": "uint256"
      }
    ],
    "name": "unsetAgentWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// packages/bnb-sdk-lab/vendor/typescript/src/core/contractBase.ts
var READ_ONLY_MESSAGE = "wallet_provider is required for write operations (client is read-only)";
var ContractBase = class {
  address;
  client;
  abi;
  walletProvider;
  paymaster;
  receiptTimeout;
  intentExecutor = null;
  constructor(opts) {
    this.address = opts.address;
    this.client = opts.client;
    this.abi = opts.abi;
    this.walletProvider = opts.walletProvider ?? null;
    this.paymaster = opts.paymaster ?? null;
    this.receiptTimeout = opts.receiptTimeout ?? null;
  }
  /**
   * Call a read function with retry on rate limit (`429`/"too many
   * requests"); any other error propagates immediately.
   */
  async callWithRetry(fn) {
    let lastError;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_BASE_DELAY * 2 ** attempt * 1e3);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }
  /**
   * Run an {@link Intent} through the wallet's executor.
   *
   * This is the write path for clients migrated to the intent seam: the
   * wallet decides how the intent executes (a pure signer wraps itself in a
   * local build/sign/broadcast executor; a self-broadcasting wallet runs the
   * semantic operation itself). The executor is built lazily and cached for
   * the lifetime of this instance.
   */
  async executeIntent(intent) {
    if (!this.walletProvider) {
      throw new Error(READ_ONLY_MESSAGE);
    }
    if (!this.intentExecutor) {
      this.intentExecutor = this.walletProvider.makeExecutor({
        client: this.client,
        paymaster: this.paymaster,
        receiptTimeout: this.receiptTimeout
      });
    }
    return this.intentExecutor.execute(intent);
  }
  /**
   * Build, sign, and send a transaction with nonce management and retry.
   *
   * `gas` undefined (default) estimates the limit on-chain with a 20%
   * buffer; pass an explicit `gas` to skip estimation entirely. Delegates to
   * `./txSender.js`'s shared self-pay core once the ABI-specific calldata
   * and gas limit are resolved.
   */
  async sendTx(req) {
    const walletProvider = this.walletProvider;
    if (!walletProvider) {
      throw new Error(READ_ONLY_MESSAGE);
    }
    const value = req.value ?? 0n;
    const skipPreflight = req.skipPreflight ?? false;
    const account = walletProvider.address;
    const data = encodeFunctionData({
      abi: this.abi,
      functionName: req.functionName,
      args: req.args
    });
    const gas = req.gas ?? await estimateGasLimit(
      this.client,
      { account, to: this.address, data, value, skipPreflight },
      { logPrefix: "[ContractBase]" }
    );
    return sendSelfPayTx({
      client: this.client,
      walletProvider,
      to: this.address,
      data,
      value,
      gas,
      skipPreflight,
      logPrefix: "[ContractBase]"
    });
  }
  /**
   * Thin wrapper over `publicClient.getLogs` scoped to this contract's
   * address, resolving `eventName` against the ABI and forwarding an
   * optional indexed-argument filter.
   */
  async readEvents(opts) {
    const eventAbi = getAbiItem({ abi: this.abi, name: opts.eventName });
    if (!eventAbi || eventAbi.type !== "event") {
      throw new Error(
        `readEvents: no event named "${opts.eventName}" on this contract's ABI`
      );
    }
    const logs = await this.client.getLogs({
      address: this.address,
      event: eventAbi,
      args: opts.args,
      fromBlock: opts.fromBlock,
      toBlock: opts.toBlock ?? "latest"
    });
    return logs.map((log) => {
      const decoded = log;
      return {
        eventName: decoded.eventName ?? opts.eventName,
        args: decoded.args ?? {},
        address: decoded.address,
        blockNumber: decoded.blockNumber,
        blockHash: decoded.blockHash,
        transactionHash: decoded.transactionHash,
        logIndex: decoded.logIndex,
        removed: decoded.removed
      };
    });
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/intents.ts
var ERC8004_REGISTER = "erc8004.register";
var ERC8004_SET_METADATA = "erc8004.set_metadata";
var ERC8004_SET_AGENT_URI = "erc8004.set_agent_uri";
var ERC8183_CREATE_JOB = "erc8183.create_job";
var ERC8183_CREATE_JOB_WITH_TOKEN = "erc8183.create_job_with_token";
var ERC8183_SET_PROVIDER = "erc8183.set_provider";
var ERC8183_SET_BUDGET = "erc8183.set_budget";
var ERC8183_FUND = "erc8183.fund";
var ERC8183_SUBMIT = "erc8183.submit";
var ERC8183_COMPLETE = "erc8183.complete";
var ERC8183_REJECT = "erc8183.reject";
var ERC8183_CLAIM_REFUND = "erc8183.claim_refund";
var ERC8183_REGISTER_JOB = "erc8183.register_job";
var ERC8183_SETTLE = "erc8183.settle";
var ERC8183_MARK_EXPIRED = "erc8183.mark_expired";
var ERC8183_DISPUTE = "erc8183.dispute";
var ERC8183_VOTE_REJECT = "erc8183.vote_reject";

// packages/bnb-sdk-lab/vendor/typescript/src/erc8004/contract.ts
var ContractInterface = class extends ContractBase {
  constructor(opts) {
    super({
      client: opts.client,
      address: getAddress(opts.contractAddress),
      abi: identityRegistryAbi,
      walletProvider: opts.walletProvider ?? null,
      paymaster: opts.paymaster ?? null,
      receiptTimeout: opts.receiptTimeout ?? null
    });
  }
  /**
   * Auto-inject a `built_with` metadata entry identifying this SDK unless
   * the caller already supplied one.
   */
  injectBuiltWith(metadata) {
    const items = metadata ? [...metadata] : [];
    if (!items.some((entry) => entry.key === BUILT_WITH_KEY)) {
      items.push({ key: BUILT_WITH_KEY, value: getBuiltWithValue() });
    }
    return items;
  }
  /**
   * Try to recover the `agentId` assigned by a `register` call from the
   * `Registered` event in the transaction's logs. Returns `null` if no log
   * decodes as `Registered`.
   *
   * Filters by `log.address` and re-checks `decoded.eventName` for the same
   * reason `CommerceClient.parseJobCreatedId` does: viem's `decodeEventLog`
   * is not bound to a contract instance (unlike web3.py's
   * `process_receipt`), so without the address filter a same-topic0 log
   * emitted by an UNRELATED contract in the same receipt (e.g. a bundled
   * multicall or AA-paymaster relay) could be decoded and its `agentId`
   * returned — silently binding the agent to the wrong on-chain token id.
   */
  parseRegisteredAgentId(logs) {
    const address = this.address.toLowerCase();
    for (const log of logs) {
      if (log.address.toLowerCase() !== address) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: identityRegistryAbi,
          eventName: "Registered",
          data: log.data,
          topics: log.topics
        });
        if (decoded.eventName !== "Registered") {
          continue;
        }
        const agentId = decoded.args.agentId;
        if (agentId !== void 0) {
          return Number(agentId);
        }
      } catch {
      }
    }
    return null;
  }
  /** Register a new agent on-chain. */
  async registerAgent(agentUri, metadata) {
    try {
      const fullMetadata = this.injectBuiltWith(metadata);
      const metadataBytes = fullMetadata.map((entry) => ({
        metadataKey: entry.key,
        metadataValue: toHex(toBytes(entry.value))
      }));
      const intent = {
        name: ERC8004_REGISTER,
        kwargs: { agentUri, metadata: fullMetadata },
        call: {
          address: this.address,
          abi: this.abi,
          functionName: "register",
          args: [agentUri, metadataBytes]
        },
        description: "registration"
      };
      const result = await this.executeIntent(intent);
      let agentId = result.agentId ?? null;
      if (agentId == null && result.receipt?.logs?.length) {
        agentId = this.parseRegisteredAgentId(result.receipt.logs);
      }
      return {
        success: true,
        transactionHash: result.transactionHash,
        agentId,
        receipt: result.receipt
      };
    } catch (error) {
      if (error instanceof TransactionPendingError || error instanceof RelaySubmissionUnverifiedError) {
        throw error;
      }
      throw new Error(`Agent registration failed: ${describeError(error)}`, {
        cause: error
      });
    }
  }
  /** Get information about an agent. */
  async getAgentInfo(agentId) {
    try {
      const id = BigInt(agentId);
      const agentWallet = await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: identityRegistryAbi,
          functionName: "getAgentWallet",
          args: [id]
        })
      );
      const owner = await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: identityRegistryAbi,
          functionName: "ownerOf",
          args: [id]
        })
      );
      const agentURI = await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: identityRegistryAbi,
          functionName: "tokenURI",
          args: [id]
        })
      );
      return {
        agentId,
        agentAddress: agentWallet,
        agentWallet,
        owner,
        agentURI
      };
    } catch (error) {
      throw new Error(`Failed to get agent info: ${describeError(error)}`, {
        cause: error
      });
    }
  }
  /** Get metadata for an agent, decoded from bytes to a UTF-8 string. */
  async getMetadata(agentId, key) {
    try {
      const valueHex = await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: identityRegistryAbi,
          functionName: "getMetadata",
          args: [BigInt(agentId), key]
        })
      );
      return hexToString(valueHex);
    } catch (error) {
      throw new Error(`Failed to get metadata: ${describeError(error)}`, {
        cause: error
      });
    }
  }
  /** Set metadata for an agent (must be owner or operator). */
  async setMetadata(agentId, key, value) {
    try {
      const valueBytes = toHex(toBytes(value));
      const intent = {
        name: ERC8004_SET_METADATA,
        kwargs: { agentId, key, value },
        call: {
          address: this.address,
          abi: this.abi,
          functionName: "setMetadata",
          args: [BigInt(agentId), key, valueBytes]
        },
        description: "set metadata"
      };
      const result = await this.executeIntent(intent);
      return {
        success: true,
        transactionHash: result.transactionHash,
        receipt: result.receipt
      };
    } catch (error) {
      if (error instanceof RelaySubmissionUnverifiedError) {
        throw error;
      }
      throw new Error(`Failed to set metadata: ${describeError(error)}`, {
        cause: error
      });
    }
  }
  /**
   * Set the agent URI using the contract's `setAgentURI` function, which
   * updates the tokenURI directly per the EIP-8004 specification.
   */
  async setAgentUri(agentId, agentUri) {
    try {
      const intent = {
        name: ERC8004_SET_AGENT_URI,
        kwargs: { agentId, agentUri },
        call: {
          address: this.address,
          abi: this.abi,
          functionName: "setAgentURI",
          args: [BigInt(agentId), agentUri]
        },
        description: "set agent URI"
      };
      const result = await this.executeIntent(intent);
      return {
        success: true,
        transactionHash: result.transactionHash,
        receipt: result.receipt
      };
    } catch (error) {
      if (error instanceof TransactionPendingError || error instanceof RelaySubmissionUnverifiedError) {
        throw error;
      }
      throw new Error(`Failed to set agent URI: ${describeError(error)}`, {
        cause: error
      });
    }
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/erc8004/models.ts
var AgentEndpoint = class _AgentEndpoint {
  /**
   * A2A discovery document path (A2A spec): the agent card is served at
   * `{base}/.well-known/agent-card.json`.
   */
  static A2A_WELL_KNOWN_PATH = "/.well-known/agent-card.json";
  name;
  endpoint;
  version;
  capabilities;
  constructor(opts) {
    const { name, endpoint, version: version4 = null, capabilities = [] } = opts;
    if (!name || typeof name !== "string") {
      throw new Error("name is required and must be a string");
    }
    if (!endpoint || typeof endpoint !== "string") {
      throw new Error("endpoint is required and must be a string");
    }
    if (!(endpoint.startsWith("http://") || endpoint.startsWith("https://"))) {
      throw new Error("endpoint must start with http:// or https://");
    }
    this.name = name;
    this.endpoint = endpoint;
    this.version = version4 ?? null;
    this.capabilities = capabilities ?? [];
  }
  /** Convert to a plain object for JSON serialization; omits null/empty fields. */
  toDict() {
    const result = {
      name: this.name,
      endpoint: this.endpoint
    };
    if (this.version !== null) {
      result.version = this.version;
    }
    if (this.capabilities.length > 0) {
      result.capabilities = this.capabilities;
    }
    return result;
  }
  /** Create from a plain object; requires `name` and `endpoint` fields. */
  static fromDict(data) {
    if (!("name" in data) || !("endpoint" in data)) {
      throw new Error("dictionary must contain 'name' and 'endpoint' fields");
    }
    return new _AgentEndpoint({
      name: data.name,
      endpoint: data.endpoint,
      version: data.version ?? null,
      capabilities: data.capabilities ?? []
    });
  }
  // ── Protocol-aware constructors (registration side only) ──
  //
  // The SDK does NOT implement the A2A or MCP runtimes — agents bring their
  // own serving stack. These constructors encode exactly what the EIP-8004
  // registration-file format specifies for each endpoint type, so callers
  // don't hand-roll stringly-typed entries.
  /**
   * A2A endpoint for the agent served at `baseUrl`.
   *
   * Appends the spec-defined agent-card discovery path
   * (`/.well-known/agent-card.json`) unless `baseUrl` already ends with it,
   * so the registered endpoint is always the discovery document a buyer can
   * fetch directly. The append is query-string-aware: an AgentCore invoke URL
   * carries `?qualifier=DEFAULT`, and naive concatenation would wedge the path
   * after the query (`…/invocations?qualifier=DEFAULT/.well-known/…`) and yield
   * an invalid URL — the path is inserted before the query/fragment instead.
   */
  static a2a(baseUrl, opts = {}) {
    return new _AgentEndpoint({
      name: "A2A",
      endpoint: appendAgentCardPath(baseUrl),
      version: opts.version ?? null,
      capabilities: opts.capabilities ?? []
    });
  }
  /**
   * MCP endpoint for a remote MCP server at `url`.
   *
   * Per the ERC-8004 registration-file format, an MCP entry is the server
   * URL plus an optional protocol `version` — nothing more. Only
   * network-transport MCP servers are registrable; a stdio MCP server has no
   * URL, which the endpoint's `http(s)://` validation enforces structurally.
   */
  static mcp(url, opts = {}) {
    return new _AgentEndpoint({
      name: "MCP",
      endpoint: url,
      version: opts.version ?? null,
      capabilities: opts.capabilities ?? []
    });
  }
};
function appendAgentCardPath(baseUrl) {
  const wellKnown = AgentEndpoint.A2A_WELL_KNOWN_PATH;
  const raw = String(baseUrl ?? "").trim();
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    const trimmed = raw.replace(/\/+$/, "");
    return trimmed.endsWith(wellKnown) ? trimmed : `${trimmed}${wellKnown}`;
  }
  let path = parsed.pathname.replace(/\/+$/, "");
  if (!path.endsWith(wellKnown)) {
    path = path ? `${path}${wellKnown}` : wellKnown;
  }
  return `${parsed.protocol}//${parsed.host}${path}${parsed.search}${parsed.hash}`;
}

// packages/bnb-sdk-lab/vendor/typescript/src/erc8004/agent.ts
var ERC8004Agent = class _ERC8004Agent {
  walletProviderRef;
  networkConfig;
  client;
  contractInterface;
  debug;
  constructor(walletProvider, networkConfig, client, contractInterface, debug) {
    this.walletProviderRef = walletProvider;
    this.networkConfig = networkConfig;
    this.client = client;
    this.contractInterface = contractInterface;
    this.debug = debug;
  }
  /**
   * Create an `ERC8004Agent`.
   *
   * Connects to the network's RPC and asserts its `chain_id` matches the
   * resolved network config (defense-in-depth against a misconfigured or
   * maliciously redirected `RPC_URL`) before returning.
   *
   * @throws {Error} if `walletProvider` is missing, the network is unknown,
   *   the registry contract address is missing, the RPC is unreachable, or
   *   the RPC's chain_id does not match the expected network.
   */
  static async create(opts) {
    const { walletProvider, network = "bsc-testnet", debug = false } = opts;
    if (!walletProvider) {
      throw new Error(
        "wallet_provider is required. Use EVMWalletProvider(password='...') for private key wallets."
      );
    }
    const networkConfig = getErc8004Config(network);
    if (!networkConfig.registryContract) {
      throw new Error(
        `registry_contract not found in ${networkConfig.name} config`
      );
    }
    const client = createPublicClient({
      transport: http(networkConfig.rpcUrl)
    });
    let actualChainId;
    try {
      actualChainId = await client.getChainId();
    } catch (error) {
      throw new Error(
        `Failed to connect to RPC: ${networkConfig.rpcUrl} (${describeError(error)})`,
        { cause: error }
      );
    }
    if (networkConfig.chainId !== null && networkConfig.chainId !== void 0 && actualChainId !== networkConfig.chainId) {
      throw new Error(
        `RPC chain_id mismatch for network '${networkConfig.name}': expected ${networkConfig.chainId}, got ${actualChainId}. The RPC at ${networkConfig.rpcUrl} is serving a different chain.`
      );
    }
    let paymaster = null;
    if (networkConfig.paymaster) {
      if (!networkConfig.paymasterUrl) {
        throw new Error(
          `paymaster_url not found in ${networkConfig.name} config. Paymaster is required for this network.`
        );
      }
      paymaster = new Paymaster(networkConfig.paymasterUrl, debug);
    }
    const contractInterface = new ContractInterface({
      client,
      contractAddress: networkConfig.registryContract,
      walletProvider,
      paymaster
    });
    return new _ERC8004Agent(
      walletProvider,
      networkConfig,
      client,
      contractInterface,
      debug
    );
  }
  /**
   * Generate an agent URI for agent registration.
   *
   * Creates an EIP-8004 compliant agent registration file and returns a
   * base64 data URI. To avoid re-registering, check local state with
   * `getLocalAgentInfo(name)` first.
   */
  generateAgentUri(opts) {
    if (!opts.endpoints || opts.endpoints.length === 0) {
      throw new Error(
        "endpoints is required and must contain at least one endpoint"
      );
    }
    return AgentURIGenerator.generateAgentUri({
      name: opts.name,
      description: opts.description,
      image: opts.image ?? null,
      endpoints: opts.endpoints,
      agentId: opts.agentId ?? null,
      identityRegistry: this.contractInterface.address,
      chainId: this.networkConfig.chainId,
      supportedTrust: opts.supportedTrust ?? null
    });
  }
  /**
   * Find an agent registered by this wallet, by name.
   *
   * Queries the indexer API (via `getAllAgents`) and returns the first
   * agent whose name matches and whose owner is this wallet's address.
   * Returns `null` when not found or the lookup fails.
   */
  async getLocalAgentInfo(name) {
    if (!name) {
      return null;
    }
    try {
      const myAddress = this.walletAddress.toLowerCase();
      const result = await this.getAllAgents(100, 0);
      const items = result.items ?? [];
      for (const agent of items) {
        const ownerAddress = String(agent.owner_address ?? "").toLowerCase();
        const agentName = String(agent.name ?? "").toLowerCase();
        if (ownerAddress === myAddress && agentName === name.toLowerCase()) {
          return {
            name: agent.name,
            agentId: Number(agent.token_id),
            agentUri: agent.agent_uri ?? "",
            ownerAddress: agent.owner_address
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  }
  /**
   * Register a new agent on-chain.
   *
   * Two-phase: (1) `register` on the contract; (2) if an `agentId` was
   * assigned and the parsed agent data carries endpoints, regenerate the
   * agent URI WITH `agentId`/registry/chainId and push it via
   * `setAgentUri`. A phase-2 failure raises
   * {@link ERC8004PartialRegistrationError} (the agent already exists —
   * only the registrations field failed to update); `txHash` is populated
   * only when the cause is a {@link TransactionPendingError}.
   */
  async registerAgent(agentUri, metadata) {
    if (!agentUri) {
      throw new Error("agent_uri is required");
    }
    const agentData = await _ERC8004Agent.parseAgentUri(agentUri);
    if (!agentData) {
      throw new Error("Failed to parse agent URI");
    }
    const agentName = agentData.name;
    if (!agentName) {
      throw new Error("Agent URI does not contain a name field");
    }
    const result = await this.contractInterface.registerAgent(
      agentUri,
      metadata
    );
    const agentId = result.agentId;
    let finalAgentUri = agentUri;
    if (agentId !== null && agentId !== void 0) {
      try {
        const services = agentData.services ?? [];
        const endpoints = services.map(
          (svc) => new AgentEndpoint({
            name: svc.name ?? "",
            endpoint: svc.endpoint ?? "",
            version: svc.version ?? null
          })
        );
        if (endpoints.length > 0) {
          const supportedTrust = agentData.supportedTrust ?? agentData.supportedTrusts ?? null;
          finalAgentUri = this.generateAgentUri({
            name: agentData.name ?? "",
            description: agentData.description ?? "",
            image: agentData.image ?? null,
            endpoints,
            agentId,
            supportedTrust
          });
          await this.contractInterface.setAgentUri(agentId, finalAgentUri);
        }
      } catch (error) {
        const txHash = error instanceof TransactionPendingError ? error.txHash : null;
        const retryable = !(error instanceof RelaySubmissionUnverifiedError);
        throw new ERC8004PartialRegistrationError(
          agentId,
          finalAgentUri,
          error,
          txHash,
          retryable
        );
      }
    }
    return { ...result, agentURI: finalAgentUri };
  }
  /** Get information about a registered agent. */
  async getAgentInfo(agentId) {
    return this.contractInterface.getAgentInfo(agentId);
  }
  /**
   * List all registered agents via the 8004scan indexer API. Does not
   * require on-chain calls.
   *
   * `limit` is capped at 100.
   */
  async getAllAgents(limit = 10, offset = 0) {
    const chainId = this.networkConfig.chainId;
    const params = new URLSearchParams({
      chain_id: String(chainId),
      limit: String(Math.min(limit, 100)),
      offset: String(offset)
    });
    let response;
    try {
      response = await fetch(`${SCAN_API_URL}/agents?${params.toString()}`, {
        signal: AbortSignal.timeout(3e4)
      });
    } catch (error) {
      throw new Error(`8004scan API request failed: ${describeError(error)}`, {
        cause: error
      });
    }
    if (!response.ok) {
      throw new Error(
        `8004scan API request failed: ${response.status} ${response.statusText}`
      );
    }
    return await response.json();
  }
  /** Get a metadata value for an agent, decoded from bytes. */
  async getMetadata(agentId, key) {
    return this.contractInterface.getMetadata(agentId, key);
  }
  /** Set metadata for an agent (must be owner or operator). */
  async setMetadata(agentId, key, value) {
    return this.contractInterface.setMetadata(agentId, key, value);
  }
  /** Set the agent URI for an agent. */
  async setAgentUri(agentId, agentUri) {
    if (!agentUri) {
      throw new Error("agent_uri is required");
    }
    const result = await this.contractInterface.setAgentUri(agentId, agentUri);
    return { ...result, agentURI: agentUri };
  }
  /**
   * Parse an agent URI to a plain object.
   *
   * Supports:
   * - Base64 data URI: `data:application/json;base64,...` — decodes and parses.
   * - HTTP/HTTPS URL — fetches and parses JSON, behind an SSRF guard
   *   (blocked cloud-metadata hostnames, private/loopback/link-local/
   *   reserved/CGNAT IP ranges, no redirects, 10s timeout, 1 MB cap).
   *
   * Never throws: any parsing/format/network failure resolves to `null`.
   */
  static async parseAgentUri(agentUri) {
    if (!agentUri) {
      return null;
    }
    if (agentUri.startsWith("data:application/json;base64,")) {
      try {
        return AgentURIGenerator.decodeRegistrationFileFromBase64(agentUri);
      } catch {
        return null;
      }
    }
    if (agentUri.startsWith("http://") || agentUri.startsWith("https://")) {
      return fetchPublicJson(agentUri);
    }
    return null;
  }
  /** The wallet's on-chain address. */
  get walletAddress() {
    return this.walletProviderRef.address;
  }
  /** The ERC-8004 Identity Registry contract address. */
  get contractAddress() {
    return this.contractInterface.address;
  }
  /** The resolved network configuration. */
  get network() {
    return this.networkConfig;
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/core/clients.ts
var DEFAULT_BSC_TESTNET_RPC_URL = "https://data-seed-prebsc-2-s2.binance.org:8545";
function createPublicClientFor(rpcUrl) {
  const url = rpcUrl && rpcUrl.length > 0 ? rpcUrl : DEFAULT_BSC_TESTNET_RPC_URL;
  return createPublicClient({ transport: http(url) });
}

// packages/bnb-sdk-lab/vendor/typescript/src/abis/erc20.ts
var erc20Abi2 = [
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// packages/bnb-sdk-lab/vendor/typescript/src/erc20/client.ts
var MinimalERC20Client = class extends ContractBase {
  constructor(client, tokenAddress, walletProvider) {
    super({
      client,
      address: getAddress(tokenAddress),
      abi: erc20Abi2,
      walletProvider: walletProvider ?? null
    });
  }
  /** Number of decimals the token uses (e.g. `18`, `6`). */
  async decimals() {
    const result = await this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: erc20Abi2,
        functionName: "decimals"
      })
    );
    return Number(result);
  }
  /** The token's ticker symbol (e.g. `"USDT"`). */
  async symbol() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: erc20Abi2,
        functionName: "symbol"
      })
    );
  }
  /** The token balance held by `account`. */
  async balanceOf(account) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: erc20Abi2,
        functionName: "balanceOf",
        args: [getAddress(account)]
      })
    );
  }
  /** The amount `spender` is currently allowed to draw from `owner`. */
  async allowance(owner, spender) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: erc20Abi2,
        functionName: "allowance",
        args: [getAddress(owner), getAddress(spender)]
      })
    );
  }
  /**
   * Approve `spender` to draw up to `amount` from this wallet's balance.
   *
   * Requires a wallet provider — `ContractBase.sendTx` throws its read-only
   * error otherwise.
   */
  async approve(spender, amount) {
    return this.sendTx({
      functionName: "approve",
      args: [getAddress(spender), amount]
    });
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/networks/assets.ts
var AssetId = Object.freeze({
  U: "U",
  TEST_U: "TEST_U",
  USD1: "USD1",
  BINANCE_PEG_USDC: "BINANCE_PEG_USDC",
  BINANCE_PEG_USDT: "BINANCE_PEG_USDT",
  TEST_USDC: "TEST_USDC",
  TEST_USDT: "TEST_USDT"
});
var PaymentAssetUnavailableError = class extends Error {
  chainId;
  assetId;
  constructor(chainId, assetId) {
    super(`AssetId ${assetId} is unavailable on chain_id=${chainId}`);
    this.name = "PaymentAssetUnavailableError";
    this.chainId = chainId;
    this.assetId = assetId;
  }
};
var CANONICAL_IDS = new Set(Object.values(AssetId));
function parseAssetId(value) {
  if (!CANONICAL_IDS.has(value)) {
    throw new Error(`unknown canonical AssetId: ${JSON.stringify(value)}`);
  }
  return value;
}
var AssetCatalog = class {
  #metadataByKey = /* @__PURE__ */ new Map();
  #metadataByAddress = /* @__PURE__ */ new Map();
  #activeByKey = /* @__PURE__ */ new Map();
  #activeByAddress = /* @__PURE__ */ new Map();
  #activeB402ByKey = /* @__PURE__ */ new Map();
  #activeB402ByAddress = /* @__PURE__ */ new Map();
  #activeByChain = /* @__PURE__ */ new Map();
  #metadataChains = /* @__PURE__ */ new Set();
  constructor(assets) {
    const mutableActiveByChain = /* @__PURE__ */ new Map();
    for (const input of assets) {
      const assetId = parseAssetId(input.assetId);
      const key = `${input.chainId}:${assetId}`;
      if (this.#metadataByKey.has(key)) {
        throw new Error(
          `duplicate catalog key: chain_id=${input.chainId}, asset_id=${assetId}`
        );
      }
      const address = getAddress(input.address);
      if (address !== input.address) {
        throw new Error(`catalog address is not checksummed: ${input.address}`);
      }
      const availability = input.availability ?? "active";
      validateAvailability(input, availability, address);
      const b402Kinds = validateB402Metadata(input);
      const b402Address = getAddress(input.b402Address ?? address);
      if (b402Address !== (input.b402Address ?? address)) {
        throw new Error(
          `catalog B402 address is not checksummed: ${input.b402Address ?? address}`
        );
      }
      const b402Decimals = input.b402Decimals ?? input.decimals;
      if (!Number.isInteger(b402Decimals) || b402Decimals < 0) {
        throw new Error("catalog B402 decimals must be a non-negative integer");
      }
      const addressKey = `${input.chainId}:${address.toLowerCase()}`;
      if (this.#metadataByAddress.has(addressKey)) {
        throw new Error(
          `duplicate catalog address: chain_id=${input.chainId}, address=${address}`
        );
      }
      const asset = Object.freeze({
        ...input,
        assetId,
        address,
        b402Address,
        b402Decimals,
        availability,
        b402Methods: Object.freeze([...input.b402Methods]),
        b402Kinds: Object.freeze(
          b402Kinds.map((kind) => Object.freeze({ ...kind }))
        ),
        eip3009Domain: input.eip3009Domain === null ? null : Object.freeze({ ...input.eip3009Domain })
      });
      this.#metadataByKey.set(key, asset);
      this.#metadataByAddress.set(addressKey, asset);
      this.#metadataChains.add(asset.chainId);
      if (asset.availability === "active") {
        if (b402Address.toLowerCase() === ZERO_ADDRESS) {
          throw new Error("active B402 asset cannot use zero address");
        }
        const b402AddressKey = `${asset.chainId}:${b402Address.toLowerCase()}`;
        if (this.#activeB402ByAddress.has(b402AddressKey)) {
          throw new Error(
            `duplicate catalog B402 address: chain_id=${asset.chainId}, address=${b402Address}`
          );
        }
        const b402Asset = Object.freeze({
          ...asset,
          address: b402Address,
          decimals: b402Decimals
        });
        this.#activeByKey.set(key, asset);
        this.#activeByAddress.set(addressKey, asset);
        this.#activeB402ByKey.set(key, b402Asset);
        this.#activeB402ByAddress.set(b402AddressKey, b402Asset);
        const chainAssets = mutableActiveByChain.get(asset.chainId) ?? [];
        chainAssets.push(asset);
        mutableActiveByChain.set(asset.chainId, chainAssets);
      }
    }
    for (const chainId of this.#metadataChains) {
      this.#activeByChain.set(
        chainId,
        Object.freeze([...mutableActiveByChain.get(chainId) ?? []])
      );
    }
    Object.freeze(this);
  }
  #requireChain(chainId) {
    if (!this.#metadataChains.has(chainId)) {
      throw new Error(`no asset catalog registered for chain_id=${chainId}`);
    }
  }
  get(chainId, assetId) {
    const asset = this.getMetadata(chainId, assetId);
    if (asset.availability === "placeholder") {
      throw new PaymentAssetUnavailableError(chainId, asset.assetId);
    }
    const activeAsset = this.#activeByKey.get(`${chainId}:${asset.assetId}`);
    if (activeAsset === void 0) {
      throw new Error(
        `AssetId ${asset.assetId} is not available on chain_id=${chainId}`
      );
    }
    return activeAsset;
  }
  getMetadata(chainId, assetId) {
    this.#requireChain(chainId);
    const canonical = parseAssetId(assetId);
    const asset = this.#metadataByKey.get(`${chainId}:${canonical}`);
    if (asset === void 0) {
      throw new Error(
        `AssetId ${canonical} is not available on chain_id=${chainId}`
      );
    }
    return asset;
  }
  byAddress(chainId, inputAddress) {
    this.#requireChain(chainId);
    let address;
    try {
      address = getAddress(inputAddress);
    } catch (error) {
      throw new Error(
        `asset address ${JSON.stringify(inputAddress)} is not registered on chain_id=${chainId}`,
        { cause: error }
      );
    }
    const asset = this.#activeByAddress.get(
      `${chainId}:${address.toLowerCase()}`
    );
    if (asset === void 0) {
      throw new Error(
        `asset address ${JSON.stringify(inputAddress)} is not registered on chain_id=${chainId}`
      );
    }
    return asset;
  }
  getB402(chainId, assetId) {
    const asset = this.get(chainId, assetId);
    const b402Asset = this.#activeB402ByKey.get(`${chainId}:${asset.assetId}`);
    if (b402Asset === void 0) {
      throw new Error(
        `AssetId ${asset.assetId} is not available on B402 chain_id=${chainId}`
      );
    }
    return b402Asset;
  }
  byB402Address(chainId, inputAddress) {
    this.#requireChain(chainId);
    let address;
    try {
      address = getAddress(inputAddress);
    } catch (error) {
      throw new Error(
        `B402 asset address ${JSON.stringify(inputAddress)} is not registered on chain_id=${chainId}`,
        { cause: error }
      );
    }
    const asset = this.#activeB402ByAddress.get(
      `${chainId}:${address.toLowerCase()}`
    );
    if (asset === void 0) {
      throw new Error(
        `B402 asset address ${JSON.stringify(inputAddress)} is not registered on chain_id=${chainId}`
      );
    }
    return asset;
  }
  list(chainId) {
    this.#requireChain(chainId);
    const assets = this.#activeByChain.get(chainId);
    if (assets === void 0) {
      throw new Error(`no asset catalog registered for chain_id=${chainId}`);
    }
    return assets;
  }
};
var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
function validateAvailability(input, availability, address) {
  if (availability !== "active" && availability !== "placeholder") {
    throw new Error("unknown payment asset availability");
  }
  if (availability === "active") {
    if (address.toLowerCase() === ZERO_ADDRESS) {
      throw new Error("active asset cannot use zero address");
    }
    return;
  }
  if (address.toLowerCase() !== ZERO_ADDRESS) {
    throw new Error("placeholder asset must use zero address");
  }
  if (input.b402Methods.length > 0 || (input.b402Kinds?.length ?? 0) > 0) {
    throw new Error("placeholder asset cannot declare B402 methods");
  }
  if (input.eip3009Domain !== null) {
    throw new Error("placeholder asset cannot declare an EIP-3009 domain");
  }
  if (input.isDefault) {
    throw new Error("placeholder asset cannot be the default asset");
  }
}
var B402_TRANSFER_METHODS = /* @__PURE__ */ new Set([
  "eip3009",
  "permit2-exact"
]);
function validateB402Metadata(input) {
  const methods = input.b402Methods;
  if (new Set(methods).size !== methods.length) {
    throw new Error("duplicate B402 method in asset catalog");
  }
  if (methods.some((method) => !B402_TRANSFER_METHODS.has(method))) {
    throw new Error("unknown B402 method in asset catalog");
  }
  const kinds = input.b402Kinds ?? [];
  const kindMethods = kinds.map((kind) => kind.method);
  if (new Set(kindMethods).size !== kindMethods.length) {
    throw new Error("duplicate B402 kind identity in asset catalog");
  }
  if (kindMethods.some((method) => !B402_TRANSFER_METHODS.has(method))) {
    throw new Error("unknown B402 kind method in asset catalog");
  }
  if (kinds.some((kind) => kind.name.length === 0 || kind.version.length === 0)) {
    throw new Error("B402 kind name and version must be non-empty");
  }
  const missing = methods.find((method) => !kindMethods.includes(method));
  if (missing !== void 0) {
    throw new Error(`missing B402 kind identity for method=${missing}`);
  }
  const extra = kindMethods.find((method) => !methods.includes(method));
  if (extra !== void 0) {
    throw new Error(`extra B402 kind identity for method=${extra}`);
  }
  const eip3009Kind = kinds.find((kind) => kind.method === "eip3009");
  if (eip3009Kind === void 0) {
    if (input.eip3009Domain !== null) {
      throw new Error("EIP-3009 domain requires an eip3009 B402 method");
    }
  } else if (input.eip3009Domain === null || eip3009Kind.name !== input.eip3009Domain.name || eip3009Kind.version !== input.eip3009Domain.version) {
    throw new Error("EIP-3009 kind must match eip3009Domain exactly");
  }
  return kinds;
}
var EIP3009_DOMAIN = Object.freeze({
  name: PAYMENT_TOKEN_EIP712_NAME,
  version: PAYMENT_TOKEN_EIP712_VERSION
});
var TESTNET_U_EIP3009_DOMAIN = Object.freeze({
  name: "U",
  version: "1"
});
var ASSET_CATALOG = new AssetCatalog([
  {
    chainId: BSC_MAINNET_CHAIN_ID,
    assetId: AssetId.U,
    symbol: "U",
    address: "0xcE24439F2D9C6a2289F741120FE202248B666666",
    decimals: 18,
    b402Methods: ["eip3009", "permit2-exact"],
    b402Kinds: [
      { method: "eip3009", name: "United Stables", version: "1" },
      { method: "permit2-exact", name: "United Stables", version: "1" }
    ],
    eip3009Domain: EIP3009_DOMAIN,
    isDefault: true
  },
  {
    chainId: BSC_MAINNET_CHAIN_ID,
    assetId: AssetId.USD1,
    symbol: "USD1",
    address: "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d",
    decimals: 18,
    availability: "active",
    b402Methods: ["eip3009"],
    b402Kinds: [
      {
        method: "eip3009",
        name: "World Liberty Financial USD",
        version: "1"
      }
    ],
    eip3009Domain: { name: "World Liberty Financial USD", version: "1" },
    isDefault: false
  },
  {
    chainId: BSC_MAINNET_CHAIN_ID,
    assetId: AssetId.BINANCE_PEG_USDC,
    symbol: "USDC",
    address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    decimals: 18,
    b402Methods: ["permit2-exact"],
    b402Kinds: [{ method: "permit2-exact", name: "USD Coin", version: "1" }],
    eip3009Domain: null,
    isDefault: false
  },
  {
    chainId: BSC_MAINNET_CHAIN_ID,
    assetId: AssetId.BINANCE_PEG_USDT,
    symbol: "USDT",
    address: "0x55d398326f99059fF775485246999027B3197955",
    decimals: 18,
    b402Methods: ["permit2-exact"],
    b402Kinds: [{ method: "permit2-exact", name: "Tether USD", version: "1" }],
    eip3009Domain: null,
    isDefault: false
  },
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    assetId: AssetId.TEST_U,
    symbol: "U",
    address: "0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565",
    decimals: 18,
    b402Address: "0x330949Aed7d00FCe0558C64ED6FeC9792616cC39",
    b402Decimals: 6,
    b402Methods: ["eip3009"],
    b402Kinds: [{ method: "eip3009", name: "U", version: "1" }],
    eip3009Domain: TESTNET_U_EIP3009_DOMAIN,
    isDefault: true
  },
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    assetId: AssetId.TEST_USDC,
    symbol: "USDC",
    address: "0x64544969ed7EBf5f083679233325356EbE738930",
    decimals: 18,
    b402Address: "0xEC1C60D64a06896Df296438c12edD14E974FDE47",
    b402Decimals: 6,
    b402Methods: ["permit2-exact"],
    b402Kinds: [{ method: "permit2-exact", name: "USD Coin", version: "1" }],
    eip3009Domain: null,
    isDefault: false
  },
  {
    chainId: BSC_TESTNET_CHAIN_ID,
    assetId: AssetId.TEST_USDT,
    symbol: "USDT",
    address: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd",
    decimals: 18,
    b402Methods: ["permit2-exact"],
    b402Kinds: [{ method: "permit2-exact", name: "USDT Token", version: "1" }],
    eip3009Domain: null,
    isDefault: false
  }
]);
var ALIASES = Object.freeze({
  [BSC_MAINNET_CHAIN_ID]: Object.freeze({
    U: AssetId.U,
    USD1: AssetId.USD1,
    USDC: AssetId.BINANCE_PEG_USDC,
    USDT: AssetId.BINANCE_PEG_USDT
  }),
  [BSC_TESTNET_CHAIN_ID]: Object.freeze({
    U: AssetId.TEST_U,
    USDC: AssetId.TEST_USDC,
    USDT: AssetId.TEST_USDT
  })
});
function getAsset(chainId, assetId) {
  return ASSET_CATALOG.get(chainId, assetId);
}
function getAssetByAddress(chainId, address) {
  return ASSET_CATALOG.byAddress(chainId, address);
}
function getB402Asset(chainId, assetId) {
  return ASSET_CATALOG.getB402(chainId, assetId);
}
function getB402AssetByAddress(chainId, address) {
  return ASSET_CATALOG.byB402Address(chainId, address);
}
function listAssets(chainId) {
  return ASSET_CATALOG.list(chainId);
}
function knownEip3009PaymentTokens() {
  return new Set(
    [BSC_MAINNET_CHAIN_ID, BSC_TESTNET_CHAIN_ID].flatMap(
      (chainId) => listAssets(chainId).filter(
        (asset) => asset.eip3009Domain !== null && asset.b402Methods.includes("eip3009")
      ).map(
        (asset) => `${chainId}:${getB402Asset(chainId, asset.assetId).address}`
      )
    )
  );
}

// packages/bnb-sdk-lab/vendor/typescript/src/abis/agenticCommerce.ts
var agenticCommerceAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "BudgetMismatch",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpiryTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpiryTooShort",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FeeTooHigh",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "HookCallFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "HookMissingInterface",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "HookRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidJob",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProviderAlreadySet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ProviderNotSet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TokenHasNoCode",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnsupportedPaymentToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroBudget",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "BudgetSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "name": "JobCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "expiredAt",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "hook",
        "type": "address"
      }
    ],
    "name": "JobCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "JobExpired",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "JobFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "JobPaymentTokenBound",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "rejector",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "name": "JobRejected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "deliverable",
        "type": "bytes32"
      }
    ],
    "name": "JobSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "PaymentReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "supported",
        "type": "bool"
      }
    ],
    "name": "PaymentTokenSupportUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feeBP",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "treasury",
        "type": "address"
      }
    ],
    "name": "PlatformFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "provider",
        "type": "address"
      }
    ],
    "name": "ProviderSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Refunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "BP_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "HOOK_GAS_LIMIT",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_EXPIRY_DURATION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PLATFORM_FEE_BP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "complete",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "expiredAt",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "hook",
        "type": "address"
      }
    ],
    "name": "createJob",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "expiredAt",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "hook",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "createJobWithToken",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expectedBudget",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "fund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "getJob",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "client",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "provider",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "evaluator",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "budget",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiredAt",
            "type": "uint256"
          },
          {
            "internalType": "enum IACP.JobStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "address",
            "name": "hook",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "submittedAt",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "deliverable",
            "type": "bytes32"
          }
        ],
        "internalType": "struct IACP.Job",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "paymentToken_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner_",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "tokens",
        "type": "address[]"
      }
    ],
    "name": "initializeMultiToken",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isPaymentTokenSupported",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "jobCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "jobHasBudget",
    "outputs": [
      {
        "internalType": "bool",
        "name": "hasBudget",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "jobPaymentToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "jobs",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "provider",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "evaluator",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "budget",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiredAt",
        "type": "uint256"
      },
      {
        "internalType": "enum IACP.JobStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "hook",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "submittedAt",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "deliverable",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paymentToken",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeeBP",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformTreasury",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "reject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "setBudget",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "supported",
        "type": "bool"
      }
    ],
    "name": "setPaymentTokenSupported",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "feeBP_",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "treasury_",
        "type": "address"
      }
    ],
    "name": "setPlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "provider_",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "setProvider",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "deliverable",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "submit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// packages/bnb-sdk-lab/vendor/typescript/src/core/multicall.ts
var MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
var DEFAULT_BATCH_SIZE = 100;
async function multicallRead(client, opts) {
  const {
    address,
    abi: abi2,
    functionName,
    callArgsList,
    batchSize = DEFAULT_BATCH_SIZE,
    allowFailure = true
  } = opts;
  if (callArgsList.length === 0) {
    return [];
  }
  if (!abi2.some((item) => item.type === "function" && item.name === functionName)) {
    throw new Error(`Function ${functionName} not found in ABI`);
  }
  const results = [];
  for (let i = 0; i < callArgsList.length; i += batchSize) {
    const batch = callArgsList.slice(i, i + batchSize);
    const contracts = batch.map((args) => ({
      address,
      abi: abi2,
      functionName,
      args
    }));
    const batchResults = await callWithRetry(async () => {
      const result = await client.multicall({
        contracts,
        allowFailure: true,
        batchSize: 0,
        multicallAddress: MULTICALL3_ADDRESS
      });
      const rateLimited = result.find(
        (entry) => entry.status === "failure" && isRateLimitError(entry.error)
      );
      if (rateLimited && rateLimited.status === "failure") {
        throw rateLimited.error;
      }
      return result;
    });
    for (const entry of batchResults) {
      if (entry.status === "success") {
        results.push([true, entry.result]);
      } else if (allowFailure) {
        results.push([false, null]);
      } else {
        throw new Error(
          `multicallRead: call failed (allowFailure=false): ${describeError(entry.error)}`
        );
      }
    }
  }
  return results;
}
async function callWithRetry(fn) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error) && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_DELAY * 2 ** attempt * 1e3);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/types.ts
var REASON_APPROVED = keccakOfText(
  "OPTIMISTIC_APPROVED"
);
var REASON_REJECTED = keccakOfText(
  "OPTIMISTIC_REJECTED"
);
var ZERO_REASON = `0x${"00".repeat(32)}`;
var ZERO_ADDRESS2 = `0x${"00".repeat(20)}`;

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/commerce.ts
function decodeJob(raw) {
  return {
    id: raw.id,
    client: getAddress(raw.client),
    provider: getAddress(raw.provider),
    evaluator: getAddress(raw.evaluator),
    description: raw.description,
    budget: raw.budget,
    expiredAt: raw.expiredAt,
    status: raw.status,
    hook: getAddress(raw.hook),
    submittedAt: raw.submittedAt,
    deliverable: raw.deliverable
  };
}
function assertBytes32(value, label) {
  if (size(value) !== 32) {
    throw new Error(`${label} must be exactly 32 bytes`);
  }
}
var CommerceClient = class extends ContractBase {
  constructor(client, contractAddress, walletProvider, opts) {
    super({
      client,
      address: getAddress(contractAddress),
      abi: agenticCommerceAbi,
      walletProvider: walletProvider ?? null,
      paymaster: opts?.paymaster ?? null,
      receiptTimeout: opts?.receiptTimeout ?? null
    });
  }
  // ----------------------------------------------------------------- writes
  /** Try to recover the `jobId` assigned by `createJob` from the
   * `JobCreated` event in the transaction's receipt logs.
   *
   * Mirrors `self.contract.events.JobCreated().process_receipt(receipt)` in
   * `python/bnbagent/erc8183/commerce.py`, which is bound to this contract
   * instance and therefore only ever decodes logs (a) emitted by this
   * contract and (b) matching the `JobCreated` signature. viem's
   * `decodeEventLog` has neither binding: it happily decodes any log whose
   * topic0 matches *some* event in the ABI regardless of which contract
   * emitted it, and — since `eventName` is only a type hint, not a runtime
   * filter — it will decode e.g. a `JobFunded` log (which also carries a
   * `jobId`) as itself and hand back matching args instead of throwing. So
   * we filter by `log.address` first to avoid a same-topic0 log from an
   * unrelated contract, and check `decoded.eventName` to avoid mistaking a
   * different event (from this contract) that happens to share a `jobId`
   * field for `JobCreated`. */
  parseJobCreatedId(logs) {
    const address = this.address.toLowerCase();
    for (const log of logs) {
      if (log.address.toLowerCase() !== address) {
        continue;
      }
      try {
        const decoded = decodeEventLog({
          abi: agenticCommerceAbi,
          eventName: "JobCreated",
          data: log.data,
          topics: log.topics
        });
        if (decoded.eventName !== "JobCreated") {
          continue;
        }
        const jobId = decoded.args.jobId;
        if (jobId !== void 0) {
          return jobId;
        }
      } catch {
      }
    }
    return null;
  }
  recoverCreatedJobId(result) {
    let jobId = result.jobId ?? null;
    if (jobId == null && result.receipt) {
      jobId = this.parseJobCreatedId(result.receipt.logs);
    }
    return { ...result, jobId };
  }
  /** Create a new job (`Open` state). */
  async createJob(opts) {
    const hook = opts.hook ?? ZERO_ADDRESS2;
    const intent = {
      name: ERC8183_CREATE_JOB,
      kwargs: {
        provider: opts.provider,
        evaluator: opts.evaluator,
        expiredAt: opts.expiredAt,
        description: opts.description,
        hook
      },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "createJob",
        args: [
          getAddress(opts.provider),
          getAddress(opts.evaluator),
          opts.expiredAt,
          opts.description,
          getAddress(hook)
        ]
      },
      description: "create job"
    };
    return this.recoverCreatedJobId(await this.executeIntent(intent));
  }
  /** Create a new job bound to an explicitly selected payment token. */
  async createJobWithToken(opts) {
    const token = getAddress(opts.token);
    const hook = getAddress(opts.hook);
    const intent = {
      name: ERC8183_CREATE_JOB_WITH_TOKEN,
      kwargs: {
        provider: opts.provider,
        evaluator: opts.evaluator,
        expiredAt: opts.expiredAt,
        description: opts.description,
        hook: opts.hook,
        token
      },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "createJobWithToken",
        args: [
          getAddress(opts.provider),
          getAddress(opts.evaluator),
          opts.expiredAt,
          opts.description,
          hook,
          token
        ]
      },
      description: "create job with token"
    };
    return this.recoverCreatedJobId(await this.executeIntent(intent));
  }
  async setProvider(jobId, provider, optParams = "0x") {
    return this.executeIntent({
      name: ERC8183_SET_PROVIDER,
      kwargs: { jobId, provider, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "setProvider",
        args: [jobId, getAddress(provider), optParams]
      },
      description: "set provider"
    });
  }
  async setBudget(jobId, amount, optParams = "0x") {
    return this.executeIntent({
      name: ERC8183_SET_BUDGET,
      kwargs: { jobId, amount, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "setBudget",
        args: [jobId, amount, optParams]
      },
      description: "set budget"
    });
  }
  /** Deposit escrow. Caller MUST have approved `expectedBudget` first. */
  async fund(jobId, expectedBudget, optParams = "0x") {
    return this.executeIntent({
      name: ERC8183_FUND,
      kwargs: { jobId, expectedBudget, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "fund",
        args: [jobId, expectedBudget, optParams]
      },
      description: "fund job"
    });
  }
  async submit(jobId, deliverable, optParams = "0x") {
    assertBytes32(deliverable, "deliverable");
    return this.executeIntent({
      name: ERC8183_SUBMIT,
      kwargs: { jobId, deliverable, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "submit",
        args: [jobId, deliverable, optParams]
      },
      description: "submit deliverable"
    });
  }
  /** Evaluator-only. Routed jobs are completed via `RouterClient.settle`. */
  async complete(jobId, reason = ZERO_REASON, optParams = "0x") {
    assertBytes32(reason, "reason");
    return this.executeIntent({
      name: ERC8183_COMPLETE,
      kwargs: { jobId, reason, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "complete",
        args: [jobId, reason, optParams]
      },
      description: "complete job"
    });
  }
  /** Client (while Open) or evaluator (while Funded/Submitted). */
  async reject(jobId, reason = ZERO_REASON, optParams = "0x") {
    assertBytes32(reason, "reason");
    return this.executeIntent({
      name: ERC8183_REJECT,
      kwargs: { jobId, reason, optParams },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "reject",
        args: [jobId, reason, optParams]
      },
      description: "reject job"
    });
  }
  /** Permissionless refund path after `expiredAt`. Not pausable, no hook. */
  async claimRefund(jobId) {
    return this.executeIntent({
      name: ERC8183_CLAIM_REFUND,
      kwargs: { jobId },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "claimRefund",
        args: [jobId]
      },
      description: "claim refund"
    });
  }
  // ------------------------------------------------------------------ views
  async getJob(jobId) {
    const raw = await this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "getJob",
        args: [jobId]
      })
    );
    return decodeJob(raw);
  }
  async jobCounter() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "jobCounter"
      })
    );
  }
  async paymentToken() {
    return getAddress(
      await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: agenticCommerceAbi,
          functionName: "paymentToken"
        })
      )
    );
  }
  async jobPaymentToken(jobId) {
    return getAddress(
      await this.callWithRetry(
        () => this.client.readContract({
          address: this.address,
          abi: agenticCommerceAbi,
          functionName: "jobPaymentToken",
          args: [jobId]
        })
      )
    );
  }
  async isPaymentTokenSupported(token) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "isPaymentTokenSupported",
        args: [getAddress(token)]
      })
    );
  }
  async platformFeeBp() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "platformFeeBP"
      })
    );
  }
  async platformTreasury() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "platformTreasury"
      })
    );
  }
  async jobHasBudget(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: agenticCommerceAbi,
        functionName: "jobHasBudget",
        args: [jobId]
      })
    );
  }
  /** Batch read via Multicall3 — optional convenience for indexers. */
  async getJobsBatch(jobIds) {
    if (jobIds.length === 0) {
      return [];
    }
    const rawResults = await multicallRead(this.client, {
      address: this.address,
      abi: this.abi,
      functionName: "getJob",
      callArgsList: jobIds.map((jobId) => [jobId])
    });
    return rawResults.map(([success, decoded]) => {
      if (!success || !decoded) {
        return null;
      }
      try {
        return decodeJob(decoded);
      } catch {
        return null;
      }
    });
  }
  // --------------------------------------------------------- event helpers
  async getJobFundedEvents(fromBlock, toBlock = "latest", provider, jobId) {
    const args = {};
    if (provider) {
      args.provider = getAddress(provider);
    }
    if (jobId !== void 0) {
      args.jobId = jobId;
    }
    const logs = await this.readEvents({
      eventName: "JobFunded",
      fromBlock,
      toBlock,
      args: Object.keys(args).length > 0 ? args : void 0
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      client: log.args.client,
      provider: log.args.provider,
      amount: log.args.amount,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
  async getJobCreatedEvents(fromBlock, toBlock = "latest") {
    const logs = await this.readEvents({
      eventName: "JobCreated",
      fromBlock,
      toBlock
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      client: log.args.client,
      provider: log.args.provider,
      evaluator: log.args.evaluator,
      expiredAt: log.args.expiredAt,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
  /** `JobSubmitted(jobId, provider, deliverable)` events in a block range. */
  async getJobSubmittedEvents(fromBlock, toBlock = "latest", jobId) {
    const logs = await this.readEvents({
      eventName: "JobSubmitted",
      fromBlock,
      toBlock,
      args: jobId !== void 0 ? { jobId } : void 0
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      provider: log.args.provider,
      deliverable: log.args.deliverable,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/constants.ts
var ERC8183_ENV_PREFIX = "ERC8183_";
function resolveErc8183Network(network = "bsc-testnet") {
  const nc2 = resolveNetwork(network);
  if (typeof network !== "string") {
    return nc2;
  }
  return {
    ...nc2,
    commerceContract: getEnv("COMMERCE_ADDRESS", void 0, ERC8183_ENV_PREFIX) ?? nc2.commerceContract,
    routerContract: getEnv("ROUTER_ADDRESS", void 0, ERC8183_ENV_PREFIX) ?? nc2.routerContract,
    policyContract: getEnv("POLICY_ADDRESS", void 0, ERC8183_ENV_PREFIX) ?? nc2.policyContract
  };
}

// packages/bnb-sdk-lab/vendor/typescript/src/abis/optimisticPolicy.ts
var optimisticPolicyAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "commerce_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "router_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "admin_",
        "type": "address"
      },
      {
        "internalType": "uint64",
        "name": "disputeWindow_",
        "type": "uint64"
      },
      {
        "internalType": "uint16",
        "name": "initialQuorum_",
        "type": "uint16"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadyDisputed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyInitialised",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "AlreadyVoted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotClient",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotDisputed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPendingAdmin",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotRouter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotSubmitted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotVoter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OutsideDisputeWindow",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "QuorumOutOfRange",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "QuorumZero",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SubmissionTooLate",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UnknownVoter",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "VoterAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WouldBreakQuorum",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WrongJobStatus",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "pendingAdmin",
        "type": "address"
      }
    ],
    "name": "AdminTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "AdminTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      }
    ],
    "name": "Disputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "deliverable",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "submittedAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "JobInitialised",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "rejectVotes",
        "type": "uint16"
      }
    ],
    "name": "QuorumReached",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "oldQuorum",
        "type": "uint16"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "newQuorum",
        "type": "uint16"
      }
    ],
    "name": "QuorumUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "rejectVotes",
        "type": "uint16"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "activeVoterCount",
        "type": "uint16"
      }
    ],
    "name": "VoterAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "voter",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint16",
        "name": "activeVoterCount",
        "type": "uint16"
      }
    ],
    "name": "VoterRemoved",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "REASON_APPROVED",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "REASON_REJECTED",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeVoterCount",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "addVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "admin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "check",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "verdict",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "commerce",
    "outputs": [
      {
        "internalType": "contract IACP",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "dispute",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "disputeQuorumSnapshot",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "disputeWindow",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "disputed",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "hasVoted",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "isVoter",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "deliverable",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "optParams",
        "type": "bytes"
      }
    ],
    "name": "onSubmitted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingAdmin",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "rejectVotes",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "voter",
        "type": "address"
      }
    ],
    "name": "removeVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "router",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "newQuorum",
        "type": "uint16"
      }
    ],
    "name": "setQuorum",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "submittedAt",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      }
    ],
    "name": "transferAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "voteQuorum",
    "outputs": [
      {
        "internalType": "uint16",
        "name": "",
        "type": "uint16"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "voteReject",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/policy.ts
var TIGHT_WINDOW_BLOCKS = 10n;
var FALLBACK_WINDOW_BLOCKS = 1000n;
var PolicyClient = class extends ContractBase {
  constructor(client, contractAddress, walletProvider, opts) {
    super({
      client,
      address: getAddress(contractAddress),
      abi: optimisticPolicyAbi,
      walletProvider: walletProvider ?? null,
      paymaster: opts?.paymaster ?? null,
      receiptTimeout: opts?.receiptTimeout ?? null
    });
  }
  // ----------------------------------------------------------------- writes
  /** Client raises a dispute. MUST be within dispute window. */
  async dispute(jobId) {
    return this.executeIntent({
      name: ERC8183_DISPUTE,
      kwargs: { jobId },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "dispute",
        args: [jobId]
      },
      description: "dispute job"
    });
  }
  /** Whitelisted voter casts a reject vote (one per voter per job). */
  async voteReject(jobId) {
    return this.executeIntent({
      name: ERC8183_VOTE_REJECT,
      kwargs: { jobId },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "voteReject",
        args: [jobId]
      },
      description: "vote reject"
    });
  }
  // --------------------------------------------------------- admin writes
  /**
   * Owner-only admin op. Deliberately NOT run through the intent seam
   * (`executeIntent`) — always self-pays via `sendTx`.
   */
  async addVoter(voter) {
    return this.sendTx({
      functionName: "addVoter",
      args: [getAddress(voter)]
    });
  }
  /** Owner-only admin op. Deliberately NOT run through the intent seam. */
  async removeVoter(voter) {
    return this.sendTx({
      functionName: "removeVoter",
      args: [getAddress(voter)]
    });
  }
  /** Owner-only admin op. Deliberately NOT run through the intent seam. */
  async setQuorum(newQuorum) {
    return this.sendTx({
      functionName: "setQuorum",
      args: [newQuorum]
    });
  }
  // ------------------------------------------------------------------ views
  /** Simulate the verdict the Router would see right now. */
  async check(jobId, evidence = "0x") {
    const [verdict, reason] = await this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "check",
        args: [jobId, evidence]
      })
    );
    return [verdict, reason];
  }
  async submittedAt(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "submittedAt",
        args: [jobId]
      })
    );
  }
  async disputed(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "disputed",
        args: [jobId]
      })
    );
  }
  async rejectVotes(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "rejectVotes",
        args: [jobId]
      })
    );
  }
  async hasVoted(jobId, voter) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "hasVoted",
        args: [jobId, getAddress(voter)]
      })
    );
  }
  async isVoter(voter) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "isVoter",
        args: [getAddress(voter)]
      })
    );
  }
  async disputeWindow() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "disputeWindow"
      })
    );
  }
  async voteQuorum() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "voteQuorum"
      })
    );
  }
  /**
   * `voteQuorum` value snapshotted at `dispute()` time. Returns `0` if the
   * job has never been disputed. After `dispute`, the snapshot is the
   * threshold `check` will use, even if an admin later calls `setQuorum` —
   * protects pending disputes from retroactive admin adjustments.
   */
  async disputeQuorumSnapshot(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "disputeQuorumSnapshot",
        args: [jobId]
      })
    );
  }
  async activeVoterCount() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "activeVoterCount"
      })
    );
  }
  async admin() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "admin"
      })
    );
  }
  async commerce() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "commerce"
      })
    );
  }
  async router() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: optimisticPolicyAbi,
        functionName: "router"
      })
    );
  }
  /**
   * Return the `deliverable_url` for a submitted job.
   *
   * Reads the `JobInitialised` event emitted by `onSubmitted` and parses
   * `optParams` (JSON bytes) to extract `deliverable_url`. Returns it only
   * when it is a non-empty string; `null` when the event is not found
   * (unless `requireLog`) or carries no usable `deliverable_url`, which is
   * up to the provider. A failed log query is not proof of absence: it
   * throws {@link RpcRangeLimitError} for a rate/range limit (`-32005`) and
   * {@link NetworkError} otherwise, both retryable.
   *
   * Prefer calling the ERC8183 facade's `getDeliverableUrl`, which
   * auto-resolves `hintBlock` from the job's `submittedAt`. If called
   * directly without `hintBlock`, a 1000-block fallback window is used.
   */
  async getDeliverableUrl(jobId, opts) {
    let currentBlock = null;
    try {
      currentBlock = await this.client.getBlockNumber();
    } catch {
      currentBlock = null;
    }
    let fromBlock;
    let toBlock;
    if (opts?.hintBlock !== void 0) {
      const hint = opts.hintBlock;
      fromBlock = hint > TIGHT_WINDOW_BLOCKS ? hint - TIGHT_WINDOW_BLOCKS : 0n;
      toBlock = hint + TIGHT_WINDOW_BLOCKS;
    } else if (currentBlock !== null) {
      fromBlock = currentBlock > FALLBACK_WINDOW_BLOCKS ? currentBlock - FALLBACK_WINDOW_BLOCKS : 0n;
      toBlock = "latest";
    } else {
      throw new RpcRangeLimitError(
        "Cannot bound deliverable query without a block height"
      );
    }
    let logs;
    try {
      logs = await this.readEvents({
        eventName: "JobInitialised",
        fromBlock,
        toBlock,
        args: { jobId }
      });
    } catch (error) {
      const message = describeError(error);
      if (message.includes("-32005") || message.toLowerCase().includes("limit exceeded")) {
        throw new RpcRangeLimitError(
          `JobInitialised scan for job ${jobId} hit the RPC range/rate limit; retry later`
        );
      }
      throw Object.assign(
        new NetworkError(
          `JobInitialised scan for job ${jobId} failed; retry later`
        ),
        { cause: error }
      );
    }
    if (logs.length === 0) {
      if (opts?.requireLog) {
        throw new NetworkError(
          `no JobInitialised log for submitted job ${jobId} in blocks ${fromBlock}..${toBlock}: the RPC returned an incomplete result; retry later`
        );
      }
      return null;
    }
    const raw = logs[0]?.args.optParams;
    if (!raw || raw === "0x") {
      return null;
    }
    let params;
    try {
      params = JSON.parse(hexToString(raw));
    } catch (error) {
      console.warn(
        `[PolicyClient] getDeliverableUrl(${jobId}) parse failed: ${describeError(error)}`
      );
      return null;
    }
    const url = params !== null && typeof params === "object" ? params.deliverable_url : void 0;
    return typeof url === "string" && url.length > 0 ? url : null;
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/negotiation.ts
function sanitizeForClaim(s) {
  if (typeof s !== "string") {
    return String(s);
  }
  let result = s.replaceAll("[", "(").replaceAll("]", ")");
  let out = "";
  for (const ch of result) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 32 || ch === "	" || ch === "\n") {
      out += ch;
    }
  }
  result = out;
  return result;
}
function buildDescriptionContent(negotiationResult, chainId, verifyingContract) {
  const response = negotiationResult.response ?? {};
  const request = negotiationResult.request ?? {};
  if (!response.accepted) {
    throw new Error("Cannot build description from a rejected negotiation");
  }
  const responseTerms = response.terms ?? {};
  const price = responseTerms.price || "";
  const currency = responseTerms.currency || "";
  if (!price) {
    throw new Error("Negotiation response missing price");
  }
  if (!currency) {
    throw new Error("Negotiation response missing currency");
  }
  const terms = {
    deliverables: sanitizeForClaim(
      responseTerms.deliverables ?? ""
    ),
    quality_standards: sanitizeForClaim(
      responseTerms.quality_standards ?? ""
    )
  };
  const successCriteria = responseTerms.success_criteria;
  if (successCriteria && successCriteria.length > 0) {
    terms.success_criteria = successCriteria.map((c) => sanitizeForClaim(c));
  }
  const negotiatedAt = negotiationResult.negotiated_at || response.negotiated_at || Math.floor(Date.now() / 1e3);
  const quoteExpiresAt2 = negotiationResult.quote_expires_at || response.quote_expires_at;
  const content = {
    version: 1,
    negotiated_at: negotiatedAt,
    task: sanitizeForClaim(
      request.task_description ?? ""
    ),
    terms,
    price,
    currency
  };
  if (quoteExpiresAt2 !== void 0 && quoteExpiresAt2 !== null) {
    content.quote_expires_at = quoteExpiresAt2;
  }
  if (chainId !== void 0 && chainId !== null) {
    content.chain_id = chainId;
  }
  if (verifyingContract !== void 0 && verifyingContract !== null) {
    content.verifying_contract = getAddress(verifyingContract);
  }
  return content;
}

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/quoteVerify.ts
var ERC1271_MAGIC_VALUE = "0x1626ba7e";
var ERC1271_ABI = parseAbi([
  "function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)"
]);
var HASH_HEX = /^0x[0-9a-fA-F]{64}$/;
var SIGNATURE_HEX = /^0x(?:[0-9a-fA-F]{2})+$/;
function signedContent(envelope) {
  if (envelope.response !== null && typeof envelope.response === "object" && !Array.isArray(envelope.response)) {
    return buildDescriptionContent(
      envelope,
      envelope.chain_id ?? null,
      envelope.verifying_contract ?? null
    );
  }
  return Object.fromEntries(
    Object.entries(envelope).filter(
      ([key]) => key !== "negotiation_hash" && key !== "provider_sig"
    )
  );
}
function quoteExpiresAt(envelope) {
  if (envelope.response !== null && typeof envelope.response === "object" && !Array.isArray(envelope.response)) {
    return envelope.quote_expires_at || envelope.response.quote_expires_at;
  }
  return envelope.quote_expires_at;
}
function quoteContentError(envelope) {
  try {
    const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
    if ("request" in envelope && !object(envelope.request))
      return "invalid quote content";
    if ("response" in envelope && (!object(envelope.response) || !object(envelope.response.terms)))
      return "invalid quote content";
    if (keccakOfText(canonicalJson(signedContent(envelope))).toLowerCase() !== String(envelope.negotiation_hash).toLowerCase())
      return "negotiation_hash mismatch";
    if (typeof envelope.provider_sig !== "string" || !SIGNATURE_HEX.test(envelope.provider_sig))
      return "missing or invalid provider_sig";
  } catch {
    return "invalid quote content";
  }
  return null;
}
async function verifyQuoteSignature(opts) {
  const negotiationHash = opts.envelope.negotiation_hash;
  const providerSig = opts.envelope.provider_sig;
  if (typeof negotiationHash !== "string" || !HASH_HEX.test(negotiationHash)) {
    return { valid: false, reason: "missing or invalid negotiation_hash" };
  }
  if (typeof providerSig !== "string" || !SIGNATURE_HEX.test(providerSig)) {
    return { valid: false, reason: "missing or invalid provider_sig" };
  }
  const signedVerifyingContract = opts.envelope.verifying_contract;
  let checker;
  if (signedVerifyingContract !== void 0 && signedVerifyingContract !== null) {
    if (typeof signedVerifyingContract !== "string") {
      return { valid: false, reason: "invalid verifying_contract" };
    }
    try {
      checker = getAddress(signedVerifyingContract);
    } catch {
      return { valid: false, reason: "invalid verifying_contract" };
    }
  }
  if (opts.expectedVerifyingContract) {
    if (!checker) {
      return {
        valid: false,
        reason: "quote is not bound to a verifying_contract"
      };
    }
    if (checker !== getAddress(opts.expectedVerifyingContract)) {
      return { valid: false, reason: "verifying_contract mismatch" };
    }
  }
  const signedChainId = opts.envelope.chain_id;
  if (signedChainId !== void 0 && signedChainId !== null) {
    if (typeof signedChainId !== "number" || !Number.isSafeInteger(signedChainId) || signedChainId <= 0) {
      return { valid: false, reason: "invalid chain_id" };
    }
    if (await opts.publicClient.getChainId() !== signedChainId) {
      return { valid: false, reason: "chain_id mismatch" };
    }
  }
  const contentError = quoteContentError(opts.envelope);
  if (contentError) return { valid: false, reason: contentError };
  const content = signedContent(opts.envelope);
  const expiry = quoteExpiresAt(opts.envelope);
  if (expiry !== void 0 && expiry !== null) {
    if (typeof expiry !== "number" || !Number.isSafeInteger(expiry)) {
      return { valid: false, reason: "invalid quote_expires_at" };
    }
    const verificationBlock = opts.blockNumber === void 0 ? await opts.publicClient.getBlock() : await opts.publicClient.getBlock({ blockNumber: opts.blockNumber });
    if (BigInt(expiry) <= verificationBlock.timestamp) {
      return { valid: false, reason: "quote has expired" };
    }
  }
  const provider = getAddress(opts.provider);
  try {
    const recovered = await recoverMessageAddress({
      message: negotiationHash,
      signature: providerSig
    });
    if (recovered === provider) {
      return {
        valid: true,
        method: "eip191",
        signer: recovered,
        signedContent: content
      };
    }
  } catch {
  }
  const block = opts.blockNumber === void 0 ? {} : { blockNumber: opts.blockNumber };
  const bytecode = await opts.publicClient.getBytecode({
    address: provider,
    ...block
  });
  if (!bytecode || bytecode === "0x") {
    return { valid: false, reason: "provider signature is not valid" };
  }
  let result;
  try {
    result = await opts.publicClient.readContract({
      address: provider,
      abi: ERC1271_ABI,
      functionName: "isValidSignature",
      args: [hashMessage(negotiationHash), providerSig],
      ...checker ? { account: checker } : {},
      ...block
    });
  } catch (error) {
    const rejection = error instanceof BaseError2 ? error.walk(
      (cause) => cause instanceof ContractFunctionRevertedError || cause instanceof ContractFunctionZeroDataError
    ) : error;
    if (rejection instanceof ContractFunctionRevertedError || rejection instanceof ContractFunctionZeroDataError) {
      return { valid: false, reason: "ERC-1271 account rejected provider_sig" };
    }
    throw error;
  }
  if (String(result).toLowerCase() !== ERC1271_MAGIC_VALUE) {
    return { valid: false, reason: "ERC-1271 account rejected provider_sig" };
  }
  return {
    valid: true,
    method: "erc1271",
    signer: provider,
    signedContent: content
  };
}

// packages/bnb-sdk-lab/vendor/typescript/src/abis/evaluatorRouter.ts
var evaluatorRouterAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "target",
        "type": "address"
      }
    ],
    "name": "AddressEmptyCode",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "ERC1967InvalidImplementation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ERC1967NonPayable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FailedCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "HasInflightJobs",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidInitialization",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "JobNotOpen",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotCommerce",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotDecided",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotInitializing",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotJobClient",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPaused",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyAlreadySet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyNotSet",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PolicyNotWhitelisted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RouterNotEvaluator",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RouterNotHook",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "UUPSUnauthorizedCallContext",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "slot",
        "type": "bytes32"
      }
    ],
    "name": "UUPSUnsupportedProxiableUUID",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "verdict",
        "type": "uint8"
      }
    ],
    "name": "UnknownVerdict",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroAddress",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldCommerce",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newCommerce",
        "type": "address"
      }
    ],
    "name": "CommerceSet",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "version",
        "type": "uint64"
      }
    ],
    "name": "Initialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "enum IACP.JobStatus",
        "name": "status",
        "type": "uint8"
      }
    ],
    "name": "JobFinalised",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "policy",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "client",
        "type": "address"
      }
    ],
    "name": "JobRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "policy",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint8",
        "name": "verdict",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "reason",
        "type": "bytes32"
      }
    ],
    "name": "JobSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "policy",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "PolicyWhitelisted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "implementation",
        "type": "address"
      }
    ],
    "name": "Upgraded",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "UPGRADE_INTERFACE_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes4",
        "name": "selector",
        "type": "bytes4"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "afterAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes4",
        "name": "selector",
        "type": "bytes4"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "beforeAction",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "commerce",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "inflightJobCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "commerce_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner_",
        "type": "address"
      }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "jobPolicy",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      }
    ],
    "name": "markExpired",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "policy",
        "type": "address"
      }
    ],
    "name": "policyWhitelist",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proxiableUUID",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "policy",
        "type": "address"
      }
    ],
    "name": "registerJob",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newCommerce",
        "type": "address"
      }
    ],
    "name": "setCommerce",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "policy",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "status",
        "type": "bool"
      }
    ],
    "name": "setPolicyWhitelist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "jobId",
        "type": "uint256"
      },
      {
        "internalType": "bytes",
        "name": "evidence",
        "type": "bytes"
      }
    ],
    "name": "settle",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newImplementation",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      }
    ],
    "name": "upgradeToAndCall",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/router.ts
var RouterClient = class extends ContractBase {
  constructor(client, contractAddress, walletProvider, opts) {
    super({
      client,
      address: getAddress(contractAddress),
      abi: evaluatorRouterAbi,
      walletProvider: walletProvider ?? null,
      paymaster: opts?.paymaster ?? null,
      receiptTimeout: opts?.receiptTimeout ?? null
    });
  }
  // ----------------------------------------------------------------- writes
  /** Bind `policy` to `jobId`. Client-only, Open-only, single-shot. */
  async registerJob(jobId, policy) {
    return this.executeIntent({
      name: ERC8183_REGISTER_JOB,
      kwargs: { jobId, policy },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "registerJob",
        args: [jobId, getAddress(policy)]
      },
      description: "register job"
    });
  }
  /** Permissionless: pull the policy verdict and apply it to the kernel. */
  async settle(jobId, evidence = "0x") {
    return this.executeIntent({
      name: ERC8183_SETTLE,
      kwargs: { jobId, evidence },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "settle",
        args: [jobId, evidence]
      },
      description: "settle job"
    });
  }
  /**
   * Permissionless: reconcile the in-flight counter for a job that exited
   * via `claimRefund` (which has no hook). Reverts `NotExpired` if the job
   * is still live, `WrongStatus` if it never reached an expirable state.
   */
  async markExpired(jobId) {
    return this.executeIntent({
      name: ERC8183_MARK_EXPIRED,
      kwargs: { jobId },
      call: {
        address: this.address,
        abi: this.abi,
        functionName: "markExpired",
        args: [jobId]
      },
      description: "mark expired"
    });
  }
  // ------------------------------------------------------------------ views
  async commerce() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: evaluatorRouterAbi,
        functionName: "commerce"
      })
    );
  }
  /** Number of jobs registered but not yet finalised. */
  async inflightJobCount() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: evaluatorRouterAbi,
        functionName: "inflightJobCount"
      })
    );
  }
  async jobPolicy(jobId) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: evaluatorRouterAbi,
        functionName: "jobPolicy",
        args: [jobId]
      })
    );
  }
  async policyWhitelist(policy) {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: evaluatorRouterAbi,
        functionName: "policyWhitelist",
        args: [getAddress(policy)]
      })
    );
  }
  async paused() {
    return this.callWithRetry(
      () => this.client.readContract({
        address: this.address,
        abi: evaluatorRouterAbi,
        functionName: "paused"
      })
    );
  }
  // ------------------------------------------------------------ event helpers
  async getJobRegisteredEvents(fromBlock, toBlock = "latest", client) {
    const logs = await this.readEvents({
      eventName: "JobRegistered",
      fromBlock,
      toBlock,
      args: client ? { client: getAddress(client) } : void 0
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      policy: log.args.policy,
      client: log.args.client,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
  async getJobSettledEvents(fromBlock, toBlock = "latest", verdict) {
    const logs = await this.readEvents({
      eventName: "JobSettled",
      fromBlock,
      toBlock,
      args: verdict !== void 0 ? { verdict } : void 0
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      verdict: Number(log.args.verdict),
      reason: log.args.reason,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
  /**
   * `JobFinalised(jobId, status)` — emitted whenever the in-flight counter
   * is decremented (kernel `afterAction` for complete/reject, or
   * `markExpired`). Useful for off-chain reconciliation.
   */
  async getJobFinalisedEvents(fromBlock, toBlock = "latest", status) {
    const logs = await this.readEvents({
      eventName: "JobFinalised",
      fromBlock,
      toBlock,
      args: status !== void 0 ? { status } : void 0
    });
    return logs.map((log) => ({
      jobId: log.args.jobId,
      status: Number(log.args.status),
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash
    }));
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/erc8183/client.ts
var ERC8183_PAYMASTER_CHAIN_IDS = /* @__PURE__ */ new Set([97]);
var REQUIRED_NETWORK_FIELDS = [
  ["commerce_contract", "commerceContract"],
  ["router_contract", "routerContract"],
  ["policy_contract", "policyContract"]
];
var ERC8183Client = class _ERC8183Client {
  commerce;
  router;
  policy;
  address;
  network;
  client;
  walletProvider;
  debug;
  // Cached token state (populated lazily and keyed by checksum address).
  paymentTokenAddress = null;
  erc20Clients = /* @__PURE__ */ new Map();
  tokenDecimalsCache = /* @__PURE__ */ new Map();
  tokenSymbolsCache = /* @__PURE__ */ new Map();
  tokenMetadataCache = /* @__PURE__ */ new Map();
  constructor(opts) {
    this.client = opts.client;
    this.network = opts.network;
    this.walletProvider = opts.walletProvider;
    this.debug = opts.debug;
    this.commerce = opts.commerce;
    this.router = opts.router;
    this.policy = opts.policy;
    this.address = opts.walletProvider?.address ?? null;
  }
  /**
   * Create an `ERC8183Client`.
   *
   * A string `network` resolves through the ERC-8183 env overlay
   * (`ERC8183_*_ADDRESS` overrides apply — how a QA/staging stack is
   * targeted); a concrete `NetworkConfig` is used as-is.
   *
   * Connects to the network's RPC and asserts its `chain_id` matches the
   * resolved network config (defense-in-depth against a misconfigured or
   * maliciously redirected RPC URL) before returning.
   *
   * @throws {Error} if the network is missing any of the three ERC-8183
   *   contract addresses, the RPC is unreachable, or the RPC's chain_id
   *   does not match the expected network.
   */
  static async create(opts = {}) {
    const walletProvider = opts.walletProvider ?? null;
    const network = opts.network ?? "bsc-testnet";
    const debug = opts.debug ?? false;
    const nc2 = resolveErc8183Network(network);
    for (const [fieldName, key] of REQUIRED_NETWORK_FIELDS) {
      if (!nc2[key]) {
        throw new Error(
          `network '${nc2.name}' is missing ${fieldName}; pass a NetworkConfig with all three ERC-8183 addresses set.`
        );
      }
    }
    const client = createPublicClientFor(nc2.rpcUrl);
    let actualChainId;
    try {
      actualChainId = await client.getChainId();
    } catch (error) {
      throw new Error(
        `Failed to connect to RPC: ${nc2.rpcUrl} (${describeError(error)})`,
        { cause: error }
      );
    }
    if (actualChainId !== nc2.chainId) {
      throw new Error(
        `RPC chain_id mismatch for network '${nc2.name}': expected ${nc2.chainId}, got ${actualChainId}. The RPC at ${nc2.rpcUrl} is serving a different chain.`
      );
    }
    const paymaster = _ERC8183Client.buildPaymaster(nc2, debug);
    const commerce = new CommerceClient(
      client,
      nc2.commerceContract,
      walletProvider,
      { paymaster }
    );
    const router = new RouterClient(client, nc2.routerContract, walletProvider, {
      paymaster
    });
    const policy = new PolicyClient(client, nc2.policyContract, walletProvider, {
      paymaster
    });
    return new _ERC8183Client({
      client,
      network: nc2,
      walletProvider,
      debug,
      commerce,
      router,
      policy
    });
  }
  /**
   * Return a `Paymaster` for ERC-8183 writes, or `null` to self-pay.
   *
   * Built only when the network enables a paymaster AND its chain is one
   * MegaFuel sponsors ERC-8183 on ({@link ERC8183_PAYMASTER_CHAIN_IDS}). On
   * every other network — notably bsc-mainnet — this returns `null` so
   * writes self-pay without ever probing `isSponsorable`.
   *
   * Note: the ERC-20 `approve` inside {@link fund} runs through the ERC-20
   * client's own self-pay path and is not sponsored here.
   */
  static buildPaymaster(nc2, debug) {
    if (nc2.usePaymaster && nc2.paymasterUrl && ERC8183_PAYMASTER_CHAIN_IDS.has(nc2.chainId)) {
      return new Paymaster(nc2.paymasterUrl, debug);
    }
    return null;
  }
  // ------------------------------------------------------------ token cache
  /** Payment token address (cached forever). Fetched from `commerce.paymentToken`. */
  async paymentToken() {
    if (this.paymentTokenAddress === null) {
      this.paymentTokenAddress = getAddress(await this.commerce.paymentToken());
    }
    return this.paymentTokenAddress;
  }
  resolveTokenAddress(token) {
    if (typeof token !== "string") {
      throw new TypeError("token must be a canonical AssetId or address");
    }
    if (isAddress(token)) {
      return getAddress(token);
    }
    return getAsset(this.network.chainId, parseAssetId(token)).address;
  }
  resolveJobCreationToken(token) {
    const address = this.resolveTokenAddress(token);
    try {
      listAssets(this.network.chainId);
    } catch {
      return address;
    }
    return getAssetByAddress(this.network.chainId, address).address;
  }
  async erc20Client(token) {
    const address = token === void 0 ? await this.paymentToken() : this.resolveTokenAddress(token);
    let erc20 = this.erc20Clients.get(address);
    if (!erc20) {
      erc20 = new MinimalERC20Client(this.client, address, this.walletProvider);
      this.erc20Clients.set(address, erc20);
    }
    return erc20;
  }
  async tokenMetadata(token) {
    const address = this.resolveTokenAddress(token);
    let metadata = this.tokenMetadataCache.get(address);
    if (!metadata) {
      metadata = Object.freeze({
        address,
        decimals: await this.tokenDecimals(address),
        symbol: await this.tokenSymbol(address)
      });
      this.tokenMetadataCache.set(address, metadata);
    }
    return metadata;
  }
  async tokenDecimals(token) {
    const address = token === void 0 ? await this.paymentToken() : this.resolveTokenAddress(token);
    let decimals = this.tokenDecimalsCache.get(address);
    if (decimals === void 0) {
      decimals = await (await this.erc20Client(address)).decimals();
      this.tokenDecimalsCache.set(address, decimals);
    }
    return decimals;
  }
  async tokenSymbol(token) {
    const address = token === void 0 ? await this.paymentToken() : this.resolveTokenAddress(token);
    let symbol = this.tokenSymbolsCache.get(address);
    if (symbol === void 0) {
      symbol = await (await this.erc20Client(address)).symbol();
      this.tokenSymbolsCache.set(address, symbol);
    }
    return symbol;
  }
  async tokenBalanceFor(token, address) {
    return (await this.erc20Client(token)).balanceOf(
      address ?? this.address ?? ""
    );
  }
  async tokenAllowanceFor(token, owner, spender) {
    return (await this.erc20Client(token)).allowance(owner, spender);
  }
  async approveToken(token, spender, amount) {
    return (await this.erc20Client(token)).approve(spender, amount);
  }
  async tokenBalance(address) {
    return this.tokenBalanceFor(await this.paymentToken(), address);
  }
  async tokenAllowance(owner, spender) {
    return this.tokenAllowanceFor(await this.paymentToken(), owner, spender);
  }
  /** Send `approve(spender, amount)` on the payment token. */
  async approvePaymentToken(spender, amount) {
    return this.approveToken(await this.paymentToken(), spender, amount);
  }
  /**
   * Verify a provider quote before creating or funding a job.
   *
   * Explicit asset selection binds request, response and expected token. The
   * compatibility path without `expectedCurrency` still checks the Commerce
   * default token. Signature, chain and Commerce bindings remain mandatory.
   */
  async verifyNegotiationQuote(envelope, opts) {
    const response = envelope.response;
    if (response === null || typeof response !== "object" || Array.isArray(response)) {
      return { valid: false, reason: "quote response is missing" };
    }
    const responseRecord = response;
    if (responseRecord.accepted !== true) {
      return { valid: false, reason: "quote is not accepted" };
    }
    const terms = responseRecord.terms;
    if (terms === null || typeof terms !== "object" || Array.isArray(terms)) {
      return { valid: false, reason: "quote terms are missing" };
    }
    const termsRecord = terms;
    const price = termsRecord.price;
    if (typeof price !== "string" || !/^(0|[1-9][0-9]*)$/.test(price)) {
      return {
        valid: false,
        reason: "quote price must be a non-negative integer"
      };
    }
    let expectedAddress;
    let responseCurrency;
    try {
      expectedAddress = opts.expectedCurrency === void 0 ? await this.paymentToken() : this.resolveTokenAddress(opts.expectedCurrency);
      if (typeof termsRecord.currency !== "string") throw new Error();
      responseCurrency = getAddress(termsRecord.currency);
    } catch {
      return { valid: false, reason: "quote currency is invalid" };
    }
    if (responseCurrency !== expectedAddress) {
      return {
        valid: false,
        reason: opts.expectedCurrency === void 0 ? "quote currency does not match payment token" : "quote response currency mismatch"
      };
    }
    const request = envelope.request;
    const requestTerms = request !== null && typeof request === "object" && !Array.isArray(request) ? request.terms : void 0;
    const requestCurrency = requestTerms !== null && typeof requestTerms === "object" && !Array.isArray(requestTerms) ? requestTerms.currency : void 0;
    if (opts.expectedCurrency !== void 0 && requestCurrency === void 0) {
      return { valid: false, reason: "quote request currency is missing" };
    }
    if (requestCurrency !== void 0) {
      try {
        if (typeof requestCurrency !== "string" || this.resolveTokenAddress(requestCurrency) !== expectedAddress) {
          return { valid: false, reason: "quote request currency mismatch" };
        }
      } catch {
        return { valid: false, reason: "quote request currency is invalid" };
      }
    }
    if (envelope.chain_id !== this.network.chainId) {
      return { valid: false, reason: "quote chain_id mismatch" };
    }
    return verifyQuoteSignature({
      envelope,
      provider: getAddress(opts.expectedProvider),
      publicClient: this.client,
      expectedVerifyingContract: this.commerce.address,
      blockNumber: opts.blockNumber
    });
  }
  // ----------------------------------------------------------------- writes
  /**
   * Create a job with the Router set as evaluator + hook.
   *
   * Parameters mirror `AgenticCommerceUpgradeable.createJob` except
   * `evaluator` / `hook` default to the Router address (the v1 deployment
   * pattern).
   *
   * Pre-flights `expiredAt` against the bound policy's `disputeWindow` to
   * catch the foot-gun where the SDK lets you fund a job that `submit()`
   * will always revert with `SubmissionTooLate()` — see
   * https://github.com/bnb-chain/bnbagent-sdk/issues/41 for details.
   *
   * Pass `skipExpiryCheck: true` to bypass the validation (e.g. for tests
   * that intentionally exercise the revert path).
   */
  async createJob(opts) {
    const {
      provider = ZERO_ADDRESS2,
      expiredAt,
      description = "",
      hook,
      skipExpiryCheck = false
    } = opts;
    await this.validateExpiry(expiredAt, skipExpiryCheck);
    return this.commerce.createJob({
      provider,
      evaluator: this.router.address,
      expiredAt,
      description,
      hook: hook ?? this.router.address
    });
  }
  /** Create a routed job bound to a canonical asset or catalog address. */
  async createJobWithToken(opts) {
    const {
      asset,
      provider = ZERO_ADDRESS2,
      expiredAt,
      description = "",
      hook,
      skipExpiryCheck = false
    } = opts;
    const token = this.resolveJobCreationToken(asset);
    await this.validateExpiry(expiredAt, skipExpiryCheck);
    return this.commerce.createJobWithToken({
      provider,
      evaluator: this.router.address,
      expiredAt,
      description,
      hook: hook ?? this.router.address,
      token
    });
  }
  async validateExpiry(expiredAt, skipExpiryCheck) {
    if (skipExpiryCheck) return;
    let disputeWindow = null;
    try {
      disputeWindow = await this.policy.disputeWindow();
    } catch (error) {
      console.warn(
        `[ERC8183Client] dispute_window pre-flight failed; create_job proceeding without expiry check: ${describeError(error)}`
      );
    }
    if (disputeWindow !== null) {
      const now = BigInt(Math.floor(Date.now() / 1e3));
      if (expiredAt - now <= disputeWindow) {
        const days = (Number(disputeWindow) / 86400).toFixed(1);
        throw new Error(
          `expired_at (${expiredAt}) is too close to now (${now}). OptimisticPolicy on this network has dispute_window=${disputeWindow}s (${days}d), so the submit deadline (expired_at - dispute_window = ${expiredAt - disputeWindow}) is already in the past or within seconds. provider.submit() would revert with SubmissionTooLate(). Set expired_at >= now + dispute_window + a buffer (e.g. now + ${disputeWindow + 86400n}). Pass skipExpiryCheck=true to bypass this guard.`
        );
      }
    }
  }
  /** Bind the configured policy (or an override) to a job on the Router. */
  async registerJob(jobId, policy) {
    return this.router.registerJob(jobId, policy ?? this.policy.address);
  }
  async setProvider(jobId, provider) {
    return this.commerce.setProvider(jobId, provider);
  }
  async setBudget(jobId, amount) {
    return this.commerce.setBudget(jobId, amount);
  }
  /**
   * Fund a job using its authoritative on-chain payment token.
   *
   * The job token is read before any allowance or approval action. When
   * `expectedToken` is provided, a mismatch raises
   * {@link JobPaymentTokenMismatchError} before funds can move. Missing
   * allowance is approved for exactly `amount` by default; `approveFloor`
   * remains an explicit legacy opt-in.
   *
   * A self-broadcasting backend that owns the allowance lifecycle sets
   * `walletProvider.fundBundlesApproval` to the literal `true` to skip the
   * SDK-side allowance management entirely. The backend may bundle approval
   * or require a trusted admin to pre-provision it.
   */
  async fund(jobId, amount, opts) {
    if (typeof amount !== "bigint") {
      throw new TypeError("amount must be a bigint");
    }
    if (amount < 0n) {
      throw new Error("amount must be >= 0");
    }
    if (opts?.approveFloor !== void 0 && typeof opts.approveFloor !== "bigint") {
      throw new TypeError("approve_floor must be a bigint");
    }
    if (opts?.approveFloor !== void 0 && opts.approveFloor < 0n) {
      throw new Error("approve_floor must be >= 0");
    }
    if (this.walletProvider === null || this.address === null) {
      throw new Error(READ_ONLY_MESSAGE);
    }
    const actualToken = await this.jobPaymentToken(jobId);
    if (opts?.expectedToken !== void 0) {
      const expectedToken = this.resolveTokenAddress(opts.expectedToken);
      if (expectedToken !== actualToken) {
        throw new JobPaymentTokenMismatchError(
          jobId,
          expectedToken,
          actualToken
        );
      }
    }
    if (amount === 0n) {
      return this.commerce.fund(jobId, amount);
    }
    if (this.walletProvider.fundBundlesApproval === true) {
      return this.commerce.fund(jobId, amount);
    }
    const owner = this.address;
    const current = await this.tokenAllowanceFor(
      actualToken,
      owner,
      this.commerce.address
    );
    if (current < amount) {
      const floor = opts?.approveFloor;
      const cap = floor === void 0 || amount > floor ? amount : floor;
      await this.approveToken(actualToken, this.commerce.address, cap);
    }
    return this.commerce.fund(jobId, amount);
  }
  /**
   * Provider submits.
   *
   * `deliverable` is `DeliverableManifest.manifestHash()` — the keccak256
   * of the canonical manifest JSON (32 bytes). Stored on-chain as the
   * ERC-8183 `deliverable` field (bytes32).
   *
   * `optParams` is serialised to canonical JSON UTF-8 bytes and stored
   * on-chain as `optParams`. Must contain `deliverable_url` (the URL where
   * the full manifest JSON can be fetched for verification).
   */
  async submit(jobId, deliverable, optParams) {
    if (!optParams.deliverable_url) {
      throw new Error(
        "opt_params['deliverable_url'] must be a non-empty URL (storage URL or agent HTTP endpoint)"
      );
    }
    const encoded = stringToHex(canonicalJson(optParams));
    return this.commerce.submit(jobId, deliverable, encoded);
  }
  /** Client cancels a job still in Open state (no escrow moved). */
  async cancelOpen(jobId, reason = ZERO_REASON) {
    return this.commerce.reject(jobId, reason);
  }
  async claimRefund(jobId) {
    return this.commerce.claimRefund(jobId);
  }
  /** Permissionless: pull the policy verdict and apply it on-chain. */
  async settle(jobId, evidence = "0x") {
    return this.router.settle(jobId, evidence);
  }
  /** Permissionless: reconcile the Router's in-flight counter for a job
   * that exited via `claimRefund` (audit L03). */
  async markExpired(jobId) {
    return this.router.markExpired(jobId);
  }
  async dispute(jobId) {
    return this.policy.dispute(jobId);
  }
  async voteReject(jobId) {
    return this.policy.voteReject(jobId);
  }
  // ------------------------------------------------------------------ views
  async getJob(jobId) {
    return this.commerce.getJob(jobId);
  }
  async jobPaymentToken(jobId) {
    return getAddress(await this.commerce.jobPaymentToken(jobId));
  }
  async isPaymentTokenSupported(token) {
    return this.commerce.isPaymentTokenSupported(
      this.resolveTokenAddress(token)
    );
  }
  async getJobStatus(jobId) {
    return (await this.commerce.getJob(jobId)).status;
  }
  /** Public read client used by account-signature verification helpers. */
  get publicClient() {
    return this.client;
  }
  /**
   * Find the block where `JobFunded` economically committed to a quote.
   *
   * Maps the signed quote's timestamp window to block numbers, then makes one
   * indexed log query over that small range. Returns `null` when the job was
   * not funded during the signed window; callers must fail closed.
   */
  async getJobFundedBlock(jobId, window) {
    const current = await this.client.getBlockNumber();
    if (!Number.isSafeInteger(window.negotiatedAt) || !Number.isSafeInteger(window.quoteExpiresAt) || window.negotiatedAt < 0 || window.quoteExpiresAt <= window.negotiatedAt) {
      throw new Error("invalid signed quote time window");
    }
    const head = await this.client.getBlock({ blockNumber: current });
    if (head.timestamp < BigInt(window.negotiatedAt)) {
      return null;
    }
    const fromBlock = await this.firstBlockAtOrAfter(
      BigInt(window.negotiatedAt),
      current
    );
    const toBlock = head.timestamp < BigInt(window.quoteExpiresAt) ? current : await this.firstBlockAtOrAfter(
      BigInt(window.quoteExpiresAt),
      current
    );
    const events = await this.commerce.getJobFundedEvents(
      fromBlock,
      toBlock,
      void 0,
      jobId
    );
    return events[0]?.blockNumber ?? null;
  }
  /** Lowest block whose timestamp is greater than or equal to `timestamp`. */
  async firstBlockAtOrAfter(timestamp, head) {
    let low = 0n;
    let high = head;
    while (low < high) {
      const mid = (low + high) / 2n;
      const block = await this.client.getBlock({ blockNumber: mid });
      if (block.timestamp < timestamp) {
        low = mid + 1n;
      } else {
        high = mid;
      }
    }
    return low;
  }
  /**
   * Return the `deliverable_url` for a submitted job.
   *
   * Reads the `JobInitialised` event emitted by the policy and parses
   * `optParams` JSON to extract `deliverable_url`, returned only when it is
   * a non-empty string. `null` means the job is not submitted yet or its
   * submission carries no usable `deliverable_url`, which is up to the
   * provider.
   *
   * When `hintBlock` is not provided the method self-resolves it from the
   * job's on-chain `submittedAt` (see `resolveSubmitBlock`), so the log
   * query stays a few blocks wide however long ago the job was submitted.
   * Failing to read the chain throws ({@link NetworkError}, or
   * {@link RpcRangeLimitError} for a range/rate limit) instead of returning
   * `null`, including a submitted job whose `JobInitialised` log the RPC
   * does not return.
   */
  async getDeliverableUrl(jobId, opts) {
    if (opts?.hintBlock !== void 0) {
      return this.policy.getDeliverableUrl(jobId, {
        hintBlock: opts.hintBlock
      });
    }
    const hintBlock = await this.resolveSubmitBlock(jobId);
    if (hintBlock === null) {
      return null;
    }
    return this.policy.getDeliverableUrl(jobId, {
      hintBlock,
      requireLog: true
    });
  }
  /**
   * First block of the second in which `jobId` was submitted: binary-searches
   * block timestamps for the job's `submittedAt`. The submission
   * (`JobSubmitted` / `JobInitialised`) is in that block or one of the few
   * after it that share its timestamp. `null` while the job is unsubmitted.
   */
  async resolveSubmitBlock(jobId) {
    const { submittedAt } = await this.getJob(jobId);
    if (submittedAt === 0n) {
      return null;
    }
    return this.firstBlockAtOrAfter(
      submittedAt,
      await this.client.getBlockNumber()
    );
  }
  /** Simulate the verdict the Router would see right now. */
  async getVerdict(jobId, evidence = "0x") {
    return this.policy.check(jobId, evidence);
  }
  /** Number of jobs the Router currently considers in-flight (audit L03). */
  async inflightJobCount() {
    return this.router.inflightJobCount();
  }
  /** Quorum threshold snapshotted at `dispute()` time (audit L08). */
  async disputeQuorumSnapshot(jobId) {
    return BigInt(await this.policy.disputeQuorumSnapshot(jobId));
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/evmWalletProvider.ts
init_utils2();
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/pbkdf2.js
init_hmac();
init_utils2();
function pbkdf2Init(hash3, _password, _salt, _opts) {
  ahash(hash3);
  const opts = checkOpts({ dkLen: 32, asyncTick: 10 }, _opts);
  const { c, dkLen, asyncTick } = opts;
  anumber(c);
  anumber(dkLen);
  anumber(asyncTick);
  if (c < 1)
    throw new Error("iterations (c) should be >= 1");
  const password = kdfInputToBytes(_password);
  const salt = kdfInputToBytes(_salt);
  const DK = new Uint8Array(dkLen);
  const PRF = hmac.create(hash3, password);
  const PRFSalt = PRF._cloneInto().update(salt);
  return { c, dkLen, asyncTick, DK, PRF, PRFSalt };
}
function pbkdf2Output(PRF, PRFSalt, DK, prfW, u) {
  PRF.destroy();
  PRFSalt.destroy();
  if (prfW)
    prfW.destroy();
  clean(u);
  return DK;
}
function pbkdf2(hash3, password, salt, opts) {
  const { c, dkLen, DK, PRF, PRFSalt } = pbkdf2Init(hash3, password, salt, opts);
  let prfW;
  const arr = new Uint8Array(4);
  const view = createView(arr);
  const u = new Uint8Array(PRF.outputLen);
  for (let ti = 1, pos = 0; pos < dkLen; ti++, pos += PRF.outputLen) {
    const Ti = DK.subarray(pos, pos + PRF.outputLen);
    view.setInt32(0, ti, false);
    (prfW = PRFSalt._cloneInto(prfW)).update(arr).digestInto(u);
    Ti.set(u.subarray(0, Ti.length));
    for (let ui = 1; ui < c; ui++) {
      PRF._cloneInto(prfW).update(u).digestInto(u);
      for (let i = 0; i < Ti.length; i++)
        Ti[i] ^= u[i];
    }
  }
  return pbkdf2Output(PRF, PRFSalt, DK, prfW, u);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/generatePrivateKey.js
init_secp256k1();
init_toHex();
function generatePrivateKey() {
  return toHex(secp256k1.utils.randomPrivateKey());
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/privateKeyToAccount.js
init_secp256k1();
init_toHex();

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/toAccount.js
init_address();
init_isAddress();
function toAccount(source) {
  if (typeof source === "string") {
    if (!isAddress(source, { strict: false }))
      throw new InvalidAddressError({ address: source });
    return {
      address: source,
      type: "json-rpc"
    };
  }
  if (!isAddress(source.address, { strict: false }))
    throw new InvalidAddressError({ address: source.address });
  return {
    address: source.address,
    nonceManager: source.nonceManager,
    sign: source.sign,
    signAuthorization: source.signAuthorization,
    signMessage: source.signMessage,
    signTransaction: source.signTransaction,
    signTypedData: source.signTypedData,
    source: "custom",
    type: "local"
  };
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/sign.js
init_secp256k1();
init_isHex();
init_toBytes();
init_toHex();
var extraEntropy = false;
async function sign({ hash: hash3, privateKey, to = "object" }) {
  const { r, s, recovery } = secp256k1.sign(hash3.slice(2), privateKey.slice(2), {
    lowS: true,
    extraEntropy: isHex(extraEntropy, { strict: false }) ? hexToBytes(extraEntropy) : extraEntropy
  });
  const signature = {
    r: numberToHex(r, { size: 32 }),
    s: numberToHex(s, { size: 32 }),
    v: recovery ? 28n : 27n,
    yParity: recovery
  };
  return (() => {
    if (to === "bytes" || to === "hex")
      return serializeSignature({ ...signature, to });
    return signature;
  })();
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/signAuthorization.js
async function signAuthorization(parameters) {
  const { chainId, nonce, privateKey, to = "object" } = parameters;
  const address = parameters.contractAddress ?? parameters.address;
  const signature = await sign({
    hash: hashAuthorization({ address, chainId, nonce }),
    privateKey,
    to
  });
  if (to === "object")
    return {
      address,
      chainId,
      nonce,
      ...signature
    };
  return signature;
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/signMessage.js
async function signMessage({ message, privateKey }) {
  return await sign({ hash: hashMessage(message), privateKey, to: "hex" });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/signTransaction.js
init_keccak256();
async function signTransaction(parameters) {
  const { privateKey, transaction, serializer = serializeTransaction } = parameters;
  const signableTransaction = (() => {
    if (transaction.type === "eip4844")
      return {
        ...transaction,
        sidecars: false
      };
    return transaction;
  })();
  const signature = await sign({
    hash: keccak256(await serializer(signableTransaction)),
    privateKey
  });
  return await serializer(transaction, signature);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/utils/signTypedData.js
async function signTypedData(parameters) {
  const { privateKey, ...typedData } = parameters;
  return await sign({
    hash: hashTypedData(typedData),
    privateKey,
    to: "hex"
  });
}

// packages/bnb-sdk-lab/node_modules/.pnpm/viem@2.54.6_zod@4.4.3/node_modules/viem/_esm/accounts/privateKeyToAccount.js
function privateKeyToAccount(privateKey, options = {}) {
  const { nonceManager } = options;
  const publicKey = toHex(secp256k1.getPublicKey(privateKey.slice(2), false));
  const address = publicKeyToAddress(publicKey);
  const account = toAccount({
    address,
    nonceManager,
    async sign({ hash: hash3 }) {
      return sign({ hash: hash3, privateKey, to: "hex" });
    },
    async signAuthorization(authorization) {
      return signAuthorization({ ...authorization, privateKey });
    },
    async signMessage({ message }) {
      return signMessage({ message, privateKey });
    },
    async signTransaction(transaction, { serializer } = {}) {
      return signTransaction({ privateKey, transaction, serializer });
    },
    async signTypedData(typedData) {
      return signTypedData({ ...typedData, privateKey });
    }
  });
  return {
    ...account,
    publicKey,
    source: "privateKey"
  };
}

// packages/bnb-sdk-lab/vendor/typescript/src/utils/errorMessages.ts
var MAX_VALUE_LENGTH = 64;
function describeValue(value) {
  if (value === null || value === void 0) return "None";
  if (typeof value === "object") {
    return Array.isArray(value) ? "[Array]" : "[Object]";
  }
  if (typeof value === "function") return "[Function]";
  if (typeof value === "symbol") return "[Symbol]";
  const text = String(value);
  const shown = text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}\u2026(${text.length} chars)` : text;
  if (typeof value !== "string") return shown;
  return JSON.stringify(shown).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function summarizeParserError(error) {
  return new Error(
    describeValue(error instanceof Error ? error.message : error)
  );
}

// packages/bnb-sdk-lab/vendor/typescript/src/signing/errors.ts
var PolicyViolation = class extends Error {
  reason;
  primaryType;
  chainId;
  verifyingContract;
  constructor(reason, opts = {}) {
    const parts = [reason];
    if (opts.primaryType) {
      parts.push(`primary_type=${opts.primaryType}`);
    }
    if (opts.chainId !== void 0) {
      parts.push(`chain_id=${opts.chainId}`);
    }
    if (opts.verifyingContract) {
      parts.push(`verifyingContract=${opts.verifyingContract}`);
    }
    super(parts.join("; "));
    this.name = "PolicyViolation";
    this.reason = reason;
    this.primaryType = opts.primaryType;
    this.chainId = opts.chainId;
    this.verifyingContract = opts.verifyingContract;
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/signing/policy.ts
var EIP3009_TYPES = /* @__PURE__ */ new Set([
  "TransferWithAuthorization",
  "ReceiveWithAuthorization"
]);
var EIP3009_CANONICAL_FIELDS = [
  ["from", "address"],
  ["to", "address"],
  ["value", "uint256"],
  ["validAfter", "uint256"],
  ["validBefore", "uint256"],
  ["nonce", "bytes32"]
];
var PERMIT_UNBOUNDED_TYPES = /* @__PURE__ */ new Set([
  "Permit",
  // EIP-2612 — long-lived allowance to a spender
  "PermitSingle",
  // Permit2 AllowanceTransfer — long-lived allowance
  "PermitBatch"
  // Permit2 AllowanceTransfer (batch)
]);
function unionSets(a, b) {
  const out = new Set(a);
  for (const item of b) out.add(item);
  return out;
}
function domainKey(chainId, address) {
  return `${chainId}:${getAddress(address)}`;
}
function domainPairsToKeys(pairs) {
  const out = /* @__PURE__ */ new Set();
  for (const [chainId, address] of pairs) out.add(domainKey(chainId, address));
  return out;
}
function parseDomainKey(key) {
  const idx = key.indexOf(":");
  return [Number(key.slice(0, idx)), key.slice(idx + 1)];
}
function sortDomainPairs(pairs) {
  return [...pairs].sort(
    (a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0)
  );
}
var SigningPolicy = class _SigningPolicy {
  // Backing storage is private so nothing outside this class can hold a
  // reference to the live Set — `Object.freeze(this)` alone does not stop
  // `set.add(...)` from mutating a Set exposed as a public field (freezing
  // an object doesn't freeze the collection it points to). The public
  // getters below hand out a fresh copy on every read instead, so a caller
  // that casts past `ReadonlySet<string>` only ever mutates a throwaway
  // copy, never the policy's own state.
  #domainAllowlist;
  #primaryTypeAllowlist;
  #primaryTypeDenylist;
  #validityRequiredPrimaryTypes;
  /** `(chainId, checksumAddress)` pairs allowed as the EIP-712 `verifyingContract`, keyed as `"chainId:checksumAddress"`. */
  get domainAllowlist() {
    return new Set(this.#domainAllowlist);
  }
  /** EIP-712 primary type names accepted. */
  get primaryTypeAllowlist() {
    return new Set(this.#primaryTypeAllowlist);
  }
  /** Names refused unconditionally; takes precedence over the allowlist. */
  get primaryTypeDenylist() {
    return new Set(this.#primaryTypeDenylist);
  }
  /** Primary types that MUST carry valid `validBefore` / `validAfter` fields. */
  get validityRequiredPrimaryTypes() {
    return new Set(this.#validityRequiredPrimaryTypes);
  }
  /** Upper bound on `validBefore - validAfter`. Defaults to 600s (10 min). */
  maxValidityWindowSeconds;
  /** Upper bound on `validBefore - now`. Defaults to 900s (15 min). */
  maxFutureValiditySeconds;
  /** Bypass {@link domainAllowlist}. Must be set explicitly; default `false`. */
  allowUnknownDomain;
  /** Environment values (case-insensitive) that block `permissive()` construction unless `allowInProduction` is passed. */
  static PRODUCTION_ENV_MARKERS = /* @__PURE__ */ new Set([
    "prod",
    "production",
    "live",
    "mainnet-prod"
  ]);
  static assertUnknownDomainAllowed(source, allowInProduction) {
    const envRaw = process.env.ENV || process.env.ENVIRONMENT || "";
    const env = envRaw.trim().toLowerCase();
    if (_SigningPolicy.PRODUCTION_ENV_MARKERS.has(env) && !allowInProduction) {
      const markers = [..._SigningPolicy.PRODUCTION_ENV_MARKERS].sort();
      throw new Error(
        `${source} refused: ENV=${JSON.stringify(envRaw)} indicates production (matches [${markers.join(", ")}]). Pass allowInProduction=true if this is intentional (e.g. break-glass).`
      );
    }
    return envRaw;
  }
  constructor(fields = {}) {
    this.#domainAllowlist = new Set(fields.domainAllowlist ?? []);
    this.#primaryTypeAllowlist = new Set(fields.primaryTypeAllowlist ?? []);
    this.#primaryTypeDenylist = new Set(fields.primaryTypeDenylist ?? []);
    this.#validityRequiredPrimaryTypes = new Set(
      fields.validityRequiredPrimaryTypes ?? []
    );
    this.maxValidityWindowSeconds = fields.maxValidityWindowSeconds ?? 600;
    this.maxFutureValiditySeconds = fields.maxFutureValiditySeconds ?? 900;
    this.allowUnknownDomain = fields.allowUnknownDomain ?? false;
    Object.freeze(this);
  }
  // ── Factory presets ──────────────────────────────────────────────────
  /**
   * Recommended fail-closed default for direct-SDK callers.
   *
   * Defaults are deliberately narrow:
   * - domain: only active catalog assets verified for EIP-3009;
   * - allowlist: only EIP-3009 `TransferWithAuthorization` and
   *   `ReceiveWithAuthorization` — the well-understood single-use
   *   authorisation pattern x402 uses;
   * - denylist: every unbounded Permit variant (ERC-2612 / Permit2
   *   AllowanceTransfer);
   * - validity: required for the allowlisted EIP-3009 types, capped at
   *   600s window / 900s future.
   *
   * Permit2 SignatureTransfer types are intentionally **not** allowlisted
   * by default; extend the policy if you need them.
   */
  static strictDefault() {
    return new _SigningPolicy({
      domainAllowlist: knownEip3009PaymentTokens(),
      primaryTypeAllowlist: EIP3009_TYPES,
      primaryTypeDenylist: PERMIT_UNBOUNDED_TYPES,
      validityRequiredPrimaryTypes: EIP3009_TYPES,
      maxValidityWindowSeconds: 600,
      maxFutureValiditySeconds: 900,
      allowUnknownDomain: false
    });
  }
  /**
   * Testing-only escape: `allowUnknownDomain=true` and empty deny/allow sets.
   *
   * Refuses to construct when `ENV` or `ENVIRONMENT` env vars indicate a
   * production-class environment (case-insensitive match against
   * {@link PRODUCTION_ENV_MARKERS}). Pass `allowInProduction: true` for
   * break-glass scenarios where you understand the consequences.
   *
   * Always `console.warn`s on construction (even outside production) so the
   * bypass shows up in audit grep. Never use this in agent-reachable code
   * paths.
   *
   * @throws {Error} When env indicates production and `allowInProduction` is
   *   not set.
   */
  static permissive(opts = {}) {
    const allowInProduction = opts.allowInProduction ?? false;
    const envRaw = _SigningPolicy.assertUnknownDomainAllowed(
      "SigningPolicy.permissive()",
      allowInProduction
    );
    console.warn(
      `SigningPolicy.permissive() in use \u2014 POLICY DISABLED. This bypasses ALL signing guards; only acceptable in tests. (env=${JSON.stringify(envRaw)}, allowInProduction=${allowInProduction})`
    );
    return new _SigningPolicy({
      domainAllowlist: [],
      primaryTypeAllowlist: [],
      primaryTypeDenylist: [],
      validityRequiredPrimaryTypes: [],
      allowUnknownDomain: true
    });
  }
  // ── Composition ──────────────────────────────────────────────────────
  /**
   * Return a new policy with extended/overridden fields.
   *
   * Set-like arguments are *unioned* with the current value (additive).
   * Scalar arguments replace the current value when provided.
   */
  extend(opts = {}) {
    return new _SigningPolicy({
      domainAllowlist: opts.domainAllowlist !== void 0 ? unionSets(
        this.domainAllowlist,
        domainPairsToKeys(opts.domainAllowlist)
      ) : this.domainAllowlist,
      primaryTypeAllowlist: opts.primaryTypeAllowlist !== void 0 ? unionSets(this.primaryTypeAllowlist, opts.primaryTypeAllowlist) : this.primaryTypeAllowlist,
      primaryTypeDenylist: opts.primaryTypeDenylist !== void 0 ? unionSets(this.primaryTypeDenylist, opts.primaryTypeDenylist) : this.primaryTypeDenylist,
      validityRequiredPrimaryTypes: opts.validityRequiredPrimaryTypes !== void 0 ? unionSets(
        this.validityRequiredPrimaryTypes,
        opts.validityRequiredPrimaryTypes
      ) : this.validityRequiredPrimaryTypes,
      maxValidityWindowSeconds: opts.maxValidityWindowSeconds ?? this.maxValidityWindowSeconds,
      maxFutureValiditySeconds: opts.maxFutureValiditySeconds ?? this.maxFutureValiditySeconds,
      allowUnknownDomain: opts.allowUnknownDomain ?? this.allowUnknownDomain
    });
  }
  // ── Serialization ────────────────────────────────────────────────────
  /**
   * Serialise to a plain object suitable for JSON round-trips.
   *
   * Sets become sorted arrays for deterministic output; domain entries
   * become `[chainId, address]` pairs. Round-trips via {@link fromDict}.
   */
  toDict() {
    const domainPairs = sortDomainPairs(
      [...this.domainAllowlist].map(parseDomainKey)
    );
    return {
      domainAllowlist: domainPairs.map(([chainId, address]) => [
        chainId,
        address
      ]),
      primaryTypeAllowlist: [...this.primaryTypeAllowlist].sort(),
      primaryTypeDenylist: [...this.primaryTypeDenylist].sort(),
      validityRequiredPrimaryTypes: [
        ...this.validityRequiredPrimaryTypes
      ].sort(),
      maxValidityWindowSeconds: this.maxValidityWindowSeconds,
      maxFutureValiditySeconds: this.maxFutureValiditySeconds,
      allowUnknownDomain: this.allowUnknownDomain
    };
  }
  /**
   * Reconstruct a SigningPolicy from its {@link toDict} output.
   *
   * Missing keys fall back to the constructor defaults (empty sets / 600s
   * window / 900s future / `false` unknown-domain).
   *
   * @throws {Error} On malformed entries (e.g. a domain entry that is not a
   *   two-element array), or on a chainId / maxValidityWindowSeconds /
   *   maxFutureValiditySeconds that isn't strictly integer-coercible (e.g.
   *   hex "0x38" or exponent "1e2" strings) — mirrors Python's `int()`.
   */
  static fromDict(d, opts = {}) {
    const rawAllowUnknown = Object.hasOwn(d, "allowUnknownDomain") ? d.allowUnknownDomain : false;
    if (typeof rawAllowUnknown !== "boolean") {
      throw new Error("allowUnknownDomain must be a boolean");
    }
    if (rawAllowUnknown) {
      const allowInProduction = opts.allowInProduction ?? false;
      const envRaw = _SigningPolicy.assertUnknownDomainAllowed(
        "SigningPolicy.fromDict()",
        allowInProduction
      );
      console.warn(
        `SigningPolicy.fromDict() loaded allowUnknownDomain=true \u2014 POLICY DOMAIN ALLOWLIST DISABLED. (env=${JSON.stringify(envRaw)}, allowInProduction=${allowInProduction})`
      );
    }
    const rawDomains = d.domainAllowlist ?? [];
    const domainKeys = /* @__PURE__ */ new Set();
    rawDomains.forEach((entry, i) => {
      if (!Array.isArray(entry) || entry.length !== 2) {
        throw new Error(
          `domain_allowlist[${i}] must be a [chain_id, address] pair, got ${JSON.stringify(entry)}`
        );
      }
      const [chainIdRaw, addressRaw] = entry;
      domainKeys.add(domainKey(toIntStrict(chainIdRaw), String(addressRaw)));
    });
    return new _SigningPolicy({
      domainAllowlist: domainKeys,
      primaryTypeAllowlist: d.primaryTypeAllowlist ?? [],
      primaryTypeDenylist: d.primaryTypeDenylist ?? [],
      validityRequiredPrimaryTypes: d.validityRequiredPrimaryTypes ?? [],
      maxValidityWindowSeconds: toIntStrict(d.maxValidityWindowSeconds ?? 600),
      maxFutureValiditySeconds: toIntStrict(d.maxFutureValiditySeconds ?? 900),
      allowUnknownDomain: rawAllowUnknown
    });
  }
  // ── Human-readable output ────────────────────────────────────────────
  /** Multi-line operator-friendly summary; safe for logs + CLI output. */
  toString() {
    const domainPairs = sortDomainPairs(
      [...this.domainAllowlist].map(parseDomainKey)
    );
    const n = domainPairs.length;
    const lines = [
      "SigningPolicy(",
      `  domainAllowlist (${n} ${n === 1 ? "entry" : "entries"}):`
    ];
    for (const [chainId, address] of domainPairs) {
      lines.push(`    - chainId=${chainId} verifyingContract=${address}`);
    }
    if (n === 0) lines.push("    (none)");
    const allow = [...this.primaryTypeAllowlist].sort();
    lines.push(
      `  primaryTypeAllowlist=${allow.length ? JSON.stringify(allow) : "(any)"}`
    );
    const deny = [...this.primaryTypeDenylist].sort();
    lines.push(
      `  primaryTypeDenylist=${deny.length ? JSON.stringify(deny) : "(none)"}`
    );
    const required = [...this.validityRequiredPrimaryTypes].sort();
    lines.push(
      `  validity: window<=${this.maxValidityWindowSeconds}s, future<=${this.maxFutureValiditySeconds}s, requiredFor=${required.length ? JSON.stringify(required) : "(none)"}`
    );
    lines.push(`  allowUnknownDomain=${this.allowUnknownDomain}`);
    lines.push(")");
    return lines.join("\n");
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/signing/checks.ts
var EIP712_DOMAIN_TYPE_NAME = "EIP712Domain";
var MAX_SCHEMA_STRUCTS = 256;
var MAX_SCHEMA_FIELDS = 4096;
var MAX_SCHEMA_DEPTH = 64;
var MAX_SCHEMA_IDENTIFIER_LENGTH = 256;
var MAX_NAMES_IN_ERROR = 8;
var IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
var TYPE_REFERENCE_RE = /^([A-Za-z_$][A-Za-z0-9_$]*)((?:\[(?:[1-9][0-9]*)?\])*)$/;
var SIZED_ATOMIC_RE = /^(bytes|u?int)([1-9][0-9]*)$/;
function isAtomicType(type) {
  if (type === "address" || type === "bool" || type === "string" || type === "bytes") {
    return true;
  }
  const m = SIZED_ATOMIC_RE.exec(type);
  if (!m) return false;
  const size5 = Number(m[2]);
  return m[1] === "bytes" ? size5 <= 32 : size5 % 8 === 0 && size5 <= 256;
}
function describeNames(names) {
  const shown = names.slice(0, MAX_NAMES_IN_ERROR).map(describeValue);
  const rest = names.length - shown.length;
  return rest > 0 ? `[${shown.join(", ")}, \u2026(+${rest} more)]` : `[${shown.join(", ")}]`;
}
function collectStructEdges(types, nonDomain) {
  const names = new Set(nonDomain);
  const edges = /* @__PURE__ */ new Map();
  let fieldCount = 0;
  for (const name of nonDomain) {
    if (name.length > MAX_SCHEMA_IDENTIFIER_LENGTH || !IDENTIFIER_RE.test(name)) {
      throw new PolicyViolation(
        `EIP-712 struct name ${describeValue(name)} is not a valid identifier`
      );
    }
    if (isAtomicType(name)) {
      throw new PolicyViolation(
        `EIP-712 struct name ${describeValue(name)} shadows an atomic type`
      );
    }
    const fields = types[name];
    if (!Array.isArray(fields)) {
      throw new PolicyViolation(
        `types[${describeValue(name)}] must be an array of field descriptors, got ${describeValue(fields)}`
      );
    }
    fieldCount += fields.length;
    if (fieldCount > MAX_SCHEMA_FIELDS) {
      throw new PolicyViolation(
        `EIP-712 schema exceeds ${MAX_SCHEMA_FIELDS} fields`
      );
    }
    const children = [];
    const seen = /* @__PURE__ */ new Set();
    for (const field of fields) {
      if (typeof field !== "object" || field === null) {
        throw new PolicyViolation(
          `EIP-712 struct ${describeValue(name)} has a non-object field descriptor: ${describeValue(field)}`
        );
      }
      const fieldName = field.name;
      const fieldType = field.type;
      if (typeof fieldName !== "string" || fieldName.length > MAX_SCHEMA_IDENTIFIER_LENGTH || !IDENTIFIER_RE.test(fieldName)) {
        throw new PolicyViolation(
          `EIP-712 struct ${describeValue(name)} has a field whose name is not a valid identifier: ${describeValue(fieldName)}`
        );
      }
      if (seen.has(fieldName)) {
        throw new PolicyViolation(
          `EIP-712 struct ${describeValue(name)} declares field ${describeValue(fieldName)} twice`
        );
      }
      seen.add(fieldName);
      if (typeof fieldType !== "string" || fieldType.length > MAX_SCHEMA_IDENTIFIER_LENGTH) {
        throw new PolicyViolation(
          `EIP-712 field ${name}.${fieldName} has an invalid type: ${describeValue(fieldType)}`
        );
      }
      const match = TYPE_REFERENCE_RE.exec(fieldType);
      if (!match) {
        throw new PolicyViolation(
          `EIP-712 field ${name}.${fieldName} has a malformed type reference: ${describeValue(fieldType)}`
        );
      }
      const base = match[1];
      if (names.has(base)) {
        children.push(base);
      } else if (!isAtomicType(base)) {
        throw new PolicyViolation(
          `EIP-712 field ${name}.${fieldName} references unknown type ${describeValue(base)}`
        );
      }
    }
    edges.set(name, children);
  }
  return edges;
}
function inferPrimaryType(types) {
  const nonDomain = Object.keys(types).filter(
    (k) => k !== EIP712_DOMAIN_TYPE_NAME
  );
  if (nonDomain.length === 0) {
    throw new PolicyViolation(
      "EIP-712 types contains no non-EIP712Domain struct"
    );
  }
  if (nonDomain.length > MAX_SCHEMA_STRUCTS) {
    throw new PolicyViolation(
      `EIP-712 schema exceeds ${MAX_SCHEMA_STRUCTS} structs`
    );
  }
  const edges = collectStructEdges(types, nonDomain);
  const referenced = /* @__PURE__ */ new Set();
  for (const children of edges.values()) {
    for (const child of children) referenced.add(child);
  }
  const roots = nonDomain.filter((name) => !referenced.has(name));
  if (roots.length === 0) {
    throw new PolicyViolation(
      "EIP-712 types contains a cyclic dependency (every struct is referenced by another)"
    );
  }
  if (roots.length > 1) {
    throw new PolicyViolation(
      `EIP-712 types contains multiple non-EIP712Domain structs without a unique primary type: ${describeNames(roots)}`
    );
  }
  const root = roots[0];
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const heights = /* @__PURE__ */ new Map();
  const visit = (name, depth) => {
    if (depth > MAX_SCHEMA_DEPTH) {
      throw new PolicyViolation(
        `EIP-712 nested schema exceeds depth ${MAX_SCHEMA_DEPTH}`
      );
    }
    if (visiting.has(name)) {
      throw new PolicyViolation("EIP-712 types contains a cyclic dependency");
    }
    if (visited.has(name)) {
      const height2 = heights.get(name);
      if (depth + height2 - 1 > MAX_SCHEMA_DEPTH) {
        throw new PolicyViolation(
          `EIP-712 nested schema exceeds depth ${MAX_SCHEMA_DEPTH}`
        );
      }
      return height2;
    }
    visiting.add(name);
    let height = 1;
    for (const child of edges.get(name) ?? []) {
      height = Math.max(height, 1 + visit(child, depth + 1));
    }
    visiting.delete(name);
    visited.add(name);
    heights.set(name, height);
    return height;
  };
  visit(root, 1);
  if (visited.size !== nonDomain.length) {
    throw new PolicyViolation("EIP-712 types contains disconnected structs");
  }
  return root;
}
function checksumOrNone(addr) {
  if (typeof addr !== "string") return void 0;
  try {
    return getAddress(addr);
  } catch {
    return void 0;
  }
}
function toIntStrict(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${value} is not finite`);
    return Math.trunc(value);
  }
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^[+-]?\d+$/.test(trimmed)) {
      throw new Error(`invalid literal for int(): ${describeValue(value)}`);
    }
    return Math.trunc(Number(trimmed));
  }
  throw new Error(`${describeValue(value)} is not int-coercible`);
}
function check(policy, domain, types, message, opts = {}) {
  const primaryType = inferPrimaryType(types);
  if (domain.chainId === void 0 || domain.chainId === null) {
    throw new PolicyViolation(
      "EIP-712 domain missing chainId \u2014 refusing to sign",
      {
        primaryType
      }
    );
  }
  if (domain.verifyingContract === void 0 || domain.verifyingContract === null) {
    throw new PolicyViolation(
      "EIP-712 domain missing verifyingContract \u2014 refusing to sign",
      {
        primaryType
      }
    );
  }
  let chainId;
  try {
    chainId = toIntStrict(domain.chainId);
  } catch {
    throw new PolicyViolation(
      `EIP-712 domain chainId is not integer-coercible: ${describeValue(domain.chainId)}`,
      { primaryType }
    );
  }
  const verifying = checksumOrNone(domain.verifyingContract);
  if (verifying === void 0) {
    throw new PolicyViolation(
      `EIP-712 domain verifyingContract is not a valid address: ${describeValue(domain.verifyingContract)}`,
      { primaryType, chainId }
    );
  }
  if (policy.primaryTypeDenylist.has(primaryType)) {
    throw new PolicyViolation(
      `primary type '${primaryType}' is denylisted (unbounded allowance type \u2014 unsafe for agent signing)`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  if (policy.primaryTypeAllowlist.size > 0 && !policy.primaryTypeAllowlist.has(primaryType)) {
    throw new PolicyViolation(
      `primary type '${primaryType}' not in allowlist (extend SigningPolicy to opt in)`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  if (!policy.allowUnknownDomain) {
    const key = `${chainId}:${verifying}`;
    if (!policy.domainAllowlist.has(key)) {
      throw new PolicyViolation(
        `domain (chain_id=${chainId}, verifyingContract=${verifying}) not in allowlist; extend SigningPolicy if intentional`,
        { primaryType, chainId, verifyingContract: verifying }
      );
    }
  }
  checkFieldShape(types, primaryType, chainId, verifying);
  if (policy.validityRequiredPrimaryTypes.has(primaryType)) {
    checkValidity(policy, primaryType, message, chainId, verifying, opts.now);
  }
  return primaryType;
}
function checkFieldShape(types, primaryType, chainId, verifying) {
  if (!EIP3009_TYPES.has(primaryType)) return;
  const fields = types[primaryType];
  if (!Array.isArray(fields)) {
    throw new PolicyViolation(
      `types['${primaryType}'] must be an array of field descriptors, got ${describeValue(fields)}`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  const describe = (pairs) => pairs.map(([n, t]) => `${String(n)} ${String(t)}`).join(", ");
  const actual = fields.map(
    (f) => typeof f === "object" && f !== null ? [
      f.name,
      f.type
    ] : [void 0, void 0]
  );
  const matches = actual.length === EIP3009_CANONICAL_FIELDS.length && actual.every(
    ([n, t], i) => n === EIP3009_CANONICAL_FIELDS[i]?.[0] && t === EIP3009_CANONICAL_FIELDS[i]?.[1]
  );
  if (!matches) {
    throw new PolicyViolation(
      `types['${primaryType}'] does not match the canonical EIP-3009 field shape \u2014 refusing to sign a struct whose encoding differs from the on-chain type. expected (${describe(EIP3009_CANONICAL_FIELDS)}), got (${describe(actual)})`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
}
function checkValidity(policy, primaryType, message, chainId, verifying, now) {
  if (!("validBefore" in message) || !("validAfter" in message)) {
    throw new PolicyViolation(
      `primary type '${primaryType}' requires validBefore + validAfter in message; refusing to sign open-ended authorization`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  let validBefore;
  let validAfter;
  try {
    validBefore = toIntStrict(message.validBefore);
    validAfter = toIntStrict(message.validAfter);
  } catch (e) {
    throw new PolicyViolation(
      `validBefore / validAfter not integer-coercible: ${e.message}`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  if (validBefore <= validAfter) {
    throw new PolicyViolation(
      `validBefore (${validBefore}) must be > validAfter (${validAfter})`,
      {
        primaryType,
        chainId,
        verifyingContract: verifying
      }
    );
  }
  const window = validBefore - validAfter;
  if (window > policy.maxValidityWindowSeconds) {
    throw new PolicyViolation(
      `validity window ${window}s exceeds max ${policy.maxValidityWindowSeconds}s`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  const current = now !== void 0 ? Math.trunc(now) : Math.trunc(Date.now() / 1e3);
  if (validBefore <= current) {
    throw new PolicyViolation(
      `validBefore (${validBefore}) is already expired (current=${current})`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
  const future = validBefore - current;
  if (future > policy.maxFutureValiditySeconds) {
    throw new PolicyViolation(
      `validBefore ${validBefore} is ${future}s in the future, exceeds max ${policy.maxFutureValiditySeconds}s`,
      { primaryType, chainId, verifyingContract: verifying }
    );
  }
}

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/capabilities.ts
var SIGN_MESSAGE = "sign.message";
var SIGN_TRANSACTION = "sign.transaction";
var SIGN_TYPED_DATA = "sign.typed_data";
var CALLS_ARBITRARY = "calls.arbitrary";
var X402_PAY = "x402.pay";
var PAYMASTER_SPONSOR = "paymaster.sponsor";

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+ciphers@1.3.0/node_modules/@noble/ciphers/esm/utils.js
function isBytes3(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes3(b, ...lengths) {
  if (!isBytes3(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u322(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
var isLE2 = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function overlapBytes(a, b) {
  return a.buffer === b.buffer && // best we can do, may fail with an obscure Proxy
  a.byteOffset < b.byteOffset + b.byteLength && // a starts before b end
  b.byteOffset < a.byteOffset + a.byteLength;
}
function complexOverlapBytes(input, output) {
  if (overlapBytes(input, output) && input.byteOffset < output.byteOffset)
    throw new Error("complex overlap of input and output is not supported");
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
  function wrappedCipher(key, ...args) {
    abytes3(key);
    if (!isLE2)
      throw new Error("Non little-endian hardware is not yet supported");
    if (params.nonceLength !== void 0) {
      const nonce = args[0];
      if (!nonce)
        throw new Error("nonce / iv required");
      if (params.varSizeNonce)
        abytes3(nonce);
      else
        abytes3(nonce, params.nonceLength);
    }
    const tagl = params.tagLength;
    if (tagl && args[1] !== void 0) {
      abytes3(args[1]);
    }
    const cipher = constructor(key, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== void 0) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes3(output);
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes3(data);
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes3(data);
        if (tagl && data.length < tagl)
          throw new Error("invalid ciphertext length: smaller than tagLength=" + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  if (out.length !== expectedLength)
    throw new Error("invalid output length, expected " + expectedLength + ", got: " + out.length);
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function isAligned32(bytes) {
  return bytes.byteOffset % 4 === 0;
}
function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+ciphers@1.3.0/node_modules/@noble/ciphers/esm/aes.js
var BLOCK_SIZE = 16;
var BLOCK_SIZE32 = 4;
var POLY = 283;
function mul2(n) {
  return n << 1 ^ POLY & -(n >> 7);
}
function mul(a, b) {
  let res = 0;
  for (; b > 0; b >>= 1) {
    res ^= a & -(b & 1);
    a = mul2(a);
  }
  return res;
}
var sbox = /* @__PURE__ */ (() => {
  const t = new Uint8Array(256);
  for (let i = 0, x = 1; i < 256; i++, x ^= mul2(x))
    t[i] = x;
  const box = new Uint8Array(256);
  box[0] = 99;
  for (let i = 0; i < 255; i++) {
    let x = t[255 - i];
    x |= x << 8;
    box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
  }
  clean2(t);
  return box;
})();
var rotr32_8 = (n) => n << 24 | n >>> 8;
var rotl32_8 = (n) => n << 8 | n >>> 24;
function genTtable(sbox2, fn) {
  if (sbox2.length !== 256)
    throw new Error("Wrong sbox length");
  const T0 = new Uint32Array(256).map((_, j) => fn(sbox2[j]));
  const T1 = T0.map(rotl32_8);
  const T2 = T1.map(rotl32_8);
  const T3 = T2.map(rotl32_8);
  const T01 = new Uint32Array(256 * 256);
  const T23 = new Uint32Array(256 * 256);
  const sbox22 = new Uint16Array(256 * 256);
  for (let i = 0; i < 256; i++) {
    for (let j = 0; j < 256; j++) {
      const idx = i * 256 + j;
      T01[idx] = T0[i] ^ T1[j];
      T23[idx] = T2[i] ^ T3[j];
      sbox22[idx] = sbox2[i] << 8 | sbox2[j];
    }
  }
  return { sbox: sbox2, sbox2: sbox22, T0, T1, T2, T3, T01, T23 };
}
var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
var xPowers = /* @__PURE__ */ (() => {
  const p = new Uint8Array(16);
  for (let i = 0, x = 1; i < 16; i++, x = mul2(x))
    p[i] = x;
  return p;
})();
function expandKeyLE(key) {
  abytes3(key);
  const len = key.length;
  if (![16, 24, 32].includes(len))
    throw new Error("aes: invalid key size, should be 16, 24 or 32, got " + len);
  const { sbox2 } = tableEncoding;
  const toClean = [];
  if (!isAligned32(key))
    toClean.push(key = copyBytes(key));
  const k32 = u322(key);
  const Nk = k32.length;
  const subByte = (n) => applySbox(sbox2, n, n, n, n);
  const xk = new Uint32Array(len + 28);
  xk.set(k32);
  for (let i = Nk; i < xk.length; i++) {
    let t = xk[i - 1];
    if (i % Nk === 0)
      t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
    else if (Nk > 6 && i % Nk === 4)
      t = subByte(t);
    xk[i] = xk[i - Nk] ^ t;
  }
  clean2(...toClean);
  return xk;
}
function apply0123(T01, T23, s0, s1, s2, s3) {
  return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
}
function applySbox(sbox2, s0, s1, s2, s3) {
  return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
}
function encrypt(xk, s0, s1, s2, s3) {
  const { sbox2, T01, T23 } = tableEncoding;
  let k = 0;
  s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
  const rounds = xk.length / 4 - 2;
  for (let i = 0; i < rounds; i++) {
    const t02 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
    const t12 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
    const t22 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
    const t32 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
    s0 = t02, s1 = t12, s2 = t22, s3 = t32;
  }
  const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
  const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
  const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
  const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
  return { s0: t0, s1: t1, s2: t2, s3: t3 };
}
function ctrCounter(xk, nonce, src, dst) {
  abytes3(nonce, BLOCK_SIZE);
  abytes3(src);
  const srcLen = src.length;
  dst = getOutput(srcLen, dst);
  complexOverlapBytes(src, dst);
  const ctr2 = nonce;
  const c32 = u322(ctr2);
  let { s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]);
  const src32 = u322(src);
  const dst32 = u322(dst);
  for (let i = 0; i + 4 <= src32.length; i += 4) {
    dst32[i + 0] = src32[i + 0] ^ s0;
    dst32[i + 1] = src32[i + 1] ^ s1;
    dst32[i + 2] = src32[i + 2] ^ s2;
    dst32[i + 3] = src32[i + 3] ^ s3;
    let carry = 1;
    for (let i2 = ctr2.length - 1; i2 >= 0; i2--) {
      carry = carry + (ctr2[i2] & 255) | 0;
      ctr2[i2] = carry & 255;
      carry >>>= 8;
    }
    ({ s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]));
  }
  const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
  if (start < srcLen) {
    const b32 = new Uint32Array([s0, s1, s2, s3]);
    const buf = u8(b32);
    for (let i = start, pos = 0; i < srcLen; i++, pos++)
      dst[i] = src[i] ^ buf[pos];
    clean2(b32);
  }
  return dst;
}
var ctr = /* @__PURE__ */ wrapCipher({ blockSize: 16, nonceLength: 16 }, function aesctr(key, nonce) {
  function processCtr(buf, dst) {
    abytes3(buf);
    if (dst !== void 0) {
      abytes3(dst);
      if (!isAligned32(dst))
        throw new Error("unaligned destination");
    }
    const xk = expandKeyLE(key);
    const n = copyBytes(nonce);
    const toClean = [xk, n];
    if (!isAligned32(buf))
      toClean.push(buf = copyBytes(buf));
    const out = ctrCounter(xk, n, buf, dst);
    clean2(...toClean);
    return out;
  }
  return {
    encrypt: (plaintext, dst) => processCtr(plaintext, dst),
    decrypt: (ciphertext, dst) => processCtr(ciphertext, dst)
  };
});

// packages/bnb-sdk-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/scrypt.js
init_sha2();
init_utils2();
function XorAndSalsa(prev, pi, input, ii, out, oi) {
  let y00 = prev[pi++] ^ input[ii++], y01 = prev[pi++] ^ input[ii++];
  let y02 = prev[pi++] ^ input[ii++], y03 = prev[pi++] ^ input[ii++];
  let y04 = prev[pi++] ^ input[ii++], y05 = prev[pi++] ^ input[ii++];
  let y06 = prev[pi++] ^ input[ii++], y07 = prev[pi++] ^ input[ii++];
  let y08 = prev[pi++] ^ input[ii++], y09 = prev[pi++] ^ input[ii++];
  let y10 = prev[pi++] ^ input[ii++], y11 = prev[pi++] ^ input[ii++];
  let y12 = prev[pi++] ^ input[ii++], y13 = prev[pi++] ^ input[ii++];
  let y14 = prev[pi++] ^ input[ii++], y15 = prev[pi++] ^ input[ii++];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let i = 0; i < 8; i += 2) {
    x04 ^= rotl(x00 + x12 | 0, 7);
    x08 ^= rotl(x04 + x00 | 0, 9);
    x12 ^= rotl(x08 + x04 | 0, 13);
    x00 ^= rotl(x12 + x08 | 0, 18);
    x09 ^= rotl(x05 + x01 | 0, 7);
    x13 ^= rotl(x09 + x05 | 0, 9);
    x01 ^= rotl(x13 + x09 | 0, 13);
    x05 ^= rotl(x01 + x13 | 0, 18);
    x14 ^= rotl(x10 + x06 | 0, 7);
    x02 ^= rotl(x14 + x10 | 0, 9);
    x06 ^= rotl(x02 + x14 | 0, 13);
    x10 ^= rotl(x06 + x02 | 0, 18);
    x03 ^= rotl(x15 + x11 | 0, 7);
    x07 ^= rotl(x03 + x15 | 0, 9);
    x11 ^= rotl(x07 + x03 | 0, 13);
    x15 ^= rotl(x11 + x07 | 0, 18);
    x01 ^= rotl(x00 + x03 | 0, 7);
    x02 ^= rotl(x01 + x00 | 0, 9);
    x03 ^= rotl(x02 + x01 | 0, 13);
    x00 ^= rotl(x03 + x02 | 0, 18);
    x06 ^= rotl(x05 + x04 | 0, 7);
    x07 ^= rotl(x06 + x05 | 0, 9);
    x04 ^= rotl(x07 + x06 | 0, 13);
    x05 ^= rotl(x04 + x07 | 0, 18);
    x11 ^= rotl(x10 + x09 | 0, 7);
    x08 ^= rotl(x11 + x10 | 0, 9);
    x09 ^= rotl(x08 + x11 | 0, 13);
    x10 ^= rotl(x09 + x08 | 0, 18);
    x12 ^= rotl(x15 + x14 | 0, 7);
    x13 ^= rotl(x12 + x15 | 0, 9);
    x14 ^= rotl(x13 + x12 | 0, 13);
    x15 ^= rotl(x14 + x13 | 0, 18);
  }
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
function BlockMix(input, ii, out, oi, r) {
  let head = oi + 0;
  let tail = oi + 16 * r;
  for (let i = 0; i < 16; i++)
    out[tail + i] = input[ii + (2 * r - 1) * 16 + i];
  for (let i = 0; i < r; i++, head += 16, ii += 16) {
    XorAndSalsa(out, tail, input, ii, out, head);
    if (i > 0)
      tail += 16;
    XorAndSalsa(out, head, input, ii += 16, out, tail);
  }
}
function scryptInit(password, salt, _opts) {
  const opts = checkOpts({
    dkLen: 32,
    asyncTick: 10,
    maxmem: 1024 ** 3 + 1024
  }, _opts);
  const { N, r, p, dkLen, asyncTick, maxmem, onProgress } = opts;
  anumber(N);
  anumber(r);
  anumber(p);
  anumber(dkLen);
  anumber(asyncTick);
  anumber(maxmem);
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error("progressCb should be function");
  const blockSize = 128 * r;
  const blockSize32 = blockSize / 4;
  const pow32 = Math.pow(2, 32);
  if (N <= 1 || (N & N - 1) !== 0 || N > pow32) {
    throw new Error("Scrypt: N must be larger than 1, a power of 2, and less than 2^32");
  }
  if (p < 0 || p > (pow32 - 1) * 32 / blockSize) {
    throw new Error("Scrypt: p must be a positive integer less than or equal to ((2^32 - 1) * 32) / (128 * r)");
  }
  if (dkLen < 0 || dkLen > (pow32 - 1) * 32) {
    throw new Error("Scrypt: dkLen should be positive integer less than or equal to (2^32 - 1) * 32");
  }
  const memUsed = blockSize * (N + p);
  if (memUsed > maxmem) {
    throw new Error("Scrypt: memused is bigger than maxMem. Expected 128 * r * (N + p) > maxmem of " + maxmem);
  }
  const B = pbkdf2(sha256, password, salt, { c: 1, dkLen: blockSize * p });
  const B32 = u32(B);
  const V = u32(new Uint8Array(blockSize * N));
  const tmp = u32(new Uint8Array(blockSize));
  let blockMixCb = () => {
  };
  if (onProgress) {
    const totalBlockMix = 2 * N * p;
    const callbackPer = Math.max(Math.floor(totalBlockMix / 1e4), 1);
    let blockMixCnt = 0;
    blockMixCb = () => {
      blockMixCnt++;
      if (onProgress && (!(blockMixCnt % callbackPer) || blockMixCnt === totalBlockMix))
        onProgress(blockMixCnt / totalBlockMix);
    };
  }
  return { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb, asyncTick };
}
function scryptOutput(password, dkLen, B, V, tmp) {
  const res = pbkdf2(sha256, password, B, { c: 1, dkLen });
  clean(B, V, tmp);
  return res;
}
function scrypt(password, salt, opts) {
  const { N, r, p, dkLen, blockSize32, V, B32, B, tmp, blockMixCb } = scryptInit(password, salt, opts);
  swap32IfBE(B32);
  for (let pi = 0; pi < p; pi++) {
    const Pi = blockSize32 * pi;
    for (let i = 0; i < blockSize32; i++)
      V[i] = B32[Pi + i];
    for (let i = 0, pos = 0; i < N - 1; i++) {
      BlockMix(V, pos, V, pos += blockSize32, r);
      blockMixCb();
    }
    BlockMix(V, (N - 1) * blockSize32, B32, Pi, r);
    blockMixCb();
    for (let i = 0; i < N; i++) {
      const j = B32[Pi + blockSize32 - 16] % N;
      for (let k = 0; k < blockSize32; k++)
        tmp[k] = B32[Pi + k] ^ V[j * blockSize32 + k];
      BlockMix(tmp, 0, B32, Pi, r);
      blockMixCb();
    }
  }
  swap32IfBE(B32);
  return scryptOutput(password, dkLen, B, V, tmp);
}

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/keystore.ts
init_sha2();
init_utils2();
function passwordBytes(password) {
  return new TextEncoder().encode(password);
}
var SCRYPT_N = 262144;
var SCRYPT_R = 8;
var SCRYPT_P = 1;
var SCRYPT_P_MAX = 32;
var DK_LEN = 32;
var MAX_PBKDF2_ITERATIONS = 1e6;
var MIN_SALT_BYTES = 16;
var MAX_SALT_BYTES = 64;
function randomUuidV4() {
  const bytes = randomBytes(16);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex = bytesToHex2(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function assertIntegerInRange(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new Error(`${name} must be an integer >= ${min}`);
  }
  if (value > max) {
    throw new Error(`${name} exceeds supported maximum ${max}`);
  }
}
function assertHexBytes(value, name, minBytes, maxBytes = minBytes) {
  if (typeof value !== "string" || value.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(value)) {
    throw new Error(`${name} must be hexadecimal`);
  }
  const bytes = value.length / 2;
  if (bytes < minBytes || bytes > maxBytes) {
    const expected = minBytes === maxBytes ? `${minBytes} bytes` : `${minBytes}-${maxBytes} bytes`;
    throw new Error(`${name} must be ${expected}`);
  }
}
function validateKeystoreForDecrypt(keystore) {
  if (keystore?.version !== 3) {
    throw new Error(
      `unsupported keystore version: ${String(keystore?.version)}`
    );
  }
  const c = keystore.crypto;
  if (!c || typeof c !== "object") {
    throw new Error("keystore crypto section is required");
  }
  if (c.cipher !== "aes-128-ctr") {
    throw new Error(`unsupported keystore cipher: ${String(c.cipher)}`);
  }
  assertHexBytes(c.cipherparams?.iv, "crypto.cipherparams.iv", 16);
  assertHexBytes(c.ciphertext, "crypto.ciphertext", 32);
  assertHexBytes(c.mac, "crypto.mac", 32);
  const params = c.kdfparams;
  if (!params || typeof params !== "object") {
    throw new Error("crypto.kdfparams is required");
  }
  assertIntegerInRange(params.dklen, "crypto.kdfparams.dklen", DK_LEN, DK_LEN);
  assertHexBytes(
    params.salt,
    "crypto.kdfparams.salt",
    MIN_SALT_BYTES,
    MAX_SALT_BYTES
  );
  if (c.kdf === "scrypt") {
    const scryptParams = params;
    const n = scryptParams.n ?? scryptParams.N;
    assertIntegerInRange(n, "scrypt n", 2, SCRYPT_N);
    if ((n & n - 1) !== 0) {
      throw new Error("scrypt n must be a power of two");
    }
    assertIntegerInRange(scryptParams.r, "scrypt r", 1, SCRYPT_R);
    assertIntegerInRange(scryptParams.p, "scrypt p", 1, SCRYPT_P_MAX);
    return;
  }
  if (c.kdf === "pbkdf2") {
    const pbkdf2Params = params;
    if (pbkdf2Params.prf !== "hmac-sha256") {
      throw new Error(`unsupported pbkdf2 prf: ${String(pbkdf2Params.prf)}`);
    }
    assertIntegerInRange(pbkdf2Params.c, "pbkdf2 c", 1, MAX_PBKDF2_ITERATIONS);
    return;
  }
  throw new Error(`unsupported kdf: ${String(c.kdf)}`);
}
function deriveKey(password, kdf, kdfparams) {
  const pwBytes = passwordBytes(password);
  const salt = hexToBytes2(kdfparams.salt);
  if (kdf === "scrypt") {
    const p = kdfparams;
    const n = p.n ?? p.N;
    if (n === void 0) {
      throw new Error("scrypt kdfparams missing n/N");
    }
    return scrypt(pwBytes, salt, {
      N: n,
      r: p.r,
      p: p.p,
      dkLen: p.dklen
    });
  }
  if (kdf === "pbkdf2") {
    const p = kdfparams;
    if (p.prf !== "hmac-sha256") {
      throw new Error(`unsupported pbkdf2 prf: ${p.prf}`);
    }
    return pbkdf2(sha256, pwBytes, salt, { c: p.c, dkLen: p.dklen });
  }
  throw new Error(`unsupported kdf: ${kdf}`);
}
function computeMac(dk, ciphertext) {
  const macInput = new Uint8Array(16 + ciphertext.length);
  macInput.set(dk.slice(16, 32), 0);
  macInput.set(ciphertext, 16);
  return keccak256(macInput).slice(2);
}
function encryptKeystoreV3(privateKey, password) {
  const salt = randomBytes(16);
  const dk = scrypt(passwordBytes(password), salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    dkLen: DK_LEN
  });
  const encryptionKey = dk.slice(0, 16);
  const iv = randomBytes(16);
  const ciphertext = ctr(encryptionKey, iv).encrypt(privateKey);
  const mac = computeMac(dk, ciphertext);
  const account = privateKeyToAccount(
    `0x${bytesToHex2(privateKey)}`
  );
  return {
    version: 3,
    id: randomUuidV4(),
    address: account.address.slice(2),
    crypto: {
      cipher: "aes-128-ctr",
      cipherparams: { iv: bytesToHex2(iv) },
      ciphertext: bytesToHex2(ciphertext),
      kdf: "scrypt",
      kdfparams: {
        dklen: DK_LEN,
        n: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        salt: bytesToHex2(salt)
      },
      mac
    }
  };
}
function decryptKeystoreV3(keystore, password) {
  validateKeystoreForDecrypt(keystore);
  const { crypto: c } = keystore;
  const dk = deriveKey(password, c.kdf, c.kdfparams);
  const ciphertext = hexToBytes2(c.ciphertext);
  const computedMac = computeMac(dk, ciphertext);
  if (computedMac.toLowerCase() !== c.mac.toLowerCase()) {
    throw new Error(
      "Failed to decrypt keystore (wrong password?): MAC mismatch"
    );
  }
  const encryptionKey = dk.slice(0, 16);
  const iv = hexToBytes2(c.cipherparams.iv);
  return ctr(encryptionKey, iv).decrypt(ciphertext);
}

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/errors.ts
var UnsupportedWalletOperation = class extends Error {
  constructor(capabilityOrOperation, opts) {
    let message = capabilityOrOperation;
    if (opts?.reason) {
      message = `${capabilityOrOperation}: ${opts.reason}.`;
    }
    if (opts?.alternative) {
      message += ` Alternative: ${opts.alternative}.`;
    }
    if (opts?.ref) {
      message += ` (ref: ${opts.ref})`;
    }
    super(message);
    this.name = "UnsupportedWalletOperation";
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/core/relayVerifier.ts
var RELAY_VERIFIER_ENDPOINT_TIMEOUT_MS = 3e3;
var RELAY_VERIFIER_QUORUM = 2;
var FALLBACK_RPC_URLS = {
  [BSC_TESTNET_CHAIN_ID]: [
    "https://bsc-testnet-rpc.publicnode.com",
    "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
    "https://data-seed-prebsc-2-s1.bnbchain.org:8545"
  ],
  [BSC_MAINNET_CHAIN_ID]: [
    "https://bsc-rpc.publicnode.com",
    "https://bsc-dataseed1.bnbchain.org",
    "https://bsc-dataseed2.bnbchain.org"
  ]
};
function resolveFallbackRpcUrls(opts) {
  let urls;
  if (opts.fallbackRpcUrls && opts.fallbackRpcUrls.length > 0) {
    urls = opts.fallbackRpcUrls;
  } else {
    const raw = getEnv("BNBAGENT_FALLBACK_RPC_URLS");
    if (raw !== void 0 && raw.trim() !== "") {
      urls = raw.split(",");
    } else {
      urls = FALLBACK_RPC_URLS[opts.chainId] ?? [];
    }
  }
  const primary = rpcOrigin(opts.primaryRpcUrl);
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const entry of urls) {
    const trimmed = entry.trim();
    if (trimmed === "") {
      continue;
    }
    const key = rpcOrigin(trimmed);
    if (key === null) {
      continue;
    }
    if (key === primary || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
async function confirmTxUnseen(hash3, opts) {
  const urls = resolveFallbackRpcUrls(opts);
  if (urls.length === 0) {
    return "inconclusive";
  }
  const probe = opts.probe ?? fetchTxPresence;
  const timeoutMs = opts.perEndpointTimeoutMs ?? RELAY_VERIFIER_ENDPOINT_TIMEOUT_MS;
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await probe(url, hash3, timeoutMs);
      } catch {
        return "error";
      }
    })
  );
  const seenCount = results.filter((result) => result === "seen").length;
  const unseenCount = results.filter((result) => result === "unseen").length;
  if (seenCount > 0 && unseenCount > 0) {
    return "inconclusive";
  }
  if (seenCount >= RELAY_VERIFIER_QUORUM) {
    return "seen";
  }
  if (unseenCount >= RELAY_VERIFIER_QUORUM) {
    return "confirmed-unseen";
  }
  return "inconclusive";
}
async function fetchTxPresence(rpcUrl, hash3, timeoutMs) {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [hash3]
      }),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      return "error";
    }
    const payload = await response.json();
    if (payload.error !== void 0 && payload.error !== null) {
      return "error";
    }
    if (payload.result === null) {
      return "unseen";
    }
    if (typeof payload.result !== "object" || payload.result === void 0 || payload.result === null) {
      return "error";
    }
    const returnedHash = payload.result.hash;
    return typeof returnedHash === "string" && returnedHash.toLowerCase() === hash3.toLowerCase() ? "seen" : "error";
  } catch {
    return "error";
  }
}
function rpcOrigin(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.origin.toLowerCase();
  } catch {
    return null;
  }
}

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/localExecutor.ts
var USER_AGENT_HEADERS = { UserAgent: "bnbagent/v1.0.0" };
var LocalExecutor = class {
  client;
  walletProvider;
  paymaster;
  receiptTimeout;
  relayUnseenTimeout;
  selfPayFallback;
  fallbackRpcUrls;
  confirmTxUnseen;
  constructor(opts) {
    this.client = opts.client;
    this.walletProvider = opts.walletProvider;
    this.paymaster = opts.paymaster ?? null;
    this.receiptTimeout = opts.receiptTimeout ?? null;
    this.relayUnseenTimeout = opts.relayUnseenTimeout ?? null;
    this.selfPayFallback = opts.selfPayFallback ?? true;
    this.fallbackRpcUrls = opts.fallbackRpcUrls ?? null;
    this.confirmTxUnseen = opts.confirmTxUnseen ?? confirmTxUnseen;
  }
  /** Execute an intent's mechanical `call`. */
  async execute(intent) {
    const call2 = intent.call;
    if (!call2) {
      const label = intent.name ?? intent.description ?? "None";
      throw new Error(
        `LocalExecutor requires Intent.call (a web3 ContractFunction); got None for intent '${label}'`
      );
    }
    const description = intent.description ?? intent.name ?? "transaction";
    const account = this.walletProvider.address;
    const to = call2.address;
    const value = intent.value ?? 0n;
    const data = encodeFunctionData({
      abi: call2.abi,
      functionName: call2.functionName,
      args: call2.args
    });
    const gas = intent.gas ?? await estimateGasLimit(
      this.client,
      { account, to, data, value, skipPreflight: false },
      { logPrefix: "[LocalExecutor]" }
    );
    if (this.paymaster) {
      let sponsored;
      try {
        sponsored = await this.trySponsored({
          paymaster: this.paymaster,
          account,
          to,
          data,
          value,
          gas,
          description
        });
      } catch (error) {
        if (error instanceof RelayRejectedError && error.definite) {
          console.warn(
            `[LocalExecutor] relay rejected ${description} (${error.reason}); self-paying`
          );
          sponsored = null;
        } else {
          throw error;
        }
      }
      if (sponsored) {
        const timeoutSeconds = this.receiptTimeout ?? getDefaultReceiptTimeout();
        try {
          return await waitForReceiptAndInterpret(
            this.client,
            sponsored.hash,
            timeoutSeconds,
            {
              requireTransactionSeen: true,
              unseenAbortSeconds: this.relayUnseenTimeout ?? void 0
            }
          );
        } catch (error) {
          if (error instanceof RelaySubmissionUnverifiedError && this.selfPayFallback) {
            const verdict = await this.secondaryConfirmation(
              sponsored.hash,
              sponsored.tx.chainId
            );
            if (verdict === "seen") {
              console.warn(
                `[LocalExecutor] primary RPC never saw relay tx ${sponsored.hash}, but the fallback RPC quorum can see it; waiting out the receipt instead of self-paying.`
              );
              return await waitForReceiptAndInterpret(
                this.client,
                sponsored.hash,
                timeoutSeconds
              );
            }
            error.secondaryRpcResult = verdict;
            if (verdict === "inconclusive") {
              console.warn(
                `[LocalExecutor] fallback RPC quorum could not determine whether relay tx ${sponsored.hash} is visible; refusing the self-pay fallback to avoid an unverified second broadcast.`
              );
              throw error;
            }
            return await this.selfPayAfterUnverifiedRelay(
              sponsored,
              error,
              timeoutSeconds,
              description
            );
          }
          throw error;
        }
      }
    }
    return sendSelfPayTx({
      client: this.client,
      walletProvider: this.walletProvider,
      to,
      data,
      value,
      gas,
      receiptTimeoutSeconds: this.receiptTimeout ?? void 0,
      logPrefix: "[LocalExecutor]"
    });
  }
  /**
   * Attempt a paymaster-sponsored broadcast.
   *
   * Returns the tracked tx hash plus the (pre-zero-gasPrice) signed request on
   * success, or `null` when the tx is not sponsorable or the paymaster is
   * unreachable — the caller then falls back to self-pay. The request is
   * returned so that, if the relay accepts the hash but never broadcasts it,
   * the caller can re-sign the SAME nonce/payload as a self-paid transaction.
   * A genuine pre-flight revert propagates (self-pay could not fix it either).
   * The sponsored *send* itself is never retried into a self-pay fallback, to
   * avoid any double-broadcast risk once submitted.
   */
  async trySponsored(params) {
    const { paymaster, account, to, data, value, gas, description } = params;
    let nonce;
    try {
      nonce = await paymaster.ethGetTransactionCount(account, "pending");
    } catch (error) {
      console.warn(
        `[LocalExecutor] paymaster nonce fetch failed for ${description} (${describeError(error)}); self-paying`
      );
      return null;
    }
    const chainId = await this.client.getChainId();
    let gasPrice;
    try {
      const networkGasPrice = await this.client.getGasPrice();
      gasPrice = maxBigint(networkGasPrice, minGasPriceWei(chainId));
    } catch {
      gasPrice = minGasPriceWei(chainId);
    }
    const tx = {
      from: account,
      to,
      data,
      value,
      gas,
      gasPrice,
      nonce,
      chainId
    };
    const preflight = await preflightCall(this.client, {
      account,
      to,
      data,
      value,
      gas
    });
    if (preflight.kind === "timeout") {
      console.warn(
        `[LocalExecutor] Pre-flight eth_call timed out for ${description}, proceeding`
      );
    } else if (preflight.kind === "error") {
      if (isOpaqueRevert(preflight.error)) {
        console.warn(
          `[LocalExecutor] Pre-flight returned opaque 0x revert for ${description}, proceeding`
        );
      } else {
        throw new Error(
          `Transaction would revert: ${describeError(preflight.error)}`
        );
      }
    }
    let sponsorable;
    try {
      sponsorable = await paymaster.isSponsorable({
        to,
        from: account,
        value,
        data,
        gas
      });
    } catch (error) {
      console.warn(
        `[LocalExecutor] isSponsorable check failed for ${description} (${describeError(error)}); self-paying`
      );
      return null;
    }
    if (!sponsorable) {
      console.info(
        `[LocalExecutor] ${description} is not sponsorable on this network; self-paying gas`
      );
      return null;
    }
    const sponsoredTx = {
      ...tx,
      gasPrice: 0n
    };
    const signed = await this.walletProvider.signTransaction(sponsoredTx);
    const signedTxHash = keccak256(normalizeHash(signed.rawTransaction));
    let rawHash;
    try {
      rawHash = await paymaster.ethSendRawTransaction(signed.rawTransaction, {
        ...USER_AGENT_HEADERS
      });
    } catch (error) {
      if (error instanceof RelayRejectedError && !error.definite) {
        return { hash: signedTxHash, tx };
      }
      throw error;
    }
    const relayHash = normalizeHash(rawHash);
    if (relayHash.toLowerCase() !== signedTxHash.toLowerCase()) {
      console.warn(
        `[LocalExecutor] paymaster returned tx hash ${relayHash}, which does not match the signed transaction hash ${signedTxHash}; tracking the signed hash`
      );
      return { hash: signedTxHash, tx };
    }
    return { hash: relayHash, tx };
  }
  /**
   * Recover from a sponsored broadcast the relay accepted but never put
   * on-chain: re-sign the SAME nonce as a self-paid transaction and broadcast
   * it directly. Same nonce is the safety property — at most one of the relay
   * tx and the self-pay tx can ever land, so this can never double-execute.
   *
   * Races are handled at three points: a final re-check before re-signing, a
   * re-check if the direct broadcast hits a nonce conflict (the relay tx
   * surfaced late), and a re-check if the self-pay tx stays pending (the relay
   * tx won). A wallet with no gas surfaces as {@link RelayFallbackFailedError}.
   */
  async selfPayAfterUnverifiedRelay(sponsored, relayError, timeoutSeconds, description) {
    const { hash: relayHash, tx } = sponsored;
    const account = this.walletProvider.address;
    const alreadyLanded = await this.relayTxOutcome(relayHash, timeoutSeconds);
    if (alreadyLanded) {
      return alreadyLanded;
    }
    console.warn(
      `[LocalExecutor] MegaFuel relay accepted ${description} (tx ${relayHash}) but the chain RPC never saw it within ${relayError.timeoutSeconds}s; re-signing nonce ${tx.nonce} as a SELF-PAID transaction \u2014 gas will be charged to ${account}.`
    );
    let gasPrice;
    try {
      const networkGasPrice = await this.client.getGasPrice();
      gasPrice = maxBigint(
        networkGasPrice * 12n / 10n,
        minGasPriceWei(tx.chainId)
      );
    } catch {
      gasPrice = minGasPriceWei(tx.chainId);
    }
    const signed = await this.walletProvider.signTransaction({
      ...tx,
      gasPrice
    });
    let selfPayHash;
    try {
      selfPayHash = await this.client.sendRawTransaction({
        serializedTransaction: signed.rawTransaction
      });
    } catch (error) {
      if (isInsufficientFundsError(error)) {
        throw new RelayFallbackFailedError(
          relayHash,
          relayError.timeoutSeconds,
          `wallet ${account} has insufficient BNB for gas`,
          { cause: error }
        );
      }
      if (isNonceError(error)) {
        const raced = await this.relayTxOutcome(relayHash, timeoutSeconds);
        if (raced) {
          return raced;
        }
        throw relayError;
      }
      throw new RelayFallbackFailedError(
        relayHash,
        relayError.timeoutSeconds,
        describeError(error),
        { cause: error }
      );
    }
    NonceManager.forAccount(
      this.client,
      account
    ).reset();
    try {
      return await waitForReceiptAndInterpret(
        this.client,
        selfPayHash,
        timeoutSeconds
      );
    } catch (error) {
      if (error instanceof TransactionPendingError) {
        const raced = await this.relayTxOutcome(relayHash, timeoutSeconds);
        if (raced) {
          return raced;
        }
      }
      throw error;
    }
  }
  /**
   * Run the multi-RPC secondary confirmation for an unverified relay hash.
   * Never throws — a verifier failure degrades to `"inconclusive"` so the
   * self-pay safety net cannot be disabled by third-party RPC downtime.
   */
  async secondaryConfirmation(hash3, chainId) {
    const transport = this.client.transport;
    try {
      return await this.confirmTxUnseen(hash3, {
        chainId,
        primaryRpcUrl: typeof transport?.url === "string" ? transport.url : void 0,
        fallbackRpcUrls: this.fallbackRpcUrls
      });
    } catch {
      return "inconclusive";
    }
  }
  /**
   * Single-shot check of whether `relayHash` actually made it on-chain:
   * returns its {@link TxResult} if a receipt exists, or waits out the receipt
   * if the tx is at least visible in the mempool. Returns `null` when the tx
   * is neither mined nor seen. A reverted receipt throws.
   */
  async relayTxOutcome(relayHash, timeoutSeconds) {
    let receipt;
    try {
      receipt = await this.client.getTransactionReceipt({ hash: relayHash });
    } catch {
      receipt = null;
    }
    if (receipt) {
      if (receipt.status === "reverted") {
        throw new Error(
          `Transaction reverted on-chain: ${receipt.transactionHash}`
        );
      }
      return {
        transactionHash: receipt.transactionHash,
        status: receipt.status === "success" ? 1 : 0,
        receipt
      };
    }
    let seen = false;
    try {
      await this.client.getTransaction({ hash: relayHash });
      seen = true;
    } catch {
      seen = false;
    }
    if (seen) {
      return await waitForReceiptAndInterpret(
        this.client,
        relayHash,
        timeoutSeconds
      );
    }
    return null;
  }
};
function isNonceError(error) {
  const text = describeError(error).toLowerCase();
  return NONCE_ERROR_PATTERNS.some((pattern) => text.includes(pattern));
}
function normalizeHash(hash3) {
  return hash3.startsWith("0x") ? hash3 : `0x${hash3}`;
}

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/walletProvider.ts
var SIGN_METHOD_CAPABILITIES = [
  [SIGN_MESSAGE, "signMessage"],
  [SIGN_TRANSACTION, "signTransaction"],
  [SIGN_TYPED_DATA, "signTypedData"]
];
var WalletProvider = class _WalletProvider {
  /**
   * Stable, lowercase identifier for this provider kind (`"evm"`, `"twak"`,
   * `"mpc"`, ...). Used by the wallet factory to select an implementation
   * and by {@link describe} for uniform introspection. Concrete providers
   * override it; third-party subclasses keep the default.
   *
   * Studio config uses `"evm-local"` for {@link EVMWalletProvider}
   * (`kind === "evm"`). Route gates that accept a kind string must treat
   * those two as the same local keystore wallet.
   */
  static kind = "custom";
  /**
   * Whether this wallet owns the ERC-8183 funding allowance lifecycle.
   * `false` for pure signers — the SDK manages the allowance and sends a
   * separate `approve` before `fund`. A self-broadcasting backend sets this
   * to `true` so the SDK skips its own allowance top-up; the backend may
   * bundle approval or require a trusted admin to pre-provision it.
   */
  fundBundlesApproval = false;
  /**
   * Non-`sign.*` capabilities this provider declares (execution- and
   * service-side bits like `calls.arbitrary` or `broadcast.self`). Concrete
   * providers set this; `sign.*` values are never listed here — they are
   * auto-derived by {@link capabilities}.
   */
  extraCapabilities = /* @__PURE__ */ new Set();
  /** Instance accessor mirroring the constructor's static `kind`. */
  get kind() {
    return this.constructor.kind;
  }
  /**
   * Human-readable description of *where this wallet's key lives*.
   *
   * There is no single shared key store across providers — each owns its
   * own custody (the SDK keystore directory, an external CLI's keychain, a
   * remote MPC enclave, ...). This property gives a uniform way to answer
   * "where is my key?" without unifying the underlying storage. Returns
   * `null` when the location is unknown or not applicable.
   */
  get keyLocation() {
    return null;
  }
  /**
   * Whether durable key material already backs this provider.
   *
   * Defaults to `true` (a constructed provider is assumed usable).
   * Providers with an on-disk or external store override this to report
   * whether the wallet has actually been created and persisted, so callers
   * can implement a uniform "get-or-create" flow. Implementations MUST NOT
   * throw — they return `false` when existence cannot be confirmed.
   */
  exists() {
    return true;
  }
  /**
   * The set of capability strings this wallet supports.
   *
   * Values come from `./capabilities` (an open set — third parties may add
   * vendor-namespaced strings; consumers ignore unknown values and treat
   * absence as unsupported).
   *
   * `sign.*` values are **auto-derived from method overrides**: a provider
   * that implements `signMessage` / `signTransaction` / `signTypedData`
   * declares the matching capability by that override alone, so declaration
   * cannot drift from behavior. Corollary (the don't-override-to-raise
   * discipline): never override a `sign*` method just to raise — the base
   * default already raises a descriptive {@link UnsupportedWalletOperation},
   * and an override-to-raise would falsely claim the capability. Everything
   * else comes from the provider's `extraCapabilities`.
   */
  capabilities() {
    const derived = /* @__PURE__ */ new Set();
    for (const [capability, method] of SIGN_METHOD_CAPABILITIES) {
      if (this[method] !== _WalletProvider.prototype[method]) {
        derived.add(capability);
      }
    }
    for (const extra of this.extraCapabilities) {
      derived.add(extra);
    }
    return derived;
  }
  /** Whether `capability` is in {@link capabilities} (membership test). */
  supports(capability) {
    return this.capabilities().has(capability);
  }
  /**
   * Return a uniform, non-sensitive summary of this wallet.
   *
   * Never includes private key material.
   */
  describe() {
    let address;
    try {
      address = this.address;
    } catch {
      address = null;
    }
    return {
      kind: this.kind,
      address,
      keyLocation: this.keyLocation,
      exists: this.exists(),
      capabilities: [...this.capabilities()].sort()
    };
  }
  /**
   * Return the {@link IntentExecutor} that runs operations for this wallet.
   *
   * This makes execution polymorphic, so callers never special-case wallet
   * kinds. The default wraps this signer in a `LocalExecutor` that builds,
   * signs and broadcasts via the provided `context` — the path every
   * pure-signing wallet (EVM, hardware, ...) shares.
   *
   * A self-broadcasting wallet (one that owns the broadcast step, e.g. a
   * CLI-backed backend) overrides this to return itself.
   *
   * The default requires the `sign.transaction` capability and throws
   * {@link UnsupportedWalletOperation} at this construction point — before
   * any intent runs — when it is absent.
   */
  makeExecutor(context) {
    if (!this.supports(SIGN_TRANSACTION)) {
      throw new UnsupportedWalletOperation(SIGN_TRANSACTION, {
        reason: "the default executor signs transactions locally",
        alternative: "self-broadcasting wallets must override makeExecutor() to return their own IntentExecutor"
      });
    }
    return new LocalExecutor({
      client: context.client,
      walletProvider: this,
      paymaster: context.paymaster ?? null,
      receiptTimeout: context.receiptTimeout ?? null,
      relayUnseenTimeout: context.relayUnseenTimeout ?? null,
      fallbackRpcUrls: context.fallbackRpcUrls ?? null
    });
  }
  /**
   * Return the x402 payer for this wallet.
   *
   * The default is a **capability gate**, not dead code — the same pattern
   * as the `sign*` defaults: wallets without a payment backend get a
   * descriptive refusal at composition time, and a delegated backend (e.g.
   * twak) overrides this to return its own payer. `payerKwargs` are
   * forwarded verbatim to the payer constructor, so payer-specific options
   * never freeze this signature.
   */
  makeX402Payer(payerKwargs) {
    void payerKwargs;
    throw new UnsupportedWalletOperation(X402_PAY, {
      reason: `the '${this.kind}' wallet has no x402 payment backend in the SDK yet`,
      alternative: "wallets with sign.typed_data can use X402Signer directly today; a local payer that upgrades this default is planned"
    });
  }
  /**
   * Sign a transaction.
   *
   * The default throws {@link UnsupportedWalletOperation}; implementing this
   * method declares the `sign.transaction` capability.
   */
  async signTransaction(tx) {
    void tx;
    throw new UnsupportedWalletOperation(SIGN_TRANSACTION, {
      reason: `the '${this.kind}' wallet does not implement raw-transaction signing`,
      alternative: "use a wallet whose capabilities() include 'sign.transaction', or route high-level operations through the wallet's own executor (makeExecutor() / execute(Intent(...)))"
    });
  }
  /**
   * Sign a message using EIP-191 personal sign.
   *
   * The default throws {@link UnsupportedWalletOperation}; implementing this
   * method declares the `sign.message` capability.
   *
   * `messageHash` on the returned {@link SignatureResult} is the **EIP-191
   * personal-sign digest** (`keccak256("\x19Ethereum Signed Message:\n" ||
   * len || message)`) — not interchangeable with the digest returned by
   * `signTypedData`.
   */
  async signMessage(message) {
    void message;
    throw new UnsupportedWalletOperation(SIGN_MESSAGE, {
      reason: `the '${this.kind}' wallet does not implement EIP-191 personal-sign`,
      alternative: "use a wallet whose capabilities() include 'sign.message'"
    });
  }
  /**
   * Sign typed structured data per EIP-712.
   *
   * The default throws {@link UnsupportedWalletOperation}; implementing this
   * method declares the `sign.typed_data` capability.
   *
   * Used for protocols requiring signed structured payloads — EIP-3009
   * transferWithAuthorization (x402 micropay), ERC-8183 negotiate quotes,
   * permit2, etc. The signing key never leaves the wallet implementation.
   *
   * `messageHash` on the returned {@link SignatureResult} is the **EIP-712
   * typed-data digest** (`keccak256("\x19\x01" || domainSeparator ||
   * hashStruct(message))`) — not the EIP-191 digest returned by
   * `signMessage`. This is the value that on-chain `ecrecover` will use
   * against this signature.
   */
  async signTypedData(domain, types, message) {
    void domain;
    void types;
    void message;
    throw new UnsupportedWalletOperation(SIGN_TYPED_DATA, {
      reason: `the '${this.kind}' wallet does not implement EIP-712 typed-data signing`,
      alternative: "use a wallet whose capabilities() include 'sign.typed_data', or a delegated flow that signs internally (e.g. the x402 payer path for payments)"
    });
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/wallets/evmWalletProvider.ts
var DEFAULT_WALLETS_DIR = join(homedir(), ".bnbagent", "wallets");
function listKeystoreFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir).filter(
    (f) => f.startsWith("0x") && f.endsWith(".json")
  );
}
var EVMWalletProvider = class _EVMWalletProvider extends WalletProvider {
  static kind = "evm";
  // Arbitrary mechanical contract calls via LocalExecutor; sponsored
  // broadcast via the MegaFuel paymaster. sign.* derive automatically since
  // all three sign methods below are overridden.
  extraCapabilities = /* @__PURE__ */ new Set([
    CALLS_ARBITRARY,
    PAYMASTER_SPONSOR
  ]);
  #persist;
  #walletsDir;
  #signingPolicy;
  // The single persistent key representation. viem accounts are constructed
  // only for individual operations so the provider does not retain a second
  // account closure over the same key.
  #privateKeyHex;
  #source = "";
  /**
   * @throws {Error} If `password` is empty, `privateKey` is invalid, or no
   *   wallet can be resolved.
   */
  constructor(opts) {
    super();
    if (!opts.password) {
      throw new Error(
        "Password is required for wallet encryption. Please provide a secure password."
      );
    }
    this.#persist = opts.persist ?? true;
    this.#walletsDir = opts.walletsDir ?? DEFAULT_WALLETS_DIR;
    this.#signingPolicy = opts.signingPolicy ?? SigningPolicy.strictDefault();
    if (opts.privateKey) {
      this.#importPrivateKey(opts.privateKey, opts.password);
    } else if (this.#persist) {
      this.#loadWallet(opts.address, opts.password);
    } else {
      throw new Error(
        "private_key is required when persist=false (in-memory-only mode)"
      );
    }
  }
  // ── Static helpers ──────────────────────────────────────────────────
  /**
   * Check if an encrypted keystore exists on disk.
   *
   * @param address Check for a specific address (checksummed, `0x`-prefixed).
   *   If omitted, returns `true` if *any* keystore file exists.
   * @param walletsDir Override wallet directory.
   */
  static keystoreExists(address, walletsDir) {
    const dir = walletsDir ?? DEFAULT_WALLETS_DIR;
    if (!existsSync(dir) || !statSync(dir).isDirectory()) return false;
    if (address) return existsSync(join(dir, `${address}.json`));
    return listKeystoreFiles(dir).length > 0;
  }
  /**
   * List all wallet addresses that have keystores on disk.
   *
   * @returns Checksummed addresses (e.g. `["0x1234...abcd"]`), sorted.
   */
  static listWallets(walletsDir) {
    const dir = walletsDir ?? DEFAULT_WALLETS_DIR;
    return listKeystoreFiles(dir).map((f) => f.slice(0, -".json".length)).sort();
  }
  /** How the wallet was initialized: `"imported"`, `"loaded_keystore"`, or `"created_new"`. */
  get source() {
    return this.#source;
  }
  /** The SigningPolicy currently enforcing {@link signTypedData} calls. */
  get signingPolicy() {
    return this.#signingPolicy;
  }
  // ── Private key import ──────────────────────────────────────────────
  #importPrivateKey(privateKey, password) {
    try {
      const stripped = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
      if (stripped.length !== 64) {
        throw new Error("Private key must be 64 hex characters (32 bytes)");
      }
      const pkHex = `0x${stripped}`;
      privateKeyToAccount(pkHex);
      this.#privateKeyHex = pkHex;
      this.#source = "imported";
      if (this.#persist) {
        this.#saveKeystore(password);
      }
    } catch (e) {
      throw new Error(`Invalid private key: ${e.message}`);
    }
  }
  // ── Load from disk ───────────────────────────────────────────────────
  #loadWallet(address, password) {
    if (address) {
      this.#loadKeystore(address, password);
      return;
    }
    const wallets = _EVMWalletProvider.listWallets(this.#walletsDir);
    if (wallets.length === 1) {
      this.#loadKeystore(wallets[0], password);
    } else if (wallets.length > 1) {
      const listRepr = `[${wallets.map((w) => `'${w}'`).join(", ")}]`;
      throw new Error(
        `Multiple wallets found in ${this.#walletsDir}: ${listRepr}. Set WALLET_ADDRESS to specify which one to use.`
      );
    } else {
      this.#createWallet(password);
    }
  }
  #loadKeystore(address, password) {
    const ksPath = join(this.#walletsDir, `${address}.json`);
    if (!existsSync(ksPath)) {
      throw new Error(`Keystore not found: ${ksPath}`);
    }
    try {
      const raw = readFileSync(ksPath, "utf8");
      const keystore = JSON.parse(raw);
      const privateKeyBytes = decryptKeystoreV3(keystore, password);
      const pkHex = `0x${bytesToHex2(privateKeyBytes)}`;
      privateKeyToAccount(pkHex);
      this.#privateKeyHex = pkHex;
      this.#source = "loaded_keystore";
    } catch (e) {
      const err = e;
      if (err.message.startsWith("Failed to decrypt keystore")) {
        throw err;
      }
      throw new Error(`Failed to load keystore ${ksPath}: ${err.message}`);
    }
  }
  #createWallet(password) {
    const pkHex = generatePrivateKey();
    this.#privateKeyHex = pkHex;
    this.#source = "created_new";
    if (this.#persist) {
      this.#saveKeystore(password);
    }
  }
  // ── Save to disk ─────────────────────────────────────────────────────
  #saveKeystore(password) {
    mkdirSync(this.#walletsDir, { recursive: true });
    chmodSync(this.#walletsDir, 448);
    const privateKeyBytes = hexToBytes2(this.#requirePrivateKeyHex().slice(2));
    const keystore = encryptKeystoreV3(privateKeyBytes, password);
    const ksPath = join(
      this.#walletsDir,
      `${this.#requireAccount().address}.json`
    );
    const tmpPath = join(
      this.#walletsDir,
      `.ks_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`
    );
    try {
      writeFileSync(tmpPath, JSON.stringify(keystore), { mode: 384 });
      chmodSync(tmpPath, 384);
      renameSync(tmpPath, ksPath);
    } catch (e) {
      try {
        if (existsSync(tmpPath)) {
          unlinkSync(tmpPath);
        }
      } catch {
      }
      throw e;
    }
  }
  // ── Public API ───────────────────────────────────────────────────────
  #requireAccount() {
    return privateKeyToAccount(this.#requirePrivateKeyHex());
  }
  #requirePrivateKeyHex() {
    if (!this.#privateKeyHex) throw new Error("Wallet has been destroyed");
    return this.#privateKeyHex;
  }
  get address() {
    return this.#requireAccount().address;
  }
  /** Sign a legacy (gasPrice) transaction. */
  async signTransaction(tx) {
    const account = this.#requireAccount();
    const transaction = tx;
    const rawTransaction = await account.signTransaction(transaction);
    const parsed = parseTransaction(rawTransaction);
    const hash3 = keccak256(rawTransaction);
    return {
      rawTransaction,
      hash: hash3,
      r: parsed.r,
      s: parsed.s,
      v: parsed.v
    };
  }
  /** Sign a message using EIP-191 personal sign. */
  async signMessage(message) {
    const account = this.#requireAccount();
    const signature = await account.signMessage({ message });
    const { r, s, v } = parseSignature2(signature);
    return {
      messageHash: hashMessage(message),
      r,
      s,
      v,
      signature
    };
  }
  /**
   * Sign EIP-712 typed data after passing the configured {@link SigningPolicy}.
   *
   * The policy check runs first and may throw
   * {@link import("../signing/errors.js").PolicyViolation}.
   */
  async signTypedData(domain, types, message) {
    check(
      this.#signingPolicy,
      domain,
      types,
      message
    );
    return this.#rawSignTypedData(domain, types, message);
  }
  /**
   * BYPASSES SigningPolicy. Tests + trusted SDK code only.
   *
   * Calls the raw EIP-712 signer without policy enforcement. Every call
   * emits a `console.warn` so audit grep can find bypasses. Production /
   * agent-reachable code MUST NOT call this.
   */
  async _DANGEROUS_signTypedDataNoPolicy(domain, types, message) {
    const caller = _EVMWalletProvider.#callerLocation();
    console.warn(
      `_DANGEROUS_sign_typed_data_no_policy invoked from ${caller} \u2014 POLICY BYPASS`
    );
    return this.#rawSignTypedData(domain, types, message);
  }
  static #callerLocation() {
    const stack = new Error().stack ?? "";
    const lines = stack.split("\n").slice(1);
    const frame = lines.find((l) => !l.includes("evmWalletProvider"));
    return (frame ?? lines[0] ?? "<unknown>").trim();
  }
  async #rawSignTypedData(domain, types, message) {
    const account = this.#requireAccount();
    const messageTypes = Object.fromEntries(
      Object.entries(types).filter(([k]) => k !== "EIP712Domain")
    );
    const primaryType = inferPrimaryType(types);
    const signature = await account.signTypedData({
      domain,
      types: messageTypes,
      primaryType,
      message
    });
    const { r, s, v } = parseSignature2(signature);
    const messageHash = hashTypedData({
      domain,
      types: messageTypes,
      primaryType,
      message
    });
    return { messageHash, r, s, v, signature };
  }
  /** Export the private key in hex format. Handle with extreme care. */
  exportPrivateKey() {
    return this.#requirePrivateKeyHex();
  }
  /** Export the wallet as Keystore V3 JSON (MetaMask/Geth compatible). */
  exportKeystore(password) {
    if (!password) throw new Error("password is required for keystore export");
    const privateKeyBytes = hexToBytes2(this.#requirePrivateKeyHex().slice(2));
    return encryptKeystoreV3(privateKeyBytes, password);
  }
  /** Release the retained key after the caller no longer needs local signing. */
  destroy() {
    this.#privateKeyHex = void 0;
  }
  /** Path of the encrypted Keystore V3 file, or an in-memory marker. */
  get keyLocation() {
    if (!this.#persist) return "in-memory (not persisted)";
    if (!this.#privateKeyHex) return this.#walletsDir;
    return join(this.#walletsDir, `${this.address}.json`);
  }
  /**
   * `true` if an encrypted keystore for this address is on disk.
   *
   * In-memory-only wallets (`persist=false`) have no durable key material
   * and always report `false`.
   */
  exists() {
    if (!this.#persist || !this.#privateKeyHex) return false;
    return _EVMWalletProvider.keystoreExists(this.address, this.#walletsDir);
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/x402/errors.ts
var X402SignerError = class extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "X402SignerError";
  }
};
var X402RecipientMismatchError = class extends X402SignerError {
  constructor(message) {
    super(message);
    this.name = "X402RecipientMismatchError";
  }
};
var X402AmountExceededError = class extends X402SignerError {
  constructor(message, options) {
    super(message, options);
    this.name = "X402AmountExceededError";
  }
};
var X402BudgetExhaustedError = class extends X402SignerError {
  constructor(message) {
    super(message);
    this.name = "X402BudgetExhaustedError";
  }
};
var X402PolicyError = class extends X402SignerError {
  constructor(message, opts) {
    super(
      message,
      opts?.cause !== void 0 ? { cause: opts.cause } : void 0
    );
    this.name = "X402PolicyError";
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/x402/assets.ts
var CAIP2_NETWORK = /^eip155:(56|97)$/;
function parseNetwork(network) {
  if (typeof network === "number") {
    if (!Number.isSafeInteger(network)) {
      throw new TypeError("B402 network chain id must be a safe integer");
    }
    return network;
  }
  if (typeof network !== "string") {
    throw new TypeError(
      "B402 network must be a chain id or CAIP-2 eip155 network"
    );
  }
  const matched = CAIP2_NETWORK.exec(network);
  if (matched?.[1] === void 0) {
    throw new Error(
      `unsupported or malformed B402 network: ${JSON.stringify(network)}`
    );
  }
  return Number(matched[1]);
}
function resolveB402Asset(network, asset) {
  const chainId = parseNetwork(network);
  let catalog;
  if (asset.startsWith("0x")) {
    let checksummed;
    try {
      checksummed = getAddress(asset);
    } catch (error) {
      throw new Error(
        `B402 asset address must be checksummed: ${JSON.stringify(asset)}`,
        {
          cause: error
        }
      );
    }
    if (checksummed !== asset) {
      throw new Error(
        `B402 asset address must be checksummed: ${JSON.stringify(asset)}`
      );
    }
    catalog = getB402AssetByAddress(chainId, asset);
  } else {
    catalog = getB402Asset(chainId, asset);
  }
  return Object.freeze({
    network: `eip155:${chainId}`,
    chainId,
    assetId: catalog.assetId,
    symbol: catalog.symbol,
    address: catalog.address,
    decimals: catalog.decimals,
    b402Methods: catalog.b402Methods,
    b402Kinds: catalog.b402Kinds,
    eip3009Domain: catalog.eip3009Domain,
    isDefault: catalog.isDefault
  });
}
function resolveExpectedEip3009Route(network, asset) {
  const expectedAsset = resolveB402Asset(network, asset);
  const kind = expectedAsset.b402Kinds.find(
    (candidate) => candidate.method === "eip3009"
  );
  const domain = expectedAsset.eip3009Domain;
  if (!expectedAsset.b402Methods.includes("eip3009") || kind === void 0 || domain === null || kind.name !== domain.name || kind.version !== domain.version) {
    throw new Error(
      `asset ${expectedAsset.assetId} has no catalog EIP-3009 signing route`
    );
  }
  return Object.freeze({
    network: expectedAsset.network,
    chainId: expectedAsset.chainId,
    assetId: expectedAsset.assetId,
    address: expectedAsset.address,
    transferMethod: "eip3009",
    name: domain.name,
    version: domain.version
  });
}
function requireExpectedEip3009Route(route) {
  const canonical = resolveExpectedEip3009Route(route.network, route.address);
  if (route.network !== canonical.network || route.chainId !== canonical.chainId || route.assetId !== canonical.assetId || route.address !== canonical.address || route.transferMethod !== canonical.transferMethod || route.name !== canonical.name || route.version !== canonical.version) {
    throw new Error("expected EIP-3009 route does not match the asset catalog");
  }
  return canonical;
}

// packages/bnb-sdk-lab/vendor/typescript/src/x402/budget.ts
function assertNonNegative(amount) {
  if (amount < 0n) {
    throw new X402BudgetExhaustedError(
      `budget amount must be non-negative, got ${amount}`
    );
  }
}
var SessionBudgetTracker = class {
  #caps = /* @__PURE__ */ new Map();
  #spent = /* @__PURE__ */ new Map();
  /**
   * @param caps `{checksumOrRawTokenAddress: maxTotalBaseUnits}`. Addresses
   *   are checksum-normalized on construction; a missing token is treated
   *   as having no cap — i.e. unlimited session spend for that token
   *   (per-call cap is still enforced separately by `X402Signer`).
   */
  constructor(caps) {
    if (caps) {
      for (const [addr, cap] of Object.entries(caps)) {
        this.#caps.set(getAddress(addr), cap);
      }
    }
  }
  capFor(token) {
    const cap = this.#caps.get(getAddress(token));
    return cap ?? null;
  }
  spent(token) {
    return this.#spent.get(getAddress(token)) ?? 0n;
  }
  /**
   * Atomic check-and-increment for the session budget.
   *
   * No `await` occurs between reading `spent`/`cap` and writing the new
   * `spent` value, so two `signPayment` calls racing on the same token
   * cannot both observe the pre-increment `spent` and overspend the cap.
   * The caller performs the slow work (signing) after this returns and
   * calls {@link rollback} on failure to release the reservation.
   *
   * @throws {X402BudgetExhaustedError} If the reservation would exceed the
   *   cap, or if `amount` is negative.
   */
  reserve(token, amount) {
    assertNonNegative(amount);
    const cs = getAddress(token);
    const cap = this.#caps.get(cs);
    const cur = this.#spent.get(cs) ?? 0n;
    if (cap !== void 0 && cur + amount > cap) {
      throw new X402BudgetExhaustedError(
        `value ${amount} would exceed session budget for ${cs} (spent ${cur} / cap ${cap})`
      );
    }
    this.#spent.set(cs, cur + amount);
  }
  /**
   * Release an earlier {@link reserve} (decrement, floored at zero).
   *
   * Pure arithmetic — never throws, even on a redundant double-rollback.
   */
  rollback(token, amount) {
    const cs = getAddress(token);
    const cur = this.#spent.get(cs) ?? 0n;
    const next = cur - amount;
    this.#spent.set(cs, next > 0n ? next : 0n);
  }
};

// packages/bnb-sdk-lab/vendor/typescript/src/x402/signer.ts
var CANONICAL_EIP712_DOMAIN_KEYS = [
  "name",
  "version",
  "chainId",
  "verifyingContract"
];
var CANONICAL_EIP712_DOMAIN_FIELDS = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" }
];
function hasCanonicalEip712Domain(domain, types) {
  const domainKeys = Object.keys(domain);
  if (domainKeys.length !== CANONICAL_EIP712_DOMAIN_KEYS.length || !CANONICAL_EIP712_DOMAIN_KEYS.every((key) => Object.hasOwn(domain, key))) {
    return false;
  }
  const fields = types.EIP712Domain;
  return Array.isArray(fields) && fields.length === CANONICAL_EIP712_DOMAIN_FIELDS.length && fields.every((field, index2) => {
    const canonical = CANONICAL_EIP712_DOMAIN_FIELDS[index2];
    return canonical !== void 0 && Object.keys(field).length === 2 && field.name === canonical.name && field.type === canonical.type;
  });
}
function hasCanonicalEip3009Fields(types) {
  const fields = types.TransferWithAuthorization;
  return Array.isArray(fields) && fields.length === EIP3009_CANONICAL_FIELDS.length && fields.every((field, index2) => {
    const canonical = EIP3009_CANONICAL_FIELDS[index2];
    return canonical !== void 0 && Object.keys(field).length === 2 && field.name === canonical[0] && field.type === canonical[1];
  });
}
var X402Signer = class {
  #wallet;
  #maxValue = /* @__PURE__ */ new Map();
  #budget;
  /**
   * @param wallet The underlying wallet. Anything matching the narrow
   *   {@link TypedDataSigner} shape (`address` + `signTypedData`) works —
   *   no `WalletProvider` inheritance required. The wallet's own
   *   `SigningPolicy` still applies — X402Signer never bypasses it.
   *
   * @throws {UnsupportedWalletOperation} The wallet exposes `supports()`
   *   and reports no `sign.typed_data` capability — rejected here at
   *   composition time, before any payment flow runs. Duck-typed signers
   *   without `supports()` pass through (the runtime sign call is the gate
   *   for those).
   */
  constructor(wallet, opts = {}) {
    const { supports } = wallet;
    if (typeof supports === "function" && !supports.call(wallet, SIGN_TYPED_DATA)) {
      throw new UnsupportedWalletOperation(SIGN_TYPED_DATA, {
        reason: "this wallet cannot sign EIP-712 typed data, so X402Signer cannot produce x402 payment signatures",
        alternative: "use the wallet's delegated x402 payer instead (wallet kinds that sign payments internally, e.g. twak)"
      });
    }
    this.#wallet = wallet;
    if (opts.maxValuePerCall) {
      for (const [addr, cap] of Object.entries(opts.maxValuePerCall)) {
        this.#maxValue.set(getAddress(addr), cap);
      }
    }
    this.#budget = opts.sessionBudget instanceof SessionBudgetTracker ? opts.sessionBudget : new SessionBudgetTracker(opts.sessionBudget);
  }
  get walletAddress() {
    return this.#wallet.address;
  }
  get budget() {
    return this.#budget;
  }
  /**
   * Sign an x402 / EIP-3009 payment after all guards pass.
   *
   * @throws {X402RecipientMismatchError} `message.to` (or `message.from`)
   *   is missing, invalid, or differs from the expected address.
   * @throws {X402AmountExceededError} `message.value` exceeds the per-call
   *   `maxValuePerCall` for this token.
   * @throws {X402BudgetExhaustedError} The session budget would be
   *   exceeded.
   * @throws {X402PolicyError} Wraps an underlying `PolicyViolation` from
   *   the wallet's `SigningPolicy`, or a malformed/missing
   *   `domain.verifyingContract`.
   * @throws {X402AmountExceededError} `message.value` is not a valid integer
   *   amount, is negative, or exceeds the per-call `maxValuePerCall` for this
   *   token.
   */
  async signPayment(opts) {
    const { domain, types, message, expectedRoute, expectedTo } = opts;
    let expected;
    try {
      expected = requireExpectedEip3009Route(expectedRoute);
    } catch (e) {
      throw new X402PolicyError(
        "expected EIP-3009 route is missing, unavailable, or does not match the asset catalog",
        { cause: e }
      );
    }
    let verifying;
    try {
      verifying = getAddress(domain.verifyingContract);
    } catch (e) {
      throw new X402PolicyError(
        `invalid or missing verifyingContract in EIP-712 domain: ${describeValue(domain.verifyingContract)}`,
        { cause: summarizeParserError(e) }
      );
    }
    if (!hasCanonicalEip712Domain(domain, types)) {
      throw new X402PolicyError(
        "typed data does not have the canonical EIP-712 domain (name, version, chainId, verifyingContract)"
      );
    }
    const primaryTypes = Object.keys(types).filter(
      (typeName) => typeName !== "EIP712Domain"
    );
    const domainChainId = domain.chainId;
    const chainMatches = typeof domainChainId === "number" && Number.isSafeInteger(domainChainId) && domainChainId === expected.chainId || typeof domainChainId === "bigint" && domainChainId === BigInt(expected.chainId);
    if (!chainMatches || verifying !== expected.address || domain.name !== expected.name || domain.version !== expected.version || primaryTypes.length !== 1 || primaryTypes[0] !== "TransferWithAuthorization") {
      throw new X402PolicyError(
        "typed data does not match the expected EIP-3009 route (chain, token, method, name, or version)"
      );
    }
    if (!hasCanonicalEip3009Fields(types)) {
      throw new X402PolicyError(
        "types.TransferWithAuthorization does not match the canonical EIP-3009 field shape (from address, to address, value uint256, validAfter uint256, validBefore uint256, nonce bytes32)"
      );
    }
    const msgTo = message.to;
    if (typeof msgTo !== "string") {
      throw new X402RecipientMismatchError(
        `message.to is missing or not an address: ${describeValue(msgTo)}`
      );
    }
    let msgToCs;
    let expectedToCs;
    try {
      msgToCs = getAddress(msgTo);
      expectedToCs = getAddress(expectedTo);
    } catch {
      throw new X402RecipientMismatchError(
        `message.to and expectedTo must be valid addresses: message.to=${describeValue(msgTo)}, expectedTo=${describeValue(expectedTo)}`
      );
    }
    if (msgToCs !== expectedToCs) {
      throw new X402RecipientMismatchError(
        `expectedTo=${expectedToCs} does not match message.to=${msgToCs} \u2014 refusing to sign`
      );
    }
    let value;
    try {
      value = BigInt(message.value ?? 0);
    } catch (e) {
      throw new X402AmountExceededError(
        `message.value is not a valid integer amount: ${describeValue(message.value)}`,
        { cause: summarizeParserError(e) }
      );
    }
    if (value < 0n) {
      throw new X402AmountExceededError(
        `message.value must be non-negative, got ${describeValue(value)}`
      );
    }
    const cap = this.#maxValue.get(verifying);
    if (cap !== void 0 && value > cap) {
      throw new X402AmountExceededError(
        `value ${describeValue(value)} exceeds max_value_per_call=${describeValue(cap)} for token ${verifying}`
      );
    }
    const msgFrom = message.from;
    if (typeof msgFrom !== "string") {
      throw new X402RecipientMismatchError(
        `message.from is missing or not an address: ${describeValue(msgFrom)}`
      );
    }
    let walletCs;
    let msgFromCs;
    try {
      walletCs = getAddress(this.#wallet.address);
      msgFromCs = getAddress(msgFrom);
    } catch {
      throw new X402RecipientMismatchError(
        `message.from is not a valid address: ${describeValue(msgFrom)}`
      );
    }
    if (msgFromCs !== walletCs) {
      throw new X402RecipientMismatchError(
        `message.from=${msgFromCs} does not match wallet ${walletCs} \u2014 refusing to sign`
      );
    }
    this.#budget.reserve(verifying, value);
    try {
      return await this.#wallet.signTypedData(domain, types, message);
    } catch (e) {
      this.#budget.rollback(verifying, value);
      if (e instanceof PolicyViolation) {
        throw new X402PolicyError(e.message, { cause: e });
      }
      throw e;
    }
  }
};
export {
  ContractInterface,
  ERC8004Agent,
  ERC8183Client,
  EVMWalletProvider,
  NETWORKS,
  X402Signer,
  createPublicClient,
  decodeEventLog,
  generatePrivateKey,
  getAddress,
  http,
  keccak256,
  parseAbi,
  parseEther,
  resolveExpectedEip3009Route,
  toHex,
  verifyTypedData
};
/*! For license information please see runtime.mjs.LEGAL.txt */
