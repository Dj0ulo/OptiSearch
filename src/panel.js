console.log(`OptiSearch`);

const PANEL_CLASS = "optipanel";
const regexpTex = /\${1,2}([^\$]*)\${1,2}/;
const regexpTexG = /\${1,2}([^\$]*)\${1,2}/g;

const ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

//engines
let engine = ""
const siteFound = window.location.hostname

if (siteFound.endsWith("ecosia.org"))
    engine = Ecosia
else if (siteFound.search(".bing.com") != -1)
    engine = Bing
else if (siteFound.search(".google.") != -1)
    engine = Google
else if (siteFound.search(".yahoo.") != -1)
    engine = Yahoo

//Not await !!
loadEngines().then(engines => {

    const searchString = document.querySelector(engines[engine].searchBox).value
    if (!searchString)
        console.warn("No search string detected");

    console.log(`OptiSearch - ${engine} : "${searchString}"`)

    //Not await !!
    loadSettings().then(save => {
        //Tools
        if (save['bangs']) {
            const regexp = /[?|&]q=((%21|!)[^&]*)/
            const reg = window.location.href.match(regexp)
            if (reg) {
                console.log(reg['1']);
                window.location.href = "https://duckduckgo.com/?q=" + reg['1'];
            }
        }

        if (save['calculator']) {
            if (window.location.href.search(/[?|&]q=calculator(&?|$)/) != -1) {
                const iframe = document.createElement("iframe");
                iframe.id = "opticalculator"
                iframe.className = PANEL_CLASS;
                iframe.src = "https://www.desmos.com/scientific";
                appendPanel(iframe);
            }
        }

        const rep = isMathExpr(searchString);
        if (rep) {
            if (rep.vars.length > 0) {
                if (save['plot']) {
                    let fun = {
                        expr: rep.expr,
                        vars: rep.vars
                    }
                    let graph = document.createElement("div");
                    graph.id = "optiplot";
                    graph.className = PANEL_CLASS;
                    appendPanel(graph);
                    plotFun(fun, "optiplot");
                }
            } else if (save['calculator']
                && (typeof rep.answer == 'number' || typeof rep.answer == 'boolean' || rep.answer.entries)) {
                let expr = document.createElement("div");
                expr.id = "optiexpr";
                expr.className = PANEL_CLASS;

                let str = "$" + math.parse(rep.expr).toTex() + "~";
                let answer = rep.answer;
                if (typeof answer == 'number') {
                    str += "=~" + answer;
                }
                else if (typeof answer == 'boolean') {
                    str += ":~" + answer;
                } else if (rep.answer.entries) {
                    answer = answer.entries[0];
                    str += "=~" + answer;
                }
                str += "$";
                expr.innerHTML = str;

                runMathJax(expr);
                appendPanel(expr).querySelector("#optiexpr").appendChild(createCopyButton(answer.toString()));
            }
        }

        //Sites
        var port = chrome.runtime.connect();

        const results = document.querySelectorAll(engines[engine].resultRow);
        if (results.length === 0)
            console.warn('No result detected')

        for (let r of results) {
            const link = r.querySelector("a").href;
            const found = Object.keys(Sites).find(site => save[site] && link.search(Sites[site].link) != -1)
            if (found) {
                port.postMessage({
                    engine: engine,
                    link: link,
                    site: found,
                    type: 'html',
                    ...Sites[found].msgApi(link)
                });
                break;
            }
        }


        //set panel
        function appendPanel(panel) {
            let knowledgePanel = document.createElement("div");
            knowledgePanel.className = "optisearchbox";
            if (engine == Ecosia)
                knowledgePanel.style.marginTop = "20px";
            knowledgePanel.style.marginBottom = "20px";

            knowledgePanel.appendChild(panel);
            const rightColumn = document.querySelector(engines[engine].rightColumn)
            if (!rightColumn)
                console.warn('No right column detected')
            else
                rightColumn.appendChild(knowledgePanel);
            return knowledgePanel;
        }
        port.onMessage.addListener(msg => {
            var panel;
            let icon;

            // console.log(msg)

            for (const site in Sites) {
                if (Sites.hasOwnProperty(site)) {
                    const p = Sites[site];
                    if (msg.site == site) {
                        icon = p.icon;
                        panel = p.set(msg);
                        if (site == 'stackexchange') {
                            getChildrenTex(panel.body);
                        }
                        break;
                    }
                }
            }
            if (!panel)
                return;


            let host = msg.link.match("https?://[^/]+")[0];

            var sidePanel = document.createElement("div");
            sidePanel.className = PANEL_CLASS;

            const watermark = document.createElement("div");
            watermark.className = "watermark";
            watermark.textContent = 'OptiSearch'
            sidePanel.appendChild(watermark)

            var headPanel = document.createElement("div");
            headPanel.className = "optiheader";

            msg.title = msg.title.replace(/<(\w*)>/g, '&lt;$1&gt;');

            var link = "<a href='" + msg.link + "'><div class='title'>" + msg.title + "</div>";
            link += "<div class='optilink'><img width='16' height='16' src='" + icon + "'>" + msg.link + "</div></a>";
            headPanel.innerHTML = link;
            sidePanel.appendChild(headPanel);

            runMathJax(headPanel.querySelector(".title"));

            if (panel.body) {
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

            if (panel.foot) {
                panel.foot.id = "output";
                sidePanel.append(document.createElement("hr"));//foot
                sidePanel.appendChild(panel.foot);
            }

            let links = sidePanel.querySelectorAll("a");
            links.forEach(a => {
                let ahref = a.getAttribute('href');
                if (!ahref.startsWith("//") && !ahref.startsWith("http")) {
                    if (!ahref.startsWith("/")) {
                        a.href = msg.link.replace(/\/[^\/]*$/, "") + "/" + ahref;
                    }
                    else
                        a.href = host + ahref;
                }

            });


            appendPanel(sidePanel);

            PR.prettyPrint();
        });

    })
})


function getChildrenTex(element) {
    const all = element.querySelectorAll("*");
    const children = [];
    all.forEach(p => {
        if (p.textContent.search(regexpTex) != -1)
            children.push(p);
    });

    children.forEach(c => {
        runMathJax(c);
    });
}

function runMathJax(element) {
    element.innerHTML = element.innerHTML.replace(regexpTexG, "<span style='display: inline-block; ' class='mjx'>$1</span>");

    const texs = element.querySelectorAll(".mjx");

    MathJax.texReset();
    texs.forEach(t => {
        const options = MathJax.getMetricsFor(t);

        MathJax.tex2svgPromise(t.textContent, options).then(node => {
            t.innerHTML = "";
            t.appendChild(node);
        });
    });

}

function createCopyButton(text) {
    var divCopy = document.createElement("div");
    divCopy.className = "opticopy";

    divCopy.innerHTML = ICON_COPY;
    divCopy.querySelector("svg").addEventListener('click', clickSVG);
    function clickSVG() {
        divCopy.innerHTML = "";
        copyTextToClipboard(text, r => {
            divCopy.innerHTML = r ? "Copied !" : "Error";
            setTimeout(() => {
                divCopy.innerHTML = ICON_COPY;
                divCopy.querySelector("svg").onclick = clickSVG;
            }, 2000);
        });
    }
    return divCopy;
}
function copyTextToClipboard(text, callback) {
    if (!navigator.clipboard) {
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        callback(true);
    }, function (err) {
        callback(false);
    });
}