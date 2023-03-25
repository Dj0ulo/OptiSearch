fetchEngines();

chrome.runtime.onMessage.addListener((action, _, sendResponse) => {
  handleAction(action).then(sendResponse);
  return true;
});

const eventStreams = [];
const websockets = [];

function handleAction(action) {
  const { action: actionType } = action;
  const handlers = {
    'fetch': handleActionFetch,
    'image-blob': handleActionImageBlob,
    'window': handleActionWindow,
    'event-stream': handleActionEventStream,
    'websocket': handleActionWebsocket,
  };
  let handler = handleActionDefault;
  if (actionType in handlers)
    handler = handlers[actionType];
  return new Promise((resolve) => resolve(handler(action)));
}

async function handleActionDefault(action) {
  let url = String(action.api || action.link);
  if (url.startsWith('http://'))
    url = 'https' + url.slice(4);
  const response = await fetch(url, { credentials: 'omit' }).catch(e => ({ error: e.toString() }));
  return [action, await response.text()]
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

/** Fetch image blob from source */
function handleActionImageBlob({ url }) {
  return fetch(url).then(r => r.blob());
}

/** Fetch image blob from source */
function handleActionWindow({ url }) {
  chrome.windows.create({ url, width: 800, height: 800, focused: true });
  return {status: 'Window created !'};
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
async function handleActionWebsocket(action) {
  const { socketID, url, toSend } = action;
  if (socketID == null) {
    const ws = new WebSocket(url);
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
