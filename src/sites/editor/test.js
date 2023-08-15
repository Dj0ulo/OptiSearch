(async function () {
  adoptStyleSheet();

  const id = "url-tests";
  const inputEl = $(`input[name="${id}"]`);
  if (localStorage[id])
    inputEl.value = localStorage[id];

  inputEl.parentElement.onsubmit = (event) => {
    event.preventDefault();
    const val = inputEl.value.trim();
    localStorage[id] = val;
    inputEl.value = val;
    start();
  };

  start();

  async function start() {
    const r = await get(localStorage[id]);
    const testResults = await Promise.all(await executeTests(r));

    console.log(testResults);

    const testsContainer = $('#tests-container');
    testsContainer.innerHTML = '';
    testResults.forEach(res => {
      const row = el('div', { className: 'test-row' }, testsContainer)
      el('div', { className: 'left' }, row).appendChild(res.box);
      if (res.error) {
        return;
      }
      el('div', { className: 'right' }, row).appendChild(createTable(res));
    });
  }

  async function executeTests(xmlTest) {
    const testFile = parseXML(xmlTest);

    const testsuite = testFile.querySelector('testsuite');
    const templateUrl = testsuite.getAttribute('template');

    const templateFile = await get(templateUrl);
    const templateDoc = parseXML(templateFile);

    return [...testsuite.querySelectorAll('test')].map(async test => {
      const src = test.getAttribute('src');
      const html = await get(src);

      const box = optisearchbox(templateFile, src, html);
      if ($('.optisearch-error', box)) {
        return {
          src,
          box,
          error: true,
        };
      }

      const doc = parseHTML(html);
      const res = parseHTML(xslTransform(templateDoc, doc));

      const nmsp = 'xsltmp';
      const toRemove = ` xmlns:${nmsp}="http://www.w3.org/1999/XSL/Transform/remixed"`;

      const testXSL =
        `<?xml version="1.0" encoding="UTF-8"?>
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ${toRemove}>
          <xsl:template match="test">
            <xsl:apply-templates select="//it"/>
          </xsl:template>
  
          <xsl:template match="it">
            <it>
              <${nmsp}:attribute name="should"><xsl:value-of select="./@should"/></${nmsp}:attribute>
              <xsl:apply-templates />
            </it>
          </xsl:template>
  
          <xsl:template match="assert">
            <xsl:variable name="expected" select="./@expected"/>
            <xsl:variable name="actual" select="./@actual"/>
            <assert>
              <${nmsp}:attribute name="passed">
                <${nmsp}:choose>
                  <${nmsp}:when>
                    <xsl:attribute name="test">
                      <xsl:if test="$expected"><xsl:value-of select='$expected'/> = </xsl:if><xsl:value-of select='$actual'/>
                    </xsl:attribute>   
                    <${nmsp}:text>true</${nmsp}:text>
                  </${nmsp}:when>
                  <${nmsp}:otherwise>
                    <${nmsp}:text>false</${nmsp}:text>
                  </${nmsp}:otherwise>
                </${nmsp}:choose>
              </${nmsp}:attribute>

              <xsl:if test="$expected">
                <expected>
                  <${nmsp}:value-of>
                    <xsl:attribute name="select"><xsl:value-of select='$expected'/></xsl:attribute>
                  </${nmsp}:value-of>
                </expected>
              </xsl:if>

              <actual>
                <${nmsp}:value-of>
                  <xsl:attribute name="select"><xsl:value-of select='$actual'/></xsl:attribute>
                </${nmsp}:value-of>
              </actual>
            </assert>
          </xsl:template>
  
          <xsl:template match="variable">
            <xsl:element name="${nmsp}:variable">
                <xsl:copy-of select="@*"/>
            </xsl:element>
          </xsl:template>
        </xsl:stylesheet>`;

      const testingDoc = xslTransform(parseXML(testXSL), test)
        .replaceAll(toRemove, '')
        .replaceAll(nmsp, 'xsl');

      const xslOnActualPanel =
        `<?xml version="1.0" encoding="UTF-8"?>
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:template match="/">
            ${testingDoc}
            </xsl:template>
        </xsl:stylesheet>`;
      console.log(testingDoc);
      const resDoc = parseHTML(xslTransform(parseXML(xslOnActualPanel), res));
      console.log(resDoc);
      const testRes = [];
      resDoc.querySelectorAll('it').forEach((it) => {
        testRes.push({
          'should': it.getAttribute('should'),
          'asserts': [],
        });
        it.querySelectorAll('assert').forEach((assert) => {
          testRes.at(-1).asserts.push({
            'passed': assert.getAttribute('passed') === 'true',
            'expected': assert.querySelector('expected')?.textContent,
            'actual': assert.querySelector('actual')?.textContent,
          });
        });
        testRes.at(-1).passed = !testRes.at(-1).asserts.some(a => !a.passed);
      });

      return {
        src,
        results: testRes,
        passed: !testRes.some(r => !r.passed),
        box,
      };
    });
  }

  function createTable(data) {
    const table = document.createElement('table');
    table.className = 'test-results'
    const headerRow = document.createElement('tr');
    const nbPassed = data.results.reduce((prev, it) => {
      return prev + it.asserts.reduce((prev, assert) => prev + (assert.passed ? 1 : 0), 0);
    }, 0);
    const nbTotal = data.results.reduce((prev, it) => {
      return prev + it.asserts.length;
    }, 0);
    const headerCols = ['It should...', 'Comparison', `${nbPassed}/${nbTotal} ${data.passed ? '✅' : '❌'}`];

    headerCols.forEach(colText => {
      const th = document.createElement('th');
      th.textContent = colText;
      headerRow.appendChild(th);
    });

    table.appendChild(headerRow);

    data.results.forEach(result => {
      result.asserts.forEach(assert => {
        const row = document.createElement('tr');

        const shouldCell = document.createElement('td');
        shouldCell.textContent = result.should;
        row.appendChild(shouldCell);

        const comparisonCell = document.createElement('td');
        comparisonCell.className = 'comparison'
        row.appendChild(comparisonCell);

        const expectedCell = document.createElement('div');
        comparisonCell.appendChild(expectedCell);

        if (!assert.passed) {
          expectedCell.className = 'expected';
          el('span', { textContent: 'EXPECT: ' }, expectedCell);
          el('span', { className: 'expected', textContent: assert.expected }, expectedCell);

          const actualCell = el('div');
          el('span', { textContent: 'ACTUAL: ' }, actualCell);
          el('span', { className: 'actual', textContent: assert.actual }, actualCell);
          comparisonCell.appendChild(actualCell);
        } else {
          expectedCell.textContent = assert.expected;
        }

        const passedCell = document.createElement('td');
        passedCell.textContent = assert.passed ? '✅' : '❌';
        if (!assert.passed) {
          passedCell.classList.add('failed');
        }
        row.appendChild(passedCell);

        table.appendChild(row);
      });
    });

    return table;
  }
})();