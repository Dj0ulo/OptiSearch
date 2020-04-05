// console.log("OptiSearch");

//const
const PANEL_CLASS = "optipanel";
const regexpTex = /\${1,2}([^\$]*)\${1,2}/;
const regexpTexG = /\${1,2}([^\$]*)\${1,2}/g;

const ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';


//engines
var engine = "", searchString = "";
var siteFound = window.location.hostname;

if(siteFound.endsWith("ecosia.org"))
    engine = Ecosia;
else if(siteFound.search("google")!=-1)
    engine = Google;
else if(siteFound.search("yahoo")!=-1)
    engine = Yahoo;

var rightCol = {};
rightCol[Google] = ".rhscol.col";
rightCol[Ecosia] = ".col-lg-4.col-sm-12";
rightCol[Yahoo] = "#right";

var resRow = {};
resRow[Google] = ".r";
resRow[Ecosia] = ".result.js-result";
resRow[Yahoo] = ".dd.algo";

var searchBox = {};
searchBox[Google] = ".gLFyf.gsfi";
searchBox[Ecosia] = ".search-form-input.js-search-input";
searchBox[Yahoo] = "#yschsp";

searchString = document.querySelector(searchBox[engine]).value;
// console.log("search: "+searchString);


getSettings((save) => {  
    if(isActive('bangs',engine,save)){
        let regexp = /[?|&]q=((%21|!)[^&]*)/
        let reg = window.location.href.match(regexp);
        if(reg){
            console.log(reg['1']);
            window.location.href = "https://duckduckgo.com/?q="+reg['1'];
        }
    }

    if(isActive('calculator',engine,save)){
        if(window.location.href.search(/[?|&]q=calculator(&?|$)/)!=-1){
            let iframe = document.createElement("iframe");
            iframe.id = "opticalculator"
            iframe.className = PANEL_CLASS;
            iframe.src = "https://www.desmos.com/scientific";
            appendPanel(iframe);
        }
    }

    let rep = isMathExpr(searchString);
    if(rep){
        if(rep.vars.length > 0){
            if(isActive('plot',engine,save)){
                let fun = {
                    expr : rep.expr,
                    vars : rep.vars
                }
                let graph = document.createElement("div");
                graph.id = "optiplot";
                graph.className = PANEL_CLASS;
                appendPanel(graph);
                plotFun(fun, "optiplot");
            }
        }else if(isActive('calculator',engine,save) 
        && (typeof rep.answer == 'number' || typeof rep.answer == 'boolean' || rep.answer.entries)){
            let expr = document.createElement("div");
            expr.id = "optiexpr";
            expr.className = PANEL_CLASS;

            let str = "$"+math.parse(rep.expr).toTex() +"~";
            let answer = rep.answer;
            if(typeof answer == 'number'){
                str += "=~"+answer;
            }
            else if(typeof answer == 'boolean'){
                str += ":~"+answer;
            }else if(rep.answer.entries){
                answer = answer.entries[0];
                str += "=~"+answer;
            }
            str+="$";
            expr.innerHTML = str;

            runMathJax(expr);
            appendPanel(expr).querySelector("#optiexpr").appendChild(createCopyButton(answer.toString()));
        }
    }

    //send site
    var port = chrome.runtime.connect();

    var results = document.querySelectorAll(resRow[engine]);
    var found = false;
    results.forEach(r => {
        var link = r.querySelector("a").href;

        let siteFound = null;
        for (const site in Sites ) {
            if (Sites.hasOwnProperty(site)) {
                const p = Sites[site];
                if(isActive(site,engine,save) && link.search(p.link)!=-1){
                    siteFound = site;
                    break;
                }
            }
        }
        if(!found && siteFound){
            // console.log("Site "+siteFound+" found - "+link);
            let msg = {
                engine : engine,
                link : link,
                site : siteFound
            }
            port.postMessage(msg);
            found= true;
        }        
    });

    //set panel
    function appendPanel(panel){
        let knowledgePanel = document.createElement("div");
        knowledgePanel.className = "optisearchbox";
        if(engine == Ecosia)
            knowledgePanel.style.marginTop = "20px";
        knowledgePanel.style.marginBottom = "20px";

        knowledgePanel.appendChild(panel);

        document.querySelector(rightCol[engine]).appendChild(knowledgePanel);
        return knowledgePanel;
    }
    port.onMessage.addListener(function(msg) {
        var panel;
        let icon;

        for (const site in Sites ) {
            if (Sites.hasOwnProperty(site)) {
                const p = Sites[site];
                if(msg.site == site){
                    icon = p.icon;
                    panel = p.set(msg);
                    if(site == 'stackexchange'){
                        getChildrenTex(panel.body);
                    }
                    break;
                }
            }
        }
        if(!panel)
            return;
        

        let host = msg.link.match("https?://[^/]+")[0];        

        var sidePanel = document.createElement("div");
        sidePanel.className = PANEL_CLASS;

        var headPanel = document.createElement("div");
        headPanel.className = "optiheader";

        msg.title = msg.title.replace(/<(\w*)>/g,'&lt;$1&gt;');

        var link = "<a href='"+msg.link+"'><div class='title'>"+msg.title+"</div>";
        link += "<div class='optilink'><img width='16' height='16' src='"+icon+"'>"+msg.link+"</div></a>";
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
            let pres = panel.body.querySelectorAll("pre");
            pres.forEach(pre => {

                var surround = document.createElement("div");
                surround.style.position = "relative";
                surround.innerHTML = pre.outerHTML;
                surround.appendChild(createCopyButton(pre.innerText));

                pre.parentNode.replaceChild(surround, pre);
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
            if(!ahref.startsWith("//") && !ahref.startsWith("http")){
                if(!ahref.startsWith("/")){
                    a.href = msg.link.replace(/\/[^\/]*$/,"")+"/"+ahref;
                }
                else
                    a.href = host+ahref;
            }
                
        });


        appendPanel(sidePanel);

        PR.prettyPrint();
    });
});


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

function createCopyButton(text){
    var divCopy = document.createElement("div");
    divCopy.className = "opticopy";            
    
    divCopy.innerHTML = ICON_COPY;            
    divCopy.querySelector("svg").addEventListener('click',clickSVG);
    function clickSVG(){
        divCopy.innerHTML = "";
        copyTextToClipboard(text,function(r){
            divCopy.innerHTML = r==true ? "Copied !" : "Error";
            setTimeout(() => {
                divCopy.innerHTML = ICON_COPY;
                divCopy.querySelector("svg").onclick = clickSVG;
            },2000);
        });
    }
    return divCopy;
}
function copyTextToClipboard(text, callback) {
    if (!navigator.clipboard) {
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        callback(true);
    }, function(err) {
        callback(false);
    });
}