Sites.wikipedia.msgApi = (link) => {
  const url = new URL(link);
  const pageName = url.pathname.match(/\/([^\/]+$)/)[1]
  return {
    // api: `${url.origin}/w/api.php?action=parse&format=json&prop=text&formatversion=2&page=${pageName}`,
    // type: 'json'
  }
}

/**
 * 
 * @param {*} from 
 * @param {Document} doc 
 * @returns 
 */
Sites.wikipedia.get = async (from, doc) => {
  const body = doc.body;
  const article = body.querySelector("#mw-content-text .mw-parser-output");
  const infobox = article.querySelector("[class^=infobox]");

  let img;
  if (infobox)
    img = infobox.querySelector(".images > .image");
  if (!img)
    img = article.querySelector(".thumbinner .image");
  if (img)
    img.className = "imgwiki";

  const children = [...article.querySelectorAll(":scope > p")];
  const summary = children.find(c => !c.className && c.textContent.trim() != "");

  if (img && !onChrome()) {
    const actualImg = img.querySelector('img');
    actualImg.src = await srcToBase64(actualImg.src);
  }

  const title = body.querySelector("#firstHeading")
  return {
    title: title ? title.textContent : "",
    summary: (summary?.outerHTML ?? '') + (underSummary(summary)?.outerHTML ?? ''),
    img: img?.outerHTML,
  }
}

Sites.wikipedia.set = msg => {
  return {
    body: el("div", {
      className: 'wikibody',
      innerHTML: (msg.img ?? "") + (msg.summary ?? ""),
    })
  };
}