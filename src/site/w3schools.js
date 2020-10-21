Sites.w3schools.get = (from, doc) => {
    const body = doc.querySelector("body");

    const article = body.querySelector("#main");
    if(!article){
        return;
    }
    const children = article.children;

    let summary = "", syntax = "";
    for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if(c.tagName == "H2"){
            if(c.textContent == "Definition and Usage"){
                for (let k = i+1; k < children.length; k++) {
                    const p = children[k];                
                    if(p.tagName != "P")
                        break;
                    summary += p.outerHTML;
                }
            }
            else if(c.textContent == "Syntax"){
                syntax = "<pre>"+c.nextElementSibling.innerHTML.replace(/\n/g,"").trim()+"</pre>";
            }
        }
    }

        
    const example = article.querySelector(".w3-example");
    const code = example.querySelector(".w3-code");
    if(code)
        code.outerHTML = "<pre>"+code.innerHTML.replace(/\n/g,"").trim()+"</pre>";

    const title = article.querySelector("h1")
    return {
        title : title ? title.textContent  : "",
        link : from.link,
        site : from.site,
        summary : summary,
        syntax : syntax,
        example : example ? example.outerHTML : null
    }
}

Sites.w3schools.set = function setW3(msg){
    const bodyPanel = document.createElement("div")
    bodyPanel.className = "w3body"
    bodyPanel.innerHTML = `${msg.summary}${msg.syntax}${msg.example}`

    return {body: bodyPanel};
}