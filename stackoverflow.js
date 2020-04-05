Sites.stackoverflow.get = getStack;
Sites.stackexchange.get = getStack;
function getStack(from, doc){
    var body = doc.querySelector("body");
                
    var acceptedAnswer = body.querySelector(".accepted-answer");
    if(!acceptedAnswer){
        acceptedAnswer = body.querySelector(".answer");
    }
    
    let editions = acceptedAnswer.querySelectorAll(".user-info");
    editions.forEach(e => {
        let time = e.querySelector(".user-action-time");
        if(time)
            time.style.display="inline-block";
    });

    let time = editions[editions.length-1].querySelector(".user-action-time");
    if(time)
        time = time.outerHTML;
    let details = editions[editions.length-1].querySelector(".user-details");
    if(details.querySelector("a"))
        details = details.querySelector("a");
    details.style.display = "inline-block";

    let author = {
        name : details.outerHTML,
        answered : time
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

Sites.stackoverflow.set = setStack;
Sites.stackexchange.set = setStack;
function setStack(answer){
    var bodyPanel = document.createElement("div");
    bodyPanel.className = "stackbody";
    bodyPanel.innerHTML = answer.html;

    var footPanel = document.createElement("div");
    footPanel.className = "stackfoot";
    var foothtml = answer.author.name + (answer.author.answered ? (" – "+answer.author.answered) : "");
    if(answer.editor){
        foothtml += "<br>";
        if(answer.editor.name != answer.author.name)
            foothtml += answer.editor.name;
        foothtml += " – "+answer.editor.answered;
    }
    footPanel.innerHTML = foothtml;

    return {
        body: bodyPanel, 
        foot: footPanel};
}