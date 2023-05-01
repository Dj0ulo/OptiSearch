<?xml version="1.0" encoding="UTF-8"?>
<!--
    Done
Tests URLs:
    https://www.w3schools.com/howto/howto_html_include.asp
    https://www.w3schools.com/whatis/whatis_w3css.asp#:~:text=CSS%20Quickstart-,W3.,use%20than%20other%20CSS%20frameworks.
    https://www.w3schools.com/html/
    https://www.w3schools.com/python/ref_keyword_def.asp
    https://www.w3schools.com/jsref/met_document_createelement.asp
Big example, definitions, Syntax
    https://www.w3schools.com/jsref/api_fetch.asp
Example in syntax
    https://www.w3schools.com/xml/func_document.asp
Multiple paragraph:
    https://www.w3schools.com/jsref/jsref_obj_regexp.asp
    https://www.w3schools.com/tags/att_input_type_color.asp#:~:text=The%20%3Cinput%20type%3D%22color,tag%20for%20best%20accessibility%20practices!
Works better than before:
    https://www.w3schools.com/jsref/jsref_event.asp
Image in example:
    https://www.w3schools.com/python/matplotlib_pyplot.asp
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select="h1"/>
            </xsl:attribute>
        </optiheader>

        <optistyle>
            h3 {
                font-weight: bold;
                color: #4a4a4a;
            }
            b {
                font-weight: bold;
            }
            .w3-example {
                background-color: #eff0f1;
                border-radius: 5px;
                padding: 10px 10px;
                font-size: small;
            }
            .w3-example h3 {
                margin: initial;
            }
        </optistyle>

        <optistyle color-sheme="dark">
            .w3-example {
                background-color: hsl(225.0, 5.882%, 17.33%)
            }
            h3 {
              color: #b5b5b5;
            }
        </optistyle>

        <optibody>
            <xsl:variable name="article" css-select="#main"/>
            <xsl:if test="$article">
                <xsl:variable name="summaryTitle" css-select="$article h2"/>
                <xsl:if test="$summaryTitle">
                    <xsl:for-each select="$summaryTitle/following-sibling::p">
                        <xsl:if test="preceding-sibling::h2[1] = $summaryTitle">
                            <xsl:copy-of select="."/>
                        </xsl:if>
                    </xsl:for-each>
                </xsl:if>

                <xsl:variable name="syntaxTitle" select="//h2[normalize-space() = 'Syntax']"/>
                <xsl:if test="$syntaxTitle">
                    <h3><xsl:value-of select="$syntaxTitle" /></h3>
                    <xsl:apply-templates select="$syntaxTitle/following-sibling::*[1]" />
                </xsl:if>

                <xsl:variable name="example" css-select-all=".w3-example"/>
                <xsl:if test="$example">
                    <xsl:for-each select="$example[position() &lt;= 1]">
                        <xsl:if test="not($syntaxTitle) or ./preceding-sibling::*[1] != $syntaxTitle">
                            <xsl:apply-templates select="."/>
                        </xsl:if>
                    </xsl:for-each>
                </xsl:if>
            </xsl:if>
        </optibody>

    </xsl:template>

    <xsl:template name="replaceBr">
        <xsl:for-each select="*|node()">
            <xsl:choose>
                <xsl:when test="name() = 'br'">
<xsl:text>
</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:value-of select="normalize-space()"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:for-each>
    </xsl:template>

    <xsl:template css-match=".w3-code">
        <pre>
            <xsl:call-template name="replaceBr"/>
        </pre>
    </xsl:template>

    <!-- identity template to copy all elements as is -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>