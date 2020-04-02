function getStack(from, doc){
    var body = doc.querySelector("body");
                
    var acceptedAnswer = body.querySelector(".accepted-answer");
    if(!acceptedAnswer){
        acceptedAnswer = body.querySelector(".answer");
    }

    let codes = acceptedAnswer.querySelectorAll("code, pre");
    codes.forEach(c => {
        c.className = "prettyprint";
    });
    
    let editions = acceptedAnswer.querySelectorAll(".user-info");
    editions.forEach(e => {
        e.querySelector(".user-action-time").style.display="inline-block";
        let links = e.querySelectorAll("a");
        links.forEach(a => {
            a.href = "https://stackoverflow.com"+a.getAttribute('href');
        });
    });

    let author = {
        name : editions[editions.length-1].querySelector(".user-details").querySelector("a").outerHTML,
        answered : editions[editions.length-1].querySelector(".user-action-time").outerHTML
    }

    let editor = null;                
    if(editions.length>1){
        let nameEditor = editions[0].querySelector(".user-details").querySelector("a");
        if(nameEditor == null)
            nameEditor = author.name;
        else
            nameEditor = nameEditor.outerHTML;
        editor = {
            name : nameEditor,
            answered : editions[0].querySelector(".user-action-time").outerHTML
        }
    }
    
    return {
        title : doc.getElementById("question-header").querySelector("h1").textContent,
        link : from.link + "#" + acceptedAnswer.getAttribute('data-answerid'),
        site : from.site,
        html : acceptedAnswer.querySelector(".post-text").innerHTML,
        author : author,
        editor : editor
    }
}

function setStack(engine, answer){
    var knowledgePanel = document.createElement("div");
    knowledgePanel.className = "stackpanel";
    if(engine == Ecosia)
        knowledgePanel.style.marginTop = "20px";

    var sidePanel = document.createElement("div");
    sidePanel.className = "stackoverflow";

    var headPanel = document.createElement("div");
    headPanel.className = "stackheader";

    var link = "<a href='"+answer.link+"'><div class='title'>"+answer.title+"</div>";
    link += "<div class='stacklink'><img width='16' height='16' src='https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico'>"+answer.link+"</div></a>";
    headPanel.innerHTML = link;
    sidePanel.appendChild(headPanel);

    sidePanel.append(document.createElement("hr"));//body

    var bodyPanel = document.createElement("div");
    bodyPanel.className = "stackbody";
    bodyPanel.innerHTML = answer.html;
    sidePanel.appendChild(bodyPanel);

    sidePanel.append(document.createElement("hr"));//foot

    var footPanel = document.createElement("div");
    footPanel.className = "stackfoot";
    var foothtml = answer.author.name +" – "+answer.author.answered;
    if(answer.editor){
        foothtml += "<br>"+answer.editor.name +" – "+answer.editor.answered;
    }
    footPanel.innerHTML = foothtml;
    sidePanel.appendChild(footPanel);

    knowledgePanel.appendChild(sidePanel);

    return knowledgePanel;
}