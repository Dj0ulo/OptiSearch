<?xml version="1.0" encoding="UTF-8"?>
<!--To finish
isPointing
change link
-->
<!--Tests templates
https://answers.unity.com/questions/1710721/how-do-i-move-an-object-to-the-position-of-another.html
https://answers.unity.com/questions/1558555/moving-an-object-left-and-right.html
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select='.question-title'/>
            </xsl:attribute>
            <xsl:attribute name="icon">
                <xsl:value-of select='//link[@rel="shortcut icon"]/@href'/>
            </xsl:attribute>

        </optiheader>
        
        <xsl:variable name="acceptedAnswer" css-select=".answer"/>

        <xsl:if test="$acceptedAnswer">

            <xsl:variable name="bodyAnswer" css-select="$acceptedAnswer .answer-body"/>
            <xsl:variable name="authorDetails" css-select="$acceptedAnswer .author-info"/>

            <optibody>
                <xsl:apply-templates select="$bodyAnswer"/>
            </optibody>

            <optifoot>
                <xsl:copy-of select="$authorDetails"/>
            </optifoot>
        </xsl:if>
    </xsl:template>

    <xsl:template match="*[not(normalize-space())]">
    </xsl:template>

    <!-- identity template to copy all elements as is -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>