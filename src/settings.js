const WhichExtension = (() => {
  const extensionName = chrome.runtime.getManifest().name;
  if (extensionName.includes('Bing'))
    return 'bingchat';
  if (extensionName.includes('Bard'))
    return 'bard';
  return 'optisearch';
})();
const isOptiSearch = WhichExtension === 'optisearch';
const WhichChat = isOptiSearch ? 'chatgpt' : WhichExtension;
const extpay = ExtPay('optisearch');

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

const Settings = {
  Options: {
    wideColumn: {
      name: "Force large panel width",
      default: false,
      active: false,
    },
  },
  'AI Assitant': {
    premium: {
      name: 'Is the user premium',
      default: null,
      active: false,
    },
    directchat: {
      name: 'Ask at search',
      title: 'Ask the AI assistant as soon as the result page is loaded',
      default: true,
    },
  },
};

switch(WhichExtension) {
  case 'optisearch':
    Settings['Sites'] = Sites;
    Settings['Tools'] = Tools;
    Settings['Options']['maxResults'] = {
      name: "Maximum number of result panels",
      default: 3,
      min: 0,
      max: 9,
    };
    Settings['AI Assitant'] = {
      chatgpt: {
        local_icon: "chatgpt.png",
        name: "ChatGPT",
        default: true,
        slaves: ['directchat'],
      },
      ...Settings['AI Assitant'],
    }
    break;
  case 'bingchat':
    Settings['AI Assitant']['bingConvStyle'] = {
      name: "Conversation style",
      options: {
        'creative': { name: 'Creative (GPT-4)' },
        'balanced': { name: 'Balanced' },
        'precise': { name: 'Precise' },
      },
      default: 'balanced',
    }
    Settings['AI Assitant']['bingInternalSearch'] = {
      name: "Bing internal search",
      title: 'Allow Bing to make internal search before giving you an answer. Takes more time to answer.',
      default: true,
      active: false,
    }
    break;
  case 'bard':
    Settings['AI Assitant']['googleAccount'] = {
      name: "Google account ID",
      title: 'Google account number to use with Bard',
      default: 0,
      min: 0,
      active: false,
    };
    break;
}

const getSettings = () => Settings;

const SAVE_QUERIES_ENGINE = "save_queries_engine"
const SAVE_OPTIONS_KEY = "save_options_key";

function loadEngines() {
  return new Promise(resolve => {
    chrome.storage.local.get(SAVE_QUERIES_ENGINE, async (storage) => {
      resolve(storage[SAVE_QUERIES_ENGINE] ?? await fetch(chrome.runtime.getURL(`./src/engines.json`)).then(res => res.json()));
    });
  });
}

async function defaultSettings() {
  let save = {};
  const settings = await getSettings();
  Object.keys(settings).forEach(category => {
    Object.keys(settings[category]).forEach(k => {
      save[k] = settings[category][k].default ?? true;
    })
  })
  return save;
}

/** @returns {Promise} user settings saved in local */
function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get([SAVE_OPTIONS_KEY], async (storage) => {
      resolve({ ...(await defaultSettings()), ...storage[SAVE_OPTIONS_KEY] });
    });
  })
}

/** Save user settings */
function saveSettings(save) {
  return new Promise(resolve => {
    chrome.storage.local.set({
      [SAVE_OPTIONS_KEY]: save
    }, resolve)
  })
}
