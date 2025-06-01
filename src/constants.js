const WhichExtension = (() => {
  const iconPath = chrome.runtime.getManifest().icons["128"];
  if (iconPath.includes('bingchat'))
    return 'bingchat';
  if (iconPath.includes('bard'))
    return 'bard';
  return 'optisearch';
})();
const isOptiSearch = WhichExtension === 'optisearch';
const WhichChat = isOptiSearch ? 'chatgpt' : WhichExtension;
const isDebugMode = !chrome.runtime.getManifest().update_url; // if it is set, it means that we loaded the extension from source (not from the store)

const webstores = {
  'optisearch': typeof browser === 'undefined' ?
    'https://chrome.google.com/webstore/detail/optisearch/bbojmeobdaicehcopocnfhaagefleiae' :
    'https://addons.mozilla.org/fr/firefox/addon/optisearch',
  'bingchat': typeof browser === 'undefined' ?
    'https://chrome.google.com/webstore/detail/bing-chat-gpt-4-in-google/pcnhobmoglanpljipbomknafhdlcgcng':
    'https://addons.mozilla.org/fr/firefox/addon/bing-chat-gpt-4-in-google',
  'bard': typeof browser === 'undefined' ?
    'https://chrome.google.com/webstore/detail/bard-for-search-engines/pkdmfoabhnkpkcacnmgilaeghiggdbgf':
    'https://addons.mozilla.org/fr/firefox/addon/bard-for-search-engines',
}
const webstore = webstores[WhichExtension];
const donationLink = `https://www.paypal.com/donate?hosted_button_id=${WhichExtension === 'bingchat' ? 'BXBP3JELVS4FL' : 'VPF2BYBDBU5AA'}`;

const Google = "Google", Ecosia = "Ecosia", Bing = "Bing", Yahoo = "Yahoo", DuckDuckGo = "DuckDuckGo", Baidu = "Baidu", Brave = "Brave Search";
const OrderEngines = [Google, Bing, Baidu, DuckDuckGo, Ecosia, Brave, Yahoo];
const EngineTechnicalNames = {
  [Google]: 'google',
  [Bing]: 'bing',
  [Baidu]: 'baidu',
  [DuckDuckGo]: 'duckduckgo',
  [Ecosia]: 'ecosia',
  [Brave]: 'brave',
  [Yahoo]: 'yahoo',
};
