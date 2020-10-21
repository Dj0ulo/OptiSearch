chrome.extension.onConnect.addListener(port =>{
    port.onMessage.addListener(msg => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", msg.link, true /*for async*/);

        xhr.onreadystatechange = () => { 
            if (xhr.readyState == 4 && xhr.status == 200){
                const doc = new DOMParser().parseFromString(xhr.response, "text/html");

                const site = Sites[msg.site];
                if(site)
                    port.postMessage(site.get(msg,doc));
            }
        }
        
        xhr.send();
    });
});
