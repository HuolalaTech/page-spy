/*! modernizr 3.13.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-apng-arrow-backgroundcliptext-beacon-blobconstructor-borderimage-clipboard-cookies-cors-cryptography-cssgrid_cssgridlegacy-cssmask-csspositionsticky-customelements-customevent-customproperties-datachannel-dataview-es6array-es6class-es6collections-es6math-es6number-es6object-es6string-es6symbol-es7array-es8object-eventsource-exiforientation-fetch-flexgap-focuswithin-generators-getusermedia-hsla-imgcrossorigin-indexeddb-intersectionobserver-lazyloading-localstorage-mutationobserver-passiveeventlisteners-peerconnection-promises-proxy-resizeobserver-restdestructuringarray_restdestructuringobject-restparameters-rgba-sandbox-scriptasync-scriptdefer-serviceworker-sessionstorage-shadowroot-sharedworkers-sizes-spreadarray-spreadobject-srcdoc-srcset-stringtemplate-textencoder_textdecoder-typedarrays-urlsearchparams-webanimations-webgl-webp-webworkers-xhr2-addtest !*/
!(function (scriptGlobalObject, window, document, undefined) {
  function is(e, r) {
    return typeof e === r;
  }
  function testRunner() {
    var e, r, t, n, o, i, s;
    for (var d in tests)
      if (tests.hasOwnProperty(d)) {
        if (
          ((e = []),
          (r = tests[d]),
          r.name &&
            (e.push(r.name.toLowerCase()),
            r.options && r.options.aliases && r.options.aliases.length))
        )
          for (t = 0; t < r.options.aliases.length; t++)
            e.push(r.options.aliases[t].toLowerCase());
        for (n = is(r.fn, 'function') ? r.fn() : r.fn, o = 0; o < e.length; o++)
          (i = e[o]),
            (s = i.split('.')),
            1 === s.length
              ? (Modernizr[s[0]] = n)
              : ((Modernizr[s[0]] &&
                  (!Modernizr[s[0]] || Modernizr[s[0]] instanceof Boolean)) ||
                  (Modernizr[s[0]] = new Boolean(Modernizr[s[0]])),
                (Modernizr[s[0]][s[1]] = n)),
            classes.push((n ? '' : 'no-') + s.join('-'));
      }
  }
  function setClasses(e) {
    var r = docElement.className,
      t = Modernizr._config.classPrefix || '';
    if ((isSVG && (r = r.baseVal), Modernizr._config.enableJSClass)) {
      var n = new RegExp('(^|\\s)' + t + 'no-js(\\s|$)');
      r = r.replace(n, '$1' + t + 'js$2');
    }
    Modernizr._config.enableClasses &&
      (e.length > 0 && (r += ' ' + t + e.join(' ' + t)),
      isSVG ? (docElement.className.baseVal = r) : (docElement.className = r));
  }
  function addTest(e, r) {
    if ('object' == typeof e)
      for (var t in e) hasOwnProp(e, t) && addTest(t, e[t]);
    else {
      e = e.toLowerCase();
      var n = e.split('.'),
        o = Modernizr[n[0]];
      if ((2 === n.length && (o = o[n[1]]), void 0 !== o)) return Modernizr;
      (r = 'function' == typeof r ? r() : r),
        1 === n.length
          ? (Modernizr[n[0]] = r)
          : (!Modernizr[n[0]] ||
              Modernizr[n[0]] instanceof Boolean ||
              (Modernizr[n[0]] = new Boolean(Modernizr[n[0]])),
            (Modernizr[n[0]][n[1]] = r)),
        setClasses([(r && !1 !== r ? '' : 'no-') + n.join('-')]),
        Modernizr._trigger(e, r);
    }
    return Modernizr;
  }
  function contains(e, r) {
    return !!~('' + e).indexOf(r);
  }
  function createElement() {
    return 'function' != typeof document.createElement
      ? document.createElement(arguments[0])
      : isSVG
        ? document.createElementNS.call(
            document,
            'http://www.w3.org/2000/svg',
            arguments[0],
          )
        : document.createElement.apply(document, arguments);
  }
  function getBody() {
    var e = document.body;
    return e || ((e = createElement(isSVG ? 'svg' : 'body')), (e.fake = !0)), e;
  }
  function injectElementWithStyles(e, r, t, n) {
    var o,
      i,
      s,
      d,
      a = 'modernizr',
      A = createElement('div'),
      c = getBody();
    if (parseInt(t, 10))
      for (; t--; )
        (s = createElement('div')),
          (s.id = n ? n[t] : a + (t + 1)),
          A.appendChild(s);
    return (
      (o = createElement('style')),
      (o.type = 'text/css'),
      (o.id = 's' + a),
      (c.fake ? c : A).appendChild(o),
      c.appendChild(A),
      o.styleSheet
        ? (o.styleSheet.cssText = e)
        : o.appendChild(document.createTextNode(e)),
      (A.id = a),
      c.fake &&
        ((c.style.background = ''),
        (c.style.overflow = 'hidden'),
        (d = docElement.style.overflow),
        (docElement.style.overflow = 'hidden'),
        docElement.appendChild(c)),
      (i = r(A, e)),
      c.fake && c.parentNode
        ? (c.parentNode.removeChild(c),
          (docElement.style.overflow = d),
          docElement.offsetHeight)
        : A.parentNode.removeChild(A),
      !!i
    );
  }
  function domToCSS(e) {
    return e
      .replace(/([A-Z])/g, function (e, r) {
        return '-' + r.toLowerCase();
      })
      .replace(/^ms-/, '-ms-');
  }
  function computedStyle(e, r, t) {
    var n;
    if ('getComputedStyle' in window) {
      n = getComputedStyle.call(window, e, r);
      var o = window.console;
      if (null !== n) t && (n = n.getPropertyValue(t));
      else if (o) {
        var i = o.error ? 'error' : 'log';
        o[i].call(
          o,
          'getComputedStyle returning null, its possible modernizr test results are inaccurate',
        );
      }
    } else n = !r && e.currentStyle && e.currentStyle[t];
    return n;
  }
  function nativeTestProps(e, r) {
    var t = e.length;
    if ('CSS' in window && 'supports' in window.CSS) {
      for (; t--; ) if (window.CSS.supports(domToCSS(e[t]), r)) return !0;
      return !1;
    }
    if ('CSSSupportsRule' in window) {
      for (var n = []; t--; ) n.push('(' + domToCSS(e[t]) + ':' + r + ')');
      return (
        (n = n.join(' or ')),
        injectElementWithStyles(
          '@supports (' + n + ') { #modernizr { position: absolute; } }',
          function (e) {
            return 'absolute' === computedStyle(e, null, 'position');
          },
        )
      );
    }
    return undefined;
  }
  function cssToDOM(e) {
    return e
      .replace(/([a-z])-([a-z])/g, function (e, r, t) {
        return r + t.toUpperCase();
      })
      .replace(/^-/, '');
  }
  function testProps(e, r, t, n) {
    function o() {
      s && (delete mStyle.style, delete mStyle.modElem);
    }
    if (((n = !is(n, 'undefined') && n), !is(t, 'undefined'))) {
      var i = nativeTestProps(e, t);
      if (!is(i, 'undefined')) return i;
    }
    for (
      var s, d, a, A, c, l = ['modernizr', 'tspan', 'samp'];
      !mStyle.style && l.length;

    )
      (s = !0),
        (mStyle.modElem = createElement(l.shift())),
        (mStyle.style = mStyle.modElem.style);
    for (a = e.length, d = 0; d < a; d++)
      if (
        ((A = e[d]),
        (c = mStyle.style[A]),
        contains(A, '-') && (A = cssToDOM(A)),
        mStyle.style[A] !== undefined)
      ) {
        if (n || is(t, 'undefined')) return o(), 'pfx' !== r || A;
        try {
          mStyle.style[A] = t;
        } catch (e) {}
        if (mStyle.style[A] !== c) return o(), 'pfx' !== r || A;
      }
    return o(), !1;
  }
  function fnBind(e, r) {
    return function () {
      return e.apply(r, arguments);
    };
  }
  function testDOMProps(e, r, t) {
    var n;
    for (var o in e)
      if (e[o] in r)
        return !1 === t
          ? e[o]
          : ((n = r[e[o]]), is(n, 'function') ? fnBind(n, t || r) : n);
    return !1;
  }
  function testPropsAll(e, r, t, n, o) {
    var i = e.charAt(0).toUpperCase() + e.slice(1),
      s = (e + ' ' + cssomPrefixes.join(i + ' ') + i).split(' ');
    return is(r, 'string') || is(r, 'undefined')
      ? testProps(s, r, n, o)
      : ((s = (e + ' ' + domPrefixes.join(i + ' ') + i).split(' ')),
        testDOMProps(s, r, t));
  }
  function detectDeleteDatabase(e, r) {
    var t = e.deleteDatabase(r);
    (t.onsuccess = function () {
      addTest('indexeddb.deletedatabase', !0);
    }),
      (t.onerror = function () {
        addTest('indexeddb.deletedatabase', !1);
      });
  }
  function testAllProps(e, r, t) {
    return testPropsAll(e, undefined, undefined, r, t);
  }
  var tests = [],
    ModernizrProto = {
      _version: '3.13.1',
      _config: {
        classPrefix: '',
        enableClasses: !0,
        enableJSClass: !0,
        usePrefixes: !0,
      },
      _q: [],
      on: function (e, r) {
        var t = this;
        setTimeout(function () {
          r(t[e]);
        }, 0);
      },
      addTest: function (e, r, t) {
        tests.push({ name: e, fn: r, options: t });
      },
      addAsyncTest: function (e) {
        tests.push({ name: null, fn: e });
      },
    },
    Modernizr = function () {};
  (Modernizr.prototype = ModernizrProto), (Modernizr = new Modernizr());
  var classes = [],
    hasOwnProp;
  !(function () {
    var e = {}.hasOwnProperty;
    hasOwnProp =
      is(e, 'undefined') || is(e.call, 'undefined')
        ? function (e, r) {
            return r in e && is(e.constructor.prototype[r], 'undefined');
          }
        : function (r, t) {
            return e.call(r, t);
          };
  })();
  var docElement = document.documentElement,
    isSVG = 'svg' === docElement.nodeName.toLowerCase();
  (ModernizrProto._l = {}),
    (ModernizrProto.on = function (e, r) {
      this._l[e] || (this._l[e] = []),
        this._l[e].push(r),
        Modernizr.hasOwnProperty(e) &&
          setTimeout(function () {
            Modernizr._trigger(e, Modernizr[e]);
          }, 0);
    }),
    (ModernizrProto._trigger = function (e, r) {
      if (this._l[e]) {
        var t = this._l[e];
        setTimeout(function () {
          var e;
          for (e = 0; e < t.length; e++) (0, t[e])(r);
        }, 0),
          delete this._l[e];
      }
    }),
    Modernizr._q.push(function () {
      ModernizrProto.addTest = addTest;
    }),
    Modernizr.addTest(
      'blobconstructor',
      function () {
        try {
          return !!new Blob();
        } catch (e) {
          return !1;
        }
      },
      { aliases: ['blob-constructor'] },
    ),
    Modernizr.addAsyncTest(function () {
      var e,
        r = ['read', 'readText', 'write', 'writeText'];
      if (navigator.clipboard) {
        addTest('clipboard', !0);
        for (var t = 0; t < r.length; t++)
          (e = !!navigator.clipboard[r[t]]),
            addTest('clipboard.' + r[t].toLowerCase(), e);
      } else addTest('clipboard', !1);
    }),
    Modernizr.addTest('cookies', function () {
      try {
        document.cookie = 'cookietest=1';
        var e = -1 !== document.cookie.indexOf('cookietest=');
        return (
          (document.cookie =
            'cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT'),
          e
        );
      } catch (e) {
        return !1;
      }
    }),
    Modernizr.addTest(
      'cors',
      'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
    );
  var omPrefixes = 'Moz O ms Webkit',
    cssomPrefixes = ModernizrProto._config.usePrefixes
      ? omPrefixes.split(' ')
      : [];
  ModernizrProto._cssomPrefixes = cssomPrefixes;
  var modElem = { elem: createElement('modernizr') };
  Modernizr._q.push(function () {
    delete modElem.elem;
  });
  var mStyle = { style: modElem.elem.style };
  Modernizr._q.unshift(function () {
    delete mStyle.style;
  });
  var domPrefixes = ModernizrProto._config.usePrefixes
    ? omPrefixes.toLowerCase().split(' ')
    : [];
  (ModernizrProto._domPrefixes = domPrefixes),
    (ModernizrProto.testAllProps = testPropsAll);
  var atRule = function (e) {
    var r,
      t = prefixes.length,
      n = window.CSSRule;
    if (void 0 === n) return undefined;
    if (!e) return !1;
    if (
      ((e = e.replace(/^@/, '')),
      (r = e.replace(/-/g, '_').toUpperCase() + '_RULE') in n)
    )
      return '@' + e;
    for (var o = 0; o < t; o++) {
      var i = prefixes[o];
      if (i.toUpperCase() + '_' + r in n)
        return '@-' + i.toLowerCase() + '-' + e;
    }
    return !1;
  };
  ModernizrProto.atRule = atRule;
  var prefixed = (ModernizrProto.prefixed = function (e, r, t) {
      return 0 === e.indexOf('@')
        ? atRule(e)
        : (-1 !== e.indexOf('-') && (e = cssToDOM(e)),
          r ? testPropsAll(e, r, t) : testPropsAll(e, 'pfx'));
    }),
    crypto = prefixed('crypto', window);
  Modernizr.addTest('crypto', !!prefixed('subtle', crypto)),
    Modernizr.addTest('customelements', 'customElements' in window),
    Modernizr.addTest(
      'customevent',
      'CustomEvent' in window && 'function' == typeof window.CustomEvent,
    ),
    Modernizr.addTest(
      'dataview',
      'undefined' != typeof DataView && 'getFloat64' in DataView.prototype,
    ),
    Modernizr.addAsyncTest(function () {
      var e = new Image();
      (e.onerror = function () {
        addTest('exiforientation', !1, { aliases: ['exif-orientation'] });
      }),
        (e.onload = function () {
          addTest('exiforientation', 2 !== e.width, {
            aliases: ['exif-orientation'],
          });
        }),
        (e.src =
          'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAASUkqAAgAAAABABIBAwABAAAABgASAAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==');
    }),
    Modernizr.addAsyncTest(function () {
      var e;
      try {
        e = prefixed('indexedDB', window);
      } catch (e) {}
      if (e) {
        var r,
          t = 'modernizr-' + Math.random();
        try {
          r = e.open(t);
        } catch (e) {
          return void addTest('indexeddb', !1);
        }
        (r.onerror = function (n) {
          !r.error ||
          ('InvalidStateError' !== r.error.name &&
            'UnknownError' !== r.error.name)
            ? (addTest('indexeddb', !0), detectDeleteDatabase(e, t))
            : (addTest('indexeddb', !1), n.preventDefault());
        }),
          (r.onsuccess = function () {
            addTest('indexeddb', !0), detectDeleteDatabase(e, t);
          });
      } else addTest('indexeddb', !1);
    }),
    Modernizr.addTest('proxy', 'Proxy' in window),
    Modernizr.addTest('serviceworker', 'serviceWorker' in navigator),
    Modernizr.addTest(
      'textencoder',
      !(!window.TextEncoder || !window.TextEncoder.prototype.encode),
    ),
    Modernizr.addTest(
      'textdecoder',
      !(!window.TextDecoder || !window.TextDecoder.prototype.decode),
    ),
    Modernizr.addTest('typedarrays', 'ArrayBuffer' in window),
    Modernizr.addTest('webanimations', 'animate' in createElement('div')),
    Modernizr.addTest('webgl', function () {
      return 'WebGLRenderingContext' in window;
    }),
    (ModernizrProto.testAllProps = testAllProps),
    Modernizr.addTest('backgroundcliptext', function () {
      return testAllProps('backgroundClip', 'text');
    }),
    Modernizr.addTest(
      'borderimage',
      testAllProps('borderImage', 'url() 1', !0),
    ),
    Modernizr.addTest(
      'cssgridlegacy',
      testAllProps('grid-columns', '10px', !0),
    ),
    Modernizr.addTest(
      'cssgrid',
      testAllProps('grid-template-rows', 'none', !0),
    );
  var supportsFn =
    (window.CSS && window.CSS.supports.bind(window.CSS)) || window.supportsCSS;
  Modernizr.addTest(
    'customproperties',
    !!supportsFn && (supportsFn('--f:0') || supportsFn('--f', 0)),
  ),
    Modernizr.addTest('flexgap', function () {
      var e = createElement('div');
      (e.style.display = 'flex'),
        (e.style.flexDirection = 'column'),
        (e.style.rowGap = '1px'),
        e.appendChild(createElement('div')),
        e.appendChild(createElement('div')),
        docElement.appendChild(e);
      var r = 1 === e.scrollHeight;
      return e.parentNode.removeChild(e), r;
    }),
    Modernizr.addTest('focuswithin', function () {
      try {
        document.querySelector(':focus-within');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('hsla', function () {
      var e = createElement('a').style;
      return (
        (e.cssText = 'background-color:hsla(120,40%,100%,.5)'),
        contains(e.backgroundColor, 'rgba') ||
          contains(e.backgroundColor, 'hsla')
      );
    }),
    Modernizr.addTest('cssmask', testAllProps('maskRepeat', 'repeat-x', !0));
  var prefixes = ModernizrProto._config.usePrefixes
    ? ' -webkit- -moz- -o- -ms- '.split(' ')
    : ['', ''];
  (ModernizrProto._prefixes = prefixes),
    Modernizr.addTest('csspositionsticky', function () {
      var e = 'position:',
        r = createElement('a'),
        t = r.style;
      return (
        (t.cssText = e + prefixes.join('sticky;' + e).slice(0, -e.length)),
        -1 !== t.position.indexOf('sticky')
      );
    }),
    Modernizr.addTest('rgba', function () {
      var e = createElement('a').style;
      return (
        (e.cssText = 'background-color:rgba(150,255,150,.5)'),
        ('' + e.backgroundColor).indexOf('rgba') > -1
      );
    }),
    Modernizr.addTest('intersectionobserver', 'IntersectionObserver' in window),
    Modernizr.addTest(
      'mutationobserver',
      !!window.MutationObserver || !!window.WebKitMutationObserver,
    ),
    Modernizr.addTest('passiveeventlisteners', function () {
      var e = !1;
      try {
        var r = Object.defineProperty({}, 'passive', {
            get: function () {
              e = !0;
            },
          }),
          t = function () {};
        window.addEventListener('testPassiveEventSupport', t, r),
          window.removeEventListener('testPassiveEventSupport', t, r);
      } catch (e) {}
      return e;
    }),
    Modernizr.addTest('shadowroot', 'attachShadow' in createElement('div')),
    Modernizr.addTest(
      'es6array',
      !!(
        Array.prototype &&
        Array.prototype.copyWithin &&
        Array.prototype.fill &&
        Array.prototype.find &&
        Array.prototype.findIndex &&
        Array.prototype.keys &&
        Array.prototype.entries &&
        Array.prototype.values &&
        Array.from &&
        Array.of
      ),
    ),
    Modernizr.addTest('arrow', function () {
      try {
        eval('()=>{}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('class', function () {
      try {
        eval('class A{}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest(
      'es6collections',
      !!(window.Map && window.Set && window.WeakMap && window.WeakSet),
    ),
    Modernizr.addTest('generators', function () {
      try {
        new Function('function* test() {}')();
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest(
      'es6math',
      !!(
        Math &&
        Math.clz32 &&
        Math.cbrt &&
        Math.imul &&
        Math.sign &&
        Math.log10 &&
        Math.log2 &&
        Math.log1p &&
        Math.expm1 &&
        Math.cosh &&
        Math.sinh &&
        Math.tanh &&
        Math.acosh &&
        Math.asinh &&
        Math.atanh &&
        Math.hypot &&
        Math.trunc &&
        Math.fround
      ),
    ),
    Modernizr.addTest(
      'es6number',
      !!(
        Number.isFinite &&
        Number.isInteger &&
        Number.isSafeInteger &&
        Number.isNaN &&
        Number.parseInt &&
        Number.parseFloat &&
        Number.isInteger(Number.MAX_SAFE_INTEGER) &&
        Number.isInteger(Number.MIN_SAFE_INTEGER) &&
        Number.isFinite(Number.EPSILON)
      ),
    ),
    Modernizr.addTest(
      'es6object',
      !!(Object.assign && Object.is && Object.setPrototypeOf),
    ),
    Modernizr.addTest('promises', function () {
      return (
        'Promise' in window &&
        'resolve' in window.Promise &&
        'reject' in window.Promise &&
        'all' in window.Promise &&
        'race' in window.Promise &&
        (function () {
          var e;
          return (
            new window.Promise(function (r) {
              e = r;
            }),
            'function' == typeof e
          );
        })()
      );
    }),
    Modernizr.addTest('restparameters', function () {
      try {
        eval('function f(...rest) {}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('spreadarray', function () {
      try {
        eval('(function f(){})(...[1])');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('stringtemplate', function () {
      try {
        return '-1-' === eval('(function(){var a=1; return `-${a}-`;})()');
      } catch (e) {
        return !1;
      }
    }),
    Modernizr.addTest(
      'es6string',
      !!(
        String.fromCodePoint &&
        String.raw &&
        String.prototype.codePointAt &&
        String.prototype.repeat &&
        String.prototype.startsWith &&
        String.prototype.endsWith &&
        String.prototype.includes
      ),
    ),
    Modernizr.addTest(
      'es6symbol',
      !!(
        'function' == typeof Symbol &&
        Symbol.for &&
        Symbol.hasInstance &&
        Symbol.isConcatSpreadable &&
        Symbol.iterator &&
        Symbol.keyFor &&
        Symbol.match &&
        Symbol.prototype &&
        Symbol.replace &&
        Symbol.search &&
        Symbol.species &&
        Symbol.split &&
        Symbol.toPrimitive &&
        Symbol.toStringTag &&
        Symbol.unscopables
      ),
    ),
    Modernizr.addTest(
      'es7array',
      !(!Array.prototype || !Array.prototype.includes),
    ),
    Modernizr.addTest('restdestructuringarray', function () {
      try {
        eval('var [...rest]=[1]');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('restdestructuringobject', function () {
      try {
        eval('var {...rest}={a:1}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('spreadobject', function () {
      try {
        eval('var a={...{b:1}}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('es8object', !(!Object.entries || !Object.values)),
    Modernizr.addTest('sandbox', 'sandbox' in createElement('iframe')),
    Modernizr.addTest('srcdoc', 'srcdoc' in createElement('iframe')),
    Modernizr.addTest('canvas', function () {
      var e = createElement('canvas');
      return !(!e.getContext || !e.getContext('2d'));
    }),
    Modernizr.addAsyncTest(function () {
      if (!Modernizr.canvas) return !1;
      var e = new Image(),
        r = createElement('canvas'),
        t = r.getContext('2d');
      (e.onload = function () {
        addTest('apng', function () {
          return (
            void 0 !== r.getContext &&
            (t.drawImage(e, 0, 0), 0 === t.getImageData(0, 0, 1, 1).data[3])
          );
        });
      }),
        (e.src =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==');
    }),
    Modernizr.addTest('imgcrossorigin', 'crossOrigin' in createElement('img')),
    Modernizr.addTest('lazyloading', 'loading' in HTMLImageElement.prototype),
    Modernizr.addAsyncTest(function () {
      var e,
        r,
        t,
        n = createElement('img'),
        o = 'sizes' in n;
      !o && 'srcset' in n
        ? ((r =
            'data:image/gif;base64,R0lGODlhAgABAPAAAP///wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw=='),
          (e =
            'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='),
          (t = function () {
            addTest('sizes', 2 === n.width);
          }),
          (n.onload = t),
          (n.onerror = t),
          n.setAttribute('sizes', '9px'),
          (n.srcset = e + ' 1w,' + r + ' 8w'),
          (n.src = e))
        : addTest('sizes', o);
    }),
    Modernizr.addTest('srcset', 'srcset' in createElement('img')),
    Modernizr.addAsyncTest(function () {
      function e(e, r, t) {
        function n(r) {
          var n = !(!r || 'load' !== r.type) && 1 === o.width;
          addTest(e, 'webp' === e && n ? new Boolean(n) : n), t && t(r);
        }
        var o = new Image();
        (o.onerror = n), (o.onload = n), (o.src = r);
      }
      var r = [
          {
            uri: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
            name: 'webp',
          },
          {
            uri: 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==',
            name: 'webp.alpha',
          },
          {
            uri: 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
            name: 'webp.animation',
          },
          {
            uri: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
            name: 'webp.lossless',
          },
        ],
        t = r.shift();
      e(t.name, t.uri, function (t) {
        if (t && 'load' === t.type)
          for (var n = 0; n < r.length; n++) e(r[n].name, r[n].uri);
      });
    }),
    Modernizr.addTest('beacon', 'sendBeacon' in navigator),
    Modernizr.addTest('eventsource', 'EventSource' in window),
    Modernizr.addTest('fetch', 'fetch' in window),
    Modernizr.addTest(
      'xhr2',
      'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
    ),
    Modernizr.addTest('scriptasync', 'async' in createElement('script')),
    Modernizr.addTest('scriptdefer', 'defer' in createElement('script')),
    Modernizr.addTest('localstorage', function () {
      var e = 'modernizr';
      try {
        return localStorage.setItem(e, e), localStorage.removeItem(e), !0;
      } catch (e) {
        return !1;
      }
    }),
    Modernizr.addTest('sessionstorage', function () {
      var e = 'modernizr';
      try {
        return sessionStorage.setItem(e, e), sessionStorage.removeItem(e), !0;
      } catch (e) {
        return !1;
      }
    }),
    Modernizr.addTest('urlsearchparams', 'URLSearchParams' in window);
  var domPrefixesAll = [''].concat(domPrefixes);
  (ModernizrProto._domPrefixesAll = domPrefixesAll),
    Modernizr.addTest(
      'peerconnection',
      !!prefixed('RTCPeerConnection', window),
    ),
    Modernizr.addTest('datachannel', function () {
      if (!Modernizr.peerconnection) return !1;
      for (var e = 0, r = domPrefixesAll.length; e < r; e++) {
        var t = window[domPrefixesAll[e] + 'RTCPeerConnection'];
        if (t) {
          var n = new t(null);
          return n.close(), 'createDataChannel' in n;
        }
      }
      return !1;
    }),
    Modernizr.addTest(
      'getUserMedia',
      'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    ),
    Modernizr.addTest('resizeobserver', 'ResizeObserver' in window),
    Modernizr.addTest('sharedworkers', 'SharedWorker' in window),
    Modernizr.addTest('webworkers', 'Worker' in window),
    testRunner(),
    delete ModernizrProto.addTest,
    delete ModernizrProto.addAsyncTest;
  for (var i = 0; i < Modernizr._q.length; i++) Modernizr._q[i]();
  scriptGlobalObject.Modernizr = Modernizr;
})(window, window, document);
