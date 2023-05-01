/**
 * Parse a XML string into a DOM document.
 * XML is more strict than HTML in the way it needs to be formated.
 * @param {string} xml 
 */
function parseXML(xml) {
  const res = new window.DOMParser().parseFromString(xml, "text/xml");
  const parsingError = res.querySelector('parsererror > div');
  if (parsingError)
    throw parsingError.innerHTML;
  return res;
}

/**
 * Parse a HTML string into a DOM document
 * @param {string} html 
 */
function parseHTML(html) {
  return new window.DOMParser().parseFromString(html, "text/html");
}

/**
 * Fetch and parse an XML file into a DOM document
 * @param {string} filename 
 */
async function loadXMLDoc(filename) {
  return await fetch(filename).then(r => r.text()).then(parseXML);
}

/**
 * Fetch and parse an HTML file into a DOM document
 * @param {string} filename 
 */
async function loadHTMLDoc(filename) {
  return await fetch(filename).then(r => r.text()).then(parseHTML);
}

/**
 * Parse an XML document using an XSL template
 * @param {Document} xsl Template to use in by transformation
 * @param {Document} xml Document to parse where the information is
 */
function xslTransform(xsl, xml) {
  const xslParseError = xsl.querySelector('parsererror > div');
  if (xslParseError)
    throw new Error("XSL file not well formated.\n" + xslParseError.innerHTML);

  xsl.querySelectorAll('*[css-select]').forEach(el => {
    el.setAttribute('select', `(${cssToXsl(el.getAttribute('css-select'))})[1]`);
    el.removeAttribute('css-select');
  });
  xsl.querySelectorAll('*[css-match]').forEach(el => {
    el.setAttribute('match', `${cssToXsl(el.getAttribute('css-match'))}`);
    el.removeAttribute('css-match');
  });
  xsl.querySelectorAll('*[css-select-all]').forEach(el => {
    el.setAttribute('select', cssToXsl(el.getAttribute('css-select-all')));
    el.removeAttribute('css-select-all');
  });

  const xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(normalizeDoc(xsl));
  const resultDocument = xsltProcessor.transformToFragment(normalizeDoc(xml), document);
  if (resultDocument === null)
    throw new Error("XSLT tranformation failed.");

  const tmp = document.createElement('div');
  tmp.appendChild(resultDocument);
  const str = tmp.innerHTML;
  tmp.remove();
  return str;
}

/**
 * Normalize an XML document. 
 * Especially useful to make an HTML document comply with the more strict XML formatting rules.
 * @param {Document} doc 
 */
function normalizeDoc(doc) {
  // Todo benchmark if replaceAll is faster than querySelectorAll
  let xmlSerialized = new window.XMLSerializer().serializeToString(doc);
  xmlSerialized = xmlSerialized.replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', '');
  while (true) {
    try {
      return parseXML(xmlSerialized);
    } catch (e) {
      const match = e.match(/^error on line (\d+) at column (\d+): (.*)/);
      if (!match)
        throw e;
      const [_, line, column, error] = match;
      if (error === 'error parsing attribute name') {
        const oldLine = xmlSerialized.split('\n')[line - 1];
        let attribute = oldLine.slice(column - 1).match(/^[^\s=]+( *= *"[^\"]*")?/);
        const newLine = oldLine.slice(0, column - 1) + oldLine.slice(column - 1 + attribute[0].length);
        xmlSerialized = xmlSerialized.split('\n').slice(0, line - 1).join('\n') + '\n' + newLine + '\n' + xmlSerialized.split('\n').slice(line).join('\n');
      } else if (error.match(/Namespace prefix ([^\s]*) on ([^\s]*) is not defined/)) {
        const [_, namespace, tag] = error.match(/Namespace prefix ([^\s]*) on ([^\s]*) is not defined/);
        xmlSerialized = xmlSerialized
          .replace(new RegExp(`<\s*${namespace}:`, 'g'), "<")
          .replace(new RegExp(`<\/\s*${namespace}:`, 'g'), "</");
      }
      else {
        throw new Error(`while normalizing the HTML document:\n${error}\n\tnear (${line}:${column})\n<pre>${escapeHtml(xmlSerialized.split('\n')[line - 1].slice(0, column).trim())}</pre>`);
      }

    }
  }

}

function cssToXsl(cssSelector) {
  // console.log(cssSelector);
  // Replace comma-separated selectors with XSL syntax
  const subSelectors = cssSelector.split(',')
  // console.log('sub', subSelectors);
  if (subSelectors.length >= 2)
    return subSelectors.map(s => cssToXsl(s.trim())).join('|');

  // Replace child selectors with forward slashes
  cssSelector = cssSelector.replace(/\s+>\s+/g, '/');

  // Replace descendant selectors with slashes
  cssSelector = cssSelector.replace(/\s+/g, '//');

  // Replace attribute selectors with XSL syntax
  cssSelector = cssSelector.replace(/(\$?[\w-]*)\[([\w-]+)([=~\|\^\$\*]?=?)['"]?([^\]'"]*)['"]?\]/g,
    (all, parent, left, op, right) => {
      if (parent.startsWith('$'))
        return all;

      let attrSel = '';
      if (op == '^=')
        attrSel = `[starts-with(@${left}, "${right}")]`;
      else
        attrSel = `[@${left}${op}"${right}"]`;
      return `${parent || '*'}${attrSel}`;
    });

  // Replace class selectors with XSL syntax
  cssSelector = cssSelector.replace(/([\w-]*)\.([\w-]+)/g, (all, p1, p2) => {
    return `${p1 || '*'}[contains(concat(" ",normalize-space(@class)," "), " ${p2} ")]`;
  });

  // Replace ID selectors with XSL syntax
  cssSelector = cssSelector.replace(/([\w-]*)#([\w-]+)/g, (all, p0, p1) => {
    return `${p0 || '*'}[@id="${p1}"]`;
  });

  // Replace pseudo-classes with XSL syntax
  cssSelector = cssSelector.replace(/:(first-child|last-child|nth-child\(\d+\))/g, '[position()=1]');

  // Add root element selector
  if (!cssSelector.startsWith('$'))
    cssSelector = '//' + cssSelector;

  return cssSelector;
}