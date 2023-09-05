fetchEngines();

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
    'setup-bing-offscreen': handleSetupOffscreen,
    'window': handleActionWindow,
    'event-stream': handleActionEventStream,
  };
  if (actionType in handlers)
    return handlers[actionType](action);
  throw new Error(`Unknown action type: "${actionType}"`);
}

/** Handles fetch action */
async function handleActionFetch(action) {
  const response = await fetch(action.url, action.params && JSON.parse(action.params))
    .catch(e => ({ errorInBackgroundScript: true, error: e.toString() }));

  if (!response.ok)
    return { status: response.status, body: await response.text && response.text() };

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
  const response = await fetch(url, { credentials: 'omit' }).catch(e => ({ error: e.toString() }));
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
function handleActionWindow({ url }) {
  chrome.windows.create({ url, width: 800, height: 800, focused: true });
  return { status: 'Window created !' };
}

/** Handles new data received from an event-stream */
function handleActionEventStream(action) {
  const { id } = action;

  if (!eventStreams[id])
    return { error: `Error: event-stream ${id} not available` };

  return eventStreams[id].read().then(({ done, value }) => ({
    done,
    packet: value && [...value.values()].map(c => String.fromCharCode(c)).join(''),
  }));
}

/**
 * Check if there is an offscreen document active and create one if not.
 * This method should be executed only on the BingChat extension and with manifest v3.
 */
async function handleSetupOffscreen() {
  const already = await setupOffscreenDocument('src/chat/BingChat/offscreen.html');
  return { 'status': already ? 'Offscreen already running' : 'Offscreen setup' };
}

let creating; // A global promise to avoid concurrency issues

/**
 * Check if there is an offscreen document active and create one if not.
 * This method should be executed only on the BingChat extension and with manifest v3.
 */
async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);

  if (await hasOffscreenDocument(offscreenUrl)) {
    return true;
  }

  if (creating) {
    await creating;
  } else {
    const createOffscreenDocument = () => chrome.offscreen.createDocument({
      url: path,
      reasons: ['IFRAME_SCRIPTING'],
      justification: 'Open WebSocket inside bing.com context',
    });
    creating = createOffscreenDocument().catch(async error => {
      if (error.message.startsWith('Only a single offscreen document may be created.')) {
        await chrome.offscreen.closeDocument();
        creating = null;
        return createOffscreenDocument();
      }
      throw error;
    });
    await creating;
    creating = null;
  }
  return false;
}

/**
 * Check if there is an offscreen document active.
 * This method should be executed only on the BingChat extension and with manifest v3.
 */
async function hasOffscreenDocument(offscreenUrl) {
  const matchedClients = await clients.matchAll();

  for (const client of matchedClients) {
    if (client.url === offscreenUrl) {
      return true;
    }
  }
  return false;
}

/**
 * Fetches engines properties on a Gist. If it fails to fetch it, it gets it in local.
 * @param {boolean} local If true: bypass the attempt to fetch it from the Gist
 * @returns 
 */
async function fetchEngines(local = false) {
  const GIST = "https://gist.githubusercontent.com/Dj0ulo/7224203ee9be47ba5be6f57be1cd22c5/raw";
  const SAVE_QUERIES_ENGINE = "save_queries_engine";
  let url = local ? chrome.runtime.getURL(`./src/engines.json`) : `${GIST}/engines.json`;
  const response = await fetch(url).catch(() => {
    if (local)
      throw new Error("No local engines found...");
    return fetchEngines(true);
  });
  if (!response.ok)
    throw response;
  const json = await response.json();
  chrome.storage.local.set({ [SAVE_QUERIES_ENGINE]: json });
  console.log(`Engines properties fetched ${local ? 'locally' : `from ${GIST}`}: `, json);
  return json;
}
