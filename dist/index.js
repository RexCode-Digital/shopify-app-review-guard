import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@iarna/toml/lib/parser.js
var require_parser = __commonJS({
  "node_modules/@iarna/toml/lib/parser.js"(exports2, module2) {
    "use strict";
    var ParserEND = 1114112;
    var ParserError = class _ParserError extends Error {
      /* istanbul ignore next */
      constructor(msg, filename, linenumber) {
        super("[ParserError] " + msg, filename, linenumber);
        this.name = "ParserError";
        this.code = "ParserError";
        if (Error.captureStackTrace) Error.captureStackTrace(this, _ParserError);
      }
    };
    var State = class {
      constructor(parser) {
        this.parser = parser;
        this.buf = "";
        this.returned = null;
        this.result = null;
        this.resultTable = null;
        this.resultArr = null;
      }
    };
    var Parser = class {
      constructor() {
        this.pos = 0;
        this.col = 0;
        this.line = 0;
        this.obj = {};
        this.ctx = this.obj;
        this.stack = [];
        this._buf = "";
        this.char = null;
        this.ii = 0;
        this.state = new State(this.parseStart);
      }
      parse(str) {
        if (str.length === 0 || str.length == null) return;
        this._buf = String(str);
        this.ii = -1;
        this.char = -1;
        let getNext;
        while (getNext === false || this.nextChar()) {
          getNext = this.runOne();
        }
        this._buf = null;
      }
      nextChar() {
        if (this.char === 10) {
          ++this.line;
          this.col = -1;
        }
        ++this.ii;
        this.char = this._buf.codePointAt(this.ii);
        ++this.pos;
        ++this.col;
        return this.haveBuffer();
      }
      haveBuffer() {
        return this.ii < this._buf.length;
      }
      runOne() {
        return this.state.parser.call(this, this.state.returned);
      }
      finish() {
        this.char = ParserEND;
        let last;
        do {
          last = this.state.parser;
          this.runOne();
        } while (this.state.parser !== last);
        this.ctx = null;
        this.state = null;
        this._buf = null;
        return this.obj;
      }
      next(fn) {
        if (typeof fn !== "function") throw new ParserError("Tried to set state to non-existent state: " + JSON.stringify(fn));
        this.state.parser = fn;
      }
      goto(fn) {
        this.next(fn);
        return this.runOne();
      }
      call(fn, returnWith) {
        if (returnWith) this.next(returnWith);
        this.stack.push(this.state);
        this.state = new State(fn);
      }
      callNow(fn, returnWith) {
        this.call(fn, returnWith);
        return this.runOne();
      }
      return(value) {
        if (this.stack.length === 0) throw this.error(new ParserError("Stack underflow"));
        if (value === void 0) value = this.state.buf;
        this.state = this.stack.pop();
        this.state.returned = value;
      }
      returnNow(value) {
        this.return(value);
        return this.runOne();
      }
      consume() {
        if (this.char === ParserEND) throw this.error(new ParserError("Unexpected end-of-buffer"));
        this.state.buf += this._buf[this.ii];
      }
      error(err) {
        err.line = this.line;
        err.col = this.col;
        err.pos = this.pos;
        return err;
      }
      /* istanbul ignore next */
      parseStart() {
        throw new ParserError("Must declare a parseStart method");
      }
    };
    Parser.END = ParserEND;
    Parser.Error = ParserError;
    module2.exports = Parser;
  }
});

// node_modules/@iarna/toml/lib/create-datetime.js
var require_create_datetime = __commonJS({
  "node_modules/@iarna/toml/lib/create-datetime.js"(exports2, module2) {
    "use strict";
    module2.exports = (value) => {
      const date = new Date(value);
      if (isNaN(date)) {
        throw new TypeError("Invalid Datetime");
      } else {
        return date;
      }
    };
  }
});

// node_modules/@iarna/toml/lib/format-num.js
var require_format_num = __commonJS({
  "node_modules/@iarna/toml/lib/format-num.js"(exports2, module2) {
    "use strict";
    module2.exports = (d, num) => {
      num = String(num);
      while (num.length < d) num = "0" + num;
      return num;
    };
  }
});

// node_modules/@iarna/toml/lib/create-datetime-float.js
var require_create_datetime_float = __commonJS({
  "node_modules/@iarna/toml/lib/create-datetime-float.js"(exports2, module2) {
    "use strict";
    var f = require_format_num();
    var FloatingDateTime = class extends Date {
      constructor(value) {
        super(value + "Z");
        this.isFloating = true;
      }
      toISOString() {
        const date = `${this.getUTCFullYear()}-${f(2, this.getUTCMonth() + 1)}-${f(2, this.getUTCDate())}`;
        const time = `${f(2, this.getUTCHours())}:${f(2, this.getUTCMinutes())}:${f(2, this.getUTCSeconds())}.${f(3, this.getUTCMilliseconds())}`;
        return `${date}T${time}`;
      }
    };
    module2.exports = (value) => {
      const date = new FloatingDateTime(value);
      if (isNaN(date)) {
        throw new TypeError("Invalid Datetime");
      } else {
        return date;
      }
    };
  }
});

// node_modules/@iarna/toml/lib/create-date.js
var require_create_date = __commonJS({
  "node_modules/@iarna/toml/lib/create-date.js"(exports2, module2) {
    "use strict";
    var f = require_format_num();
    var DateTime = global.Date;
    var Date2 = class extends DateTime {
      constructor(value) {
        super(value);
        this.isDate = true;
      }
      toISOString() {
        return `${this.getUTCFullYear()}-${f(2, this.getUTCMonth() + 1)}-${f(2, this.getUTCDate())}`;
      }
    };
    module2.exports = (value) => {
      const date = new Date2(value);
      if (isNaN(date)) {
        throw new TypeError("Invalid Datetime");
      } else {
        return date;
      }
    };
  }
});

// node_modules/@iarna/toml/lib/create-time.js
var require_create_time = __commonJS({
  "node_modules/@iarna/toml/lib/create-time.js"(exports2, module2) {
    "use strict";
    var f = require_format_num();
    var Time = class extends Date {
      constructor(value) {
        super(`0000-01-01T${value}Z`);
        this.isTime = true;
      }
      toISOString() {
        return `${f(2, this.getUTCHours())}:${f(2, this.getUTCMinutes())}:${f(2, this.getUTCSeconds())}.${f(3, this.getUTCMilliseconds())}`;
      }
    };
    module2.exports = (value) => {
      const date = new Time(value);
      if (isNaN(date)) {
        throw new TypeError("Invalid Datetime");
      } else {
        return date;
      }
    };
  }
});

