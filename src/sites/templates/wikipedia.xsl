<?xml version="1.0" encoding="UTF-8"?>
<!-- 
    TODO: Test on firefox
Tests URLs:
    Has a main picture:
        https://fr.wikipedia.org/wiki/Michael_Jackson

    Doesn't have a main picture:
        https://fr.wikipedia.org/wiki/Hello_(chanson_d%27Adele)

    When summary finishes by ":"
        https://en.wikipedia.org/wiki/Crow_foot
        https://fr.wikipedia.org/wiki/USL
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of css-select="#firstHeading"/>
            </xsl:attribute>
        </optiheader>

        <optistyle>
            img {
                width: 40%;
                height: 100%;
                float: right;
                border-radius: 5px;
                margin: 10px;
            }
            p {
                margin: 0.5em 0;
            }
        </optistyle>

        <xsl:variable name="article" css-select="#mw-content-text .mw-parser-output"/>
        <xsl:variable name="infobox" css-select="$article [class^=infobox]"/>

        <xsl:variable name="img" css-select="$infobox .images > .image, $infobox .images img, $article .thumbinner .image" />
        <!-- On Firefox, the image should be fetched and transformed in base64 -->

        <xsl:variable name="children" css-select-all="$article > p"/>
        <xsl:variable name="summary" select="$children[not(@class) and normalize-space() != ''][1]"/>

        <optibody>
            <xsl:apply-templates select="$img"/>
            <xsl:copy-of select="$summary"/>

            <!-- If last character of $summary is a colon then put the next paragraph too -->
            <xsl:if test="substring(normalize-space($summary), string-length(normalize-space($summary))) = ':'">
                <xsl:copy-of select="$summary/following-sibling::*[normalize-space()][1]"/>
            </xsl:if>
        </optibody>

    </xsl:template>

    <xsl:template match="*[@class='image']">
        <xsl:element name="{name()}">
            <xsl:copy-of select="@*"/>
            <xsl:attribute name="class">imgwiki</xsl:attribute>
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <!-- identity template to copy all elements as is -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>

</xsl:stylesheet>