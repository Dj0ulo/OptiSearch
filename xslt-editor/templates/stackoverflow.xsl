<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <title>
            <xsl:value-of select="(//*[@id='question-header']//h1)[1]"/>
        </title>
        <xsl:variable name="acceptedAnswer" select="(//*[contains(concat(' ', normalize-space(@class), ' '), ' answer ')])[1]"/>

        <xsl:if test="$acceptedAnswer">
            <xsl:variable name="bodyAnswer" select="($acceptedAnswer//*[contains(@class,'js-post-body')])[1]"/>
            <xsl:variable name="editions" select="($acceptedAnswer//*[contains(@class,'user-info')])[1]"/>
            <xsl:variable name="authorDetails" select="($editions[last()]//*[contains(@class,'user-details')])[1]"/>
            <xsl:variable name="authorTime" select="($editions[last()]//*[contains(@class,'user-action-time')])[1]"/>
            <xsl:variable name="editorDetails" select="($editions[1]//*[contains(@class,'user-details')])[1]"/>
            <xsl:variable name="editorTime" select="($editions[1]//*[contains(@class,'user-action-time')])[1]"/>
            <xsl:variable name="attributeAnswerId" select="'data-answerid'"/>

            <div class="stackbody">
                <xsl:copy-of select="$bodyAnswer"/>
            </div>

            <div class="stackfoot">
                <xsl:value-of select="$authorDetails"/>
                <xsl:text> – </xsl:text>
                <xsl:value-of select="$authorTime"/>
            </div>
        </xsl:if>

    </xsl:template>

    <xsl:template match="//*[contains(@class,'snippet')]">
    </xsl:template>
</xsl:stylesheet>
