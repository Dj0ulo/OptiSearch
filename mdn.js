function getMDN(from, doc){
    var body = doc.querySelector("body");

    let article = body.querySelector("#wikiArticle");
    if(!article){
        return;
    }
        
    let syntax = article.querySelector(".syntaxbox");
    let summary = article.querySelector("p");

    return {
        title : body.querySelector(".titlebar .title").textContent,
        link : from.link,
        site : from.site,
        summary : summary ? summary.outerHTML : null,
        syntax : syntax ? syntax.outerHTML : null
    }
}

function setMDN(msg){
    var bodyPanel = document.createElement("div");
    bodyPanel.className = "mdnbody";
    bodyPanel.innerHTML = (msg.summary ? msg.summary : "") + (msg.syntax ? msg.syntax : "");

    return {body: bodyPanel};
}