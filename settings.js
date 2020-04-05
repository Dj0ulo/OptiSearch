const Google = "Google", Ecosia = "Ecosia", Yahoo = "Yahoo";

const Engines = {
    Google : {icon : "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"},
    Ecosia : {icon : "https://cdn.ecosia.org/assets/images/ico/favicon.ico"},
    Yahoo : {icon : "https://s.yimg.com/rz/l/favicon.ico"}
};
var Sites = {
    wikipedia : {
        name : "Wikipedia",
        link : "wikipedia.org/wiki/",
        icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
    },
    stackoverflow : {
        name : "Stack Overflow",
        link : "https://stackoverflow.com/questions/",
        icon : 'https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico'
    },
    stackexchange: {
        name : "Stack Exchange",
        link : "https://math.stackexchange.com/questions/",
        icon : 'https://cdn.sstatic.net/Sites/stackexchange/img/favicon.ico'
    },
    w3schools: {
        name : "W3Schools",
        link : "https://www.w3schools.com/",
        icon : 'https://www.w3schools.com/favicon.ico'
    },
    mdn: {
        name : "MDN Web Docs",
        link : "https://developer.mozilla.org/",
        icon : 'https://developer.mozilla.org/static/img/favicon32.png'
    }
};

const Options = {
    Sites : Sites,
    Tools : {
        bangs: {name: "DuckDuckGo Bangs"},
        calculator: {name: "Calculator"},
        plot: {name: "Plot (beta)"}
    }
}

const GLOBAL_OPTION = 'GLOBAL';
const SAVE_OPTIONS_KEY = "optionSave";
const CLASS_CHECK_OPTION = 'Option';

function savedEngines() {
    return {Google:true, Ecosia:true, Yahoo:true};
}

function setDefaultSettings(callback){
    let save = {
        global : savedEngines()
    };

    for (const type in Options) {
        if (Options.hasOwnProperty(type)) {
            const t = Options[type];
            for (const o in t) {
                if (t.hasOwnProperty(o)) {
                    save[o][CLASS_CHECK_OPTION] = true;
                    save[o] = savedEngines();
                }
            }
        }
    }
    callback(save);
}
function getSettings(callback){
    chrome.storage.local.get([SAVE_OPTIONS_KEY],(storage) => {   
        var save = storage[SAVE_OPTIONS_KEY];
        if(!save)
            setDefaultSettings(callback);
        else
            callback(save);
    });
}
function saveSettings(save, callback){
    var store = {};
    store[SAVE_OPTIONS_KEY] = save;
    chrome.storage.local.set(store, function() {
        callback();
    });
}

