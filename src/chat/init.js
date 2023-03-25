(() => {
  Context.aichat = () => {
    switch(Context.save['aichat']){
      case 'chatgpt': new ChatGPTSession().panel(); return;
      case 'bingchat': new BingChatSession().panel(); return;
    }
  };
})();
