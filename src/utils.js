const extensionName = chrome.runtime.getManifest().name;

const SVG = {
  send: {"viewBox":"0 0 16 16","children":[{"tagName":"path","d":"M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"}]},
  chat: {"viewBox":"0 0 24 24", "fill": "none", "stroke-width": "2", "children":[{"tagName":"path","d":"M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.5997 2.37562 15.1116 3.04346 16.4525C3.22094 16.8088 3.28001 17.2161 3.17712 17.6006L2.58151 19.8267C2.32295 20.793 3.20701 21.677 4.17335 21.4185L6.39939 20.8229C6.78393 20.72 7.19121 20.7791 7.54753 20.9565C8.88837 21.6244 10.4003 22 12 22Z"},{"tagName":"path","d":"M8 10.5H16","stroke-linecap":"round"},{"tagName":"path","d":"M8 14H13.5","stroke-linecap":"round"}]},
  // The following icons come from https://www.veryicon.com/icons/miscellaneous/feather-v423
  emptyBookmark: {"viewBox":"0 0 24 24","children":[{"tagName":"path","d":"M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z M 6 4 L 18 4 L 18 19.162109 L 12 16.933594 L 6 19.162109 L 6 4 z"}]},
  filledBookmark: {"viewBox":"0 0 24 24","children":[{"tagName":"path","d":"M 6 2 C 4.8444444 2 4 2.9666667 4 4 L 4 22.039062 L 12 19.066406 L 20 22.039062 L 20 20.599609 L 20 4 C 20 3.4777778 19.808671 2.9453899 19.431641 2.5683594 C 19.05461 2.1913289 18.522222 2 18 2 L 6 2 z"}]},
  emptySet: {"viewBox":"0 0 1024 1024","children":[{"tagName":"path","d":"M512 981.333333C251.733333 981.333333 42.666667 772.266667 42.666667 512S251.733333 42.666667 512 42.666667s469.333333 209.066667 469.333333 469.333333-209.066667 469.333333-469.333333 469.333333z m0-853.333333c-213.333333 0-384 170.666667-384 384s170.666667 384 384 384 384-170.666667 384-384-170.666667-384-384-384z"},{"tagName":"path","d":"M814.933333 857.6c-12.8 0-21.333333-4.266667-29.866666-12.8L179.2 238.933333c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l601.6 601.6c17.066667 17.066667 17.066667 42.666667 0 59.733333-4.266667 12.8-17.066667 17.066667-25.6 17.066667z"}]},
  magnifyingGlass: {"viewBox":"0 0 1024 1024","children":[{"tagName":"path","d":"M469.333333 853.333333c-213.333333 0-384-170.666667-384-384s170.666667-384 384-384 384 170.666667 384 384-170.666667 384-384 384z m0-682.666666c-166.4 0-298.666667 132.266667-298.666666 298.666666s132.266667 298.666667 298.666666 298.666667 298.666667-132.266667 298.666667-298.666667-132.266667-298.666667-298.666667-298.666666z"},{"tagName":"path","d":"M896 938.666667c-12.8 0-21.333333-4.266667-29.866667-12.8L682.666667 742.4c-17.066667-17.066667-17.066667-42.666667 0-59.733333s42.666667-17.066667 59.733333 0l183.466667 183.466666c17.066667 17.066667 17.066667 42.666667 0 59.733334-8.533333 8.533333-17.066667 12.8-29.866667 12.8z"}]},
  play: {"children":[{"tagName":"path","d":"M213.333333 938.666667c-8.533333 0-12.8 0-21.333333-4.266667-12.8-8.533333-21.333333-21.333333-21.333333-38.4V128c0-17.066667 8.533333-29.866667 21.333333-38.4 12.8-8.533333 29.866667-8.533333 42.666667 0l597.333333 384c12.8 8.533333 21.333333 21.333333 21.333333 34.133333s-8.533333 29.866667-21.333333 34.133334l-597.333333 384c-4.266667 8.533333-12.8 12.8-21.333334 12.8zM256 204.8v610.133333L733.866667 512 256 204.8z"}],"viewBox":"0 0 1024 1024"},
  pause: {"children":[{"tagName":"path","d":"M512 981.333333C251.733333 981.333333 42.666667 772.266667 42.666667 512S251.733333 42.666667 512 42.666667s469.333333 209.066667 469.333333 469.333333-209.066667 469.333333-469.333333 469.333333z m0-853.333333c-213.333333 0-384 170.666667-384 384s170.666667 384 384 384 384-170.666667 384-384-170.666667-384-384-384z"},{"tagName":"path","d":"M426.666667 682.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V384c0-25.6 17.066667-42.666667 42.666667-42.666667s42.666667 17.066667 42.666666 42.666667v256c0 25.6-17.066667 42.666667-42.666666 42.666667zM597.333333 682.666667c-25.6 0-42.666667-17.066667-42.666666-42.666667V384c0-25.6 17.066667-42.666667 42.666666-42.666667s42.666667 17.066667 42.666667 42.666667v256c0 25.6-17.066667 42.666667-42.666667 42.666667z"}],"viewBox":"0 0 1024 1024"},
  user: {"children":[{"tagName":"path","d":"M853.333333 938.666667c-25.6 0-42.666667-17.066667-42.666666-42.666667v-85.333333c0-72.533333-55.466667-128-128-128H341.333333c-72.533333 0-128 55.466667-128 128v85.333333c0 25.6-17.066667 42.666667-42.666666 42.666667s-42.666667-17.066667-42.666667-42.666667v-85.333333c0-119.466667 93.866667-213.333333 213.333333-213.333334h341.333334c119.466667 0 213.333333 93.866667 213.333333 213.333334v85.333333c0 25.6-17.066667 42.666667-42.666667 42.666667zM512 512c-119.466667 0-213.333333-93.866667-213.333333-213.333333s93.866667-213.333333 213.333333-213.333334 213.333333 93.866667 213.333333 213.333334-93.866667 213.333333-213.333333 213.333333z m0-341.333333c-72.533333 0-128 55.466667-128 128s55.466667 128 128 128 128-55.466667 128-128-55.466667-128-128-128z"}],"viewBox":"0 0 1024 1024"},
  chevron: {"children":[{"tagName":"path","d":"M384 810.666667c-12.8 0-21.333333-4.266667-29.866667-12.8-17.066667-17.066667-17.066667-42.666667 0-59.733334l226.133334-226.133333-226.133334-226.133333c-17.066667-17.066667-17.066667-42.666667 0-59.733334s42.666667-17.066667 59.733334 0l256 256c17.066667 17.066667 17.066667 42.666667 0 59.733334l-256 256c-8.533333 8.533333-17.066667 12.8-29.866667 12.8z"}],"viewBox":"0 0 1024 1024"},
};

