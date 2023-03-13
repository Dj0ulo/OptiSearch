function log(str) { console.log('%c[OptiSearch]', `font-weight: bold;`, str) }
function err(str) { console.error('%c[OptiSearch]', `font-weight: bold;`, str) }
function warn(str) { console.warn('%c[OptiSearch]', `font-weight: bold;`, str) }
function debug(str) { console.debug('%c[OptiSearch]', `font-weight: bold;`, str) }

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

/**
 * Read file from this extension
 * @param {string} url 
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
 * Create a copy button that copy a text in the clipboard when clicked
 * @param {string} text
 * @returns {Element}
 */
function createCopyButton(text) {
  const ICON_COPY =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" 
    class="feather feather-copy">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>`;
  const copyButton = el("div", { className: "opticopy", innerHTML: ICON_COPY });
  copyButton.querySelector("svg").onclick = clickSVG;
  function clickSVG() {
    copyButton.innerHTML = "";
    copyTextToClipboard(text).then((r) => {
      copyButton.innerHTML = r ? "Copied !" : "Error";
      setTimeout(() => {
        copyButton.innerHTML = ICON_COPY;
        copyButton.querySelector("svg").onclick = clickSVG;
      }, 2000);
    });
  }
  return copyButton;
}

/**
 * Copy text in keyboard
 * @param {string} text Some text to be copied
 * @returns {boolean} success
 */
function copyTextToClipboard(text) {
  if (!navigator.clipboard) {
    return;
  }
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
}

/**
 * Create an element
 * @param {string} tag Tag name of the element
 * @param {Object} attr attributes
 * @param {Element} parent
 * @returns {Element} Element created
 */
function el(tag, attr, parent) {
  const x = document.createElement(tag);
  if (parent) parent.appendChild(x);
  if (attr) {
    attr.attributes?.forEach(a => x.setAttribute(a.name, a.value ?? ''));
    delete attr.attributes;
    Object.entries(attr).forEach(([k, v]) => x[k] = v);
  }
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
  if(!referenceNode.nextSibling)
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
  document.querySelectorAll("a").forEach(ln => {
    if (ln.href.startsWith("http"))
      ln.onclick = () => chrome.tabs.create({ active: true, url: ln.href })
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
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}


/**
 * 
 * @param {HTMLImageElement} img 
 */
function srcToBase64(src) {
  return new Promise((resolve) => {
    chrome.runtime
      .sendMessage(
        { action: 'get-image-blob', url: src }, async (r) => resolve(await blobToBase64(r))
      )
  })
}

/**
 * 
 * @param {URL} url
 * @param {RequestInfo | undefined} params
 * @returns {Promise<string|{status:number,body:text}|{ eventStream: boolean, index: number }|{}>}
 */
function bgFetch(url, params) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'fetch', url, params: JSON.stringify(params) }, r => {
      if (r.isError)
        throw `Error while fetching in the service worker:\n${r.errorMsg}`;
      resolve(r);
    });
  });
}

const escapeHtml = (unsafe) => {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}