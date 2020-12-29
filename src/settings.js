const Google = "Google", Ecosia = "Ecosia", Bing = "Bing", Yahoo = "Yahoo", DuckDuckGo = "DuckDuckGo";

const Engines = Object.freeze({
  "Google": {
    "icon": "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png",
    "rightColumn": ".rhscol.col",
    "resultRow": ".g",
    "searchBox": ".gLFyf.gsfi"
  },
  "Bing": {
    "icon": "https://www.bing.com/sa/simg/bing_p_rr_teal_min.ico",
    "rightColumn": "#b_context",
    "resultRow": ".b_algo",
    "searchBox": ".b_searchbox#sb_form_q"
  },
  "Ecosia": {
    "icon": "https://cdn.ecosia.org/assets/images/ico/favicon.ico",
    "rightColumn": ".col-lg-4.col-sm-12",
    "resultRow": ".result.js-result",
    "searchBox": ".search-form-input.js-search-input"
  },
  "Yahoo": {
    "icon": "https://s.yimg.com/oa/build/images/favicons/yahoo.png",
    "rightColumn": "#right",
    "resultRow": ".dd.algo",
    "searchBox": "#yschsp"
  }
})
const Sites = Object.freeze({
  wikipedia: {
    name: "Wikipedia",
    link: "wikipedia.org/wiki/",
    icon: "https://wikipedia.org/static/favicon/wikipedia.ico"
  },
  stackoverflow: {
    name: "Stack Overflow",
    link: "https://stackoverflow.com/questions/",
    icon: "https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico"
  },
  stackexchange: {
    name: "Stack Exchange",
    link: "stackexchange.com/questions/",
    icon: "https://cdn.sstatic.net/Sites/stackexchange/img/favicon.ico"
  },
  w3schools: {
    name: "W3Schools",
    link: "https://www.w3schools.com/",
    icon: "https://www.w3schools.com/favicon.ico"
  },
  mdn: {
    name: "MDN Web Docs",
    link: "https://developer.mozilla.org/",
    icon: "https://developer.mozilla.org/static/img/favicon32.png"
  }
})

const Options = Object.freeze({
  Sites: Sites,
  Tools: {
    bangs: { name: "<a href='https://duckduckgo.com/bang?q='>DuckDuckGo Bangs</a>" },
    calculator: { name: "Calculator" },
    plot: { name: "Plot" }
  }
})

const GIST = "https://gist.githubusercontent.com/Dj0ulo/7224203ee9be47ba5be6f57be1cd22c5/raw"

const SAVE_QUERIES_ENGINE = "save_queries_engine"
const SAVE_OPTIONS_KEY = "save_options_key";

const fetchEngines = () => {
  return fetch(`${GIST}/engines.json`)
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

fetchEngines().then(r => console.log("Engines: ", r))

const loadEngines = () => {
  return new Promise(async resolve => {
    chrome.storage.local.get([SAVE_QUERIES_ENGINE], storage => {
      resolve(storage[SAVE_QUERIES_ENGINE] || Engines);
    })
  })
}

const defaultSettings = () => {
  let save = {};
  Object.keys(Options).forEach(category => {
    Object.keys(Options[category]).forEach(k => {
      save[k] = true
    })
  })
  return save;
}
const loadSettings = () => {
  return new Promise(async resolve => {
    chrome.storage.local.get([SAVE_OPTIONS_KEY], storage => {
      resolve(storage[SAVE_OPTIONS_KEY] || defaultSettings());
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
