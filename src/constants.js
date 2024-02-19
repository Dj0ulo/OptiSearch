const WhichExtension = (() => {
  const extensionName = chrome.runtime.getManifest().name;
  if (extensionName.includes('Bing'))
    return 'bingchat';
  if (extensionName.includes('Gemini'))
    return 'bard';
  return 'optisearch';
})();
const isOptiSearch = WhichExtension === 'optisearch';
const WhichChat = isOptiSearch ? 'chatgpt' : WhichExtension;

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
