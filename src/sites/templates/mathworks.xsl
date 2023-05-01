<?xml version="1.0" encoding="UTF-8"?>
<!--To finish
isPointing
change link
-->
<!--Tests templates
https://www.mathworks.com/matlabcentral/answers/659363-how-do-i-right-x-2-in-matlab
https://www.mathworks.com/matlabcentral/answers/25568-defining-function-handles-in-matlab#answer_33507
https://es.mathworks.com/matlabcentral/answers/459610-how-to-determine-if-a-number-is-prime
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="body">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select='.question_title h1'/>
            </xsl:attribute>
        </optiheader>
        
        <xsl:variable name="acceptedAnswer" css-select=".answer"/>
        <xsl:choose>

            <xsl:when test="$acceptedAnswer">
                <xsl:variable name="bodyAnswer" css-select="$acceptedAnswer .content"/>
                <xsl:variable name="contribution" css-select="$acceptedAnswer .contribution"/>
                <xsl:variable name="authorDetails" css-select="$contribution .author_inline"/>
                <xsl:variable name="authorTime" css-select="$contribution .answered-date"/>

                <optibody>
                    <xsl:apply-templates select="$bodyAnswer"/>
                </optibody>

                <optifoot>
                    <xsl:copy-of select="$authorDetails"/>
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
                    No answer on this question... If you know the answer, submit it!
                    </div>
                </optibody>
            </xsl:otherwise>

        </xsl:choose>
    </xsl:template>

    <xsl:template css-match="div.CodeBlock">
        <pre>
            <xsl:value-of select="."/>
        </pre>
    </xsl:template>

    <!-- identity template to copy all elements as is -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>