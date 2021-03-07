Sites.wikipedia.msgApi = (link) => {
    const url = new URL(link);
    const pageName = url.pathname.match(/\/([^\/]+$)/)[1]
    return {
        // api: `${url.origin}/w/api.php?action=parse&format=json&prop=text&formatversion=2&page=${pageName}`,
        // type: 'json'
    }
}

Sites.wikipedia.get = (from, doc) => {
    // console.log(from, doc);
    const body = doc.querySelector("body");
    const article = body.querySelector("#mw-content-text .mw-parser-output");
    const infobox = article.querySelector("[class^=infobox]");

    let img;
    if(infobox)
        img = infobox.querySelector(".images > .image");
    if(!img)
        img = article.querySelector(".thumbinner .image");
    if(img)
        img.className = "imgwiki";

    const children = [...article.querySelectorAll(":scope > p")];
    let summary = children.find(c => !c.className && c.textContent.trim()!="");

    const underS = underSummary(summary);

    const title = body.querySelector("#firstHeading")
    return {
        title : title ? title.textContent : "",
        summary : (summary?.outerHTML ?? '') + (underS?.outerHTML ?? ''),
        img : img?.outerHTML,
    }
}

Sites.wikipedia.set = msg => {
    const bodyPanel = document.createElement("div");
    bodyPanel.className = "wikibody";
    bodyPanel.innerHTML = (msg.img ? msg.img : "") + (msg.summary ? msg.summary : "");
    return {body: bodyPanel};
}