<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml" 
  xpath-default-namespace="http://www.w3.org/1999/xhtml">
  <xsl:output method="xhtml" indent="yes" />

  <xsl:template match="/">
    <html>
      <head>
        <title>Wikipedia Page</title>
      </head>
      <body>
        <!-- Get the first paragraph of the page -->
        <xsl:variable name="firstPara" select="//p[1]"/>
        <!-- Get the first image of the page -->
        <xsl:variable name="firstImage" select="//img[1]"/>
        <!-- Display the image -->
        <img src="{$firstImage/@src}" alt="{$firstImage/@alt}"/>
        <!-- Display the paragraph -->
        <p><xsl:value-of select="$firstPara"/></p>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>