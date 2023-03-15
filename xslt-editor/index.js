const panelBlueprint = (url, result) => `
<div class="optipanel">
  <div class="watermark">OptiSearch</div>
  <div class="optiheader"><a href="${url}">
      <div class="title result-title">setInterval()</div><cite class="optilink result-url"><img width="16"
          height="16"
          src="https://developer.mozilla.org/favicon-48x48.cbbd161b.png"><span>${url}</span></cite>
    </a></div>
  <hr>
  <div class="opticontent">
    ${result}
  </div>
  </div>
  `;
(function () {
  const textArea = document.querySelector('#editor');
  if (localStorage['editor'])
    textArea.value = localStorage['editor'];
  textArea.addEventListener('input', () => localStorage['editor'] = textArea.value);

  const urlInput = document.querySelector('input[name="url"]');
  if (localStorage['url'])
    urlInput.value = localStorage['url'];
  urlInput.addEventListener('input', () => localStorage['url'] = urlInput.value);

  if (localStorage['editor'] && localStorage['html'])
    panel();
})();

document.addEventListener('keydown',async (e)=>{
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    panel();
  }
});

async function displayResult(url) {
  // const xsl = await loadXMLDoc("cdcatalog_online.xsl");
  // const xml = await fetchHTML("https://www.w3schools.com/xml/cdcatalog.xml");

  // const xml = await fetchHTML("https://developer.mozilla.org/en-US/docs/Web/API/HTMLBaseElement");
  // const xml = await fetchHTML("https://developer.mozilla.org/en-US/docs/Web/API/setInterval");
  // const xml = await fetchHTML("https://stackoverflow.com/questions/114543/how-can-i-horizontally-center-an-element#114549");
  // const xml = await loadHTMLDoc("test.html");

  localStorage['html'] = await fetchHTML(url);
  panel();
}

function panel(){
  const box = document.querySelector('.optisearchbox');
  try{
    const res = xslTransform(parseXML(localStorage['editor']), parseHTML(localStorage['html']), true);
    box.innerHTML = panelBlueprint(localStorage['url'], res);
  }catch(e){
    box.textContent = e;
  }
}



function updatePanel(event) {
  event.preventDefault();
  displayResult(event.target[0].value);
}

function parseHTML(html) {
  return new window.DOMParser().parseFromString(html, "text/html");
}
function parseXML(html) {
  return new window.DOMParser().parseFromString(html, "text/xml");
}
async function fetchHTML(url) {
  return await fetch(`/?url=${url}`)
    .then(response => response.text());
}

async function loadXMLDoc(filename) {
  return await fetch(filename)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/xml"));
}
async function loadHTMLDoc(filename) {
  return await fetch(filename)
    .then(response => response.text())
    .then(str => new window.DOMParser().parseFromString(str, "text/html"));
}

function xslTransform(xsl, xml, serialize = true) {
  const xslParseError = xsl.querySelector('parsererror > div');
  if (xslParseError)
    throw "XSL file not well formated.\n" + xslParseError.innerHTML;

  const xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(serialize ? xmlSerialize(xsl) : xsl);
  const resultDocument = xsltProcessor.transformToFragment(serialize ? xmlSerialize(xml) : xml, document);
  if (resultDocument === null)
    throw "XSLT tranformation failed.";

  const tmp = document.createElement('div');
  tmp.appendChild(resultDocument);
  const str = tmp.innerHTML;
  tmp.remove();
  return str;
}

function xmlSerialize(xml) {
  const xmlSerialized = new window.XMLSerializer().serializeToString(xml);
  return new window.DOMParser().parseFromString(xmlSerialized.replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', ''), "text/xml");
}