Sites.cplusplus.msgApi = () => ({})

Sites.cplusplus.get = (from, doc) => {
  const body = doc.querySelector("body");
  
  console.log(body);

  return {
    title: doc.title.trim(),
    lib: body.querySelector('#I_file')?.innerHTML,
    type: body.querySelector('#I_type')?.innerHTML,
    proto: body.querySelector('.C_prototype')?.innerHTML
  }
}

Sites.cplusplus.set = msg => ({
  body: el('div',{
    innerHTML: `${msg.type} ${msg.lib} ${msg.proto}`
  })
})