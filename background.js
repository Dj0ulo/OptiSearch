
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
                
                var acceptedAnswer = el.querySelector("body").querySelector(".accepted-answer");

                let codes = acceptedAnswer.querySelectorAll("code");
                codes.forEach(c => {
                    var s = c.textContent;
                    console.log(s);
                    c.className = "prettyprint";
                });
                
                var answer = {
                    title : el.getElementById("question-header").querySelector("h1").textContent,
                    link : link + "#" + acceptedAnswer.getAttribute('data-answerid'),
                    html : acceptedAnswer.querySelector(".post-text").innerHTML
                }
                console.log(answer.html);
                port.postMessage(answer)
            }
        }
        xmlHttp.open("GET", link, true); // true for asynchronous 
        xmlHttp.send(null);
    });
});

