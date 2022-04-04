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
  // cplusplus: {
  //   name: "cplusplus",
  //   link: "https://www.cplusplus.com/reference/",
  //   icon: "https://www.cplusplus.com/favicon.ico"
  // },
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
  unity: {
    name: "Unity Answers",
    link: /https:\/\/answers\.unity\.com\/((questions)|q)\//,
    icon: "https://answers.unity.com/themes/thub/images/favicon.ico",
    local_icon: "unity.ico",
    href: "https://answers.unity.com/",
  },
})

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
})

const GIST = "https://gist.githubusercontent.com/Dj0ulo/7224203ee9be47ba5be6f57be1cd22c5/raw"

const SAVE_QUERIES_ENGINE = "save_queries_engine"
const SAVE_OPTIONS_KEY = "save_options_key";

const fetchEngines = (local = false) => {
  let url = local ? chrome.runtime.getURL(`./src/engines.json`) : `${GIST}/engines.json`;
  return fetch(url)
    .then(response => {
      if (!response.ok)
        throw response
      else
        return response.json()
    })
    .then(json => {
      chrome.storage.local.set({
        [SAVE_QUERIES_ENGINE]: json
      })
      return json;
    })
    .catch(() => {
      chrome.storage.local.get([SAVE_QUERIES_ENGINE], storage => {
        return storage[SAVE_QUERIES_ENGINE] || Engines;
      })
    });
}

fetchEngines(false)//.then(r => console.log("Engines: ", r))

const loadEngines = () => {
  return new Promise(resolve => {
    chrome.storage.local.get([SAVE_QUERIES_ENGINE], storage => {
      resolve(storage[SAVE_QUERIES_ENGINE] || Engines);
    })
  })
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
