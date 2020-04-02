console.log("Opti search");


//engines
const Google = "google", Ecosia = "ecosia", Yahoo = "yahoo";
var engine = "";
var site = window.location.hostname;
console.log(site);     
if(site.endsWith("ecosia.org")){
    engine = Ecosia;
}
else if(site.search("google")!=-1){
    engine = Google;
}
else if(site.search("yahoo")!=-1){
    engine = Yahoo;
}
let regexp = /[?|&]q=([%21|!][^&]*)/
if(window.location.href.search(regexp)!=-1){
    let reg = window.location.href.match(regexp);
    console.log(reg['1']);
    window.location.href = "https://duckduckgo.com/?q="+reg['1'];
}


var rightCol = {};
rightCol[Google] = ".rhscol.col";
rightCol[Ecosia] = ".col-lg-4.col-sm-12";
rightCol[Yahoo] = "#right";

var resRow = {};
resRow[Google] = ".r";
resRow[Ecosia] = ".result.js-result";
resRow[Yahoo] = ".dd.algo";


//send site
var port = chrome.runtime.connect();

var results = document.querySelectorAll(resRow[engine]);
var found = false;
results.forEach(r => {
    var link = r.querySelector("a").href;

    let site = null;
    if(link.startsWith("https://stackoverflow.com/questions/"))
        site = "stackoverflow";
    else if(link.startsWith("https://developer.mozilla.org/"))
        site = "mdn";
    else if(link.startsWith("https://math.stackexchange.com/questions/"))
        site = "stackexchange";
    else if(engine == Ecosia && link.search("wikipedia.org/wiki/")!=-1)
        site = "wikipedia";

    if(!found && site){
        console.log("Site "+site+" found - "+link);
        let msg = {
            engine : engine,
            link : link,
            site : site
        }
        port.postMessage(msg);
        found= true;
    }        
});


//set panel
port.onMessage.addListener(function(msg) {
    var panel;
    let icon;
    if(msg.site == "stackoverflow"){
        icon = 'https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico';
        panel = setStack(msg);
    }      
    else if(msg.site == "stackexchange"){
        icon = 'https://cdn.sstatic.net/Sites/stackexchange/img/favicon.ico';
        panel = setStack(msg);
        getChildrenTex(panel.body);
    }    
    else if(msg.site == "mdn"){
        icon = 'https://developer.mozilla.org/static/img/favicon32.png';
        panel = setMDN(msg);
    }
    else if(msg.site == "wikipedia"){
        icon = 'https://wikipedia.org/static/favicon/wikipedia.ico';
        panel = setWiki(msg);
    }
    else
        return;

    let host = msg.link.match("https?://[^/]+")[0];        

    var knowledgePanel = document.createElement("div");
    knowledgePanel.className = "optisearchbox";
    if(engine == Ecosia)
        knowledgePanel.style.marginTop = "20px";
    knowledgePanel.style.marginBottom = "20px";

    var sidePanel = document.createElement("div");
    sidePanel.className = "optipanel";

    var headPanel = document.createElement("div");
    headPanel.className = "stackheader";

    

    var link = "<a href='"+msg.link+"'><div class='title'>"+msg.title+"</div>";
    link += "<div class='stacklink'><img width='16' height='16' src='"+icon+"'>"+msg.link+"</div></a>";
    headPanel.innerHTML = link;
    sidePanel.appendChild(headPanel);

    runMathJax(headPanel.querySelector(".title"));

    if(panel.body){        
        sidePanel.append(document.createElement("hr"));//body
        panel.body.className += " optibody";
        let codes = panel.body.querySelectorAll("code, pre");
        codes.forEach(c => {
            c.className += " prettyprint";
        });
        sidePanel.appendChild(panel.body);
    }

    if(panel.foot){
        panel.foot.id = "output";
        sidePanel.append(document.createElement("hr"));//foot
        sidePanel.appendChild(panel.foot);
    }

    let links = sidePanel.querySelectorAll("a");
    links.forEach(a => {
        let ahref = a.getAttribute('href');
        if(ahref.startsWith("/"))
            a.href = host+ahref;
    });


    knowledgePanel.appendChild(sidePanel);

    document.querySelector(rightCol[engine]).appendChild(knowledgePanel);

    runPrettify();
});

const regexpTex = /\${1,2}([^\$]*)\${1,2}/;
const regexpTexG = /\${1,2}([^\$]*)\${1,2}/g;
function getChildrenTex(element){
    var all = element.querySelectorAll("*");
    var children = [];
    all.forEach(p => {
        if(p.textContent.search(regexpTex) != -1)
            children.push(p);
    });

    children.forEach(c => {
        runMathJax(c);
    });
}

function runMathJax(element) {
    element.innerHTML = element.innerHTML.replace(regexpTexG,"<span style='display: inline-block; ' class='mjx'>$1</span>");

    var texs = element.querySelectorAll(".mjx");
    
    MathJax.texReset();
    texs.forEach(t => {
        var options = MathJax.getMetricsFor(t);
        
        MathJax.tex2svgPromise(t.textContent, options).then( node => {
            t.innerHTML = "";
            t.appendChild(node);
        });
    });

}