// node_modules/@iarna/toml/lib/toml-parser.js
var require_toml_parser = __commonJS({
  "node_modules/@iarna/toml/lib/toml-parser.js"(exports, module) {
    "use strict";
    module.exports = makeParserClass(require_parser());
    module.exports.makeParserClass = makeParserClass;
    var TomlError = class _TomlError extends Error {
      constructor(msg) {
        super(msg);
        this.name = "TomlError";
        if (Error.captureStackTrace) Error.captureStackTrace(this, _TomlError);
        this.fromTOML = true;
        this.wrapped = null;
      }
    };
    TomlError.wrap = (err) => {
      const terr = new TomlError(err.message);
      terr.code = err.code;
      terr.wrapped = err;
      return terr;
    };
    module.exports.TomlError = TomlError;
    var createDateTime = require_create_datetime();
    var createDateTimeFloat = require_create_datetime_float();
    var createDate = require_create_date();
    var createTime = require_create_time();
    var CTRL_I = 9;
    var CTRL_J = 10;
    var CTRL_M = 13;
    var CTRL_CHAR_BOUNDARY = 31;
    var CHAR_SP = 32;
    var CHAR_QUOT = 34;
    var CHAR_NUM = 35;
    var CHAR_APOS = 39;
    var CHAR_PLUS = 43;
    var CHAR_COMMA = 44;
    var CHAR_HYPHEN = 45;
    var CHAR_PERIOD = 46;
    var CHAR_0 = 48;
    var CHAR_1 = 49;
    var CHAR_7 = 55;
    var CHAR_9 = 57;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_A = 65;
    var CHAR_E = 69;
    var CHAR_F = 70;
    var CHAR_T = 84;
    var CHAR_U = 85;
    var CHAR_Z = 90;
    var CHAR_LOWBAR = 95;
    var CHAR_a = 97;
    var CHAR_b = 98;
    var CHAR_e = 101;
    var CHAR_f = 102;
    var CHAR_i = 105;
    var CHAR_l = 108;
    var CHAR_n = 110;
    var CHAR_o = 111;
    var CHAR_r = 114;
    var CHAR_s = 115;
    var CHAR_t = 116;
    var CHAR_u = 117;
    var CHAR_x = 120;
    var CHAR_z = 122;
    var CHAR_LCUB = 123;
    var CHAR_RCUB = 125;
    var CHAR_LSQB = 91;
    var CHAR_BSOL = 92;
    var CHAR_RSQB = 93;
    var CHAR_DEL = 127;
    var SURROGATE_FIRST = 55296;
    var SURROGATE_LAST = 57343;
    var escapes = {
      [CHAR_b]: "\b",
      [CHAR_t]: "	",
      [CHAR_n]: "\n",
      [CHAR_f]: "\f",
      [CHAR_r]: "\r",
      [CHAR_QUOT]: '"',
      [CHAR_BSOL]: "\\"
    };
    function isDigit(cp) {
      return cp >= CHAR_0 && cp <= CHAR_9;
    }
    function isHexit(cp) {
      return cp >= CHAR_A && cp <= CHAR_F || cp >= CHAR_a && cp <= CHAR_f || cp >= CHAR_0 && cp <= CHAR_9;
    }
    function isBit(cp) {
      return cp === CHAR_1 || cp === CHAR_0;
    }
    function isOctit(cp) {
      return cp >= CHAR_0 && cp <= CHAR_7;
    }
    function isAlphaNumQuoteHyphen(cp) {
      return cp >= CHAR_A && cp <= CHAR_Z || cp >= CHAR_a && cp <= CHAR_z || cp >= CHAR_0 && cp <= CHAR_9 || cp === CHAR_APOS || cp === CHAR_QUOT || cp === CHAR_LOWBAR || cp === CHAR_HYPHEN;
    }
    function isAlphaNumHyphen(cp) {
      return cp >= CHAR_A && cp <= CHAR_Z || cp >= CHAR_a && cp <= CHAR_z || cp >= CHAR_0 && cp <= CHAR_9 || cp === CHAR_LOWBAR || cp === CHAR_HYPHEN;
    }
    var _type = /* @__PURE__ */ Symbol("type");
    var _declared = /* @__PURE__ */ Symbol("declared");
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var defineProperty = Object.defineProperty;
    var descriptor = { configurable: true, enumerable: true, writable: true, value: void 0 };
    function hasKey(obj, key) {
      if (hasOwnProperty.call(obj, key)) return true;
      if (key === "__proto__") defineProperty(obj, "__proto__", descriptor);
      return false;
    }
    var INLINE_TABLE = /* @__PURE__ */ Symbol("inline-table");
    function InlineTable() {
      return Object.defineProperties({}, {
        [_type]: { value: INLINE_TABLE }
      });
    }
    function isInlineTable(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === INLINE_TABLE;
    }
    var TABLE = /* @__PURE__ */ Symbol("table");
    function Table() {
      return Object.defineProperties({}, {
        [_type]: { value: TABLE },
        [_declared]: { value: false, writable: true }
      });
    }
    function isTable(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === TABLE;
    }
    var _contentType = /* @__PURE__ */ Symbol("content-type");
    var INLINE_LIST = /* @__PURE__ */ Symbol("inline-list");
    function InlineList(type) {
      return Object.defineProperties([], {
        [_type]: { value: INLINE_LIST },
        [_contentType]: { value: type }
      });
    }
    function isInlineList(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === INLINE_LIST;
    }
    var LIST = /* @__PURE__ */ Symbol("list");
    function List() {
      return Object.defineProperties([], {
        [_type]: { value: LIST }
      });
    }
    function isList(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === LIST;
    }
    var _custom;
    try {
      const utilInspect = eval("require('util').inspect");
      _custom = utilInspect.custom;
    } catch (_) {
    }
    var _inspect = _custom || "inspect";
    var BoxedBigInt = class {
      constructor(value) {
        try {
          this.value = global.BigInt.asIntN(64, value);
        } catch (_) {
          this.value = null;
        }
        Object.defineProperty(this, _type, { value: INTEGER });
      }
      isNaN() {
        return this.value === null;
      }
      /* istanbul ignore next */
      toString() {
        return String(this.value);
      }
      /* istanbul ignore next */
      [_inspect]() {
        return `[BigInt: ${this.toString()}]}`;
      }
      valueOf() {
        return this.value;
      }
    };
    var INTEGER = /* @__PURE__ */ Symbol("integer");
    function Integer(value) {
      let num = Number(value);
      if (Object.is(num, -0)) num = 0;
      if (global.BigInt && !Number.isSafeInteger(num)) {
        return new BoxedBigInt(value);
      } else {
        return Object.defineProperties(new Number(num), {
          isNaN: { value: function() {
            return isNaN(this);
          } },
          [_type]: { value: INTEGER },
          [_inspect]: { value: () => `[Integer: ${value}]` }
        });
      }
    }
    function isInteger(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === INTEGER;
    }
    var FLOAT = /* @__PURE__ */ Symbol("float");
    function Float(value) {
      return Object.defineProperties(new Number(value), {
        [_type]: { value: FLOAT },
        [_inspect]: { value: () => `[Float: ${value}]` }
      });
    }
    function isFloat(obj) {
      if (obj === null || typeof obj !== "object") return false;
      return obj[_type] === FLOAT;
    }
    function tomlType(value) {
      const type = typeof value;
      if (type === "object") {
        if (value === null) return "null";
        if (value instanceof Date) return "datetime";
        if (_type in value) {
          switch (value[_type]) {
            case INLINE_TABLE:
              return "inline-table";
            case INLINE_LIST:
              return "inline-list";
            /* istanbul ignore next */
            case TABLE:
              return "table";
            /* istanbul ignore next */
            case LIST:
              return "list";
            case FLOAT:
              return "float";
            case INTEGER:
              return "integer";
          }
        }
      }
      return type;
    }
    function makeParserClass(Parser) {
      class TOMLParser extends Parser {
        constructor() {
          super();
          this.ctx = this.obj = Table();
        }
        /* MATCH HELPER */
        atEndOfWord() {
          return this.char === CHAR_NUM || this.char === CTRL_I || this.char === CHAR_SP || this.atEndOfLine();
        }
        atEndOfLine() {
          return this.char === Parser.END || this.char === CTRL_J || this.char === CTRL_M;
        }
        parseStart() {
          if (this.char === Parser.END) {
            return null;
          } else if (this.char === CHAR_LSQB) {
            return this.call(this.parseTableOrList);
          } else if (this.char === CHAR_NUM) {
            return this.call(this.parseComment);
          } else if (this.char === CTRL_J || this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
            return null;
          } else if (isAlphaNumQuoteHyphen(this.char)) {
            return this.callNow(this.parseAssignStatement);
          } else {
            throw this.error(new TomlError(`Unknown character "${this.char}"`));
          }
        }
        // HELPER, this strips any whitespace and comments to the end of the line
        // then RETURNS. Last state in a production.
        parseWhitespaceToEOL() {
          if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
            return null;
          } else if (this.char === CHAR_NUM) {
            return this.goto(this.parseComment);
          } else if (this.char === Parser.END || this.char === CTRL_J) {
            return this.return();
          } else {
            throw this.error(new TomlError("Unexpected character, expected only whitespace or comments till end of line"));
          }
        }
        /* ASSIGNMENT: key = value */
        parseAssignStatement() {
          return this.callNow(this.parseAssign, this.recordAssignStatement);
        }
        recordAssignStatement(kv) {
          let target = this.ctx;
          let finalKey = kv.key.pop();
          for (let kw of kv.key) {
            if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared])) {
              throw this.error(new TomlError("Can't redefine existing key"));
            }
            target = target[kw] = target[kw] || Table();
          }
          if (hasKey(target, finalKey)) {
            throw this.error(new TomlError("Can't redefine existing key"));
          }
          if (isInteger(kv.value) || isFloat(kv.value)) {
            target[finalKey] = kv.value.valueOf();
          } else {
            target[finalKey] = kv.value;
          }
          return this.goto(this.parseWhitespaceToEOL);
        }
        /* ASSSIGNMENT expression, key = value possibly inside an inline table */
        parseAssign() {
          return this.callNow(this.parseKeyword, this.recordAssignKeyword);
        }
        recordAssignKeyword(key) {
          if (this.state.resultTable) {
            this.state.resultTable.push(key);
          } else {
            this.state.resultTable = [key];
          }
          return this.goto(this.parseAssignKeywordPreDot);
        }
        parseAssignKeywordPreDot() {
          if (this.char === CHAR_PERIOD) {
            return this.next(this.parseAssignKeywordPostDot);
          } else if (this.char !== CHAR_SP && this.char !== CTRL_I) {
            return this.goto(this.parseAssignEqual);
          }
        }
        parseAssignKeywordPostDot() {
          if (this.char !== CHAR_SP && this.char !== CTRL_I) {
            return this.callNow(this.parseKeyword, this.recordAssignKeyword);
          }
        }
        parseAssignEqual() {
          if (this.char === CHAR_EQUALS) {
            return this.next(this.parseAssignPreValue);
          } else {
            throw this.error(new TomlError('Invalid character, expected "="'));
          }
        }
        parseAssignPreValue() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else {
            return this.callNow(this.parseValue, this.recordAssignValue);
          }
        }
        recordAssignValue(value) {
          return this.returnNow({ key: this.state.resultTable, value });
        }
        /* COMMENTS: #...eol */
        parseComment() {
          do {
            if (this.char === Parser.END || this.char === CTRL_J) {
              return this.return();
            }
          } while (this.nextChar());
        }
        /* TABLES AND LISTS, [foo] and [[foo]] */
        parseTableOrList() {
          if (this.char === CHAR_LSQB) {
            this.next(this.parseList);
          } else {
            return this.goto(this.parseTable);
          }
        }
        /* TABLE [foo.bar.baz] */
        parseTable() {
          this.ctx = this.obj;
          return this.goto(this.parseTableNext);
        }
        parseTableNext() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else {
            return this.callNow(this.parseKeyword, this.parseTableMore);
          }
        }
        parseTableMore(keyword) {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else if (this.char === CHAR_RSQB) {
            if (hasKey(this.ctx, keyword) && (!isTable(this.ctx[keyword]) || this.ctx[keyword][_declared])) {
              throw this.error(new TomlError("Can't redefine existing key"));
            } else {
              this.ctx = this.ctx[keyword] = this.ctx[keyword] || Table();
              this.ctx[_declared] = true;
            }
            return this.next(this.parseWhitespaceToEOL);
          } else if (this.char === CHAR_PERIOD) {
            if (!hasKey(this.ctx, keyword)) {
              this.ctx = this.ctx[keyword] = Table();
            } else if (isTable(this.ctx[keyword])) {
              this.ctx = this.ctx[keyword];
            } else if (isList(this.ctx[keyword])) {
              this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
            } else {
              throw this.error(new TomlError("Can't redefine existing key"));
            }
            return this.next(this.parseTableNext);
          } else {
            throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
          }
        }
        /* LIST [[a.b.c]] */
        parseList() {
          this.ctx = this.obj;
          return this.goto(this.parseListNext);
        }
        parseListNext() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else {
            return this.callNow(this.parseKeyword, this.parseListMore);
          }
        }
        parseListMore(keyword) {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else if (this.char === CHAR_RSQB) {
            if (!hasKey(this.ctx, keyword)) {
              this.ctx[keyword] = List();
            }
            if (isInlineList(this.ctx[keyword])) {
              throw this.error(new TomlError("Can't extend an inline array"));
            } else if (isList(this.ctx[keyword])) {
              const next = Table();
              this.ctx[keyword].push(next);
              this.ctx = next;
            } else {
              throw this.error(new TomlError("Can't redefine an existing key"));
            }
            return this.next(this.parseListEnd);
          } else if (this.char === CHAR_PERIOD) {
            if (!hasKey(this.ctx, keyword)) {
              this.ctx = this.ctx[keyword] = Table();
            } else if (isInlineList(this.ctx[keyword])) {
              throw this.error(new TomlError("Can't extend an inline array"));
            } else if (isInlineTable(this.ctx[keyword])) {
              throw this.error(new TomlError("Can't extend an inline table"));
            } else if (isList(this.ctx[keyword])) {
              this.ctx = this.ctx[keyword][this.ctx[keyword].length - 1];
            } else if (isTable(this.ctx[keyword])) {
              this.ctx = this.ctx[keyword];
            } else {
              throw this.error(new TomlError("Can't redefine an existing key"));
            }
            return this.next(this.parseListNext);
          } else {
            throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
          }
        }
        parseListEnd(keyword) {
          if (this.char === CHAR_RSQB) {
            return this.next(this.parseWhitespaceToEOL);
          } else {
            throw this.error(new TomlError("Unexpected character, expected whitespace, . or ]"));
          }
        }
        /* VALUE string, number, boolean, inline list, inline object */
        parseValue() {
          if (this.char === Parser.END) {
            throw this.error(new TomlError("Key without value"));
          } else if (this.char === CHAR_QUOT) {
            return this.next(this.parseDoubleString);
          }
          if (this.char === CHAR_APOS) {
            return this.next(this.parseSingleString);
          } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
            return this.goto(this.parseNumberSign);
          } else if (this.char === CHAR_i) {
            return this.next(this.parseInf);
          } else if (this.char === CHAR_n) {
            return this.next(this.parseNan);
          } else if (isDigit(this.char)) {
            return this.goto(this.parseNumberOrDateTime);
          } else if (this.char === CHAR_t || this.char === CHAR_f) {
            return this.goto(this.parseBoolean);
          } else if (this.char === CHAR_LSQB) {
            return this.call(this.parseInlineList, this.recordValue);
          } else if (this.char === CHAR_LCUB) {
            return this.call(this.parseInlineTable, this.recordValue);
          } else {
            throw this.error(new TomlError("Unexpected character, expecting string, number, datetime, boolean, inline array or inline table"));
          }
        }
        recordValue(value) {
          return this.returnNow(value);
        }
        parseInf() {
          if (this.char === CHAR_n) {
            return this.next(this.parseInf2);
          } else {
            throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'));
          }
        }
        parseInf2() {
          if (this.char === CHAR_f) {
            if (this.state.buf === "-") {
              return this.return(-Infinity);
            } else {
              return this.return(Infinity);
            }
          } else {
            throw this.error(new TomlError('Unexpected character, expected "inf", "+inf" or "-inf"'));
          }
        }
        parseNan() {
          if (this.char === CHAR_a) {
            return this.next(this.parseNan2);
          } else {
            throw this.error(new TomlError('Unexpected character, expected "nan"'));
          }
        }
        parseNan2() {
          if (this.char === CHAR_n) {
            return this.return(NaN);
          } else {
            throw this.error(new TomlError('Unexpected character, expected "nan"'));
          }
        }
        /* KEYS, barewords or basic, literal, or dotted */
        parseKeyword() {
          if (this.char === CHAR_QUOT) {
            return this.next(this.parseBasicString);
          } else if (this.char === CHAR_APOS) {
            return this.next(this.parseLiteralString);
          } else {
            return this.goto(this.parseBareKey);
          }
        }
        /* KEYS: barewords */
        parseBareKey() {
          do {
            if (this.char === Parser.END) {
              throw this.error(new TomlError("Key ended without value"));
            } else if (isAlphaNumHyphen(this.char)) {
              this.consume();
            } else if (this.state.buf.length === 0) {
              throw this.error(new TomlError("Empty bare keys are not allowed"));
            } else {
              return this.returnNow();
            }
          } while (this.nextChar());
        }
        /* STRINGS, single quoted (literal) */
        parseSingleString() {
          if (this.char === CHAR_APOS) {
            return this.next(this.parseLiteralMultiStringMaybe);
          } else {
            return this.goto(this.parseLiteralString);
          }
        }
        parseLiteralString() {
          do {
            if (this.char === CHAR_APOS) {
              return this.return();
            } else if (this.atEndOfLine()) {
              throw this.error(new TomlError("Unterminated string"));
            } else if (this.char === CHAR_DEL || this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I) {
              throw this.errorControlCharInString();
            } else {
              this.consume();
            }
          } while (this.nextChar());
        }
        parseLiteralMultiStringMaybe() {
          if (this.char === CHAR_APOS) {
            return this.next(this.parseLiteralMultiString);
          } else {
            return this.returnNow();
          }
        }
        parseLiteralMultiString() {
          if (this.char === CTRL_M) {
            return null;
          } else if (this.char === CTRL_J) {
            return this.next(this.parseLiteralMultiStringContent);
          } else {
            return this.goto(this.parseLiteralMultiStringContent);
          }
        }
        parseLiteralMultiStringContent() {
          do {
            if (this.char === CHAR_APOS) {
              return this.next(this.parseLiteralMultiEnd);
            } else if (this.char === Parser.END) {
              throw this.error(new TomlError("Unterminated multi-line string"));
            } else if (this.char === CHAR_DEL || this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I && this.char !== CTRL_J && this.char !== CTRL_M) {
              throw this.errorControlCharInString();
            } else {
              this.consume();
            }
          } while (this.nextChar());
        }
        parseLiteralMultiEnd() {
          if (this.char === CHAR_APOS) {
            return this.next(this.parseLiteralMultiEnd2);
          } else {
            this.state.buf += "'";
            return this.goto(this.parseLiteralMultiStringContent);
          }
        }
        parseLiteralMultiEnd2() {
          if (this.char === CHAR_APOS) {
            return this.return();
          } else {
            this.state.buf += "''";
            return this.goto(this.parseLiteralMultiStringContent);
          }
        }
        /* STRINGS double quoted */
        parseDoubleString() {
          if (this.char === CHAR_QUOT) {
            return this.next(this.parseMultiStringMaybe);
          } else {
            return this.goto(this.parseBasicString);
          }
        }
        parseBasicString() {
          do {
            if (this.char === CHAR_BSOL) {
              return this.call(this.parseEscape, this.recordEscapeReplacement);
            } else if (this.char === CHAR_QUOT) {
              return this.return();
            } else if (this.atEndOfLine()) {
              throw this.error(new TomlError("Unterminated string"));
            } else if (this.char === CHAR_DEL || this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I) {
              throw this.errorControlCharInString();
            } else {
              this.consume();
            }
          } while (this.nextChar());
        }
        recordEscapeReplacement(replacement) {
          this.state.buf += replacement;
          return this.goto(this.parseBasicString);
        }
        parseMultiStringMaybe() {
          if (this.char === CHAR_QUOT) {
            return this.next(this.parseMultiString);
          } else {
            return this.returnNow();
          }
        }
        parseMultiString() {
          if (this.char === CTRL_M) {
            return null;
          } else if (this.char === CTRL_J) {
            return this.next(this.parseMultiStringContent);
          } else {
            return this.goto(this.parseMultiStringContent);
          }
        }
        parseMultiStringContent() {
          do {
            if (this.char === CHAR_BSOL) {
              return this.call(this.parseMultiEscape, this.recordMultiEscapeReplacement);
            } else if (this.char === CHAR_QUOT) {
              return this.next(this.parseMultiEnd);
            } else if (this.char === Parser.END) {
              throw this.error(new TomlError("Unterminated multi-line string"));
            } else if (this.char === CHAR_DEL || this.char <= CTRL_CHAR_BOUNDARY && this.char !== CTRL_I && this.char !== CTRL_J && this.char !== CTRL_M) {
              throw this.errorControlCharInString();
            } else {
              this.consume();
            }
          } while (this.nextChar());
        }
        errorControlCharInString() {
          let displayCode = "\\u00";
          if (this.char < 16) {
            displayCode += "0";
          }
          displayCode += this.char.toString(16);
          return this.error(new TomlError(`Control characters (codes < 0x1f and 0x7f) are not allowed in strings, use ${displayCode} instead`));
        }
        recordMultiEscapeReplacement(replacement) {
          this.state.buf += replacement;
          return this.goto(this.parseMultiStringContent);
        }
        parseMultiEnd() {
          if (this.char === CHAR_QUOT) {
            return this.next(this.parseMultiEnd2);
          } else {
            this.state.buf += '"';
            return this.goto(this.parseMultiStringContent);
          }
        }
        parseMultiEnd2() {
          if (this.char === CHAR_QUOT) {
            return this.return();
          } else {
            this.state.buf += '""';
            return this.goto(this.parseMultiStringContent);
          }
        }
        parseMultiEscape() {
          if (this.char === CTRL_M || this.char === CTRL_J) {
            return this.next(this.parseMultiTrim);
          } else if (this.char === CHAR_SP || this.char === CTRL_I) {
            return this.next(this.parsePreMultiTrim);
          } else {
            return this.goto(this.parseEscape);
          }
        }
        parsePreMultiTrim() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else if (this.char === CTRL_M || this.char === CTRL_J) {
            return this.next(this.parseMultiTrim);
          } else {
            throw this.error(new TomlError("Can't escape whitespace"));
          }
        }
        parseMultiTrim() {
          if (this.char === CTRL_J || this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M) {
            return null;
          } else {
            return this.returnNow();
          }
        }
        parseEscape() {
          if (this.char in escapes) {
            return this.return(escapes[this.char]);
          } else if (this.char === CHAR_u) {
            return this.call(this.parseSmallUnicode, this.parseUnicodeReturn);
          } else if (this.char === CHAR_U) {
            return this.call(this.parseLargeUnicode, this.parseUnicodeReturn);
          } else {
            throw this.error(new TomlError("Unknown escape character: " + this.char));
          }
        }
        parseUnicodeReturn(char) {
          try {
            const codePoint = parseInt(char, 16);
            if (codePoint >= SURROGATE_FIRST && codePoint <= SURROGATE_LAST) {
              throw this.error(new TomlError("Invalid unicode, character in range 0xD800 - 0xDFFF is reserved"));
            }
            return this.returnNow(String.fromCodePoint(codePoint));
          } catch (err) {
            throw this.error(TomlError.wrap(err));
          }
        }
        parseSmallUnicode() {
          if (!isHexit(this.char)) {
            throw this.error(new TomlError("Invalid character in unicode sequence, expected hex"));
          } else {
            this.consume();
            if (this.state.buf.length >= 4) return this.return();
          }
        }
        parseLargeUnicode() {
          if (!isHexit(this.char)) {
            throw this.error(new TomlError("Invalid character in unicode sequence, expected hex"));
          } else {
            this.consume();
            if (this.state.buf.length >= 8) return this.return();
          }
        }
        /* NUMBERS */
        parseNumberSign() {
          this.consume();
          return this.next(this.parseMaybeSignedInfOrNan);
        }
        parseMaybeSignedInfOrNan() {
          if (this.char === CHAR_i) {
            return this.next(this.parseInf);
          } else if (this.char === CHAR_n) {
            return this.next(this.parseNan);
          } else {
            return this.callNow(this.parseNoUnder, this.parseNumberIntegerStart);
          }
        }
        parseNumberIntegerStart() {
          if (this.char === CHAR_0) {
            this.consume();
            return this.next(this.parseNumberIntegerExponentOrDecimal);
          } else {
            return this.goto(this.parseNumberInteger);
          }
        }
        parseNumberIntegerExponentOrDecimal() {
          if (this.char === CHAR_PERIOD) {
            this.consume();
            return this.call(this.parseNoUnder, this.parseNumberFloat);
          } else if (this.char === CHAR_E || this.char === CHAR_e) {
            this.consume();
            return this.next(this.parseNumberExponentSign);
          } else {
            return this.returnNow(Integer(this.state.buf));
          }
        }
        parseNumberInteger() {
          if (isDigit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnder);
          } else if (this.char === CHAR_E || this.char === CHAR_e) {
            this.consume();
            return this.next(this.parseNumberExponentSign);
          } else if (this.char === CHAR_PERIOD) {
            this.consume();
            return this.call(this.parseNoUnder, this.parseNumberFloat);
          } else {
            const result = Integer(this.state.buf);
            if (result.isNaN()) {
              throw this.error(new TomlError("Invalid number"));
            } else {
              return this.returnNow(result);
            }
          }
        }
        parseNoUnder() {
          if (this.char === CHAR_LOWBAR || this.char === CHAR_PERIOD || this.char === CHAR_E || this.char === CHAR_e) {
            throw this.error(new TomlError("Unexpected character, expected digit"));
          } else if (this.atEndOfWord()) {
            throw this.error(new TomlError("Incomplete number"));
          }
          return this.returnNow();
        }
        parseNoUnderHexOctBinLiteral() {
          if (this.char === CHAR_LOWBAR || this.char === CHAR_PERIOD) {
            throw this.error(new TomlError("Unexpected character, expected digit"));
          } else if (this.atEndOfWord()) {
            throw this.error(new TomlError("Incomplete number"));
          }
          return this.returnNow();
        }
        parseNumberFloat() {
          if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnder, this.parseNumberFloat);
          } else if (isDigit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_E || this.char === CHAR_e) {
            this.consume();
            return this.next(this.parseNumberExponentSign);
          } else {
            return this.returnNow(Float(this.state.buf));
          }
        }
        parseNumberExponentSign() {
          if (isDigit(this.char)) {
            return this.goto(this.parseNumberExponent);
          } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
            this.consume();
            this.call(this.parseNoUnder, this.parseNumberExponent);
          } else {
            throw this.error(new TomlError("Unexpected character, expected -, + or digit"));
          }
        }
        parseNumberExponent() {
          if (isDigit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnder);
          } else {
            return this.returnNow(Float(this.state.buf));
          }
        }
        /* NUMBERS or DATETIMES  */
        parseNumberOrDateTime() {
          if (this.char === CHAR_0) {
            this.consume();
            return this.next(this.parseNumberBaseOrDateTime);
          } else {
            return this.goto(this.parseNumberOrDateTimeOnly);
          }
        }
        parseNumberOrDateTimeOnly() {
          if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnder, this.parseNumberInteger);
          } else if (isDigit(this.char)) {
            this.consume();
            if (this.state.buf.length > 4) this.next(this.parseNumberInteger);
          } else if (this.char === CHAR_E || this.char === CHAR_e) {
            this.consume();
            return this.next(this.parseNumberExponentSign);
          } else if (this.char === CHAR_PERIOD) {
            this.consume();
            return this.call(this.parseNoUnder, this.parseNumberFloat);
          } else if (this.char === CHAR_HYPHEN) {
            return this.goto(this.parseDateTime);
          } else if (this.char === CHAR_COLON) {
            return this.goto(this.parseOnlyTimeHour);
          } else {
            return this.returnNow(Integer(this.state.buf));
          }
        }
        parseDateTimeOnly() {
          if (this.state.buf.length < 4) {
            if (isDigit(this.char)) {
              return this.consume();
            } else if (this.char === CHAR_COLON) {
              return this.goto(this.parseOnlyTimeHour);
            } else {
              throw this.error(new TomlError("Expected digit while parsing year part of a date"));
            }
          } else {
            if (this.char === CHAR_HYPHEN) {
              return this.goto(this.parseDateTime);
            } else {
              throw this.error(new TomlError("Expected hyphen (-) while parsing year part of date"));
            }
          }
        }
        parseNumberBaseOrDateTime() {
          if (this.char === CHAR_b) {
            this.consume();
            return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerBin);
          } else if (this.char === CHAR_o) {
            this.consume();
            return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerOct);
          } else if (this.char === CHAR_x) {
            this.consume();
            return this.call(this.parseNoUnderHexOctBinLiteral, this.parseIntegerHex);
          } else if (this.char === CHAR_PERIOD) {
            return this.goto(this.parseNumberInteger);
          } else if (isDigit(this.char)) {
            return this.goto(this.parseDateTimeOnly);
          } else {
            return this.returnNow(Integer(this.state.buf));
          }
        }
        parseIntegerHex() {
          if (isHexit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnderHexOctBinLiteral);
          } else {
            const result = Integer(this.state.buf);
            if (result.isNaN()) {
              throw this.error(new TomlError("Invalid number"));
            } else {
              return this.returnNow(result);
            }
          }
        }
        parseIntegerOct() {
          if (isOctit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnderHexOctBinLiteral);
          } else {
            const result = Integer(this.state.buf);
            if (result.isNaN()) {
              throw this.error(new TomlError("Invalid number"));
            } else {
              return this.returnNow(result);
            }
          }
        }
        parseIntegerBin() {
          if (isBit(this.char)) {
            this.consume();
          } else if (this.char === CHAR_LOWBAR) {
            return this.call(this.parseNoUnderHexOctBinLiteral);
          } else {
            const result = Integer(this.state.buf);
            if (result.isNaN()) {
              throw this.error(new TomlError("Invalid number"));
            } else {
              return this.returnNow(result);
            }
          }
        }
        /* DATETIME */
        parseDateTime() {
          if (this.state.buf.length < 4) {
            throw this.error(new TomlError("Years less than 1000 must be zero padded to four characters"));
          }
          this.state.result = this.state.buf;
          this.state.buf = "";
          return this.next(this.parseDateMonth);
        }
        parseDateMonth() {
          if (this.char === CHAR_HYPHEN) {
            if (this.state.buf.length < 2) {
              throw this.error(new TomlError("Months less than 10 must be zero padded to two characters"));
            }
            this.state.result += "-" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseDateDay);
          } else if (isDigit(this.char)) {
            this.consume();
          } else {
            throw this.error(new TomlError("Incomplete datetime"));
          }
        }
        parseDateDay() {
          if (this.char === CHAR_T || this.char === CHAR_SP) {
            if (this.state.buf.length < 2) {
              throw this.error(new TomlError("Days less than 10 must be zero padded to two characters"));
            }
            this.state.result += "-" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseStartTimeHour);
          } else if (this.atEndOfWord()) {
            return this.returnNow(createDate(this.state.result + "-" + this.state.buf));
          } else if (isDigit(this.char)) {
            this.consume();
          } else {
            throw this.error(new TomlError("Incomplete datetime"));
          }
        }
        parseStartTimeHour() {
          if (this.atEndOfWord()) {
            return this.returnNow(createDate(this.state.result));
          } else {
            return this.goto(this.parseTimeHour);
          }
        }
        parseTimeHour() {
          if (this.char === CHAR_COLON) {
            if (this.state.buf.length < 2) {
              throw this.error(new TomlError("Hours less than 10 must be zero padded to two characters"));
            }
            this.state.result += "T" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseTimeMin);
          } else if (isDigit(this.char)) {
            this.consume();
          } else {
            throw this.error(new TomlError("Incomplete datetime"));
          }
        }
        parseTimeMin() {
          if (this.state.buf.length < 2 && isDigit(this.char)) {
            this.consume();
          } else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
            this.state.result += ":" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseTimeSec);
          } else {
            throw this.error(new TomlError("Incomplete datetime"));
          }
        }
        parseTimeSec() {
          if (isDigit(this.char)) {
            this.consume();
            if (this.state.buf.length === 2) {
              this.state.result += ":" + this.state.buf;
              this.state.buf = "";
              return this.next(this.parseTimeZoneOrFraction);
            }
          } else {
            throw this.error(new TomlError("Incomplete datetime"));
          }
        }
        parseOnlyTimeHour() {
          if (this.char === CHAR_COLON) {
            if (this.state.buf.length < 2) {
              throw this.error(new TomlError("Hours less than 10 must be zero padded to two characters"));
            }
            this.state.result = this.state.buf;
            this.state.buf = "";
            return this.next(this.parseOnlyTimeMin);
          } else {
            throw this.error(new TomlError("Incomplete time"));
          }
        }
        parseOnlyTimeMin() {
          if (this.state.buf.length < 2 && isDigit(this.char)) {
            this.consume();
          } else if (this.state.buf.length === 2 && this.char === CHAR_COLON) {
            this.state.result += ":" + this.state.buf;
            this.state.buf = "";
            return this.next(this.parseOnlyTimeSec);
          } else {
            throw this.error(new TomlError("Incomplete time"));
          }
        }
        parseOnlyTimeSec() {
          if (isDigit(this.char)) {
            this.consume();
            if (this.state.buf.length === 2) {
              return this.next(this.parseOnlyTimeFractionMaybe);
            }
          } else {
            throw this.error(new TomlError("Incomplete time"));
          }
        }
        parseOnlyTimeFractionMaybe() {
          this.state.result += ":" + this.state.buf;
          if (this.char === CHAR_PERIOD) {
            this.state.buf = "";
            this.next(this.parseOnlyTimeFraction);
          } else {
            return this.return(createTime(this.state.result));
          }
        }
        parseOnlyTimeFraction() {
          if (isDigit(this.char)) {
            this.consume();
          } else if (this.atEndOfWord()) {
            if (this.state.buf.length === 0) throw this.error(new TomlError("Expected digit in milliseconds"));
            return this.returnNow(createTime(this.state.result + "." + this.state.buf));
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z"));
          }
        }
        parseTimeZoneOrFraction() {
          if (this.char === CHAR_PERIOD) {
            this.consume();
            this.next(this.parseDateTimeFraction);
          } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
            this.consume();
            this.next(this.parseTimeZoneHour);
          } else if (this.char === CHAR_Z) {
            this.consume();
            return this.return(createDateTime(this.state.result + this.state.buf));
          } else if (this.atEndOfWord()) {
            return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf));
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z"));
          }
        }
        parseDateTimeFraction() {
          if (isDigit(this.char)) {
            this.consume();
          } else if (this.state.buf.length === 1) {
            throw this.error(new TomlError("Expected digit in milliseconds"));
          } else if (this.char === CHAR_HYPHEN || this.char === CHAR_PLUS) {
            this.consume();
            this.next(this.parseTimeZoneHour);
          } else if (this.char === CHAR_Z) {
            this.consume();
            return this.return(createDateTime(this.state.result + this.state.buf));
          } else if (this.atEndOfWord()) {
            return this.returnNow(createDateTimeFloat(this.state.result + this.state.buf));
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected period (.), minus (-), plus (+) or Z"));
          }
        }
        parseTimeZoneHour() {
          if (isDigit(this.char)) {
            this.consume();
            if (/\d\d$/.test(this.state.buf)) return this.next(this.parseTimeZoneSep);
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected digit"));
          }
        }
        parseTimeZoneSep() {
          if (this.char === CHAR_COLON) {
            this.consume();
            this.next(this.parseTimeZoneMin);
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected colon"));
          }
        }
        parseTimeZoneMin() {
          if (isDigit(this.char)) {
            this.consume();
            if (/\d\d$/.test(this.state.buf)) return this.return(createDateTime(this.state.result + this.state.buf));
          } else {
            throw this.error(new TomlError("Unexpected character in datetime, expected digit"));
          }
        }
        /* BOOLEAN */
        parseBoolean() {
          if (this.char === CHAR_t) {
            this.consume();
            return this.next(this.parseTrue_r);
          } else if (this.char === CHAR_f) {
            this.consume();
            return this.next(this.parseFalse_a);
          }
        }
        parseTrue_r() {
          if (this.char === CHAR_r) {
            this.consume();
            return this.next(this.parseTrue_u);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseTrue_u() {
          if (this.char === CHAR_u) {
            this.consume();
            return this.next(this.parseTrue_e);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseTrue_e() {
          if (this.char === CHAR_e) {
            return this.return(true);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseFalse_a() {
          if (this.char === CHAR_a) {
            this.consume();
            return this.next(this.parseFalse_l);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseFalse_l() {
          if (this.char === CHAR_l) {
            this.consume();
            return this.next(this.parseFalse_s);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseFalse_s() {
          if (this.char === CHAR_s) {
            this.consume();
            return this.next(this.parseFalse_e);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        parseFalse_e() {
          if (this.char === CHAR_e) {
            return this.return(false);
          } else {
            throw this.error(new TomlError("Invalid boolean, expected true or false"));
          }
        }
        /* INLINE LISTS */
        parseInlineList() {
          if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M || this.char === CTRL_J) {
            return null;
          } else if (this.char === Parser.END) {
            throw this.error(new TomlError("Unterminated inline array"));
          } else if (this.char === CHAR_NUM) {
            return this.call(this.parseComment);
          } else if (this.char === CHAR_RSQB) {
            return this.return(this.state.resultArr || InlineList());
          } else {
            return this.callNow(this.parseValue, this.recordInlineListValue);
          }
        }
        recordInlineListValue(value) {
          if (this.state.resultArr) {
            const listType = this.state.resultArr[_contentType];
            const valueType = tomlType(value);
            if (listType !== valueType) {
              throw this.error(new TomlError(`Inline lists must be a single type, not a mix of ${listType} and ${valueType}`));
            }
          } else {
            this.state.resultArr = InlineList(tomlType(value));
          }
          if (isFloat(value) || isInteger(value)) {
            this.state.resultArr.push(value.valueOf());
          } else {
            this.state.resultArr.push(value);
          }
          return this.goto(this.parseInlineListNext);
        }
        parseInlineListNext() {
          if (this.char === CHAR_SP || this.char === CTRL_I || this.char === CTRL_M || this.char === CTRL_J) {
            return null;
          } else if (this.char === CHAR_NUM) {
            return this.call(this.parseComment);
          } else if (this.char === CHAR_COMMA) {
            return this.next(this.parseInlineList);
          } else if (this.char === CHAR_RSQB) {
            return this.goto(this.parseInlineList);
          } else {
            throw this.error(new TomlError("Invalid character, expected whitespace, comma (,) or close bracket (])"));
          }
        }
        /* INLINE TABLE */
        parseInlineTable() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else if (this.char === Parser.END || this.char === CHAR_NUM || this.char === CTRL_J || this.char === CTRL_M) {
            throw this.error(new TomlError("Unterminated inline array"));
          } else if (this.char === CHAR_RCUB) {
            return this.return(this.state.resultTable || InlineTable());
          } else {
            if (!this.state.resultTable) this.state.resultTable = InlineTable();
            return this.callNow(this.parseAssign, this.recordInlineTableValue);
          }
        }
        recordInlineTableValue(kv) {
          let target = this.state.resultTable;
          let finalKey = kv.key.pop();
          for (let kw of kv.key) {
            if (hasKey(target, kw) && (!isTable(target[kw]) || target[kw][_declared])) {
              throw this.error(new TomlError("Can't redefine existing key"));
            }
            target = target[kw] = target[kw] || Table();
          }
          if (hasKey(target, finalKey)) {
            throw this.error(new TomlError("Can't redefine existing key"));
          }
          if (isInteger(kv.value) || isFloat(kv.value)) {
            target[finalKey] = kv.value.valueOf();
          } else {
            target[finalKey] = kv.value;
          }
          return this.goto(this.parseInlineTableNext);
        }
        parseInlineTableNext() {
          if (this.char === CHAR_SP || this.char === CTRL_I) {
            return null;
          } else if (this.char === Parser.END || this.char === CHAR_NUM || this.char === CTRL_J || this.char === CTRL_M) {
            throw this.error(new TomlError("Unterminated inline array"));
          } else if (this.char === CHAR_COMMA) {
            return this.next(this.parseInlineTable);
          } else if (this.char === CHAR_RCUB) {
            return this.goto(this.parseInlineTable);
          } else {
            throw this.error(new TomlError("Invalid character, expected whitespace, comma (,) or close bracket (])"));
          }
        }
      }
      return TOMLParser;
    }
  }
});

// node_modules/@iarna/toml/parse-pretty-error.js
var require_parse_pretty_error = __commonJS({
  "node_modules/@iarna/toml/parse-pretty-error.js"(exports2, module2) {
    "use strict";
    module2.exports = prettyError;
    function prettyError(err, buf) {
      if (err.pos == null || err.line == null) return err;
      let msg = err.message;
      msg += ` at row ${err.line + 1}, col ${err.col + 1}, pos ${err.pos}:
`;
      if (buf && buf.split) {
        const lines = buf.split(/\n/);
        const lineNumWidth = String(Math.min(lines.length, err.line + 3)).length;
        let linePadding = " ";
        while (linePadding.length < lineNumWidth) linePadding += " ";
        for (let ii = Math.max(0, err.line - 1); ii < Math.min(lines.length, err.line + 2); ++ii) {
          let lineNum = String(ii + 1);
          if (lineNum.length < lineNumWidth) lineNum = " " + lineNum;
          if (err.line === ii) {
            msg += lineNum + "> " + lines[ii] + "\n";
            msg += linePadding + "  ";
            for (let hh = 0; hh < err.col; ++hh) {
              msg += " ";
            }
            msg += "^\n";
          } else {
            msg += lineNum + ": " + lines[ii] + "\n";
          }
        }
      }
      err.message = msg + "\n";
      return err;
    }
  }
});

// node_modules/@iarna/toml/parse-string.js
var require_parse_string = __commonJS({
  "node_modules/@iarna/toml/parse-string.js"(exports2, module2) {
    "use strict";
    module2.exports = parseString;
    var TOMLParser = require_toml_parser();
    var prettyError = require_parse_pretty_error();
    function parseString(str) {
      if (global.Buffer && global.Buffer.isBuffer(str)) {
        str = str.toString("utf8");
      }
      const parser = new TOMLParser();
      try {
        parser.parse(str);
        return parser.finish();
      } catch (err) {
        throw prettyError(err, str);
      }
    }
  }
});

// node_modules/@iarna/toml/parse-async.js
var require_parse_async = __commonJS({
  "node_modules/@iarna/toml/parse-async.js"(exports2, module2) {
    "use strict";
    module2.exports = parseAsync;
    var TOMLParser = require_toml_parser();
    var prettyError = require_parse_pretty_error();
    function parseAsync(str, opts) {
      if (!opts) opts = {};
      const index = 0;
      const blocksize = opts.blocksize || 40960;
      const parser = new TOMLParser();
      return new Promise((resolve, reject) => {
        setImmediate(parseAsyncNext, index, blocksize, resolve, reject);
      });
      function parseAsyncNext(index2, blocksize2, resolve, reject) {
        if (index2 >= str.length) {
          try {
            return resolve(parser.finish());
          } catch (err) {
            return reject(prettyError(err, str));
          }
        }
        try {
          parser.parse(str.slice(index2, index2 + blocksize2));
          setImmediate(parseAsyncNext, index2 + blocksize2, blocksize2, resolve, reject);
        } catch (err) {
          reject(prettyError(err, str));
        }
      }
    }
  }
});

// node_modules/@iarna/toml/parse-stream.js
var require_parse_stream = __commonJS({
  "node_modules/@iarna/toml/parse-stream.js"(exports2, module2) {
    "use strict";
    module2.exports = parseStream;
    var stream = __require("stream");
    var TOMLParser = require_toml_parser();
    function parseStream(stm) {
      if (stm) {
        return parseReadable(stm);
      } else {
        return parseTransform(stm);
      }
    }
    function parseReadable(stm) {
      const parser = new TOMLParser();
      stm.setEncoding("utf8");
      return new Promise((resolve, reject) => {
        let readable;
        let ended = false;
        let errored = false;
        function finish() {
          ended = true;
          if (readable) return;
          try {
            resolve(parser.finish());
          } catch (err) {
            reject(err);
          }
        }
        function error(err) {
          errored = true;
          reject(err);
        }
        stm.once("end", finish);
        stm.once("error", error);
        readNext();
        function readNext() {
          readable = true;
          let data;
          while ((data = stm.read()) !== null) {
            try {
              parser.parse(data);
            } catch (err) {
              return error(err);
            }
          }
          readable = false;
          if (ended) return finish();
          if (errored) return;
          stm.once("readable", readNext);
        }
      });
    }
    function parseTransform() {
      const parser = new TOMLParser();
      return new stream.Transform({
        objectMode: true,
        transform(chunk, encoding, cb) {
          try {
            parser.parse(chunk.toString(encoding));
          } catch (err) {
            this.emit("error", err);
          }
          cb();
        },
        flush(cb) {
          try {
            this.push(parser.finish());
          } catch (err) {
            this.emit("error", err);
          }
          cb();
        }
      });
    }
  }
});

// node_modules/@iarna/toml/parse.js
var require_parse = __commonJS({
  "node_modules/@iarna/toml/parse.js"(exports2, module2) {
    "use strict";
    module2.exports = require_parse_string();
    module2.exports.async = require_parse_async();
    module2.exports.stream = require_parse_stream();
    module2.exports.prettyError = require_parse_pretty_error();
  }
});

// node_modules/@iarna/toml/stringify.js
var require_stringify = __commonJS({
  "node_modules/@iarna/toml/stringify.js"(exports2, module2) {
    "use strict";
    module2.exports = stringify;
    module2.exports.value = stringifyInline;
    function stringify(obj) {
      if (obj === null) throw typeError("null");
      if (obj === void 0) throw typeError("undefined");
      if (typeof obj !== "object") throw typeError(typeof obj);
      if (typeof obj.toJSON === "function") obj = obj.toJSON();
      if (obj == null) return null;
      const type = tomlType2(obj);
      if (type !== "table") throw typeError(type);
      return stringifyObject("", "", obj);
    }
    function typeError(type) {
      return new Error("Can only stringify objects, not " + type);
    }
    function arrayOneTypeError() {
      return new Error("Array values can't have mixed types");
    }
    function getInlineKeys(obj) {
      return Object.keys(obj).filter((key) => isInline(obj[key]));
    }
    function getComplexKeys(obj) {
      return Object.keys(obj).filter((key) => !isInline(obj[key]));
    }
    function toJSON(obj) {
      let nobj = Array.isArray(obj) ? [] : Object.prototype.hasOwnProperty.call(obj, "__proto__") ? { ["__proto__"]: void 0 } : {};
      for (let prop of Object.keys(obj)) {
        if (obj[prop] && typeof obj[prop].toJSON === "function" && !("toISOString" in obj[prop])) {
          nobj[prop] = obj[prop].toJSON();
        } else {
          nobj[prop] = obj[prop];
        }
      }
      return nobj;
    }
    function stringifyObject(prefix, indent, obj) {
      obj = toJSON(obj);
      var inlineKeys;
      var complexKeys;
      inlineKeys = getInlineKeys(obj);
      complexKeys = getComplexKeys(obj);
      var result = [];
      var inlineIndent = indent || "";
      inlineKeys.forEach((key) => {
        var type = tomlType2(obj[key]);
        if (type !== "undefined" && type !== "null") {
          result.push(inlineIndent + stringifyKey(key) + " = " + stringifyAnyInline(obj[key], true));
        }
      });
      if (result.length > 0) result.push("");
      var complexIndent = prefix && inlineKeys.length > 0 ? indent + "  " : "";
      complexKeys.forEach((key) => {
        result.push(stringifyComplex(prefix, complexIndent, key, obj[key]));
      });
      return result.join("\n");
    }
    function isInline(value) {
      switch (tomlType2(value)) {
        case "undefined":
        case "null":
        case "integer":
        case "nan":
        case "float":
        case "boolean":
        case "string":
        case "datetime":
          return true;
        case "array":
          return value.length === 0 || tomlType2(value[0]) !== "table";
        case "table":
          return Object.keys(value).length === 0;
        /* istanbul ignore next */
        default:
          return false;
      }
    }
    function tomlType2(value) {
      if (value === void 0) {
        return "undefined";
      } else if (value === null) {
        return "null";
      } else if (typeof value === "bigint" || Number.isInteger(value) && !Object.is(value, -0)) {
        return "integer";
      } else if (typeof value === "number") {
        return "float";
      } else if (typeof value === "boolean") {
        return "boolean";
      } else if (typeof value === "string") {
        return "string";
      } else if ("toISOString" in value) {
        return isNaN(value) ? "undefined" : "datetime";
      } else if (Array.isArray(value)) {
        return "array";
      } else {
        return "table";
      }
    }
    function stringifyKey(key) {
      var keyStr = String(key);
      if (/^[-A-Za-z0-9_]+$/.test(keyStr)) {
        return keyStr;
      } else {
        return stringifyBasicString(keyStr);
      }
    }
    function stringifyBasicString(str) {
      return '"' + escapeString(str).replace(/"/g, '\\"') + '"';
    }
    function stringifyLiteralString(str) {
      return "'" + str + "'";
    }
    function numpad(num, str) {
      while (str.length < num) str = "0" + str;
      return str;
    }
    function escapeString(str) {
      return str.replace(/\\/g, "\\\\").replace(/[\b]/g, "\\b").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\f/g, "\\f").replace(/\r/g, "\\r").replace(/([\u0000-\u001f\u007f])/, (c) => "\\u" + numpad(4, c.codePointAt(0).toString(16)));
    }
    function stringifyMultilineString(str) {
      let escaped = str.split(/\n/).map((str2) => {
        return escapeString(str2).replace(/"(?="")/g, '\\"');
      }).join("\n");
      if (escaped.slice(-1) === '"') escaped += "\\\n";
      return '"""\n' + escaped + '"""';
    }
    function stringifyAnyInline(value, multilineOk) {
      let type = tomlType2(value);
      if (type === "string") {
        if (multilineOk && /\n/.test(value)) {
          type = "string-multiline";
        } else if (!/[\b\t\n\f\r']/.test(value) && /"/.test(value)) {
          type = "string-literal";
        }
      }
      return stringifyInline(value, type);
    }
    function stringifyInline(value, type) {
      if (!type) type = tomlType2(value);
      switch (type) {
        case "string-multiline":
          return stringifyMultilineString(value);
        case "string":
          return stringifyBasicString(value);
        case "string-literal":
          return stringifyLiteralString(value);
        case "integer":
          return stringifyInteger(value);
        case "float":
          return stringifyFloat(value);
        case "boolean":
          return stringifyBoolean(value);
        case "datetime":
          return stringifyDatetime(value);
        case "array":
          return stringifyInlineArray(value.filter((_) => tomlType2(_) !== "null" && tomlType2(_) !== "undefined" && tomlType2(_) !== "nan"));
        case "table":
          return stringifyInlineTable(value);
        /* istanbul ignore next */
        default:
          throw typeError(type);
      }
    }
    function stringifyInteger(value) {
      return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, "_");
    }
    function stringifyFloat(value) {
      if (value === Infinity) {
        return "inf";
      } else if (value === -Infinity) {
        return "-inf";
      } else if (Object.is(value, NaN)) {
        return "nan";
      } else if (Object.is(value, -0)) {
        return "-0.0";
      }
      var chunks = String(value).split(".");
      var int = chunks[0];
      var dec = chunks[1] || 0;
      return stringifyInteger(int) + "." + dec;
    }
    function stringifyBoolean(value) {
      return String(value);
    }
    function stringifyDatetime(value) {
      return value.toISOString();
    }
    function isNumber(type) {
      return type === "float" || type === "integer";
    }
    function arrayType(values) {
      var contentType = tomlType2(values[0]);
      if (values.every((_) => tomlType2(_) === contentType)) return contentType;
      if (values.every((_) => isNumber(tomlType2(_)))) return "float";
      return "mixed";
    }
    function validateArray(values) {
      const type = arrayType(values);
      if (type === "mixed") {
        throw arrayOneTypeError();
      }
      return type;
    }
    function stringifyInlineArray(values) {
      values = toJSON(values);
      const type = validateArray(values);
      var result = "[";
      var stringified = values.map((_) => stringifyInline(_, type));
      if (stringified.join(", ").length > 60 || /\n/.test(stringified)) {
        result += "\n  " + stringified.join(",\n  ") + "\n";
      } else {
        result += " " + stringified.join(", ") + (stringified.length > 0 ? " " : "");
      }
      return result + "]";
    }
    function stringifyInlineTable(value) {
      value = toJSON(value);
      var result = [];
      Object.keys(value).forEach((key) => {
        result.push(stringifyKey(key) + " = " + stringifyAnyInline(value[key], false));
      });
      return "{ " + result.join(", ") + (result.length > 0 ? " " : "") + "}";
    }
    function stringifyComplex(prefix, indent, key, value) {
      var valueType = tomlType2(value);
      if (valueType === "array") {
        return stringifyArrayOfTables(prefix, indent, key, value);
      } else if (valueType === "table") {
        return stringifyComplexTable(prefix, indent, key, value);
      } else {
        throw typeError(valueType);
      }
    }
    function stringifyArrayOfTables(prefix, indent, key, values) {
      values = toJSON(values);
      validateArray(values);
      var firstValueType = tomlType2(values[0]);
      if (firstValueType !== "table") throw typeError(firstValueType);
      var fullKey = prefix + stringifyKey(key);
      var result = "";
      values.forEach((table) => {
        if (result.length > 0) result += "\n";
        result += indent + "[[" + fullKey + "]]\n";
        result += stringifyObject(fullKey + ".", indent, table);
      });
      return result;
    }
    function stringifyComplexTable(prefix, indent, key, value) {
      var fullKey = prefix + stringifyKey(key);
      var result = "";
      if (getInlineKeys(value).length > 0) {
        result += indent + "[" + fullKey + "]\n";
      }
      return result + stringifyObject(fullKey + ".", indent, value);
    }
  }
});

// node_modules/@iarna/toml/toml.js
var require_toml = __commonJS({
  "node_modules/@iarna/toml/toml.js"(exports2) {
    "use strict";
    exports2.parse = require_parse();
    exports2.stringify = require_stringify();
  }
});

// src/version.js
var TOOL_VERSION = "0.3.0";

// src/analyzer.js
var import_toml = __toESM(require_toml(), 1);
import fs3 from "node:fs";
import path3 from "node:path";

// src/files.js
import fs from "node:fs";
import path from "node:path";
var SKIP = /* @__PURE__ */ new Set([".git", "node_modules", "dist", "build", "coverage", ".next", "vendor"]);
function safeFile(root, file) {
  const relative = path.relative(root, file);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("Input file must be inside the scan root");
  let current = root;
  for (const part of relative.split(path.sep)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error("Symbolic link inputs are not supported");
  }
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.size > 1024 * 1024) throw new Error("Input must be a regular file up to 1 MiB");
  return fs.readFileSync(file, "utf8");
}
function readFiles(root) {
  if (!fs.lstatSync(root).isDirectory()) throw new Error("Scan root must be a regular directory");
  const files = [], skipped = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(dir, entry.name), file = path.relative(root, absolute).replaceAll(path.sep, "/");
      if (entry.isSymbolicLink()) {
        skipped.push({ file, reason: "Symbolic link" });
        continue;
      }
      if (entry.isDirectory()) {
        if (!SKIP.has(entry.name) && !entry.name.startsWith(".")) visit(absolute);
        continue;
      }
      if (!entry.isFile() || !/\.(?:[cm]?[jt]sx?|html?|json|toml|ya?ml|md|txt|graphql)$/i.test(entry.name) && !/^\.env(?:\.|$)/i.test(entry.name)) continue;
      if (files.length >= 2e3 || fs.lstatSync(absolute).size > 1024 * 1024) {
        skipped.push({ file, reason: "Analysis limit" });
        continue;
      }
      files.push({ file, abs: absolute, text: safeFile(root, absolute) });
    }
  }
  visit(root);
  return { files, skipped };
}

// src/webhook-review.js
var CODE = /\.(?:[cm]?[jt]sx?|graphql|gql)$/i;
var SOURCE = /\.(?:[cm]?[jt]sx?)$/i;
var METHODS = /* @__PURE__ */ new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
function maskComments(text) {
  let out = "", quote = "", escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (quote) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      out += "  ";
      i++;
      while (i + 1 < text.length && text[i + 1] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      out += "  ";
      i++;
      while (i + 1 < text.length && !(text[i] === "*" && text[i + 1] === "/")) {
        out += text[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i + 1 < text.length) {
        out += "  ";
        i++;
      }
      continue;
    }
    out += ch;
  }
  return out;
}
function maskStrings(text) {
  let out = "", quote = "", escaped = false;
  for (const ch of text) {
    if (quote) {
      out += ch === "\n" ? "\n" : " ";
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === quote) quote = "";
    } else if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += " ";
    } else out += ch;
  }
  return out;
}
function cleanPath(value) {
  const normalized = `/${String(value).split("/").filter(Boolean).join("/")}`;
  return normalized === "/" ? "/" : normalized;
}
function classifyDestination(uri, applicationUrl) {
  if (typeof uri !== "string" || !uri.trim()) return { transport: "unknown", pathname: null };
  const value = uri.trim();
  if (/^arn:aws(?:-us-gov|-cn)?:events:[^:]+:\d{12}:event-bus\//i.test(value)) return { transport: "eventbridge", pathname: null };
  if (/^(?:pubsub|googlepubsub|gcp-pubsub):\/\//i.test(value)) return { transport: "pubsub", pathname: null };
  try {
    const url = new URL(value, applicationUrl);
    if (url.protocol === "https:" && !url.username && !url.password) return { transport: "https", pathname: cleanPath(url.pathname) };
    if (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return { transport: "development", pathname: cleanPath(url.pathname) };
  } catch {
  }
  return { transport: "unknown", pathname: null };
}
function lineAt(source2, index) {
  return source2.slice(0, index).split("\n").length;
}
function matchingDelimiter(source2, start, open, close) {
  if (source2[start] !== open) return -1;
  let depth = 0;
  for (let i = start; i < source2.length; i++) {
    if (source2[i] === open) depth++;
    else if (source2[i] === close && --depth === 0) return i;
  }
  return -1;
}
function skipSpace(source2, index) {
  while (index < source2.length && /\s/.test(source2[index])) index++;
  return index;
}
function functionBody(source2, syntax, start, nameEnd) {
  const paramsOpen = syntax.indexOf("(", nameEnd);
  if (paramsOpen < 0) return null;
  const paramsClose = matchingDelimiter(syntax, paramsOpen, "(", ")");
  if (paramsClose < 0) return null;
  let bodyOpen = skipSpace(syntax, paramsClose + 1);
  if (syntax[bodyOpen] === ":") {
    const semicolon = syntax.indexOf(";", bodyOpen);
    bodyOpen = syntax.indexOf("{", bodyOpen);
    if (bodyOpen < 0 || semicolon >= 0 && semicolon < bodyOpen) return null;
  }
  if (syntax[bodyOpen] !== "{") return null;
  const bodyClose = matchingDelimiter(syntax, bodyOpen, "{", "}");
  if (bodyClose < 0) return null;
  return { text: source2.slice(start, bodyClose + 1), start };
}
function exportedFunction(source2, syntax, method) {
  const results = [];
  const pattern = new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b`, "g");
  for (const match of syntax.matchAll(pattern)) {
    const result = functionBody(source2, syntax, match.index, match.index + match[0].length);
    if (result) results.push(result);
  }
  return results;
}
function exportedArrow(source2, syntax, method) {
  const results = [];
  const pattern = new RegExp(`\\bexport\\s+(?:const|let|var)\\s+${method}\\s*=`, "g");
  for (const match of syntax.matchAll(pattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+function\b/.test(syntax.slice(cursor))) {
      const functionAt = syntax.indexOf("function", cursor), nameEnd = functionAt + "function".length;
      const result = functionBody(source2, syntax, match.index, nameEnd);
      if (result) results.push(result);
      continue;
    }
    if (syntax.startsWith("function", cursor)) {
      const result = functionBody(source2, syntax, match.index, cursor + "function".length);
      if (result) results.push(result);
      continue;
    }
    if (/^async\s+\(/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + "async".length);
    let paramsClose;
    if (syntax[cursor] === "(") paramsClose = matchingDelimiter(syntax, cursor, "(", ")");
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === void 0 || paramsClose < 0) continue;
    const arrow = syntax.indexOf("=>", paramsClose + 1);
    if (arrow < 0) continue;
    const bodyOpen = skipSpace(syntax, arrow + 2);
    if (syntax[bodyOpen] !== "{") continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, "{", "}");
    if (bodyClose >= 0) results.push({ text: source2.slice(match.index, bodyClose + 1), start: match.index });
  }
  return results;
}
function exportedMethod(source2, syntax, method) {
  return [...exportedFunction(source2, syntax, method), ...exportedArrow(source2, syntax, method)];
}
function nextSegments(value) {
  const parts = [];
  const segments = value.split("/").filter(Boolean);
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    if (/^\([^/]+\)$/.test(segment)) continue;
    if (segment.startsWith("@") || /^\((?:\.{1,3})\)/.test(segment)) return null;
    const optionalCatchAll = segment.match(/^\[\[\.\.\.([A-Za-z0-9_-]+)\]\]$/);
    const catchAll = segment.match(/^\[\.\.\.([A-Za-z0-9_-]+)\]$/);
    const dynamic = segment.match(/^\[([A-Za-z0-9_-]+)\]$/);
    if ((optionalCatchAll || catchAll) && index !== segments.length - 1) return null;
    if (optionalCatchAll) parts.push("**");
    else if (catchAll) parts.push("*");
    else if (dynamic) parts.push(`:${dynamic[1]}`);
    else if (segment.includes("[") || segment.includes("]")) return null;
    else parts.push(segment);
  }
  return cleanPath(parts.join("/"));
}
function appRoute(file) {
  if (!SOURCE.test(file)) return null;
  const normalized = file.replaceAll("\\", "/"), parts = normalized.split("/");
  if (!/^route\.(?:js|jsx|ts|tsx)$/i.test(parts.at(-1) ?? "")) return null;
  let appIndex = -1;
  for (let i = 0; i < parts.length - 1; i++) if (parts[i] === "app") appIndex = i;
  if (appIndex < 0) return null;
  const route = nextSegments(parts.slice(appIndex + 1, -1).join("/"));
  return route === null ? null : { route, rootIndex: appIndex };
}
function pagesApiRoute(file) {
  if (!SOURCE.test(file)) return null;
  const parts = file.replaceAll("\\", "/").split("/");
  if (!/\.(?:js|jsx|ts|tsx)$/i.test(parts.at(-1) ?? "")) return null;
  let apiIndex = -1;
  for (let i = 0; i < parts.length - 1; i++) if (parts[i] === "pages" && parts[i + 1] === "api") apiIndex = i + 1;
  if (apiIndex < 0) return null;
  const filename = parts.at(-1).replace(/\.(?:js|jsx|ts|tsx)$/i, "");
  const directories = parts.slice(apiIndex + 1, -1);
  const segments = ["api", ...directories, ...filename === "index" ? [] : [filename]];
  const route = nextSegments(segments.join("/"));
  return route === null ? null : { route, rootIndex: apiIndex - 1 };
}
function nextCandidate(file, source2, syntax, framework, route, details = {}) {
  return {
    file,
    route,
    source: source2,
    moduleSource: source2,
    framework,
    line: details.handler?.start !== void 0 ? lineAt(source2, details.handler.start) : 1,
    handlerSource: details.handler?.text ?? "",
    methods: details.methods ?? [],
    handlerKnown: Boolean(details.handler),
    methodSupported: Boolean(details.methodSupported),
    bodyParserDisabled: details.bodyParserDisabled === true,
    bodyParserDefault: details.bodyParserDisabled !== true,
    ambiguousHandler: details.ambiguousHandler === true
  };
}
function appRouteCandidate(file, source2, syntax, route) {
  const methods = [...METHODS].filter((method) => new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b|\\bexport\\s+(?:const|let|var)\\s+${method}\\s*=`, "g").test(syntax));
  const handlers = exportedMethod(source2, syntax, "POST");
  return nextCandidate(file.file, source2, syntax, "next-app-router", route, {
    methods,
    handler: handlers.length === 1 ? handlers[0] : null,
    methodSupported: handlers.length === 1,
    ambiguousHandler: handlers.length > 1
  });
}
function pagesDefaultHandler(source2, syntax) {
  const results = [];
  const functionPattern = /\bexport\s+default\s+(?:async\s+)?function\b/g;
  for (const match of syntax.matchAll(functionPattern)) {
    const result = functionBody(source2, syntax, match.index, match.index + match[0].length);
    if (result) results.push(result);
  }
  const arrowPattern = /\bexport\s+default\s+(?:async\s+)?(?=\(|[A-Za-z_$])/g;
  for (const match of syntax.matchAll(arrowPattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + "async".length);
    if (/^function\b/.test(syntax.slice(cursor))) continue;
    let paramsClose;
    if (syntax[cursor] === "(") paramsClose = matchingDelimiter(syntax, cursor, "(", ")");
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === void 0 || paramsClose < 0) continue;
    const arrow = syntax.indexOf("=>", paramsClose + 1);
    if (arrow < 0) continue;
    const semicolon = syntax.indexOf(";", paramsClose + 1);
    if (semicolon >= 0 && semicolon < arrow) continue;
    const bodyOpen = skipSpace(syntax, arrow + 2);
    if (syntax[bodyOpen] !== "{") continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, "{", "}");
    if (bodyClose >= 0) results.push({ text: source2.slice(match.index, bodyClose + 1), start: match.index });
  }
  return results;
}
function pagesBodyParserDisabled(source2, syntax) {
  const pattern = /\bexport\s+(?:const|let|var)\s+config\s*=/g;
  for (const match of syntax.matchAll(pattern)) {
    const objectOpen = syntax.indexOf("{", match.index + match[0].length);
    if (objectOpen < 0) continue;
    const objectClose = matchingDelimiter(syntax, objectOpen, "{", "}");
    if (objectClose < 0) continue;
    const config = syntax.slice(objectOpen, objectClose + 1), api = /\bapi\s*:\s*\{/.exec(config);
    if (!api) continue;
    const apiOpen = config.indexOf("{", api.index), apiClose = matchingDelimiter(config, apiOpen, "{", "}");
    if (apiClose >= 0 && /\bbodyParser\s*:\s*false\b/.test(config.slice(apiOpen, apiClose + 1))) return true;
  }
  return false;
}
function pagesHandlerSupportsPost(handler) {
  const source2 = maskComments(handler), syntax = maskStrings(source2);
  const methodChecks = [...syntax.matchAll(/\b(?:req|request)\s*\.\s*method\s*(?:={2,3}|!={1,2})\s*/g)];
  const explicitMethodCheck = methodChecks.length > 0 || [...syntax.matchAll(/\bswitch\s*\(\s*(?:req|request)\s*\.\s*method\s*\)/g)].length > 0;
  if (!explicitMethodCheck) return true;
  for (const match of methodChecks) {
    const literal = source2.slice(match.index + match[0].length).match(/^(['"])([A-Z]+)\1/i);
    if (literal?.[2]?.toUpperCase() === "POST") return true;
  }
  for (const match of syntax.matchAll(/\bswitch\s*\(\s*(?:req|request)\s*\.\s*method\s*\)\s*\{/g)) {
    const open = syntax.indexOf("{", match.index), close = matchingDelimiter(syntax, open, "{", "}");
    if (close < 0) continue;
    const body = syntax.slice(open + 1, close);
    for (const label of body.matchAll(/\bcase\s+/g)) {
      const offset = open + 1 + label.index + label[0].length;
      const literal = source2.slice(offset).match(/^(['"])([A-Z]+)\1\s*:/i);
      if (literal?.[2]?.toUpperCase() === "POST") return true;
    }
  }
  return false;
}
function pagesCandidate(file, source2, syntax, route) {
  const handlers = pagesDefaultHandler(source2, syntax), bodyParserDisabled = pagesBodyParserDisabled(source2, syntax);
  const handler = handlers.length === 1 ? handlers[0] : null;
  return nextCandidate(file.file, source2, syntax, "next-pages-router", route, {
    methods: ["POST"],
    handler,
    methodSupported: Boolean(handler) && pagesHandlerSupportsPost(handler.text),
    ambiguousHandler: handlers.length > 1,
    bodyParserDisabled
  });
}
function frameworkRoute(file, source2) {
  if (!/\bexport\s+(?:const|async\s+function)\s+action\b/.test(maskStrings(source2))) return null;
  const normalized = file.replaceAll("\\", "/");
  const match = normalized.match(/(?:^|\/)app\/routes\/(.+)\.(?:[cm]?[jt]sx?)$/i);
  if (!match) return null;
  let route = match[1].replaceAll(".", "/").replace(/\([^/]+\)\//g, "").replace(/^_+|_+$/g, "");
  route = route.split("/").filter(Boolean).map((part) => part.startsWith("$") ? ":" + part.slice(1) : part).join("/");
  return cleanPath(route);
}
function routeCandidates(files) {
  const candidates = [];
  for (const file of files) {
    if (!CODE.test(file.file)) continue;
    const source2 = maskComments(file.text), syntax = maskStrings(source2);
    const app = appRoute(file.file);
    if (app) candidates.push(appRouteCandidate(file, source2, syntax, app.route));
    const pages = pagesApiRoute(file.file);
    if (pages) candidates.push(pagesCandidate(file, source2, syntax, pages.route));
    const express = /\b(?:app|router|server|fastify|webhookRouter)\s*\.\s*(?:post|route)\s*\(/g;
    for (const match of syntax.matchAll(express)) {
      const open = syntax.indexOf("(", match.index), literal = source2.slice(open + 1).match(/^\s*(['"`])([^'"`]+)\1/);
      if (!literal || /[${}]/.test(literal[2])) continue;
      const routeMatch = { index: match.index };
      const close = matchingDelimiter(syntax, open, "(", ")");
      if (close < 0) continue;
      candidates.push({
        file: file.file,
        route: cleanPath(literal[2]),
        source: source2,
        moduleSource: source2,
        handlerSource: expressHandlerSource(source2, syntax, routeMatch, open, close),
        line: lineAt(source2, match.index),
        framework: "express",
        registrationOffset: match.index,
        methods: ["POST"],
        methodSupported: true,
        handlerKnown: true,
        bodyParserDefault: false,
        bodyParserDisabled: false
      });
    }
    const routeFile = frameworkRoute(file.file, source2);
    if (routeFile) candidates.push({
      file: file.file,
      route: routeFile,
      source: source2,
      moduleSource: source2,
      handlerSource: source2,
      line: 1,
      framework: "remix",
      methods: ["POST"],
      methodSupported: true,
      handlerKnown: true,
      bodyParserDefault: false,
      bodyParserDisabled: false
    });
  }
  return candidates;
}
function matchesRoute(pattern, actual) {
  if (!pattern || !actual) return false;
  const parts = pattern.split("/").filter(Boolean);
  let source2 = "^";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "**") {
      source2 += "(?:/.*)?";
      continue;
    }
    if (part === "*") {
      source2 += "/.+(?:/.*)?";
      continue;
    }
    source2 += "/";
    if (part.startsWith(":")) source2 += "[^/]+";
    else source2 += part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  source2 += "/?$";
  return new RegExp(source2).test(cleanPath(actual));
}
function pageRawBodyConfig(route) {
  if (route.framework !== "next-pages-router") return true;
  const handler = route.handlerSource ?? "";
  const readsRawStream = /for\s+await\s*\([^)]*\s+of\s+req\b/.test(handler) || /\breq\s*\.\s*on\s*\(\s*['"]data['"]/.test(handler);
  return route.bodyParserDisabled && readsRawStream;
}
function pagesRawBodyInput(handler) {
  const source2 = maskComments(handler), syntax = maskStrings(source2), chunkArrays = /* @__PURE__ */ new Set();
  for (const declaration of syntax.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[\s*\]/g)) chunkArrays.add(declaration[1]);
  const streamChunks = /* @__PURE__ */ new Set();
  for (const loop of syntax.matchAll(/\bfor\s+await\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+of\s+req\s*\)/g)) {
    const chunk = loop[1], open = syntax.indexOf("(", loop.index), close = matchingDelimiter(syntax, open, "(", ")");
    if (close < 0) continue;
    const bodyStart = skipSpace(syntax, close + 1);
    let bodyEnd;
    if (syntax[bodyStart] === "{") {
      const blockEnd = matchingDelimiter(syntax, bodyStart, "{", "}");
      if (blockEnd < 0) continue;
      bodyEnd = blockEnd;
    } else {
      const semicolon = syntax.indexOf(";", bodyStart), newline = syntax.indexOf("\n", bodyStart);
      bodyEnd = [semicolon, newline].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? syntax.length;
    }
    const body = syntax.slice(bodyStart, bodyEnd);
    for (const array of chunkArrays) if (new RegExp(`\\b${array}\\s*\\.\\s*push\\s*\\(\\s*(?:Buffer\\s*\\.\\s*from\\s*\\(\\s*)?${chunk}\\s*\\)?\\s*\\)`).test(body)) streamChunks.add(array);
  }
  for (const event of source2.matchAll(/\breq\s*\.\s*on\s*\(\s*(['"])data\1\s*,\s*/g)) {
    const callOpen = syntax.indexOf("(", event.index), callClose = matchingDelimiter(syntax, callOpen, "(", ")");
    if (callClose < 0) continue;
    const callbackStart = event.index + event[0].length;
    const callbackText = syntax.slice(callbackStart, callClose);
    const callback = callbackText.match(/^(?:async\s+)?(?:\(\s*([A-Za-z_$][\w$]*)\s*\)|([A-Za-z_$][\w$]*))\s*=>/);
    if (!callback) continue;
    const chunk = callback[1] ?? callback[2];
    const arrow = callbackText.indexOf("=>"), bodyStart = skipSpace(callbackText, arrow + 2);
    let bodyEnd = callbackText.length;
    if (callbackText[bodyStart] === "{") {
      const blockEnd = matchingDelimiter(callbackText, bodyStart, "{", "}");
      if (blockEnd < 0) continue;
      bodyEnd = blockEnd;
    }
    const body = callbackText.slice(bodyStart, bodyEnd);
    for (const array of chunkArrays) if (new RegExp(`\\b${array}\\s*\\.\\s*push\\s*\\(\\s*(?:Buffer\\s*\\.\\s*from\\s*\\(\\s*)?${chunk}\\s*\\)?\\s*\\)`).test(body)) streamChunks.add(array);
  }
  if (!streamChunks.size) return false;
  const rawBodies = /* @__PURE__ */ new Set();
  for (const match of syntax.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*Buffer\s*\.\s*concat\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    if (streamChunks.has(match[2])) rawBodies.add(match[1]);
  }
  for (const match of syntax.matchAll(/\.\s*update\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) if (rawBodies.has(match[1])) return true;
  for (const match of syntax.matchAll(/\.\s*update\s*\(\s*Buffer\s*\.\s*concat\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\)/g)) if (streamChunks.has(match[1])) return true;
  return false;
}
function posixNormalize(value) {
  const parts = [];
  for (const part of value.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else parts.push(part);
  }
  return parts.join("/");
}
function importSpecifiers(source2) {
  const cleaned = maskComments(source2), syntax = maskStrings(cleaned), results = [];
  for (const match of syntax.matchAll(/\bimport\b/g)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (syntax[cursor] === "(") continue;
    let specifierStart = cursor;
    if (cleaned[cursor] !== '"' && cleaned[cursor] !== "'") {
      const from = syntax.indexOf("from", cursor);
      if (from < 0 || from - cursor > 500 || /[=;]/.test(syntax.slice(cursor, from))) continue;
      specifierStart = skipSpace(cleaned, from + "from".length);
    }
    const quote = cleaned[specifierStart];
    if (quote !== '"' && quote !== "'") continue;
    let end = specifierStart + 1, escaped = false;
    for (; end < cleaned.length; end++) {
      if (escaped) escaped = false;
      else if (cleaned[end] === "\\") escaped = true;
      else if (cleaned[end] === quote) break;
    }
    if (end < cleaned.length) results.push(cleaned.slice(specifierStart + 1, end));
  }
  return results;
}
function localImports(route, files) {
  const source2 = route.moduleSource ?? route.source ?? "", results = [];
  for (const specifier of importSpecifiers(source2)) {
    let base;
    if (specifier.startsWith(".")) base = posixNormalize(`${route.file.split("/").slice(0, -1).join("/")}/${specifier}`);
    else if (specifier.startsWith("~/")) {
      const parts = route.file.split("/");
      const appIndex = parts.lastIndexOf("app");
      if (appIndex < 0) continue;
      base = posixNormalize(`${parts.slice(0, appIndex + 1).join("/")}/${specifier.slice(2)}`);
    } else continue;
    if (!base) continue;
    const candidates = [
      base,
      ...[".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"].map((ext) => `${base}${ext}`),
      ...[".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"].map((ext) => `${base}/index${ext}`)
    ];
    for (const candidate of candidates) {
      const found = files.find((file) => file.file === candidate);
      if (found) {
        results.push(found.text);
        break;
      }
    }
  }
  return results;
}
function localFunction(source2, syntax, name) {
  const functionPattern = new RegExp(`\\b(?:async\\s+)?function\\s+${name}\\b`, "g");
  for (const match of syntax.matchAll(functionPattern)) {
    const result = functionBody(source2, syntax, match.index, match.index + match[0].length);
    if (result) return result.text;
  }
  const arrowPattern = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=`, "g");
  for (const match of syntax.matchAll(arrowPattern)) {
    let cursor = skipSpace(syntax, match.index + match[0].length);
    if (/^async\s+/.test(syntax.slice(cursor))) cursor = skipSpace(syntax, cursor + "async".length);
    if (syntax.startsWith("function", cursor)) {
      const result = functionBody(source2, syntax, match.index, cursor + "function".length);
      if (result) return result.text;
      continue;
    }
    let paramsClose;
    if (syntax[cursor] === "(") paramsClose = matchingDelimiter(syntax, cursor, "(", ")");
    else {
      const parameter = syntax.slice(cursor).match(/^[A-Za-z_$][\w$]*/);
      if (parameter) paramsClose = cursor + parameter[0].length - 1;
    }
    if (paramsClose === void 0 || paramsClose < 0) continue;
    const arrow = syntax.indexOf("=>", paramsClose + 1), bodyOpen = arrow >= 0 ? skipSpace(syntax, arrow + 2) : -1;
    if (bodyOpen < 0 || syntax[bodyOpen] !== "{") continue;
    const bodyClose = matchingDelimiter(syntax, bodyOpen, "{", "}");
    if (bodyClose >= 0) return source2.slice(match.index, bodyClose + 1);
  }
  return null;
}
function expressHandlerSource(source2, syntax, match, open, close) {
  const registration = source2.slice(match.index, close + 1), call = syntax.slice(open + 1, close);
  const firstComma = call.indexOf(",");
  if (firstComma < 0) return registration;
  const tail = call.slice(firstComma + 1), names = /* @__PURE__ */ new Set();
  for (const candidate of tail.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) {
    const name = candidate[1];
    if (["async", "await", "function", "return", "req", "request", "res", "response", "next", "true", "false", "null", "undefined"].includes(name)) continue;
    const helper = localFunction(source2, syntax, name);
    if (helper) names.add(helper);
  }
  return [registration, ...names].join("\n");
}
function expressionEnd(syntax, start) {
  let parentheses = 0, brackets = 0, braces = 0;
  for (let index = start; index < syntax.length; index++) {
    const character = syntax[index];
    if (character === ";" && parentheses === 0 && brackets === 0 && braces === 0) return index;
    if (character === "\n" && parentheses === 0 && brackets === 0 && braces === 0) {
      const next = skipSpace(syntax, index + 1);
      if (syntax[next] !== ".") return index;
    }
    if (character === "}" && braces === 0 && parentheses === 0 && brackets === 0) return index;
    if (character === "(") parentheses++;
    else if (character === ")" && parentheses > 0) parentheses--;
    else if (character === "[") brackets++;
    else if (character === "]" && brackets > 0) brackets--;
    else if (character === "{") braces++;
    else if (character === "}" && braces > 0) braces--;
  }
  return syntax.length;
}
function callArgumentRanges(syntax, open) {
  const close = matchingDelimiter(syntax, open, "(", ")");
  if (close < 0) return [];
  const ranges = [];
  let start = open + 1, parentheses = 0, brackets = 0, braces = 0;
  for (let index = open + 1; index < close; index++) {
    const character = syntax[index];
    if (character === "," && parentheses === 0 && brackets === 0 && braces === 0) {
      ranges.push({ start, end: index });
      start = index + 1;
      continue;
    }
    if (character === "(") parentheses++;
    else if (character === ")" && parentheses > 0) parentheses--;
    else if (character === "[") brackets++;
    else if (character === "]" && brackets > 0) brackets--;
    else if (character === "{") braces++;
    else if (character === "}" && braces > 0) braces--;
  }
  if (start < close || ranges.length) ranges.push({ start, end: close });
  return ranges;
}
function hmacHeaderVariables(handler, syntax) {
  const names = /* @__PURE__ */ new Set();
  const patterns = [
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:request|req)\s*\.\s*)?headers\s*\.\s*get\s*\(/gi,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:request|req)\s*\.\s*)?headers\s*\[/gi
  ];
  for (const pattern of patterns) for (const match of syntax.matchAll(pattern)) {
    const openCharacter = /get\s*\($/i.test(match[0]) ? "(" : "[";
    const open = syntax.lastIndexOf(openCharacter, match.index + match[0].length - 1);
    const close = matchingDelimiter(syntax, open, openCharacter, openCharacter === "(" ? ")" : "]");
    if (close >= 0 && /^\s*(['"])x-shopify-hmac-sha256\1\s*$/i.test(handler.slice(open + 1, close))) names.add(match[1]);
  }
  return names;
}
function rawBodyUpdate(update, framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady) {
  const value = update.trim();
  if (/^await\s+(?:request|req)\s*\.\s*(?:text|arrayBuffer)\s*\(/i.test(value) || /\b(?:request|req)\s*\.\s*(?:rawBody|rawRequestBody)\b/i.test(value)) return true;
  if (/^Buffer\s*\.\s*concat\s*\(/i.test(value)) return framework === "next-pages-router" && pagesRawBodyReady;
  if (/^(?:req|request)\s*\.\s*body$/i.test(value) && framework === "express" && expressRawParser) return true;
  const identifier = value.match(/^([A-Za-z_$][\w$]*)$/)?.[1];
  if (!identifier) return false;
  return requestBodyVariables.has(identifier) || framework === "next-pages-router" && pagesRawBodyReady && namedUpdateVariables.has(identifier) || framework === "express" && (expressRawParser || namedUpdateVariables.has(identifier)) && namedUpdateVariables.has(identifier);
}
function computedHmacVariables(handler, syntax, framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady) {
  const names = /* @__PURE__ */ new Set();
  for (const match of syntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:crypto\s*\.\s*)?createHmac\s*\(/g)) {
    const open = syntax.indexOf("(", match.index + match[0].lastIndexOf("("));
    const close = matchingDelimiter(syntax, open, "(", ")");
    if (close < 0 || !/^\s*(['"])sha256\1\s*,/i.test(handler.slice(open + 1, close))) continue;
    const end = expressionEnd(syntax, close + 1);
    const chain = syntax.slice(close + 1, end);
    const updateCalls = [...chain.matchAll(/\.\s*update\s*\(/g)];
    for (const updateMatch of updateCalls) {
      const updateOpen = chain.indexOf("(", updateMatch.index + updateMatch[0].lastIndexOf("("));
      const updateClose = matchingDelimiter(chain, updateOpen, "(", ")");
      if (updateClose < 0) continue;
      const updateStart = close + 1 + updateOpen + 1;
      const updateEnd = close + 1 + updateClose;
      if (!rawBodyUpdate(handler.slice(updateStart, updateEnd), framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady)) continue;
      const digestTail = chain.slice(updateClose + 1);
      for (const digestMatch of digestTail.matchAll(/\.\s*digest\s*\(/g)) {
        const digestOpen = digestTail.indexOf("(", digestMatch.index + digestMatch[0].lastIndexOf("("));
        const digestClose = matchingDelimiter(digestTail, digestOpen, "(", ")");
        if (digestClose < 0) continue;
        const digestStart = close + 1 + updateClose + 1 + digestOpen + 1;
        const digestEnd = close + 1 + updateClose + 1 + digestClose;
        if (/^\s*(['"])base64\1\s*$/i.test(handler.slice(digestStart, digestEnd))) names.add(match[1]);
      }
    }
  }
  return names;
}
function bufferAliases(names, syntax) {
  const aliases = new Set(names), buffers = /* @__PURE__ */ new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of syntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*Buffer\s*\.\s*from\s*\(/g)) {
      const open = syntax.indexOf("(", match.index + match[0].lastIndexOf("("));
      const args = callArgumentRanges(syntax, open);
      if (!args.length) continue;
      const first = syntax.slice(args[0].start, args[0].end).trim();
      if (/^[A-Za-z_$][\w$]*$/.test(first) && aliases.has(first) && !aliases.has(match[1])) {
        aliases.add(match[1]);
        buffers.add(match[1]);
        changed = true;
      }
    }
  }
  return buffers;
}
function timingSafeComparisonUsesShopifyHmac(handler, syntax, headerVariables, digestVariables) {
  const headerBuffers = bufferAliases(headerVariables, syntax);
  const digestBuffers = bufferAliases(digestVariables, syntax);
  const unwrap = (value) => {
    let expression = value.trim(), changed = true;
    while (changed && expression.startsWith("(") && expression.endsWith(")")) {
      changed = matchingDelimiter(expression, 0, "(", ")") === expression.length - 1;
      if (changed) expression = expression.slice(1, -1).trim();
    }
    return expression;
  };
  const headerCall = /^(?:(?:request|req)\s*\.\s*)?headers\s*(?:\.\s*get\s*\(\s*(['"])x-shopify-hmac-sha256\1\s*\)|\[\s*(['"])x-shopify-hmac-sha256\2\s*\])$/i;
  const usesBuffer = (range, variables, buffers, directHeader) => {
    const expression = unwrap(handler.slice(range.start, range.end));
    if (/^[A-Za-z_$][\w$]*$/.test(expression)) return buffers.has(expression);
    const expressionSyntax = unwrap(syntax.slice(range.start, range.end));
    const call = expressionSyntax.match(/^Buffer\s*\.\s*from\s*\(/);
    if (!call) return false;
    const open = expressionSyntax.indexOf("("), args = callArgumentRanges(expressionSyntax, open);
    if (!args.length) return false;
    const value = unwrap(expression.slice(args[0].start, args[0].end));
    return variables.has(value) || directHeader && headerCall.test(value);
  };
  for (const match of syntax.matchAll(/\btimingSafeEqual\s*\(/g)) {
    const open = syntax.indexOf("(", match.index + match[0].lastIndexOf("("));
    const args = callArgumentRanges(syntax, open);
    if (args.length !== 2) continue;
    const headerAt = (range) => usesBuffer(range, headerVariables, headerBuffers, true);
    const digestAt = (range) => usesBuffer(range, digestVariables, digestBuffers, false);
    if (headerAt(args[0]) && digestAt(args[1]) || headerAt(args[1]) && digestAt(args[0])) return true;
  }
  return false;
}
function hasShopifyAuthenticator(source2) {
  const cleaned = maskComments(source2), syntax = maskStrings(cleaned);
  const importPattern = /\bimport\s*\{([^}]+)\}\s*from\s*(['"])(@shopify\/shopify-app-(?:react-router|remix)\/server)\2/g;
  let creator = null;
  for (const match of cleaned.matchAll(importPattern)) {
    const imported = match[1].match(/\bshopifyApp\b(?:\s+as\s+([A-Za-z_$][\w$]*))?/);
    if (imported) {
      creator = imported[1] ?? "shopifyApp";
      break;
    }
  }
  if (!creator) return false;
  const appInstances = new Set([...syntax.matchAll(new RegExp(`\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*${creator}\\s*\\(`, "g"))].map((match) => match[1]));
  for (const match of syntax.matchAll(/\b(?:export\s+)?(?:const|let|var)\s+authenticate\s*=\s*([A-Za-z_$][\w$]*)\s*\.\s*authenticate\b/g)) {
    if (!appInstances.has(match[1])) continue;
    if (/\bexport\s+(?:const|let|var)\s+authenticate\b/.test(syntax) || /\bexport\s*\{[^}]*\bauthenticate\b/.test(syntax)) return true;
  }
  return false;
}
function routeAuth(route, files) {
  const handler = route.handlerSource ?? "", moduleSource = route.moduleSource ?? route.source ?? "";
  const handlerSyntax = maskStrings(handler);
  const relatedModules = [moduleSource, ...localImports(route, files)];
  const hasPackage = (source2, packagePattern) => importSpecifiers(source2).some((specifier) => packagePattern.test(specifier));
  const reactRouter = /\bauthenticate\s*\.\s*webhook\s*\(/.test(handlerSyntax) && relatedModules.some((source2) => hasPackage(source2, /^@shopify\/shopify-app-(?:react-router|remix)\/server$/) && hasShopifyAuthenticator(source2));
  const apiLibraryCall = /\b(?:shopify\s*\.\s*)?webhooks\s*\.\s*validate\s*\(/.test(handlerSyntax) && relatedModules.some((source2) => hasPackage(source2, /^@shopify\/shopify-api(?:\/.*)?$/));
  const requestBodyVariables = /* @__PURE__ */ new Set();
  for (const match of handlerSyntax.matchAll(/\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+(?:request|req)\.(?:text|arrayBuffer)\s*\(/g)) requestBodyVariables.add(match[1]);
  const namedUpdate = [...handlerSyntax.matchAll(/\.update\s*\(\s*(rawBody|rawRequestBody|bodyBuffer|rawBuffer)\s*\)/ig)];
  const expressPrelude = route.framework === "express" && route.registrationOffset !== void 0 ? moduleSource.slice(0, route.registrationOffset) : "";
  const expressRawParser = route.framework === "express" && /express\.(?:raw|text)\s*\(/.test(`${expressPrelude}
${handler}`);
  const rawPropertyInput = route.framework === "express" && /\.update\s*\(\s*req\.(?:rawBody|rawRequestBody)\s*\)/i.test(handlerSyntax);
  const expressRawProperty = route.framework === "express" && /\b(?:rawBody|rawRequestBody)\s*=\s*req\.(?:rawBody|rawRequestBody)\b/i.test(handlerSyntax);
  const genericRawBodyInput = /\.update\s*\(\s*(?:await\s+request\.(?:text|arrayBuffer)\s*\(|Buffer\.concat\s*\()/i.test(handlerSyntax) || [...requestBodyVariables].some((name) => new RegExp(`\\.update\\s*\\(\\s*${name}\\s*\\)`).test(handlerSyntax)) || namedUpdate.length > 0 && (route.framework === "next-pages-router" || route.framework === "express" && (expressRawParser || expressRawProperty)) || rawPropertyInput;
  const rawBodyInput = route.framework === "next-pages-router" ? pagesRawBodyInput(handler) : genericRawBodyInput;
  const rawBodyArgument = /\brawBody\s*:\s*(?:rawBody|rawRequestBody|bodyBuffer|rawBuffer|await\s+request\.(?:text|arrayBuffer)\s*\(|Buffer\.concat\s*\()/i.test(handlerSyntax) || [...requestBodyVariables].some((name) => new RegExp(`\\brawBody\\s*:\\s*${name}\\b`).test(handlerSyntax)) || route.framework === "express" && expressRawParser && /\brawBody\s*:\s*req\.body\b/i.test(handlerSyntax);
  const rawInput = rawBodyInput || /\bwebhooks\s*\.\s*validate\s*\(/.test(handlerSyntax) && rawBodyArgument;
  const hasHeader = [...handlerSyntax.matchAll(/\bheaders\s*\.\s*get\s*\(/g)].some((match) => {
    const open = handlerSyntax.indexOf("(", match.index);
    return /^\s*(['"])x-shopify-hmac-sha256\1/i.test(handler.slice(open + 1));
  }) || [...handlerSyntax.matchAll(/\bheaders\s*\[/g)].some((match) => {
    const open = handlerSyntax.indexOf("[", match.index);
    return /^\s*(['"])x-shopify-hmac-sha256\1/i.test(handler.slice(open + 1));
  });
  const sha256Hmac = [...handlerSyntax.matchAll(/\bcreateHmac\s*\(/g)].some((match) => {
    const open = handlerSyntax.indexOf("(", match.index);
    return /^\s*(['"])sha256\1/i.test(handler.slice(open + 1));
  });
  const namedUpdateVariables = new Set(namedUpdate.map((match) => match[1]));
  const pagesRawBodyReady = route.framework === "next-pages-router" && pagesRawBodyInput(handler);
  const digestVariables = computedHmacVariables(handler, handlerSyntax, route.framework, requestBodyVariables, namedUpdateVariables, expressRawParser, pagesRawBodyReady);
  const headerVariables = hmacHeaderVariables(handler, handlerSyntax);
  const hmac = hasHeader && rawBodyInput && digestVariables.size > 0 && timingSafeComparisonUsesShopifyHmac(handler, handlerSyntax, headerVariables, digestVariables);
  const usesParsedBody = /\.update\s*\(\s*(?:req|request)\.body\s*\)/i.test(handlerSyntax) || /\brawBody\s*:\s*(?:req|request)\.body\b/i.test(handlerSyntax);
  const parsedBodyInput = usesParsedBody && !(route.framework === "express" && expressRawParser);
  const library = apiLibraryCall && (rawBodyArgument || route.framework === "express" && !parsedBodyInput);
  const verified = (reactRouter || library || hmac) && pageRawBodyConfig(route) && !parsedBodyInput;
  const helperCall = /\b(?:verify|validate|authenticate|check|assert)[\w$]*\s*\(/i.test(handlerSyntax) || /\b(?:shopify\s*\.\s*)?webhooks\s*\.\s*validate\s*\(/.test(handlerSyntax) || /\bauthenticate\s*\.\s*webhook\s*\(/.test(handlerSyntax);
  const verificationAttempt = hasHeader || sha256Hmac || helperCall;
  return { verified, helperCall, verificationAttempt, parsedBodyInput, rawBodyAttempt: hasHeader && sha256Hmac };
}
function destinationFinding(file, line, rationale, remediation, evidence, confidence = "medium") {
  return { ruleId: "AR-WEBHOOK-001", severity: "high", status: "NEEDS_REVIEW", title: "Delivery authentication evidence requires route review", rationale, remediation, file, line, confidence, evidence };
}
function reviewDeliveries({ files, endpoints, applicationUrl }) {
  const candidates = routeCandidates(files), findings = [];
  const deliveries = endpoints.length ? endpoints : candidates.filter((candidate) => /webhook|events/i.test(candidate.route) || /authenticate\s*\.\s*webhook|x-shopify-(?:hmac|webhook)|shopify-hmac-sha256/i.test(candidate.handlerSource || candidate.source)).map((candidate) => ({ uri: candidate.route, kind: "inferred" }));
  for (const delivery of deliveries) {
    const destination = classifyDestination(delivery.uri, delivery.applicationUrl ?? applicationUrl);
    if (destination.transport === "eventbridge" || destination.transport === "pubsub") {
      findings.push({ ruleId: "AR-EVENTS-004", severity: "medium", status: "NEEDS_REVIEW", title: "Cloud event destination requires provider-side review", rationale: "Shopify does not require HTTPS HMAC verification for EventBridge or Pub/Sub deliveries; static repository analysis cannot verify the cloud resource policy or delivery identity.", remediation: "Verify the event bus resource policy, consumer identity, retry handling, and idempotent processing in the cloud provider.", file: delivery.file ?? "repository", confidence: "manual", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
      findings.push({ ruleId: "AR-WEBHOOK-004", severity: "low", status: "NEEDS_REVIEW", title: "Duplicate-delivery handling requires provider route review", rationale: "Cloud event deliveries can be retried; static repository analysis cannot associate the destination with one consumer handler.", remediation: "Verify that the consumer processes duplicate messages idempotently.", file: delivery.file ?? "repository", confidence: "manual", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
      continue;
    }
    if (!["https", "development"].includes(destination.transport)) {
      findings.push(destinationFinding(delivery.file ?? "repository", void 0, "The configured delivery transport or route could not be associated with a statically recognised HTTPS handler.", "Confirm the delivery transport and verify the specific handler with Shopify\u2019s supported framework helper or raw-body HMAC procedure.", "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries", "low"));
      continue;
    }
    const matched = destination.pathname ? candidates.filter((candidate) => matchesRoute(candidate.route, destination.pathname)) : [];
    const associated = matched.length === 1 ? matched[0] : null;
    if (!associated) {
      const reason = matched.length > 1 ? "More than one route pattern matches this configured destination, so the request handler is ambiguous." : "A configured HTTPS delivery could not be connected to a supported route file or registration.";
      findings.push(destinationFinding(delivery.file ?? "repository", void 0, reason, "Trace this destination to one handler and verify each HTTPS delivery with Shopify\u2019s framework helper or raw-body HMAC procedure.", "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries", "low"));
      findings.push({ ruleId: "AR-WEBHOOK-004", severity: "low", status: "NEEDS_REVIEW", title: "Duplicate-delivery handling is not linked to this route", rationale: "No unique route was associated with the configured delivery, so route-local duplicate handling could not be assessed.", remediation: "Verify that processing is idempotent or deduplicates deliveries using Shopify\u2019s delivery ID.", file: delivery.file ?? "repository", confidence: "low", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
      continue;
    }
    if (!associated.methodSupported || !associated.handlerKnown) {
      const methods = associated.methods.length ? ` Only ${associated.methods.join(", ")} handlers were recognised.` : "";
      findings.push(destinationFinding(associated.file, associated.line, `The matched route does not expose one statically recognised POST handler.${methods}`, "Confirm that this URL accepts Shopify\u2019s HTTP POST delivery and trace any exported handler alias manually.", "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries", "low"));
      continue;
    }
    const auth = routeAuth(associated, files), routeSource = associated.handlerSource;
    if (auth.verified) {
      findings.push({ ruleId: "AR-WEBHOOK-001", severity: "info", status: "PASS", title: "Recognisable delivery verifier is present on the matched route", rationale: "A Shopify framework verifier or route-local raw-body HMAC pattern was found on the one statically matched POST handler. This is source evidence, not runtime verification.", remediation: "Confirm the deployed route uses this handler and the expected secret.", file: associated.file, line: associated.line, confidence: "medium", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
    } else {
      const rationale = auth.helperCall ? "A custom or imported verification helper is called on this route, but its implementation could not be traced confidently to Shopify HMAC verification." : "The matched POST handler does not contain a recognised Shopify verifier or route-local raw-body HMAC check.";
      findings.push(destinationFinding(associated.file, associated.line, rationale, "Trace this handler and verify the original request body with Shopify\u2019s supported helper or HMAC procedure before processing the payload.", "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries", "medium"));
    }
    if (associated.framework === "next-pages-router" && associated.bodyParserDefault && (auth.rawBodyAttempt || auth.parsedBodyInput)) {
      findings.push({ ruleId: "AR-WEBHOOK-002", severity: "high", status: "WARN", title: "Pages API body parsing may precede webhook verification", rationale: "Next.js Pages API Routes enable body parsing by default. The matched route attempts HMAC verification without declaring `api.bodyParser: false`, so the original request bytes may no longer be available.", remediation: "Disable the Pages API body parser for this route and read the request stream before computing the HMAC.", file: associated.file, line: associated.line, confidence: "high", evidence: "https://nextjs.org/docs/pages/building-your-application/routing/api-routes" });
    }
    if (associated.framework === "express" && /(?:express|bodyParser)\.json\s*\(/.test(routeSource) && !/rawBody|verify\s*[:=]/i.test(routeSource)) {
      findings.push({ ruleId: "AR-WEBHOOK-002", severity: "high", status: "WARN", title: "JSON parsing may run before this delivery route", rationale: "A JSON body parser appears before or alongside the matched route without recognisable raw-body capture.", remediation: "Capture the raw request body before parsing and verify the HMAC against those bytes.", file: associated.file, line: associated.line, confidence: "medium", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
    }
    if (/(?:shopify-webhook-id|x-shopify-webhook-id|idempoten|dedup|duplicate)/i.test(routeSource)) {
      findings.push({ ruleId: "AR-WEBHOOK-004", severity: "info", status: "PASS", title: "Duplicate-delivery handling signal is present on the matched route", rationale: "An idempotency or delivery-ID pattern is present on this route; the persistent behaviour cannot be proven statically.", remediation: "Verify retries remain safe against the production data store.", file: associated.file, line: associated.line, confidence: "medium", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
    } else {
      findings.push({ ruleId: "AR-WEBHOOK-004", severity: "low", status: "NEEDS_REVIEW", title: "Duplicate-delivery handling is not evident on this route", rationale: "Shopify retries failed deliveries and may deliver an event more than once; no route-local idempotency signal was found.", remediation: "Verify that processing is idempotent or deduplicates deliveries using Shopify\u2019s delivery ID.", file: associated.file, line: associated.line, confidence: "medium", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
    }
    if (/(?:signature\s*===|===\s*signature|signature\s*==|==\s*signature)/i.test(routeSource) && !/timingSafeEqual/i.test(routeSource)) {
      findings.push({ ruleId: "AR-WEBHOOK-003", severity: "medium", status: "WARN", title: "Direct signature comparison appears on this route", rationale: "A direct signature comparison was detected without a timing-safe comparison in the matched route.", remediation: "Use Shopify\u2019s verifier or a timing-safe comparison after decoding both signatures.", file: associated.file, line: associated.line, confidence: "medium", evidence: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries" });
    }
  }
  return findings;
}
function codeFiles(files) {
  return files.filter((file) => CODE.test(file.file)).map((file) => ({ ...file, text: maskComments(file.text) }));
}

// src/baseline.js
import crypto from "node:crypto";
import fs2 from "node:fs";
import path2 from "node:path";
var DEFAULT_BASELINE = ".app-review-guard-baseline.json";
function findingFingerprint(finding2) {
  const identity = [finding2.ruleId, finding2.file, finding2.title].join("\0");
  return crypto.createHash("sha256").update(identity).digest("hex");
}
function loadBaseline(root, selected = void 0) {
  const relative = selected ?? DEFAULT_BASELINE, file = path2.resolve(root, relative);
  if (!fs2.existsSync(file)) return null;
  const raw = safeFile(root, file);
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Baseline must be valid JSON; contents were not printed");
  }
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.entries) || value.entries.some((entry) => !entry || typeof entry.fingerprint !== "string" || !/^[a-f0-9]{64}$/.test(entry.fingerprint) || typeof entry.ruleId !== "string" || typeof entry.file !== "string" || typeof entry.title !== "string")) throw new Error("Baseline format is invalid; create a new baseline");
  return { file: relative, entries: value.entries };
}
function classifyAgainstBaseline(findings, baseline) {
  if (!baseline) return { findings: findings.map((finding2) => ({ ...finding2, lifecycle: "UNCHANGED" })), resolvedFindings: [], enabled: false };
  const currentCounts = /* @__PURE__ */ new Map();
  for (const finding2 of findings) {
    const key = findingFingerprint(finding2);
    currentCounts.set(key, (currentCounts.get(key) ?? 0) + 1);
  }
  const seen = /* @__PURE__ */ new Map();
  const classified = findings.map((finding2) => {
    const fingerprint = findingFingerprint(finding2), prior = seen.get(fingerprint) ?? 0;
    seen.set(fingerprint, prior + 1);
    const existing = baseline.entries.some((entry) => entry.fingerprint === fingerprint);
    return { ...finding2, fingerprint, lifecycle: existing ? "EXISTING" : "NEW" };
  });
  const resolvedFindings = baseline.entries.filter((entry) => !currentCounts.has(entry.fingerprint)).map((entry) => ({ ...entry, status: "RESOLVED", lifecycle: "RESOLVED", severity: "info", confidence: "baseline", rationale: "This finding was present in the saved baseline and is no longer detected.", remediation: "No action is required unless the underlying risk returns.", evidence: null, evidenceVersion: null }));
  return { findings: classified, resolvedFindings, enabled: true };
}

// src/analyzer.js
var EVIDENCE_VERSION = "2026-10";
var CONFIG = /shopify\.app(?:\.[^./]+)?\.toml$/;
var TOPICS = ["customers/data_request", "customers/redact", "shop/redact"];
var source = {
  requirements: "https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements",
  submit: "https://shopify.dev/docs/apps/launch/app-store-review/submit-app-for-review",
  privacy: "https://shopify.dev/docs/apps/launch/privacy-requirements",
  auth: "https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens",
  webhooks: "https://shopify.dev/docs/apps/build/webhooks/verify-deliveries",
  events: "https://shopify.dev/docs/apps/build/events/subscribe",
  appBridge: "https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements#use-the-latest-version-of-shopify-app-bridge"
};
function finding(ruleId, severity, status, title, rationale, remediation, file, line, confidence = "medium", evidence = source.requirements) {
  return { ruleId, severity, status, title, rationale, remediation, file, line: line || void 0, confidence, evidence, evidenceVersion: EVIDENCE_VERSION };
}
function lineOf(text, needle) {
  const i = text.indexOf(needle);
  return i < 0 ? void 0 : text.slice(0, i).split("\n").length;
}
function configs(files) {
  return files.filter((f) => CONFIG.test(f.file));
}
function hasAny(files, re) {
  return files.some((f) => re.test(f.text));
}
function allText(files) {
  return files.map((f) => f.text).join("\n");
}
var LISTING_ITEMS = ["privacyPolicyUrl", "supportUrl", "testInstructions", "emergencyContact"];
function manifest(root) {
  const names = [".app-review-guard.yml", ".app-review-guard.yaml", ".app-review-guard.json"].filter((n) => fs3.existsSync(path3.join(root, n)));
  if (names.length > 1) throw new Error("Multiple listing manifests found; keep one");
  if (!names.length) return null;
  const file = names[0], raw = safeFile(root, path3.join(root, file));
  try {
    let value;
    if (file.endsWith(".json")) value = JSON.parse(raw);
    else {
      const lines = raw.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
      if (lines.shift()?.trim() !== "listing:") throw new Error();
      const listing = {};
      for (const line of lines) {
        const m = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(true|false)\s*(?:#.*)?$/);
        if (!m || Object.hasOwn(listing, m[1])) throw new Error();
        listing[m[1]] = m[2] === "true";
      }
      value = { listing };
    }
    if (!value || typeof value !== "object" || Array.isArray(value) || !value.listing || typeof value.listing !== "object" || Array.isArray(value.listing) || Object.values(value.listing).some((v) => typeof v !== "boolean")) throw new Error();
    return { file, value };
  } catch {
    return { file, value: null };
  }
}
function parseApp(text) {
  let data;
  try {
    data = import_toml.default.parse(text);
  } catch {
    throw new Error("Invalid Shopify app TOML; contents were not printed");
  }
  if (data.application_url !== void 0 && typeof data.application_url !== "string") throw new Error("application_url must be a string");
  if (data.embedded !== void 0 && typeof data.embedded !== "boolean") throw new Error("embedded must be a boolean");
  for (const key of ["auth", "webhooks", "events", "build"]) if (data[key] !== void 0 && (!data[key] || typeof data[key] !== "object" || Array.isArray(data[key]))) throw new Error(`${key} must be a table`);
  if (data.auth?.redirect_urls !== void 0 && (!Array.isArray(data.auth.redirect_urls) || data.auth.redirect_urls.some((v) => typeof v !== "string"))) throw new Error("auth.redirect_urls must be an array of strings");
  if (data.webhooks?.api_version !== void 0 && typeof data.webhooks.api_version !== "string") throw new Error("webhooks.api_version must be a string");
  if (data.webhooks?.subscriptions !== void 0 && !Array.isArray(data.webhooks.subscriptions)) throw new Error("webhooks.subscriptions must be an array of tables");
  for (const subscription of data.webhooks?.subscriptions ?? []) {
    if (!subscription || typeof subscription !== "object" || Array.isArray(subscription)) throw new Error("Webhook subscription must be a table");
    if (subscription.compliance_topics !== void 0 && (!Array.isArray(subscription.compliance_topics) || subscription.compliance_topics.some((v) => typeof v !== "string"))) throw new Error("compliance_topics must be an array of strings");
    if (subscription.uri !== void 0 && typeof subscription.uri !== "string") throw new Error("Webhook uri must be a string");
  }
  if (data.events?.api_version !== void 0 && typeof data.events.api_version !== "string") throw new Error("events.api_version must be a string");
  if (data.events?.subscription !== void 0 && !Array.isArray(data.events.subscription)) throw new Error("events.subscription must be an array of tables");
  for (const subscription of data.events?.subscription ?? []) {
    if (!subscription || typeof subscription !== "object" || Array.isArray(subscription)) throw new Error("Events subscription must be a table");
    for (const key of ["handle", "topic", "uri", "query", "query_filter"]) if (subscription[key] !== void 0 && typeof subscription[key] !== "string") throw new Error(`Events ${key} must be a string`);
    for (const key of ["actions", "triggers"]) if (subscription[key] !== void 0 && (!Array.isArray(subscription[key]) || subscription[key].some((value) => typeof value !== "string"))) throw new Error(`Events ${key} must be an array of strings`);
  }
  return data;
}
function urlInfo(value) {
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return { secure: url.protocol === "https:" && !url.username && !url.password, local: url.protocol === "http:" && local, development: local || /(?:^|\.)ngrok\.(?:io|app)$/.test(url.hostname) };
  } catch {
    return { secure: false, local: false, development: false };
  }
}
function analyze(root = ".", options = {}) {
  let repo = path3.resolve(root);
  let { files, skipped } = readFiles(repo);
  let cs;
  if (options.config) {
    const selected = path3.resolve(repo, options.config), text2 = safeFile(repo, selected);
    repo = path3.dirname(selected);
    ({ files, skipped } = readFiles(repo));
    cs = [{ file: path3.relative(repo, selected).replaceAll(path3.sep, "/"), text: text2 }];
  } else {
    const discovered = configs(files), appRoots = [...new Set(discovered.map((c) => path3.dirname(path3.join(repo, c.file))))];
    if (appRoots.length > 1) throw new Error("Multiple Shopify app roots were found; pass --path for one app or select a configuration with --config.");
    if (appRoots.length === 1 && appRoots[0] !== repo) {
      repo = appRoots[0];
      ({ files, skipped } = readFiles(repo));
    }
    cs = configs(files);
  }
  const findings = [];
  const parsedConfigs = cs.map((c) => ({ ...c, data: parseApp(c.text) }));
  if (!cs.length) findings.push(finding("AR-CONFIG-001", "high", "FAIL", "Shopify app configuration was not found", "No shopify.app*.toml file was discovered.", "Add and validate the Shopify CLI app configuration for the intended deployment.", "repository", void 0, "high"));
  for (const c of parsedConfigs) {
    const t = c.text;
    const url = c.data.application_url;
    if (!url) findings.push(finding("AR-CONFIG-002", "high", "FAIL", "Application URL is missing", "The configuration does not declare application_url.", "Set a production HTTPS application_url in the deployed app configuration.", c.file, void 0, "high"));
    else if (!urlInfo(url).secure && !urlInfo(url).local) findings.push(finding("AR-CONFIG-002", "high", "FAIL", "Application URL is not HTTPS", "A non-local application URL uses an insecure scheme.", "Use an HTTPS application URL for production.", c.file, lineOf(t, "application_url"), "high"));
    if (urlInfo(url).development && !/development|dev/i.test(c.file)) findings.push(finding("AR-CONFIG-003", "medium", "WARN", "Development URL appears in app configuration", "The URL looks like a local or tunnel endpoint.", "Confirm this is intentionally a development configuration and do not submit it as production.", c.file, lineOf(t, "application_url"), "high"));
    const redirects = c.data.auth?.redirect_urls ?? [];
    if (redirects.some((value) => !urlInfo(value).secure && !urlInfo(value).local)) findings.push(finding("AR-CONFIG-004", "high", "FAIL", "OAuth redirect URL is not HTTPS", "A non-local redirect URL uses HTTP.", "Use HTTPS redirect URLs outside local development.", c.file, lineOf(t, "http://"), "high"));
    if (c.data.build?.automatically_update_urls_on_dev === true && !/development|dev/i.test(c.file)) findings.push(finding("AR-CONFIG-006", "medium", "WARN", "Development URL auto-update is enabled", "The configuration enables Shopify CLI URL mutation in a non-obvious production configuration.", "Keep automatic development URL updates isolated to development configuration.", c.file, lineOf(t, "automatically_update_urls_on_dev"), "medium"));
    if (c.data.webhooks && !c.data.webhooks.api_version) findings.push(finding("AR-CONFIG-007", "low", "NEEDS_REVIEW", "Webhook API version is not evident", "Webhook configuration exists but no explicit API version was detected.", "Confirm the configured version against current Shopify documentation.", c.file, void 0, "medium", source.webhooks));
    for (const topic of TOPICS) if (!(c.data.webhooks?.subscriptions ?? []).some((s) => s.compliance_topics?.includes(topic) && typeof s.uri === "string" && s.uri.trim())) findings.push(finding("AR-COMPLIANCE-001", "high", "FAIL", `Mandatory compliance topic is not configured: ${topic}`, "Shopify requires App Store distributed apps to subscribe to the three compliance topics.", "Add the topic to Shopify app configuration and implement its handler.", c.file, void 0, "high", source.submit));
  }
  const code = codeFiles(files);
  const text = allText(code), credentialText = allText(files);
  const compliance = TOPICS.filter((topic) => hasAny(code, new RegExp(topic.replace("/", "[/:._-]"), "i")));
  for (const topic of TOPICS) if (compliance.includes(topic)) findings.push(finding("AR-COMPLIANCE-002", "medium", "NEEDS_REVIEW", `Compliance handler evidence found for ${topic}`, "A topic-like route or handler was detected, but static analysis cannot prove runtime routing, authentication, or deletion semantics.", "Verify routing, Shopify delivery authentication, and the handler response/retention behaviour.", "repository", void 0, "medium", source.privacy));
  const deliveryEndpoints = [];
  for (const config of parsedConfigs) {
    const subscriptions = config.data.events?.subscription ?? [];
    if (subscriptions.some((subscription) => subscription.query) && !config.data.events?.api_version) findings.push(finding("AR-EVENTS-001", "medium", "NEEDS_REVIEW", "Events query API version is not explicit", "An Events subscription defines a GraphQL query but the [events].api_version used to validate and run it is not visible.", "Set [events].api_version and validate the query against that Shopify API version.", config.file, void 0, "high", source.events));
    for (let i = 0; i < subscriptions.length; i++) {
      const subscription = subscriptions[i], label = `Events subscription ${i + 1}`;
      if (!subscription.handle || !subscription.topic || !subscription.actions?.length || !subscription.uri) findings.push(finding("AR-EVENTS-002", "high", "WARN", `${label} is missing a required field`, "Shopify Events subscriptions require a handle, topic, action, and delivery URI.", "Complete the required subscription fields and validate them with the supported Shopify CLI.", config.file, void 0, "high", source.events));
      if (subscription.actions?.includes("update") && !subscription.triggers?.length) findings.push(finding("AR-EVENTS-002", "high", "WARN", `${label} update triggers are missing`, "Shopify requires triggers when an Events subscription includes the update action.", "Add the field paths that should trigger update deliveries.", config.file, void 0, "high", source.events));
      if (subscription.query_filter && !subscription.query) findings.push(finding("AR-EVENTS-003", "medium", "WARN", `${label} filter has no query`, "Shopify evaluates query_filter against the result of the configured query.", "Add the required GraphQL query or remove the filter.", config.file, void 0, "high", source.events));
      deliveryEndpoints.push({ uri: subscription.uri, kind: "events", file: config.file, applicationUrl: config.data.application_url });
    }
    const classic = config.data.webhooks?.subscriptions ?? [];
    for (const subscription of classic) deliveryEndpoints.push({ uri: subscription.uri, kind: "webhook", file: config.file, applicationUrl: config.data.application_url });
  }
  findings.push(...reviewDeliveries({ files: code, endpoints: deliveryEndpoints }));
  const embedded = parsedConfigs.some((c) => c.data.embedded === true);
  if (embedded && !/session token|sessionToken|id_token|token.exchange|token-exchange|authenticate\./i.test(text)) findings.push(finding("AR-AUTH-001", "high", "NEEDS_REVIEW", "Embedded authentication evidence is not evident", "The app is configured as embedded but no recognizable session-token or token-exchange pattern was found.", "Verify embedded requests with Shopify-supported authentication helpers and session tokens.", "repository", void 0, "medium", source.auth));
  if (embedded && !hasLatestAppBridgeScript(files)) findings.push(finding("AR-APP-BRIDGE-001", "medium", "NEEDS_REVIEW", "Latest App Bridge script evidence is not visible", "The app is configured as embedded, but no recognizable latest app-bridge.js script tag was found in scanned HTML or JSX. A framework may inject the script at runtime, which static analysis cannot determine.", "Verify that the latest Shopify App Bridge script is loaded before other scripts in every embedded document.", "repository", void 0, "medium", source.appBridge));
  if (/X-Shopify-Access-Token|admin\/api|graphql\.json/i.test(text) && !/authenticate|session|token.exchange|accessToken/i.test(text)) findings.push(finding("AR-AUTH-002", "high", "NEEDS_REVIEW", "Admin API access may be unauthenticated", "Admin API-like requests were found without nearby authentication evidence.", "Trace the request path and require authenticated Shopify credentials server-side.", "repository", void 0, "low", source.auth));
  if (/(api_secret|client_secret|access_token|admin_api_access_token)\s*[:=]\s*["'][^"']{12,}/i.test(credentialText) || /shpat_[a-z0-9]+/i.test(credentialText)) findings.push(finding("AR-AUTH-004", "high", "FAIL", "Potential hardcoded Shopify credential", "A credential-like assignment or Shopify access-token pattern was detected. The value is intentionally not printed.", "Remove the credential, rotate it, and load secrets from the deployment secret store.", "repository", void 0, "high", source.auth));
  for (const f of files) if (/^\.env(?:\.|$)/i.test(path3.basename(f.file)) && !/^\.env\.example$/i.test(path3.basename(f.file))) findings.push(finding("AR-SECURITY-001", "high", "NEEDS_REVIEW", "Environment file is present in the scanned repository", "Environment files commonly contain credentials; static analysis cannot determine whether this file is committed or sanitized.", "Ensure secret-bearing environment files are ignored and never committed.", f.file, void 0, "medium", source.requirements));
  if (/child_process\.(?:exec|execSync|spawn)|eval\s*\(/.test(text)) findings.push(finding("AR-SECURITY-002", "medium", "NEEDS_REVIEW", "Dynamic execution requires security review", "A command execution or eval-like pattern was found; this tool does not replace CodeQL or a full SAST review.", "Review inputs, trust boundaries, and use CodeQL/Semgrep for deeper analysis.", "repository", void 0, "medium", source.requirements));
  if (/customer|order|email|phone|address|Customer|Order/i.test(text)) findings.push(finding("AR-DATA-001", "medium", "NEEDS_REVIEW", "Protected customer data signals detected", "Customer, order, or contact-data patterns appear in the repository.", "Verify protected-data access status, privacy disclosures, retention, and listing requirements in Partner Dashboard.", "repository", void 0, "low", source.privacy));
  if (/billing|recurringApplicationCharge|appSubscription|oneTimePurchase|createAppSubscription/i.test(text)) findings.push(finding("AR-BILLING-001", "medium", "NEEDS_REVIEW", "Billing implementation detected", "Billing code is present, but static analysis cannot prove approval, decline, reinstall, or plan-change lifecycle behaviour.", "Test the complete billing lifecycle and verify pricing/listing declarations.", "repository", void 0, "medium", source.requirements));
  if (/REST Admin API|admin\/api\/\d{4}-\d{2}/i.test(text)) findings.push(finding("AR-API-004", "low", "NEEDS_REVIEW", "REST Admin API usage requires review", "REST Admin API references were found. This is a review signal, not an upgrade analysis.", "Confirm the API choice and current Shopify guidance; use Shopify Upgrade Guard for migration analysis.", "repository", void 0, "medium", source.requirements));
  const m = manifest(repo);
  if (m && !m.value) findings.push(finding("AR-LISTING-001", "low", "WARN", "Listing manifest could not be parsed", "The optional manifest is not valid supported JSON/YAML.", "Fix the manifest; all unverified listing requirements remain manual.", m.file, void 0, "high", source.submit));
  for (const item of LISTING_ITEMS) {
    const declared = m?.value?.listing?.[item] === true;
    findings.push(finding(`AR-LISTING-${item.toUpperCase()}`, "medium", "NEEDS_REVIEW", `Listing item requires manual verification: ${item}`, declared ? "The optional manifest records this item as declared, but the scanner cannot verify its accuracy or Partner Dashboard state." : "No affirmative declaration was found for this external listing requirement.", "Verify the item against the published listing and current Partner Dashboard state.", m?.file ?? ".app-review-guard.yml", void 0, "manual", source.submit));
  }
  if (options.showUnmapped && files.some((f) => /shopify/i.test(f.text))) findings.push(finding("AR-REVIEW-001", "low", "UNKNOWN", "Some Shopify behaviour may be outside supported static patterns", "Static analysis cannot understand every framework abstraction or runtime path.", "Review UNKNOWN/NEEDS_REVIEW items and use runtime testing before submission.", "repository", void 0, "low", source.submit));
  findings.sort((a, b) => `${a.ruleId}:${a.file}:${a.title}`.localeCompare(`${b.ruleId}:${b.file}:${b.title}`));
  const baseline = options.baseline === false ? null : loadBaseline(repo, options.baseline);
  const comparison = classifyAgainstBaseline(findings, baseline), reportFindings = comparison.findings;
  const counts = Object.fromEntries(["PASS", "FAIL", "WARN", "NEEDS_REVIEW", "UNKNOWN", "SKIPPED"].map((s) => [s, reportFindings.filter((f) => f.status === s).length]));
  return { toolVersion: TOOL_VERSION, evidenceVersion: EVIDENCE_VERSION, target: "Shopify App Store / production readiness", root: repo, configurations: parsedConfigs.map((config) => config.file), summary: { ...counts, findingCount: reportFindings.length, newFindingCount: reportFindings.filter((f) => f.lifecycle === "NEW").length, resolvedFindingCount: comparison.resolvedFindings.length }, findings: reportFindings, resolvedFindings: comparison.resolvedFindings, baseline: { enabled: comparison.enabled, file: baseline?.file ?? null }, manualChecks: reportFindings.filter((f) => f.status === "NEEDS_REVIEW").map((f) => f.ruleId), skipped };
}
function hasLatestAppBridgeScript(files) {
  return files.some((file) => {
    if (!/\.(?:html?|[jt]sx)$/i.test(file.file)) return false;
    const pattern = /<script\b[^>]*\bsrc\s*=\s*(["'])https:\/\/cdn\.shopify\.com\/shopifycloud\/app-bridge\.js\1[^>]*>/gi;
    for (const match of file.text.matchAll(pattern)) {
      if (!insideComment(file.text, match.index)) return true;
    }
    return false;
  });
}
function insideComment(source2, index) {
  if (source2.lastIndexOf("<!--", index) > source2.lastIndexOf("-->", index)) return true;
  if (source2.lastIndexOf("/*", index) > source2.lastIndexOf("*/", index)) return true;
  const lineStart = source2.lastIndexOf("\n", index - 1) + 1;
  const prefix = source2.slice(lineStart, index);
  const marker = prefix.lastIndexOf("//");
  if (marker < 0) return false;
  const before = prefix.slice(0, marker);
  return before.trim() === "" || /[;{}]\s*$/.test(before);
}

// src/output.js
var rank = { low: 1, medium: 2, high: 3 };
function validateOptions(format = "human", threshold = "high") {
  if (!["human", "markdown", "json", "sarif"].includes(format)) throw new Error("format must be human, markdown, json, or sarif");
  if (!["none", "low", "medium", "high"].includes(threshold)) throw new Error("fail-on must be none, low, medium, or high");
}
function shouldFail(report, threshold = "high", strict = false) {
  validateOptions("human", threshold);
  if (threshold === "none") return false;
  const min = rank[threshold];
  return report.findings.some((f) => (!report.baseline?.enabled || f.lifecycle === "NEW") && (f.status === "FAIL" || f.status === "WARN" || strict && f.status === "NEEDS_REVIEW") && (rank[f.severity] || 3) >= min);
}
function human(report) {
  const s = report.summary;
  let out = `Shopify App Review Guard

Target: ${report.target}

PASS ${String(s.PASS).padStart(3)}  WARN ${String(s.WARN).padStart(3)}  FAIL ${String(s.FAIL).padStart(3)}  REVIEW ${String(s.NEEDS_REVIEW).padStart(3)}  UNKNOWN ${String(s.UNKNOWN).padStart(3)}
`;
  if (report.baseline?.enabled) out += `NEW ${s.newFindingCount}  RESOLVED ${s.resolvedFindingCount}
`;
  for (const f of report.findings) {
    out += `
${f.status}${f.lifecycle === "NEW" || f.lifecycle === "EXISTING" ? ` (${f.lifecycle})` : ""}  ${f.ruleId}
${f.title}
  ${f.rationale}
  File: ${f.file}${f.line ? `:${f.line}` : ""}
  Fix: ${f.remediation}
  Evidence: ${f.evidence ?? "Not applicable"}
`;
  }
  if (report.resolvedFindings?.length) out += `
Resolved findings: ${report.resolvedFindings.length}
`;
  if (s.NEEDS_REVIEW) out += `
Static analysis found ${s.NEEDS_REVIEW} item(s) requiring manual verification. This report does not guarantee Shopify App Store approval.
`;
  return out;
}
function md(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/[\r\n]+/g, " ");
}
function markdown(report) {
  const s = report.summary;
  let out = `# Shopify App Store readiness review

This report records offline repository evidence. It does not predict or guarantee Shopify approval.

## Summary

| Status | Count |
| --- | ---: |
${["PASS", "FAIL", "WARN", "NEEDS_REVIEW", "UNKNOWN", "SKIPPED"].map((status) => `| ${status.replaceAll("_", " ")} | ${s[status]} |`).join("\n")}
`;
  if (report.baseline?.enabled) out += `
New findings: ${s.newFindingCount}. Resolved findings: ${s.resolvedFindingCount}. Existing findings remain visible and do not affect the configured new-finding policy.
`;
  out += `
## Configurations

${report.configurations.length ? report.configurations.map((file) => `- \`${md(file).replaceAll("`", "\\`")}\``).join("\n") : "- No Shopify app configuration was found."}

## Static findings
`;
  if (!report.findings.length) out += "\nNo findings were emitted by the supported static checks. This does not cover runtime or Partner Dashboard requirements.\n";
  for (const f of report.findings) out += `
### ${md(f.status)} \u2014 ${md(f.ruleId)}${f.lifecycle === "NEW" || f.lifecycle === "EXISTING" ? ` (${f.lifecycle})` : ""}

${md(f.title)}

${md(f.rationale)}

- File: \`${md(f.file).replaceAll("`", "\\`")}${f.line ? `:${f.line}` : ""}\`
- Review action: ${md(f.remediation)}
- Evidence: ${f.evidence ? `[official reference](${f.evidence})` : "Not applicable"}
`;
  out += "\n## Submission checklist\n\n- [ ] Verify every `NEEDS_REVIEW` item in the deployed app and Partner Dashboard.\n- [ ] Confirm listing details, protected customer data status, and runtime behaviour with the app owner.\n- [ ] Re-run the checks after changing the selected configuration or app root.\n";
  for (const f of report.findings.filter((item) => item.status === "NEEDS_REVIEW")) out += `- [ ] ${md(f.ruleId)}: ${md(f.title)}
`;
  if (report.resolvedFindings?.length) out += `
## Resolved since baseline

${report.resolvedFindings.map((f) => `- ${md(f.ruleId)} in \`${md(f.file)}\`: ${md(f.title)}`).join("\n")}
`;
  if (report.skipped.length) out += `
## Skipped files

${report.skipped.map((item) => `- \`${md(item.file)}\`: ${md(item.reason)}`).join("\n")}
`;
  return out;
}
function sarif(report) {
  return { version: "2.1.0", $schema: "https://json.schemastore.org/sarif-2.1.0.json", runs: [{ tool: { driver: { name: "Shopify App Review Guard", version: report.toolVersion, informationUri: "https://github.com/RexCode-Digital/shopify-app-review-guard", rules: [...new Map(report.findings.map((f) => [f.ruleId, { id: f.ruleId, name: f.title, helpUri: f.evidence }])).values()] } }, results: report.findings.map((f) => ({ ruleId: f.ruleId, level: f.status === "FAIL" ? "error" : f.status === "WARN" ? "warning" : "note", message: { text: `${f.title} ${f.rationale}` }, properties: { status: f.status, lifecycle: f.lifecycle, confidence: f.confidence, evidenceVersion: f.evidenceVersion }, locations: [{ physicalLocation: { artifactLocation: { uri: f.file.split("/").map(encodeURIComponent).join("/") }, ...f.line ? { region: { startLine: f.line } } : {} } }] })) }] };
}

// src/action.js
import fs4 from "node:fs";
import { randomUUID } from "node:crypto";
var input = (name) => process.env[`INPUT_${name.toUpperCase().replaceAll("-", "_")}`];
try {
  const format = input("format") || "human", threshold = input("fail-on") || "high";
  validateOptions(format, threshold);
  for (const name of ["strict", "show-unmapped"]) if (input(name) && !["true", "false"].includes(input(name))) throw new Error(`${name} must be true or false`);
  const report = analyze(input("path") || ".", { config: input("config") || void 0, baseline: input("baseline") || void 0, showUnmapped: input("show-unmapped") === "true" });
  const output = format === "json" ? JSON.stringify(report, null, 2) : format === "sarif" ? JSON.stringify(sarif(report), null, 2) : format === "markdown" ? markdown(report) : human(report);
  const stop = randomUUID();
  console.log(`::stop-commands::${stop}
${output}
::${stop}::`);
  const failed = shouldFail(report, threshold, input("strict") === "true");
  const set = (key, value) => {
    if (process.env.GITHUB_OUTPUT) {
      const delimiter = randomUUID();
      fs4.appendFileSync(process.env.GITHUB_OUTPUT, `${key}<<${delimiter}
${value}
${delimiter}
`);
    }
  };
  const s = report.summary;
  for (const [key, value] of Object.entries({ outcome: failed ? "failure" : "success", "finding-count": s.findingCount, "new-finding-count": s.newFindingCount, "resolved-finding-count": s.resolvedFindingCount, "fail-count": s.FAIL, "warning-count": s.WARN, "review-count": s.NEEDS_REVIEW, "unknown-count": s.UNKNOWN, "rule-ids": [...new Set(report.findings.map((f) => f.ruleId))].join(","), report: output })) set(key, value);
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error(`App Review Guard scanner error: ${String(error.message).replace(/[\r\n]/g, " ")}`);
  process.exitCode = 2;
}
