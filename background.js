chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                var doc = new DOMParser().parseFromString(xmlHttp.response, "text/html");

                let site = Sites[msg.site];
                if(site)
                    port.postMessage(site.get(msg,doc));
            }
        }
        xmlHttp.open("GET", msg.link, true); // true for asynchronous 
        xmlHttp.send(null);
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    let strUrl = tab.url.toString();
    let bangable = (strUrl.search("https://www.google.com/search?")==0 
                    || strUrl.search("https://www.ecosia.org/search?")==0
                    || strUrl.search("https://www.qwant.com/?")==0);
    if(changeInfo.status=="loading" && bangable){
        let regexp = /[?|&]q=((%21|!)[^&]*)/
        if(strUrl.search(regexp)!=-1){
            let reg = strUrl.match(regexp);
            console.log(tab);
            console.log(reg['1']);
            chrome.tabs.update(tab.id, {url: "https://duckduckgo.com/?q="+reg['1']});
        }
    }

});


