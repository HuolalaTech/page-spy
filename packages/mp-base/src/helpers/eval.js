'use strict';
class e extends Error {}
class t extends SyntaxError {}
class r extends ReferenceError {}
class n extends TypeError {}
class a extends e {}
class s extends t {}
class o extends r {}
const i = {
  UnknownError: [3001, '%0', a],
  ExecutionTimeOutError: [3002, 'Script execution timed out after %0ms', a],
  NodeTypeSyntaxError: [1001, 'Unknown node type: %0', o],
  BinaryOperatorSyntaxError: [1002, 'Unknown binary operator: %0', o],
  LogicalOperatorSyntaxError: [1003, 'Unknown logical operator: %0', o],
  UnaryOperatorSyntaxError: [1004, 'Unknown unary operator: %0', o],
  UpdateOperatorSyntaxError: [1005, 'Unknown update operator: %0', o],
  ObjectStructureSyntaxError: [1006, 'Unknown object structure: %0', o],
  AssignmentExpressionSyntaxError: [
    1007,
    'Unknown assignment expression: %0',
    o,
  ],
  VariableTypeSyntaxError: [1008, 'Unknown variable type: %0', o],
  ParamTypeSyntaxError: [1009, 'Unknown param type: %0', o],
  AssignmentTypeSyntaxError: [1010, 'Unknown assignment type: %0', o],
  FunctionUndefinedReferenceError: [2001, '%0 is not a function', r],
  VariableUndefinedReferenceError: [2002, '%0 is not defined', r],
  IsNotConstructor: [2003, '%0 is not a constructor', n],
};
function c(e, t) {
  Object.defineProperty(e, 'name', {
    value: t,
    writable: !1,
    enumerable: !1,
    configurable: !0,
  });
}
const l = Object.prototype.hasOwnProperty,
  u = Symbol('Break'),
  h = Symbol('Continue'),
  p = Symbol('DefaultCase'),
  d = Symbol('EmptyStatementReturn'),
  m = Symbol('WithScopeName'),
  f = Symbol('SuperScopeName'),
  b = Symbol('RootScopeName'),
  S = Symbol('GlobalScopeName');
function y(e) {
  return 'function' == typeof e;
}
class g {
  constructor(e) {
    this.value = e;
  }
}
class x {
  constructor(e) {
    this.value = e;
  }
}
class E {
  constructor(e) {
    this.value = e;
  }
}
class C {
  constructor(e) {
    let t =
        arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : null,
      r = arguments.length > 2 ? arguments[2] : void 0;
    (this.name = r), (this.parent = t), (this.data = e), (this.labelStack = []);
  }
}
function w() {}
const k = {
  NaN: NaN,
  Infinity: 1 / 0,
  undefined: void 0,
  Object: Object,
  Array: Array,
  String: String,
  Boolean: Boolean,
  Number: Number,
  Date: Date,
  RegExp: RegExp,
  Error: Error,
  URIError: URIError,
  TypeError: TypeError,
  RangeError: RangeError,
  SyntaxError: SyntaxError,
  ReferenceError: ReferenceError,
  Math: Math,
  parseInt: parseInt,
  parseFloat: parseFloat,
  isNaN: isNaN,
  isFinite: isFinite,
  decodeURI: decodeURI,
  decodeURIComponent: decodeURIComponent,
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  escape: escape,
  unescape: unescape,
};
'undefined' != typeof JSON && (k.JSON = JSON),
  'undefined' != typeof Promise && (k.Promise = Promise),
  'undefined' != typeof Set && (k.Set = Set),
  'undefined' != typeof Map && (k.Map = Map),
  'undefined' != typeof Symbol && (k.Symbol = Symbol),
  'undefined' != typeof Proxy && (k.Proxy = Proxy),
  'undefined' != typeof WeakMap && (k.WeakMap = WeakMap),
  'undefined' != typeof WeakSet && (k.WeakSet = WeakSet),
  'undefined' != typeof Reflect && (k.Reflect = Reflect);
