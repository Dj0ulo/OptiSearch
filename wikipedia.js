function getWiki(from, doc){
    let body = doc.querySelector("body");
    let article = body.querySelector("#mw-content-text .mw-parser-output");
    let infobox = article.querySelector("[class^=infobox]");
    let img;
    if(infobox)
        img = infobox.querySelector(".image img");
    else{
        img = article.querySelector(".thumbinner .image img")
    }

    let children = article.querySelectorAll(":scope > p");
    let summary = null;
    for (let i = 0; i < children.length; i++) {
        const p = children[i];
        if(!p.className){
            summary = p;
            break;
        }
    }

    return {
        title : body.querySelector("#firstHeading").textContent,
        link : from.link,
        site : from.site,
        summary : summary ? summary.outerHTML : null,
        img : img ? img.outerHTML : null
    }
}

function setWiki(msg){
    var bodyPanel = document.createElement("div");
    bodyPanel.className = "wikibody";
    bodyPanel.innerHTML = (msg.img ? msg.img : "") + (msg.summary ? msg.summary : "");
    return {body: bodyPanel};
}