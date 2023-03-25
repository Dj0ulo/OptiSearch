const isOptiSearch = chrome.runtime.getManifest().name === 'OptiSearch';

const Google = "Google", Ecosia = "Ecosia", Bing = "Bing", Yahoo = "Yahoo", DuckDuckGo = "DuckDuckGo", Baidu = "Baidu", Brave = "Brave Search";
const OrderEngines = [Google, Bing, Baidu, DuckDuckGo, Ecosia, Brave, Yahoo];

const Settings = Object.freeze({
  Options: {
    maxResults: {
      name: "Max. number of results",
      default: 3,
      min: 0,
      max: 9,
    },
    wideColumn: {
      name: "Force wide right column",
      default: false,
    },
  },
  'AI Assitant': {
    aichat: {
      name: "AI Assistant",
      options: { ...Chat, [false]: { name: 'Disabled' } },
      default: 'bingchat',
    },
    directchat: {
      name: "Ask AI chat directly",
      default: true,
    },
  },
  Sites,
  Tools,
});

const getSettings= () => Settings;

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
