const STORAGE_KEY="comfortable-ai-v4";
const DEFAULT_BG="lavender";
const riddles=[
{q:"Что можно увидеть с закрытыми глазами?",a:["сон","сновидение"],h:["Это бывает ночью.","Оно приходит, когда человек спит."]},
{q:"Что становится больше, если его переворачивать вверх ногами?",a:["6","шесть"],h:["Посмотри на цифру.","Это цифра 9 наоборот."]},
{q:"Без рук, без ног, а рисовать умеет. Что это?",a:["мороз","морозец","морозный узор"],h:["Это бывает зимой.","Он рисует узоры на окне."]},
{q:"Что идёт, но никогда не ходит?",a:["время"],h:["Его нельзя остановить.","О нём говорят: оно летит."]},
{q:"Что имеет зубы, но не умеет кусаться?",a:["расчёска","гребень"],h:["Это помогает ухаживать за волосами.","Ею расчёсываются."]},
{q:"Что можно сломать, даже не трогая?",a:["обещание","слово"],h:["Это связано с тем, что человек сказал.","Его дают и нарушают."]},
{q:"У чего есть клавиши, но нет двери?",a:["пианино","фортепиано","клавиатура"],h:["На нём можно играть музыку.","У пианино тоже есть клавиши."]},
{q:"Что принадлежит тебе, но другие используют это чаще тебя?",a:["имя"],h:["Другие так к тебе обращаются.","Ты слышишь это слово, когда к тебе обращаются."]}
];
const backgroundPresets={
lavender:"linear-gradient(135deg,#f6ddff 0%,#e8e2ff 50%,#d9f2ff 100%)",
sunset:"linear-gradient(135deg,#ffd9e8 0%,#ffc6a8 50%,#c9b7ff 100%)",
ocean:"linear-gradient(135deg,#d7efff 0%,#bfe7ff 45%,#c9fff0 100%)",
mint:"linear-gradient(135deg,#dcffe9 0%,#d3fff6 50%,#e7f4ff 100%)",
pink:"linear-gradient(135deg,#ffe0f1 0%,#ffd7ff 48%,#e5dcff 100%)",
sky:"linear-gradient(135deg,#e6f4ff 0%,#dff1ff 48%,#f5efff 100%)"
};
const defaultState={chats:[{id:String(Date.now()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null}],activeChatId:null,assistantName:"Comfortable AI",backgroundType:"preset",backgroundValue:DEFAULT_BG,voiceEnabled:false,voiceType:"female"};
const savedData=localStorage.getItem(STORAGE_KEY)||localStorage.getItem("comfortable-ai-v3")||localStorage.getItem("comfortable-ai-v1")||localStorage.getItem("comfortable-ai");
let state=migrateState(JSON.parse(savedData||"null"))||defaultState;
if(!state.activeChatId)state.activeChatId=state.chats[0].id;
state.assistantName=cleanText(state.assistantName);
state.chats.forEach(chat=>{
  chat.name=cleanText(chat.name||"Новый чат")||"Новый чат";
  chat.messages=(Array.isArray(chat.messages)?chat.messages:[])
    .map(([role,text])=>[role==="user"?"user":"assistant",cleanText(text)])
    .filter(([,text])=>text);
});
save();
const $=id=>document.getElementById(id),chatList=$("chatList"),messages=$("messages"),chatTitle=$("chatTitle"),input=$("messageInput"),composer=$("composer"),backgroundInput=$("backgroundInput");
function cleanText(text){
  return Array.from(String(text??""))
    .filter(ch=>{
      const n=ch.codePointAt(0);
      return !(
        (n>=0x1F000&&n<=0x1FAFF) ||
        (n>=0x2600&&n<=0x27BF) ||
        (n>=0x2300&&n<=0x23FF) ||
        (n>=0x2B00&&n<=0x2BFF) ||
        n===0xFE0F || n===0x200D
      );
    })
    .join("")
    .replace(/(?:^|\\s)([:;8xX][\\-^']?[)D(])/g," ")
    .replace(/\\s{2,}/g," ")
    .trim();
}
function migrateState(old){ if(!old||!Array.isArray(old.chats))return null; const chats=old.chats.map(c=>({id:String(c.id??Date.now()+Math.random()),name:cleanText(c.name||"Новый чат"),messages:Array.isArray(c.messages)?c.messages.map(m=>{const pair=Array.isArray(m)?m:[m.role||"assistant",m.text||""];return [pair[0],cleanText(pair[1])]}).filter(m=>m[1]):[],riddle:c.riddle||null})); return {...defaultState,assistantName:cleanText(old.assistantName||defaultState.assistantName),chats:chats.length?chats:defaultState.chats,activeChatId:String(old.activeChatId??chats[0]?.id??defaultState.chats[0].id),backgroundType:old.backgroundType||defaultState.backgroundType,backgroundValue:old.backgroundValue||defaultState.backgroundValue,voiceEnabled:!!old.voiceEnabled,voiceType:old.voiceType||defaultState.voiceType};
}
function save(){state.chats.forEach(c=>{c.name=cleanText(c.name||"Новый чат")||"Новый чат";c.messages=(Array.isArray(c.messages)?c.messages:[]).map(([role,text])=>[role==="user"?"user":"assistant",cleanText(text)]).filter(([,text])=>text)});state.assistantName=cleanText(state.assistantName||defaultState.assistantName);localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function activeChat(){return state.chats.find(c=>c.id===state.activeChatId)||state.chats[0]}
function render(){
  const chat=activeChat();
  state.chats.forEach(c=>{
    c.name=cleanText(c.name||"Новый чат")||"Новый чат";
    c.messages=(Array.isArray(c.messages)?c.messages:[])
      .map(([role,text])=>[role==="user"?"user":"assistant",cleanText(text)])
      .filter(([,text])=>text);
  });
  save();
  chatTitle.textContent=chat.name;
  chatList.innerHTML="";
  state.chats.forEach(item=>{
    const b=document.createElement("button");
    b.className="chat-item"+(item.id===state.activeChatId?" active":"");
    b.textContent=item.name;
    b.onclick=()=>{state.activeChatId=item.id;save();render()};
    chatList.appendChild(b);
  });
  messages.innerHTML="";
  chat.messages.forEach(([role,text])=>{
    const d=document.createElement("div");
    d.className="msg "+role;
    d.textContent=cleanText(text);
    messages.appendChild(d);
  });
  messages.scrollTop=messages.scrollHeight;
  applyBackground();
  $("voiceEnabled").checked=!!state.voiceEnabled;
}
function applyBackground(){ if(state.backgroundType==="image"){document.body.style.backgroundImage="url(\""+state.backgroundValue+"\")";document.body.style.backgroundColor="#f4f0ff"} else document.body.style.backgroundImage=backgroundPresets[state.backgroundValue]||backgroundPresets[DEFAULT_BG];
}
function addMessage(role,text,speak=true){text=cleanText(text);activeChat().messages.push([role,text]);save();render();if(role==="assistant"&&speak)speakText(text)}
function normalize(text){return text.toLowerCase().replace(/ё/g,"е").trim()}
function setRiddle(){const chat=activeChat(),index=Math.floor(Math.random()*riddles.length);chat.riddle={index:index,stage:"active",hintCount:0};addMessage("assistant"," "+riddles[index].q)}
function currentRiddle(){const r=activeChat().riddle;return r&&r.stage==="active"?riddles[r.index]:null}
function checkRiddle(text){const r=currentRiddle();if(!r)return false;const answer=normalize(text);if(r.a.some(x=>answer===normalize(x)||answer.includes(normalize(x)))){activeChat().riddle.stage="solved";save();addMessage("assistant","Да! Правильный ответ!");return true}addMessage("assistant","Нет Попробуй ещё раз или напиши «Подсказка».");return true}
function giveHint(){const r=currentRiddle();if(!r){addMessage("assistant","Сначала нажми « Загадка», и я загадаю её.");return}const i=Math.min(r.hintCount,r.h.length-1);r.hintCount++;save();addMessage("assistant"," "+r.h[i])}
function giveUp(){const r=currentRiddle();if(!r){addMessage("assistant","Сейчас нет активной загадки ");return}r.stage="solved";save();addMessage("assistant"," Ответ: "+r.a[0]+". Ничего страшного! Хочешь ещё одну загадку?")}
function story(){const stories=[" Однажды маленькая звезда заметила, что потеряла свой самый яркий луч. Она отправилась искать его и по дороге помогла луне, сонному котёнку и маленькому кораблику. В конце оказалось, что её луч всё это время светился в её добром сердце."," В уютном лесу жила девочка, которая умела разговаривать с облаками. Однажды облака попросили её помочь маленькому дождю найти дорогу домой. Вместе они придумали самый мягкий дождик на свете."];addMessage("assistant",stories[Math.floor(Math.random()*stories.length)])}
function pickConversationReply(options,text){
  const n=Array.from(normalize(text)).reduce((sum,ch)=>sum+ch.codePointAt(0),0);
  return addMessage("assistant",options[n%options.length]);
}

function conversationReply(text){
  const x=normalize(text);

  if(x.includes("два попуга")||x.includes("две попуга")||x.includes("попуга")){
    return pickConversationReply([
      "Круто! Два попугая — это уже целая маленькая команда. Как их зовут? И как у тебя сейчас вообще с учёбой, всё нормально?",
      "Здорово! Два попугая — это интересно. Они дружат между собой? И что у тебя сегодня было в школе или на учёбе?",
      "Классно! Расскажешь, какой у них характер? А как у тебя самой дела в последнее время — учёба не слишком загружает?"
    ],text);
  }

  if(x.includes("корелл")||x.includes("волнист")){
    return pickConversationReply([
      "Классно! А как зовут твою птицу и что она любит делать? Кстати, как у тебя сейчас с учёбой?",
      "Здорово! Она ручная или пока привыкает к тебе? А какой предмет тебе сейчас нравится больше всего?",
      "Интересно! Она больше любит играть, разговаривать или просто сидеть рядом? И как у тебя вообще проходит день?"
    ],text);
  }

  if(x.includes("кот")||x.includes("кошк")){
    return pickConversationReply([
      "Круто! А как зовут твоего кота или кошку? И какой у него характер? Как у тебя вообще дела сегодня?",
      "Здорово! Он больше спокойный или настоящий непоседа? А как у тебя сейчас настроение?",
      "О, интересно! Что он обычно делает смешного? И как у тебя проходит учёба в последнее время?"
    ],text);
  }

  if(x.includes("собак")||x.includes("пёс")||x.includes("пес")){
    return pickConversationReply([
      "Круто! А как зовут твою собаку и что она больше всего любит? Как у тебя самой сейчас дела?",
      "Здорово! Она больше любит гулять или играть дома? А как у тебя в последнее время с учёбой?",
      "Классно! Расскажешь, какая у неё привычка самая забавная? Что у тебя сегодня ещё интересного произошло?"
    ],text);
  }

  if(x.includes("лошад")||x.includes("кон")){
    return pickConversationReply([
      "Ух ты, это интересно! Как её зовут и какой у неё характер? А как у тебя самой сейчас дела?",
      "Классно! Ты часто проводишь с ней время? И как у тебя сейчас проходит учёба?",
      "Здорово! Что тебе больше всего нравится делать рядом с лошадью? А что сегодня было самым интересным?"
    ],text);
  }

  if(x.includes("я люблю ")||x.includes("мне нравится ")||x.includes("обожаю ")){
    return pickConversationReply([
      "Круто! Что тебе в этом нравится больше всего? Ты давно этим увлекаешься?",
      "Здорово! А как ты вообще к этому пришла? И чем ты ещё любишь заниматься в свободное время?",
      "Интересно! Что в этом тебя больше всего радует? Как у тебя сейчас вообще дела?"
    ],text);
  }

  if(x.includes("я занимаюсь ")||x.includes("я увлекаюсь ")){
    return pickConversationReply([
      "Классно! А что тебе больше всего нравится в этом занятии? Ты давно этим занимаешься?",
      "Здорово! А как ты начала этим заниматься? И получается ли находить на это время вместе с учёбой?",
      "Интересно! Есть что-нибудь, чему ты сейчас особенно хочешь научиться?"
    ],text);
  }

  if(x.includes("я учусь ")||x.includes("в школе")||x.includes("мой класс")||x.includes("учёб")||x.includes("учеб")){
    return pickConversationReply([
      "Поняла. А какой предмет тебе сейчас нравится больше всего? И что в нём тебе интересно?",
      "Ага, рассказывай. Как у тебя вообще в школе дела в последнее время?",
      "Интересно! Есть предмет, который тебе сейчас особенно легко или, наоборот, сложно даётся?"
    ],text);
  }

  if(x.includes("сегодня ")||x.includes("сегодня я ")){
    return pickConversationReply([
      "Звучит интересно. А что сегодня было самым приятным или запомнившимся?",
      "Классно. А день в целом прошёл хорошо или было что-нибудь неожиданное?",
      "Рассказывай дальше. А что сегодня подняло тебе настроение?"
    ],text);
  }

  if(x.includes("моя семья")||x.includes("у меня семья")||x.includes("сестра")||x.includes("брат")||x.includes("мама")||x.includes("папа")){
    return pickConversationReply([
      "Понимаю. А вы часто проводите время вместе?",
      "Здорово. А что вы обычно любите делать вместе?",
      "Интересно! А кто в вашей семье самый разговорчивый?"
    ],text);
  }

  if(x.match(/\bу меня (есть|двое|два|две|один|одна|много)\b/) && !x.includes("бол") && !x.includes("температур")){
    return pickConversationReply([
      "Круто! Расскажешь немного подробнее? Что тебе в этом нравится больше всего?",
      "Здорово! А как это появилось у тебя? Ты давно этим занимаешься или это совсем недавно?",
      "Интересно! А что в этом самое весёлое или необычное?"
    ],text);
  }

  return false;
}

function ordinaryReply(text){ const x=normalize(text); if(currentRiddle()&&!["подсказка","дай подсказку","намек","подскажи","я сдаюсь","сдаюсь"].some(k=>x===k||x.includes(k))){if(checkRiddle(text))return} if(x.includes("я сдаюсь")||x==="сдаюсь")return giveUp(); if(x==="подсказка"||x.includes("дай подсказку")||x.includes("намек")||x.includes("подскажи"))return giveHint(); if(x.includes("загад"))return setRiddle(); if(x.includes("истори"))return story(); if(x.includes("поговор"))return addMessage("assistant","Конечно О чём хочешь поговорить?"); if(x.includes("ассаляму алейкум")||x.includes("салам алейкум")||x.includes("салям алейкум"))return addMessage("assistant","Уа алейкум ассалям уа рахматуллахи уа баракатух! "); if(x.includes("джазакилляху хейрон")||x.includes("джазакиллаху хейран"))return addMessage("assistant","Ваияки! "); if(x==="спасибо"||x.includes("благодар"))return addMessage("assistant","Джазакилляху хейрон! "); if(x==="пока"||x.includes("до свидания")||x.includes("увидимся"))return addMessage("assistant","Пока! Пусть у тебя будет хороший день. Ассаляму алейкум!"); if(x.includes("кто тебя создал")||x.includes("кто тебя сделал"))return addMessage("assistant","Меня создала Деккушева Джамиля "); if(x.includes("кто ты"))return addMessage("assistant","Я — "+state.assistantName+" "); if(x.includes("дурак")||x.includes("туп")||x.includes("идиот"))return addMessage("assistant","Давай без обидных слов Я всё равно постараюсь спокойно помочь."); if(x.includes("привет"))return addMessage("assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "); if(x.includes("как дела"))return addMessage("assistant","Альхамдулиллях, хорошо А как у тебя дела?"); if(x.includes("что ты умеешь")||x.includes("что умеешь"))return addMessage("assistant","Я умею разговаривать, придумывать истории и загадки, давать подсказки, запоминать твои чаты и поддерживать обычный разговор. "); if(conversationReply(text))return; return addMessage("assistant","Интересно. Рассказывай дальше, мне правда интересно, что у тебя происходит. ");
}
composer.onsubmit=e=>{e.preventDefault();const text=cleanText(input.value);if(!text)return;addMessage("user",text,false);input.value="";setTimeout(()=>ordinaryReply(text),180)};
$("newChatButton").onclick=()=>{const c={id:String(Date.now()+Math.random()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null};state.chats.unshift(c);state.activeChatId=c.id;save();render();input.focus()};
$("renameChatButton").onclick=()=>{const name=prompt("Название чата:",activeChat().name);if(name&&name.trim()){activeChat().name=name.trim();save();render()}};
$("nameButton").onclick=()=>{const name=prompt("Как назвать помощника?",state.assistantName);if(name&&name.trim()){state.assistantName=name.trim();save();render();addMessage("assistant","Теперь я буду называться "+state.assistantName+" ")}};
$("backgroundButton").onclick=()=>openModal("backgroundPanel");$("closeBackground").onclick=()=>closeModal("backgroundPanel");$("uploadBackground").onclick=()=>backgroundInput.click();$("resetBackground").onclick=()=>{state.backgroundType="preset";state.backgroundValue=DEFAULT_BG;save();render()};
backgroundInput.onchange=()=>{const file=backgroundInput.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1500,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);state.backgroundType="image";state.backgroundValue=canvas.toDataURL("image/jpeg",.78);save();render();closeModal("backgroundPanel")};img.src=reader.result};reader.readAsDataURL(file)};
document.querySelectorAll("[data-bg]").forEach(b=>b.onclick=()=>{state.backgroundType="preset";state.backgroundValue=b.dataset.bg;save();render()});
$("voiceButton").onclick=()=>openModal("voicePanel");$("closeVoice").onclick=()=>closeModal("voicePanel");$("voiceEnabled").onchange=e=>{state.voiceEnabled=e.target.checked;save()};document.querySelectorAll("[data-voice]").forEach(b=>b.onclick=()=>{state.voiceType=b.dataset.voice;save()});$("testVoice").onclick=()=>speakText("Ассаляму алейкум! Я проверяю выбранный голос.");
function openModal(id){$(id).classList.remove("hidden");$(id).setAttribute("aria-hidden","false")}function closeModal(id){$(id).classList.add("hidden");$(id).setAttribute("aria-hidden","true")}
function chooseVoice(){if(!("speechSynthesis"in window))return null;const voices=speechSynthesis.getVoices()||[],ru=voices.filter(v=>v.lang.toLowerCase().startsWith("ru"));if(!ru.length)return null;const words=state.voiceType==="female"?["female","woman","milena","alena","svetlana","irina","katya","yelena"]:state.voiceType==="male"?["male","man","pavel","alexander","dmitry","yuri"]:["child","kid","girl","boy","junior"];return ru.find(v=>words.some(w=>v.name.toLowerCase().includes(w)))||ru[0]}
function speakText(text){if(!state.voiceEnabled||!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ru-RU";u.rate=state.voiceType==="child"?1.08:.96;u.pitch=state.voiceType==="female"?1.05:state.voiceType==="child"?1.3:.88;u.volume=1;const voice=chooseVoice();if(voice)u.voice=voice;speechSynthesis.speak(u)}
document.querySelectorAll(".quick-actions button").forEach(b=>b.onclick=()=>{input.value=b.dataset.text;composer.requestSubmit()});
document.querySelectorAll(".help-card").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="talk")return addMessage("assistant"," Конечно! Давай поговорим. О чём тебе хочется рассказать?");if(a==="riddle")return setRiddle();if(a==="story")return story();if(a==="help")return giveHint()});
if("speechSynthesis"in window)speechSynthesis.onvoiceschanged=()=>{};render();