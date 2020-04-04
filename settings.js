const Google = "Google", Ecosia = "Ecosia", Yahoo = "Yahoo";

const Engines = {
    Google : {icon : "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"},
    Ecosia : {icon : "https://cdn.ecosia.org/assets/images/ico/favicon.ico"},
    Yahoo : {icon : "https://s.yimg.com/rz/l/favicon.ico"}
};
const EnginesIco = "https://cdn.ecosia.org/assets/images/ico/favicon.ico";
const Options = {
    Sites : {
        "Wikipedia" : {
            link : "wikipedia.org/wiki/",
            icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
        },
        "Stack Overflow": {
            link : "wikipedia.org/wiki/",
            icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
        },
        "Stack Exchange": {
            link : "wikipedia.org/wiki/",
            icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
        },
        "W3Schools": {
            link : "wikipedia.org/wiki/",
            icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
        },
        "MDN Web Docs": {
            link : "wikipedia.org/wiki/",
            icon : 'https://wikipedia.org/static/favicon/wikipedia.ico'
        }
    },
    Tools : {"DuckDuckGo Bangs": {},"Calculator": {},"Plot": {}}
}
const CLASS_CHECK_OPTION = 'Option';

function saveEngines() {
    return {Google:true, Ecosia:true, Yahoo:true};
}

function setDefaultSettings(callback){
    let save = {
        global : saveEngines()
    };

    for (const type in Options) {
        if (Options.hasOwnProperty(type)) {
            const t = Options[type];
            for (const o in t) {
                if (t.hasOwnProperty(o)) {
                    const spec = object[o];
                    
                }
            }
        }
    }
}

chrome.storage.local.get(['options'],(storage) => {   
    var save = storage['options'];
    if(!save){
        save = {};
        save.global = saveEngines();
    }
});