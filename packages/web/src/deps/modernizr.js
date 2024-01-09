/*! modernizr 4.0.0-alpha (Custom Build) | MIT *
 * https://modernizr.com/download/?-apng-arrow-avif-beacon-blobworkers-clipboard-contextmenu-cookies-cors-customevent-datachannel-dataworkers-es6array-es6class-es6collections-es6math-es6number-es6object-es6string-es6symbol-es7array-es8object-eventlistener-exiforientation-fetch-forcetouch-generators-getusermedia-hashchange-history-imgcrossorigin-indexeddb-jpeg2000-lazyloading-localstorage-messagechannel-oninput-peerconnection-performance-pointerevents-postmessage-prefetch-promises-proxy-queryselector-requestanimationframe-resizeobserver-restdestructuringarray_restdestructuringobject-restparameters-sandbox-scriptasync-scriptdefer-seamless-serviceworker-sessionstorage-sharedworkers-spreadarray-spreadobject-srcdoc-stringtemplate-transferables-webanimations-webgl-webp-websqldatabase-webworkers-addtest-atrule-domprefixes-hasevent-load-mq-prefixed-prefixedcss-prefixes-printshiv-setclasses-testallprops-testprop-teststyles !*/
!(function (scriptGlobalObject, window, document, undefined) {
  function is(e, t) {
    return typeof e === t;
  }
  function testRunner() {
    var e, t, r, n, o, i, a;
    for (var d in tests)
      if (tests.hasOwnProperty(d)) {
        if (
          ((e = []),
          (t = tests[d]),
          t.name &&
            (e.push(t.name.toLowerCase()),
            t.options && t.options.aliases && t.options.aliases.length))
        )
          for (r = 0; r < t.options.aliases.length; r++)
            e.push(t.options.aliases[r].toLowerCase());
        for (n = is(t.fn, 'function') ? t.fn() : t.fn, o = 0; o < e.length; o++)
          (i = e[o]),
            (a = i.split('.')),
            1 === a.length
              ? (Modernizr[a[0]] = n)
              : ((Modernizr[a[0]] &&
                  (!Modernizr[a[0]] || Modernizr[a[0]] instanceof Boolean)) ||
                  (Modernizr[a[0]] = new Boolean(Modernizr[a[0]])),
                (Modernizr[a[0]][a[1]] = n)),
            classes.push((n ? '' : 'no-') + a.join('-'));
      }
  }
  function setClasses(e) {
    var t = docElement.className,
      r = Modernizr._config.classPrefix || '';
    if ((isSVG && (t = t.baseVal), Modernizr._config.enableJSClass)) {
      var n = new RegExp('(^|\\s)' + r + 'no-js(\\s|$)');
      t = t.replace(n, '$1' + r + 'js$2');
    }
    Modernizr._config.enableClasses &&
      (e.length > 0 && (t += ' ' + r + e.join(' ' + r)),
      isSVG ? (docElement.className.baseVal = t) : (docElement.className = t));
  }
  function addTest(e, t) {
    if ('object' == typeof e)
      for (var r in e) hasOwnProp(e, r) && addTest(r, e[r]);
    else {
      e = e.toLowerCase();
      var n = e.split('.'),
        o = Modernizr[n[0]];
      if ((2 === n.length && (o = o[n[1]]), void 0 !== o)) return Modernizr;
      (t = 'function' == typeof t ? t() : t),
        1 === n.length
          ? (Modernizr[n[0]] = t)
          : (!Modernizr[n[0]] ||
              Modernizr[n[0]] instanceof Boolean ||
              (Modernizr[n[0]] = new Boolean(Modernizr[n[0]])),
            (Modernizr[n[0]][n[1]] = t)),
        setClasses([(t && !1 !== t ? '' : 'no-') + n.join('-')]),
        Modernizr._trigger(e, t);
    }
    return Modernizr;
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
  function injectElementWithStyles(e, t, r, n) {
    var o,
      i,
      a,
      d,
      s = 'modernizr',
      A = createElement('div'),
      c = getBody();
    if (parseInt(r, 10))
      for (; r--; )
        (a = createElement('div')),
          (a.id = n ? n[r] : s + (r + 1)),
          A.appendChild(a);
    return (
      (o = createElement('style')),
      (o.type = 'text/css'),
      (o.id = 's' + s),
      (c.fake ? c : A).appendChild(o),
      c.appendChild(A),
      o.styleSheet
        ? (o.styleSheet.cssText = e)
        : o.appendChild(document.createTextNode(e)),
      (A.id = s),
      c.fake &&
        ((c.style.background = ''),
        (c.style.overflow = 'hidden'),
        (d = docElement.style.overflow),
        (docElement.style.overflow = 'hidden'),
        docElement.appendChild(c)),
      (i = t(A, e)),
      c.fake && c.parentNode
        ? (c.parentNode.removeChild(c),
          (docElement.style.overflow = d),
          docElement.offsetHeight)
        : A.parentNode.removeChild(A),
      !!i
    );
  }
  function computedStyle(e, t, r) {
    var n;
    if ('getComputedStyle' in window) {
      n = getComputedStyle.call(window, e, t);
      var o = window.console;
      if (null !== n) r && (n = n.getPropertyValue(r));
      else if (o) {
        var i = o.error ? 'error' : 'log';
        o[i].call(
          o,
          'getComputedStyle returning null, its possible modernizr test results are inaccurate',
        );
      }
    } else n = !t && e.currentStyle && e.currentStyle[r];
    return n;
  }
  function contains(e, t) {
    return !!~('' + e).indexOf(t);
  }
  function domToCSS(e) {
    return e
      .replace(/([A-Z])/g, function (e, t) {
        return '-' + t.toLowerCase();
      })
      .replace(/^ms-/, '-ms-');
  }
  function nativeTestProps(e, t) {
    var r = e.length;
    if ('CSS' in window && 'supports' in window.CSS) {
      for (; r--; ) if (window.CSS.supports(domToCSS(e[r]), t)) return !0;
      return !1;
    }
    if ('CSSSupportsRule' in window) {
      for (var n = []; r--; ) n.push('(' + domToCSS(e[r]) + ':' + t + ')');
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
      .replace(/([a-z])-([a-z])/g, function (e, t, r) {
        return t + r.toUpperCase();
      })
      .replace(/^-/, '');
  }
  function testProps(e, t, r, n) {
    function o() {
      a && (delete mStyle.style, delete mStyle.modElem);
    }
    if (((n = !is(n, 'undefined') && n), !is(r, 'undefined'))) {
      var i = nativeTestProps(e, r);
      if (!is(i, 'undefined')) return i;
    }
    for (
      var a, d, s, A, c, l = ['modernizr', 'tspan', 'samp'];
      !mStyle.style && l.length;

    )
      (a = !0),
        (mStyle.modElem = createElement(l.shift())),
        (mStyle.style = mStyle.modElem.style);
    for (s = e.length, d = 0; d < s; d++)
      if (
        ((A = e[d]),
        (c = mStyle.style[A]),
        contains(A, '-') && (A = cssToDOM(A)),
        mStyle.style[A] !== undefined)
      ) {
        if (n || is(r, 'undefined')) return o(), 'pfx' !== t || A;
        try {
          mStyle.style[A] = r;
        } catch (e) {}
        if (mStyle.style[A] !== c) return o(), 'pfx' !== t || A;
      }
    return o(), !1;
  }
  function fnBind(e, t) {
    return function () {
      return e.apply(t, arguments);
    };
  }
  function testDOMProps(e, t, r) {
    var n;
    for (var o in e)
      if (e[o] in t)
        return !1 === r
          ? e[o]
          : ((n = t[e[o]]), is(n, 'function') ? fnBind(n, r || t) : n);
    return !1;
  }
  function testPropsAll(e, t, r, n, o) {
    var i = e.charAt(0).toUpperCase() + e.slice(1),
      a = (e + ' ' + cssomPrefixes.join(i + ' ') + i).split(' ');
    return is(t, 'string') || is(t, 'undefined')
      ? testProps(a, t, n, o)
      : ((a = (e + ' ' + domPrefixes.join(i + ' ') + i).split(' ')),
        testDOMProps(a, t, r));
  }
  function testAllProps(e, t, r) {
    return testPropsAll(e, undefined, undefined, t, r);
  }
  function detectDeleteDatabase(e, t) {
    var r = e.deleteDatabase(t);
    (r.onsuccess = function () {
      addTest('indexeddb.deletedatabase', !0);
    }),
      (r.onerror = function () {
        addTest('indexeddb.deletedatabase', !1);
      });
  }
  var tests = [],
    ModernizrProto = {
      _version: '4.0.0-alpha',
      _config: {
        classPrefix: '',
        enableClasses: !1,
        enableJSClass: !0,
        usePrefixes: !0,
      },
      _q: [],
      on: function (e, t) {
        var r = this;
        setTimeout(function () {
          t(r[e]);
        }, 0);
      },
      addTest: function (e, t, r) {
        tests.push({ name: e, fn: t, options: r });
      },
      addAsyncTest: function (e) {
        tests.push({ name: null, fn: e });
      },
    },
    Modernizr = function () {};
  (Modernizr.prototype = ModernizrProto), (Modernizr = new Modernizr());
  var classes = [],
    docElement = document.documentElement,
    isSVG = 'svg' === docElement.nodeName.toLowerCase(),
    hasOwnProp;
  !(function () {
    var e = {}.hasOwnProperty;
    hasOwnProp =
      is(e, 'undefined') || is(e.call, 'undefined')
        ? function (e, t) {
            return t in e && is(e.constructor.prototype[t], 'undefined');
          }
        : function (t, r) {
            return e.call(t, r);
          };
  })(),
    (ModernizrProto._l = {}),
    (ModernizrProto.on = function (e, t) {
      this._l[e] || (this._l[e] = []),
        this._l[e].push(t),
        Modernizr.hasOwnProperty(e) &&
          setTimeout(function () {
            Modernizr._trigger(e, Modernizr[e]);
          }, 0);
    }),
    (ModernizrProto._trigger = function (e, t) {
      if (this._l[e]) {
        var r = this._l[e];
        setTimeout(function () {
          var e;
          for (e = 0; e < r.length; e++) (0, r[e])(t);
        }, 0),
          delete this._l[e];
      }
    }),
    Modernizr._q.push(function () {
      ModernizrProto.addTest = addTest;
    });
  var omPrefixes = 'Moz O ms Webkit',
    cssomPrefixes = ModernizrProto._config.usePrefixes
      ? omPrefixes.split(' ')
      : [];
  ModernizrProto._cssomPrefixes = cssomPrefixes;
  var atRule = function (e) {
    var t,
      r = prefixes.length,
      n = window.CSSRule;
    if (void 0 === n) return undefined;
    if (!e) return !1;
    if (
      ((e = e.replace(/^@/, '')),
      (t = e.replace(/-/g, '_').toUpperCase() + '_RULE') in n)
    )
      return '@' + e;
    for (var o = 0; o < r; o++) {
      var i = prefixes[o];
      if (i.toUpperCase() + '_' + t in n)
        return '@-' + i.toLowerCase() + '-' + e;
    }
    return !1;
  };
  ModernizrProto.atRule = atRule;
  var domPrefixes = ModernizrProto._config.usePrefixes
    ? omPrefixes.toLowerCase().split(' ')
    : [];
  ModernizrProto._domPrefixes = domPrefixes;
  var hasEvent = (function () {
    function e(e, r) {
      var n;
      return (
        !!e &&
        ((r && 'string' != typeof r) || (r = createElement(r || 'div')),
        (e = 'on' + e),
        (n = e in r),
        !n &&
          t &&
          (r.setAttribute || (r = createElement('div')),
          r.setAttribute(e, ''),
          (n = 'function' == typeof r[e]),
          r[e] !== undefined && (r[e] = undefined),
          r.removeAttribute(e)),
        n)
      );
    }
    var t = !('onblur' in docElement);
    return e;
  })();
  ModernizrProto.hasEvent = hasEvent;
  var html5;
  isSVG ||
    (function (e, t) {
      function r(e, t) {
        var r = e.createElement('p'),
          n = e.getElementsByTagName('head')[0] || e.documentElement;
        return (
          (r.innerHTML = 'x<style>' + t + '</style>'),
          n.insertBefore(r.lastChild, n.firstChild)
        );
      }
      function n() {
        var e = b.elements;
        return 'string' == typeof e ? e.split(' ') : e;
      }
      function o(e, t) {
        var r = b.elements;
        'string' != typeof r && (r = r.join(' ')),
          'string' != typeof e && (e = e.join(' ')),
          (b.elements = r + ' ' + e),
          A(t);
      }
      function i(e) {
        var t = E[e[M]];
        return t || ((t = {}), y++, (e[M] = y), (E[y] = t)), t;
      }
      function a(e, r, n) {
        if ((r || (r = t), w)) return r.createElement(e);
        n || (n = i(r));
        var o;
        return (
          (o = n.cache[e]
            ? n.cache[e].cloneNode()
            : v.test(e)
            ? (n.cache[e] = n.createElem(e)).cloneNode()
            : n.createElem(e)),
          !o.canHaveChildren || g.test(e) || o.tagUrn
            ? o
            : n.frag.appendChild(o)
        );
      }
      function d(e, r) {
        if ((e || (e = t), w)) return e.createDocumentFragment();
        r = r || i(e);
        for (
          var o = r.frag.cloneNode(), a = 0, d = n(), s = d.length;
          a < s;
          a++
        )
          o.createElement(d[a]);
        return o;
      }
      function s(e, t) {
        t.cache ||
          ((t.cache = {}),
          (t.createElem = e.createElement),
          (t.createFrag = e.createDocumentFragment),
          (t.frag = t.createFrag())),
          (e.createElement = function (r) {
            return b.shivMethods ? a(r, e, t) : t.createElem(r);
          }),
          (e.createDocumentFragment = Function(
            'h,f',
            'return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(' +
              n()
                .join()
                .replace(/[\w\-:]+/g, function (e) {
                  return (
                    t.createElem(e), t.frag.createElement(e), 'c("' + e + '")'
                  );
                }) +
              ');return n}',
          )(b, t.frag));
      }
      function A(e) {
        e || (e = t);
        var n = i(e);
        return (
          !b.shivCSS ||
            p ||
            n.hasCSS ||
            (n.hasCSS = !!r(
              e,
              'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}',
            )),
          w || s(e, n),
          e
        );
      }
      function c(e) {
        for (
          var t,
            r = e.getElementsByTagName('*'),
            o = r.length,
            i = RegExp('^(?:' + n().join('|') + ')$', 'i'),
            a = [];
          o--;

        )
          (t = r[o]), i.test(t.nodeName) && a.push(t.applyElement(l(t)));
        return a;
      }
      function l(e) {
        for (
          var t,
            r = e.attributes,
            n = r.length,
            o = e.ownerDocument.createElement(B + ':' + e.nodeName);
          n--;

        )
          (t = r[n]), t.specified && o.setAttribute(t.nodeName, t.nodeValue);
        return (o.style.cssText = e.style.cssText), o;
      }
      function u(e) {
        for (
          var t,
            r = e.split('{'),
            o = r.length,
            i = RegExp(
              '(^|[\\s,>+~])(' + n().join('|') + ')(?=[[\\s,>+~#.:]|$)',
              'gi',
            ),
            a = '$1' + B + '\\:$2';
          o--;

        )
          (t = r[o] = r[o].split('}')),
            (t[t.length - 1] = t[t.length - 1].replace(i, a)),
            (r[o] = t.join('}'));
        return r.join('{');
      }
      function f(e) {
        for (var t = e.length; t--; ) e[t].removeNode();
      }
      function m(e) {
        function t() {
          clearTimeout(a._removeSheetTimer), n && n.removeNode(!0), (n = null);
        }
        var n,
          o,
          a = i(e),
          d = e.namespaces,
          s = e.parentWindow;
        return !T || e.printShived
          ? e
          : (void 0 === d[B] && d.add(B),
            s.attachEvent('onbeforeprint', function () {
              t();
              for (
                var i,
                  a,
                  d,
                  s = e.styleSheets,
                  A = [],
                  l = s.length,
                  f = Array(l);
                l--;

              )
                f[l] = s[l];
              for (; (d = f.pop()); )
                if (!d.disabled && z.test(d.media)) {
                  try {
                    (i = d.imports), (a = i.length);
                  } catch (e) {
                    a = 0;
                  }
                  for (l = 0; l < a; l++) f.push(i[l]);
                  try {
                    A.push(d.cssText);
                  } catch (e) {}
                }
              (A = u(A.reverse().join(''))), (o = c(e)), (n = r(e, A));
            }),
            s.attachEvent('onafterprint', function () {
              f(o),
                clearTimeout(a._removeSheetTimer),
                (a._removeSheetTimer = setTimeout(t, 500));
            }),
            (e.printShived = !0),
            e);
      }
      var p,
        w,
        h = e.html5 || {},
        g =
          /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,
        v =
          /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,
        M = '_html5shiv',
        y = 0,
        E = {};
      !(function () {
        try {
          var e = t.createElement('a');
          (e.innerHTML = '<xyz></xyz>'),
            (p = 'hidden' in e),
            (w =
              1 == e.childNodes.length ||
              (function () {
                t.createElement('a');
                var e = t.createDocumentFragment();
                return (
                  void 0 === e.cloneNode ||
                  void 0 === e.createDocumentFragment ||
                  void 0 === e.createElement
                );
              })());
        } catch (e) {
          (p = !0), (w = !0);
        }
      })();
      var b = {
        elements:
          h.elements ||
          'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video',
        version: '3.7.3',
        shivCSS: !1 !== h.shivCSS,
        supportsUnknownElements: w,
        shivMethods: !1 !== h.shivMethods,
        type: 'default',
        shivDocument: A,
        createElement: a,
        createDocumentFragment: d,
        addElements: o,
      };
      (e.html5 = b), A(t);
      var z = /^$|\b(?:all|print)\b/,
        B = 'html5shiv',
        T =
          !w &&
          (function () {
            var r = t.documentElement;
            return !(
              void 0 === t.namespaces ||
              void 0 === t.parentWindow ||
              void 0 === r.applyElement ||
              void 0 === r.removeNode ||
              void 0 === e.attachEvent
            );
          })();
      (b.type += ' print'),
        (b.shivPrint = m),
        m(t),
        'object' == typeof module && module.exports && (module.exports = b);
    })(void 0 !== window ? window : this, document);
  var err = function () {},
    warn = function () {};
  window.console &&
    ((err = function () {
      var e = console.error ? 'error' : 'log';
      window.console[e].apply(
        window.console,
        Array.prototype.slice.call(arguments),
      );
    }),
    (warn = function () {
      var e = console.warn ? 'warn' : 'log';
      window.console[e].apply(
        window.console,
        Array.prototype.slice.call(arguments),
      );
    })),
    (ModernizrProto.load = function () {
      'yepnope' in window
        ? (warn(
            'yepnope.js (aka Modernizr.load) is no longer included as part of Modernizr. yepnope appears to be available on the page, so we’ll use it to handle this call to Modernizr.load, but please update your code to use yepnope directly.\n See http://github.com/Modernizr/Modernizr/issues/1182 for more information.',
          ),
          window.yepnope.apply(window, [].slice.call(arguments, 0)))
        : err(
            'yepnope.js (aka Modernizr.load) is no longer included as part of Modernizr. Get it from http://yepnopejs.com. See http://github.com/Modernizr/Modernizr/issues/1182 for more information.',
          );
    });
  var mq = (function () {
    var e = window.matchMedia || window.msMatchMedia;
    return e
      ? function (t) {
          var r = e(t);
          return (r && r.matches) || !1;
        }
      : function (e) {
          var t = !1;
          return (
            injectElementWithStyles(
              '@media ' + e + ' { #modernizr { position: absolute; } }',
              function (e) {
                t = 'absolute' === computedStyle(e, null, 'position');
              },
            ),
            t
          );
        };
  })();
  ModernizrProto.mq = mq;
  var modElem = { elem: createElement('modernizr') };
  Modernizr._q.push(function () {
    delete modElem.elem;
  });
  var mStyle = { style: modElem.elem.style };
  Modernizr._q.unshift(function () {
    delete mStyle.style;
  }),
    (ModernizrProto.testAllProps = testPropsAll);
  var prefixed = (ModernizrProto.prefixed = function (e, t, r) {
      return 0 === e.indexOf('@')
        ? atRule(e)
        : (-1 !== e.indexOf('-') && (e = cssToDOM(e)),
          t ? testPropsAll(e, t, r) : testPropsAll(e, 'pfx'));
    }),
    prefixes = ModernizrProto._config.usePrefixes
      ? ' -webkit- -moz- -o- -ms- '.split(' ')
      : ['', ''];
  ModernizrProto._prefixes = prefixes;
  var prefixedCSS = (ModernizrProto.prefixedCSS = function (e) {
    var t = prefixed(e);
    return t && domToCSS(t);
  });
  ModernizrProto.testAllProps = testAllProps;
  var testProp = (ModernizrProto.testProp = function (e, t, r) {
      return testProps([e], undefined, t, r);
    }),
    testStyles = (ModernizrProto.testStyles = injectElementWithStyles);
  Modernizr.addAsyncTest(function () {
    var e,
      t = ['read', 'readText', 'write', 'writeText'];
    if (navigator.clipboard) {
      addTest('clipboard', !0);
      for (var r = 0; r < t.length; r++)
        (e = !!navigator.clipboard[t[r]]),
          addTest('clipboard.' + t[r].toLowerCase(), e);
    } else addTest('clipboard', !1);
  }),
    Modernizr.addTest(
      'contextmenu',
      'contextMenu' in docElement && 'HTMLMenuItemElement' in window,
    ),
    Modernizr.addTest(
      'cors',
      'XMLHttpRequest' in window && 'withCredentials' in new XMLHttpRequest(),
    ),
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
        var eval2 = eval;
        eval2('()=>{}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('es6class', function () {
      try {
        var eval2 = eval;
        eval2('class A{}');
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
            new window.Promise(function (t) {
              e = t;
            }),
            'function' == typeof e
          );
        })()
      );
    }),
    Modernizr.addTest('restparameters', function () {
      try {
        var eval2 = eval;
        eval2('function f(...rest) {}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('spreadarray', function () {
      try {
        var eval2 = eval;
        eval2('(function f(){})(...[1])');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('stringtemplate', function () {
      try {
        var eval2 = eval;
        return '-1-' === eval2('(function(){var a=1; return `-${a}-`;})()');
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
        var eval2 = eval;
        eval2('var [...rest]=[1]');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('restdestructuringobject', function () {
      try {
        var eval2 = eval;
        eval2('var {...rest}={a:1}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('spreadobject', function () {
      try {
        var eval2 = eval;
        eval2('var a={...{b:1}}');
      } catch (e) {
        return !1;
      }
      return !0;
    }),
    Modernizr.addTest('es8object', !(!Object.entries || !Object.values)),
    Modernizr.addTest(
      'customevent',
      'CustomEvent' in window && 'function' == typeof window.CustomEvent,
    ),
    Modernizr.addTest('eventlistener', 'addEventListener' in window),
    Modernizr.addTest('forcetouch', function () {
      return (
        !!hasEvent(prefixed('mouseforcewillbegin', window, !1), window) &&
        MouseEvent.WEBKIT_FORCE_AT_MOUSE_DOWN &&
        MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN
      );
    }),
    Modernizr.addTest('hashchange', function () {
      return (
        !1 !== hasEvent('hashchange', window) &&
        (document.documentMode === undefined || document.documentMode > 7)
      );
    }),
    Modernizr.addTest('oninput', function () {
      var e,
        t = createElement('input');
      if (
        (t.setAttribute('oninput', 'return'),
        (t.style.cssText = 'position:fixed;top:0;'),
        hasEvent('oninput', docElement) || 'function' == typeof t.oninput)
      )
        return !0;
      try {
        var r = document.createEvent('KeyboardEvent');
        e = !1;
        var n = function (t) {
          (e = !0), t.preventDefault(), t.stopPropagation();
        };
        r.initKeyEvent(
          'keypress',
          !0,
          !0,
          window,
          !1,
          !1,
          !1,
          !1,
          0,
          'e'.charCodeAt(0),
        ),
          docElement.appendChild(t),
          t.addEventListener('input', n, !1),
          t.focus(),
          t.dispatchEvent(r),
          t.removeEventListener('input', n, !1),
          docElement.removeChild(t);
      } catch (t) {
        e = !1;
      }
      return e;
    });
  var domPrefixesAll = [''].concat(domPrefixes);
  (ModernizrProto._domPrefixesAll = domPrefixesAll),
    Modernizr.addTest('pointerevents', function () {
      for (var e = 0, t = domPrefixesAll.length; e < t; e++)
        if (hasEvent(domPrefixesAll[e] + 'pointerdown')) return !0;
      return !1;
    }),
    Modernizr.addTest('history', function () {
      var e = navigator.userAgent;
      return (
        !!e &&
        ((-1 === e.indexOf('Android 2.') && -1 === e.indexOf('Android 4.0')) ||
          -1 === e.indexOf('Mobile Safari') ||
          -1 !== e.indexOf('Chrome') ||
          -1 !== e.indexOf('Windows Phone') ||
          'file:' === location.protocol) &&
        window.history &&
        'pushState' in window.history
      );
    }),
    Modernizr.addTest('sandbox', 'sandbox' in createElement('iframe')),
    Modernizr.addTest('seamless', 'seamless' in createElement('iframe')),
    Modernizr.addTest('srcdoc', 'srcdoc' in createElement('iframe')),
    Modernizr.addTest('canvas', function () {
      var e = createElement('canvas');
      return !(!e.getContext || !e.getContext('2d'));
    }),
    Modernizr.addAsyncTest(function () {
      if (!Modernizr.canvas) return !1;
      var e = new Image(),
        t = createElement('canvas'),
        r = t.getContext('2d');
      (e.onload = function () {
        addTest('apng', function () {
          return (
            void 0 !== t.getContext &&
            (r.drawImage(e, 0, 0), 0 === r.getImageData(0, 0, 1, 1).data[3])
          );
        });
      }),
        (e.src =
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACGFjVEwAAAABAAAAAcMq2TYAAAANSURBVAiZY2BgYPgPAAEEAQB9ssjfAAAAGmZjVEwAAAAAAAAAAQAAAAEAAAAAAAAAAAD6A+gBAbNU+2sAAAARZmRBVAAAAAEImWNgYGBgAAAABQAB6MzFdgAAAABJRU5ErkJggg==');
    }),
    Modernizr.addAsyncTest(function () {
      var e = new Image();
      (e.onload = e.onerror =
        function () {
          addTest('avif', 1 === e.width);
        }),
        (e.src =
          'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAEcbWV0YQAAAAAAAABIaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGNhdmlmIC0gaHR0cHM6Ly9naXRodWIuY29tL2xpbmstdS9jYXZpZgAAAAAeaWxvYwAAAAAEQAABAAEAAAAAAUQAAQAAABcAAAAqaWluZgEAAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFJbWFnZQAAAAAOcGl0bQAAAAAAAQAAAHJpcHJwAAAAUmlwY28AAAAQcGFzcAAAAAEAAAABAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAAFmF2MUOBAAwACggYAAYICGgIIAAAABhpcG1hAAAAAAAAAAEAAQUBAoMDhAAAAB9tZGF0CggYAAYICGgIIBoFHiAAAEQiBACwDoA=');
    }),
    Modernizr.addTest('imgcrossorigin', 'crossOrigin' in createElement('img')),
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
      var e = new Image();
      (e.onload = e.onerror =
        function () {
          addTest('jpeg2000', 1 === e.width);
        }),
        (e.src =
          'data:image/jp2;base64,/0//UQAyAAAAAAABAAAAAgAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAEBwEBBwEBBwEBBwEB/1IADAAAAAEAAAQEAAH/XAAEQED/ZAAlAAFDcmVhdGVkIGJ5IE9wZW5KUEVHIHZlcnNpb24gMi4wLjD/kAAKAAAAAABYAAH/UwAJAQAABAQAAf9dAAUBQED/UwAJAgAABAQAAf9dAAUCQED/UwAJAwAABAQAAf9dAAUDQED/k8+kEAGvz6QQAa/PpBABr994EAk//9k=');
    }),
    Modernizr.addTest('lazyloading', 'loading' in HTMLImageElement.prototype),
    Modernizr.addAsyncTest(function () {
      function e(e, t, r) {
        function n(t) {
          var n = !(!t || 'load' !== t.type) && 1 === o.width;
          addTest(e, 'webp' === e && n ? new Boolean(n) : n), r && r(t);
        }
        var o = new Image();
        (o.onerror = n), (o.onload = n), (o.src = t);
      }
      var t = [
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
        r = t.shift();
      e(r.name, r.uri, function (r) {
        if (r && 'load' === r.type)
          for (var n = 0; n < t.length; n++) e(t[n].name, t[n].uri);
      });
    }),
    Modernizr.addTest('messagechannel', 'MessageChannel' in window),
    Modernizr.addTest('beacon', 'sendBeacon' in navigator),
    Modernizr.addTest('fetch', 'fetch' in window),
    Modernizr.addTest('performance', !!prefixed('performance', window));
  var bool = !0;
  try {
    window.postMessage(
      {
        toString: function () {
          bool = !1;
        },
      },
      '*',
    );
  } catch (e) {}
  Modernizr.addTest('postmessage', new Boolean('postMessage' in window)),
    Modernizr.addTest('postmessage.structuredclones', bool),
    Modernizr.addTest('proxy', 'Proxy' in window),
    Modernizr.addTest(
      'queryselector',
      'querySelector' in document && 'querySelectorAll' in document,
    ),
    Modernizr.addTest('prefetch', function () {
      if (11 === document.documentMode) return !0;
      var e = createElement('link').relList;
      return !(!e || !e.supports) && e.supports('prefetch');
    }),
    Modernizr.addTest(
      'requestanimationframe',
      !!prefixed('requestAnimationFrame', window),
      { aliases: ['raf'] },
    ),
    Modernizr.addTest('scriptasync', 'async' in createElement('script')),
    Modernizr.addTest('scriptdefer', 'defer' in createElement('script')),
    Modernizr.addTest('serviceworker', 'serviceWorker' in navigator),
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
    Modernizr.addAsyncTest(function () {
      var e;
      try {
        e = prefixed('indexedDB', window);
      } catch (e) {}
      if (e) {
        var t,
          r = 'modernizr-' + Math.random();
        try {
          t = e.open(r);
        } catch (e) {
          return void addTest('indexeddb', !1);
        }
        (t.onerror = function (n) {
          !t.error ||
          ('InvalidStateError' !== t.error.name &&
            'UnknownError' !== t.error.name)
            ? (addTest('indexeddb', !0), detectDeleteDatabase(e, r))
            : (addTest('indexeddb', !1), n.preventDefault());
        }),
          (t.onsuccess = function () {
            addTest('indexeddb', !0), detectDeleteDatabase(e, r);
          });
      } else addTest('indexeddb', !1);
    }),
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
    Modernizr.addTest('websqldatabase', 'openDatabase' in window),
    Modernizr.addTest('webanimations', 'animate' in createElement('div')),
    Modernizr.addTest('webgl', function () {
      return 'WebGLRenderingContext' in window;
    }),
    Modernizr.addTest(
      'peerconnection',
      !!prefixed('RTCPeerConnection', window),
    ),
    Modernizr.addTest('datachannel', function () {
      if (!Modernizr.peerconnection) return !1;
      for (var e = 0, t = domPrefixesAll.length; e < t; e++) {
        var r = window[domPrefixesAll[e] + 'RTCPeerConnection'];
        if (r)
          try {
            return 'createDataChannel' in new r({});
          } catch (e) {}
      }
      return !1;
    }),
    Modernizr.addTest(
      'getUserMedia',
      'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    ),
    Modernizr.addTest('resizeobserver', 'ResizeObserver' in window),
    Modernizr.addAsyncTest(function () {
      function e() {
        addTest('blobworkers', !1), t();
      }
      function t() {
        d && n.revokeObjectURL(d), a && a.terminate(), s && clearTimeout(s);
      }
      try {
        var r = window.BlobBuilder,
          n = window.URL;
        Modernizr._config.usePrefix &&
          ((r =
            r ||
            window.MozBlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MSBlobBuilder ||
            window.OBlobBuilder),
          (n =
            n ||
            window.MozURL ||
            window.webkitURL ||
            window.MSURL ||
            window.OURL));
        var o,
          i,
          a,
          d,
          s,
          A = 'this.onmessage=function(e){postMessage(e.data)}';
        try {
          o = new Blob([A], { type: 'text/javascript' });
        } catch (e) {}
        o || ((i = new r()), i.append(A), (o = i.getBlob())),
          (d = n.createObjectURL(o)),
          (a = new Worker(d)),
          (a.onmessage = function (e) {
            addTest('blobworkers', 'Modernizr' === e.data), t();
          }),
          (a.onerror = e),
          (s = setTimeout(e, 200)),
          a.postMessage('Modernizr');
      } catch (t) {
        e();
      }
    }),
    Modernizr.addAsyncTest(function () {
      try {
        var e = new Worker(
          'data:text/javascript;base64,dGhpcy5vbm1lc3NhZ2U9ZnVuY3Rpb24oZSl7cG9zdE1lc3NhZ2UoZS5kYXRhKX0=',
        );
        (e.onmessage = function (t) {
          e.terminate(),
            addTest('dataworkers', 'Modernizr' === t.data),
            (e = null);
        }),
          (e.onerror = function () {
            addTest('dataworkers', !1), (e = null);
          }),
          setTimeout(function () {
            addTest('dataworkers', !1);
          }, 200),
          e.postMessage('Modernizr');
      } catch (e) {
        setTimeout(function () {
          addTest('dataworkers', !1);
        }, 0);
      }
    }),
    Modernizr.addTest('sharedworkers', 'SharedWorker' in window),
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
    );
  var url = prefixed('URL', window, !1);
  (url = url && window[url]),
    Modernizr.addTest(
      'bloburls',
      url && 'revokeObjectURL' in url && 'createObjectURL' in url,
    ),
    Modernizr.addTest('webworkers', 'Worker' in window),
    Modernizr.addTest('typedarrays', 'ArrayBuffer' in window),
    Modernizr.addAsyncTest(function () {
      function e() {
        addTest('transferables', !1), t();
      }
      function t() {
        i && URL.revokeObjectURL(i), a && a.terminate(), n && clearTimeout(n);
      }
      if (
        !(
          Modernizr.blobconstructor &&
          Modernizr.bloburls &&
          Modernizr.webworkers &&
          Modernizr.typedarrays
        )
      )
        return addTest('transferables', !1);
      try {
        var r,
          n,
          o = new Blob(['var hello = "world"'], { type: 'text/javascript' }),
          i = URL.createObjectURL(o),
          a = new Worker(i);
        (a.onerror = e),
          (n = setTimeout(e, 200)),
          (r = new ArrayBuffer(1)),
          a.postMessage(r, [r]),
          addTest('transferables', 0 === r.byteLength),
          t();
      } catch (t) {
        e();
      }
    }),
    testRunner(),
    setClasses(classes),
    delete ModernizrProto.addTest,
    delete ModernizrProto.addAsyncTest;
  for (var i = 0; i < Modernizr._q.length; i++) Modernizr._q[i]();
  scriptGlobalObject.Modernizr = Modernizr;
})(window, window, document);