class H {
  constructor() {
    let e =
        arguments.length > 0 && void 0 !== arguments[0]
          ? arguments[0]
          : H.global,
      t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    (this.sourceList = []),
      (this.collectDeclVars = Object.create(null)),
      (this.collectDeclFuncs = Object.create(null)),
      (this.isVarDeclMode = !1),
      (this.lastExecNode = null),
      (this.isRunning = !1),
      (this.options = {
        ecmaVersion: t.ecmaVersion || H.ecmaVersion,
        timeout: t.timeout || 0,
        rootContext: t.rootContext,
        globalContextInFunction:
          void 0 === t.globalContextInFunction
            ? H.globalContextInFunction
            : t.globalContextInFunction,
        _initEnv: t._initEnv,
      }),
      (this.context = e || Object.create(null)),
      (this.callStack = []),
      this.initEnvironment(this.context);
  }
  initEnvironment(e) {
    let t;
    if (e instanceof C) t = e;
    else {
      let n = null;
      const a = this.createSuperScope(e);
      this.options.rootContext &&
        (n = new C(((r = this.options.rootContext), Object.create(r)), a, b)),
        (t = new C(e, n || a, S));
    }
    var r;
    (this.globalScope = t),
      (this.currentScope = this.globalScope),
      (this.globalContext = t.data),
      (this.currentContext = t.data),
      (this.collectDeclVars = Object.create(null)),
      (this.collectDeclFuncs = Object.create(null)),
      (this.execStartTime = Date.now()),
      (this.execEndTime = this.execStartTime);
    const n = this.options._initEnv;
    n && n.call(this);
  }
  getExecStartTime() {
    return this.execStartTime;
  }
  getExecutionTime() {
    return this.execEndTime - this.execStartTime;
  }
  setExecTimeout() {
    let e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : 0;
    this.options.timeout = e;
  }
  getOptions() {
    return this.options;
  }
  getGlobalScope() {
    return this.globalScope;
  }
  getCurrentScope() {
    return this.currentScope;
  }
  getCurrentContext() {
    return this.currentContext;
  }
  isInterruptThrow(e) {
    return e instanceof a || e instanceof o || e instanceof s;
  }
  createSuperScope(e) {
    let t = { ...k };
    return (
      Object.keys(t).forEach((r) => {
        r in e && delete t[r];
      }),
      new C(t, null, f)
    );
  }
  setCurrentContext(e) {
    this.currentContext = e;
  }
  setCurrentScope(e) {
    this.currentScope = e;
  }
  evaluate(e) {
    let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : '';
    if (e && t) return this.evaluateNode(e, t);
  }
  evaluateNode(e) {
    let t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : '';
    (this.value = void 0),
      (this.source = t),
      this.sourceList.push(t),
      (this.isRunning = !0),
      (this.execStartTime = Date.now()),
      (this.execEndTime = this.execStartTime),
      (this.collectDeclVars = Object.create(null)),
      (this.collectDeclFuncs = Object.create(null));
    const r = this.getCurrentScope(),
      n = this.getCurrentContext(),
      a = r.labelStack.concat([]),
      s = this.callStack.concat([]),
      o = () => {
        this.setCurrentScope(r),
          this.setCurrentContext(n),
          (r.labelStack = a),
          (this.callStack = s);
      };
    try {
      const t = this.createClosure(e);
      this.addDeclarationsToScope(
        this.collectDeclVars,
        this.collectDeclFuncs,
        this.getCurrentScope(),
      ),
        t();
    } catch (e) {
      throw e;
    } finally {
      o(), (this.execEndTime = Date.now());
    }
    return (this.isRunning = !1), this.getValue();
  }
  createErrorMessage(e, t, r) {
    let n = e[1].replace('%0', String(t));
    return null !== r && (n += this.getNodePosition(r || this.lastExecNode)), n;
  }
  createError(e, t) {
    return new t(e);
  }
  createThrowError(e, t) {
    return this.createError(e, t);
  }
  createInternalThrowError(e, t, r) {
    return this.createError(this.createErrorMessage(e, t, r), e[2]);
  }
  checkTimeout() {
    if (!this.isRunning) return !1;
    const e = this.options.timeout || 0;
    return Date.now() - this.execStartTime > e;
  }
  getNodePosition(e) {
    if (e) {
      const t = '';
      return e.loc
        ? ' ['
            .concat(e.loc.start.line, ':')
            .concat(e.loc.start.column, ']')
            .concat(t)
        : '';
    }
    return '';
  }
  createClosure(e) {
    var t = this;
    let r;
    switch (e.type) {
      case 'BinaryExpression':
        r = this.binaryExpressionHandler(e);
        break;
      case 'LogicalExpression':
        r = this.logicalExpressionHandler(e);
        break;
      case 'UnaryExpression':
        r = this.unaryExpressionHandler(e);
        break;
      case 'UpdateExpression':
        r = this.updateExpressionHandler(e);
        break;
      case 'ObjectExpression':
        r = this.objectExpressionHandler(e);
        break;
      case 'ArrayExpression':
        r = this.arrayExpressionHandler(e);
        break;
      case 'CallExpression':
        r = this.callExpressionHandler(e);
        break;
      case 'NewExpression':
        r = this.newExpressionHandler(e);
        break;
      case 'MemberExpression':
        r = this.memberExpressionHandler(e);
        break;
      case 'ThisExpression':
        r = this.thisExpressionHandler(e);
        break;
      case 'SequenceExpression':
        r = this.sequenceExpressionHandler(e);
        break;
      case 'Literal':
        r = this.literalHandler(e);
        break;
      case 'Identifier':
        r = this.identifierHandler(e);
        break;
      case 'AssignmentExpression':
        r = this.assignmentExpressionHandler(e);
        break;
      case 'FunctionDeclaration':
        r = this.functionDeclarationHandler(e);
        break;
      case 'VariableDeclaration':
        r = this.variableDeclarationHandler(e);
        break;
      case 'BlockStatement':
      case 'Program':
        r = this.programHandler(e);
        break;
      case 'ExpressionStatement':
        r = this.expressionStatementHandler(e);
        break;
      case 'EmptyStatement':
        r = this.emptyStatementHandler(e);
        break;
      case 'ReturnStatement':
        r = this.returnStatementHandler(e);
        break;
      case 'FunctionExpression':
        r = this.functionExpressionHandler(e);
        break;
      case 'IfStatement':
        r = this.ifStatementHandler(e);
        break;
      case 'ConditionalExpression':
        r = this.conditionalExpressionHandler(e);
        break;
      case 'ForStatement':
        r = this.forStatementHandler(e);
        break;
      case 'WhileStatement':
        r = this.whileStatementHandler(e);
        break;
      case 'DoWhileStatement':
        r = this.doWhileStatementHandler(e);
        break;
      case 'ForInStatement':
        r = this.forInStatementHandler(e);
        break;
      case 'WithStatement':
        r = this.withStatementHandler(e);
        break;
      case 'ThrowStatement':
        r = this.throwStatementHandler(e);
        break;
      case 'TryStatement':
        r = this.tryStatementHandler(e);
        break;
      case 'ContinueStatement':
        r = this.continueStatementHandler(e);
        break;
      case 'BreakStatement':
        r = this.breakStatementHandler(e);
        break;
      case 'SwitchStatement':
        r = this.switchStatementHandler(e);
        break;
      case 'LabeledStatement':
        r = this.labeledStatementHandler(e);
        break;
      case 'DebuggerStatement':
        r = this.debuggerStatementHandler(e);
        break;
      default:
        throw this.createInternalThrowError(i.NodeTypeSyntaxError, e.type, e);
    }
    return function () {
      const n = t.options.timeout;
      if (n && n > 0 && t.checkTimeout())
        throw t.createInternalThrowError(i.ExecutionTimeOutError, n, null);
      return (t.lastExecNode = e), r(...arguments);
    };
  }
  binaryExpressionHandler(e) {
    const t = this.createClosure(e.left),
      r = this.createClosure(e.right);
    return () => {
      const n = t(),
        a = r();
      switch (e.operator) {
        case '==':
          return n == a;
        case '!=':
          return n != a;
        case '===':
          return n === a;
        case '!==':
          return n !== a;
        case '<':
          return n < a;
        case '<=':
          return n <= a;
        case '>':
          return n > a;
        case '>=':
          return n >= a;
        case '<<':
          return n << a;
        case '>>':
          return n >> a;
        case '>>>':
          return n >>> a;
        case '+':
          return n + a;
        case '-':
          return n - a;
        case '*':
          return n * a;
        case '**':
          return Math.pow(n, a);
        case '/':
          return n / a;
        case '%':
          return n % a;
        case '|':
          return n | a;
        case '^':
          return n ^ a;
        case '&':
          return n & a;
        case 'in':
          return n in a;
        case 'instanceof':
          return n instanceof a;
        default:
          throw this.createInternalThrowError(
            i.BinaryOperatorSyntaxError,
            e.operator,
            e,
          );
      }
    };
  }
  logicalExpressionHandler(e) {
    const t = this.createClosure(e.left),
      r = this.createClosure(e.right);
    return () => {
      switch (e.operator) {
        case '||':
          return t() || r();
        case '&&':
          return t() && r();
        default:
          throw this.createInternalThrowError(
            i.LogicalOperatorSyntaxError,
            e.operator,
            e,
          );
      }
    };
  }
  unaryExpressionHandler(e) {
    if ('delete' === e.operator) {
      const t = this.createObjectGetter(e.argument),
        r = this.createNameGetter(e.argument);
      return () => delete t()[r()];
    }
    {
      let t;
      if ('typeof' === e.operator && 'Identifier' === e.argument.type) {
        const r = this.createObjectGetter(e.argument),
          n = this.createNameGetter(e.argument);
        t = () => r()[n()];
      } else t = this.createClosure(e.argument);
      return () => {
        const r = t();
        switch (e.operator) {
          case '-':
            return -r;
          case '+':
            return +r;
          case '!':
            return !r;
          case '~':
            return ~r;
          case 'void':
            return;
          case 'typeof':
            return typeof r;
          default:
            throw this.createInternalThrowError(
              i.UnaryOperatorSyntaxError,
              e.operator,
              e,
            );
        }
      };
    }
  }
  updateExpressionHandler(e) {
    const t = this.createObjectGetter(e.argument),
      r = this.createNameGetter(e.argument);
    return () => {
      const n = t(),
        a = r();
      switch ((this.assertVariable(n, a, e), e.operator)) {
        case '++':
          return e.prefix ? ++n[a] : n[a]++;
        case '--':
          return e.prefix ? --n[a] : n[a]--;
        default:
          throw this.createInternalThrowError(
            i.UpdateOperatorSyntaxError,
            e.operator,
            e,
          );
      }
    };
  }
  objectExpressionHandler(e) {
    const t = [];
    const r = Object.create(null);
    return (
      e.properties.forEach((e) => {
        const n = e.kind,
          a = (function (e) {
            return 'Identifier' === e.type
              ? e.name
              : 'Literal' === e.type
                ? e.value
                : this.throwError(i.ObjectStructureSyntaxError, e.type, e);
          })(e.key);
        (r[a] && 'init' !== n) || (r[a] = {}),
          (r[a][n] = this.createClosure(e.value)),
          t.push({ key: a, property: e });
      }),
      () => {
        const e = {},
          n = t.length;
        for (let a = 0; a < n; a++) {
          const n = t[a],
            s = n.key,
            o = r[s],
            i = o.init ? o.init() : void 0,
            l = o.get ? o.get() : function () {},
            u = o.set ? o.set() : function (e) {};
          if ('set' in o || 'get' in o) {
            const t = { configurable: !0, enumerable: !0, get: l, set: u };
            Object.defineProperty(e, s, t);
          } else {
            const t = n.property,
              r = t.kind;
            'Identifier' !== t.key.type ||
              'FunctionExpression' !== t.value.type ||
              'init' !== r ||
              t.value.id ||
              c(i, t.key.name),
              (e[s] = i);
          }
        }
        return e;
      }
    );
  }
  arrayExpressionHandler(e) {
    const t = e.elements.map((e) => (e ? this.createClosure(e) : e));
    return () => {
      const e = t.length,
        r = Array(e);
      for (let n = 0; n < e; n++) {
        const e = t[n];
        e && (r[n] = e());
      }
      return r;
    };
  }
  safeObjectGet(e, t, r) {
    return e[t];
  }
  createCallFunctionGetter(e) {
    if ('MemberExpression' === e.type) {
      const t = this.createClosure(e.object),
        r = this.createMemberKeyGetter(e),
        n = this.source;
      return () => {
        const a = t(),
          s = r(),
          o = this.safeObjectGet(a, s, e);
        if (!o || !y(o)) {
          const t = n.slice(e.start, e.end);
          throw this.createInternalThrowError(
            i.FunctionUndefinedReferenceError,
            t,
            e,
          );
        }
        return o.bind(a);
      };
    }
    {
      const t = this.createClosure(e);
      return () => {
        let r = '';
        'Identifier' === e.type && (r = e.name);
        const n = t();
        if (!n || !y(n))
          throw this.createInternalThrowError(
            i.FunctionUndefinedReferenceError,
            r,
            e,
          );
        let a = this.options.globalContextInFunction;
        if ('Identifier' === e.type) {
          const t = this.getIdentifierScope(e);
          t.name === m && (a = t.data);
        }
        return n.bind(a);
      };
    }
  }
  callExpressionHandler(e) {
    const t = this.createCallFunctionGetter(e.callee),
      r = e.arguments.map((e) => this.createClosure(e));
    return () => t()(...r.map((e) => e()));
  }
  functionExpressionHandler(e) {
    const t = this,
      r = this.source,
      n = this.collectDeclVars,
      a = this.collectDeclFuncs;
    (this.collectDeclVars = Object.create(null)),
      (this.collectDeclFuncs = Object.create(null));
    const s = e.id ? e.id.name : '',
      o = e.params.length,
      i = e.params.map((e) => this.createParamNameGetter(e)),
      l = this.createClosure(e.body),
      u = this.collectDeclVars,
      h = this.collectDeclFuncs;
    return (
      (this.collectDeclVars = n),
      (this.collectDeclFuncs = a),
      () => {
        const n = t.getCurrentScope(),
          a = function () {
            for (var e = arguments.length, r = new Array(e), o = 0; o < e; o++)
              r[o] = arguments[o];
            t.callStack.push(''.concat(s));
            const c = t.getCurrentScope(),
              p = (function () {
                let e =
                    arguments.length > 0 && void 0 !== arguments[0]
                      ? arguments[0]
                      : null,
                  t = arguments.length > 1 ? arguments[1] : void 0;
                return new C(Object.create(null), e, t);
              })(n, 'FunctionScope('.concat(s, ')'));
            t.setCurrentScope(p),
              t.addDeclarationsToScope(u, h, p),
              s && (p.data[s] = a),
              (p.data.arguments = arguments),
              i.forEach((e, t) => {
                p.data[e()] = r[t];
              });
            const d = t.getCurrentContext();
            t.setCurrentContext(this);
            const m = l();
            if (
              (t.setCurrentContext(d),
              t.setCurrentScope(c),
              t.callStack.pop(),
              m instanceof g)
            )
              return m.value;
          };
        return (
          c(a, s),
          Object.defineProperty(a, 'length', {
            value: o,
            writable: !1,
            enumerable: !1,
            configurable: !0,
          }),
          Object.defineProperty(a, 'toString', {
            value: () => r.slice(e.start, e.end),
            writable: !0,
            configurable: !0,
            enumerable: !1,
          }),
          Object.defineProperty(a, 'valueOf', {
            value: () => r.slice(e.start, e.end),
            writable: !0,
            configurable: !0,
            enumerable: !1,
          }),
          a
        );
      }
    );
  }
  newExpressionHandler(e) {
    const t = this.source,
      r = this.createClosure(e.callee),
      n = e.arguments.map((e) => this.createClosure(e));
    return () => {
      const a = r();
      if (!y(a) || a.__IS_EVAL_FUNC) {
        const r = e.callee,
          n = t.slice(r.start, r.end);
        throw this.createInternalThrowError(i.IsNotConstructor, n, e);
      }
      return new a(...n.map((e) => e()));
    };
  }
  memberExpressionHandler(e) {
    const t = this.createClosure(e.object),
      r = this.createMemberKeyGetter(e);
    return () => t()[r()];
  }
  thisExpressionHandler(e) {
    return () => this.getCurrentContext();
  }
  sequenceExpressionHandler(e) {
    const t = e.expressions.map((e) => this.createClosure(e));
    return () => {
      let e;
      const r = t.length;
      for (let n = 0; n < r; n++) {
        e = (0, t[n])();
      }
      return e;
    };
  }
  literalHandler(e) {
    return () =>
      e.regex ? new RegExp(e.regex.pattern, e.regex.flags) : e.value;
  }
  identifierHandler(e) {
    return () => {
      const t = this.getCurrentScope(),
        r = this.getScopeDataFromName(e.name, t);
      return this.assertVariable(r, e.name, e), r[e.name];
    };
  }
  getIdentifierScope(e) {
    const t = this.getCurrentScope();
    return this.getScopeFromName(e.name, t);
  }
  assignmentExpressionHandler(e) {
    'Identifier' !== e.left.type ||
      'FunctionExpression' !== e.right.type ||
      e.right.id ||
      (e.right.id = { type: 'Identifier', name: e.left.name });
    const t = this.createObjectGetter(e.left),
      r = this.createNameGetter(e.left),
      n = this.createClosure(e.right);
    return () => {
      const a = t(),
        s = r(),
        o = n();
      switch (
        ('=' !== e.operator && this.assertVariable(a, s, e), e.operator)
      ) {
        case '=':
          return (a[s] = o);
        case '+=':
          return (a[s] += o);
        case '-=':
          return (a[s] -= o);
        case '*=':
          return (a[s] *= o);
        case '**=':
          return (a[s] = Math.pow(a[s], o));
        case '/=':
          return (a[s] /= o);
        case '%=':
          return (a[s] %= o);
        case '<<=':
          return (a[s] <<= o);
        case '>>=':
          return (a[s] >>= o);
        case '>>>=':
          return (a[s] >>>= o);
        case '&=':
          return (a[s] &= o);
        case '^=':
          return (a[s] ^= o);
        case '|=':
          return (a[s] |= o);
        default:
          throw this.createInternalThrowError(
            i.AssignmentExpressionSyntaxError,
            e.type,
            e,
          );
      }
    };
  }
  functionDeclarationHandler(e) {
    if (e.id) {
      const t = this.functionExpressionHandler(e);
      Object.defineProperty(t, 'isFunctionDeclareClosure', {
        value: !0,
        writable: !1,
        configurable: !1,
        enumerable: !1,
      }),
        this.funcDeclaration(e.id.name, t);
    }
    return () => d;
  }
  getVariableName(e) {
    if ('Identifier' === e.type) return e.name;
    throw this.createInternalThrowError(i.VariableTypeSyntaxError, e.type, e);
  }
  variableDeclarationHandler(e) {
    let t;
    const r = [];
    for (let t = 0; t < e.declarations.length; t++) {
      const n = e.declarations[t];
      this.varDeclaration(this.getVariableName(n.id)),
        n.init &&
          r.push({
            type: 'AssignmentExpression',
            operator: '=',
            left: n.id,
            right: n.init,
          });
    }
    return (
      r.length && (t = this.createClosure({ type: 'BlockStatement', body: r })),
      () => {
        if (t) {
          const e = this.isVarDeclMode;
          (this.isVarDeclMode = !0), t(), (this.isVarDeclMode = e);
        }
        return d;
      }
    );
  }
  assertVariable(e, t, r) {
    if (e === this.globalScope.data && !(t in e))
      throw this.createInternalThrowError(
        i.VariableUndefinedReferenceError,
        t,
        r,
      );
  }
  programHandler(e) {
    const t = e.body.map((e) => this.createClosure(e));
    return () => {
      let e = d;
      for (let r = 0; r < t.length; r++) {
        const n = t[r],
          a = this.setValue(n());
        if (
          a !== d &&
          ((e = a),
          e instanceof g ||
            e instanceof x ||
            e instanceof E ||
            e === u ||
            e === h)
        )
          break;
      }
      return e;
    };
  }
  expressionStatementHandler(e) {
    return this.createClosure(e.expression);
  }
  emptyStatementHandler(e) {
    return () => d;
  }
  returnStatementHandler(e) {
    const t = e.argument ? this.createClosure(e.argument) : w;
    return () => new g(t());
  }
  ifStatementHandler(e) {
    const t = this.createClosure(e.test),
      r = this.createClosure(e.consequent),
      n = e.alternate
        ? this.createClosure(e.alternate)
        : /*!important*/ () => d;
    return () => (t() ? r() : n());
  }
  conditionalExpressionHandler(e) {
    return this.ifStatementHandler(e);
  }
  forStatementHandler(e) {
    let t = w,
      r = e.test ? this.createClosure(e.test) : () => !0,
      n = w;
    const a = this.createClosure(e.body);
    return (
      'ForStatement' === e.type &&
        ((t = e.init ? this.createClosure(e.init) : t),
        (n = e.update ? this.createClosure(e.update) : w)),
      (s) => {
        let o,
          i = d,
          c = 'DoWhileStatement' === e.type;
        for (
          s && 'LabeledStatement' === s.type && (o = s.label.name), t();
          c || r();
          n()
        ) {
          c = !1;
          const e = this.setValue(a());
          if (e !== d && e !== h) {
            if (e === u) break;
            if (((i = e), i instanceof E && i.value === o)) i = d;
            else if (i instanceof g || i instanceof x || i instanceof E) break;
          }
        }
        return i;
      }
    );
  }
  whileStatementHandler(e) {
    return this.forStatementHandler(e);
  }
  doWhileStatementHandler(e) {
    return this.forStatementHandler(e);
  }
  forInStatementHandler(e) {
    let t = e.left;
    const r = this.createClosure(e.right),
      n = this.createClosure(e.body);
    return (
      'VariableDeclaration' === e.left.type &&
        (this.createClosure(e.left)(), (t = e.left.declarations[0].id)),
      (e) => {
        let a,
          s,
          o = d;
        e && 'LabeledStatement' === e.type && (a = e.label.name);
        const i = r();
        for (s in i) {
          this.assignmentExpressionHandler({
            type: 'AssignmentExpression',
            operator: '=',
            left: t,
            right: { type: 'Literal', value: s },
          })();
          const e = this.setValue(n());
          if (e !== d && e !== h) {
            if (e === u) break;
            if (((o = e), o instanceof E && o.value === a)) o = d;
            else if (o instanceof g || o instanceof x || o instanceof E) break;
          }
        }
        return o;
      }
    );
  }
  withStatementHandler(e) {
    const t = this.createClosure(e.object),
      r = this.createClosure(e.body);
    return () => {
      const e = t(),
        n = this.getCurrentScope(),
        a = new C(e, n, m);
      this.setCurrentScope(a);
      const s = this.setValue(r());
      return this.setCurrentScope(n), s;
    };
  }
  throwStatementHandler(e) {
    const t = this.createClosure(e.argument);
    return () => {
      throw (this.setValue(void 0), t());
    };
  }
  tryStatementHandler(e) {
    const t = this.createClosure(e.block),
      r = e.handler ? this.catchClauseHandler(e.handler) : null,
      n = e.finalizer ? this.createClosure(e.finalizer) : null;
    return () => {
      const e = this.getCurrentScope(),
        a = this.getCurrentContext(),
        s = e.labelStack.concat([]),
        o = this.callStack.concat([]);
      let i,
        c,
        l = d;
      const u = () => {
        this.setCurrentScope(e),
          this.setCurrentContext(a),
          (e.labelStack = s),
          (this.callStack = o);
      };
      try {
        (l = this.setValue(t())), l instanceof g && (i = l);
      } catch (e) {
        if ((u(), this.isInterruptThrow(e))) throw e;
        if (r)
          try {
            (l = this.setValue(r(e))), l instanceof g && (i = l);
          } catch (e) {
            if ((u(), this.isInterruptThrow(e))) throw e;
            c = e;
          }
      }
      if (n)
        try {
          (l = n()), l instanceof g && (i = l);
        } catch (e) {
          if ((u(), this.isInterruptThrow(e))) throw e;
          c = e;
        }
      if (c) throw c;
      return i || l;
    };
  }
  catchClauseHandler(e) {
    const t = this.createParamNameGetter(e.param),
      r = this.createClosure(e.body);
    return (e) => {
      let n;
      const a = this.getCurrentScope().data,
        s = t(),
        o = l.call(a, s),
        i = a[s];
      return (a[s] = e), (n = r()), o ? (a[s] = i) : delete a[s], n;
    };
  }
  continueStatementHandler(e) {
    return () => (e.label ? new E(e.label.name) : h);
  }
  breakStatementHandler(e) {
    return () => (e.label ? new x(e.label.name) : u);
  }
  switchStatementHandler(e) {
    const t = this.createClosure(e.discriminant),
      r = e.cases.map((e) => this.switchCaseHandler(e));
    return () => {
      const e = t();
      let n,
        a,
        s,
        o = !1;
      for (let t = 0; t < r.length; t++) {
        const i = r[t](),
          c = i.testClosure();
        if (c !== p) {
          if (o || c === e) {
            if (((o = !0), (a = this.setValue(i.bodyClosure())), a === d))
              continue;
            if (a === u) break;
            if (
              ((n = a),
              n instanceof g || n instanceof x || n instanceof E || n === h)
            )
              break;
          }
        } else s = i;
      }
      if (!o && s) {
        a = this.setValue(s.bodyClosure());
        a === d || a === u || (n = a);
      }
      return n;
    };
  }
  switchCaseHandler(e) {
    const t = e.test ? this.createClosure(e.test) : () => p,
      r = this.createClosure({ type: 'BlockStatement', body: e.consequent });
    return () => ({ testClosure: t, bodyClosure: r });
  }
  labeledStatementHandler(e) {
    const t = e.label.name,
      r = this.createClosure(e.body);
    return () => {
      let n;
      const a = this.getCurrentScope();
      return (
        a.labelStack.push(t),
        (n = r(e)),
        n instanceof x && n.value === t && (n = d),
        a.labelStack.pop(),
        n
      );
    };
  }
  debuggerStatementHandler(e) {
    return () => d;
  }
  createParamNameGetter(e) {
    if ('Identifier' === e.type) return () => e.name;
    throw this.createInternalThrowError(i.ParamTypeSyntaxError, e.type, e);
  }
  createObjectKeyGetter(e) {
    let t;
    return (
      (t = 'Identifier' === e.type ? () => e.name : this.createClosure(e)),
      function () {
        return t();
      }
    );
  }
  createMemberKeyGetter(e) {
    return e.computed
      ? this.createClosure(e.property)
      : this.createObjectKeyGetter(e.property);
  }
  createObjectGetter(e) {
    switch (e.type) {
      case 'Identifier':
        return () => this.getScopeDataFromName(e.name, this.getCurrentScope());
      case 'MemberExpression':
        return this.createClosure(e.object);
      default:
        throw this.createInternalThrowError(
          i.AssignmentTypeSyntaxError,
          e.type,
          e,
        );
    }
  }
  createNameGetter(e) {
    switch (e.type) {
      case 'Identifier':
        return () => e.name;
      case 'MemberExpression':
        return this.createMemberKeyGetter(e);
      default:
        throw this.createInternalThrowError(
          i.AssignmentTypeSyntaxError,
          e.type,
          e,
        );
    }
  }
  varDeclaration(e) {
    this.collectDeclVars[e] = void 0;
  }
  funcDeclaration(e, t) {
    this.collectDeclFuncs[e] = t;
  }
  addDeclarationsToScope(e, t, r) {
    const n = r.data;
    for (let e in t) {
      const r = t[e];
      n[e] = r ? r() : r;
    }
    for (let t in e) t in n || (n[t] = void 0);
  }
  getScopeValue(e, t) {
    return this.getScopeFromName(e, t).data[e];
  }
  getScopeDataFromName(e, t) {
    return this.getScopeFromName(e, t).data;
  }
  getScopeFromName(e, t) {
    let r = t;
    do {
      if (e in r.data) return r;
    } while ((r = r.parent));
    return this.globalScope;
  }
  setValue(e) {
    const t = this.callStack.length;
    return (
      this.isVarDeclMode ||
        t ||
        e === d ||
        e === u ||
        e === h ||
        e instanceof x ||
        e instanceof E ||
        (this.value = e instanceof g ? e.value : e),
      e
    );
  }
  getValue() {
    return this.value;
  }
}
(H.ecmaVersion = 5),
  (H.globalContextInFunction = void 0),
  (H.global = Object.create(null)),
  (exports.Interpreter = H);
//# sourceMappingURL=index.js.map
