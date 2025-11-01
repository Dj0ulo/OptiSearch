# OptiSearch ｜ AI answer in Google ｜ AI next to search results

![License](https://img.shields.io/github/license/dj0ulo/optisearch)

This repository contains the code of **OptiSearch**, **AI answer in Google** and **AI next to search results** browser extensions. They share the same codebase core.

### <img alt="OptiSearch icon" src="./icons/optisearch/icon_128.png" width="24" height="24"> OptiSearch
![License](https://img.shields.io/chrome-web-store/users/bbojmeobdaicehcopocnfhaagefleiae?label=Chrome%20Users) ![License](https://img.shields.io/amo/users/optisearch?label=Firefox%20Users)

Displays relevant informations from search engine results directly alongside them.

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/optisearch/bbojmeobdaicehcopocnfhaagefleiae)

[Install from Mozilla Add-on Store](https://addons.mozilla.org/fr/firefox/addon/optisearch/)

### <img alt="AI answer in Google icon" src="./icons/bingchat/icon_128.png" width="24" height="24"> AI answer in Google
![License](https://img.shields.io/chrome-web-store/users/pcnhobmoglanpljipbomknafhdlcgcng?label=Chrome%20Users) ![License](https://img.shields.io/amo/users/bing-chat-gpt-4-in-google?label=Firefox%20Users)

Displays the answer from Microsoft Copilot alongside search engine results.

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/bing-chat-gpt-4-in-google/pcnhobmoglanpljipbomknafhdlcgcng)

[Install from Mozilla Add-on Store](https://addons.mozilla.org/fr/firefox/addon/bing-chat-gpt-4-in-google/)

### <img alt="AI next to search results" src="./icons/bard/icon_128.png" width="24" height="24"> AI next to search results
![License](https://img.shields.io/chrome-web-store/users/pkdmfoabhnkpkcacnmgilaeghiggdbgf?label=Chrome%20Users) ![License](https://img.shields.io/amo/users/bard-for-search-engines?label=Firefox%20Users)

Displays the answer from Google Gemini alongside search engine results.

[Install from Chrome Web Store](https://chrome.google.com/webstore/detail/bard-for-search-engines/pkdmfoabhnkpkcacnmgilaeghiggdbgf)

[Install from Mozilla Add-on Store](https://addons.mozilla.org/fr/firefox/addon/bard-for-search-engines/)

## Supported Search Engines
Google, Bing, Baidu, DuckDuckGo, Ecosia, Brave Search

## Build from source
1. Clone repo
1. Install dependencies with:
    ```sh
    npm i
    ```
1. You can load both extension in your favorite browser directly from the root of the repo, you just need to build the manifest first, use the flag `-f` to build the manifest for Firefox.
    
    E.g. to build the firefox manifest for **AI answer in Google**:
    ```
    node build.mjs bingchat -f
    ```

1. You can copy the source for a given extension with the flag `-b` followed by the name of the desired directory (default: `build/<extension_codename>`).

    E.g. to copy **OptiSearch** sources for Chrome in *DIR*
    ```
    node build.mjs optisearch -b DIR
    ```
    E.g. to copy **AI next to search results** sources for Firefox in `build/bard`
    ```
    node build.mjs bard -bf
    ```
    or
    ```
    node build.mjs bard -b -f
    ```
1. You can create a zip from the source using the flag `-z` followed by the output filename. This will also copy the sources in the default build directory (unless you specified another one with `-b`). Use `-t` (for "tidy") to delete the build directory after the operation.

1. Finally, to build all extensions for Chrome and put them in the `build` directory:
    ```
    npm run build
    ```
1. Finally, to build and zip all extensions for Chrome and Firefox and put them in the `versions` directory:
    ```
    npm run pack
    ```

## Contributing
You are welcome to make a **PR** or post an **Issue**, I will look at them as soon as I can !

## Donate
I made this extension on my free time, if it is useful for you [please consider sending me a tip on paypal](https://www.paypal.com/donate?hosted_button_id=VPF2BYBDBU5AA).
