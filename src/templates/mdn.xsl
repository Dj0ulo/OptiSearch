<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template match="/">
    <body>

      <xsl:variable name="article" select="article"/>
      <xsl:value-of select="article"/>


      <xsl:if test="$article">
        <xsl:variable name="syntaxTitle" select="$article//*[@id='syntax' or @id='syntaxe']"/>
        <xsl:variable name="syntax" select="$syntaxTitle/following-sibling::pre"/>

        <xsl:variable name="summary" select="$article/p[string-length(normalize-space()) &gt; 0][1]"/>
        <xsl:variable name="underS">
          <xsl:call-template name="underSummary">
            <xsl:with-param name="nodes" select="$summary/following-sibling::*"/>
          </xsl:call-template>
        </xsl:variable>

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

  <!-- Define custom templates here -->
  <xsl:template name="underSummary">
    <xsl:param name="nodes"/>

    <xsl:choose>
      <xsl:when test="not($nodes) or not(ends-with(normalize-space($nodes[1]), ':'))">
        <xsl:value-of select="''"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:variable name="nextListElement">
          <xsl:call-template name="nextListElement">
            <xsl:with-param name="nodes" select="$nodes[1]/following-sibling::*"/>
          </xsl:call-template>
        </xsl:variable>
        <xsl:copy-of select="$nextListElement"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="nextListElement">
    <xsl:param name="nodes"/>

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
  </xsl:template>

</xsl:transform>
