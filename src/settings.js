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

const Google = "Google", Ecosia = "Ecosia", Bing = "Bing", Yahoo = "Yahoo", DuckDuckGo = "DuckDuckGo", Baidu = "Baidu", Brave = "Brave Search";
const OrderEngines = [Google, Bing, Baidu, DuckDuckGo, Ecosia, Brave, Yahoo];

const Settings = {
  Options: {
    wideColumn: {
      name: "Force large panel width",
      default: false,
    },
  },
  'AI Assitant': {
    directchat: {
      name: 'Ask it directly',
      title: 'Ask the AI assistant as soon as the result page is loaded',
      default: true,
    },
  },
};

if (isOptiSearch) {
  Settings['Sites'] = Sites;
  Settings['Tools'] = Tools;
  Settings['Options']['maxResults'] = {
    name: "Max. site results panels",
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
}

if (WhichExtension === 'bingchat') {
  Settings['AI Assitant']['bingConvStyle'] = {
    name: "Conversation style",
    options: {
      'creative': { name: 'Creative' },
      'balanced': { name: 'Balanced' },
      'precise': { name: 'Precise' },
    },
    default: 'balanced',
  }
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
