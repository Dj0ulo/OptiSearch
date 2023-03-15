<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <title>
      <xsl:value-of select="(//*[@class='title' or self::h1])[1]"/>
    </title>
    <xsl:variable name="article" select="//article"/>

    <xsl:if test="$article">
      <xsl:variable name="syntaxTitle" select="$article//*[@id='syntax' or @id='syntaxe']"/>
      <xsl:variable name="syntax" select="$syntaxTitle/following-sibling::*//pre"/>

      <xsl:variable name="summary" select="($article//p[normalize-space()])[1]"/>

      <div class="mdnbody">
        <xsl:copy-of select="$summary"/>

        <!-- If last character of $summary is : -->
        <xsl:if test="substring(normalize-space($summary), string-length(normalize-space($summary))) = ':'">
          <xsl:copy-of select="$summary/following-sibling::*[normalize-space()][1]"/>
        </xsl:if>
        <xsl:copy-of select="$syntax"/>
      </div>
    </xsl:if>
  </xsl:template>
</xsl:stylesheet>
