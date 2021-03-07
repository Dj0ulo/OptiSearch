Sites.w3schools.msgApi = (link) => {
    return {
    }
}

Sites.w3schools.get = (from, doc) => {
    const body = doc.querySelector("body");

    const article = body.querySelector("#main");
    if(!article){
        return;
    }
    const children = article.children;

    const replaceBr = (ih) => ih.replace(/<br>/g,"\n")

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
                syntax = "<pre>"+replaceBr(c.nextElementSibling.innerHTML.replace(/\n/g,"").trim())+"</pre>";
            }
        }
    }

        
    const example = article.querySelector(".w3-example");

    if(example){
      const location = from.link.substring(0,from.link.lastIndexOf("/"));

      Array.from(example.querySelectorAll("img")).forEach(img => {
        if(!img.src.startsWith("https://")){
          img.src = `${location}/${new URL(img.src).pathname}`;
        }
      });
  
      const codes = example.querySelectorAll(".w3-code");
      codes?.forEach(code => {
        const str = replaceBr(code.innerHTML.replace(/\n|\t/g,"").trim())
          .split('\n')
          .map(line => line.trim())
          .join('\n');
  
        code.outerHTML = `<pre>${str}</pre>`;
      })
    }


    const title = article.querySelector("h1")
    return {
        title : title?.textContent ?? "",
        summary : summary,
        syntax : syntax,
        example : example?.outerHTML ?? "",
    }
}


Sites.w3schools.set = function setW3(msg){
    const bodyPanel = document.createElement("div")
    bodyPanel.className = "w3body"
    bodyPanel.innerHTML = `${msg.summary}${msg.syntax}${msg.example}`

    return {body: bodyPanel};
}