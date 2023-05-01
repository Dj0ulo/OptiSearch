(async function executeTest() {
  const r = await fetch('../templates/tests/test_w3schools.xml').then(r=>r.text());
  const testFile = parseXML(r);

  const testsuite = testFile.querySelector('testsuite');
  const template = testsuite.getAttribute('template');

  const templateFile = await fetch(template).then(r=>r.text());
  const templateDoc = parseXML(templateFile);

  const tests = testsuite.querySelectorAll('test');
  tests.forEach(async test => {
    const src = test.getAttribute('src');
    const html = await bgFetch(src);
    const doc = parseHTML(html);

    const res = parseHTML(xslTransform(templateDoc, doc));

    const nmsp = 'xsltmp';
    const toRemove = ` xmlns:${nmsp}="http://www.w3.org/1999/XSL/Transform/remixed"`;

    const testXSL = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    ${toRemove}
    >

    <xsl:template match="test">
      [
        <xsl:apply-templates select="//it"/>
      ]
    </xsl:template>

    <xsl:template match="it">
      "<xsl:value-of select="./@should"/>":
      {<xsl:apply-templates />},
    </xsl:template>

    <xsl:template match="assert">
      <xsl:variable name="expected" select="./@expected"/>
      <xsl:variable name="actual" select="./@actual"/>

      "passed":
      <${nmsp}:choose>
        <${nmsp}:when>
          <xsl:attribute name="test"><xsl:if test="$expected"><xsl:value-of select='$expected'/> = </xsl:if><xsl:value-of select='$actual'/></xsl:attribute>
true
        </${nmsp}:when>
        <${nmsp}:otherwise>
false
        </${nmsp}:otherwise>
      </${nmsp}:choose>,

<xsl:if test="$expected">
"expected": "<${nmsp}:value-of>
  <xsl:attribute name="select"><xsl:value-of select='$expected'/></xsl:attribute>
</${nmsp}:value-of>",
</xsl:if>
"actual": "<${nmsp}:value-of>
  <xsl:attribute name="select"><xsl:value-of select='$actual'/></xsl:attribute>
</${nmsp}:value-of>",

    </xsl:template>

    <xsl:template match="variable">
      <xsl:element name="${nmsp}:variable">
          <xsl:copy-of select="@*"/>
      </xsl:element>
    </xsl:template>

</xsl:stylesheet>
    `;
    const testingDoc = xslTransform(parseXML(testXSL), test)
    .replaceAll(toRemove, '')
    .replaceAll(nmsp, 'xsl');
    // console.log(parseXML(testXSL), res);


    const xslOnActualPanel = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    >
    <xsl:template match="/">
    ${testingDoc}
    </xsl:template>
</xsl:stylesheet>
    `;

    const finalRes = xslTransform(parseXML(xslOnActualPanel), res);
    console.log(finalRes);
  });
})();