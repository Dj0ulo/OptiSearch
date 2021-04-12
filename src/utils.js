/**
 * Format all children from the element to LaTex
 * @param {Element} element
 */
function childrenToTeX(element) {
  Array.from(element.querySelectorAll("*"))
    .filter((p) => p.textContent.search(REGEX_LATEX) != -1)
    .forEach(toTeX);
}

/**
 * Format a text element into LaTeX
 * @param {Element} element
 */
function toTeX(element) {
  element.innerHTML = element.innerHTML.replace(
    REGEX_LATEX_G,
    `<span style="display: inline-block;" class="mjx">$1</span>`
  );

  const texs = element.querySelectorAll(".mjx");

  MathJax.texReset();
  texs.forEach(async (t) => {
    const options = MathJax.getMetricsFor(t);

    const node = await MathJax.tex2svgPromise(t.textContent, options);
    t.innerHTML = "";
    t.appendChild(node);
  });
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
 * @param {Object} attributes
 * @param {Element} parent
 * @returns {Element} Element created
 */
function el(tag, attr, parent) {
  const x = document.createElement(tag);
  if (parent) parent.appendChild(x);
  if (attr) Object.entries(attr).forEach(([k, v]) => x[k] = v);
  return x;
}

function hline(parent) {
  return el("hr", null, parent);
}

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * 
 * @param {Node} p 
 * @returns The nex element that has text
 */
function nextListElement(p) {
  if (!p)
    return null;
  if (p.textContent.trim() != "" && p.tagName === 'UL')
    return p;
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
  const links = container.querySelectorAll("a");
  links.forEach(a => {
    const ahref = a.getAttribute("href");
    if (ahref.startsWith("http") || ahref.startsWith("//")) {
      return;
    }

    if(ahref.startsWith("/")){
      a.href = host + ahref;
      return;
    }

    a.href = `${url.replace(/\/[^\/]*$/, "")}/${ahref}`;
  });
}

/**
 * @returns {boolean} true if the body color is dark 
 */
function isDarkMode() {
  try {
    const colorStr = window
      .getComputedStyle(document.body, null)
      .getPropertyValue("background-color");
    const matcher = colorStr.match(/\(([\d ,]+)\)/);
    const rgba = matcher[1].split(",").map((m) => parseInt(m));
    if (rgba[3] === 0) {
      return false;
    }

    const av = rgba.slice(0, 3).reduce((a, v) => a + v) / 3;
    return av < 128;

  } catch (e) {
    return false;
  }
}