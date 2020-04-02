chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                var doc = new DOMParser().parseFromString(xmlHttp.response, "text/html");

                if(msg.site == "stackoverflow")
                    port.postMessage(getStack(msg, doc));
                else if(msg.site == "mdn")
                    port.postMessage(getMDN(msg, doc));
                else if(msg.site == "wikipedia")
                    port.postMessage(getWiki(msg, doc));
            }
        }
        xmlHttp.open("GET", msg.link, true); // true for asynchronous 
        xmlHttp.send(null);
    });
});

