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
