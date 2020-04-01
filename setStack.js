//console.log("Stackoverflow");

var classCol = ".rhscol.col";

function loaded(){
    if(!document.querySelector(classCol)){
        return false;
    }
    else{
        return true;
    }
}

var port = chrome.runtime.connect();


var results = document.querySelectorAll(".r");
var found = false;
results.forEach(r => {
    var link = r.querySelector("a").href;
    if(!found && link.startsWith("https://stackoverflow.com/questions/")){        
        port.postMessage(link);
        found= true;
    }        
});
port.onMessage.addListener(function(answer) {
    // var classSidePanel = "kp-blk EyBRub knowledge-panel Wnoohf OJXvsb";
    // var sidePanel = document.getElementsByClassName(classSidePanel)[0];
    // if(sidePanel != null){
    //     console.log(sidePanel);
    // }

    var knowledgePanel = document.createElement("div");
    knowledgePanel.className = "stackpanel";

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

    console.log("loaded : "+loaded());

    if(loaded())
        appendIt();
    // else{
    //     var intervalID = setInterval(() => {
    //         if(loaded()){
    //             appendIt();
    //             clearInterval(intervalID);
    //         }                
    //     },100);
    // }

    function appendIt(){
        document.querySelector(classCol).appendChild(knowledgePanel);
        dotherunningpretty();
    }
    
});