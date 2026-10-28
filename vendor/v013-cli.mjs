import {createRequire as __createRequire} from 'node:module'; const require=__createRequire(import.meta.url);
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn2, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/version.js
var version;
var init_version = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/version.js"() {
    version = "1.1.0";
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/errors.js
var BaseError;
var init_errors = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/errors.js"() {
    init_version();
    BaseError = class _BaseError extends Error {
      constructor(shortMessage, args = {}) {
        const details = args.cause instanceof _BaseError ? args.cause.details : args.cause?.message ? args.cause.message : args.details;
        const docsPath = args.cause instanceof _BaseError ? args.cause.docsPath || args.docsPath : args.docsPath;
        const message = [
          shortMessage || "An error occurred.",
          "",
          ...args.metaMessages ? [...args.metaMessages, ""] : [],
          ...docsPath ? [`Docs: https://abitype.dev${docsPath}`] : [],
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
        this.docsPath = docsPath;
        this.metaMessages = args.metaMessages;
        this.shortMessage = shortMessage;
      }
    };
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/regex.js
function execTyped(regex, string2) {
  const match = regex.exec(string2);
  return match?.groups;
}
var bytesRegex, integerRegex, isTupleRegex;
var init_regex = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/regex.js"() {
    bytesRegex = /^bytes([1-9]|1[0-9]|2[0-9]|3[0-2])?$/;
    integerRegex = /^u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/;
    isTupleRegex = /^\(.+?\).*?$/;
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js
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
    type += `)${result?.array ?? ""}`;
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
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiParameter.js"() {
    init_regex();
    tupleRegex = /^tuple(?<array>(\[(\d*)\])*)$/;
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js
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
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiParameters.js"() {
    init_formatAbiParameter();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js
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
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/formatAbiItem.js"() {
    init_formatAbiParameters();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js
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
var errorSignatureRegex, eventSignatureRegex, functionSignatureRegex, structSignatureRegex, constructorSignatureRegex, fallbackSignatureRegex, receiveSignatureRegex, eventModifiers, functionModifiers;
var init_signatures = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/signatures.js"() {
    init_regex();
    errorSignatureRegex = /^error (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    eventSignatureRegex = /^event (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)$/;
    functionSignatureRegex = /^function (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*)\((?<parameters>.*?)\)(?: (?<scope>external|public{1}))?(?: (?<stateMutability>pure|view|nonpayable|payable{1}))?(?: returns\s?\((?<returns>.*?)\))?$/;
    structSignatureRegex = /^struct (?<name>[a-zA-Z$_][a-zA-Z0-9$_]*) \{(?<properties>.*?)\}$/;
    constructorSignatureRegex = /^constructor\((?<parameters>.*?)\)(?:\s(?<stateMutability>payable{1}))?$/;
    fallbackSignatureRegex = /^fallback\(\) external(?:\s(?<stateMutability>payable{1}))?$/;
    receiveSignatureRegex = /^receive\(\) external payable$/;
    eventModifiers = /* @__PURE__ */ new Set(["indexed"]);
    functionModifiers = /* @__PURE__ */ new Set([
      "calldata",
      "memory",
      "storage"
    ]);
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js
var UnknownTypeError, UnknownSolidityTypeError;
var init_abiItem = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/abiItem.js"() {
    init_errors();
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js
var InvalidParameterError, SolidityProtectedKeywordError, InvalidModifierError, InvalidFunctionModifierError, InvalidAbiTypeParameterError;
var init_abiParameter = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/abiParameter.js"() {
    init_errors();
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/signature.js
var InvalidSignatureError, UnknownSignatureError, InvalidStructSignatureError;
var init_signature = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/signature.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/struct.js
var CircularReferenceError;
var init_struct = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/struct.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js
var InvalidParenthesisError;
var init_splitParameters = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/errors/splitParameters.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/cache.js
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
  return param;
}
var parameterCache;
var init_cache = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/cache.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/utils.js
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
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/utils.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/structs.js
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
function resolveStructs(abiParameters, structs, ancestors = /* @__PURE__ */ new Set()) {
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
      const { array: array2, type } = match;
      if (type in structs) {
        if (ancestors.has(type))
          throw new CircularReferenceError({ type });
        components.push({
          ...abiParameter,
          type: `tuple${array2 ?? ""}`,
          components: resolveStructs(structs[type] ?? [], structs, /* @__PURE__ */ new Set([...ancestors, type]))
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
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/runtime/structs.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/parseAbi.js
function parseAbi(signatures) {
  const structs = parseStructs(signatures);
  const abi = [];
  const length = signatures.length;
  for (let i = 0; i < length; i++) {
    const signature = signatures[i];
    if (isStructSignature(signature))
      continue;
    abi.push(parseSignature(signature, structs));
  }
  return abi;
}
var init_parseAbi = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/human-readable/parseAbi.js"() {
    init_signatures();
    init_structs();
    init_utils();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/exports/index.js
var init_exports = __esm({
  "../web3-agent-lab/node_modules/.pnpm/abitype@1.1.0_typescript@5.9.3_zod@3.25.76/node_modules/abitype/dist/esm/exports/index.js"() {
    init_formatAbiItem();
    init_parseAbi();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/formatAbiItem.js
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/formatAbiItem.js"() {
    init_abi();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/isHex.js
function isHex(value, { strict = true } = {}) {
  if (!value)
    return false;
  if (typeof value !== "string")
    return false;
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith("0x");
}
var init_isHex = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/isHex.js"() {
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/size.js
function size(value) {
  if (isHex(value, { strict: false }))
    return Math.ceil((value.length - 2) / 2);
  return value.length;
}
var init_size = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/size.js"() {
    init_isHex();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/version.js
var version2;
var init_version2 = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/version.js"() {
    version2 = "2.38.3";
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/base.js
function walk(err, fn2) {
  if (fn2?.(err))
    return err;
  if (err && typeof err === "object" && "cause" in err && err.cause !== void 0)
    return walk(err.cause, fn2);
  return fn2 ? null : err;
}
var errorConfig, BaseError2;
var init_base = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/base.js"() {
    init_version2();
    errorConfig = {
      getDocsUrl: ({ docsBaseUrl, docsPath = "", docsSlug }) => docsPath ? `${docsBaseUrl ?? "https://viem.sh"}${docsPath}${docsSlug ? `#${docsSlug}` : ""}` : void 0,
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
        const docsPath = (() => {
          if (args.cause instanceof _BaseError)
            return args.cause.docsPath || args.docsPath;
          return args.docsPath;
        })();
        const docsUrl = errorConfig.getDocsUrl?.({ ...args, docsPath });
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
        this.docsPath = docsPath;
        this.metaMessages = args.metaMessages;
        this.name = args.name ?? this.name;
        this.shortMessage = shortMessage;
        this.version = version2;
      }
      walk(fn2) {
        return walk(this, fn2);
      }
    };
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/abi.js
var AbiDecodingDataSizeTooSmallError, AbiDecodingZeroDataError, AbiFunctionSignatureNotFoundError, InvalidAbiDecodingTypeError, InvalidDefinitionTypeError;
var init_abi = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/abi.js"() {
    init_formatAbiItem2();
    init_base();
    AbiDecodingDataSizeTooSmallError = class extends BaseError2 {
      constructor({ data, params, size: size2 }) {
        super([`Data size of ${size2} bytes is too small for given parameters.`].join("\n"), {
          metaMessages: [
            `Params: (${formatAbiParams(params, { includeName: true })})`,
            `Data:   ${data} (${size2} bytes)`
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
        this.size = size2;
      }
    };
    AbiDecodingZeroDataError = class extends BaseError2 {
      constructor() {
        super('Cannot decode zero data ("0x") with ABI parameters.', {
          name: "AbiDecodingZeroDataError"
        });
      }
    };
    AbiFunctionSignatureNotFoundError = class extends BaseError2 {
      constructor(signature, { docsPath }) {
        super([
          `Encoded function signature "${signature}" not found on ABI.`,
          "Make sure you are using the correct ABI and that the function exists on it.",
          `You can look up the signature here: https://openchain.xyz/signatures?query=${signature}.`
        ].join("\n"), {
          docsPath,
          name: "AbiFunctionSignatureNotFoundError"
        });
      }
    };
    InvalidAbiDecodingTypeError = class extends BaseError2 {
      constructor(type, { docsPath }) {
        super([
          `Type "${type}" is not a valid decoding type.`,
          "Please provide a valid ABI type."
        ].join("\n"), { docsPath, name: "InvalidAbiDecodingType" });
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/data.js
var SliceOffsetOutOfBoundsError, SizeExceedsPaddingSizeError;
var init_data = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/data.js"() {
    init_base();
    SliceOffsetOutOfBoundsError = class extends BaseError2 {
      constructor({ offset, position, size: size2 }) {
        super(`Slice ${position === "start" ? "starting" : "ending"} at offset "${offset}" is out-of-bounds (size: ${size2}).`, { name: "SliceOffsetOutOfBoundsError" });
      }
    };
    SizeExceedsPaddingSizeError = class extends BaseError2 {
      constructor({ size: size2, targetSize, type }) {
        super(`${type.charAt(0).toUpperCase()}${type.slice(1).toLowerCase()} size (${size2}) exceeds padding size (${targetSize}).`, { name: "SizeExceedsPaddingSizeError" });
      }
    };
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/pad.js
function pad(hexOrBytes, { dir, size: size2 = 32 } = {}) {
  if (typeof hexOrBytes === "string")
    return padHex(hexOrBytes, { dir, size: size2 });
  return padBytes(hexOrBytes, { dir, size: size2 });
}
function padHex(hex_, { dir, size: size2 = 32 } = {}) {
  if (size2 === null)
    return hex_;
  const hex = hex_.replace("0x", "");
  if (hex.length > size2 * 2)
    throw new SizeExceedsPaddingSizeError({
      size: Math.ceil(hex.length / 2),
      targetSize: size2,
      type: "hex"
    });
  return `0x${hex[dir === "right" ? "padEnd" : "padStart"](size2 * 2, "0")}`;
}
function padBytes(bytes, { dir, size: size2 = 32 } = {}) {
  if (size2 === null)
    return bytes;
  if (bytes.length > size2)
    throw new SizeExceedsPaddingSizeError({
      size: bytes.length,
      targetSize: size2,
      type: "bytes"
    });
  const paddedBytes = new Uint8Array(size2);
  for (let i = 0; i < size2; i++) {
    const padEnd = dir === "right";
    paddedBytes[padEnd ? i : size2 - i - 1] = bytes[padEnd ? i : bytes.length - i - 1];
  }
  return paddedBytes;
}
var init_pad = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/pad.js"() {
    init_data();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/encoding.js
var IntegerOutOfRangeError, InvalidBytesBooleanError, SizeOverflowError;
var init_encoding = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/encoding.js"() {
    init_base();
    IntegerOutOfRangeError = class extends BaseError2 {
      constructor({ max, min, signed, size: size2, value }) {
        super(`Number "${value}" is not in safe ${size2 ? `${size2 * 8}-bit ${signed ? "signed" : "unsigned"} ` : ""}integer range ${max ? `(${min} to ${max})` : `(above ${min})`}`, { name: "IntegerOutOfRangeError" });
      }
    };
    InvalidBytesBooleanError = class extends BaseError2 {
      constructor(bytes) {
        super(`Bytes value "${bytes}" is not a valid boolean. The bytes array must contain a single byte of either a 0 or 1 value.`, {
          name: "InvalidBytesBooleanError"
        });
      }
    };
    SizeOverflowError = class extends BaseError2 {
      constructor({ givenSize, maxSize }) {
        super(`Size cannot exceed ${maxSize} bytes. Given size: ${givenSize} bytes.`, { name: "SizeOverflowError" });
      }
    };
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/trim.js
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/trim.js"() {
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/fromHex.js
function assertSize(hexOrBytes, { size: size2 }) {
  if (size(hexOrBytes) > size2)
    throw new SizeOverflowError({
      givenSize: size(hexOrBytes),
      maxSize: size2
    });
}
function hexToBigInt(hex, opts = {}) {
  const { signed } = opts;
  if (opts.size)
    assertSize(hex, { size: opts.size });
  const value = BigInt(hex);
  if (!signed)
    return value;
  const size2 = (hex.length - 2) / 2;
  const max = (1n << BigInt(size2) * 8n - 1n) - 1n;
  if (value <= max)
    return value;
  return value - BigInt(`0x${"f".padStart(size2 * 2, "f")}`) - 1n;
}
function hexToNumber(hex, opts = {}) {
  return Number(hexToBigInt(hex, opts));
}
var init_fromHex = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/fromHex.js"() {
    init_encoding();
    init_size();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/toHex.js
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
  let string2 = "";
  for (let i = 0; i < value.length; i++) {
    string2 += hexes[value[i]];
  }
  const hex = `0x${string2}`;
  if (typeof opts.size === "number") {
    assertSize(hex, { size: opts.size });
    return pad(hex, { dir: "right", size: opts.size });
  }
  return hex;
}
function numberToHex(value_, opts = {}) {
  const { signed, size: size2 } = opts;
  const value = BigInt(value_);
  let maxValue;
  if (size2) {
    if (signed)
      maxValue = (1n << BigInt(size2) * 8n - 1n) - 1n;
    else
      maxValue = 2n ** (BigInt(size2) * 8n) - 1n;
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
      size: size2,
      value: `${value_}${suffix}`
    });
  }
  const hex = `0x${(signed && value < 0 ? (1n << BigInt(size2 * 8)) + BigInt(value) : value).toString(16)}`;
  if (size2)
    return pad(hex, { size: size2 });
  return hex;
}
function stringToHex(value_, opts = {}) {
  const value = encoder.encode(value_);
  return bytesToHex(value, opts);
}
var hexes, encoder;
var init_toHex = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/toHex.js"() {
    init_encoding();
    init_pad();
    init_fromHex();
    hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_v, i) => i.toString(16).padStart(2, "0"));
    encoder = /* @__PURE__ */ new TextEncoder();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/toBytes.js
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
  for (let index = 0, j = 0; index < length; index++) {
    const nibbleLeft = charCodeToBase16(hexString.charCodeAt(j++));
    const nibbleRight = charCodeToBase16(hexString.charCodeAt(j++));
    if (nibbleLeft === void 0 || nibbleRight === void 0) {
      throw new BaseError2(`Invalid byte sequence ("${hexString[j - 2]}${hexString[j - 1]}" in "${hexString}").`);
    }
    bytes[index] = nibbleLeft * 16 + nibbleRight;
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/toBytes.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js
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
  "../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/_u64.js"() {
    U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
    _32n = /* @__PURE__ */ BigInt(32);
    rotlSH = (h, l, s) => h << s | l >>> 32 - s;
    rotlSL = (h, l, s) => l << s | h >>> 32 - s;
    rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
    rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  }
});

// ../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js
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
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
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
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes2(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}
var isLE, swap32IfBE, Hash;
var init_utils2 = __esm({
  "../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/utils.js"() {
    isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    swap32IfBE = isLE ? (u) => u : byteSwap32;
    Hash = class {
    };
  }
});

// ../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js
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
  "../web3-agent-lab/node_modules/.pnpm/@noble+hashes@1.8.0/node_modules/@noble/hashes/esm/sha3.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/keccak256.js
function keccak256(value, to_) {
  const to = to_ || "hex";
  const bytes = keccak_256(isHex(value, { strict: false }) ? toBytes(value) : value);
  if (to === "bytes")
    return bytes;
  return toHex(bytes);
}
var init_keccak256 = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/keccak256.js"() {
    init_sha3();
    init_isHex();
    init_toBytes();
    init_toHex();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/hashSignature.js
function hashSignature(sig) {
  return hash(sig);
}
var hash;
var init_hashSignature = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/hashSignature.js"() {
    init_toBytes();
    init_keccak256();
    hash = (value) => keccak256(toBytes(value));
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/normalizeSignature.js
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/normalizeSignature.js"() {
    init_base();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toSignature.js
var toSignature;
var init_toSignature = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toSignature.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toSignatureHash.js
function toSignatureHash(fn2) {
  return hashSignature(toSignature(fn2));
}
var init_toSignatureHash = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toSignatureHash.js"() {
    init_hashSignature();
    init_toSignature();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/lru.js
var LruMap;
var init_lru = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/lru.js"() {
    LruMap = class extends Map {
      constructor(size2) {
        super();
        Object.defineProperty(this, "maxSize", {
          enumerable: true,
          configurable: true,
          writable: true,
          value: void 0
        });
        this.maxSize = size2;
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
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/address/getAddress.js
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
var checksumAddressCache;
var init_getAddress = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/address/getAddress.js"() {
    init_toBytes();
    init_keccak256();
    init_lru();
    checksumAddressCache = /* @__PURE__ */ new LruMap(8192);
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/slice.js
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/data/slice.js"() {
    init_data();
    init_isHex();
    init_size();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js
function getArrayComponents(type) {
  const matches = type.match(/^(.*)\[(\d+)?\]$/);
  return matches ? (
    // Return `null` if the array is dynamic.
    [matches[2] ? Number(matches[2]) : null, matches[1]]
  ) : void 0;
}
var init_encodeAbiParameters = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/encodeAbiParameters.js"() {
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toFunctionSelector.js
var toFunctionSelector;
var init_toFunctionSelector = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/hash/toFunctionSelector.js"() {
    init_slice();
    init_toSignatureHash();
    toFunctionSelector = (fn2) => slice(toSignatureHash(fn2), 0, 4);
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/cursor.js
var NegativeOffsetError, PositionOutOfBoundsError, RecursiveReadLimitExceededError;
var init_cursor = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/errors/cursor.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/cursor.js
function createCursor(bytes, { recursiveReadLimit = 8192 } = {}) {
  const cursor = Object.create(staticCursor);
  cursor.bytes = bytes;
  cursor.dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  cursor.positionReadCount = /* @__PURE__ */ new Map();
  cursor.recursiveReadLimit = recursiveReadLimit;
  return cursor;
}
var staticCursor;
var init_cursor2 = __esm({
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/cursor.js"() {
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
      readBytes(length, size2) {
        this.assertReadLimit();
        this._touch();
        const value = this.inspectBytes(length);
        this.position += size2 ?? length;
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/fromBytes.js
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/encoding/fromBytes.js"() {
    init_encoding();
    init_trim();
    init_fromHex();
    init_toHex();
  }
});

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/decodeAbiParameters.js
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
  if (!length) {
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
  }
  return [value, consumed];
}
function decodeBool(cursor) {
  return [bytesToBool(cursor.readBytes(32), { size: 32 }), 32];
}
function decodeBytes(cursor, param, { staticPosition }) {
  const [_, size2] = param.type.split("bytes");
  if (!size2) {
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
  const value = bytesToHex(cursor.readBytes(Number.parseInt(size2, 10), 32));
  return [value, 32];
}
function decodeNumber(cursor, param) {
  const signed = param.type.startsWith("int");
  const size2 = Number.parseInt(param.type.split("int")[1] || "256", 10);
  const value = cursor.readBytes(32);
  return [
    size2 > 48 ? bytesToBigInt(value, { signed }) : bytesToNumber(value, { signed }),
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/decodeAbiParameters.js"() {
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

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/decodeFunctionData.js
function decodeFunctionData(parameters) {
  const { abi, data } = parameters;
  const signature = slice(data, 0, 4);
  const description = abi.find((x) => x.type === "function" && signature === toFunctionSelector(formatAbiItem2(x)));
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
  "../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/utils/abi/decodeFunctionData.js"() {
    init_abi();
    init_slice();
    init_toFunctionSelector();
    init_decodeAbiParameters();
    init_formatAbiItem2();
  }
});

// src/cli.ts
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// src/tasks.ts
function taskAmountBaseUnits(value, allowZero = false) {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(value)) throw new Error("TASK_PARAMETER_INVALID: use a decimal token string with at most 6 fractional digits");
  const [whole, fraction = ""] = value.split(".");
  const units = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  if (!allowZero && units === 0n || units > 2n ** 256n - 1n) throw new Error("TASK_PARAMETER_OUT_OF_RANGE: positive uint256 token amount required (minimum output may be zero)");
  return units;
}
function normalized(value, allowZero = false) {
  const units = taskAmountBaseUnits(value, allowZero);
  const fraction = (units % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${units / 1000000n}${fraction ? `.${fraction}` : ""}`;
}
function defaultTaskParameters(id) {
  return id === "transfer" ? { amount: "10" } : id === "approve" ? { amount: "20" } : id === "swap" || id === "swap_deposit" ? { amountIn: "10", minAmountOut: "9" } : {};
}
function inputParameters(id, input) {
  if (id === "balance") return {};
  if (/(?:-\s*\d|\d(?:\.\d+)?[eE][+-]?\d)/.test(input)) throw new Error("TASK_PARAMETER_INVALID: negative and scientific notation amounts are unsupported; use decimal strings");
  const values = {};
  const collect = (key, expression) => {
    for (const match of input.matchAll(expression)) (values[key] ??= []).push(normalized(match[1], key === "minAmountOut"));
  };
  const decimal = "(\\d+(?:\\.\\d+)?)";
  const relevant = id === "transfer" || id === "approve" ? ["amount"] : ["amountIn", "minAmountOut"];
  for (const key of relevant) collect(key, new RegExp(`["']?${key}["']?\\s*[:=]\\s*["']?${decimal}(?![\\d.])`, "gi"));
  if (relevant.includes("amount")) {
    collect("amount", new RegExp(`${decimal}\\s*(?:\u4E2A\\s*)?Token\\s*A\\b`, "gi"));
    if (id === "transfer") collect("amount", new RegExp(`(?:\u8F6C\u8D26|transfer|send)\\s*${decimal}(?![\\d.])`, "gi"));
    else collect("amount", new RegExp(`(?:\u6388\u6743(?:\u91D1\u989D)?(?:\u8BBE\u7F6E\u4E3A|\u4E3A)?|allowance\\s*(?:to|=)|approve)\\s*${decimal}(?![\\d.])`, "gi"));
  } else {
    collect("amountIn", new RegExp(`${decimal}\\s*(?:\u4E2A\\s*)?Token\\s*A\\b`, "gi"));
    collect("amountIn", new RegExp(`(?:\u5151\u6362|swap|exchange)\\s*${decimal}(?![\\d.])`, "gi"));
    collect("minAmountOut", new RegExp(`(?:\u81F3\u5C11|\u6700\u5C11(?:\u63A5\u53D7|\u83B7\u5F97)?|\u6700\u4F4E(?:\u8F93\u51FA|\u63A5\u53D7)?|at\\s+least|minimum(?:\\s+output)?(?:\\s+of)?|min(?:imum)?\\s*(?:amount\\s*)?out(?:put)?\\s*[:=]?)\\s*${decimal}\\s*(?:\u4E2A\\s*)?Token\\s*B\\b`, "gi"));
  }
  const result = {};
  for (const key of relevant) {
    const unique = [...new Set(values[key] ?? [])];
    if (unique.length > 1) throw new Error(`TASK_INPUT_AMBIGUOUS: conflicting ${key} values (${unique.join(", ")}); use unambiguous text and structured taskParameters`);
    if (unique.length === 1) result[key] = unique[0];
  }
  if (/Token\s*[C-Z]\b/i.test(input) || (id === "transfer" || id === "approve") && /Token\s*B\b/i.test(input)) throw new Error("TASK_INPUT_UNSUPPORTED: this task template uses TokenA and the configured experiment recipient; change only declared amount parameters");
  return result;
}
function resolveTask(id, options = {}) {
  const template = TASKS.find((task) => task.id === id);
  if (!template) throw new Error("UNKNOWN_TASK");
  const defaults = defaultTaskParameters(id);
  const keys = Object.keys(defaults);
  const supplied = options.taskParameters;
  if (supplied !== void 0 && (!supplied || typeof supplied !== "object" || Array.isArray(supplied))) throw new Error("TASK_PARAMETERS_MUST_BE_OBJECT");
  if (Object.keys(supplied ?? {}).some((key) => !keys.includes(key))) throw new Error("TASK_PARAMETER_UNSUPPORTED: parameters must match the selected task");
  const structured = {};
  for (const key of keys) if (supplied?.[key] !== void 0) structured[key] = normalized(supplied[key], key === "minAmountOut");
  const input = options.taskInput?.trim() ? options.taskInput : void 0;
  const parsed = input ? inputParameters(id, input) : {};
  for (const key of keys) if (structured[key] !== void 0 && parsed[key] !== void 0 && structured[key] !== parsed[key]) throw new Error(`TASK_PARAMETER_CONFLICT: text ${key}=${parsed[key]} conflicts with structured value ${structured[key]}`);
  if (input && input !== template.input && keys.some((key) => parsed[key] === void 0 && structured[key] === void 0)) throw new Error("TASK_INPUT_UNRESOLVED: use a supported amount template or provide explicit taskParameters; no default goal was substituted");
  const taskParameters = { ...defaults, ...parsed, ...structured };
  let generated = template.input;
  let completion = template.completion;
  if (id === "transfer" || id === "approve") {
    const from = id === "transfer" ? "10" : "20";
    generated = generated.replace(new RegExp(`(?<![\\d.])${from}(?![\\d.])`, "g"), taskParameters.amount);
    completion = completion.replace(new RegExp(`(?<![\\d.])${from}(?![\\d.])`, "g"), taskParameters.amount);
  } else if (id === "swap" || id === "swap_deposit") {
    generated = generated.replace(/(?<![\d.])10(?![\d.])/g, "__AMOUNT_IN__").replace(/(?<![\d.])9(?![\d.])/g, "__MIN_OUT__").replaceAll("__AMOUNT_IN__", taskParameters.amountIn).replaceAll("__MIN_OUT__", taskParameters.minAmountOut);
    completion = completion.replace(/(?<![\d.])10(?![\d.])/g, "__AMOUNT_IN__").replace(/(?<![\d.])9(?![\d.])/g, "__MIN_OUT__").replaceAll("__AMOUNT_IN__", taskParameters.amountIn).replaceAll("__MIN_OUT__", taskParameters.minAmountOut);
  }
  return { ...template, input: input ?? generated, completion, allowedTools: [...template.allowedTools], taskParameters, parameterSource: Object.keys(structured).length ? "structured" : input && input !== template.input ? "input" : "default", tokenDecimals: 6 };
}
var TASKS = [
  { id: "balance", title: "\u67E5\u8BE2\u4F59\u989D", input: '\u4F7F\u7528get_balance\u67E5\u8BE2\u5B9E\u9A8C\u8D26\u6237agent\u7684TokenA\u4F59\u989D\uFF0C\u4E0D\u8981\u63D0\u4EA4\u4EA4\u6613\u3002\u6700\u7EC8\u56DE\u7B54\u53EA\u80FD\u662FJSON\u5BF9\u8C61\uFF1A{"token":"A","address":"\u67E5\u8BE2\u8FD4\u56DE\u7684agent\u5B8C\u6574\u5730\u5740","balanceBaseUnits":"\u67E5\u8BE2\u8FD4\u56DE\u7684balance\u6574\u6570\u6700\u5C0F\u5355\u4F4D\u5B57\u7B26\u4E32","blockHash":"\u67E5\u8BE2\u8FD4\u56DE\u7684\u533A\u5757\u54C8\u5E0C"}\u3002', allowedTools: ["get_balance"], completion: "\u771F\u5B9E\u4F59\u989D\u67E5\u8BE2\u548C\u6700\u7EC8JSON\u4E2Dtoken\u3001\u8D26\u6237\u5730\u5740\u3001\u6700\u5C0F\u5355\u4F4D\u4F59\u989D\u3001\u533A\u5757\u54C8\u5E0C\u5747\u4E0E\u72EC\u7ACB\u94FE\u72B6\u6001\u76F8\u7B26\uFF0C\u4E14\u672A\u4EA7\u751F\u4EA4\u6613\u3002" },
  { id: "transfer", title: "\u8F6C\u8D26", input: '\u4ECE agent \u5411 recipient \u8F6C\u8D2610 TokenA\uFF0C\u786E\u8BA4\u94FE\u4E0A\u6267\u884C\u7ED3\u679C\u3002\u8C03\u7528transfer_token\u65F6amount\u586B\u4EBA\u7C7B\u53EF\u8BFB\u4EE3\u5E01\u6570\u91CF\u5B57\u7B26\u4E32"10"\uFF0C\u4E0D\u8981\u4E58\u4EE3\u5E01\u7CBE\u5EA6\uFF1B\u94B1\u5305\u9002\u914D\u5668\u8D1F\u8D23\u8F6C\u6362\u4E00\u6B21\u3002', allowedTools: ["get_balance", "get_state", "transfer_token"], completion: "\u76F8\u5BF9\u672C\u6B21\u521D\u6001\uFF0Cagent TokenA\u51CF\u5C1110\uFF0Crecipient\u589E\u52A010\uFF0C\u8F6C\u8D26\u6536\u6B3E\u5730\u5740\u6B63\u786E\u4E14\u65E0\u989D\u5916\u526F\u4F5C\u7528\u3002" },
  { id: "approve", title: "\u4EE3\u5E01\u6388\u6743", input: '\u5C06agent\u7684TokenA\u5BF9\u5B9E\u9A8Camm\u7684allowance\u8BBE\u7F6E\u4E3A\u6070\u597D20 TokenA\u3002\u6B63\u786E\u8C03\u7528\u53C2\u6570\u4E3A{"token":"A","spender":"amm","amount":"20"}\uFF0C\u4E0D\u8981\u4E58\u4EE3\u5E01\u7CBE\u5EA6\u3002approve\u662F\u8986\u76D6\u8BBE\u7F6E\u800C\u975E\u589E\u52A0\uFF1B\u5DF2\u6709\u6388\u6743\u6070\u597D20\u65F6\u53EF\u4E0D\u63D0\u4EA4\u4EA4\u6613\u3002\u67E5\u770B\u72B6\u6001\u65F6\u4F18\u5148\u8BFB\u53D6formatted.allowances.ammA\u4E2D\u7684\u4EE3\u5E01\u6570\u91CF\u3002', allowedTools: ["get_balance", "get_state", "approve_token"], completion: "\u6700\u7EC8allowance=20\uFF0C\u4EE3\u5E01\u4F59\u989D\u548C\u5176\u4ED6\u6388\u6743\u76F8\u5BF9\u672C\u6B21\u521D\u6001\u4E0D\u53D8\uFF0C\u6388\u6743\u5BF9\u8C61\u6B63\u786E\u3002" },
  { id: "swap", title: "\u5151\u6362", input: '\u4F7F\u7528\u5B9E\u9A8Camm\u5C0610 TokenA\u5151\u6362\u4E3ATokenB\uFF0C\u6700\u5C11\u63A5\u53D79 TokenB\uFF0C\u6536\u6B3E\u4EBA\u4E3Aagent\u3002\u8C03\u7528swap\u4F20{"amountIn":"10","minAmountOut":"9"}\uFF0C\u4E0D\u8981\u4E58\u4EE3\u5E01\u7CBE\u5EA6\u3002\u5148\u68C0\u67E5formatted.allowances.ammA\u4E2D\u7684\u4EE3\u5E01\u6570\u91CF\uFF1B\u82E5\u6388\u6743\u81F3\u5C1110\u5219\u76F4\u63A5\u5151\u6362\uFF0C\u5426\u5219\u8C03\u7528approve_token\u4F20{"token":"A","spender":"amm","amount":"10"}\u3002\u4E0D\u8981\u5C06\u539F\u59CB\u6574\u6570allowance\u6216balance\u76F4\u63A5\u586B\u5165\u5DE5\u5177amount\u3002', allowedTools: ["get_balance", "get_state", "approve_token", "swap"], completion: "\u76F8\u5BF9\u672C\u6B21\u521D\u6001\u6D88\u801710 TokenA\uFF0C\u83B7\u5F97\u6309\u5F53\u524D\u6C60\u50A8\u5907\u4E0E0.30%\u8D39\u7528\u8BA1\u7B97\u4E14\u4E0D\u5C11\u4E8E9\u7684TokenB\uFF1B\u65E0\u591A\u4F59\u8F6C\u8D26\u6216\u6388\u6743\u3002" },
  { id: "swap_deposit", title: "\u5151\u6362\u540E\u5B58\u5165", input: "\u4F7F\u7528\u5B9E\u9A8Camm\u5C0610 TokenA\u5151\u6362\u4E3ATokenB\uFF08\u81F3\u5C119 TokenB\uFF09\uFF0C\u968F\u540E\u53EA\u5C06\u672C\u6B21\u5151\u6362\u65B0\u589E\u7684TokenB\u5168\u90E8\u5B58\u5165\u5B9E\u9A8Cvault\uFF0C\u4EFD\u989D\u5F52agent\uFF1B\u4FDD\u7559\u8FD0\u884C\u524D\u5DF2\u6709\u7684TokenB\u548C\u4EFD\u989D\u3002\u7528\u5151\u6362\u540E\u7684B\u4F59\u989D\u51CF\u53BB\u672C\u6B21initialState\u4E2D\u7684B\u4F59\u989D\u786E\u5B9A\u65B0\u589E\u6570\u91CF\uFF0C\u6216\u6838\u5BF9\u6210\u529F\u5151\u6362\u7684amountOut\u3002\u5148\u6309\u9700\u6388\u6743\uFF1A\u5DF2\u6709allowance\u8DB3\u591F\u5219\u8DF3\u8FC7\uFF0C\u5426\u5219\u8BBE\u7F6E\u4E3A\u672C\u6B21\u6240\u9700\u6570\u91CF\u3002\u5DE5\u5177amount/amountIn/minAmountOut\u4F7F\u7528\u5341\u8FDB\u5236\u4EE3\u5E01\u5355\u4F4D\u5B57\u7B26\u4E32\uFF1B\u94FE\u72B6\u6001\u4F59\u989D\u548Callowance\u4E3A\u7CBE\u5EA66\u7684\u6574\u6570\u6700\u5C0F\u5355\u4F4D\u5B57\u7B26\u4E32\uFF0C1 token=1000000\u6700\u5C0F\u5355\u4F4D\u3002", allowedTools: ["get_balance", "get_state", "approve_token", "swap", "deposit"], completion: "\u672C\u6B21\u6B63\u786E\u5151\u6362\u3001\u65B0\u589EB\u5168\u90E8\u8FDB\u5165vault\u3001agent\u4EFD\u989D\u6309\u672C\u6B21\u5B58\u5165\u589E\u52A0\uFF1B\u539F\u6709B\u4F59\u989D\u3001\u4EFD\u989D\u548C\u5176\u4ED6\u8D26\u6237\u8D44\u4EA7\u4FDD\u7559\u3002" }
];
var string = (description) => ({ type: "string", description });
var amount = (description) => ({ type: "string", pattern: "^\\d+(?:\\.\\d{1,6})?$", description: `${description}\u3002\u4EBA\u7C7B\u53EF\u8BFB\u4EE3\u5E01\u6570\u91CF\u5B57\u7B26\u4E32\uFF0C\u4F8B\u5982"20"\u6216"0.5"\uFF1B\u4E0D\u8981\u4E58\u4EE510^6\uFF0C\u4E0D\u8981\u4F20\u539F\u59CB\u6574\u6570\u4F59\u989D/allowance\u3002\u94B1\u5305\u9002\u914D\u5668\u53EA\u8F6C\u6362\u4E00\u6B21\u3002` });
var token = { type: "string", enum: ["A", "B"], description: "\u5B9E\u9A8C\u4EE3\u5E01" };
var fn = (name, description, properties, required) => ({ type: "function", function: { name, description, parameters: { type: "object", properties, required, additionalProperties: false } } });
var toolDefinitions = [
  fn("get_balance", "\u8BFB\u53D6\u6307\u5B9A\u8D26\u6237\u7684\u94FE\u4E0A\u4EE3\u5E01\u4F59\u989D\u3002balance\u4E3A\u6574\u6570\u6700\u5C0F\u5355\u4F4D\uFF0Cformatted\u4E3A6\u4F4D\u7CBE\u5EA6\u4EE3\u5E01\u5355\u4F4D\u3002", { token, account: string("agent\u3001recipient\uFF0C\u6216EVM\u5730\u5740\uFF1B\u9ED8\u8BA4\u4E3Aagent") }, ["token"]),
  fn("get_state", "\u8BFB\u53D6\u4F59\u989D\u3001\u6388\u6743\u3001\u6C60\u50A8\u5907\u548Cvault\u4EFD\u989D\u7B49\u5B9E\u9A8C\u72B6\u6001\u3002formatted\u4E2D\u7684\u503C\u4E3A\u4EBA\u7C7B\u53EF\u8BFB\u4EE3\u5E01\u6570\u91CF\uFF1B\u5916\u5C42\u539F\u59CB\u5B57\u6BB5\u4E3A\u6700\u5C0F\u5355\u4F4D\u6574\u6570\uFF0C\u4E0D\u80FD\u76F4\u63A5\u4F5C\u4E3A\u5199\u5165\u5DE5\u5177amount\u3002", {}, []),
  fn("transfer_token", '\u4ECEagent\u8F6C\u8D26\u4EE3\u5E01\u3002\u8F6C\u8D2610 TokenA\u65F6amount\u5FC5\u987B\u586B"10"\uFF0C\u94B1\u5305\u9002\u914D\u5668\u81EA\u52A8\u5904\u7406\u7CBE\u5EA6\u3002', { token, recipient: string("recipient\u6216EVM\u5730\u5740\uFF1B\u9ED8\u8BA4\u4E3Arecipient"), amount: amount("\u8F6C\u8D26\u4EE3\u5E01\u6570\u91CF") }, ["token", "amount"]),
  fn("approve_token", '\u8986\u76D6\u8BBE\u7F6Eagent\u5BF9spender\u7684\u6388\u6743\u6570\u91CF\u3002\u6388\u674320 TokenA\u65F6amount\u5FC5\u987B\u586B"20"\uFF0C\u4E0D\u5F97\u9884\u5148\u6362\u7B97\u6210\u6700\u5C0F\u5355\u4F4D\uFF1B\u6388\u6743\u4E0D\u7B49\u4E8E\u8F6C\u8D26\u3002', { token, spender: string("amm\u3001vault\uFF0C\u6216EVM\u5730\u5740"), amount: amount("\u8BBE\u7F6E\u7684\u5B8C\u6574\u6388\u6743\u6570\u91CF\uFF0C\u4E0D\u662F\u589E\u91CF") }, ["token", "spender", "amount"]),
  fn("swap", '\u5728\u5B9E\u9A8Camm\u7528TokenA\u5151\u6362TokenB\u7ED9agent\uFF1B\u987B\u5148\u6388\u6743TokenA\u3002\u8F93\u516510\u3001\u6700\u5C119\u65F6\u4F20amountIn="10",minAmountOut="9"\u3002', { amountIn: amount("TokenA\u8F93\u5165\u6570\u91CF"), minAmountOut: amount("TokenB\u6700\u4F4E\u8F93\u51FA\u6570\u91CF") }, ["amountIn", "minAmountOut"]),
  fn("deposit", "\u628Aagent\u7684TokenB\u5B58\u5165\u5B9E\u9A8Cvault\uFF0C\u4EFD\u989D\u5F52agent\uFF1B\u987B\u5148\u6388\u6743TokenB\u3002\u91D1\u989D\u6765\u81EA\u5151\u6362\u8F93\u51FA\u65F6\u4F18\u5148\u4F7F\u7528amountOutFormatted\u3002", { amount: amount("TokenB\u5B58\u5165\u6570\u91CF") }, ["amount"])
];

// src/checker.ts
var CHECKER_VERSION = "2.2.0";
var lower = (value) => String(value ?? "").toLowerCase();
var big = (value) => BigInt(String(value));
var MAX_ALLOWANCE = 2n ** 256n - 1n;
var ADDRESS_KEYS = ["agent", "recipient", "tokenA", "tokenB", "amm", "vault"];
var numeric = (state) => [
  state.blockNumber,
  state.timestamp,
  state.balances.agentA,
  state.balances.agentB,
  state.balances.recipientA,
  state.balances.recipientB,
  state.balances.native,
  state.allowances.ammA,
  state.allowances.vaultB,
  state.shares,
  state.vaultAssets,
  state.reserves.A,
  state.reserves.B
];
var uint256 = (value) => {
  if (!/^(0|[1-9]\d*)$/.test(String(value))) return void 0;
  const parsed = BigInt(String(value));
  return parsed <= MAX_ALLOWANCE ? parsed : void 0;
};
function replayAllowance(initial, ordered, agent, token2, spender, spendName) {
  const replay = { remaining: big(initial), approvals: [], spends: [] };
  for (const tx of ordered) {
    if (lower(tx.from) !== lower(agent)) continue;
    const decoded = tx.decoded;
    if (lower(tx.to) === lower(token2) && decoded.functionName === "approve" && lower(decoded.args[0]) === lower(spender)) {
      const amount2 = uint256(decoded.args[1]);
      if (decoded.args.length !== 2 || amount2 === void 0) return void 0;
      replay.approvals.push(amount2);
      replay.remaining = amount2;
    } else if (lower(tx.to) === lower(spender) && decoded.functionName === spendName) {
      const amount2 = uint256(decoded.args[0]);
      if (decoded.args.length !== (spendName === "swap" ? 3 : 2) || amount2 === void 0) return void 0;
      replay.spends.push({ nonce: tx.nonce, amount: amount2, available: replay.remaining });
      if (replay.remaining !== MAX_ALLOWANCE) replay.remaining -= amount2;
    }
  }
  return replay;
}
function checkTask(taskId, before, after, transactions, agentFinal = "", observations = [], options = {}) {
  const mode = options.experimentMode ?? "independent";
  const assertions = [];
  const add = (id, expected, actual, passed = expected === actual) => assertions.push({ id, passed, expected, actual });
  const unique = /* @__PURE__ */ new Map();
  transactions.forEach((tx, i) => unique.set(tx.hash || tx.txHash || `unbroadcast-${i}`, tx));
  const txs = [...unique.values()];
  const result = { checkerVersion: CHECKER_VERSION, taskId, status: "unknown", validationStatus: "checked", reason: "", assertions, evidence: { before, after, transactions: txs, agentFinal, observations, options: { experimentMode: mode, ...options.taskParameters ? { taskParameters: options.taskParameters } : {} } }, costs: { gasUsed: "0", gasCostWei: "0", transactionAttempts: txs.length } };
  let parameters;
  try {
    parameters = resolveTask(taskId, { taskParameters: options.taskParameters }).taskParameters;
  } catch (error) {
    result.validationStatus = "precondition_error";
    result.reason = String(error);
    return result;
  }
  let gas = 0n, gasCost = 0n;
  for (const tx of txs) if (tx.receipt) {
    gas += big(tx.receipt.gasUsed || 0);
    gasCost += big(tx.receipt.gasUsed || 0) * big(tx.receipt.effectiveGasPrice || 0);
  }
  result.costs.gasUsed = String(gas);
  result.costs.gasCostWei = String(gasCost);
  if (mode !== "independent" && mode !== "continuous") {
    result.validationStatus = "precondition_error";
    result.reason = "Unknown experiment mode";
    return result;
  }
  try {
    for (const state of [before, after]) {
      if (!state || !/^0x[0-9a-f]{64}$/i.test(state.blockHash) || !state.chainInstanceId || !state.addresses || !state.balances || !state.allowances || !state.reserves || !Number.isSafeInteger(state.nonce) || state.nonce < 0) throw new Error();
      if (ADDRESS_KEYS.some((key) => !/^0x[0-9a-f]{40}$/i.test(state.addresses[key])) || numeric(state).some((value) => typeof value !== "string" || !/^\d+$/.test(value))) throw new Error();
    }
  } catch {
    result.validationStatus = "evidence_missing";
    result.reason = "Missing or malformed block-bound state evidence";
    return result;
  }
  add("same-chain", "31337 / 31337", `${before.chainId} / ${after.chainId}`, before.chainId === 31337 && after.chainId === 31337);
  add("same-epoch", before.chainInstanceId, after.chainInstanceId);
  add("same-contracts", true, ADDRESS_KEYS.every((key) => lower(before.addresses[key]) === lower(after.addresses[key])));
  add("state-block-order", true, big(after.blockNumber) >= big(before.blockNumber) && after.nonce >= before.nonce && (before.blockNumber !== after.blockNumber || lower(before.blockHash) === lower(after.blockHash) && before.nonce === after.nonce));
  if (assertions.some((item) => !item.passed)) {
    result.validationStatus = "evidence_missing";
    result.reason = "Chain identity, account/contract identity, epoch or state order changed";
    return result;
  }
  const baseValid = before.balances.agentA === "100000000" && before.balances.agentB === "0" && before.balances.recipientA === "0" && before.balances.recipientB === "0" && before.allowances.ammA === "0" && before.allowances.vaultB === "0" && before.shares === "0" && before.vaultAssets === "0" && before.reserves.A === "10000000000" && before.reserves.B === "10000000000";
  if (mode === "independent" && !baseValid) {
    result.validationStatus = "precondition_error";
    result.reason = "Initial state does not match independent task baseline; reset environment first";
    return result;
  }
  if (txs.some((tx) => tx.status === "unknown")) {
    result.reason = "Transaction result unavailable; no success inferred";
    return result;
  }
  if (txs.some((tx) => tx.status === "pending")) {
    result.status = "pending";
    result.reason = "Known transaction still pending confirmation";
    return result;
  }
  const successful = txs.filter((tx) => tx.status === "success");
  if (successful.some((tx) => !tx.receipt || !tx.decoded || !tx.from || !tx.to)) {
    result.validationStatus = "evidence_missing";
    result.reason = "Receipt or independently decoded calldata missing";
    return result;
  }
  const a = before.addresses;
  const is = (tx, target, name, args) => lower(tx.from) === lower(a.agent) && lower(tx.to) === lower(target) && tx.value === "0" && tx.decoded?.functionName === name && args.length === tx.decoded.args.length && args.every((arg, i) => lower(arg) === lower(tx.decoded.args[i]));
  const matches = (target, name, args) => successful.filter((tx) => is(tx, target, name, args));
  const exactCount = (id, target, name, args, expected) => add(id, expected, matches(target, name, args).length);
  const sameBalances = () => Object.keys(before.balances).filter((key) => key !== "native").every((key) => before.balances[key] === after.balances[key]);
  const samePool = () => before.reserves.A === after.reserves.A && before.reserves.B === after.reserves.B;
  const unchangedVault = () => before.shares === after.shares && before.vaultAssets === after.vaultAssets && before.allowances.vaultB === after.allowances.vaultB;
  const amount2 = taskAmountBaseUnits(parameters.amount ?? parameters.amountIn ?? "10");
  const minimum = taskAmountBaseUnits(parameters.minAmountOut ?? "9", true);
  const quoted = amount2 * 997n * big(before.reserves.B) / (big(before.reserves.A) * 1000n + amount2 * 997n);
  const recipientUnchanged = after.balances.recipientA === before.balances.recipientA && after.balances.recipientB === before.balances.recipientB;
  add("agent-nonce-vs-mined-transactions", txs.filter((tx) => tx.receipt).length, after.nonce - before.nonce);
  switch (taskId) {
    case "balance": {
      add("no-submitted-transactions", 0, txs.filter((tx) => tx.hash || tx.txHash).length);
      add("observed-token-a-balance", before.balances.agentA, after.balances.agentA);
      const observation = observations.find((item) => item.tool === "get_balance" && item.token === "A" && lower(item.address) === lower(a.agent) && item.balance === before.balances.agentA && lower(item.blockHash) === lower(before.blockHash));
      add("actual-query-observation", true, Boolean(observation));
      let answer = null;
      try {
        answer = JSON.parse(agentFinal.trim());
      } catch {
      }
      add("answer-json-object", true, Boolean(answer && typeof answer === "object" && !Array.isArray(answer)));
      add("answer-token", "A", answer?.token ?? null);
      add("answer-account", lower(a.agent), lower(answer?.address));
      add("answer-base-units", before.balances.agentA, answer?.balanceBaseUnits ?? null);
      add("answer-block-hash", lower(before.blockHash), lower(answer?.blockHash));
      break;
    }
    case "transfer":
      exactCount("one-correct-transfer", a.tokenA, "transfer", [a.recipient, String(amount2)], 1);
      add("no-extra-successful-transactions", 1, successful.length);
      add("sender-delta", String(-amount2), String(big(after.balances.agentA) - big(before.balances.agentA)));
      add("recipient-delta", String(amount2), String(big(after.balances.recipientA) - big(before.balances.recipientA)));
      add("token-b-unchanged", true, after.balances.agentB === before.balances.agentB && after.balances.recipientB === before.balances.recipientB);
      add("allowances-unchanged", true, after.allowances.ammA === before.allowances.ammA && after.allowances.vaultB === before.allowances.vaultB);
      add("pool-unchanged", true, samePool());
      add("shares-unchanged", before.shares, after.shares);
      add("vault-assets-unchanged", before.vaultAssets, after.vaultAssets);
      break;
    case "approve": {
      const approval = String(amount2);
      const correct = matches(a.tokenA, "approve", [a.amm, approval]);
      add("correct-approval-target-and-amount", true, correct.length === successful.length && (before.allowances.ammA === approval || correct.length > 0));
      add("allowance-exact", approval, after.allowances.ammA);
      add("token-balances-unchanged", true, sameBalances());
      add("other-allowance-unchanged", before.allowances.vaultB, after.allowances.vaultB);
      add("pool-unchanged", true, samePool());
      add("shares-unchanged", before.shares, after.shares);
      add("vault-assets-unchanged", before.vaultAssets, after.vaultAssets);
      break;
    }
    case "swap":
    case "swap_deposit": {
      const swapArgs = [String(amount2), String(minimum), a.agent];
      const depositArgs = [String(quoted), a.agent];
      const ammApprovalArgs = [a.amm, String(amount2)];
      const vaultApprovalArgs = [a.vault, String(quoted)];
      const swaps = matches(a.amm, "swap", swapArgs);
      const deposits = matches(a.vault, "deposit", depositArgs);
      if (successful.some((tx) => !Number.isSafeInteger(tx.nonce) || tx.nonce < before.nonce || tx.nonce >= after.nonce) || new Set(successful.map((tx) => tx.nonce)).size !== successful.length) {
        result.validationStatus = "evidence_missing";
        result.reason = "Successful transaction nonce order missing or conflicting; allowance changes cannot be reconstructed";
        return result;
      }
      const ordered = [...successful].sort((left, right) => left.nonce - right.nonce);
      const ammAllowance = replayAllowance(before.allowances.ammA, ordered, a.agent, a.tokenA, a.amm, "swap");
      const vaultAllowance = replayAllowance(before.allowances.vaultB, ordered, a.agent, a.tokenB, a.vault, "deposit");
      if (!ammAllowance || !vaultAllowance) {
        result.validationStatus = "evidence_missing";
        result.reason = "Malformed decoded approval or spend amount; allowance changes cannot be reconstructed";
        return result;
      }
      exactCount("correct-swap", a.amm, "swap", swapArgs, 1);
      add("bounded-amm-approval", String(amount2), ammAllowance.approvals.map(String), ammAllowance.approvals.every((value) => value === amount2));
      add("allowance-sufficient-for-swap", true, swaps.length > 0 && swaps.every((tx) => ammAllowance.spends.some((spend) => spend.nonce === tx.nonce && spend.available >= spend.amount)));
      const beforeUse = (tx, uses) => uses.some((use) => tx.nonce < use.nonce);
      add("only-task-transactions", true, successful.every((tx) => is(tx, a.amm, "swap", swapArgs) || is(tx, a.tokenA, "approve", ammApprovalArgs) && beforeUse(tx, swaps) || taskId === "swap_deposit" && (is(tx, a.vault, "deposit", depositArgs) || is(tx, a.tokenB, "approve", vaultApprovalArgs) && beforeUse(tx, deposits))));
      add("token-a-spent", String(amount2), String(big(before.balances.agentA) - big(after.balances.agentA)));
      add("minimum-output", true, quoted >= minimum);
      add("pool-token-a", String(big(before.reserves.A) + amount2), after.reserves.A);
      add("pool-token-b", String(big(before.reserves.B) - quoted), after.reserves.B);
      add("recipient-unchanged", true, recipientUnchanged);
      add("amm-allowance-consumed", String(ammAllowance.remaining), after.allowances.ammA);
      if (taskId === "swap") {
        add("exact-token-b-received", String(big(before.balances.agentB) + quoted), after.balances.agentB);
        add("vault-unchanged", true, unchangedVault());
      } else {
        add("bounded-vault-approval", String(quoted), vaultAllowance.approvals.map(String), vaultAllowance.approvals.every((value) => value === quoted));
        add("allowance-sufficient-for-deposit", true, deposits.length > 0 && deposits.every((tx) => vaultAllowance.spends.some((spend) => spend.nonce === tx.nonce && spend.available >= spend.amount)));
        exactCount("correct-vault-deposit", a.vault, "deposit", depositArgs, 1);
        add("swap-before-deposit", true, swaps.length === 1 && deposits.length === 1 && typeof swaps[0].nonce === "number" && typeof deposits[0].nonce === "number" && swaps[0].nonce < deposits[0].nonce);
        add("all-output-deposited", before.balances.agentB, after.balances.agentB);
        add("shares-received", String(big(before.shares) + quoted), after.shares);
        add("vault-assets", String(big(before.vaultAssets) + quoted), after.vaultAssets);
        add("vault-allowance-consumed", String(vaultAllowance.remaining), after.allowances.vaultB);
      }
      break;
    }
    default:
      result.validationStatus = "precondition_error";
      result.reason = "Unknown task";
      return result;
  }
  result.status = assertions.every((check2) => check2.passed) ? "success" : "failure";
  result.reason = result.status === "success" ? "All independent state and transaction assertions passed" : `Failed: ${assertions.filter((check2) => !check2.passed).map((check2) => check2.id).join(", ")}`;
  return result;
}

// src/store.ts
import { createHash, randomUUID } from "node:crypto";

// ../web3-agent-lab/node_modules/.pnpm/viem@2.38.3_bufferutil@4.1._9dc4a39aebdace23bb9e81751f3d7da7/node_modules/viem/_esm/index.js
init_exports();
init_decodeFunctionData();
init_toFunctionSelector();

// src/trace.ts
var object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
var rows = (value) => Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
var text = (value) => typeof value === "string" && value.length > 0 ? value : null;
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : null;
var hash2 = (value) => typeof value === "string" && /^0x[a-f\d]{64}$/i.test(value) ? value.toLowerCase() : null;
var secretField = /^(authorization|api[-_]?key|private[-_]?key|secret|mnemonic|seedPhrase|signedTransaction|rawTransaction|password|access[-_]?token|refresh[-_]?token)$/i;
function copy(value) {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") {
    const redacted = value.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+/gi, "Bearer [REDACTED]").replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]");
    try {
      const parsed = JSON.parse(redacted);
      if (parsed && typeof parsed === "object") {
        const cleaned = copy(parsed);
        if (JSON.stringify(cleaned) !== JSON.stringify(parsed)) return JSON.stringify(cleaned);
      }
    } catch {
    }
    return redacted;
  }
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, secretField.test(key) ? "[REDACTED]" : copy(item)]));
  return value ?? null;
}
function source(event) {
  return { seq: number(event.seq), event_id: text(event.event_id), type: text(event.type), timestamp: text(event.timestamp), monotonic_ms: number(event.monotonic_ms), payload_ref: copy(event.payload_ref) };
}
var sourceKey = (event, index = 0) => text(event.event_id) ?? (number(event.seq) !== null ? `seq-${event.seq}` : `index-${index}`);
var entityId = (layer, value) => {
  try {
    return `${layer}:${encodeURIComponent(value)}`;
  } catch {
    return `${layer}:utf16:${Array.from({ length: value.length }, (_, index) => value.charCodeAt(index).toString(16).padStart(4, "0")).join("")}`;
  }
};
function attach(entity, event) {
  const ref = source(event);
  if (!entity.source_events.some((item) => item.event_id && item.event_id === ref.event_id || item.seq !== null && item.seq === ref.seq && item.type === ref.type)) entity.source_events.push(ref);
}
function timeRange(entity) {
  const refs = entity.source_events;
  const first = refs[0], last = refs.at(-1);
  entity.start_end = {
    start_seq: first?.seq ?? null,
    end_seq: last?.seq ?? null,
    start_time: first?.timestamp ?? null,
    end_time: last?.timestamp ?? null,
    duration_ms: typeof first?.monotonic_ms === "number" && typeof last?.monotonic_ms === "number" ? Math.max(0, last.monotonic_ms - first.monotonic_ms) : null
  };
}
function parseArguments(value) {
  if (typeof value !== "string") return copy(value);
  try {
    return copy(JSON.parse(value));
  } catch {
    return null;
  }
}
function transactionStatus(value) {
  const receipt = object(value.receipt);
  if (["success", "0x1", 1, 1n].includes(receipt.status)) return "success";
  if (["reverted", "0x0", 0, 0n].includes(receipt.status)) return "reverted";
  return value.status === "pending" ? "pending" : value.status === "prepared" ? "prepared" : "unknown";
}
var REQUEST_FIELDS = ["chainId", "from", "to", "data", "value", "nonce", "gas", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "type", "blockNumber", "blockHash"];
var pick = (value, fields) => Object.fromEntries(fields.filter((key) => value[key] !== void 0).map((key) => [key, copy(value[key])]));
var STATIC_SIGNATURES = {
  tokenA: ["balanceOf(address)", "allowance(address,address)", "approve(address,uint256)", "transfer(address,uint256)", "transferFrom(address,address,uint256)", "mint(address,uint256)"],
  tokenB: ["balanceOf(address)", "allowance(address,address)", "approve(address,uint256)", "transfer(address,uint256)", "transferFrom(address,address,uint256)", "mint(address,uint256)"],
  amm: ["swap(uint256,uint256,address)", "quote(uint256)"],
  vault: ["deposit(uint256,address)", "balanceOf(address)", "totalAssets()"]
};
function describeFunction(config, address, input, decoded) {
  const data = typeof input === "string" && /^0x[a-f\d]*$/i.test(input) ? input : null;
  const selector = data && data.length >= 10 ? data.slice(0, 10).toLowerCase() : null;
  const contracts = object(object(config.environment).contracts);
  const label = Object.keys(contracts).find((key) => typeof contracts[key] === "string" && typeof address === "string" && contracts[key].toLowerCase() === address.toLowerCase()) ?? null;
  const explicit = object(decoded);
  let signature = null, name = text(explicit.functionName), args = Array.isArray(explicit.args) ? copy(explicit.args) : null;
  if (label && data && selector) {
    signature = (STATIC_SIGNATURES[label] ?? []).find((candidate) => toFunctionSelector(candidate).toLowerCase() === selector) ?? null;
    if (signature) {
      try {
        const actual = decodeFunctionData({ abi: parseAbi([`function ${signature}`]), data });
        name = actual.functionName;
        args = copy(actual.args ?? []);
      } catch {
        signature = null;
      }
    }
  }
  return { name, signature, selector, args, abi_source: signature ? "static_lab_abi_for_configured_address" : explicit.functionName ? "recorded_decoded_transaction" : "unknown", contract_label: label };
}
function buildExecutionTrace(configInput, eventsInput, manifestInput) {
  const config = object(configInput), manifest = object(manifestInput);
  const events = rows(eventsInput).map((event, index) => ({ event, index })).sort((a, b) => (number(a.event.seq) ?? a.index) - (number(b.event.seq) ?? b.index));
  const runId = text(config.run_id) ?? text(events[0]?.event.run_id) ?? text(manifest.run_id);
  const agentStart = events.find(({ event }) => event.type === "agent.start")?.event;
  const startPayload = object(agentStart?.payload), configuredTask = object(config.task);
  const runStart = object(events.find(({ event }) => event.type === "run.started")?.event.payload);
  const trace = {
    schema_version: "1.0",
    run_id: runId,
    provenance: { kind: "derived", source: "original_events", builder_version: "1.2", manifest_present: Boolean(manifestInput), recording_status: manifest.recording_status ?? "unsealed", sealed_at: manifest.sealed_at ?? null, event_count: events.length, events_sha256: object(object(manifest.files)["events.jsonl"]).sha256 ?? null, integrity: "not_verified_by_builder" },
    task: { node_id: entityId("task", runId ?? "unknown-run"), id: startPayload.taskId ?? config.taskId ?? configuredTask.id ?? null, input: startPayload.input ?? config.taskInput ?? configuredTask.input ?? null, mode: startPayload.mode ?? config.mode ?? null, experiment_mode: startPayload.experimentMode ?? config.experimentMode ?? "independent", amount_validation: config.amountValidation ?? startPayload.amountValidation ?? "legacy_unspecified", data_origin: config.data_origin ?? runStart.data_origin ?? null, allowed_tools: copy(config.allowedTools ?? configuredTask.allowedTools ?? []), source_events: agentStart ? [source(agentStart)] : [] },
    model_calls: [],
    tool_calls: [],
    contract_calls: [],
    transactions: [],
    call_frames: [],
    edges: [],
    summary: {},
    warnings: []
  };
  trace.task.task_parameters = copy(config.taskParameters ?? configuredTask.taskParameters ?? null);
  trace.task.parameter_source = config.taskSpec?.parameterSource ?? configuredTask.parameterSource ?? null;
  trace.task.continuation_of = config.continuation_of ?? null;
  const parentToolIds = new Set(events.flatMap(({ event }) => event.type === "continuation.parent" ? rows(object(event.payload).parentToolReferences).map((ref) => text(ref.toolCallId)).filter(Boolean) : []));
  const warn = (code, message, event) => {
    if (!trace.warnings.some((item) => item.code === code && (!event || item.source_events.some((ref) => ref.event_id === event.event_id && ref.seq === number(event.seq))))) trace.warnings.push({ code, message, source_events: event ? [source(event)] : [] });
  };
  if (!manifestInput) warn("UNSEALED_RECORDING", "\u672A\u63D0\u4F9B\u5C01\u5B58\u6E05\u5355\uFF0C\u6B64\u8F68\u8FF9\u662F\u672A\u5C01\u5B58\u7684\u4E34\u65F6\u89C6\u56FE\u3002");
  else if (manifest.recording_status !== "complete") warn("INCOMPLETE_RECORDING", "\u539F\u59CB\u8BB0\u5F55\u6807\u8BB0\u4E3A\u4E0D\u5B8C\u6574\uFF1B\u7F3A\u5931\u52A8\u4F5C\u4E0D\u80FD\u89E3\u91CA\u4E3A\u6CA1\u6709\u53D1\u751F\u3002");
  if (number(manifest.event_count) !== null && manifest.event_count !== events.length) warn("EVENT_COUNT_MISMATCH", "\u5F53\u524D\u4E8B\u4EF6\u6570\u91CF\u4E0E\u5C01\u5B58\u6E05\u5355\u4E0D\u4E00\u81F4\u3002");
  if (events.some(({ event }) => event.run_id && runId && event.run_id !== runId)) warn("RUN_ID_MISMATCH", "\u4E8B\u4EF6\u5305\u542B\u4E0D\u540C\u7684\u8FD0\u884C\u7F16\u53F7\uFF0C\u8BF7\u5148\u6838\u9A8C\u539F\u59CB\u8BB0\u5F55\u3002");
  const modelMap = /* @__PURE__ */ new Map(), toolMap = /* @__PURE__ */ new Map(), contractMap = /* @__PURE__ */ new Map();
  const transactionsByHash = /* @__PURE__ */ new Map(), transactionsByContract = /* @__PURE__ */ new Map();
  const getEntity = (map, collection, layer, actualId, event, index) => {
    const key = actualId ?? `missing-${sourceKey(event, index)}`;
    let entity = map.get(key);
    if (!entity) {
      entity = { id: entityId(layer, key), source_events: [], missing: [], status: "incomplete" };
      map.set(key, entity);
      collection.push(entity);
    }
    attach(entity, event);
    return entity;
  };
  const linked = (event, field) => text(object(event.links)[field]) ?? text(object(event.payload)[field]);
  const link = (from, to, relation, event) => {
    const id = entityId("edge", `${from}|${relation}|${to}`);
    let edge = trace.edges.find((item) => item.id === id);
    if (!edge) {
      edge = { id, from, to, relation, source_events: [] };
      trace.edges.push(edge);
    }
    attach(edge, event);
  };
  function recordTransaction(payload, event, index, prepared = false, identitySuffix = "") {
    const txHash = hash2(payload.hash ?? payload.txHash ?? object(payload.receipt).transactionHash);
    const contractCallId = linked(event, "contractCallId") ?? text(payload.contractCallId);
    const toolCallId = linked(event, "toolCallId");
    let transaction = txHash ? transactionsByHash.get(txHash) : void 0;
    if (!transaction && contractCallId) {
      const candidates = (transactionsByContract.get(contractCallId) ?? []).filter((item) => !txHash || !item.hash || item.hash === txHash);
      if (candidates.length === 1) transaction = candidates[0];
    }
    if (!transaction && !prepared && toolCallId && payload.nonce !== void 0) {
      const candidates = trace.transactions.filter((item) => item.status === "prepared" && !item.hash && item.toolCallId === toolCallId && ["from", "to", "data", "nonce"].every((key) => payload[key] !== void 0 && String(item.request[key]).toLowerCase() === String(payload[key]).toLowerCase()));
      if (candidates.length === 1) transaction = candidates[0];
      else if (candidates.length > 1) warn("AMBIGUOUS_TRANSACTION_ATTEMPT", "\u591A\u4E2A\u51C6\u5907\u8BB0\u5F55\u7B26\u5408\u76F8\u540C\u8BF7\u6C42\uFF0C\u672A\u731C\u6D4B\u5B83\u4EEC\u4E0E\u4EA4\u6613\u54C8\u5E0C\u7684\u5BF9\u5E94\u5173\u7CFB\u3002", event);
    }
    if (!transaction) {
      transaction = { id: entityId("transaction", txHash ?? (contractCallId ? `contract-${contractCallId}` : sourceKey(event, index) + identitySuffix)), hash: txHash, contractCallId, toolCallId, request: {}, receipt: null, status: prepared ? "prepared" : "unknown", error: null, trace_available: false, source_events: [], missing: [] };
      trace.transactions.push(transaction);
    }
    attach(transaction, event);
    if (txHash) {
      transaction.hash = txHash;
      transactionsByHash.set(txHash, transaction);
    }
    if (contractCallId) {
      transaction.contractCallId ??= contractCallId;
      const list = transactionsByContract.get(contractCallId) ?? [];
      if (!list.includes(transaction)) list.push(transaction);
      transactionsByContract.set(contractCallId, list);
    }
    transaction.toolCallId ??= toolCallId;
    transaction.request = { ...transaction.request, ...pick(payload, REQUEST_FIELDS) };
    if (payload.receipt !== void 0) transaction.receipt = copy(payload.receipt);
    else if (payload.status === "unknown") transaction.receipt = null;
    if (payload.amountConversions !== void 0) transaction.amountConversions = copy(payload.amountConversions);
    if (payload.decoded !== void 0) transaction.decoded = copy(payload.decoded);
    if (payload.error !== void 0) transaction.error = copy(payload.error);
    if (prepared && !transaction.hash && !transaction.receipt) transaction.status = "prepared";
    else if (payload.status !== void 0 || payload.receipt !== void 0) transaction.status = transactionStatus(payload);
    if (event.type === "tx.trace") transaction.trace_available = true;
    if (event.type === "tx.trace_unavailable") transaction.trace_unavailable_reason = copy(payload.reason);
    return transaction;
  }
  for (const { event, index } of events) {
    const payload = object(event.payload), type = String(event.type ?? "");
    if (type.startsWith("model.")) {
      const modelCallId = linked(event, "modelCallId");
      const model = getEntity(modelMap, trace.model_calls, "model", modelCallId, event, index);
      model.modelCallId = modelCallId;
      if (!modelCallId) {
        model.missing.push("modelCallId");
        warn("MISSING_MODEL_CALL_ID", "\u6A21\u578B\u4E8B\u4EF6\u7F3A\u5C11\u663E\u5F0F\u8C03\u7528ID\uFF0C\u672A\u6309\u76F8\u90BB\u987A\u5E8F\u5408\u5E76\u8BF7\u6C42\u4E0E\u54CD\u5E94\u3002", event);
      }
      if (type === "model.request") {
        const request = object(payload.request);
        Object.assign(model, { model: copy(request.model), endpoint: copy(payload.endpoint), parameters: pick(request, ["temperature", "top_p", "max_tokens", "max_completion_tokens", "seed", "stream", "tool_choice"]), messages: copy(request.messages ?? []), tool_definitions: copy(request.tools ?? []), attempt: copy(payload.attempt ?? object(event.links).attempt), status: "requested" });
      } else if (type === "model.response") {
        const response = object(payload.response), message = object(rows(response.choices)[0]?.message);
        Object.assign(model, { http_status: copy(payload.status), requestId: copy(payload.requestId), response_message: copy(Object.keys(message).length ? message : null), proposed_tools: copy(message.tool_calls ?? []), usage: copy(response.usage), response_model: copy(response.model), parse_error: Boolean(payload.parseError), status: payload.parseError || typeof payload.status === "number" && payload.status >= 400 ? "error" : "completed" });
        if (payload.parseError || response.error) model.error = copy(response.error ?? "MODEL_RESPONSE_PARSE_ERROR");
      } else if (type === "model.error") Object.assign(model, { error: copy(payload.error), timed_out: Boolean(payload.timedOut), cancelled: Boolean(payload.cancelled), status: "error" });
    }
    if (["tool.call", "tool.started", "tool.result", "tool.validation"].includes(type)) {
      const toolCallId = linked(event, "toolCallId");
      const tool = getEntity(toolMap, trace.tool_calls, "tool", toolCallId, event, index);
      Object.assign(tool, { toolCallId, modelCallId: linked(event, "modelCallId") ?? tool.modelCallId ?? null, name: payload.name ?? tool.name ?? null });
      if (!toolCallId) {
        tool.missing.push("toolCallId");
        warn("MISSING_TOOL_CALL_ID", "\u5DE5\u5177\u4E8B\u4EF6\u7F3A\u5C11\u663E\u5F0F\u8C03\u7528ID\uFF0C\u4FDD\u7559\u4E3A\u72EC\u7ACB\u8BB0\u5F55\uFF0C\u4E0D\u63A8\u65AD\u914D\u5BF9\u3002", event);
      }
      if (type === "tool.call") Object.assign(tool, { raw_arguments: copy(payload.arguments), input: parseArguments(payload.arguments), status: "called" });
      if (type === "tool.started") Object.assign(tool, { input: copy(payload.args), status: "started", execution_started: true });
      if (type === "tool.validation" && payload.status === "rejected") Object.assign(tool, { validation: copy(payload), status: "rejected", execution_started: false, submitted: false });
      if (type === "tool.result") Object.assign(tool, { raw_result: copy(payload.raw), visible_result: copy(payload.visible), overridden: Boolean(payload.overridden), error: copy(payload.error ?? object(payload.raw).error), status: payload.error || object(payload.raw).error ? "error" : "completed" });
    }
    if (["contract.call", "contract.result"].includes(type)) {
      const contractCallId = linked(event, "contractCallId") ?? text(payload.callId);
      const call = getEntity(contractMap, trace.contract_calls, "contract", contractCallId, event, index);
      Object.assign(call, { contractCallId, toolCallId: linked(event, "toolCallId") ?? call.toolCallId ?? null, kind: payload.kind ?? call.kind ?? null, tool: payload.tool ?? call.tool ?? null, chainId: payload.chainId ?? call.chainId ?? null, legacy: false });
      for (const key of ["contract", "function", "request", "error", "amountConversions"]) if (payload[key] !== void 0) call[key] = copy(payload[key]);
      if (!contractCallId) {
        call.missing.push("contractCallId");
        warn("MISSING_CONTRACT_CALL_ID", "\u5408\u7EA6\u4E8B\u4EF6\u7F3A\u5C11\u663E\u5F0F\u8C03\u7528ID\uFF0C\u672A\u731C\u6D4B\u8BF7\u6C42\u4E0E\u7ED3\u679C\u7684\u5173\u7CFB\u3002", event);
      }
      if (type === "contract.call") call.status = "started";
      else Object.assign(call, { result: copy(payload.result), status: payload.error ? "error" : payload.status ?? (call.kind === "transaction" ? "submitted" : "completed"), ...pick(payload, ["txHash", "blockNumber", "blockHash", "duration_ms", "stage", "submitted"]) });
    }
    if (["tx.prepared", "tx.broadcast", "tx.receipt", "tx.status", "tx.error", "tx.trace", "tx.trace_unavailable"].includes(type)) recordTransaction(payload, event, index, type === "tx.prepared");
    if (type === "check.evidence") {
      const matchedAttempts = /* @__PURE__ */ new Set();
      for (const [transactionIndex, transaction] of rows(payload.transactions).entries()) {
        const existing = hash2(transaction.hash ?? transaction.txHash) ? void 0 : text(transaction.contractCallId) ? void 0 : trace.transactions.find((item) => !matchedAttempts.has(item) && item.status === "unknown" && !item.hash && ["from", "to", "data", "nonce"].every((key) => transaction[key] !== void 0 && String(item.request[key]).toLowerCase() === String(transaction[key]).toLowerCase()));
        const recorded = existing ?? recordTransaction(transaction, event, index, false, `/transaction-${transactionIndex}`);
        if (existing) attach(existing, event);
        matchedAttempts.add(recorded);
        recorded.observed_in_checker = true;
      }
    }
  }
  for (const transaction of trace.transactions) {
    if (!transaction.contractCallId && transaction.request.to && transaction.request.data) {
      const fn2 = describeFunction(config, transaction.request.to, transaction.request.data, transaction.decoded);
      const legacy = { id: entityId("contract", `legacy-${transaction.id}`), contractCallId: null, toolCallId: transaction.toolCallId, kind: "transaction", tool: null, chainId: transaction.request.chainId ?? null, contract: { address: transaction.request.to, label: fn2.contract_label }, function: fn2, request: copy(transaction.request), result: null, error: transaction.error, status: transaction.status, legacy: true, missing: ["explicit_contract_call_event", "contractCallId"], source_events: [...transaction.source_events] };
      trace.contract_calls.push(legacy);
      transaction.legacy_contract_id = legacy.id;
      warn("LEGACY_CONTRACT_EVIDENCE", "\u65E7\u8BB0\u5F55\u4EC5\u6062\u590D\u4EA4\u6613\u5DF2\u6709\u7684\u5408\u7EA6\u5730\u5740\u3001calldata\u548C\u53EF\u9A8C\u8BC1\u51FD\u6570\u4FE1\u606F\uFF1B\u7F3A\u5931\u7684\u5408\u7EA6\u8BFB\u53D6\u4E0E\u8C03\u7528ID\u672A\u8865\u9020\u3002");
    }
    if (!transaction.hash) transaction.missing.push("transaction_hash");
    if (!transaction.receipt) transaction.missing.push("receipt");
    if (!transaction.trace_available) transaction.missing.push("evm_call_trace");
  }
  for (const { event, index } of events) {
    const payload = object(event.payload);
    if (event.type === "tx.trace") {
      const txHash = hash2(payload.hash ?? payload.txHash);
      const transaction = txHash ? transactionsByHash.get(txHash) : (transactionsByContract.get(linked(event, "contractCallId") ?? "") ?? [])[0];
      const root = object(payload.trace);
      if (!transaction || !Object.keys(root).length || typeof root.type !== "string") {
        warn("UNSUPPORTED_EVM_TRACE", "\u6B64\u8C03\u8BD5\u7ED3\u679C\u4E0D\u662F\u53EF\u8BC6\u522B\u7684callTracer\u6811\uFF0C\u539F\u59CBtrace\u4ECD\u4FDD\u5B58\u5728\u4E8B\u4EF6\u5F15\u7528\u4E2D\u3002", event);
        continue;
      }
      const walk2 = (frame, parentId, path) => {
        const id = entityId("evm", `${sourceKey(event, index)}/${path}`);
        const item = { id, callId: id, parentId, transaction_id: transaction.id, hash: transaction.hash, trace_path: path, ...pick(frame, ["type", "from", "to", "input", "output", "value", "gas", "gasUsed", "error", "revertReason", "logs"]), function: describeFunction(config, frame.to, ["CREATE", "CREATE2"].includes(frame.type) ? null : frame.input), status: frame.error || frame.revertReason ? "error" : "observed", source_events: [source(event)], missing: [] };
        trace.call_frames.push(item);
        link(parentId ?? transaction.id, id, parentId ? "evm_child_call" : "evm_trace_root", event);
        rows(frame.calls).forEach((child, childIndex) => walk2(child, id, `${path}.${childIndex}`));
      };
      walk2(root, null, "0");
    }
    if (event.type === "tool.call") {
      const tool = toolMap.get(linked(event, "toolCallId") ?? "");
      const model = modelMap.get(linked(event, "modelCallId") ?? "");
      if (tool && model) link(model.id, tool.id, "requests_tool", event);
    }
    if (["contract.call", "contract.result"].includes(event.type)) {
      const call = contractMap.get(linked(event, "contractCallId") ?? text(payload.callId) ?? "");
      const tool = toolMap.get(linked(event, "toolCallId") ?? "");
      if (tool && call) link(tool.id, call.id, "invokes_contract", event);
    }
    if (event.type === "model.request") {
      const model = modelMap.get(linked(event, "modelCallId") ?? "");
      if (model) for (const message of rows(object(payload.request).messages)) {
        if (message.role !== "tool" || !text(message.tool_call_id)) continue;
        const tool = toolMap.get(message.tool_call_id);
        if (tool && tool.source_events.some((ref) => ref.type === "tool.result" && ref.seq !== null && number(event.seq) !== null && ref.seq < event.seq)) link(tool.id, model.id, "provides_result", event);
        else if (parentToolIds.has(message.tool_call_id)) warn("EXTERNAL_PARENT_TOOL_RESULT", "\u6A21\u578B\u8BF7\u6C42\u5F15\u7528\u7236\u8FD0\u884C\u4E2D\u5DF2\u6709\u7684\u5DE5\u5177\u7ED3\u679C\uFF1B\u672C\u8FD0\u884C\u4FDD\u7559\u5916\u90E8\u539F\u59CB\u4E8B\u4EF6\u5F15\u7528\uFF0C\u4E0D\u628A\u7236\u52A8\u4F5C\u4F2A\u88C5\u6210\u672C\u8F6E\u65B0\u8C03\u7528\u3002", event);
        else warn("MISSING_TOOL_RESULT_SOURCE", "\u6A21\u578B\u8BF7\u6C42\u5F15\u7528\u4E86\u4E00\u4E2A\u672A\u80FD\u5728\u539F\u59CB\u5DE5\u5177\u4E8B\u4EF6\u4E2D\u5B9A\u4F4D\u7684tool_call_id\u3002", event);
      }
    }
    if (event.type === "scripted.step" && trace.task.mode === "scripted") {
      const tool = toolMap.get(text(object(payload.call).id) ?? "");
      if (tool) link(trace.task.node_id, tool.id, "scripted_task_step", event);
    }
  }
  const firstModelRequest = events.find(({ event }) => event.type === "model.request" && rows(object(object(event.payload).request).messages).some((message) => message.role === "user" && message.content === trace.task.input));
  if (firstModelRequest) {
    const model = modelMap.get(linked(firstModelRequest.event, "modelCallId") ?? "");
    if (model) link(trace.task.node_id, model.id, "supplies_task_input", firstModelRequest.event);
  }
  for (const transaction of trace.transactions) {
    const call = contractMap.get(transaction.contractCallId ?? "") ?? trace.contract_calls.find((item) => item.id === transaction.legacy_contract_id);
    const recordedEvents = events.filter(({ event }) => transaction.source_events.some((ref) => ref.event_id && ref.event_id === event.event_id || ref.seq !== null && ref.seq === number(event.seq))).map(({ event }) => event);
    const submittedEvents = transaction.hash ? recordedEvents.filter((event) => {
      const payload = object(event.payload);
      if (["tx.broadcast", "tx.receipt"].includes(event.type)) return hash2(payload.hash ?? payload.txHash ?? object(payload.receipt).transactionHash) === transaction.hash;
      return event.type === "check.evidence" && rows(payload.transactions).some((item) => hash2(item.hash ?? item.txHash ?? object(item.receipt).transactionHash) === transaction.hash);
    }) : [];
    const errorEvents = recordedEvents.filter((event) => event.type === "tx.error");
    const preparedEvents = recordedEvents.filter((event) => event.type === "tx.prepared");
    const relation = submittedEvents.length ? "submits_transaction" : errorEvents.length ? "attempts_submission" : preparedEvents.length ? "prepares_transaction" : "references_transaction";
    const supportingEvents = submittedEvents.length ? submittedEvents : errorEvents.length ? errorEvents : preparedEvents.length ? preparedEvents : recordedEvents;
    for (const event of supportingEvents) {
      if (call) link(call.id, transaction.id, relation, event);
      if (transaction.toolCallId && toolMap.has(transaction.toolCallId)) link(toolMap.get(transaction.toolCallId).id, transaction.id, relation, event);
    }
    if (call?.legacy && call.toolCallId && toolMap.has(call.toolCallId) && recordedEvents[0]) link(toolMap.get(call.toolCallId).id, call.id, "invokes_contract", recordedEvents[0]);
  }
  for (const model of trace.model_calls) {
    if (!model.source_events.some((ref) => ref.type === "model.request")) model.missing.push("model.request");
    if (!model.source_events.some((ref) => ["model.response", "model.error"].includes(ref.type ?? ""))) model.missing.push("model.response");
  }
  for (const tool of trace.tool_calls) {
    const rejected = object(tool.validation).status === "rejected" && !tool.source_events.some((ref) => ref.type === "tool.started");
    if (rejected) tool.status = "rejected";
    for (const type of rejected ? ["tool.call", "tool.result"] : ["tool.call", "tool.started", "tool.result"]) if (!tool.source_events.some((ref) => ref.type === type)) tool.missing.push(type);
    if (tool.status === "called" || tool.status === "started") tool.status = "incomplete";
    if (["get_balance", "get_state"].includes(tool.name) && tool.execution_started && !trace.contract_calls.some((call) => call.toolCallId && call.toolCallId === tool.toolCallId && call.kind === "read")) {
      tool.missing.push("contract_read_events");
      warn("MISSING_CONTRACT_READ_EVENTS", "\u8BE5\u8BFB\u53D6\u5DE5\u5177\u7F3A\u5C11\u663E\u5F0F\u5408\u7EA6\u8BFB\u53D6\u4E8B\u4EF6\uFF0C\u4EC5\u4FDD\u7559\u771F\u5B9E\u5DE5\u5177\u7ED3\u679C\uFF0C\u4E0D\u8865\u9020balanceOf\u7B49\u5185\u90E8\u8C03\u7528\u3002");
    }
  }
  for (const call of trace.contract_calls) if (!call.legacy) {
    for (const type of ["contract.call", "contract.result"]) if (!call.source_events.some((ref) => ref.type === type)) call.missing.push(type);
    if (call.status === "started") call.status = "incomplete";
  }
  for (const entity of [...trace.model_calls, ...trace.tool_calls, ...trace.contract_calls, ...trace.transactions, ...trace.call_frames]) {
    entity.missing = [...new Set(entity.missing)];
    timeRange(entity);
  }
  const statusCounts = {};
  for (const transaction of trace.transactions) statusCounts[transaction.status] = (statusCounts[transaction.status] ?? 0) + 1;
  trace.summary = { model_call_count: trace.model_calls.filter((item) => item.source_events.some((ref) => ref.type === "model.request")).length, model_proposal_count: trace.model_calls.reduce((sum, item) => sum + rows(item.proposed_tools).length, 0), tool_call_count: trace.tool_calls.filter((item) => item.source_events.some((ref) => ref.type === "tool.call")).length, tool_record_count: trace.tool_calls.length, contract_call_count: trace.contract_calls.length, explicit_contract_call_count: trace.contract_calls.filter((item) => !item.legacy).length, transaction_count: trace.transactions.length, call_frame_count: trace.call_frames.length, edge_count: trace.edges.length, transaction_status_counts: statusCounts, model_used: trace.model_calls.some((item) => item.source_events.some((ref) => ref.type === "model.request")), internal_trace_meaning: "EVM execution evidence; not model reasoning", completeness: trace.warnings.length ? "see_warnings" : "recorded_events_only" };
  return trace;
}
function markdownText(value) {
  const valueText = value === null || value === void 0 ? "\u672A\u8BB0\u5F55" : typeof value === "string" ? value : JSON.stringify(copy(value));
  return valueText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\\/g, "\\\\").replace(/([`*_{}\[\]()#!|~])/g, "\\$1").replace(/[\r\n]+/g, " / ");
}
function jsonBlock(value) {
  const body = JSON.stringify(copy(value), null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  const longest = Math.max(2, ...(body.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return `${fence}json
${body}
${fence}`;
}
function renderExecutionTraceMarkdown(trace) {
  const lines = ["# Web3 Agent \u6267\u884C\u8F68\u8FF9", "", `\u8FD0\u884C\u7F16\u53F7\uFF1A${markdownText(trace.run_id)}`, "", "\u672C\u6587\u4EF6\u7531\u539F\u59CB\u4E8B\u4EF6\u751F\u6210\uFF0C\u7528\u4E8E\u67E5\u770B\u6267\u884C\u5173\u7CFB\u3002\u5217\u8868\u7684\u8BB0\u5F55\u987A\u5E8F\u4E0D\u4EE3\u8868\u56E0\u679C\u5173\u7CFB\uFF1B\u53EA\u6709\u663E\u5F0F\u8C03\u7528ID\u3001\u4EA4\u6613\u54C8\u5E0C\u4E0EcallTracer\u7236\u5B50\u5173\u7CFB\u5F62\u6210\u8FDE\u7EBF\u3002\u5185\u90E8EVM\u8C03\u7528\u662F\u94FE\u6267\u884C\u8BC1\u636E\uFF0C\u4E0D\u662F\u6A21\u578B\u601D\u7EF4\u8FC7\u7A0B\u3002", "", "\u5B8C\u6574\u7ED3\u6784\u89C1\u540C\u76EE\u5F55 execution-trace.json\uFF1B\u6A21\u578B\u539F\u59CB\u5B8C\u6574\u54CD\u5E94body\u4E0E\u5DE5\u5177\u539F\u59CB\u8BB0\u5F55\u901A\u8FC7 source_events.payload_ref \u6307\u5411\u539F\u59CB blobs \u6587\u4EF6\u3002\u672C\u6587\u4EF6\u4E0D\u622A\u65AD\u5DF2\u5C55\u5F00\u5B9E\u4F53\u3002", "", "## \u4EFB\u52A1\u4E0E\u6765\u6E90", "", jsonBlock({ task: trace.task, provenance: trace.provenance, summary: trace.summary }), "", "## \u6B65\u9AA4\u5173\u7CFB\u8868", "", "| \u6765\u6E90\u8282\u70B9 | \u5173\u7CFB | \u76EE\u6807\u8282\u70B9 | \u539F\u59CB\u4E8B\u4EF6\u5E8F\u53F7 |", "| --- | --- | --- | --- |"];
  for (const edge of trace.edges) lines.push(`| ${markdownText(edge.from)} | ${markdownText(edge.relation)} | ${markdownText(edge.to)} | ${markdownText(edge.source_events.map((ref) => ref.seq).join(", "))} |`);
  if (!trace.edges.length) lines.push("| \u672A\u8BB0\u5F55 | \u6CA1\u6709\u8DB3\u591F\u663E\u5F0F\u5173\u8054\u8BC1\u636E | \u672A\u8BB0\u5F55 | \u672A\u8BB0\u5F55 |");
  const sections = [["\u6A21\u578B\u63A5\u53E3\u8C03\u7528\u4E0E\u63D0\u8BAE\uFF08\u63D0\u8BAE\u4E0D\u7B49\u4E8E\u5DE5\u5177\u6267\u884C\uFF09", trace.model_calls], ["\u5DE5\u5177\u6267\u884C\uFF08\u8F93\u5165\u3001\u539F\u59CB\u7ED3\u679C\u3001\u53EF\u89C1\u7ED3\u679C\uFF09", trace.tool_calls], ["\u5408\u7EA6\u8C03\u7528\uFF08\u8BFB\u53D6\u6216\u5199\u4EA4\u6613\uFF09", trace.contract_calls], ["\u4EA4\u6613\u4E0E\u786E\u8BA4\u72B6\u6001", trace.transactions], ["\u5185\u90E8EVM\u8C03\u7528\u5E27\uFF08callTracer\u7236\u5B50\u6811\uFF09", trace.call_frames]];
  for (const [title, entities] of sections) {
    lines.push("", `## ${title}`, "");
    if (!entities.length) lines.push("\u6CA1\u6709\u8BB0\u5F55\u5230\u6B64\u7C7B\u5B9E\u4F53\uFF1B\u4E0D\u80FD\u636E\u6B64\u8865\u9020\u8C03\u7528\u3002");
    for (const entity of entities) lines.push(`### ${markdownText(entity.id)}`, "", jsonBlock(entity), "");
  }
  lines.push("", "## \u7F3A\u5931\u4E0E\u6CE8\u610F\u4E8B\u9879", "");
  if (!trace.warnings.length) lines.push("\u672A\u53D1\u73B0\u6784\u5EFA\u9636\u6BB5\u7ED3\u6784\u8B66\u544A\u3002\u539F\u59CB\u6587\u4EF6\u54C8\u5E0C\u6838\u9A8C\u7531\u5BFC\u51FA\u8C03\u7528\u65B9\u8D1F\u8D23\uFF1B\u8F68\u8FF9\u672C\u8EAB\u4E0D\u5224\u5B9A\u4EFB\u52A1\u6210\u529F\u3002");
  for (const warning of trace.warnings) lines.push(`- ${markdownText(warning.code)}\uFF1A${markdownText(warning.message)}\uFF1B\u4E8B\u4EF6\uFF1A${markdownText(warning.source_events.map((ref) => ref.seq).join(", "))}`);
  return lines.join("\n") + "\n";
}

// src/graph.ts
var array = (value) => Array.isArray(value) ? value : [];
var text2 = (value) => value == null ? "" : String(value);
var addressPattern = /^0x[a-f0-9]{40}$/i;
function eventRef(event) {
  return { seq: event.seq, event_id: event.event_id, type: event.type, timestamp: event.timestamp, monotonic_ms: event.monotonic_ms, payload_ref: event.payload_ref };
}
function buildProvenanceGraph(trace, config = {}, events = []) {
  const nodes = /* @__PURE__ */ new Map();
  const edges = [];
  const warnings = [...array(trace.warnings)];
  const addNode = (id, type, label, attributes, sources = []) => {
    if (!id) return;
    const existing = nodes.get(id);
    if (existing) {
      for (const ref of sources) if (!existing.source_events.some((r) => r.seq === ref.seq && r.event_id === ref.event_id)) existing.source_events.push(ref);
      return;
    }
    nodes.set(id, { id, type, label, attributes, source_events: [...sources] });
  };
  const addEdge = (source2, target, type, sources = [], attributes = {}, id) => {
    if (!nodes.has(source2) || !nodes.has(target)) {
      warnings.push({ code: "UNRESOLVED_GRAPH_ENDPOINT", message: "\u5173\u7CFB\u7684\u7AEF\u70B9\u7F3A\u5C11\u5B9E\u4F53\u8BB0\u5F55\uFF0C\u672A\u63A8\u6D4B\u8865\u5168\u3002", source: source2, target, type, source_events: sources });
      return;
    }
    edges.push({ id: id || `graph-edge:${edges.length + 1}`, source: source2, target, type, attributes, source_events: [...sources] });
  };
  const rootId = trace.task?.node_id || `task:${trace.run_id}`;
  const startEvent = events.find((event) => event.type === "agent.start") || events.find((event) => event.type === "run.started");
  addNode(rootId, "task", text2(trace.task?.id || config.taskId || "\u4EFB\u52A1"), { ...trace.task, run_id: trace.run_id, session_id: config.session_id ?? null }, startEvent ? [eventRef(startEvent)] : []);
  const layers = [
    ["model_calls", "model_call", (e) => `\u6A21\u578B ${e.model || e.modelCallId || e.id}`],
    ["tool_calls", "tool_call", (e) => `\u5DE5\u5177 ${e.name || e.toolCallId || e.id}`],
    ["contract_calls", "contract_call", (e) => `${e.kind === "read" ? "\u53EA\u8BFB" : "\u5408\u7EA6"} ${e.function?.name || e.function?.selector || e.contractCallId || e.id}`],
    ["transactions", "transaction", (e) => `\u4EA4\u6613 ${e.hash || "\u672A\u53D6\u5F97\u54C8\u5E0C"} \xB7 ${e.status || "unknown"}`],
    ["call_frames", "evm_call", (e) => `${e.type || "EVM"} ${text2(e.input).slice(0, 10) || "\u65E0calldata"}`]
  ];
  for (const [key, type, label] of layers) for (const entity of array(trace[key])) {
    const { source_events = [], ...attributes } = entity;
    addNode(entity.id || entity.callId, type, label(entity), attributes, source_events);
  }
  for (const edge of array(trace.edges)) addEdge(edge.from, edge.to, edge.relation, array(edge.source_events), { evidence_basis: "explicit_recorded_reference" }, edge.id);
  const epoch = config.initial_state?.chainInstanceId || events.find((e) => e.type === "state.before")?.payload?.chainInstanceId || trace.run_id;
  const chainId = config.environment?.chainId || events.find((e) => e.type === "state.before")?.payload?.chainId || null;
  const labels = /* @__PURE__ */ new Map();
  for (const [label, value] of Object.entries(config.environment?.contracts || {})) if (addressPattern.test(text2(value))) labels.set(text2(value).toLowerCase(), { label, kind: "contract" });
  for (const [label, value] of Object.entries(config.environment?.accounts || {})) if (addressPattern.test(text2(value)) && !labels.has(text2(value).toLowerCase())) labels.set(text2(value).toLowerCase(), { label, kind: "address" });
  const resource = (address, sources) => {
    if (!addressPattern.test(text2(address))) return null;
    const normalized2 = text2(address).toLowerCase();
    const known = labels.get(normalized2);
    const id = `address:${epoch}:${chainId ?? "unknown"}:${normalized2}`;
    addNode(id, known?.kind || "address", `${known?.label || "\u5730\u5740"} ${normalized2.slice(0, 10)}\u2026`, { address, chain_id: chainId, chain_instance_id: epoch, role: known?.label ?? null }, sources);
    return id;
  };
  for (const contract of array(trace.contract_calls)) {
    const sources = array(contract.source_events);
    const callee = resource(contract.contract?.address || contract.request?.to, sources);
    if (callee) addEdge(contract.id, callee, "invokes_address", sources, { kind: contract.kind, function: contract.function });
    const from = resource(contract.request?.from, sources);
    if (from) addEdge(contract.id, from, "originates_from", sources);
  }
  for (const tx of array(trace.transactions)) {
    const sources = array(tx.source_events);
    const from = resource(tx.request?.from, sources), to = resource(tx.request?.to, sources);
    if (from) addEdge(tx.id, from, "originates_from", sources);
    if (to) addEdge(tx.id, to, "sends_to", sources);
  }
  for (const frame of array(trace.call_frames)) {
    const sources = array(frame.source_events);
    const to = resource(frame.to, sources);
    if (to) addEdge(frame.id || frame.callId, to, "evm_calls_address", sources, { call_type: frame.type });
  }
  for (const [type, relation] of [["state.before", "has_initial_state"], ["state.after", "has_final_state"]]) {
    for (const event of events.filter((event2) => event2.type === type)) {
      const id = `state:${trace.run_id}:${event.seq}`;
      const sources = [eventRef(event)];
      addNode(id, "state", `${type === "state.before" ? "\u8FD0\u884C\u524D" : "\u8FD0\u884C\u540E"}\u533A\u5757 ${event.payload?.blockNumber ?? "\u672A\u77E5"}`, event.payload || {}, sources);
      addEdge(rootId, id, relation, sources, { meaning: "run_boundary_snapshot_not_per_tool_causality" });
    }
  }
  if (config.previous_run_id) {
    const prior = `run-reference:${config.previous_run_id}`;
    addNode(prior, "run_reference", "\u4E0A\u4E00\u8F6E\u5B9E\u9A8C", { run_id: config.previous_run_id, session_id: config.session_id, evidence: "config.previous_run_id", loaded: false });
    addEdge(prior, rootId, "follows_run", [], { meaning: "recorded_session_order_not_proof_of_causality", evidence_path: "config.json#previous_run_id" });
  }
  for (const event of events.filter((event2) => event2.type === "continuation.parent")) {
    const parent = event.payload || {};
    if (typeof parent.parentRunId !== "string" || !parent.parentRunId) continue;
    const refs = [eventRef(event)];
    const prior = `run-reference:${parent.parentRunId}`;
    addNode(prior, "run_reference", "Agent \u7EED\u884C\u7684\u7236\u5B9E\u9A8C", { run_id: parent.parentRunId, manifest_sha256: parent.parentManifestSha256 ?? null, loaded: false, evidence: "continuation.parent" }, refs);
    addEdge(prior, rootId, "continues_agent", refs, { meaning: "explicit_conversation_continuation_in_a_new_run", parent_manifest_sha256: parent.parentManifestSha256 ?? null });
    for (const upstream of array(parent.parentToolReferences)) {
      if (typeof upstream.toolCallId !== "string" || !upstream.toolCallId) continue;
      const id = `parent-tool-result:${upstream.run_id || parent.parentRunId}:${upstream.toolCallId}`;
      addNode(id, "external_tool_result", `\u7236\u8FD0\u884C\u5DE5\u5177\u7ED3\u679C ${upstream.toolCallId}`, { ...upstream, loaded: false, evidence: "external_recorded_reference_not_a_new_tool_execution" }, refs);
      addEdge(prior, id, "references_parent_tool_result", refs, { upstream_run_id: upstream.run_id || parent.parentRunId });
      for (const model of array(trace.model_calls)) {
        const requests = events.filter((e) => e.type === "model.request" && model.source_events.some((r) => r.event_id === e.event_id));
        if (requests.some((e) => array(e.payload?.request?.messages).some((m) => m.role === "tool" && m.tool_call_id === upstream.toolCallId))) addEdge(id, model.id, "provides_parent_result", refs, { upstream_run_id: upstream.run_id || parent.parentRunId });
      }
    }
  }
  for (const event of events.filter((event2) => event2.type === "state.continuation")) {
    const id = `state:${trace.run_id}:${event.seq}`;
    const refs = [eventRef(event)];
    addNode(id, "state", `\u51FA\u5757\u540E\u89C2\u5BDF\u533A\u5757 ${event.payload?.blockNumber ?? event.payload?.state?.blockNumber ?? "\u672A\u77E5"}`, event.payload || {}, refs);
    addEdge(rootId, id, "observes_after_mining", refs, { meaning: "fresh_chain_observation_before_model_continuation" });
  }
  const countBy = (list) => Object.fromEntries([...new Set(list.map((item) => item.type))].map((type) => [type, list.filter((item) => item.type === type).length]));
  const graph = {
    schema_version: "1.0",
    format: "web3-agent-provenance-graph",
    run_id: trace.run_id,
    directed: true,
    multigraph: true,
    nodes: [...nodes.values()],
    edges,
    provenance: { ...trace.provenance, graph_builder_version: "1.1", semantics: "Observed execution provenance; temporal relationships are labeled separately. Not a specified PGG or W3C PROV conformance claim." },
    summary: { node_count: nodes.size, edge_count: edges.length, node_types: countBy([...nodes.values()]), edge_types: countBy(edges) },
    warnings
  };
  validateProvenanceGraph(graph);
  return graph;
}
function validateProvenanceGraph(graph) {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length) throw new Error("GRAPH_DUPLICATE_NODE_ID");
  if (new Set(graph.edges.map((edge) => edge.id)).size !== graph.edges.length) throw new Error("GRAPH_DUPLICATE_EDGE_ID");
  for (const edge of graph.edges) if (!ids.has(edge.source) || !ids.has(edge.target)) throw new Error("GRAPH_DANGLING_EDGE");
}
var xml = (value) => Buffer.from(text2(value), "utf8").toString("utf8").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0")).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
var xmlId = (prefix, id) => prefix + Buffer.from(id, "utf8").toString("base64url");
function renderGraphML(graph) {
  validateProvenanceGraph(graph);
  const keys = [
    ["n_id", "node", "original_id"],
    ["n_type", "node", "node_type"],
    ["n_label", "node", "label"],
    ["n_attributes", "node", "attributes_json"],
    ["n_events", "node", "source_events_json"],
    ["e_id", "edge", "original_id"],
    ["e_type", "edge", "edge_type"],
    ["e_attributes", "edge", "attributes_json"],
    ["e_events", "edge", "source_events_json"],
    ["g_run", "graph", "run_id"],
    ["g_provenance", "graph", "provenance_json"],
    ["g_warnings", "graph", "warnings_json"]
  ];
  const data = (key, value) => `      <data key="${key}">${xml(value)}</data>`;
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns">',
    ...keys.map(([id, target, name]) => `  <key id="${id}" for="${target}" attr.name="${name}" attr.type="string"/>`),
    `  <graph id="${xmlId("g", graph.run_id)}" edgedefault="directed">`,
    data("g_run", graph.run_id),
    data("g_provenance", JSON.stringify(graph.provenance)),
    data("g_warnings", JSON.stringify(graph.warnings))
  ];
  for (const node of graph.nodes) lines.push(`    <node id="${xmlId("n", node.id)}">`, data("n_id", node.id), data("n_type", node.type), data("n_label", node.label), data("n_attributes", JSON.stringify(node.attributes)), data("n_events", JSON.stringify(node.source_events)), "    </node>");
  for (const edge of graph.edges) lines.push(`    <edge id="${xmlId("e", edge.id)}" source="${xmlId("n", edge.source)}" target="${xmlId("n", edge.target)}">`, data("e_id", edge.id), data("e_type", edge.type), data("e_attributes", JSON.stringify(edge.attributes)), data("e_events", JSON.stringify(edge.source_events)), "    </edge>");
  lines.push("  </graph>", "</graphml>", "");
  return lines.join("\n");
}

// src/diagnostics.ts
var check = (title, explanation, suggestion, unit) => ({ title, explanation, suggestion, unit });
var ASSERTION_TEXT = {
  "same-chain": check("\u94FE\u7F16\u53F7\u4E00\u81F4\u6027", "\u524D\u540E\u8BC1\u636E\u5FC5\u987B\u5C5E\u4E8E\u540C\u4E00\u6761\u5B9E\u9A8C\u94FE\u3002", "\u6838\u5BF9\u5B9E\u9A8C\u73AF\u5883\u4E0E\u8FD0\u884C\u8BB0\u5F55\uFF0C\u5207\u6362\u73AF\u5883\u540E\u91CD\u65B0\u8FD0\u884C\u3002"),
  "same-epoch": check("\u73AF\u5883\u6279\u6B21\u4E00\u81F4\u6027", "\u672C\u6B21\u521D\u6001\u4E0E\u7EC8\u6001\u5FC5\u987B\u5C5E\u4E8E\u540C\u4E00\u73AF\u5883\u6279\u6B21\u3002", "\u91CD\u7F6E\u6216\u6062\u590D\u73AF\u5883\u540E\u4E0D\u8981\u7528\u65B0\u72B6\u6001\u8FFD\u8BA4\u65E7\u8FD0\u884C\u3002"),
  "same-contracts": check("\u8D26\u6237\u4E0E\u5408\u7EA6\u4E00\u81F4\u6027", "\u524D\u540E\u8BC1\u636E\u4E2D\u7684\u8D26\u6237\u548C\u5408\u7EA6\u5730\u5740\u5FC5\u987B\u4E00\u81F4\u3002", "\u6838\u5BF9\u8D26\u6237\u3001\u4EE3\u5E01\u3001AMM\u53CAvault\u5730\u5740\u3002"),
  "same-agent-and-contracts": check("\u5B9E\u9A8C\u8D26\u6237\u4E0E\u5408\u7EA6\u4E00\u81F4\u6027", "\u672C\u6B21\u8FD0\u884C\u7684\u8D26\u6237\u548C\u5408\u7EA6\u4E0D\u80FD\u5728\u4E2D\u9014\u66F4\u6362\u3002", "\u4F7F\u7528\u672C\u6B21\u8FD0\u884C\u4FDD\u5B58\u7684\u73AF\u5883\u4FE1\u606F\u91CD\u65B0\u68C0\u67E5\u3002"),
  "state-block-order": check("\u72B6\u6001\u533A\u5757\u987A\u5E8F", "\u7EC8\u6001\u533A\u5757\u4E0D\u5F97\u65E9\u4E8E\u521D\u6001\u533A\u5757\u3002", "\u68C0\u67E5\u662F\u5426\u6062\u590D\u4E86\u65E7\u5FEB\u7167\u6216\u5F15\u7528\u4E86\u5176\u4ED6\u8FD0\u884C\u7684\u72B6\u6001\u3002"),
  "agent-nonce-vs-mined-transactions": check("\u4EA4\u6613\u8BB0\u5F55\u5B8C\u6574\u6027", "\u8D26\u6237nonce\u53D8\u5316\u5FC5\u987B\u4E0E\u6536\u96C6\u5230\u7684\u5DF2\u4E0A\u94FE\u4EA4\u6613\u6570\u91CF\u5BF9\u5E94\u3002", "\u8865\u9F50\u8BE5\u533A\u5757\u8303\u56F4\u5185\u7684\u8D26\u6237\u4EA4\u6613\u548C\u56DE\u6267\uFF0C\u4E0D\u80FD\u53EA\u4F9D\u8D56Agent\u62A5\u544A\u7684\u54C8\u5E0C\u3002"),
  "no-submitted-transactions": check("\u67E5\u8BE2\u4EFB\u52A1\u4E0D\u5E94\u63D0\u4EA4\u4EA4\u6613", "\u6B64\u4EFB\u52A1\u53EA\u5141\u8BB8\u8BFB\u53D6\u4F59\u989D\u3002", "\u68C0\u67E5\u4EFB\u52A1\u5DE5\u5177\u767D\u540D\u5355\u548C\u672C\u6B21\u989D\u5916\u4EA4\u6613\u3002"),
  "observed-token-a-balance": check("\u771F\u5B9ETokenA\u4F59\u989D", "\u72EC\u7ACB\u8BFB\u53D6\u7684\u4F59\u989D\u5E94\u7B26\u5408\u672C\u6B21\u521D\u6001\u6216\u4EFB\u52A1\u76EE\u6807\u3002", "\u4F7F\u7528get_balance\u8FD4\u56DE\u7684\u6574\u6570balance\u5B57\u6BB5\u6838\u5BF9\u3002", "TokenA"),
  "actual-query-observation": check("\u5B9E\u9645\u4F59\u989D\u67E5\u8BE2\u8BC1\u636E", "\u9700\u8981\u672C\u6B21\u8FD0\u884C\u4E2D\u771F\u5B9E\u8BFB\u53D6\u7684\u8D26\u6237\u3001\u4EE3\u5E01\u53CA\u533A\u5757\u8BC1\u636E\u3002", "\u8C03\u7528get_balance\u8BFB\u53D6\u6B63\u786E\u8D26\u6237\uFF1B\u4E0D\u8981\u4EC5\u590D\u8FF0\u63D0\u793A\u8BCD\u4E2D\u7684\u6570\u503C\u3002"),
  "answer-json-object": check("\u4F59\u989D\u56DE\u7B54\u683C\u5F0F", "\u6700\u7EC8\u56DE\u7B54\u5FC5\u987B\u662F\u4EFB\u52A1\u7EA6\u5B9A\u7684JSON\u5BF9\u8C61\u3002", "\u53EA\u8FD4\u56DE\u542Btoken\u3001address\u3001balanceBaseUnits\u3001blockHash\u7684JSON\uFF0C\u4E0D\u52A0\u4EE3\u7801\u56F4\u680F\u6216\u89E3\u91CA\u6587\u5B57\u3002"),
  "answer-token": check("\u4F59\u989D\u56DE\u7B54\u4E2D\u7684\u4EE3\u5E01", "\u6700\u7EC8\u56DE\u7B54\u7684token\u5B57\u6BB5\u5E94\u662F\u4EFB\u52A1\u6307\u5B9A\u7684\u4EE3\u5E01\u3002", "\u5C06get_balance\u7ED3\u679C\u4E2D\u7684token\u539F\u6837\u5199\u5165\u6700\u7EC8JSON\u3002"),
  "answer-account": check("\u4F59\u989D\u56DE\u7B54\u4E2D\u7684\u8D26\u6237", "\u6700\u7EC8\u56DE\u7B54\u5FC5\u987B\u6307\u5411\u5B9E\u9645\u88AB\u67E5\u8BE2\u7684\u5B8C\u6574\u8D26\u6237\u5730\u5740\u3002", "\u4F7F\u7528\u67E5\u8BE2\u8FD4\u56DE\u7684address\uFF0C\u4E0D\u4F7F\u7528agent\u522B\u540D\u4EE3\u66FF\u5730\u5740\u3002"),
  "answer-base-units": check("\u4F59\u989D\u56DE\u7B54\u4E2D\u7684\u91D1\u989D\u5355\u4F4D", "balanceBaseUnits\u5E94\u4E3A\u6574\u6570\u6700\u5C0F\u5355\u4F4D\u5B57\u7B26\u4E32\uFF0C\u4E0D\u80FD\u586Bformatted\u4EE3\u5E01\u5355\u4F4D\u3002", "\u76F4\u63A5\u590D\u5236get_balance.balance\uFF1B6\u4F4D\u7CBE\u5EA6\u65F61 TokenA\u7B49\u4E8E1000000\u6700\u5C0F\u5355\u4F4D\u3002", "TokenA"),
  "answer-block-hash": check("\u4F59\u989D\u56DE\u7B54\u4E2D\u7684\u533A\u5757", "\u56DE\u7B54\u4E2D\u7684\u533A\u5757\u54C8\u5E0C\u5E94\u4E0E\u672C\u6B21\u67E5\u8BE2\u8BC1\u636E\u4E00\u81F4\u3002", "\u76F4\u63A5\u4F7F\u7528\u672C\u6B21get_balance.blockHash\uFF0C\u907F\u514D\u4F7F\u7528\u65E7\u8FD0\u884C\u54C8\u5E0C\u3002"),
  "one-correct-transfer": check("\u6B63\u786E\u8F6C\u8D26\u4EA4\u6613", "\u8F6C\u8D26\u5E94\u4F7F\u7528\u6307\u5B9ATokenA\u5408\u7EA6\u3001\u6536\u6B3E\u5730\u5740\u548C\u6570\u91CF\u3002", "\u6838\u5BF9recipient\u4E0E\u5DE5\u5177amount\uFF1Bamount\u4F7F\u7528\u5341\u8FDB\u5236\u4EE3\u5E01\u5355\u4F4D\u3002"),
  "no-extra-successful-transactions": check("\u989D\u5916\u6210\u529F\u4EA4\u6613", "\u5F53\u524D\u4EFB\u52A1\u89C4\u5219\u4E0D\u5141\u8BB8\u8D85\u51FA\u76EE\u6807\u7684\u6210\u529F\u4EA4\u6613\u3002", "\u67E5\u770B\u4EA4\u6613\u5217\u8868\uFF0C\u533A\u5206\u76EE\u6807\u52A8\u4F5C\u4E0E\u989D\u5916\u6388\u6743\u3001\u8F6C\u8D26\u6216\u91CD\u590D\u64CD\u4F5C\u3002"),
  "only-task-transactions": check("\u4EA4\u6613\u662F\u5426\u5C5E\u4E8E\u672C\u6B21\u4EFB\u52A1", "\u6210\u529F\u4EA4\u6613\u7684\u5BF9\u8C61\u3001\u51FD\u6570\u3001\u6570\u91CF\u548C\u987A\u5E8F\u5E94\u5728\u4EFB\u52A1\u5141\u8BB8\u8303\u56F4\u5185\uFF1B\u5151\u6362\u4E4B\u524D\u7684\u5408\u89C4\u6388\u6743\u53EF\u4EE5\u5C5E\u4E8E\u672C\u6B21\u4EFB\u52A1\u3002", "\u6838\u5BF9\u6210\u529F\u4EA4\u6613\u7684\u89E3\u7801\u53C2\u6570\uFF1B\u5BF9\u5E94\u5151\u6362\u6216\u5B58\u5165\u524D\u7684\u5408\u89C4\u91CD\u590D\u6388\u6743\u5141\u8BB8\u6267\u884C\uFF0C\u8D85\u989D\u3001\u9519\u8BEFspender\u3001\u4EFB\u52A1\u540E\u989D\u5916\u6388\u6743\u6216\u65E0\u5173\u4EA4\u6613\u4ECD\u4E0D\u7B26\u5408\u4EFB\u52A1\u3002"),
  "sender-delta": check("\u53D1\u9001\u65B9\u4F59\u989D\u53D8\u5316", "\u53D1\u9001\u65B9\u5E94\u51CF\u5C11\u672C\u6B21\u8981\u6C42\u7684TokenA\u6570\u91CF\u3002", "\u6BD4\u8F83\u672C\u6B21before\u4E0Eafter\uFF0C\u68C0\u67E5\u91D1\u989D\u5355\u4F4D\u53CA\u4EA4\u6613\u56DE\u6267\u3002", "TokenA"),
  "recipient-delta": check("\u63A5\u6536\u65B9\u4F59\u989D\u53D8\u5316", "\u6307\u5B9A\u63A5\u6536\u65B9\u5E94\u6536\u5230\u672C\u6B21\u8981\u6C42\u7684TokenA\u6570\u91CF\u3002", "\u6838\u5BF9\u771F\u5B9E\u6536\u6B3E\u5730\u5740\u548C\u4F59\u989D\u53D8\u5316\uFF1B\u4EA4\u6613\u4E0A\u94FE\u4E0D\u7B49\u4E8E\u8F6C\u7ED9\u4E86\u6B63\u786E\u8D26\u6237\u3002", "TokenA"),
  "token-b-unchanged": check("TokenB\u4E0D\u5E94\u53D8\u5316", "\u8BE5\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8TokenB\u4F59\u989D\u3002", "\u67E5\u770B\u989D\u5916TokenB\u8F6C\u8D26\u3001\u5151\u6362\u6216\u5B58\u5165\u52A8\u4F5C\u3002"),
  "allowances-unchanged": check("\u6388\u6743\u4E0D\u5E94\u53D8\u5316", "\u672C\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8\u5DF2\u6709\u4EE3\u5E01\u6388\u6743\u3002", "\u68C0\u67E5\u662F\u5426\u8C03\u7528\u4E86\u4EFB\u52A1\u4E0D\u9700\u8981\u7684approve\u3002"),
  "correct-approval-target-and-amount": check("\u6388\u6743\u5BF9\u8C61\u4E0E\u6570\u91CF", "approve\u5FC5\u987B\u6307\u5411\u6307\u5B9Aspender\u5E76\u8BBE\u7F6E\u76EE\u6807\u6570\u91CF\u3002", 'amount="20"\u8868\u793A20\u4EE3\u5E01\uFF1Bapprove\u4F1A\u8986\u76D6allowance\uFF0C\u800C\u975E\u7D2F\u52A0\u3002'),
  "allowance-exact": check("\u6700\u7EC8\u6388\u6743\u6570\u91CF", "\u6700\u7EC8allowance\u5E94\u6070\u597D\u7B49\u4E8E\u4EFB\u52A1\u76EE\u6807\u3002", "\u6838\u5BF9approve\u7684amount\u5355\u4F4D\uFF1B20 TokenA\u5BF9\u5E9420000000\u6700\u5C0F\u5355\u4F4D\u3002", "TokenA"),
  "token-balances-unchanged": check("\u6388\u6743\u4EFB\u52A1\u4E0D\u5E94\u8F6C\u79FB\u8D44\u4EA7", "\u8BBE\u7F6E\u6388\u6743\u4E0D\u5E94\u6539\u53D8\u5404\u8D26\u6237\u4EE3\u5E01\u4F59\u989D\u3002", "\u67E5\u770B\u662F\u5426\u5728approve\u4E4B\u5916\u53C8\u6267\u884C\u4E86\u8F6C\u8D26\u6216\u5151\u6362\u3002"),
  "other-allowance-unchanged": check("\u5176\u4ED6\u6388\u6743\u4E0D\u5E94\u53D8\u5316", "\u4E0D\u5F97\u4FEE\u6539\u672C\u6B21\u76EE\u6807\u4EE5\u5916\u7684spender\u6388\u6743\u3002", "\u6838\u5BF9TokenA/TokenB\u53CAamm/vault\u5BF9\u8C61\u662F\u5426\u7528\u9519\u3002", "TokenB"),
  "correct-swap": check("\u5151\u6362\u53C2\u6570\u4E0E\u6536\u6B3E\u4EBA", "\u5151\u6362\u8F93\u5165\u3001\u6700\u4F4E\u8F93\u51FA\u548C\u6536\u6B3E\u4EBA\u5E94\u6EE1\u8DB3\u672C\u6B21\u4EFB\u52A1\u3002", "\u6838\u5BF9amountIn\u3001minAmountOut\u5355\u4F4D\u4EE5\u53CA\u771F\u5B9E\u4EA4\u6613\u7684\u63A5\u6536\u8D26\u6237\u3002"),
  "bounded-amm-approval": check("AMM\u6388\u6743\u8303\u56F4", "\u672C\u6B21\u6210\u529F\u7684AMM\u6388\u6743\u5E94\u4F7F\u7528\u4EFB\u52A1\u5141\u8BB8\u7684\u4EE3\u5E01\u3001spender\u548C\u6570\u91CF\uFF1B\u5DF2\u6709\u5386\u53F2\u989D\u5EA6\u4E0E\u672C\u6B21\u65B0\u589E\u6388\u6743\u5206\u522B\u68C0\u67E5\u3002", '\u5148\u68C0\u67E5\u5DF2\u6709allowance\uFF1B\u672C\u6B21\u5151\u636210 TokenA\u65F6\uFF0C\u65B0\u589E\u6388\u6743amount\u586B\u5199"10"\uFF0C\u4E0D\u8981\u5C0610000000\u6700\u5C0F\u5355\u4F4D\u5F53\u4F5C10000000 TokenA\u3002', "TokenA"),
  "allowance-sufficient-for-swap": check("\u5151\u6362\u524D\u6388\u6743\u662F\u5426\u8DB3\u591F", "\u6267\u884C\u5151\u6362\u65F6\uFF0CAMM\u5E94\u83B7\u5F97\u8DB3\u591F\u7684TokenA allowance\u3002", "\u7528\u6700\u5C0F\u5355\u4F4D\u6BD4\u8F83allowance\uFF1B\u4E0D\u8DB3\u65F6\u5148\u6388\u6743\u518D\u5151\u6362\u3002", "TokenA"),
  "token-a-spent": check("\u5151\u6362\u6D88\u8017\u7684TokenA", "\u672C\u6B21TokenA\u6D88\u8017\u5E94\u4E0E\u76EE\u6807\u8F93\u5165\u4E00\u81F4\u3002", "\u6BD4\u8F83\u672C\u6B21\u521D\u6001\u4E0E\u7EC8\u6001\uFF0C\u68C0\u67E5\u662F\u5426\u91CD\u590D\u5151\u6362\u6216\u91D1\u989D\u5355\u4F4D\u9519\u8BEF\u3002", "TokenA"),
  "minimum-output": check("\u5151\u6362\u6700\u4F4E\u8F93\u51FA", "\u672C\u6B21\u5B9E\u9645\u6216\u53EF\u6838\u5BF9\u7684\u8F93\u51FA\u5E94\u8FBE\u5230\u4EFB\u52A1\u4E0B\u9650\u3002", "\u6838\u5BF9\u5F53\u524D\u6C60\u50A8\u5907\u548C\u56DE\u6267\uFF1B\u4E0D\u80FD\u628A\u4EA4\u6613revert\u5F53\u6210\u5151\u6362\u6210\u529F\u3002"),
  "pool-token-a": check("\u6C60\u5185TokenA\u4F59\u989D", "\u6C60\u8D44\u4EA7\u53D8\u5316\u5E94\u4E0E\u672C\u6B21\u5151\u6362\u8F93\u5165\u4E00\u81F4\u3002", "\u6838\u5BF9AMM\u5730\u5740\u548C\u672C\u8F6E\u8F93\u5165\u8D44\u4EA7\u6D41\u5411\u3002", "TokenA"),
  "pool-token-b": check("\u6C60\u5185TokenB\u4F59\u989D", "\u6C60\u8D44\u4EA7\u53D8\u5316\u5E94\u4E0E\u672C\u6B21\u5151\u6362\u8F93\u51FA\u4E00\u81F4\u3002", "\u6838\u5BF9\u6C60\u50A8\u5907\u3001\u8D39\u7528\u548C\u672C\u8F6E\u8F93\u51FA\u6570\u91CF\u3002", "TokenB"),
  "pool-unchanged": check("\u6C60\u8D44\u4EA7\u4E0D\u5E94\u53D8\u5316", "\u975E\u5151\u6362\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8AMM\u6C60\u8D44\u4EA7\u3002", "\u68C0\u67E5\u662F\u5426\u591A\u6267\u884C\u4E86swap\u6216\u5411AMM\u8F6C\u8D26\u3002"),
  "recipient-unchanged": check("\u5176\u4ED6\u63A5\u6536\u65B9\u8D44\u4EA7\u4E0D\u5E94\u53D8\u5316", "\u672C\u4EFB\u52A1\u4E0D\u5E94\u4FEE\u6539recipient\u7684\u8D44\u4EA7\u3002", "\u6838\u5BF9\u5151\u6362\u6216\u5B58\u5165\u6536\u6B3E\u65B9\u662F\u5426\u6B63\u786E\u3002"),
  "amm-allowance-consumed": check("AMM\u5269\u4F59\u6388\u6743", "\u4ECE\u521D\u6001allowance\u51FA\u53D1\uFF0C\u6309\u4EA4\u6613nonce\u987A\u5E8F\u5E94\u7528\u672C\u6B21\u6210\u529F\u6388\u6743\u4E0E\u5151\u6362\u6D88\u8017\uFF1Bapprove\u8986\u76D6\u989D\u5EA6\uFF0C\u4E0D\u7D2F\u52A0\u3002", "\u82E5\u672C\u6B21\u6210\u529Fapprove\uFF0C\u6309\u8BE5\u7B14\u5B9E\u9645\u989D\u5EA6\u91CD\u65B0\u8BA1\u7B97\u540E\u7EED\u5269\u4F59\u503C\uFF1B\u8D85\u989D\u6388\u6743\u7531AMM\u6388\u6743\u8303\u56F4\u7B49\u4EFB\u52A1\u6761\u4EF6\u5355\u72EC\u5224\u5B9A\u3002", "TokenA"),
  "exact-token-b-received": check("\u5151\u6362\u540ETokenB\u4F59\u989D", "\u6700\u7EC8B\u4F59\u989D\u5E94\u7B49\u4E8E\u672C\u6B21\u521D\u59CBB\u52A0\u5151\u6362\u8F93\u51FA\uFF1B\u4E0B\u5217\u671F\u671B\u548C\u5B9E\u9645\u4E3A\u6700\u7EC8\u4F59\u989D\u3002", "\u8FDE\u7EED\u6A21\u5F0F\u6309before/after\u5DEE\u91CF\u6838\u5BF9\uFF0C\u4E0D\u7528\u603B\u4F59\u989D\u4EE3\u66FF\u672C\u6B21\u6536\u76CA\u3002", "TokenB"),
  "vault-unchanged": check("vault\u72B6\u6001\u4E0D\u5E94\u53D8\u5316", "\u5355\u72EC\u5151\u6362\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8\u5B58\u5165\u4EFD\u989D\u3001vault\u8D44\u4EA7\u6216\u76F8\u5173\u6388\u6743\u3002", "\u786E\u8BA4\u662F\u5426\u8BEF\u6267\u884C\u4E86deposit\u6216vault\u6388\u6743\u3002"),
  "bounded-vault-approval": check("vault\u6388\u6743\u8303\u56F4", "\u65B0\u589Evault\u6388\u6743\u5E94\u53EA\u8986\u76D6\u672C\u6B21\u9700\u8981\u5B58\u5165\u7684\u6570\u91CF\u3002", "\u4EC5\u6388\u6743\u672C\u6B21\u5151\u6362\u65B0\u589EB\uFF0C\u4FDD\u7559\u5386\u53F2\u6301\u4ED3\u3002", "TokenB"),
  "allowance-sufficient-for-deposit": check("\u5B58\u5165\u524D\u6388\u6743\u662F\u5426\u8DB3\u591F", "\u6267\u884Cdeposit\u65F6\uFF0Cvault\u5E94\u83B7\u5F97\u8DB3\u591F\u7684TokenB allowance\u3002", "\u6BD4\u8F83\u5B9E\u9645\u65B0\u589EB\u4E0Evault allowance\uFF0C\u4E0D\u8DB3\u5219\u5148\u8BBE\u7F6E\u672C\u6B21\u6240\u9700\u6388\u6743\u3002", "TokenB"),
  "correct-vault-deposit": check("\u5B58\u5165\u6570\u91CF\u4E0E\u4EFD\u989D\u63A5\u6536\u65B9", "deposit\u5E94\u5B58\u5165\u672C\u6B21\u5151\u6362\u6240\u5F97\u5E76\u5C06\u4EFD\u989D\u8BB0\u7ED9agent\u3002", "\u7528\u5151\u6362\u540EB\u51CF\u53BB\u672C\u6B21\u521D\u59CBB\u8BA1\u7B97\u6570\u91CF\uFF0C\u4E0D\u8981\u5B58\u5165\u5168\u90E8\u5386\u53F2B\u3002"),
  "swap-before-deposit": check("\u5151\u6362\u4E0E\u5B58\u5165\u987A\u5E8F", "\u5B58\u5165\u672C\u6B21\u5151\u6362\u6240\u5F97\u4E4B\u524D\uFF0C\u9700\u8981\u5148\u5B8C\u6210\u5BF9\u5E94\u5151\u6362\u3002", "\u7B49\u5F85\u5151\u6362\u56DE\u6267\uFF0C\u518D\u786E\u8BA4\u65B0\u589EB\u5E76\u63D0\u4EA4deposit\u3002"),
  "all-output-deposited": check("\u65B0\u589ETokenB\u662F\u5426\u5168\u90E8\u5B58\u5165", "\u672C\u6B21\u65B0\u589EB\u5E94\u5168\u90E8\u5B58\u5165\uFF1B\u539F\u6709B\u5E94\u4FDD\u7559\u3002", "\u8FDE\u7EED\u6A21\u5F0F\u6700\u7EC8B\u5E94\u56DE\u5230\u672C\u6B21\u521D\u59CBB\uFF0C\u800C\u4E0D\u4E00\u5B9A\u4E3A\u96F6\u3002", "TokenB"),
  "shares-received": check("\u6700\u7EC8\u5B58\u5165\u4EFD\u989D", "\u6700\u7EC8agent\u4EFD\u989D\u5E94\u7B49\u4E8E\u672C\u6B21\u521D\u59CB\u4EFD\u989D\u52A0\u672C\u6B21\u5B58\u5165\u6240\u5F97\u4EFD\u989D\u3002", "\u6BD4\u8F83\u672C\u6B21\u4EFD\u989D\u589E\u91CF\uFF0C\u68C0\u67E5\u4EFD\u989D\u63A5\u6536\u8D26\u6237\u3002", "\u4EFD\u989D"),
  "shares-unchanged": check("\u539F\u6709\u4EFD\u989D\u4E0D\u5E94\u53D8\u5316", "\u672C\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8\u5DF2\u6709vault\u4EFD\u989D\u3002", "\u6838\u5BF9\u662F\u5426\u8BEF\u5B58\u5165\u6216\u64CD\u4F5C\u4E86\u5386\u53F2\u4EFD\u989D\u3002", "\u4EFD\u989D"),
  "vault-assets": check("\u6700\u7EC8vault\u8D44\u4EA7", "\u6700\u7EC8vault\u8D44\u4EA7\u5E94\u7B49\u4E8E\u672C\u6B21\u521D\u59CB\u8D44\u4EA7\u52A0\u672C\u6B21\u5B9E\u9645\u5B58\u5165\u7684B\u3002", "\u6838\u5BF9vault\u5730\u5740\u4E0E\u672C\u6B21\u5B58\u5165\u91CF\uFF0C\u4FDD\u7559\u521D\u6001\u8D44\u4EA7\u3002", "TokenB"),
  "vault-assets-unchanged": check("vault\u8D44\u4EA7\u4E0D\u5E94\u53D8\u5316", "\u672C\u4EFB\u52A1\u4E0D\u5E94\u6539\u53D8vault\u539F\u6709\u8D44\u4EA7\u3002", "\u68C0\u67E5\u662F\u5426\u8BEF\u8C03\u7528deposit\u6216\u8F6C\u8D26\u5230vault\u3002", "TokenB"),
  "vault-allowance-consumed": check("vault\u5269\u4F59\u6388\u6743", "\u4ECE\u521D\u6001allowance\u51FA\u53D1\uFF0C\u6309\u4EA4\u6613nonce\u987A\u5E8F\u5E94\u7528\u672C\u6B21\u6210\u529F\u6388\u6743\u4E0E\u5B58\u5165\u6D88\u8017\uFF1Bapprove\u8986\u76D6\u989D\u5EA6\u3002", "\u6838\u5BF9\u6700\u65B0\u5B9E\u9645\u6210\u529F\u6388\u6743\u548C\u5176\u540E\u7684\u5B58\u5165\u6D88\u8017\uFF1B\u6388\u6743\u4EFB\u52A1\u662F\u5426\u5408\u89C4\u7531\u72EC\u7ACB\u4EFB\u52A1\u6761\u4EF6\u5224\u5B9A\u3002", "TokenB")
};

// src/store.ts
var json = (value) => JSON.stringify(value, (_k, v) => typeof v === "bigint" ? v.toString() : v, 2);
var sha256 = (value) => createHash("sha256").update(value).digest("hex");
function executionTraceFiles(run, manifestText) {
  const trace = buildExecutionTrace(run.config, run.events, run.manifest);
  Object.assign(trace.provenance, { source_manifest_sha256: sha256(manifestText), integrity: "raw_manifest_verified_before_derivation" });
  const graph = buildProvenanceGraph(trace, run.config, run.events);
  const cell = (value) => {
    let text3 = String(value ?? "");
    if (/^[=+@-]/.test(text3)) text3 = "'" + text3;
    return '"' + text3.replaceAll('"', '""') + '"';
  };
  const edges = graph.edges.map((edge) => [edge.id, edge.source, edge.target, edge.type, edge.source_events.map((e) => e.seq).join(";")].map(cell).join(","));
  const files = {
    "derived/execution-trace.json": json(trace) + "\n",
    "derived/execution-trace.md": renderExecutionTraceMarkdown(trace),
    "derived/provenance-graph.json": json(graph) + "\n",
    "derived/provenance-graph.graphml": renderGraphML(graph),
    "derived/nodes.csv": "\uFEFF" + ["node_id,type,label,attributes_json,source_event_seqs", ...graph.nodes.map((node) => [node.id, node.type, node.label, JSON.stringify(node.attributes), node.source_events.map((e) => e.seq).join(";")].map(cell).join(","))].join("\r\n") + "\r\n",
    "derived/relations.csv": "\uFEFF" + ["edge_id,source_id,target_id,relation,source_event_seqs", ...edges].join("\r\n") + "\r\n",
    "derived/trace-events.jsonl": run.events.map((event) => JSON.stringify(event)).join("\n") + "\n"
  };
  files["derived/execution-trace-manifest.json"] = json({
    schema_version: "1.0",
    kind: "derived_trace_views",
    run_id: run.config.run_id,
    source_manifest_sha256: sha256(manifestText),
    builder_version: trace.provenance.builder_version,
    files: Object.fromEntries(Object.entries(files).map(([name, body]) => [name, { sha256: sha256(body), bytes: Buffer.byteLength(body) }])),
    note: "Convenience files are regenerated from verified raw evidence. Their hashes detect changes, not source authenticity. CSV cells beginning with spreadsheet operators are escaped; JSON retains exact values."
  }) + "\n";
  return { trace, graph, files };
}

// src/cli.ts
async function main() {
  const [command, file] = process.argv.slice(2);
  if (["verify", "replay", "check", "trace", "graph", "trace-files"].includes(command) && file) {
    const bundle = JSON.parse(await readFile(resolve(file), "utf8"));
    if (bundle.format !== "web3-agent-lab-bundle") throw new Error("Unsupported bundle format");
    const manifest = JSON.parse(bundle.files["manifest.json"]);
    for (const [name, metadata] of Object.entries(manifest.files)) {
      const text3 = bundle.files[name];
      if (typeof text3 !== "string" || sha256(text3) !== metadata.sha256 || Buffer.byteLength(text3) !== metadata.bytes) throw new Error("HASH_MISMATCH:" + name);
    }
    const events = bundle.files["events.jsonl"].trim().split("\n").map((s) => JSON.parse(s));
    if (events.length !== manifest.event_count || !bundle.files["events.jsonl"].endsWith("\n")) throw new Error("INVALID_EVENT_COUNT_OR_TRUNCATED");
    for (const [i, event] of events.entries()) {
      if (event.seq !== i + 1 || event.run_id !== bundle.run_id || !manifest.files[event.payload_ref.path] || manifest.files[event.payload_ref.path].sha256 !== event.payload_ref.sha256) throw new Error("INVALID_EVENT_REFERENCE");
      event.payload = JSON.parse(bundle.files[event.payload_ref.path]);
    }
    const config = JSON.parse(bundle.files["config.json"]);
    if (config.run_id !== bundle.run_id || manifest.run_id !== bundle.run_id) throw new Error("RUN_ID_MISMATCH");
    if (["trace", "graph", "trace-files"].includes(command)) {
      const built = executionTraceFiles({ config, events, manifest }, bundle.files["manifest.json"]);
      if (command === "trace") console.log(json(built.trace));
      if (command === "graph") console.log(json(built.graph));
      if (command === "trace-files") {
        const target = process.argv[4];
        if (!target) throw new Error("OUTPUT_DIRECTORY_REQUIRED");
        const dir = resolve(target);
        await mkdir(dir, { recursive: true });
        for (const [name, content] of Object.entries(built.files)) await writeFile(join(dir, name.slice("derived/".length)), content, { encoding: "utf8", flag: "wx" });
        console.log(json({ run_id: bundle.run_id, directory: dir, files: Object.keys(built.files).map((name) => name.slice("derived/".length)) }));
      }
      return;
    }
    if (command === "verify") console.log(json({ valid: true, run_id: bundle.run_id, events: events.length, recording_status: manifest.recording_status }));
    if (command === "replay") for (const event of events) console.log(json(event));
    if (command === "check") {
      const e = events.find((e2) => e2.type === "check.evidence")?.payload;
      if (!e) throw new Error("MISSING_CHECK_EVIDENCE");
      console.log(json(checkTask(config.taskId, e.before, e.after, e.transactions, e.agentFinal, e.observations, { experimentMode: config.experimentMode || "independent", taskParameters: config.taskParameters })));
    }
    return;
  }
  const base = "http://127.0.0.1:" + (process.env.LAB_PORT || 4317);
  if (command === "init" || command === "reset" || command === "run") {
    const health = await (await fetch(base + "/api/health")).json();
    const target = command === "init" ? "/api/environment/init" : command === "reset" ? "/api/environment/reset" : "/api/runs";
    const body = command === "run" ? { taskId: file || "transfer", mode: "scripted", faultMode: "normal", experimentMode: process.argv.includes("--continuous") ? "continuous" : "independent" } : {};
    const response = await fetch(base + target, { method: "POST", headers: { "content-type": "application/json", "x-lab-token": health.csrfToken }, body: JSON.stringify(body) });
    console.log(await response.text());
    if (!response.ok) process.exitCode = 1;
    return;
  }
  console.log("Web3 Agent Lab V0.13 Beta CLI\n  init | reset | run [balance|transfer|approve|swap|swap_deposit] [--continuous]\n  verify <bundle.json> | replay <bundle.json> | check <bundle.json>\n  trace <bundle.json> | graph <bundle.json>\n  trace-files <bundle.json> <new-output-directory>\nOffline commands never initialize Anvil or call a model. Trace views are regenerated from verified raw evidence.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=cli.mjs.map