function log(str) { console.log(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function err(str) { console.error(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function warn(str) { console.warn(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function debug(str) { console.debug(`%c[${extensionName}]`, `font-weight: bold;`, str) }

/**
 * @param {string} query
 * @param {HTMLElement} element
 * @returns result of query
 */
const $ = (query, element) => (element ?? document).querySelector(query);
/**
 * @param {string} query
 * @param {HTMLElement} element
 * @returns array of results of query
 */
const $$ = (query, element) => [...(element ?? document).querySelectorAll(query)];

/**
 * 
 * @returns {boolean} true if we are on a chromium browser (otherwise we probably are on firefox)
 */
function onChrome() { return typeof browser === 'undefined'; }

function _t(messageName, ...args) {
  console.log(messageName.replaceAll(/[^\w]/g, '_'),args)
  return chrome.i18n.getMessage(messageName.replaceAll(/[^\w]/g, '_'), args) || messageName;
}

function renderDocText() {
  $$("[data-i18n]").forEach(el => {
    el.innerHTML = _t(el.dataset.i18n);
  });
}

/**
 * Read file from this extension
 * @param {string} url 
 * @param {string} defaultValue 
 * @returns 
 */
const read = (url) => fetch(chrome.runtime.getURL(url))
  .then(response => response.text());

/**
 * Format a text element into LaTeX
 * @param {Element} element
 * @param {boolean} convertWhole If true convert element.innerHTML to TeX,
 *  otherwise only the part of it that have $ or $$ around
 */
function toTeX(element, convertWhole = true) {
  const REGEX_LATEX_G = /\${1,2}([^\$]*)\${1,2}/g;
  if (convertWhole)
    element.innerHTML = element.innerHTML.replace(REGEX_LATEX_G, '$1');
  else
    element.innerHTML = element.innerHTML.replace(
      REGEX_LATEX_G,
      `<span style="display: inline-block;" class="math-container">$1</span>`
    );
  MathJax.texReset();

  async function TeXThis(element) {
    const options = MathJax.getMetricsFor(element);
    const node = await MathJax.tex2svgPromise(element.textContent, options);
    element.innerHTML = "";
    element.appendChild(node);
  }

  if (convertWhole)
    TeXThis(element);
  else
    $$(".math-container", element).forEach((e) => TeXThis(e));
}

/**
 * Prettyfy code
 * @param {Element} element 
 */
function prettifyCode(element) {
  $$("pre", element).forEach((pre) => {
    const surround = el("div", { style: "position: relative" });
    pre.parentNode.replaceChild(surround, pre);
    surround.append(pre, createCopyButton(pre.innerText.trim()));
    $$("code", pre).forEach(c => {
      // Escape inside
      c.textContent = c.textContent;
      hljs.highlightElement(c);
    });
  });
}

/**
 * Create a copy button that copy a text in the clipboard when clicked
 * @param {string} text
 * @returns {Element}
 */
function createCopyButton(text) {
  const copyButton = el("div", { className: "opticopy" });
  const copyIcon = toSvgNode({
    children: [
      { tagName: "rect", x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" },
      { tagName: "path", d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" },
    ],
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  copyButton.appendChild(copyIcon);
  copyIcon.addEventListener('click', async () => {
    copyButton.textContent = '';
    const r = await copyTextToClipboard(text);
    copyButton.textContent = r ? _t("Copied!") : _t("Error");
    setTimeout(() => {
      copyButton.textContent = '';
      copyButton.appendChild(copyIcon);
    }, 2000);
  });
  return copyButton;
}

/**
 * Copy text in keyboard
 * @param {string} text Some text to be copied
 */
async function copyTextToClipboard(text) {
  if (!navigator.clipboard) return false;
  return navigator.clipboard.writeText(text).then(() => true, () => false);
}

/**
 * Create an element
 * @param {string} tag Tag name of the element
 * @param {HTMLElement} parent
 * @returns {HTMLElement} Element created
 */
function el(tag, attr, parent) {
  const x = document.createElement(tag);
  parent?.appendChild(x);
  attr && Object.entries(attr).forEach(([k, v]) => x[k] = v);
  return x;
}

function hline(parent) {
  return el("hr", {}, parent);
}
/**
 * Insert an Element after another one
 * @param {Element} newNode Element to insert
 * @param {Element} referenceNode the other one
 */
function insertAfter(newNode, referenceNode) {
  if (!referenceNode.nextSibling)
    return referenceNode.parentNode.append(newNode);
  return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * 
 * @param {Node} p 
 * @returns The next element that has text
 */
function nextListElement(p) {
  if (!p)
    return null;
  if (p.textContent.trim() !== "" && p.tagName === 'UL')
    return p;
  if (p.tagName && p.tagName !== 'UL')
    return null;
  return nextListElement(p.nextSibling);
}

/**
 * @param {Element} summary 
 * @returns {Element} The next element that contains text if summary ends by a colon
 */
function underSummary(summary) {
  if (!summary)
    return null;

  const textSummary = summary.textContent.trim();
  if (textSummary[textSummary.length - 1] !== ':')
    return null;

  return nextListElement(summary.nextSibling);
}

function hrefPopUp() {
  $$("a").forEach(a => {
    const url = a.href;
    if (url.startsWith("http")) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ active: true, url });
      });
    }
  })
}

/**
 * Put the host in every link of the element
 * @param {string} url 
 * @param {Element} container 
 */
function writeHostOnLinks(url, container) {
  const host = url.match("https?://[^/]+")[0];
  const links = container.querySelectorAll("a, img");
  links.forEach(a => {
    const attr = a.tagName === 'A' ? 'href' : 'src';
    const ahref = a.getAttribute(attr);
    if (!ahref || ahref.startsWith("http") || ahref.startsWith("//") || ahref.startsWith("data:")) {
      return;
    }

    if (ahref.startsWith("/")) {
      a[attr] = host + ahref;
      return;
    }

    a[attr] = `${url.replace(/\/[^\/]*$/, "")}/${ahref}`;
  });
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return [h, s, l];
}

/**
 * Change luminosity of color
 * http://www.sitepoint.com/javascript-generate-lighter-darker-color/
 * @param {string} color Color in hexadecimal (ex. #fe34c5) or in rgb (ex. rgb(28, 65, 244))
 * @param {number} lum Percentage [0.0-1.0] of change (negative if darker)
 */

function colorLuminance(color, lum) {
  let rgb = []

  if (color.startsWith('#')) {
    color = color.replace(/[^0-9a-f]/gi, "");
    if (color.length == 3)
      color = color.replace(/(.)/g, '$1$1');
    rgb = [...color.matchAll(/[0-9a-f]{2}/g)].map(x => parseInt(x[0], 16));
  } else if (color.startsWith('rgb(')) {
    rgb = [...color.matchAll(/\d{1,3}/g)].map(x => parseInt(x[0], 10));
  }
  lum = lum || 0;

  let [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  l = Math.min(Math.max(0, l + lum), 1);
  return `hsl(${(h * 360).toPrecision(4)}, ${(s * 100).toPrecision(4)}%, ${(l * 100).toPrecision(4)}%)`;
}

/** 
 * @param {string} colorStr of the body 
 * @returns {int[]} RGBA values
 */
function textColorToRGBA(colorStr) {
  const matcher = colorStr.match(/\(([\d ,]+)\)/);
  return matcher[1].split(",").map((m) => parseInt(m));
}

/** @returns {string} background-color of the body */
function getBackgroundColor() {
  const bodyBackColorStr = getComputedStyle(document.body, null).getPropertyValue("background-color");
  let rgba = textColorToRGBA(bodyBackColorStr);
  if (rgba[3] === 0)
    return getComputedStyle(document.querySelector('html'), null).getPropertyValue("background-color");
  return bodyBackColorStr
}

/** @returns {boolean} true if the body color is dark  */
function isDarkMode() {
  try {
    const rgba = textColorToRGBA(getBackgroundColor());

    const av = rgba.slice(0, 3).reduce((a, v) => a + v) / 3;
    return av < 128;

  } catch (e) {
    return false;
  }
}

function blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

/**
 * 
 * @param {HTMLImageElement} img 
 */
async function srcToBase64(src) {
  const data = await bgWorker({ action: 'image-blob', url: src });
  return blobToBase64(data);
}

/**
 * 
 * @param {URL} url
 * @param {RequestInfo | undefined} params
 * @returns {Promise<string|{status:number,body:text}|{ eventStream: boolean, index: number }|{}>}
 */
function bgFetch(url, params) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'fetch', url, params: JSON.stringify(params) },
      (response) => {
        if (response && response.errorInBackgroundScript)
          throw `Error while fetching in the service worker:\n${response.error}`;
        resolve(response);
      });
  });
}

/**
 * Execute an action in the background using service worker
 * @param {*} params 
 * @returns 
 */
function bgWorker(params) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(params, r => {
      if (r?.error)
        throw `ServiceWorker Error:\n${r.error}`;
      resolve(r);
    });
  });
}

