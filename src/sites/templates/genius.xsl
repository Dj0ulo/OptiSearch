<?xml version="1.0" encoding="UTF-8"?>
<!--To finish-->
<!--
    https://genius.com/James-marvel-way-of-the-warrior-lyrics
-->

<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

    xmlns:opts="https://github.com/Dj0ulo/OptiSearch"
    opts:version="1.0"
    opts:name="Genius"
    opts:description="Display lyrics from genius"
    opts:icon=""
    opts:match="/https:\/\/genius\.com\/[^\/]*$/"
    opts:include="identity"
    opts:host="genius.com"
>
    <xsl:template match="/">
        <optiheader>
            <xsl:attribute name="title">
                <xsl:value-of select="substring-before(//title, '|')"/>
            </xsl:attribute>
        </optiheader>

        <optistyle>
            optibody {
                max-height: 400px;
            }
        </optistyle>

        <optibody>
            <xsl:variable name="lyricsDiv" css-select="#lyrics-root"/>
            <xsl:for-each select="$lyricsDiv//*[starts-with(@class, 'Lyrics__Container')]">
                <p>
                    <xsl:apply-templates select="."/>
                </p>
            </xsl:for-each>
        </optibody>
    </xsl:template>

    <!-- template to replace the links by their innerHTML -->
    <xsl:template match="//a">
        <xsl:copy-of select="./*"/>
    </xsl:template>

    <!-- identity template to copy all elements as is -->
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()"/>
        </xsl:copy>
    </xsl:template>
</xsl:stylesheet>