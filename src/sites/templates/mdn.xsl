<?xml version="1.0" encoding="UTF-8"?>
<!-- 
    Done (except the utf is messed up)
Tests URLs:
https://developer.mozilla.org/fr/docs/Web/API/Document/createElement
https://developer.mozilla.org/fr/docs/Web/API/Node/appendChild
https://developer.mozilla.org/fr/docs/Web/JavaScript
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select=".title, h1"/>
            </xsl:attribute>
        </optiheader>

        <xsl:variable name="article" css-select="article"/>
        <xsl:if test="$article">
            <xsl:variable name="syntaxTitle" css-select="$article #syntax, $article #syntaxe"/>
            <xsl:variable name="syntax" select="$syntaxTitle/following-sibling::*//pre"/>
            <xsl:variable name="summary" select="($article//p[normalize-space()])[1]"/>
            <optibody>
                <xsl:copy-of select="$summary"/>
                <!-- If last character of $summary is a colon then put the next paragraph too -->
                <xsl:if test="substring(normalize-space($summary), string-length(normalize-space($summary))) = ':'">
                    <xsl:copy-of select="$summary/following-sibling::*[normalize-space()][1]"/>
                </xsl:if>
                <xsl:copy-of select="$syntax"/>
            </optibody>
        </xsl:if>
    </xsl:template>

</xsl:stylesheet>