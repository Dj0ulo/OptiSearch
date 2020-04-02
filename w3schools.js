function getW3(from, doc){
    var body = doc.querySelector("body");

    let article = body.querySelector("#main");
    if(!article){
        return;
    }
    let children = article.children;

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

        
    let example = article.querySelector(".w3-example");
    let code = example.querySelector(".w3-code");
    if(code)
        code.outerHTML = "<pre>"+code.innerHTML.replace(/\n/g,"").trim()+"</pre>";

    return {
        title : article.querySelector("h1").textContent,
        link : from.link,
        site : from.site,
        summary : summary,
        syntax : syntax,
        example : example ? example.outerHTML : null
    }
}

function setW3(msg){
    var bodyPanel = document.createElement("div");
    bodyPanel.className = "w3body";
    bodyPanel.innerHTML = (msg.summary ? msg.summary : "") + (msg.syntax ? msg.syntax : "") + (msg.example ? msg.example : "");

    return {body: bodyPanel};
}