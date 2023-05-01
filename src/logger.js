const extensionName = chrome.runtime.getManifest().name;

function log(str) { console.log(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function err(str) { console.error(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function warn(str) { console.warn(`%c[${extensionName}]`, `font-weight: bold;`, str) }
function debug(str) { console.debug(`%c[${extensionName}]`, `font-weight: bold;`, str) }
