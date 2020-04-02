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
    if(!found && 
        (link.startsWith("https://stackoverflow.com/questions/")
        || link.startsWith("https://developer.mozilla.org/") )){   
        let msg = {
            engine : host,
            link : link
        }
        port.postMessage(msg);
        found= true;
    }        
});
port.onMessage.addListener(function(answer) {
    document.querySelector(classCol[host]).appendChild(setStack(host, answer));
    runPrettify();    
});