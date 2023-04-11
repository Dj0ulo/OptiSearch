chrome.webRequest.onBeforeSendHeaders.addListener((e) => {
  if (e.type !== "main_frame")
    return;
  console.log(e);
  for (const header of e.requestHeaders) {
    if (header.name.toLowerCase() === "user-agent") {
      header.value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 Edg/111.0.1661.62";
      break;
    }
  }
  return { requestHeaders: e.requestHeaders };
},
  { urls: ["https://www.bing.com/*"] },
  ["blocking", "requestHeaders"]
);
