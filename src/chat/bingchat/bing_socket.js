window.parent.postMessage({
  message: 'ready',
  sender: 'socket-script',
}, '*');

window.addEventListener('message', async (event) => {
  window.parent.postMessage({
    message: await handleMessage(event.data.message),
    messageId: event.data.messageId,
  }, '*');
});

async function handleMessage(message) {
  if (message.action === 'session') {
    const r = await fetch(`https://www.bing.com/turing/conversation/create`, {
      credentials: "include",
    });
    const result = await r.json();
    if (r.headers.has('X-Sydney-Conversationsignature')) {
      result['conversationSignature'] = r.headers.get('X-Sydney-Conversationsignature');
    }
    if (r.headers.has('X-Sydney-Encryptedconversationsignature')) {
      result['sec_access_token'] = r.headers.get('X-Sydney-Encryptedconversationsignature');
    }
    return result;
  } else if (message.action === 'delete') {
    return (await fetch('https://sydney.bing.com/sydney/DeleteSingleConversation', {
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${message.conversationSignature}`,
      },
      body: JSON.stringify({
        "conversationId": message.conversationId,
        "participant": {
          "id": message.clientId
        },
        "source": "cib",
        "optionsSets": [
          "autosave"
        ]
      }),
      method: "POST",
      mode: "cors",
    })).json();
  }
  return handleActionWebsocket(message);
}

const websockets = [];

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
