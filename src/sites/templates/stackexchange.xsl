<?xml version="1.0" encoding="UTF-8"?>
<!--Tests templates
https://stackoverflow.com/questions/45551901/list-the-direct-children-of-the-elements-of-an-xml-document-using-xsl#45556709
https://stackoverflow.com/questions/68240921/serve-static-files-with-expressjs-typescript-nodejs#68240993
No answers:
https://stackoverflow.com/questions/51590844/xslt-select-the-first-success-in-xslchoose
Images:
https://stackoverflow.com/questions/7505623/colors-in-javascript-console#13017382
snippet:
https://stackoverflow.com/questions/72349410/multiplication-table-in-javascript-space-between-numbers#72349552
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select="#question-header h1"/>
            </xsl:attribute>
        </optiheader>
        <xsl:variable name="acceptedAnswer" css-select=".answer"/>

        <xsl:choose>

            <xsl:when test="$acceptedAnswer">
                <xsl:variable name="bodyAnswer" css-select="$acceptedAnswer .js-post-body"/>
                <xsl:variable name="editions" css-select-all="$acceptedAnswer .user-info"/>
                <xsl:variable name="authorDetails" css-select="$editions[last()] .user-details"/>
                <xsl:variable name="authorName" css-select="$authorDetails a"/>
                <xsl:variable name="authorTime" css-select="$editions[last()] .user-action-time"/>

                <optibody>
                    <xsl:copy-of select="$bodyAnswer"/>
                </optibody>

                <optifoot>
                    <xsl:choose>
                        <xsl:when test="$authorName">
                            <xsl:copy-of select="$authorName"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="$authorDetails"/>
                        </xsl:otherwise>
                    </xsl:choose>
                    <xsl:text> – </xsl:text>
                    <xsl:value-of select="$authorTime"/>
                </optifoot>
            </xsl:when>

            <xsl:otherwise>
                <optistyle>
                    .noanswer{
                        margin: 1em 0;
                    }
                </optistyle>
                <optibody>
                    <div class="noanswer">
                    No answer on this question... If you know the answer, <a href="#post-form">submit it</a>!
                    </div>
                </optibody>
            </xsl:otherwise>

        </xsl:choose>
    </xsl:template>

    <!--Don't remember what is the purpose of the following-->
    <xsl:template match="//*[contains(@class,'snippet')]">
    </xsl:template>
</xsl:stylesheet>