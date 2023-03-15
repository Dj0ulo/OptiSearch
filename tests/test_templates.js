// require('jsdom-global')();
// const fs = require('fs');
// const path = require('path');
// const { xsltProcess, xmlParse } = require('xslt-processor');

const { DOMParser} = window;
const parser = new DOMParser();

// (async function () {
  const url = 'https://developer.mozilla.org/en-US/docs/Web/CSS/ID_selectors';
  const templateName = 'mdn';
  const sourceDoc = await fetch(url).then(r => r.text()).then(dom);
  // const template = await readFile(`../src/templates/${templateName}.xsl`);
  const template = `<?xml version="1.0" encoding="UTF-8"?>
  <xsl:transform version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  
    <xsl:template match="/">
      <body>
  
        <xsl:variable name="body" select="body"/>
        <xsl:variable name="article" select="$body/article"/>
  
        <xsl:if test="$article">
          <xsl:variable name="syntaxTitle" select="$article//*[@id='syntax' or @id='syntaxe']"/>
          <xsl:variable name="syntax" select="$syntaxTitle/following-sibling::pre"/>
  
          <xsl:variable name="summary" select="$article/p[string-length(normalize-space()) &gt; 0][1]"/>
          <xsl:variable name="underS" select="my:underSummary($summary/following-sibling::*)"/>
  
          <xsl:variable name="title" select="$body//*[contains(@class,'title')] | $body//h1"/>
  
          <div class="mdnbody">
            <xsl:value-of select="$summary"/>
            <xsl:if test="$underS">
              <xsl:copy-of select="$underS"/>
            </xsl:if>
            <xsl:value-of select="$syntax"/>
          </div>
        </xsl:if>
      </body>
    </xsl:template>
  
    <!-- Define custom functions here -->
    <xsl:function name="my:underSummary">
      <xsl:param name="nodes"/>
  
      <!-- Implementation of the underSummary function goes here -->
      <xsl:choose>
        <xsl:when test="not($nodes) or not(ends-with(normalize-space($nodes[1]), ':'))">
          <xsl:value-of select="''"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:variable name="nextListElement" select="my:nextListElement($nodes[1]/following-sibling::*)"/>
          <xsl:copy-of select="$nextListElement"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:function>
  
    <xsl:function name="my:nextListElement">
      <xsl:param name="nodes"/>
  
      <!-- Implementation of the nextListElement function goes here -->
      <xsl:choose>
        <xsl:when test="not($nodes) or ($nodes[1][self::p[string-length(normalize-space()) &gt; 0]] and not(ends-with(normalize-space($nodes[1]), ':')))">
          <xsl:value-of select="''"/>
        </xsl:when>
        <xsl:when test="$nodes[1][self::ul]">
          <xsl:copy-of select="$nodes[1]"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:apply-templates select="$nodes[1]/following-sibling::*[1]"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:function>
  
  </xsl:transform>
  
  `;
  // const transformedDoc = xsltProcess(xmlParse(sourceDoc), xmlParse(template));

  // Output the transformed document to the console
  // console.log(transformedDoc);
  console.log(xsl(template, sourceDoc));
// })();


function dom(source) {
  return parser.parseFromString(source, "text/html");
}
// function xsl(xslString, xmlDoc) {
//   // Parse the XSLT string into a template object
//   console.log(XSLTProcessor);
//   const xsltProcessor = XSLTProcessor.new();
//   const xslDoc = parser.parseFromString(xslString, 'text/xml');
//   xsltProcessor.importStylesheet(xslDoc);

//   // Transform the XML document using the XSLT template
//   return xsltProcessor.transformToDocument(xmlDoc);
// }
function xsl(xslString, xmlDoc) {
  // Parse the XSLT string into a template object
  const xsltProcessor = new XSLTProcessor();
  const xslDoc = parser.parseFromString(xslString, 'text/xml');
  xsltProcessor.importStylesheet(xslDoc);

  // Transform the XML document using the XSLT template
  return xsltProcessor.transformToFragment(xmlDoc, document);
}

// function readFile(relativePath) {
//   return new Promise((resolve, reject) => {
//     const templatePath = path.join(__dirname, relativePath);
//     fs.readFile(templatePath, 'utf8', (err, data) => {
//       if(err)
//         reject(err)
//       resolve(data);
//     });
//   });
// }
// function readFile(relativePath) {
//   return fetch(relativePath)
// }