function escapeHtml(unsafe) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function runMarkdown(text) {
  if (typeof (text) !== 'string')
    return '';
  return markdown(escapeHtml(text.trim()));
}

/**
 * Returns a promise that resolves when the element is found
 * @param {string} selector 
 */
function awaitElement(selector) {
  return new Promise(resolve => {
    const el = $(selector);
    if (el) {
      resolve(el);
      return;
    }
    const observer = new MutationObserver(() => {
      const el = $(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/**
 * Observe a node for mutations
 * @param {MutationCallback} callback 
 * @param {Node} target 
 * @param {MutationObserverInit | undefined} options 
 * @returns {MutationObserver}
 */
function setObserver(callback, target, options) {
  const observer = new MutationObserver(callback);
  observer.observe(target, options);
  return observer;
}

/** 
 * Parses the search string from the url,
 * this should be executable before everything has been loaded
 * @returns {string} the search string query
 * */
function parseSearchParam(paramName) {
  if (!paramName)
    paramName = (window.location.host === 'www.baidu.com') ? 'w' : 'q';
  return new URL(window.location.href).searchParams.get(paramName) || '';
}

/** @param {Element} e */
function displayElement(e) {
  e.style.display = '';
}

/** @param {Element} e */
function hideElement(e) {
  e.style.display = 'none';
}

function premiumPresentationPopup() {
  bgWorker({
    action: 'window',
    url: chrome.runtime.getURL('src/popup/premium.html'),
    type: 'popup',
    width: 500,
    height: 800,
  });
}

function parseStr(str, regex) {
  const match = str.match(regex);
  if (!match)
    return '';
  return match[1];
}

function toSvgNode(svgObj) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  Object.entries(svgObj).forEach(e => e[0] !== 'children' && svg.setAttribute(e[0], e[1]));
  svgObj.children.forEach(attrs => {
    const path = document.createElementNS(namespace, attrs.tagName);
    Object.entries(attrs).forEach(e => e[0] !== 'tagName' && path.setAttribute(e[0], e[1]));
    svg.appendChild(path);
  }, svg);
  return svg;
}

function setSvg(element, svgObj) {
  element.textContent = '';
  element.classList.add('svg-container');
  element.appendChild(toSvgNode(svgObj))
}
