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
  const copyButton = el("div", null, "opticopy", ICON_COPY);
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
 * @param {Element} parent
 * @param {string} className
 * @param {string} html innerHTML
 * @returns {Element} Element created
 */
function el(tag, parent, className, html) {
  const x = document.createElement(tag);
  if (parent) parent.appendChild(x);
  if (className) x.className = className;
  if (html) x.innerHTML = html;
  return x;
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
    if (rgba[3] === 0) return false;
    else {
      const av = rgba.slice(0, 3).reduce((a, v) => a + v) / 3;
      return av < 128;
    }
  } catch (e) {
    return false;
  }
}