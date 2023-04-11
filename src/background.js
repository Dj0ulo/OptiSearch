fetchEngines();

chrome.runtime.onMessage.addListener((action, _, sendResponse) => {
  handleAction(action).then(sendResponse);
  return true;
});

const eventStreams = [];
const websockets = [];
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
    .catch(e => ({ error: e.toString() }));

  const contentType = response.headers.get('content-type');
  if (contentType.startsWith("application/json"))
    return response.json();
  if (contentType.startsWith("text/event-stream")) {
    eventStreams.push(response.body.getReader());
    return { eventStream: true, id: eventStreams.length - 1 };
  }

  if (!response.ok)
    return { status: response.status, body: await response.text() };
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
    packet: [...value.values()].map(c => String.fromCharCode(c)).join(''),
  }));
}

/**
 * Creates a websocket from `url` and add it to the array `websockets`. 
 * If `index` is specified, it will get the corresponding websocket from the array.
 * If `toSend` is specified, it will send it.
 * If `index` is specified, but not `toSend` it will return back the first message received
 * in a FIFO queue.
 */
async function handleActionWebsocket(action, tryTimes = 3) {
  const { socketID, url, toSend } = action;
  if (socketID == null) {
    let ws = null;
    try {
      ws = new WebSocket(url);
    } catch (error) {
      if (tryTimes <= 0)
        return { error: error.toString() };
      await new Promise(resolve => setTimeout(resolve, 500));
      return handleActionWebsocket(action, tryTimes - 1);
    }
    ws.stream = new Stream();
    websockets.push(ws);
    ws.onopen = () => {
      if (toSend)
        ws.send(toSend);
    }
    ws.onmessage = ({ data }) => {
      ws.stream.write(data);
    }
    ws.onclose = ({ wasClean }) => {
      ws.stream.write(`{wasClean:${wasClean}}`);
    };
    return { socketID: websockets.length - 1 };
  }
  const ws = websockets[socketID];
  if (!ws) {
    return { error: `Error: websocket ${socketID} not available` };
  }
  if (toSend) {
    ws.send(toSend);
    return { status: 'Success' };
  }
  return ws.stream.read().then((packet) => ({ readyState: ws.readyState, packet }));
}
class Stream {
  constructor() {
    this.buffer = [];
    this.readPromise = null;
  }

  async read() {
    if (this.buffer.length > 0)
      return this.buffer.shift();

    if (this.readPromise === null) {
      this.readPromise = new Promise(resolve => this.resolveReadPromise = resolve);
    }
    return this.readPromise;
  }

  write(data) {
    // console.debug('WebSocket receives: ', data);
    this.buffer.push(data);
    if (this.readPromise !== null) {
      this.resolveReadPromise(this.buffer.shift());
      this.readPromise = null;
    }
  }
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
  console.log(`Engines properties fetched ${local ? 'locally' : 'from the gist'}: `, json);
  return json;
}
