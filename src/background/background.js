fetchEngines(isDebugMode);

chrome.runtime.setUninstallURL('https://www.optisearch.io/uninstall.html');

chrome.runtime.onMessage.addListener((action, _, sendResponse) => {
  if (action.target === 'offscreen') return;
  handleAction(action).then(sendResponse);
  return true;
});

const eventStreams = [];
const sessionStorage = {};

async function handleAction(action) {
  const { action: actionType } = action;
  if (!actionType)
    return;
  const handlers = {
    'fetch': handleActionFetch,
    'fetch-result': handleActionFetchResult,
    'image-blob': handleActionImageBlob,
    'session-storage': handleSessionStorage,
    'window': handleActionWindow,
    'event-stream': handleActionEventStream,
    'websocket': handleActionWebsocket,
  };
  if (actionType in handlers)
    return handlers[actionType](action);
  throw new Error(`Unknown action type: "${actionType}"`);
}

/** Handles fetch action */
async function handleActionFetch(action) {
  const response = await fetch(action.url, action.params && JSON.parse(action.params))
    .catch(e => ({ errorInBackgroundScript: true, error: e.toString() }));

  if (response.type === "opaqueredirect") {
    return { status: 302 };
  }
  if (!response.ok)
    return {
      status: response.status,
      ...(response.text && { body: response.text() })
    };

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.startsWith("application/json")) {
    const text = await response.text();
    try { return JSON.parse(text); }
    catch (e) { return text; };
  }
  if (contentType.startsWith("text/event-stream")) {
    eventStreams.push(response.body.getReader());
    return { eventStream: true, id: eventStreams.length - 1 };
  }
  return response.text();
}

/** Fetch from site result using defined api or link url */
async function handleActionFetchResult(action) {
  let url = String(action.api || action.link);
  if (url.startsWith('http://'))
    url = 'https' + url.slice(4);
  const response = await fetch(url, { credentials: action.credentials ?? "omit" }).catch(e => ({ error: e.toString() }));
  return [action, await response.text()]
}

/** Fetch image blob from source */
function handleActionImageBlob({ url }) {
  return fetch(url).then(r => r.blob());
}

function handleSessionStorage({ type, key, value }) {
  if (type == 'set')
    sessionStorage[key] = value;
  if (type == 'get')
    return sessionStorage[key];
}

/** Fetch image blob from source */
function handleActionWindow(action) {
  chrome.windows.create({ 
    url: action.url, 
    type: action.type ?? 'normal',
    width: action.width ?? 800,
    height: action.height ?? 800,
    focused: true 
  });
  return { status: 'Window created !' };
}

/** Handles new data received from an event-stream */
function handleActionEventStream(action) {
  const { id } = action;

  if (!eventStreams[id])
    return { error: `Error: event-stream ${id} not available` };

  return eventStreams[id].read().then(({ done, value }) => ({
    done,
    data: value && [...value.values()].map(c => String.fromCharCode(c)).join(''),
  }));
}

/**
 * Fetches engines properties on a Gist. If it fails to fetch it, it gets it in local.
 * @param {boolean} local If true: bypass the attempt to fetch it from the Gist
 * @returns 
 */
async function fetchEngines(local = false) {
  const distantPath = "https://raw.githubusercontent.com/Dj0ulo/OptiSearch/master/src/engines.json";
  const localPath = chrome.runtime.getURL("./src/engines.json");
  const SAVE_QUERIES_ENGINE = "save_queries_engine";
  let url = local ? localPath : distantPath;
  const response = await fetch(url).catch(() => {
    if (local)
      throw new Error("No local engines found...");
    return fetchEngines(true);
  });
  const json = await response.json().catch(_ => ({}));
  if (!local && !json["Google"]) {
    return fetchEngines(true);
  }
  chrome.storage.local.set({ [SAVE_QUERIES_ENGINE]: json });
  console.log(`Engines properties fetched ${local ? 'locally' : `from ${url}`}: `, json);
  return json;
}
