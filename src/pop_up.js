const ARROW_LEFT = '&#9654;';
const ARROW_DOWN = '&#9660;';

const CLASS_CHECKDIV = 'checkdiv'

document.addEventListener("DOMContentLoaded", async () => {
    const save = await getSettings()
        
    const liEng = document.querySelector("#engines")
    Object.keys(Engines).forEach(e => {
        const div = document.createElement("div")
        div.className = 'engine'

        const img = document.createElement("img")
        img.src = Engines[e].icon;  
        div.appendChild(img)

        liEng.appendChild(div)
    })

    const list = document.createElement('ul')
    document.body.appendChild(list)


    //options
    Object.keys(Options).forEach(category => {
        const menu = document.createElement('li')
        menu.className = "menu"
        list.appendChild(menu)

        const title = document.createElement("span")
        title.className = "menu_title"
        menu.appendChild(title)

        const arrow = document.createElement("span")
        arrow.className = 'arrow'
        arrow.innerHTML = ARROW_LEFT
        arrow.value = 'down'
        title.appendChild(arrow)

        const txt = document.createElement("span")
        txt.textContent = category
        title.appendChild(txt)

        title.appendChild(document.createElement("hr"))

        const sublist = document.createElement("ul")
        sublist.className = "sublist"
        sublist.style.display = "block"
        menu.appendChild(sublist)

        Object.keys(Options[category]).forEach(o => {
            const spec = Options[category][o]

            const li = document.createElement("li")
            li.id = o;
            sublist.appendChild(li)

            const d = document.createElement("div")
            d.className = "optiondiv"
            d.style.display = "inline-block"
            d.innerHTML = `<span class="titleOption"><img width=14 height=14 src="${spec.icon}">${spec.name}</span>`
            const checkDiv = checkBox()
            const box = checkDiv.querySelector('input')
            box.checked = save[o]
            box.onchange = ev => {
                save[o] = ev.target.checked
                saveSettings(save)
            }

            d.appendChild(checkDiv)
            li.appendChild(d)    
        })        
    })


    function checkBox(className){
        const d = document.createElement("div")
        d.style.display = "inline-block"
        d.className = CLASS_CHECKDIV+" "+className
        d.innerHTML = "<input class='checkbox' type='checkbox'>"
        return d
    }

    document.querySelectorAll("a").forEach(ln => {
        ln.onclick = () => chrome.tabs.create({active: true, url: ln.href})
    })

});