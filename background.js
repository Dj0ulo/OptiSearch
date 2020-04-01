
chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(link) {
        console.log("Link : " + link);
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                var rep = xmlHttp.response;
                // var el = document.createElement("html");
                // el.innerHTML = rep;
                var parser = new DOMParser();
                var el = parser.parseFromString(rep, "text/html");
                var body = el.querySelector("body");
                
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

                
                var answer = {
                    title : el.getElementById("question-header").querySelector("h1").textContent,
                    link : link + "#" + acceptedAnswer.getAttribute('data-answerid'),
                    html : acceptedAnswer.querySelector(".post-text").innerHTML,
                    author : author,
                    editor : editor
                }
                port.postMessage(answer)
            }
        }
        xmlHttp.open("GET", link, true); // true for asynchronous 
        xmlHttp.send(null);
    });
});

