Sites.mdn.msgApi = (link) => {
    return {
    }
}
Sites.mdn.get = (from, doc) => {
    const body = doc.querySelector("body");

    const article = body.querySelector("article");
    if(!article){
        return;
    }

        
    const syntaxTitle = article.querySelector("#syntax, #syntaxe");
    const syntax = syntaxTitle && syntaxTitle.nextSibling.querySelector("pre");

    const summary = Array.from(article.querySelectorAll("p")).find(p => p.textContent != "");

    const underS = underSummary(summary);

    const title = body.querySelector(".title, h1")
    return {
        title : title?.textContent ?? "",
        summary : (summary?.outerHTML ?? '') + (underS?.outerHTML ?? ''),
        syntax : syntax?.outerHTML ?? "",
    }
}

Sites.mdn.set = msg => {
    const bodyPanel = document.createElement("div");
    bodyPanel.className = "mdnbody";
    bodyPanel.innerHTML = (msg.summary ? msg.summary : "") + (msg.syntax ? msg.syntax : "");

    return {body: bodyPanel};
}