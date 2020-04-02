console.log("Stackoverflow");

const Google = "google", Ecosia = "ecosia", Yahoo = "yahoo";
var host = "";
var site = window.location.hostname;
console.log(site);     
if(site.endsWith("ecosia.org")){
    host = Ecosia;
}
else if(site.search("google")!=-1){
    host = Google;
}
else if(site.search("yahoo")!=-1){
    host = Yahoo;
}


var classCol = {};
classCol[Google] = ".rhscol.col";
classCol[Ecosia] = ".col-lg-4.col-sm-12";
classCol[Yahoo] = "#right";

var resultClass = {};
resultClass[Google] = ".r";
resultClass[Ecosia] = ".result.js-result";
resultClass[Yahoo] = ".dd.algo";


var port = chrome.runtime.connect();

var results = document.querySelectorAll(resultClass[host]);
var found = false;
results.forEach(r => {
    var link = r.querySelector("a").href;

    let site = null;
    if(link.startsWith("https://stackoverflow.com/questions/"))
        site = "stackoverflow";
    else if(link.startsWith("https://developer.mozilla.org/"))
        site = "mdn";

    if(!found && site){   
        let msg = {
            engine : host,
            link : link,
            site : site
        }
        port.postMessage(msg);
        found= true;
    }        
});


//set
port.onMessage.addListener(function(answer) {
    var panel;
    if(answer.site == "stackoverflow")
        panel = setStack(host, answer);
    
    document.querySelector(classCol[host]).appendChild(panel);
    runPrettify();    
});