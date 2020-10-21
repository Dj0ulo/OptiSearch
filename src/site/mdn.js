Sites.mdn.get = (from, doc) => {
    const body = doc.querySelector("body");

    const article = body.querySelector("#wikiArticle");
    if(!article){
        return;
    }
        
    const syntax = article.querySelector(".syntaxbox");
    const summary = article.querySelector("p");

    const title = body.querySelector(".titlebar .title")
    return {
        title : title ? title.textContent : "",
        link : from.link,
        site : from.site,
        summary : summary ? summary.outerHTML : null,
        syntax : syntax ? syntax.outerHTML : null
    }
}

Sites.mdn.set = msg => {
    const bodyPanel = document.createElement("div");
    bodyPanel.className = "mdnbody";
    bodyPanel.innerHTML = (msg.summary ? msg.summary : "") + (msg.syntax ? msg.syntax : "");

    return {body: bodyPanel};
}