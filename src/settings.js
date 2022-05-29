const Google = "Google", Ecosia = "Ecosia", Bing = "Bing", Yahoo = "Yahoo", DuckDuckGo = "DuckDuckGo", Baidu = "Baidu", Brave = "Brave Search";

const Sites = Object.freeze({
  wikipedia: {
    name: "Wikipedia",
    link: "wikipedia.org/wiki/",
    icon: "https://wikipedia.org/static/favicon/wikipedia.ico",
    local_icon: "wikipedia.ico",
    href: "https://en.wikipedia.org/",
  },
  stackexchange: {
    name: "Stack Exchange sites",
    link: /((((stackexchange)|(stackoverflow)|(serverfault)|(superuser)|(askubuntu)|(stackapps))\.com)|(mathoverflow\.net))\/((questions)|q)\//,
    title: "Includes Stack Overflow, Super User and many others",
    icon: "https://cdn.sstatic.net/Sites/stackexchange/img/favicon.ico",
    local_icon: "stackexchange.ico",
    href: "https://stackexchange.com/sites",
  },
  w3schools: {
    name: "W3Schools",
    link: "https://www.w3schools.com/",
    icon: "https://www.w3schools.com/favicon.ico",
    local_icon: "w3schools.ico",
    href: "https://www.w3schools.com/",
  },
  mdn: {
    name: "MDN Web Docs",
    link: "https://developer.mozilla.org/",
    icon: "https://developer.mozilla.org/favicon-48x48.cbbd161b.png",
    local_icon: "mdn.png",
    href: "https://developer.mozilla.org/",
  },
  genius: {
    name: "Genius",
    link: /https:\/\/genius\.com\/[^\/]*$/,
    icon: "https://assets.genius.com/images/apple-touch-icon.png",
    local_icon: "genius.png",
    href: "https://genius.com/",
  },
  unity: {
    name: "Unity Answers",
    link: /https:\/\/answers\.unity\.com\/((questions)|q)\//,
    icon: "https://answers.unity.com/themes/thub/images/favicon.ico",
    local_icon: "unity.ico",
    href: "https://answers.unity.com/",
  },
  mathworks: {
    name: "MATLAB Answers",
    link: "https://www.mathworks.com/matlabcentral/answers/",
    icon: "https://www.mathworks.com/etc.clientlibs/mathworks/clientlibs/customer-ui/templates/common/resources/images/favicon.20220502122634643.ico",
    local_icon: "mathworks.ico",
    href: "https://www.mathworks.com/matlabcentral/answers/",
  },
});

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
  Sites: Sites,
  Tools: {
    bangs: {
      name: "DuckDuckGo Bangs !",
      href: "https://duckduckgo.com/bang",
    },
    calculator: {
      name: "Calculator",
      title: `Type "calculator" in your search engine`,
      href: "https://www.desmos.com/scientific",
    },
    plot: {
      name: "Plot",
      href: "https://plotly.com",
    }
  }
});

const SAVE_QUERIES_ENGINE = "save_queries_engine"
const SAVE_OPTIONS_KEY = "save_options_key";

const loadEngines = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(SAVE_QUERIES_ENGINE, async (storage) => {
      resolve(storage[SAVE_QUERIES_ENGINE] ?? await fetch(chrome.runtime.getURL(`./src/engines.json`)).then(res => res.json()));
    });
  });
}

const defaultSettings = () => {
  let save = {};
  Object.keys(Settings).forEach(category => {
    Object.keys(Settings[category]).forEach(k => {
      save[k] = Settings[category][k].default ?? true;
    })
  })
  return save;
}
const loadSettings = () => {
  return new Promise(resolve => {
    chrome.storage.local.get([SAVE_OPTIONS_KEY], storage => {
      resolve({ ...defaultSettings(), ...storage[SAVE_OPTIONS_KEY] });
    });
  })
}
const saveSettings = save => {
  return new Promise(resolve => {
    chrome.storage.local.set({
      [SAVE_OPTIONS_KEY]: save
    }, resolve)
  })
}
