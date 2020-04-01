// ==UserScript==
// @name          StackOverflow Code Prettify bundle
// @description   Google Code Prettify bundled and compiled by StackOverflow.com at https://cdn.sstatic.net/Js/prettify-full.en.js reformatted with Prettier and wrapped inside initPrettyPrint() function by wOxxOm
// @namespace     wOxxOm.scripts
// @author        wOxxOm
// @grant         none
// @version       1.0.1
// ==/UserScript==

function initPrettyPrint(window = {}) {
  window.PR_SHOULD_USE_CONTINUATION = !0;
  var IN_GLOBAL_SCOPE = !0;
  var prettyPrintOne, prettyPrint;
  !(function() {
    function e(e) {
      function t(e) {
        var t = e.charCodeAt(0);
        if (92 !== t) return t;
        var n = e.charAt(1);
        return (
          (t = d[n]),
          t
            ? t
            : n >= '0' && '7' >= n
            ? parseInt(e.substring(1), 8)
            : 'u' === n || 'x' === n
            ? parseInt(e.substring(2), 16)
            : e.charCodeAt(1)
        );
      }
      function n(e) {
        if (32 > e) return (16 > e ? '\\x0' : '\\x') + e.toString(16);
        var t = String.fromCharCode(e);
        return '\\' === t || '-' === t || ']' === t || '^' === t ? '\\' + t : t;
      }
      function i(e) {
        var i = e
            .substring(1, e.length - 1)
            .match(
              new RegExp(
                '\\\\u[0-9A-Fa-f]{4}|\\\\x[0-9A-Fa-f]{2}|\\\\[0-3][0-7]{0,2}|\\\\[0-7]{1,2}|' +
                '\\\\[\\s\\S]|-|[^-\\\\]',
                'g'
              )
            ),
          a = [],
          r = '^' === i[0],
          o = ['['];
        r && o.push('^');
        for (var s = r ? 1 : 0, c = i.length; c > s; ++s) {
          var l = i[s];
          if (/\\[bdsw]/i.test(l)) o.push(l);
          else {
            var u,
              d = t(l);
            c > s + 2 && '-' === i[s + 1] ? ((u = t(i[s + 2])), (s += 2)) : (u = d),
              a.push([d, u]),
              65 > u ||
                d > 122 ||
                (65 > u || d > 90 || a.push([32 | Math.max(65, d), 32 | Math.min(u, 90)]),
                97 > u || d > 122 || a.push([-33 & Math.max(97, d), -33 & Math.min(u, 122)]));
          }
        }
        a.sort(function(e, t) {
          return e[0] - t[0] || t[1] - e[1];
        });
        for (var p = [], f = [], s = 0; s < a.length; ++s) {
          var h = a[s];
          h[0] <= f[1] + 1 ? (f[1] = Math.max(f[1], h[1])) : p.push((f = h));
        }
        for (var s = 0; s < p.length; ++s) {
          var h = p[s];
          o.push(n(h[0])), h[1] > h[0] && (h[1] + 1 > h[0] && o.push('-'), o.push(n(h[1])));
        }
        return o.push(']'), o.join('');
      }
      function a(e) {
        for (
          var t = e.source.match(
              new RegExp(
                '(?:\\[(?:[^\\x5C\\x5D]|\\\\[\\s\\S])*\\]|\\\\u[A-Fa-f0-9]{4}|\\\\x[A-Fa-f0-9]{2}|' +
                '\\\\[0-9]+|\\\\[^ux0-9]|\\(\\?[:!=]|[\\(\\)\\^]|[^\\x5B\\x5C\\(\\)\\^]+)',
                'g'
              )
            ),
            a = t.length,
            s = [],
            c = 0,
            l = 0;
          a > c;
          ++c
        ) {
          var u = t[c];
          if ('(' === u) ++l;
          else if ('\\' === u.charAt(0)) {
            var d = +u.substring(1);
            d && (l >= d ? (s[d] = -1) : (t[c] = n(d)));
          }
        }
        for (var c = 1; c < s.length; ++c) -1 === s[c] && (s[c] = ++r);
        for (var c = 0, l = 0; a > c; ++c) {
          var u = t[c];
          if ('(' === u) ++l, s[l] || (t[c] = '(?:');
          else if ('\\' === u.charAt(0)) {
            var d = +u.substring(1);
            d && l >= d && (t[c] = '\\' + s[d]);
          }
        }
        for (var c = 0; a > c; ++c) '^' === t[c] && '^' !== t[c + 1] && (t[c] = '');
        if (e.ignoreCase && o)
          for (var c = 0; a > c; ++c) {
            var u = t[c],
              p = u.charAt(0);
            u.length >= 2 && '[' === p
              ? (t[c] = i(u))
              : '\\' !== p &&
                (t[c] = u.replace(/[a-zA-Z]/g, function(e) {
                  var t = e.charCodeAt(0);
                  return '[' + String.fromCharCode(-33 & t, 32 | t) + ']';
                }));
          }
        return t.join('');
      }
      for (var r = 0, o = !1, s = !1, c = 0, l = e.length; l > c; ++c) {
        var u = e[c];
        if (u.ignoreCase) s = !0;
        else if (/[a-z]/i.test(u.source.replace(/\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|\\[^ux]/gi, ''))) {
          (o = !0), (s = !1);
          break;
        }
      }
      for (
        var d = {b: 8, t: 9, n: 10, v: 11, f: 12, r: 13}, p = [], c = 0, l = e.length;
        l > c;
        ++c
      ) {
        var u = e[c];
        if (u.global || u.multiline) throw new Error('' + u);
        p.push('(?:' + a(u) + ')');
      }
      return new RegExp(p.join('|'), s ? 'gi' : 'g');
    }
    function t(e, t) {
      function n(e) {
        var c = e.nodeType;
        if (1 == c) {
          if (i.test(e.className)) return;
          for (var l = e.firstChild; l; l = l.nextSibling) n(l);
          var u = e.nodeName.toLowerCase();
          ('br' === u || 'li' === u) && ((a[s] = '\n'), (o[s << 1] = r++), (o[(s++ << 1) | 1] = e));
        } else if (3 == c || 4 == c) {
          var d = e.nodeValue;
          d.length &&
            ((d = t ? d.replace(/\r\n?/g, '\n') : d.replace(/[ \t\r\n]+/g, ' ')),
            (a[s] = d),
            (o[s << 1] = r),
            (r += d.length),
            (o[(s++ << 1) | 1] = e));
        }
      }
      var i = /(?:^|\s)nocode(?:\s|$)/,
        a = [],
        r = 0,
        o = [],
        s = 0;
      return n(e), {sourceCode: a.join('').replace(/\n$/, ''), spans: o};
    }
    function n(e, t, n, i, a) {
      if (n) {
        var r = {
          sourceNode: e,
          pre: 1,
          langExtension: null,
          numberLines: null,
          sourceCode: n,
          spans: null,
          basePos: t,
          decorations: null,
        };
        i(r), a.push.apply(a, r.decorations);
      }
    }
    function i(e) {
      for (var t = void 0, n = e.firstChild; n; n = n.nextSibling) {
        var i = n.nodeType;
        t = 1 === i ? (t ? e : n) : 3 === i ? (V.test(n.nodeValue) ? e : t) : t;
      }
      return t === e ? void 0 : t;
    }
    function a(t, i) {
      var a,
        r = {};
      !(function() {
        for (var n = t.concat(i), o = [], s = {}, c = 0, l = n.length; l > c; ++c) {
          var u = n[c],
            d = u[3];
          if (d) for (var p = d.length; --p >= 0; ) r[d.charAt(p)] = u;
          var f = u[1],
            h = '' + f;
          s.hasOwnProperty(h) || (o.push(f), (s[h] = null));
        }
        o.push(/[\0-\uffff]/), (a = e(o));
      })();
      var o = i.length,
        s = function(e) {
          for (
            var t = e.sourceCode,
              c = e.basePos,
              u = e.sourceNode,
              d = [c, M],
              p = 0,
              f = t.match(a) || [],
              h = {},
              g = 0,
              m = f.length;
            m > g;
            ++g
          ) {
            var v,
              b = f[g],
              k = h[b],
              w = void 0;
            if ('string' == typeof k) v = !1;
            else {
              var x = r[b.charAt(0)];
              if (x) (w = b.match(x[1])), (k = x[0]);
              else {
                for (var $ = 0; o > $; ++$)
                  if (((x = i[$]), (w = b.match(x[1])))) {
                    k = x[0];
                    break;
                  }
                w || (k = M);
              }
              (v = k.length >= 5 && 'lang-' === k.substring(0, 5)),
                !v || (w && 'string' == typeof w[1]) || ((v = !1), (k = L)),
                v || (h[b] = k);
            }
            var y = p;
            if (((p += b.length), v)) {
              var S = w[1],
                E = b.indexOf(S),
                C = E + S.length;
              w[2] && ((C = b.length - w[2].length), (E = C - S.length));
              var T = k.substring(5);
              n(u, c + y, b.substring(0, E), s, d),
                n(u, c + y + E, S, l(T, S), d),
                n(u, c + y + C, b.substring(C), s, d);
            } else d.push(c + y, k);
          }
          e.decorations = d;
        };
      return s;
    }
    function r(e) {
      var t = [],
        n = [];
      e.tripleQuotedStrings
        ? t.push([
            I,
            /^(?:\'\'\'(?:[^\'\\]|\\[\s\S]|\'{1,2}(?=[^\']))*(?:\'\'\'|$)|\"\"\"(?:[^\"\\]|\\[\s\S]|\"{1,2}(?=[^\"]))*(?:\"\"\"|$)|\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$))/,
            null,
            '\'"',
          ])
        : e.multiLineStrings
        ? t.push([
            I,
            /^(?:\'(?:[^\\\']|\\[\s\S])*(?:\'|$)|\"(?:[^\\\"]|\\[\s\S])*(?:\"|$)|\`(?:[^\\\`]|\\[\s\S])*(?:\`|$))/,
            null,
            '\'"`',
          ])
        : t.push([
            I,
            /^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$)|\"(?:[^\\\"\r\n]|\\.)*(?:\"|$))/,
            null,
            '"\'',
          ]),
        e.verbatimStrings && n.push([I, /^@\"(?:[^\"]|\"\")*(?:\"|$)/, null]);
      var i = e.hashComments;
      i &&
        (e.cStyleComments
          ? (i > 1
              ? t.push([O, /^#(?:##(?:[^#]|#(?!##))*(?:###|$)|.*)/, null, '#'])
              : t.push([
                  O,
                  /^#(?:(?:define|e(?:l|nd)if|else|error|ifn?def|include|line|pragma|undef|warning)\b|[^\r\n]*)/,
                  null,
                  '#',
                ]),
            n.push([
              I,
              /^<(?:(?:(?:\.\.\/)*|\/?)(?:[\w-]+(?:\/[\w-]+)+)?[\w-]+\.h(?:h|pp|\+\+)?|[a-z]\w*)>/,
              null,
            ]))
          : t.push([O, /^#[^\r\n]*/, null, '#'])),
        e.cStyleComments &&
          (n.push([O, /^\/\/[^\r\n]*/, null]), n.push([O, /^\/\*[\s\S]*?(?:\*\/|$)/, null]));
      var r = e.regexLiterals;
      if (r) {
        var o = r > 1 ? '' : '\n\r',
          s = o ? '.' : '[\\S\\s]',
          c =
            '/(?=[^/*' +
            o +
            '])(?:[^/\\x5B\\x5C' +
            o +
            ']|\\x5C' +
            s +
            '|\\x5B(?:[^\\x5C\\x5D' +
            o +
            ']|\\x5C' +
            s +
            ')*(?:\\x5D|$))+/';
        n.push(['lang-regex', RegExp('^' + B + '(' + c + ')')]);
      }
      var l = e.types;
      l && n.push([_, l]);
      var u = ('' + e.keywords).replace(/^ | $/g, '');
      u.length && n.push([P, new RegExp('^(?:' + u.replace(/[\s,]+/g, '|') + ')\\b'), null]),
        t.push([M, /^\s+/, null, ' \r\n	 ']);
      var d = '^.[^\\s\\w.$@\'"`/\\\\]*';
      return (
        e.regexLiterals && (d += '(?!s*/)'),
        n.push(
          [A, /^@[a-z_$][a-z_$@0-9]*/i, null],
          [_, /^(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/, null],
          [M, /^[a-z_$][a-z_$@0-9]*/i, null],
          [
            A,
            new RegExp(
              '^(?:0x[a-f0-9]+|(?:\\d(?:_\\d+)*\\d*(?:\\.\\d*)?|\\.\\d\\+)(?:e[+\\-]?\\d+)?)[a-z]*',
              'i'
            ),
            null,
            '0123456789',
          ],
          [M, /^\\[\s\S]?/, null],
          [R, new RegExp(d), null]
        ),
        a(t, n)
      );
    }
    function o(e, t, n) {
      function i(e) {
        var t = e.nodeType;
        if (1 != t || r.test(e.className)) {
          if ((3 == t || 4 == t) && n) {
            var c = e.nodeValue,
              l = c.match(o);
            if (l) {
              var u = c.substring(0, l.index);
              e.nodeValue = u;
              var d = c.substring(l.index + l[0].length);
              if (d) {
                var p = e.parentNode;
                p.insertBefore(s.createTextNode(d), e.nextSibling);
              }
              a(e), u || e.parentNode.removeChild(e);
            }
          }
        } else if ('br' === e.nodeName) a(e), e.parentNode && e.parentNode.removeChild(e);
        else for (var f = e.firstChild; f; f = f.nextSibling) i(f);
      }
      function a(e) {
        function t(e, n) {
          var i = n ? e.cloneNode(!1) : e,
            a = e.parentNode;
          if (a) {
            var r = t(a, 1),
              o = e.nextSibling;
            r.appendChild(i);
            for (var s = o; s; s = o) (o = s.nextSibling), r.appendChild(s);
          }
          return i;
        }
        for (; !e.nextSibling; ) if (((e = e.parentNode), !e)) return;
        for (var n, i = t(e.nextSibling, 0); (n = i.parentNode) && 1 === n.nodeType; ) i = n;
        l.push(i);
      }
      for (
        var r = /(?:^|\s)nocode(?:\s|$)/,
          o = /\r\n?|\n/,
          s = e.ownerDocument,
          c = s.createElement('li');
        e.firstChild;

      )
        c.appendChild(e.firstChild);
      for (var l = [c], u = 0; u < l.length; ++u) i(l[u]);
      t === (0 | t) && l[0].setAttribute('value', t);
      var d = s.createElement('ol');
      d.className = 'linenums';
      for (var p = Math.max(0, (t - 1) | 0) || 0, u = 0, f = l.length; f > u; ++u)
        (c = l[u]),
          (c.className = 'L' + ((u + p) % 10)),
          c.firstChild || c.appendChild(s.createTextNode(' ')),
          d.appendChild(c);
      e.appendChild(d);
    }
    function s(e) {
      var t = /\bMSIE\s(\d+)/.exec(navigator.userAgent);
      t = t && +t[1] <= 8;
      var n = /\n/g,
        i = e.sourceCode,
        a = i.length,
        r = 0,
        o = e.spans,
        s = o.length,
        c = 0,
        l = e.decorations,
        u = l.length,
        d = 0;
      l[u] = a;
      var p, f;
      for (f = p = 0; u > f; ) l[f] !== l[f + 2] ? ((l[p++] = l[f++]), (l[p++] = l[f++])) : (f += 2);
      for (u = p, f = p = 0; u > f; ) {
        for (var h = l[f], g = l[f + 1], m = f + 2; u >= m + 2 && l[m + 1] === g; ) m += 2;
        (l[p++] = h), (l[p++] = g), (f = m);
      }
      u = l.length = p;
      var v = e.sourceNode,
        b = '';
      v && ((b = v.style.display), (v.style.display = 'none'));
      try {
        for (; s > c; ) {
          var k,
            w = (o[c], o[c + 2] || a),
            x = l[d + 2] || a,
            m = Math.min(w, x),
            $ = o[c + 1];
          if (1 !== $.nodeType && (k = i.substring(r, m))) {
            t && (k = k.replace(n, '\r')), ($.nodeValue = k);
            var y = $.ownerDocument,
              S = y.createElement('span');
            S.className = l[d + 1];
            var E = $.parentNode;
            E.replaceChild(S, $),
              S.appendChild($),
              w > r &&
                ((o[c + 1] = $ = y.createTextNode(i.substring(m, w))),
                E.insertBefore($, S.nextSibling));
          }
          (r = m), r >= w && (c += 2), r >= x && (d += 2);
        }
      } finally {
        v && (v.style.display = b);
      }
    }
    function c(e, t) {
      for (var n = t.length; --n >= 0; ) {
        var i = t[n];
        H.hasOwnProperty(i)
          ? f.console && console.warn('cannot override language handler %s', i)
          : (H[i] = e);
      }
    }
    function l(e, t) {
      return (
        (e && H.hasOwnProperty(e)) || (e = /^\s*</.test(t) ? 'default-markup' : 'default-code'), H[e]
      );
    }
    function u(e) {
      var n = e.langExtension;
      try {
        var i = t(e.sourceNode, e.pre),
          a = i.sourceCode;
        (e.sourceCode = a), (e.spans = i.spans), (e.basePos = 0), l(n, a)(e), s(e);
      } catch (r) {
        f.console && console.log((r && r.stack) || r);
      }
    }
    function d(e, t, n) {
      var i = n || !1,
        a = t || null,
        r = document.createElement('div');
      (r.innerHTML = '<pre>' + e + '</pre>'), (r = r.firstChild), i && o(r, i, !0);
      var s = {
        langExtension: a,
        numberLines: i,
        sourceNode: r,
        pre: 1,
        sourceCode: null,
        basePos: null,
        spans: null,
        decorations: null,
      };
      return u(s), r.innerHTML;
    }
    function p(e, t) {
      function n(e) {
        return r.getElementsByTagName(e);
      }
      function a() {
        for (
          var t = f.PR_SHOULD_USE_CONTINUATION ? g.now() + 250 : 1 / 0;
          m < l.length && g.now() < t;
          m++
        ) {
          for (var n = l[m], r = y, c = n; (c = c.previousSibling); ) {
            var d = c.nodeType,
              p = (7 === d || 8 === d) && c.nodeValue;
            if (p ? !/^\??prettify\b/.test(p) : 3 !== d || /\S/.test(c.nodeValue)) break;
            if (p) {
              (r = {}),
                p.replace(/\b(\w+)=([\w:.%+-]+)/g, function(e, t, n) {
                  r[t] = n;
                });
              break;
            }
          }
          var h = n.className;
          if ((r !== y || b.test(h)) && !k.test(h)) {
            for (var S = !1, E = n.parentNode; E; E = E.parentNode) {
              var C = E.tagName;
              if ($.test(C) && E.className && b.test(E.className)) {
                S = !0;
                break;
              }
            }
            if (!S) {
              n.className += ' prettyprinted';
              var T = r.lang;
              if (!T) {
                T = h.match(v);
                var j;
                !T && (j = i(n)) && x.test(j.tagName) && (T = j.className.match(v)), T && (T = T[1]);
              }
              var I;
              if (w.test(n.tagName)) I = 1;
              else {
                var P = n.currentStyle,
                  O = s.defaultView,
                  _ = P
                    ? P.whiteSpace
                    : O && O.getComputedStyle
                    ? O.getComputedStyle(n, null).getPropertyValue('white-space')
                    : 0;
                I = _ && 'pre' === _.substring(0, 3);
              }
              var A = r.linenums;
              (A = 'true' === A || +A) ||
                ((A = h.match(/\blinenums\b(?::(\d+))?/)),
                (A = A ? (A[1] && A[1].length ? +A[1] : !0) : !1)),
                A && o(n, A, I);
              var R = {
                langExtension: T,
                sourceNode: n,
                numberLines: A,
                pre: I,
                sourceCode: null,
                basePos: null,
                spans: null,
                decorations: null,
              };
              u(R);
            }
          }
        }
        m < l.length ? f.setTimeout(a, 250) : 'function' == typeof e && e();
      }
      for (
        var r = t || document.body,
          s = r.ownerDocument || document,
          c = [n('pre'), n('code'), n('xmp')],
          l = [],
          d = 0;
        d < c.length;
        ++d
      )
        for (var p = 0, h = c[d].length; h > p; ++p) l.push(c[d][p]);
      c = null;
      var g = Date;
      g.now ||
        (g = {
          now: function() {
            return +new Date();
          },
        });
      var m = 0,
        v = /\blang(?:uage)?-([\w.]+)(?!\S)/,
        b = /\bprettyprint\b/,
        k = /\bprettyprinted\b/,
        w = /pre|xmp/i,
        x = /^code$/i,
        $ = /^(?:pre|code|xmp)$/i,
        y = {};
      a();
    }
    var f = window,
      h = ['break,continue,do,else,for,if,return,while'],
      g = [
        h,
        'auto,case,char,const,default,double,enum,extern,float,goto,inline,int,long,register,short,' +
        'signed,sizeof,static,struct,switch,typedef,union,unsigned,void,volatile',
      ],
      m = [
        g,
        'catch,class,delete,false,import,new,operator,private,protected,public,this,throw,true,try,typeof',
      ],
      v = [
        m,
        'alignof,align_union,asm,axiom,bool,concept,concept_map,const_cast,constexpr,decltype,delegate,' +
        'dynamic_cast,explicit,export,friend,generic,late_check,mutable,namespace,nullptr,property,reinterpret_cast,' +
        'static_assert,static_cast,template,typeid,typename,using,virtual,where',
      ],
      b = [
        m,
        'abstract,assert,boolean,byte,extends,finally,final,implements,import,instanceof,interface,null,' +
        'native,package,strictfp,super,synchronized,throws,transient',
      ],
      k = [
        m,
        'abstract,as,base,bool,by,byte,checked,decimal,delegate,descending,dynamic,event,finally,fixed,' +
        'foreach,from,group,implicit,in,interface,internal,into,is,let,lock,null,object,out,override,' +
        'orderby,params,partial,readonly,ref,sbyte,sealed,stackalloc,string,select,uint,ulong,unchecked,' +
        'unsafe,ushort,var,virtual,where',
      ],
      w =
        'all,and,by,catch,class,else,extends,false,finally,for,if,in,is,isnt,loop,new,no,not,null,of,' +
        'off,on,or,return,super,then,throw,true,try,unless,until,when,while,yes',
      x = [
        m,
        'abstract,async,await,constructor,debugger,enum,eval,export,function,get,implements,instanceof,' +
        'interface,let,null,set,undefined,var,with,yield,Infinity,NaN',
      ],
      $ =
        'caller,delete,die,do,dump,elsif,eval,exit,foreach,for,goto,if,import,last,local,my,next,no,' +
        'our,print,package,redo,require,sub,undef,unless,until,use,wantarray,while,BEGIN,END',
      y = [
        h,
        'and,as,assert,class,def,del,elif,except,exec,finally,from,global,import,in,is,lambda,' +
        'nonlocal,not,or,pass,print,raise,try,with,yield,False,True,None',
      ],
      S = [
        h,
        'alias,and,begin,case,class,def,defined,elsif,end,ensure,false,in,module,next,nil,not,or,' +
        'redo,rescue,retry,self,super,then,true,undef,unless,until,when,yield,BEGIN,END',
      ],
      E = [
        h,
        'as,assert,const,copy,drop,enum,extern,fail,false,fn,impl,let,log,loop,match,mod,move,mut,' +
        'priv,pub,pure,ref,self,static,struct,true,trait,type,unsafe,use',
      ],
      C = [h, 'case,done,elif,esac,eval,fi,function,in,local,set,then,until'],
      T = [v, k, b, x, $, y, S, C],
      j = /^(DIR|FILE|vector|(de|priority_)?queue|list|stack|(const_)?iterator|(multi)?(set|map)|bitset|u?(int|float)\d*)\b/,
      I = 'str',
      P = 'kwd',
      O = 'com',
      _ = 'typ',
      A = 'lit',
      R = 'pun',
      M = 'pln',
      U = 'tag',
      D = 'dec',
      L = 'src',
      N = 'atn',
      q = 'atv',
      F = 'nocode',
      B = '(?:^^\\.?|[+-]|[!=]=?=?|\\#|%=?|&&?=?|\\(|\\*=?|[+\\-]=|->|\\/=?|::?|<<?=?|>>?>?=?|,|;|' +
        '\\?|@|\\[|~|{|\\^\\^?=?|\\|\\|?=?|break|case|continue|delete|do|else|finally|instanceof|return|throw|try|typeof)\\s*',
      V = /\S/,
      z = r({
        keywords: T,
        hashComments: !0,
        cStyleComments: !0,
        multiLineStrings: !0,
        regexLiterals: !0,
      }),
      H = {};
    c(z, ['default-code']),
      c(
        a(
          [],
          [
            [M, /^[^<?]+/],
            [D, /^<!\w[^>]*(?:>|$)/],
            [O, /^<\!--[\s\S]*?(?:-\->|$)/],
            ['lang-', /^<\?([\s\S]+?)(?:\?>|$)/],
            ['lang-', /^<%([\s\S]+?)(?:%>|$)/],
            [R, /^(?:<[%?]|[%?]>)/],
            ['lang-', /^<xmp\b[^>]*>([\s\S]+?)<\/xmp\b[^>]*>/i],
            ['lang-js', /^<script\b[^>]*>([\s\S]*?)(<\/script\b[^>]*>)/i],
            ['lang-css', /^<style\b[^>]*>([\s\S]*?)(<\/style\b[^>]*>)/i],
            ['lang-in.tag', /^(<\/?[a-z][^<>]*>)/i],
          ]
        ),
        ['default-markup', 'htm', 'html', 'mxml', 'xhtml', 'xml', 'xsl']
      ),
      c(
        a(
          [[M, /^[\s]+/, null, ' 	\r\n'], [q, /^(?:\"[^\"]*\"?|\'[^\']*\'?)/, null, '"\'']],
          [
            [U, /^^<\/?[a-z](?:[\w.:-]*\w)?|\/?>$/i],
            [N, /^(?!style[\s=]|on)[a-z](?:[\w:-]*\w)?/i],
            ['lang-uq.val', /^=\s*([^>\'\"\s]*(?:[^>\'\"\s\/]|\/(?=\s)))/],
            [R, /^[=<>\/]+/],
            ['lang-js', /^on\w+\s*=\s*\"([^\"]+)\"/i],
            ['lang-js', /^on\w+\s*=\s*\'([^\']+)\'/i],
            ['lang-js', /^on\w+\s*=\s*([^\"\'>\s]+)/i],
            ['lang-css', /^style\s*=\s*\"([^\"]+)\"/i],
            ['lang-css', /^style\s*=\s*\'([^\']+)\'/i],
            ['lang-css', /^style\s*=\s*([^\"\'>\s]+)/i],
          ]
        ),
        ['in.tag']
      ),
      c(a([], [[q, /^[\s\S]+/]]), ['uq.val']),
      c(r({keywords: v, hashComments: !0, cStyleComments: !0, types: j}), [
        'c',
        'cc',
        'cpp',
        'cxx',
        'cyc',
        'm',
      ]),
      c(r({keywords: 'null,true,false'}), ['json']),
      c(r({keywords: k, hashComments: !0, cStyleComments: !0, verbatimStrings: !0, types: j}), [
        'cs',
      ]),
      c(r({keywords: b, cStyleComments: !0}), ['java']),
      c(r({keywords: C, hashComments: !0, multiLineStrings: !0}), ['bash', 'bsh', 'csh', 'sh']),
      c(r({keywords: y, hashComments: !0, multiLineStrings: !0, tripleQuotedStrings: !0}), [
        'cv',
        'py',
        'python',
      ]),
      c(r({keywords: $, hashComments: !0, multiLineStrings: !0, regexLiterals: 2}), [
        'perl',
        'pl',
        'pm',
      ]),
      c(r({keywords: S, hashComments: !0, multiLineStrings: !0, regexLiterals: !0}), ['rb', 'ruby']),
      c(r({keywords: x, cStyleComments: !0, regexLiterals: !0}), [
        'javascript',
        'js',
        'ts',
        'typescript',
      ]),
      c(
        r({
          keywords: w,
          hashComments: 3,
          cStyleComments: !0,
          multilineStrings: !0,
          tripleQuotedStrings: !0,
          regexLiterals: !0,
        }),
        ['coffee']
      ),
      c(r({keywords: E, cStyleComments: !0, multilineStrings: !0}), ['rc', 'rs', 'rust']),
      c(a([], [[I, /^[\s\S]+/]]), ['regex']);
    var W = (f.PR = {
        createSimpleLexer: a,
        registerLangHandler: c,
        sourceDecorator: r,
        PR_ATTRIB_NAME: N,
        PR_ATTRIB_VALUE: q,
        PR_COMMENT: O,
        PR_DECLARATION: D,
        PR_KEYWORD: P,
        PR_LITERAL: A,
        PR_NOCODE: F,
        PR_PLAIN: M,
        PR_PUNCTUATION: R,
        PR_SOURCE: L,
        PR_STRING: I,
        PR_TAG: U,
        PR_TYPE: _,
        prettyPrintOne: IN_GLOBAL_SCOPE ? (f.prettyPrintOne = d) : (prettyPrintOne = d),
        prettyPrint: (prettyPrint = IN_GLOBAL_SCOPE ? (f.prettyPrint = p) : (prettyPrint = p)),
      }),
      G = f.define;
    'function' == typeof G &&
      G.amd &&
      G('google-code-prettify', [], function() {
        return W;
      });
  })();
  var PR = window.PR;
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        ['opn', /^[\(\{\[]+/, null, '([{'],
        ['clo', /^[\)\}\]]+/, null, ')]}'],
        [PR.PR_COMMENT, /^;[^\r\n]*/, null, ';'],
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [PR.PR_STRING, /^\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)/, null, '"'],
      ],
      [
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:def|if|do|let|quote|var|fn|loop|recur|throw|try|monitor-enter|monitor-exit|defmacro|defn|defn-|
            macroexpand|macroexpand-1|for|doseq|dosync|dotimes|and|or|when|not|assert|doto|proxy|defstruct|first|
            rest|cons|defprotocol|deftype|defrecord|reify|defmulti|defmethod|meta|with-meta|ns|in-ns|create-ns|
            import|intern|refer|alias|namespace|resolve|ref|deref|refset|new|set!|memfn|to-array|into-array|aset|
            gen-class|reduce|map|filter|find|nil?|empty?|hash-map|hash-set|vec|vector|seq|flatten|reverse|assoc|
            dissoc|list|list?|disj|get|union|difference|intersection|extend|extend-type|extend-protocol|prn)\\b`.replace(/\s/g, '')),
          null,
        ],
        [PR.PR_TYPE, /^:[0-9a-zA-Z\-]+/],
      ]
    ),
    ['clj']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [[PR.PR_PLAIN, /^[ \t\r\n\f]+/, null, ' 	\r\n\f']],
      [
        [PR.PR_STRING, /^\"(?:[^\n\r\f\\\"]|\\(?:\r\n?|\n|\f)|\\[\s\S])*\"/, null],
        [PR.PR_STRING, /^\'(?:[^\n\r\f\\\']|\\(?:\r\n?|\n|\f)|\\[\s\S])*\'/, null],
        ['lang-css-str', /^url\(([^\)\"\']+)\)/i],
        [
          PR.PR_KEYWORD,
          /^(?:url|rgb|\!important|@import|@page|@media|@charset|inherit)(?=[^\-\w]|$)/i,
          null,
        ],
        [
          'lang-css-kw',
          /^(-?(?:[_a-z]|(?:\\[0-9a-f]+ ?))(?:[_a-z0-9\-]|\\(?:\\[0-9a-f]+ ?))*)\s*:/i,
        ],
        [PR.PR_COMMENT, /^\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//],
        [PR.PR_COMMENT, /^(?:<!--|-->)/],
        [PR.PR_LITERAL, /^(?:\d+|\d*\.\d+)(?:%|[a-z]+)?/i],
        [PR.PR_LITERAL, /^#(?:[0-9a-f]{3}){1,2}\b/i],
        [PR.PR_PLAIN, /^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i],
        [PR.PR_PUNCTUATION, /^[^\s\w\'\"]+/],
      ]
    ),
    ['css']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [],
      [[PR.PR_KEYWORD, /^-?(?:[_a-z]|(?:\\[\da-f]+ ?))(?:[_a-z\d\-]|\\(?:\\[\da-f]+ ?))*/i]]
    ),
    ['css-kw']
  ),
  PR.registerLangHandler(PR.createSimpleLexer([], [[PR.PR_STRING, /^[^\)\"\']+/]]), ['css-str']),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [[PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  ']],
      [
        [PR.PR_COMMENT, /^#!(?:.*)/],
        [PR.PR_KEYWORD, /^\b(?:import|library|part of|part|as|show|hide)\b/i],
        [PR.PR_COMMENT, /^\/\/(?:.*)/],
        [PR.PR_COMMENT, /^\/\*[^*]*\*+(?:[^\/*][^*]*\*+)*\//],
        [PR.PR_KEYWORD, /^\b(?:class|interface)\b/i],
        [
          PR.PR_KEYWORD,
          /^\b(?:assert|async|await|break|case|catch|continue|default|do|else|finally|for|if|in|is|new|return|super|switch|sync|this|throw|try|while)\b/i,
        ],
        [
          PR.PR_KEYWORD,
          /^\b(?:abstract|const|extends|factory|final|get|implements|native|operator|set|static|typedef|var)\b/i,
        ],
        [PR.PR_TYPE, /^\b(?:bool|double|Dynamic|int|num|Object|String|void)\b/i],
        [PR.PR_KEYWORD, /^\b(?:false|null|true)\b/i],
        [PR.PR_STRING, /^r?[\']{3}[\s|\S]*?[^\\][\']{3}/],
        [PR.PR_STRING, /^r?[\"]{3}[\s|\S]*?[^\\][\"]{3}/],
        [PR.PR_STRING, /^r?\'(\'|(?:[^\n\r\f])*?[^\\]\')/],
        [PR.PR_STRING, /^r?\"(\"|(?:[^\n\r\f])*?[^\\]\")/],
        [PR.PR_TYPE, /^[A-Z]\w*/],
        [PR.PR_PLAIN, /^[a-z_$][a-z0-9_]*/i],
        [PR.PR_PUNCTUATION, /^[~!%^&*+=|?:<>\/-]/],
        [PR.PR_LITERAL, /^\b0x[0-9a-f]+/i],
        [PR.PR_LITERAL, /^\b\d+(?:\.\d*)?(?:e[+-]?\d+)?/i],
        [PR.PR_LITERAL, /^\b\.\d+(?:e[+-]?\d+)?/i],
        [PR.PR_PUNCTUATION, /^[(){}\[\],.;]/],
      ]
    ),
    ['dart']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\x0B\x0C\r ]+/, null, '	\n\f\r '],
        [PR.PR_STRING, /^\"(?:[^\"\\\n\x0C\r]|\\[\s\S])*(?:\"|$)/, null, '"'],
        [PR.PR_LITERAL, /^[a-z][a-zA-Z0-9_]*/],
        [PR.PR_LITERAL, /^\'(?:[^\'\\\n\x0C\r]|\\[^&])+\'?/, null, "'"],
        [PR.PR_LITERAL, /^\?[^ \t\n({]+/, null, '?'],
        [
          PR.PR_LITERAL,
          /^(?:0o[0-7]+|0x[\da-f]+|\d+(?:\.\d+)?(?:e[+\-]?\d+)?)/i,
          null,
          '0123456789',
        ],
      ],
      [
        [PR.PR_COMMENT, /^%[^\n]*/],
        [
          PR.PR_KEYWORD,
          /^(?:module|attributes|do|let|in|letrec|apply|call|primop|case|of|end|when|fun|try|catch|receive|after|char|integer|float,atom,string,var)\b/,
        ],
        [PR.PR_KEYWORD, /^-[a-z_]+/],
        [PR.PR_TYPE, /^[A-Z_][a-zA-Z0-9_]*/],
        [PR.PR_PUNCTUATION, /^[.,;]/],
      ]
    ),
    ['erlang', 'erl']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [
          PR.PR_PLAIN,
          /^(?:\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)|\'(?:[^\'\\]|\\[\s\S])+(?:\'|$)|`[^`]*(?:`|$))/,
          null,
          '"\'',
        ],
      ],
      [
        [PR.PR_COMMENT, /^(?:\/\/[^\r\n]*|\/\*[\s\S]*?\*\/)/],
        [PR.PR_PLAIN, /^(?:[^\/\"\'`]|\/(?![\/\*]))+/i],
      ]
    ),
    ['go']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\x0B\x0C\r ]+/, null, '	\n\f\r '],
        [PR.PR_STRING, /^\"(?:[^\"\\\n\x0C\r]|\\[\s\S])*(?:\"|$)/, null, '"'],
        [PR.PR_STRING, /^\'(?:[^\'\\\n\x0C\r]|\\[^&])\'?/, null, "'"],
        [
          PR.PR_LITERAL,
          /^(?:0o[0-7]+|0x[\da-f]+|\d+(?:\.\d+)?(?:e[+\-]?\d+)?)/i,
          null,
          '0123456789',
        ],
      ],
      [
        [PR.PR_COMMENT, /^(?:(?:--+(?:[^\r\n\x0C]*)?)|(?:\{-(?:[^-]|-+[^-\}])*-\}))/],
        [
          PR.PR_KEYWORD,
          /^(?:case|class|data|default|deriving|do|else|if|import|in|infix|infixl|infixr|instance|let|module|newtype|of|then|type|where|_)(?=[^a-zA-Z0-9\']|$)/,
          null,
        ],
        [PR.PR_PLAIN, /^(?:[A-Z][\w\']*\.)*[a-zA-Z][\w\']*/],
        [PR.PR_PUNCTUATION, /^[^\t\n\x0B\x0C\r a-zA-Z0-9\'\"]+/],
      ]
    ),
    ['hs']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        ['opn', /^\(+/, null, '('],
        ['clo', /^\)+/, null, ')'],
        [PR.PR_COMMENT, /^;[^\r\n]*/, null, ';'],
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [PR.PR_STRING, /^\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)/, null, '"'],
      ],
      [
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:block|c[ad]+r|catch|con[ds]|def(?:ine|un)|do|eq|eql|equal|equalp|
            eval-when|flet|format|go|if|labels|lambda|let|load-time-value|locally|macrolet|
            multiple-value-call|nil|progn|progv|quote|require|return-from|setq|symbol-macrolet|
            t|tagbody|the|throw|unwind)\\b`.replace(/\s/g, '')),
          null,
        ],
        [
          PR.PR_LITERAL,
          /^[+\-]?(?:[0#]x[0-9a-f]+|\d+\/\d+|(?:\.\d+|\d+(?:\.\d*)?)(?:[ed][+\-]?\d+)?)/i,
        ],
        [PR.PR_LITERAL, /^\'(?:-*(?:\w|\\[\x21-\x7e])(?:[\w-]*|\\[\x21-\x7e])[=!?]?)?/],
        [PR.PR_PLAIN, /^-*(?:[a-z_]|\\[\x21-\x7e])(?:[\w-]*|\\[\x21-\x7e])[=!?]?/i],
        [PR.PR_PUNCTUATION, /^[^\w\t\n\r \xA0()\"\\\';]+/],
      ]
    ),
    ['cl', 'el', 'lisp', 'lsp', 'scm', 'ss', 'rkt']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [
          PR.PR_STRING,
          /^(?:\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)|\'(?:[^\'\\]|\\[\s\S])*(?:\'|$))/,
          null,
          '"\'',
        ],
      ],
      [
        [PR.PR_COMMENT, /^--(?:\[(=*)\[[\s\S]*?(?:\]\1\]|$)|[^\r\n]*)/],
        [PR.PR_STRING, /^\[(=*)\[[\s\S]*?(?:\]\1\]|$)/],
        [
          PR.PR_KEYWORD,
          /^(?:and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/,
          null,
        ],
        [PR.PR_LITERAL, /^[+-]?(?:0x[\da-f]+|(?:(?:\.\d+|\d+(?:\.\d*)?)(?:e[+\-]?\d+)?))/i],
        [PR.PR_PLAIN, /^[a-z_]\w*/i],
        [PR.PR_PUNCTUATION, /^[^\w\t\n\r \xA0][^\w\t\n\r \xA0\"\'\-\+=]*/],
      ]
    ),
    ['lua']
  ),
  (function(e) {
    var t = 'ident',
      n = 'const',
      i = 'fun',
      a = 'fun_tbx',
      r = 'syscmd',
      o = 'codeoutput',
      s = 'err',
      c = 'wrn',
      l = 'transpose',
      u = 'linecont',
      d = `abs|accumarray|acos(?:d|h)?|acot(?:d|h)?|acsc(?:d|h)?|actxcontrol(?:list|select)?|
actxGetRunningServer|actxserver|addlistener|addpath|addpref|addtodate|airy|align|alim|all|allchild|
alpha|alphamap|amd|ancestor|and|angle|annotation|any|area|arrayfun|asec(?:d|h)?|asin(?:d|h)?|assert|
assignin|atan(?:2|d|h)?|audiodevinfo|audioplayer|audiorecorder|aufinfo|auread|autumn|auwrite|avifile|
aviinfo|aviread|axes|axis|balance|bar(?:3|3h|h)?|base2dec|beep|BeginInvoke|bench|bessel(?:h|i|j|k|y)|
beta|betainc|betaincinv|betaln|bicg|bicgstab|bicgstabl|bin2dec|bitand|bitcmp|bitget|bitmax|bitnot|
bitor|bitset|bitshift|bitxor|blanks|blkdiag|bone|box|brighten|brush|bsxfun|builddocsearchdb|builtin|
bvp4c|bvp5c|bvpget|bvpinit|bvpset|bvpxtend|calendar|calllib|callSoapService|camdolly|cameratoolbar|
camlight|camlookat|camorbit|campan|campos|camproj|camroll|camtarget|camup|camva|camzoom|cart2pol|
cart2sph|cast|cat|caxis|cd|cdf2rdf|cdfepoch|cdfinfo|cdflib(?:.(?:close|closeVar|computeEpoch|
computeEpoch16|create|createAttr|createVar|delete|deleteAttr|deleteAttrEntry|deleteAttrgEntry|
deleteVar|deleteVarRecords|epoch16Breakdown|epochBreakdown|getAttrEntry|getAttrgEntry|
getAttrMaxEntry|getAttrMaxgEntry|getAttrName|getAttrNum|getAttrScope|getCacheSize|getChecksum|
getCompression|getCompressionCacheSize|getConstantNames|getConstantValue|getCopyright|
getFileBackward|getFormat|getLibraryCopyright|getLibraryVersion|getMajority|getName|
getNumAttrEntries|getNumAttrgEntries|getNumAttributes|getNumgAttributes|getReadOnlyMode|
getStageCacheSize|getValidate|getVarAllocRecords|getVarBlockingFactor|getVarCacheSize|
getVarCompression|getVarData|getVarMaxAllocRecNum|getVarMaxWrittenRecNum|getVarName|getVarNum|
getVarNumRecsWritten|getVarPadValue|getVarRecordData|getVarReservePercent|getVarsMaxWrittenRecNum|
getVarSparseRecords|getVersion|hyperGetVarData|hyperPutVarData|inquire|inquireAttr|inquireAttrEntry|
inquireAttrgEntry|inquireVar|open|putAttrEntry|putAttrgEntry|putVarData|putVarRecordData|renameAttr|
renameVar|setCacheSize|setChecksum|setCompression|setCompressionCacheSize|setFileBackward|setFormat|
setMajority|setReadOnlyMode|setStageCacheSize|setValidate|setVarAllocBlockRecords|
setVarBlockingFactor|setVarCacheSize|setVarCompression|setVarInitialRecs|setVarPadValue|
SetVarReservePercent|setVarsCacheSize|setVarSparseRecords))?|cdfread|cdfwrite|ceil|cell2mat|
cell2struct|celldisp|cellfun|cellplot|cellstr|cgs|checkcode|checkin|checkout|chol|cholinc|cholupdate|
circshift|cla|clabel|class|clc|clear|clearvars|clf|clipboard|clock|close|closereq|cmopts|cmpermute|
cmunique|colamd|colon|colorbar|colordef|colormap|colormapeditor|colperm|Combine|comet|comet3|
commandhistory|commandwindow|compan|compass|complex|computer|cond|condeig|condest|coneplot|conj|
containers.Map|contour(?:3|c|f|slice)?|contrast|conv|conv2|convhull|convhulln|convn|cool|copper|
copyfile|copyobj|corrcoef|cos(?:d|h)?|cot(?:d|h)?|cov|cplxpair|cputime|createClassFromWsdl|
createSoapMessage|cross|csc(?:d|h)?|csvread|csvwrite|ctranspose|cumprod|cumsum|cumtrapz|curl|
customverctrl|cylinder|daqread|daspect|datacursormode|datatipinfo|date|datenum|datestr|datetick|
datevec|dbclear|dbcont|dbdown|dblquad|dbmex|dbquit|dbstack|dbstatus|dbstep|dbstop|dbtype|dbup|dde23|
ddeget|ddesd|ddeset|deal|deblank|dec2base|dec2bin|dec2hex|decic|deconv|del2|delaunay|delaunay3|
delaunayn|DelaunayTri|delete|demo|depdir|depfun|det|detrend|deval|diag|dialog|diary|diff|diffuse|dir|
disp|display|dither|divergence|dlmread|dlmwrite|dmperm|doc|docsearch|dos|dot|dragrect|drawnow|
dsearch|dsearchn|dynamicprops|echo|echodemo|edit|eig|eigs|ellipj|ellipke|ellipsoid|empty|
enableNETfromNetworkDrive|enableservice|EndInvoke|enumeration|eomday|eq|erf|erfc|erfcinv|erfcx|
erfinv|error|errorbar|errordlg|etime|etree|etreeplot|eval|evalc|evalin|event.(?:EventData|listener|
PropertyEvent|proplistener)|exifread|exist|exit|exp|expint|expm|expm1|export2wsdlg|eye|ezcontour|
ezcontourf|ezmesh|ezmeshc|ezplot|ezplot3|ezpolar|ezsurf|ezsurfc|factor|factorial|fclose|feather|
feature|feof|ferror|feval|fft|fft2|fftn|fftshift|fftw|fgetl|fgets|fieldnames|figure|figurepalette|
fileattrib|filebrowser|filemarker|fileparts|fileread|filesep|fill|fill3|filter|filter2|find|findall|
findfigs|findobj|findstr|finish|fitsdisp|fitsinfo|fitsread|fitswrite|fix|flag|flipdim|fliplr|flipud|
floor|flow|fminbnd|fminsearch|fopen|format|fplot|fprintf|frame2im|fread|freqspace|frewind|fscanf|
fseek|ftell|FTP|full|fullfile|func2str|functions|funm|fwrite|fzero|gallery|gamma|gammainc|
gammaincinv|gammaln|gca|gcbf|gcbo|gcd|gcf|gco|ge|genpath|genvarname|get|getappdata|getenv|getfield|
getframe|getpixelposition|getpref|ginput|gmres|gplot|grabcode|gradient|gray|graymon|grid|
griddata(?:3|n)?|griddedInterpolant|gsvd|gt|gtext|guidata|guide|guihandles|gunzip|gzip|h5create|
h5disp|h5info|h5read|h5readatt|h5write|h5writeatt|hadamard|handle|hankel|hdf|hdf5|hdf5info|hdf5read|
hdf5write|hdfinfo|hdfread|hdftool|help|helpbrowser|helpdesk|helpdlg|helpwin|hess|hex2dec|hex2num|
hgexport|hggroup|hgload|hgsave|hgsetget|hgtransform|hidden|hilb|hist|histc|hold|home|horzcat|hostid|
hot|hsv|hsv2rgb|hypot|ichol|idivide|ifft|ifft2|ifftn|ifftshift|ilu|im2frame|im2java|imag|image|
imagesc|imapprox|imfinfo|imformats|import|importdata|imread|imwrite|ind2rgb|ind2sub|inferiorto|info|
inline|inmem|inpolygon|input|inputdlg|inputname|inputParser|inspect|instrcallback|instrfind|
instrfindall|int2str|integral(?:2|3)?|interp(?:1|1q|2|3|ft|n)|interpstreamspeed|intersect|intmax|
intmin|inv|invhilb|ipermute|isa|isappdata|iscell|iscellstr|ischar|iscolumn|isdir|isempty|isequal|
isequaln|isequalwithequalnans|isfield|isfinite|isfloat|isglobal|ishandle|ishghandle|ishold|isinf|
isinteger|isjava|iskeyword|isletter|islogical|ismac|ismatrix|ismember|ismethod|isnan|isnumeric|
isobject|isocaps|isocolors|isonormals|isosurface|ispc|ispref|isprime|isprop|isreal|isrow|isscalar|
issorted|isspace|issparse|isstr|isstrprop|isstruct|isstudent|isunix|isvarname|isvector|javaaddpath|
javaArray|javachk|javaclasspath|javacomponent|javaMethod|javaMethodEDT|javaObject|javaObjectEDT|
javarmpath|jet|keyboard|kron|lasterr|lasterror|lastwarn|lcm|ldivide|ldl|le|legend|legendre|length|
libfunctions|libfunctionsview|libisloaded|libpointer|libstruct|license|light|lightangle|lighting|
lin2mu|line|lines|linkaxes|linkdata|linkprop|linsolve|linspace|listdlg|listfonts|load|loadlibrary|
loadobj|log|log10|log1p|log2|loglog|logm|logspace|lookfor|lower|ls|lscov|lsqnonneg|lsqr|lt|lu|luinc|
magic|makehgtform|mat2cell|mat2str|material|matfile|matlab.io.MatFile|matlab.mixin.(?:Copyable|
Heterogeneous(?:.getDefaultScalarElement)?)|matlabrc|matlabroot|max|maxNumCompThreads|mean|median|
membrane|memmapfile|memory|menu|mesh|meshc|meshgrid|meshz|meta.(?:class(?:.fromName)?|
DynamicProperty|EnumeratedValue|event|MetaData|method|package(?:.(?:fromName|getAllPackages))?|
property)|metaclass|methods|methodsview|mex(?:.getCompilerConfigurations)?|MException|mexext|
mfilename|min|minres|minus|mislocked|mkdir|mkpp|mldivide|mlint|mlintrpt|mlock|mmfileinfo|mmreader|
mod|mode|more|move|movefile|movegui|movie|movie2avi|mpower|mrdivide|msgbox|mtimes|mu2lin|
multibandread|multibandwrite|munlock|namelengthmax|nargchk|narginchk|nargoutchk|native2unicode|
nccreate|ncdisp|nchoosek|ncinfo|ncread|ncreadatt|ncwrite|ncwriteatt|ncwriteschema|ndgrid|ndims|ne|
NET(?:.(?:addAssembly|Assembly|convertArray|createArray|createGeneric|disableAutoRelease|
enableAutoRelease|GenericClass|invokeGenericMethod|NetException|setStaticProperty))?|netcdf.(?:abort|
close|copyAtt|create|defDim|defGrp|defVar|defVarChunking|defVarDeflate|defVarFill|defVarFletcher32|
delAtt|endDef|getAtt|getChunkCache|getConstant|getConstantNames|getVar|inq|inqAtt|inqAttID|
inqAttName|inqDim|inqDimID|inqDimIDs|inqFormat|inqGrpName|inqGrpNameFull|inqGrpParent|inqGrps|
inqLibVers|inqNcid|inqUnlimDims|inqVar|inqVarChunking|inqVarDeflate|inqVarFill|inqVarFletcher32|
inqVarID|inqVarIDs|open|putAtt|putVar|reDef|renameAtt|renameDim|renameVar|setChunkCache|
setDefaultFormat|setFill|sync)|newplot|nextpow2|nnz|noanimate|nonzeros|norm|normest|not|notebook|now|
nthroot|null|num2cell|num2hex|num2str|numel|nzmax|ode(?:113|15i|15s|23|23s|23t|23tb|45)|odeget|
odeset|odextend|onCleanup|ones|open|openfig|opengl|openvar|optimget|optimset|or|ordeig|orderfields|
ordqz|ordschur|orient|orth|pack|padecoef|pagesetupdlg|pan|pareto|parseSoapResponse|pascal|patch|path|
path2rc|pathsep|pathtool|pause|pbaspect|pcg|pchip|pcode|pcolor|pdepe|pdeval|peaks|perl|perms|permute|
pie|pink|pinv|planerot|playshow|plot|plot3|plotbrowser|plotedit|plotmatrix|plottools|plotyy|plus|
pol2cart|polar|poly|polyarea|polyder|polyeig|polyfit|polyint|polyval|polyvalm|pow2|power|ppval|
prefdir|preferences|primes|print|printdlg|printopt|printpreview|prod|profile|profsave|propedit|
propertyeditor|psi|publish|PutCharArray|PutFullMatrix|PutWorkspaceData|pwd|qhull|qmr|qr|qrdelete|
qrinsert|qrupdate|quad|quad2d|quadgk|quadl|quadv|questdlg|quit|quiver|quiver3|qz|rand|randi|randn|
randperm|RandStream(?:.(?:create|getDefaultStream|getGlobalStream|list|setDefaultStream|
setGlobalStream))?|rank|rat|rats|rbbox|rcond|rdivide|readasync|real|reallog|realmax|realmin|realpow|
realsqrt|record|rectangle|rectint|recycle|reducepatch|reducevolume|refresh|refreshdata|regexp|
regexpi|regexprep|regexptranslate|rehash|rem|Remove|RemoveAll|repmat|reset|reshape|residue|
restoredefaultpath|rethrow|rgb2hsv|rgb2ind|rgbplot|ribbon|rmappdata|rmdir|rmfield|rmpath|rmpref|rng|
roots|rose|rosser|rot90|rotate|rotate3d|round|rref|rsf2csf|run|save|saveas|saveobj|savepath|scatter|
scatter3|schur|sec|secd|sech|selectmoveresize|semilogx|semilogy|sendmail|serial|set|setappdata|
setdiff|setenv|setfield|setpixelposition|setpref|setstr|setxor|shading|shg|shiftdim|showplottool|
shrinkfaces|sign|sin(?:d|h)?|size|slice|smooth3|snapnow|sort|sortrows|sound|soundsc|spalloc|
spaugment|spconvert|spdiags|specular|speye|spfun|sph2cart|sphere|spinmap|spline|spones|spparms|
sprand|sprandn|sprandsym|sprank|spring|sprintf|spy|sqrt|sqrtm|squeeze|ss2tf|sscanf|stairs|startup|
std|stem|stem3|stopasync|str2double|str2func|str2mat|str2num|strcat|strcmp|strcmpi|stream2|stream3|
streamline|streamparticles|streamribbon|streamslice|streamtube|strfind|strjust|strmatch|strncmp|
strncmpi|strread|strrep|strtok|strtrim|struct2cell|structfun|strvcat|sub2ind|subplot|subsasgn|
subsindex|subspace|subsref|substruct|subvolume|sum|summer|superclasses|superiorto|support|surf|
surf2patch|surface|surfc|surfl|surfnorm|svd|svds|swapbytes|symamd|symbfact|symmlq|symrcm|symvar|
system|tan(?:d|h)?|tar|tempdir|tempname|tetramesh|texlabel|text|textread|textscan|textwrap|tfqmr|
throw|tic|Tiff(?:.(?:getTagNames|getVersion))?|timer|timerfind|timerfindall|times|timeseries|title|
toc|todatenum|toeplitz|toolboxdir|trace|transpose|trapz|treelayout|treeplot|tril|trimesh|triplequad|
triplot|TriRep|TriScatteredInterp|trisurf|triu|tscollection|tsearch|tsearchn|tstool|type|typecast|
uibuttongroup|uicontextmenu|uicontrol|uigetdir|uigetfile|uigetpref|uiimport|uimenu|uiopen|uipanel|
uipushtool|uiputfile|uiresume|uisave|uisetcolor|uisetfont|uisetpref|uistack|uitable|uitoggletool|
uitoolbar|uiwait|uminus|undocheckout|unicode2native|union|unique|unix|unloadlibrary|unmesh|unmkpp|
untar|unwrap|unzip|uplus|upper|urlread|urlwrite|usejava|userpath|validateattributes|validatestring|
vander|var|vectorize|ver|verctrl|verLessThan|version|vertcat|VideoReader(?:.isPlatformSupported)?|
VideoWriter(?:.getProfiles)?|view|viewmtx|visdiff|volumebounds|voronoi|voronoin|wait|waitbar|waitfor|
waitforbuttonpress|warndlg|warning|waterfall|wavfinfo|wavplay|wavread|wavrecord|wavwrite|web|weekday|
what|whatsnew|which|whitebg|who|whos|wilkinson|winopen|winqueryreg|winter|wk1finfo|wk1read|wk1write|
workspace|xlabel|xlim|xlsfinfo|xlsread|xlswrite|xmlread|xmlwrite|xor|xslt|ylabel|ylim|zeros|zip|
zlabel|zlim|zoom`.replace(/\s/g, ''),
      p = `addedvarplot|andrewsplot|anova(?:1|2|n)|ansaribradley|aoctool|barttest|bbdesign|beta(?:cdf|fit|inv|
like|pdf|rnd|stat)|bino(?:cdf|fit|inv|pdf|rnd|stat)|biplot|bootci|bootstrp|boxplot|candexch|candgen|
canoncorr|capability|capaplot|caseread|casewrite|categorical|ccdesign|cdfplot|chi2(?:cdf|gof|inv|pdf|
rnd|stat)|cholcov|Classification(?:BaggedEnsemble|Discriminant(?:.(?:fit|make|template))?|Ensemble|
KNN(?:.(?:fit|template))?|PartitionedEnsemble|PartitionedModel|Tree(?:.(?:fit|template))?)|classify|
classregtree|cluster|clusterdata|cmdscale|combnk|Compact(?:Classification(?:Discriminant|Ensemble|
Tree)|Regression(?:Ensemble|Tree)|TreeBagger)|confusionmat|controlchart|controlrules|cophenet|
copula(?:cdf|fit|param|pdf|rnd|stat)|cordexch|corr|corrcov|coxphfit|createns|crosstab|crossval|
cvpartition|datasample|dataset|daugment|dcovary|dendrogram|dfittool|disttool|dummyvar|dwtest|ecdf|
ecdfhist|ev(?:cdf|fit|inv|like|pdf|rnd|stat)|ExhaustiveSearcher|exp(?:cdf|fit|inv|like|pdf|rnd|stat)|
factoran|fcdf|ff2n|finv|fitdist|fitensemble|fpdf|fracfact|fracfactgen|friedman|frnd|fstat|fsurfht|
fullfact|gagerr|gam(?:cdf|fit|inv|like|pdf|rnd|stat)|GeneralizedLinearModel(?:.fit)?|geo(?:cdf|inv|
mean|pdf|rnd|stat)|gev(?:cdf|fit|inv|like|pdf|rnd|stat)|gline|glmfit|glmval|glyphplot|
gmdistribution(?:.fit)?|gname|gp(?:cdf|fit|inv|like|pdf|rnd|stat)|gplotmatrix|grp2idx|grpstats|
gscatter|haltonset|harmmean|hist3|histfit|hmm(?:decode|estimate|generate|train|viterbi)|hougen|
hyge(?:cdf|inv|pdf|rnd|stat)|icdf|inconsistent|interactionplot|invpred|iqr|iwishrnd|jackknife|jbtest|
johnsrnd|KDTreeSearcher|kmeans|knnsearch|kruskalwallis|ksdensity|kstest|kstest2|kurtosis|lasso|
lassoglm|lassoPlot|leverage|lhsdesign|lhsnorm|lillietest|LinearModel(?:.fit)?|linhyptest|linkage|
logn(?:cdf|fit|inv|like|pdf|rnd|stat)|lsline|mad|mahal|maineffectsplot|manova1|manovacluster|mdscale|
mhsample|mle|mlecov|mnpdf|mnrfit|mnrnd|mnrval|moment|multcompare|multivarichart|mvn(?:cdf|pdf|rnd)|
mvregress|mvregresslike|mvt(?:cdf|pdf|rnd)|NaiveBayes(?:.fit)?|nan(?:cov|max|mean|median|min|std|sum|
var)|nbin(?:cdf|fit|inv|pdf|rnd|stat)|ncf(?:cdf|inv|pdf|rnd|stat)|nct(?:cdf|inv|pdf|rnd|stat)|
ncx2(?:cdf|inv|pdf|rnd|stat)|NeighborSearcher|nlinfit|nlintool|nlmefit|nlmefitsa|nlparci|nlpredci|
nnmf|nominal|NonLinearModel(?:.fit)?|norm(?:cdf|fit|inv|like|pdf|rnd|stat)|normplot|normspec|ordinal|
outlierMeasure|parallelcoords|paretotails|partialcorr|pcacov|pcares|pdf|pdist|pdist2|pearsrnd|
perfcurve|perms|piecewisedistribution|plsregress|poiss(?:cdf|fit|inv|pdf|rnd|tat)|polyconf|polytool|
prctile|princomp|ProbDist(?:Kernel|Parametric|UnivKernel|UnivParam)?|probplot|procrustes|qqplot|
qrandset|qrandstream|quantile|randg|random|randsample|randtool|range|rangesearch|ranksum|rayl(?:cdf|
fit|inv|pdf|rnd|stat)|rcoplot|refcurve|refline|regress|Regression(?:BaggedEnsemble|Ensemble|
PartitionedEnsemble|PartitionedModel|Tree(?:.(?:fit|template))?)|regstats|relieff|ridge|robustdemo|
robustfit|rotatefactors|rowexch|rsmdemo|rstool|runstest|sampsizepwr|scatterhist|sequentialfs|
signrank|signtest|silhouette|skewness|slicesample|sobolset|squareform|statget|statset|stepwise|
stepwisefit|surfht|tabulate|tblread|tblwrite|tcdf|tdfread|tiedrank|tinv|tpdf|TreeBagger|treedisp|
treefit|treeprune|treetest|treeval|trimmean|trnd|tstat|ttest|ttest2|unid(?:cdf|inv|pdf|rnd|stat)|
unif(?:cdf|inv|it|pdf|rnd|stat)|vartest(?:2|n)?|wbl(?:cdf|fit|inv|like|pdf|rnd|stat)|wblplot|wishrnd|
x2fx|xptread|zscore|ztest`.replace(/\s/g, ''),
      f = `adapthisteq|analyze75info|analyze75read|applycform|applylut|axes2pix|bestblk|blockproc|bwarea|
bwareaopen|bwboundaries|bwconncomp|bwconvhull|bwdist|bwdistgeodesic|bweuler|bwhitmiss|bwlabel|
bwlabeln|bwmorph|bwpack|bwperim|bwselect|bwtraceboundary|bwulterode|bwunpack|checkerboard|col2im|
colfilt|conndef|convmtx2|corner|cornermetric|corr2|cp2tform|cpcorr|cpselect|cpstruct2pairs|dct2|
dctmtx|deconvblind|deconvlucy|deconvreg|deconvwnr|decorrstretch|demosaic|dicom(?:anon|dict|info|
lookup|read|uid|write)|edge|edgetaper|entropy|entropyfilt|fan2para|fanbeam|findbounds|fliptform|
freqz2|fsamp2|fspecial|ftrans2|fwind1|fwind2|getheight|getimage|getimagemodel|getline|getneighbors|
getnhood|getpts|getrangefromclass|getrect|getsequence|gray2ind|graycomatrix|graycoprops|graydist|
grayslice|graythresh|hdrread|hdrwrite|histeq|hough|houghlines|houghpeaks|iccfind|iccread|iccroot|
iccwrite|idct2|ifanbeam|im2bw|im2col|im2double|im2int16|im2java2d|im2single|im2uint16|im2uint8|
imabsdiff|imadd|imadjust|ImageAdapter|imageinfo|imagemodel|imapplymatrix|imattributes|imbothat|
imclearborder|imclose|imcolormaptool|imcomplement|imcontour|imcontrast|imcrop|imdilate|
imdisplayrange|imdistline|imdivide|imellipse|imerode|imextendedmax|imextendedmin|imfill|imfilter|
imfindcircles|imfreehand|imfuse|imgca|imgcf|imgetfile|imhandles|imhist|imhmax|imhmin|imimposemin|
imlincomb|imline|immagbox|immovie|immultiply|imnoise|imopen|imoverview|imoverviewpanel|impixel|
impixelinfo|impixelinfoval|impixelregion|impixelregionpanel|implay|impoint|impoly|impositionrect|
improfile|imputfile|impyramid|imreconstruct|imrect|imregconfig|imregionalmax|imregionalmin|
imregister|imresize|imroi|imrotate|imsave|imscrollpanel|imshow|imshowpair|imsubtract|imtool|imtophat|
imtransform|imview|ind2gray|ind2rgb|interfileinfo|interfileread|intlut|ippl|iptaddcallback|
iptcheckconn|iptcheckhandle|iptcheckinput|iptcheckmap|iptchecknargin|iptcheckstrs|iptdemos|iptgetapi|
iptGetPointerBehavior|iptgetpref|ipticondir|iptnum2ordinal|iptPointerManager|iptprefs|
iptremovecallback|iptSetPointerBehavior|iptsetpref|iptwindowalign|iradon|isbw|isflat|isgray|isicc|
isind|isnitf|isrgb|isrset|lab2double|lab2uint16|lab2uint8|label2rgb|labelmatrix|makecform|
makeConstrainToRectFcn|makehdr|makelut|makeresampler|maketform|mat2gray|mean2|medfilt2|montage|
nitfinfo|nitfread|nlfilter|normxcorr2|ntsc2rgb|openrset|ordfilt2|otf2psf|padarray|para2fan|phantom|
poly2mask|psf2otf|qtdecomp|qtgetblk|qtsetblk|radon|rangefilt|reflect|regionprops|
registration.metric.(?:MattesMutualInformation|MeanSquares)|registration.optimizer.(?:OnePlusOneEvolutionary|
RegularStepGradientDescent)|rgb2gray|rgb2ntsc|rgb2ycbcr|roicolor|roifill|roifilt2|roipoly|rsetwrite|
std2|stdfilt|strel|stretchlim|subimage|tformarray|tformfwd|tforminv|tonemap|translate|truesize|
uintlut|viscircles|warp|watershed|whitepoint|wiener2|xyz2double|xyz2uint16|
ycbcr2rgb`.replace(/\s/g, ''),
      h = `bintprog|color|fgoalattain|fminbnd|fmincon|fminimax|fminsearch|fminunc|fseminf|fsolve|fzero|fzmult|
gangstr|ktrlink|linprog|lsqcurvefit|lsqlin|lsqnonlin|lsqnonneg|optimget|optimset|optimtool|quadprog`.replace(/\s/g, ''),
      g = [
        [e.PR_PLAIN, /^[ \t\r\n\v\f\xA0]+/, null, ' 	\r\n\f '],
        [e.PR_COMMENT, /^%\{[^%]*%+(?:[^\}%][^%]*%+)*\}/, null],
        [e.PR_COMMENT, /^%[^\r\n]*/, null, '%'],
        [r, /^![^\r\n]*/, null, '!'],
      ],
      m = [
        [u, /^\.\.\.\s*[\r\n]/, null],
        [s, /^\?\?\? [^\r\n]*/, null],
        [c, /^Warning: [^\r\n]*/, null],
        [o, /^>>\s+/, null],
        [o, /^octave:\d+>\s+/, null],
        [
          'lang-matlab-operators',
          /^((?:[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*|\)|\]|\}|\.)')/,
          null,
        ],
        [
          'lang-matlab-identifiers',
          /^([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)(?!')/,
          null,
        ],
        [e.PR_STRING, /^'(?:[^']|'')*'/, null],
        [e.PR_LITERAL, /^[+\-]?\.?\d+(?:\.\d*)?(?:[Ee][+\-]?\d+)?[ij]?/, null],
        [e.PR_TAG, /^(?:\{|\}|\(|\)|\[|\])/, null],
        [e.PR_PUNCTUATION, /^(?:<|>|=|~|@|&|;|,|:|!|\-|\+|\*|\^|\.|\||\\|\/)/, null],
      ],
      v = [
        [
          e.PR_KEYWORD,
          /^\b(?:break|case|catch|classdef|continue|else|elseif|end|for|function|global|if|otherwise|parfor|persistent|return|spmd|switch|try|while)\b/,
          null,
        ],
        [
          n,
          /^\b(?:true|false|inf|Inf|nan|NaN|eps|pi|ans|nargin|nargout|varargin|varargout)\b/,
          null,
        ],
        [
          e.PR_TYPE,
          /^\b(?:cell|struct|char|double|single|logical|u?int(?:8|16|32|64)|sparse)\b/,
          null,
        ],
        [i, new RegExp('^\\b(?:' + d + ')\\b'), null],
        [a, new RegExp('^\\b(?:' + p + ')\\b'), null],
        [a, new RegExp('^\\b(?:' + f + ')\\b'), null],
        [a, new RegExp('^\\b(?:' + h + ')\\b'), null],
        [t, /^[a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*/, null],
      ],
      b = [
        ['lang-matlab-identifiers', /^([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9_]*)*)/, null],
        [e.PR_TAG, /^(?:\{|\}|\(|\)|\[|\])/, null],
        [e.PR_PUNCTUATION, /^(?:<|>|=|~|@|&|;|,|:|!|\-|\+|\*|\^|\.|\||\\|\/)/, null],
        [l, /^'/, null],
      ];
    e.registerLangHandler(e.createSimpleLexer([], v), ['matlab-identifiers']),
      e.registerLangHandler(e.createSimpleLexer([], b), ['matlab-operators']),
      e.registerLangHandler(e.createSimpleLexer(g, m), ['matlab']);
  })(window.PR),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [
          PR.PR_COMMENT,
          /^#(?:if[\t\n\r \xA0]+(?:[a-z_$][\w\']*|``[^\r\n\t`]*(?:``|$))|else|endif|light)/i,
          null,
          '#',
        ],
        [
          PR.PR_STRING,
          /^(?:\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)|\'(?:[^\'\\]|\\[\s\S])(?:\'|$))/,
          null,
          '"\'',
        ],
      ],
      [
        [PR.PR_COMMENT, /^(?:\/\/[^\r\n]*|\(\*[\s\S]*?\*\))/],
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:abstract|and|as|assert|begin|class|default|delegate|do|done|downcast|downto|elif|else|end|
            exception|extern|false|finally|for|fun|function|if|in|inherit|inline|interface|internal|lazy|let|
            match|member|module|mutable|namespace|new|null|of|open|or|override|private|public|rec|return|static|
            struct|then|to|true|try|type|upcast|use|val|void|when|while|with|yield|asr|land|lor|lsl|lsr|lxor|mod|
            sig|atomic|break|checked|component|const|constraint|constructor|continue|eager|event|external|fixed|
            functor|global|include|method|mixin|object|parallel|process|protected|pure|sealed|trait|virtual|
            volatile)\\b`.replace(/\s/g, ''))
        ],
        [PR.PR_LITERAL, /^[+\-]?(?:0x[\da-f]+|(?:(?:\.\d+|\d+(?:\.\d*)?)(?:e[+\-]?\d+)?))/i],
        [PR.PR_PLAIN, /^(?:[a-z_][\w']*[!?#]?|``[^\r\n\t`]*(?:``|$))/i],
        [PR.PR_PUNCTUATION, /^[^\t\n\r \xA0\"\'\w]+/],
      ]
    ),
    ['fs', 'ml']
  ),
  PR.registerLangHandler(PR.createSimpleLexer([], []), ['none']),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_STRING, /^(?:\'(?:[^\\\'\r\n]|\\.)*(?:\'|$))/, null, "'"],
        [PR.PR_PLAIN, /^\s+/, null, ' \r\n	 '],
      ],
      [
        [PR.PR_COMMENT, /^\(\*[\s\S]*?(?:\*\)|$)|^\{[\s\S]*?(?:\}|$)/, null],
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:ABSOLUTE|AND|ARRAY|ASM|ASSEMBLER|BEGIN|CASE|CONST|CONSTRUCTOR|
            DESTRUCTOR|DIV|DO|DOWNTO|ELSE|END|EXTERNAL|FOR|FORWARD|FUNCTION|GOTO|IF|IMPLEMENTATION|
            IN|INLINE|INTERFACE|INTERRUPT|LABEL|MOD|NOT|OBJECT|OF|OR|PACKED|PROCEDURE|PROGRAM|RECORD|
            REPEAT|SET|SHL|SHR|THEN|TO|TYPE|UNIT|UNTIL|USES|VAR|VIRTUAL|WHILE|WITH|XOR)\\b`.replace(/\s/g, ''),
            'i'),
          null,
        ],
        [PR.PR_LITERAL, /^(?:true|false|self|nil)/i, null],
        [PR.PR_PLAIN, /^[a-z][a-z0-9]*/i, null],
        [
          PR.PR_LITERAL,
          /^(?:\$[a-f0-9]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+\-]?\d+)?)/i,
          null,
          '0123456789',
        ],
        [PR.PR_PUNCTUATION, /^.[^\s\w\.$@\'\/]*/, null],
      ]
    ),
    ['pascal']
  ),
  PR.registerLangHandler(
    PR.sourceDecorator({
      keywords: 'bytes,default,double,enum,extend,extensions,false,group,import,max,message,' +
                'option,optional,package,repeated,required,returns,rpc,service,syntax,to,true',
      types: /^(bool|(double|s?fixed|[su]?int)(32|64)|float|string)\b/,
      cStyleComments: !0,
    }),
    ['proto']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [PR.PR_STRING, /^\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)/, null, '"'],
        [PR.PR_STRING, /^\'(?:[^\'\\]|\\[\s\S])*(?:\'|$)/, null, "'"],
      ],
      [
        [PR.PR_COMMENT, /^#.*/],
        [
          PR.PR_KEYWORD,
          /^(?:if|else|for|while|repeat|in|next|break|return|switch|function)(?![A-Za-z0-9_.])/,
        ],
        [PR.PR_LITERAL, /^0[xX][a-fA-F0-9]+([pP][0-9]+)?[Li]?/],
        [PR.PR_LITERAL, /^[+-]?([0-9]+(\.[0-9]+)?|\.[0-9]+)([eE][+-]?[0-9]+)?[Li]?/],
        [
          PR.PR_LITERAL,
          /^(?:NULL|NA(?:_(?:integer|real|complex|character)_)?|Inf|TRUE|FALSE|NaN|\.\.(?:\.|[0-9]+))(?![A-Za-z0-9_.])/,
        ],
        [
          PR.PR_PUNCTUATION,
          /^(?:<<?-|->>?|-|==|<=|>=|<|>|&&?|!=|\|\|?|\*|\+|\^|\/|!|%.*?%|=|~|\$|@|:{1,3}|[\[\](){};,?])/,
        ],
        [PR.PR_PLAIN, /^(?:[A-Za-z]+[A-Za-z0-9_.]*|\.[a-zA-Z_][0-9a-zA-Z\._]*)(?![A-Za-z0-9_.])/],
        [PR.PR_STRING, /^`.+`/],
      ]
    ),
    ['r', 's', 'R', 'S', 'Splus']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [
          PR.PR_STRING,
          /^(?:"(?:(?:""(?:""?(?!")|[^\\"]|\\.)*"{0,3})|(?:[^"\r\n\\]|\\.)*"?))/,
          null,
          '"',
        ],
        [PR.PR_LITERAL, /^`(?:[^\r\n\\`]|\\.)*`?/, null, '`'],
        [
          PR.PR_PUNCTUATION,
          /^[!#%&()*+,\-:;<=>?@\[\\\]^{|}~]+/,
          null,
          '!#%&()*+,-:;<=>?@[\\]^{|}~',
        ],
      ],
      [
        [PR.PR_STRING, /^'(?:[^\r\n\\']|\\(?:'|[^\r\n']+))'/],
        [PR.PR_LITERAL, /^'[a-zA-Z_$][\w$]*(?!['$\w])/],
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|
            forSome|if|implicit|import|lazy|match|new|object|override|package|private|protected|
            requires|return|sealed|super|throw|trait|try|type|val|var|while|with|yield)\\b`.replace(/\s/g, '')),
        ],
        [PR.PR_LITERAL, /^(?:true|false|null|this)\b/],
        [
          PR.PR_LITERAL,
          /^(?:(?:0(?:[0-7]+|X[0-9A-F]+))L?|(?:(?:0|[1-9][0-9]*)(?:(?:\.[0-9]+)?(?:E[+\-]?[0-9]+)?F?|L?))|\\.[0-9]+(?:E[+\-]?[0-9]+)?F?)/i,
        ],
        [PR.PR_TYPE, /^[$_]*[A-Z][_$A-Z0-9]*[a-z][\w$]*/],
        [PR.PR_PLAIN, /^[$a-zA-Z_][\w$]*/],
        [PR.PR_COMMENT, /^\/(?:\/.*|\*(?:\/|\**[^*\/])*(?:\*+\/?)?)/],
        [PR.PR_PUNCTUATION, /^(?:\.+|\/)/],
      ]
    ),
    ['scala']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '],
        [PR.PR_STRING, /^(?:"(?:[^\"\\]|\\.)*"|'(?:[^\'\\]|\\.)*')/, null, '"\''],
      ],
      [
        [PR.PR_COMMENT, /^(?:--[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$))/],
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:ADD|ALL|ALTER|AND|ANY|APPLY|AS|ASC|AUTHORIZATION|BACKUP|BEGIN|BETWEEN|BREAK|BROWSE|BULK|BY|
            CASCADE|CASE|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLLATE|COLUMN|COMMIT|COMPUTE|CONNECT|
            CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|
            CURRENT_TIMESTAMP|CURRENT_USER|CURSOR|DATABASE|DBCC|DEALLOCATE|DECLARE|DEFAULT|DELETE|DENY|DESC|DISK|
            DISTINCT|DISTRIBUTED|DOUBLE|DROP|DUMMY|DUMP|ELSE|END|ERRLVL|ESCAPE|EXCEPT|EXEC|EXECUTE|EXISTS|EXIT|
            FETCH|FILE|FILLFACTOR|FOLLOWING|FOR|FOREIGN|FREETEXT|FREETEXTTABLE|FROM|FULL|FUNCTION|GOTO|GRANT|
            GROUP|HAVING|HOLDLOCK|IDENTITY|IDENTITYCOL|IDENTITY_INSERT|IF|IN|INDEX|INNER|INSERT|INTERSECT|INTO|
            IS|JOIN|KEY|KILL|LEFT|LIKE|LINENO|LOAD|MATCH|MATCHED|MERGE|NATURAL|NATIONAL|NOCHECK|NONCLUSTERED|
            NOCYCLE|NOT|NULL|NULLIF|OF|OFF|OFFSETS|ON|OPEN|OPENDATASOURCE|OPENQUERY|OPENROWSET|OPENXML|OPTION|OR|
            ORDER|OUTER|OVER|PARTITION|PERCENT|PIVOT|PLAN|PRECEDING|PRECISION|PRIMARY|PRINT|PROC|PROCEDURE|
            PUBLIC|RAISERROR|READ|READTEXT|RECONFIGURE|REFERENCES|REPLICATION|RESTORE|RESTRICT|RETURN|REVOKE|
            RIGHT|ROLLBACK|ROWCOUNT|ROWGUIDCOL|ROWS?|RULE|SAVE|SCHEMA|SELECT|SESSION_USER|SET|SETUSER|SHUTDOWN|
            SOME|START|STATISTICS|SYSTEM_USER|TABLE|TEXTSIZE|THEN|TO|TOP|TRAN|TRANSACTION|TRIGGER|TRUNCATE|
            TSEQUAL|UNBOUNDED|UNION|UNIQUE|UNPIVOT|UPDATE|UPDATETEXT|USE|USER|USING|VALUES|VARYING|VIEW|WAITFOR|
            WHEN|WHERE|WHILE|WITH|WITHIN|WRITETEXT|XML)(?=[^\\w-]|$)`.replace(/\s/g, ''),
            'i'),
          null,
        ],
        [PR.PR_LITERAL, /^[+-]?(?:0x[\da-f]+|(?:(?:\.\d+|\d+(?:\.\d*)?)(?:e[+\-]?\d+)?))/i],
        [PR.PR_PLAIN, /^[a-z_][\w-]*/i],
        [PR.PR_PUNCTUATION, /^[^\w\t\n\r \xA0\"\'][^\w\t\n\r \xA0+\-\"\']*/],
      ]
    ),
    ['sql']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[ \n\r\t\v\f\0]+/, null, ' \n\r	\f\x00'],
        [PR.PR_STRING, /^"(?:[^"\\]|(?:\\.)|(?:\\\((?:[^"\\)]|\\.)*\)))*"/, null, '"'],
      ],
      [
        [
          PR.PR_LITERAL,
          /^(?:(?:0x[\da-fA-F][\da-fA-F_]*\.[\da-fA-F][\da-fA-F_]*[pP]?)|(?:\d[\d_]*\.\d[\d_]*[eE]?))[+-]?\d[\d_]*/,
          null,
        ],
        [
          PR.PR_LITERAL,
          /^-?(?:(?:0(?:(?:b[01][01_]*)|(?:o[0-7][0-7_]*)|(?:x[\da-fA-F][\da-fA-F_]*)))|(?:\d[\d_]*))/,
          null,
        ],
        [PR.PR_LITERAL, /^(?:true|false|nil)\b/, null],
        [
          PR.PR_KEYWORD,
          new RegExp(`^\\b(?:__COLUMN__|__FILE__|__FUNCTION__|__LINE__|#available|#else|#elseif|#endif|#if|#line|arch|arm|
            arm64|associativity|as|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|
            dynamic|dynamicType|else|enum|extension|fallthrough|final|for|func|get|guard|import|indirect|infix|
            init|inout|internal|i386|if|in|iOS|iOSApplicationExtension|is|lazy|left|let|mutating|none|
            nonmutating|operator|optional|OSX|OSXApplicationExtension|override|postfix|precedence|prefix|private|
            protocol|Protocol|public|required|rethrows|return|right|safe|self|set|static|struct|subscript|super|
            switch|throw|try|Type|typealias|unowned|unsafe|var|weak|watchOS|while|willSet|x86_64)\\b`.replace(/\s/g, '')),
          null,
        ],
        [PR.PR_COMMENT, /^\/\/.*?[\n\r]/, null],
        [PR.PR_COMMENT, /^\/\*[\s\S]*?(?:\*\/|$)/, null],
        [
          PR.PR_PUNCTUATION,
          /^<<=|<=|<<|>>=|>=|>>|===|==|\.\.\.|&&=|\.\.<|!==|!=|&=|~=|~|\(|\)|\[|\]|{|}|@|#|;|\.|,|:|\|\|=|\?\?|\|\||&&|&\*|&\+|&-|&=|\+=|-=|\/=|\*=|\^=|%=|\|=|->|`|==|\+\+|--|\/|\+|!|\*|%|<|>|&|\||\^|\?|=|-|_/,
          null,
        ],
        [PR.PR_TYPE, /^\b(?:[@_]?[A-Z]+[a-z][A-Za-z_$@0-9]*|\w+_t\b)/, null],
      ]
    ),
    ['swift']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [[PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  '], [PR.PR_COMMENT, /^%[^\r\n]*/, null, '%']],
      [
        [PR.PR_KEYWORD, /^\\[a-zA-Z@]+/],
        [PR.PR_KEYWORD, /^\\./],
        [PR.PR_TYPE, /^[$&]/],
        [PR.PR_LITERAL, /[+-]?(?:\.\d+|\d+(?:\.\d*)?)(cm|em|ex|in|pc|pt|bp|mm)/i],
        [PR.PR_PUNCTUATION, /^[{}()\[\]=]+/],
      ]
    ),
    ['latex', 'tex']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [
        [PR.PR_PLAIN, /^[\t\n\r \xA0\u2028\u2029]+/, null, '	\n\r  \u2028\u2029'],
        [
          PR.PR_STRING,
          /^(?:[\"\u201C\u201D](?:[^\"\u201C\u201D]|[\"\u201C\u201D]{2})(?:[\"\u201C\u201D]c|$)|[\"\u201C\u201D](?:[^\"\u201C\u201D]|[\"\u201C\u201D]{2})*(?:[\"\u201C\u201D]|$))/i,
          null,
          '"“”',
        ],
        [
          PR.PR_COMMENT,
          /^[\'\u2018\u2019](?:_(?:\r\n?|[^\r]?)|[^\r\n_\u2028\u2029])*/,
          null,
          "'‘’",
        ],
      ],
      [
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:AddHandler|AddressOf|Alias|And|AndAlso|Ansi|As|Assembly|Auto|Boolean|ByRef|Byte|ByVal|Call|Case|
            Catch|CBool|CByte|CChar|CDate|CDbl|CDec|Char|CInt|Class|CLng|CObj|Const|CShort|CSng|CStr|CType|Date|
            Decimal|Declare|Default|Delegate|Dim|DirectCast|Do|Double|Each|Else|ElseIf|End|EndIf|Enum|Erase|
            Error|Event|Exit|Finally|For|Friend|Function|Get|GetType|GoSub|GoTo|Handles|If|Implements|Imports|In|
            Inherits|Integer|Interface|Is|Let|Lib|Like|Long|Loop|Me|Mod|Module|MustInherit|MustOverride|MyBase|
            MyClass|Namespace|New|Next|Not|NotInheritable|NotOverridable|Object|On|Option|Optional|Or|OrElse|
            Overloads|Overridable|Overrides|ParamArray|Preserve|Private|Property|Protected|Public|RaiseEvent|
            ReadOnly|ReDim|RemoveHandler|Resume|Return|Select|Set|Shadows|Shared|Short|Single|Static|Step|Stop|
            String|Structure|Sub|SyncLock|Then|Throw|To|Try|TypeOf|Unicode|Until|Variant|Wend|When|While|With|
            WithEvents|WriteOnly|Xor|EndIf|GoSub|Let|Variant|Wend)\\b`.replace(/\s/g, ''),
            'i'),
          null,
        ],
        [PR.PR_COMMENT, /^REM\b[^\r\n\u2028\u2029]*/i],
        [
          PR.PR_LITERAL,
          new RegExp(`^(?:True\\b|False\\b|Nothing\\b|\\d+(?:E[+\\-]?\\d+[FRD]?|[FRDSIL])?|
            (?:&H[0-9A-F]+|&O[0-7]+)[SIL]?|\\d*\\.\\d+(?:E[+\\-]?\\d+)?[FRD]?|
            #\\s+(?:\\d+[\\-\\/]\\d+[\\-\\/]\\d+(?:\\s+\\d+:\\d+(?::\\d+)?(\\s*(?:AM|PM))?)?|
            \\d+:\\d+(?::\\d+)?(\\s*(?:AM|PM))?)\\s+#)`.replace(/\s/g, ''),
            'i')
        ],
        [PR.PR_PLAIN, /^(?:(?:[a-z]|_\w)\w*(?:\[[%&@!#]+\])?|\[(?:[a-z]|_\w)\w*\])/i],
        [PR.PR_PUNCTUATION, /^[^\w\t\n\r \"\'\[\]\xA0\u2018\u2019\u201C\u201D\u2028\u2029]+/],
        [PR.PR_PUNCTUATION, /^(?:\[|\])/],
      ]
    ),
    ['vb', 'vbs']
  ),
  PR.registerLangHandler(
    PR.createSimpleLexer(
      [[PR.PR_PLAIN, /^[\t\n\r \xA0]+/, null, '	\n\r  ']],
      [
        [PR.PR_STRING, /^(?:[BOX]?"(?:[^\"]|"")*"|'.')/i],
        [PR.PR_COMMENT, /^--[^\r\n]*/],
        [
          PR.PR_KEYWORD,
          new RegExp(`^(?:abs|access|after|alias|all|and|architecture|array|assert|attribute|begin|block|body|buffer|bus|
            case|component|configuration|constant|disconnect|downto|else|elsif|end|entity|exit|file|for|function|
            generate|generic|group|guarded|if|impure|in|inertial|inout|is|label|library|linkage|literal|loop|map|
            mod|nand|new|next|nor|not|null|of|on|open|or|others|out|package|port|postponed|procedure|process|
            pure|range|record|register|reject|rem|report|return|rol|ror|select|severity|shared|signal|sla|sll|
            sra|srl|subtype|then|to|transport|type|unaffected|units|until|use|variable|wait|when|
            while|with|xnor|xor)(?=[^\\w-]|$)`.replace(/\s/g, ''),
            'i'),
          null,
        ],
        [
          PR.PR_TYPE,
          /^(?:bit|bit_vector|character|boolean|integer|real|time|string|severity_level|positive|natural|signed|unsigned|line|text|std_u?logic(?:_vector)?)(?=[^\w-]|$)/i,
          null,
        ],
        [
          PR.PR_TYPE,
          new RegExp(`^\\'(?:ACTIVE|ASCENDING|BASE|DELAYED|DRIVING|DRIVING_VALUE|EVENT|HIGH|
            IMAGE|INSTANCE_NAME|LAST_ACTIVE|LAST_EVENT|LAST_VALUE|LEFT|LEFTOF|LENGTH|LOW|PATH_NAME|
            POS|PRED|QUIET|RANGE|REVERSE_RANGE|RIGHT|RIGHTOF|SIMPLE_NAME|STABLE|SUCC|TRANSACTION|
            VAL|VALUE)(?=[^\\w-]|$)`.replace(/\s/g, ''),
            'i'),
          null,
        ],
        [
          PR.PR_LITERAL,
          /^\d+(?:_\d+)*(?:#[\w\\.]+#(?:[+\-]?\d+(?:_\d+)*)?|(?:\.\d+(?:_\d+)*)?(?:E[+\-]?\d+(?:_\d+)*)?)/i,
        ],
        [PR.PR_PLAIN, /^(?:[a-z]\w*|\\[^\\]*\\)/i],
        [PR.PR_PUNCTUATION, /^[^\w\t\n\r \xA0\"\'][^\w\t\n\r \xA0\-\"\']*/],
      ]
    ),
    ['vhdl', 'vhd']
  );
}