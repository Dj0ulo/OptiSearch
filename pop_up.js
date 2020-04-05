const ARROW_LEFT = '&#9654;';
const ARROW_DOWN = '&#9660;';

const CLASS_CHECKDIV = 'checkdiv';

document.addEventListener("DOMContentLoaded", () => {

    getSettings((save) => {   
        //console.log(save);
        
        let liEng = document.querySelector("#Engines");
        enginesChecks(liEng);
        let spanCheckEng = liEng.querySelectorAll('.'+CLASS_CHECKDIV);
        for (let i = 0; i < spanCheckEng.length; i++) {
            const s = spanCheckEng[i];
            let img = document.createElement("img");
            img.src = Engines[Object.keys(Engines)[i]].icon;     
            s.prepend(img);   
        }


        let list = document.body.querySelector("ul");
        for(let li of list.children){
            li.className = "menu";
            let sublist = document.createElement("ul");
            sublist.className = "sublist";
            sublist.style.display = "none";
            li.appendChild(sublist);
            let title = li.querySelector("span");
            title.className = "menu_title";

            let arrow = document.createElement("span");
            arrow.className = 'arrow';
            arrow.innerHTML = ARROW_LEFT;
            arrow.value = 'down';

            // title.onclick = function(){
            //     if(arrow.value == 'left'){
            //         arrow.innerHTML = ARROW_DOWN;
            //         arrow.value = 'down';
            //         sublist.style.display = "block";
            //     }
            //     else{
            //         arrow.innerHTML = ARROW_LEFT;
            //         arrow.value = 'left';
            //         sublist.style.display = "none";
            //     }                    
            // }
            title.prepend(arrow);
        }

        //options
        for (const key in Options) {
            if (Options.hasOwnProperty(key)) {
                const optiontypes = Options[key];
                let menu = document.querySelector("#"+key);
                let listM = menu.querySelector("ul");
                listM.style.display = "block";

                for (const o in optiontypes) {
                    if (optiontypes.hasOwnProperty(o)) {
                        const spec = optiontypes[o];
                        let li = document.createElement("li");
                        li.id = o;
                        let d = document.createElement("div");
                        d.className = "optiondiv";
                        d.style.display = "inline-block";
                        li.appendChild(d);
                        d.innerHTML = "<span class='titleOption'>"+spec.name+"</span>";
                        d.appendChild(checkBox(CLASS_CHECK_OPTION));
                            
                        enginesChecks(li);
                        listM.appendChild(li);
                    }
                }
                menu.appendChild(listM);
            }
        }

        refreshCheckboxes();

        function refreshCheckboxes(){
            for (const option in save) {
                if (save.hasOwnProperty(option) && (option == GLOBAL_OPTION || Options.Sites.hasOwnProperty(option) || Options.Tools.hasOwnProperty(option))) {
                    const saveOption = save[option];
                    for (const engine in saveOption) {
                        if (saveOption.hasOwnProperty(engine)) {
                            const active = saveOption[engine];

                            const select = '.'+CLASS_CHECKDIV+'.'+engine+" .checkbox";
                            let checkBox;
                            if(option==GLOBAL_OPTION){
                                checkBox = document.querySelector("#Engines").querySelector(select);
                            }                                
                            else{
                                let lineOpt = document.getElementById(option);
                                checkBox = lineOpt.querySelector(select);                                
                                if(engine != CLASS_CHECK_OPTION &&
                                    (save[GLOBAL_OPTION][engine]==false || save[option][CLASS_CHECK_OPTION]==false) )
                                    checkBox.disabled = true;
                                else
                                    checkBox.disabled = false;
                            }
                            checkBox.checked = active;
                            checkBox.onclick = function(){
                                save[option][engine] = save[option][engine]==true ? false : true;
                                saveSettings(save,refreshCheckboxes);
                            }                                
                            
                        }
                    }                    
                }
            }
        }

        function enginesChecks(li){
            let checks = document.createElement("div");
            checks.style.display = "inline-block";
            checks.className = "enginechecks";
            for(let e in Engines){
                checks.append(checkBox(e));
            }
            li.append(checks);
        }
        function checkBox(className){
            let d = document.createElement("div");
            d.style.display = "inline-block";
            d.className = CLASS_CHECKDIV+" "+className;
            d.innerHTML = "<input class='checkbox' type='checkbox'>";
            return d;
        }
    });

});