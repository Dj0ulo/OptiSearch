Sites.mdn.msgApi = (link) => {
    return {
    }
}
Sites.mdn.get = (from, doc) => {
    const body = doc.querySelector("body");

    const article = body.querySelector("#content, article");
    if (!article) {
        return;
    }

    const baselineIndicator = article.querySelector(".baseline-indicator");
    const extra = baselineIndicator?.querySelector(".extra");
    const browsers = baselineIndicator?.querySelector(".browsers");
    if (browsers && extra) {
      extra.prepend(browsers);
    }
    const syntaxTitle = article.querySelector("#syntax, #syntaxe");
    const syntax = syntaxTitle && syntaxTitle.nextElementSibling.querySelector("pre");

    const summary = Array.from(article.querySelectorAll("p")).find(p => p.textContent != "" && !p.closest('header') && !p.closest('.extra'));

    const underS = underSummary(summary);

    const title = body.querySelector(".title, h1")
    return {
        title: title?.textContent ?? "",
        baselineIndicator: baselineIndicator?.outerHTML ?? "",
        summary: (summary?.outerHTML ?? "") + (underS?.outerHTML ?? ""),
        syntax: syntax?.outerHTML ?? "",
    };
}

Sites.mdn.set = msg => {
    const bodyPanel = document.createElement("div");
    bodyPanel.className = "mdnbody";
    // Add MDN baseline-indicator CSS via a <link> element
    const styleLink = document.createElement("link");
    styleLink.rel = "stylesheet";
    styleLink.type = "text/css";
    styleLink.href = "https://developer.mozilla.org/static/css/document/baseline-indicator.css";
    document.head.appendChild(styleLink);

    // Add the rest of the content
    if (msg.baselineIndicator) {
      bodyPanel.insertAdjacentHTML("beforeend", msg.baselineIndicator);
    }
    if (msg.summary) {
      bodyPanel.insertAdjacentHTML("beforeend", msg.summary);
    }
    if (msg.syntax) {
      bodyPanel.insertAdjacentHTML("beforeend", msg.syntax);
    }

    return { body: bodyPanel };
}