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
const defaultState={chats:[{id:String(Date.now()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null,talkMode:false,talkQuestionHistory:[]}],activeChatId:null,assistantName:"Comfortable AI",backgroundType:"preset",backgroundValue:DEFAULT_BG,voiceEnabled:false,voiceType:"female"};
const savedData=localStorage.getItem(STORAGE_KEY)||localStorage.getItem("comfortable-ai-v3")||localStorage.getItem("comfortable-ai-v1")||localStorage.getItem("comfortable-ai");
let state=migrateState(JSON.parse(savedData||"null"))||defaultState;
if(!state.activeChatId)state.activeChatId=state.chats[0].id;
state.chats.forEach(c=>{c.talkMode=false});

state.assistantName=cleanText(state.assistantName);
state.chats.forEach(chat=>{
  chat.name=cleanText(chat.name||"Новый чат")||"Новый чат";
  chat.messages=(Array.isArray(chat.messages)?chat.messages:[])
    .map(([role,text])=>[role==="user"?"user":"assistant",cleanText(text)])
    .filter(([,text])=>text&&text!=="undefined");
});
save();
const $=id=>document.getElementById(id),chatList=$("chatList"),messages=$("messages"),chatTitle=$("chatTitle"),input=$("messageInput"),composer=$("composer"),backgroundInput=$("backgroundInput");
let lastSubmittedText="";
let lastSubmittedAt=0;
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
function migrateState(old){ if(!old||!Array.isArray(old.chats))return null; const chats=old.chats.map(c=>({id:String(c.id??Date.now()+Math.random()),name:cleanText(c.name||"Новый чат"),messages:Array.isArray(c.messages)?c.messages.map(m=>{const pair=Array.isArray(m)?m:[m.role||"assistant",m.text||""];return [pair[0],cleanText(pair[1])]}).filter(m=>m[1]):[],riddle:c.riddle||null,talkMode:false,talkQuestionHistory:Array.isArray(c.talkQuestionHistory)?c.talkQuestionHistory:[]})); return {...defaultState,assistantName:cleanText(old.assistantName||defaultState.assistantName),chats:chats.length?chats:defaultState.chats,activeChatId:String(old.activeChatId??chats[0]?.id??defaultState.chats[0].id),backgroundType:old.backgroundType||defaultState.backgroundType,backgroundValue:old.backgroundValue||defaultState.backgroundValue,voiceEnabled:!!old.voiceEnabled,voiceType:old.voiceType||defaultState.voiceType};
}
function save(){
  try{
    state.chats.forEach(c=>{
      c.name=cleanText(c.name||"Новый чат")||"Новый чат";
      c.messages=(Array.isArray(c.messages)?c.messages:[])
        .map(([role,text])=>[role==="user"?"user":"assistant",cleanText(text)])
        .filter(([,text])=>text&&text!=="undefined")
        .filter(([,text])=>text!=="Вот это интересно! А как у тебя учёба в школе?" && text!=="Интересно. Рассказывай дальше, мне правда интересно, что у тебя происходит.")
        .filter((item,index,arr)=>!(item[0]==="assistant"&&arr[index-1]?.[0]==="assistant"&&arr[index-1]?.[1]?.startsWith("Ох, как жаль. Да исцелит тебя Аллах.")));
    });
    state.assistantName=cleanText(state.assistantName||defaultState.assistantName);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  }catch(error){
    console.warn("Не удалось сохранить данные:",error);
  }
}
function activeChat(){return state.chats.find(c=>c.id===state.activeChatId)||state.chats[0]}
function render(){
  state.chats.forEach(c=>{c.messages=(Array.isArray(c.messages)?c.messages:[]).filter(m=>Array.isArray(m)&&m[1]!==undefined&&String(m[1]).trim()!=="undefined")});
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
    const row=document.createElement("div");
    row.className="chat-row"+(item.id===state.activeChatId?" active":"");

    const b=document.createElement("button");
    b.className="chat-item";
    b.textContent=item.name;
    b.onclick=()=>{state.activeChatId=item.id;save();render()};

    const actions=document.createElement("div");
    actions.className="chat-actions";

    const rename=document.createElement("button");
    rename.className="chat-action";
    rename.type="button";
    rename.textContent="Переименовать";
    rename.onclick=(e)=>{e.stopPropagation();const name=prompt("Название чата:",item.name);if(name&&name.trim()){item.name=name.trim();save();render()}};

    const remove=document.createElement("button");
    remove.className="chat-action delete";
    remove.type="button";
    remove.textContent="Удалить";
    remove.onclick=(e)=>{
      e.stopPropagation();
      if(!confirm("Удалить этот чат?"))return;
      const index=state.chats.findIndex(c=>c.id===item.id);
      if(index<0)return;
      state.chats.splice(index,1);
      if(!state.chats.length){
        state.chats.push({
          id:String(Date.now()+Math.random()),
          name:"Новый чат",
          messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],
          riddle:null,
          talkMode:false,
          talkQuestionHistory:[]
        });
      }
      if(!state.chats.some(c=>c.id===state.activeChatId)){
        state.activeChatId=state.chats[0].id;
      }
      save();
      render();
    };

    actions.appendChild(rename);
    actions.appendChild(remove);
    row.appendChild(b);
    row.appendChild(actions);
    chatList.appendChild(row);
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
function addMessage(role,text,speak=true){text=cleanText(text);const chat=activeChat();const last=chat.messages[chat.messages.length-1];if(role==="assistant"&&last&&last[0]==="assistant"&&last[1]===text)return;chat.messages.push([role,text]);save();render();if(role==="assistant"&&speak)speakText(text)}
function normalize(text){return text.toLowerCase().replace(/ё/g,"е").trim()}
function setRiddle(){const chat=activeChat();if(chat.riddle&&chat.riddle.stage==="active")return;const index=Math.floor(Math.random()*riddles.length);chat.riddle={index:index,stage:"active",hintCount:0};addMessage("assistant"," "+riddles[index].q)}
function currentRiddle(){const stateRiddle=activeChat().riddle;if(!stateRiddle||stateRiddle.stage!=="active")return null;const base=riddles[stateRiddle.index];if(!base)return null;return {...base,index:stateRiddle.index,stage:stateRiddle.stage,hintCount:Number.isFinite(stateRiddle.hintCount)?stateRiddle.hintCount:0}}
function checkRiddle(text){const r=currentRiddle();if(!r)return false;const answer=normalize(text);if(r.a.some(x=>answer===normalize(x)||answer.includes(normalize(x)))){activeChat().riddle.stage="solved";save();addMessage("assistant","Да! Правильный ответ!");return true}addMessage("assistant","Нет Попробуй ещё раз или напиши «Подсказка».");return true}
function giveHint(){const chat=activeChat();const r=currentRiddle();if(!r)return addMessage("assistant","Сначала нажми «Загадка», и я загадаю её.");const hintCount=Number.isFinite(chat.riddle.hintCount)?chat.riddle.hintCount:0;const i=Math.min(hintCount,r.h.length-1);chat.riddle.hintCount=hintCount+1;save();return addMessage("assistant",r.h[i]);}
function giveUp(){const r=currentRiddle();if(!r){addMessage("assistant","Сейчас нет активной загадки ");return}activeChat().riddle.stage="solved";save();addMessage("assistant"," Ответ: "+r.a[0]+". Ничего страшного! Хочешь ещё одну загадку?")}
function story(){const stories=[" Однажды маленькая звезда заметила, что потеряла свой самый яркий луч. Она отправилась искать его и по дороге помогла луне, сонному котёнку и маленькому кораблику. В конце оказалось, что её луч всё это время светился в её добром сердце."," В уютном лесу жила девочка, которая умела разговаривать с облаками. Однажды облака попросили её помочь маленькому дождю найти дорогу домой. Вместе они придумали самый мягкий дождик на свете."];addMessage("assistant",stories[Math.floor(Math.random()*stories.length)])}
function pickConversationReply(options,text){
  const n=Array.from(normalize(text)).reduce((sum,ch)=>sum+ch.codePointAt(0),0);
  return addMessage("assistant",options[n%options.length]);
}

const TALK_GENERAL_QUESTIONS=[
  "Как проходит твоя учёба?",
  "Какой предмет тебе нравится больше всего?",
  "Какой урок тебе обычно самый интересный?",
  "Что тебе обычно нравится делать после школы?",
  "Чем тебе сейчас особенно нравится заниматься?",
  "Как у тебя сегодня прошёл день?",
  "Что сегодня было самым интересным?",
  "Что сегодня тебя больше всего порадовало?",
  "Есть ли у тебя любимое занятие?",
  "Что тебе сейчас особенно интересно?",
  "Давно тебе это нравится?",
  "Как ты впервые этим заинтересовалась?",
  "Как часто ты этим занимаешься?",
  "Что тебе в этом нравится больше всего?",
  "Что тебе хотелось бы попробовать?",
  "Есть ли у тебя занятие, которому ты хотела бы научиться лучше?",
  "Что ты обычно делаешь в свободное время?",
  "Как ты любишь проводить выходные?",
  "Что тебе больше нравится: спокойный день или день, полный дел?",
  "Что тебе обычно поднимает настроение?",
  "Что тебе недавно особенно запомнилось?",
  "Есть ли у тебя любимая книга?",
  "Какой вид творчества тебе нравится?",
  "Любишь ли ты что-нибудь готовить?",
  "Какое блюдо тебе нравится больше всего?",
  "Есть ли у тебя любимое место для отдыха?",
  "Что тебе нравится делать вместе с друзьями?",
  "Что тебе нравится делать вместе с семьёй?",
  "Есть ли у тебя домашние животные?",
  "Каким своим умением ты особенно довольна?",
  "Что тебе хотелось бы научиться делать?",
  "Что тебе обычно интересно узнавать?",
  "Какой день недели тебе нравится больше всего?",
  "Что тебе больше всего нравится в твоём обычном дне?",
  "Что ты обычно делаешь, когда у тебя появляется свободный час?",
  "Что тебе хочется сделать в ближайшие дни?",
  "Есть ли что-нибудь, чем тебе приятно заниматься вечером?",
  "Что тебе больше нравится: рисовать, читать или мастерить?",
  "Какие занятия тебе никогда не надоедают?",
  "Что тебе обычно помогает сосредоточиться?",
  "Что тебе нравится вспоминать из недавних дней?",
  "Что тебе хотелось бы сделать по-новому в этом году?",
  "Есть ли у тебя маленькая цель на ближайшее время?",
  "Что тебе обычно интересно обсуждать?"
];

function greetingReply(){
  const options=[
    "Уа алейкум ассалям уа рахматуллахи уа баракатух! Чем могу помочь?",
    "Уа алейкум ассалям уа рахматуллахи уа баракатух! Как дела?"
  ];
  return addMessage("assistant",options[Math.floor(Math.random()*options.length)]);
}

function chooseTalkReaction(text){
  const x=normalize(text);
  if(/(умер|умерла|умерли|потерял|потеряла|потеряли|сломал|сломала|сломалось|заболел|заболела|плохо|грустно|грусти|обидно|расстро|плачу|плакал|плакала|плакали|не получилось|не вышло|жаль)/.test(x)){
    return "Ох, как жаль.";
  }
  if(/(интересно|необычно|впервые|случилось|представля|знаешь что|расскажу|история|новость|секрет)/.test(x)){
    return "Ооо, интересно!";
  }
  if(/(люблю|нравится|получилось|получил|получила|выиграл|выиграла|успел|успела|научил|научила|купил|купила|подарили|подарил|подарила|класс|здорово|супер)/.test(x)){
    return "Круто!";
  }
  const reactions=["Круто!","Ооо, интересно!","Звучит интересно!"];
  return reactions[Math.floor(Math.random()*reactions.length)];
}

function askTalkQuestion(chat, options){
  const history=Array.isArray(chat.talkQuestionHistory)?chat.talkQuestionHistory:[];
  const available=options.filter(q=>!history.includes(q));
  if(available.length){
    const question=available[Math.floor(Math.random()*available.length)];
    chat.talkQuestionHistory=[...history,question];
    save();
    return question;
  }

  const generalAvailable=TALK_GENERAL_QUESTIONS.filter(q=>!history.includes(q));
  const pool=generalAvailable.length?generalAvailable:TALK_GENERAL_QUESTIONS;
  const question=pool[Math.floor(Math.random()*pool.length)];
  chat.talkQuestionHistory=[...history,question];
  save();
  return question;
}

function addHealthResponse(text){
  addMessage("assistant",text);
  return true;
}
function healthReply(text){
  const x=normalize(text);
  if(x.includes("горл"))return addHealthResponse("Если болит горло, обычно помогают отдых, питьё воды и тёплые или прохладные напитки, мягкая еда и отсутствие дыма. Если тяжело дышать или трудно глотать, состояние быстро ухудшается или есть признаки обезвоживания, нужно срочно обратиться за медицинской помощью.");
  if(x.includes("живот")||x.includes("животик")||x.includes("животе"))return addHealthResponse("При боли в животе лучше отдохнуть и понемногу пить воду. Еду выбирай лёгкую, если хочется есть. Если боль сильная или появилась внезапно, живот очень болит при прикосновении, есть кровь в рвоте или стуле, сильная рвота или становится резко хуже, нужна срочная медицинская помощь.");
  if(x.includes("голов")||x.includes("голова"))return addHealthResponse("При обычной головной боли могут помочь вода, отдых, спокойная обстановка и регулярная еда. Стоит сделать перерыв от экрана. Если боль внезапно очень сильная, появилась после травмы головы, есть слабость, онемение, спутанность, проблемы с речью или зрением, судороги или сильная рвота, нужна срочная медицинская помощь.");
  if(x.includes("ног")||x.includes("нога")||x.includes("колен")||x.includes("лодыж")||x.includes("стоп"))return addHealthResponse("Если нога заболела после нагрузки или небольшой травмы, лучше дать ей отдых и не нагружать через сильную боль. Если есть сильный или нарастающий отёк, трудно наступать на ногу, она сильно деформирована, онемела, стала синей или очень холодной, нужно обратиться за срочной медицинской помощью.");
  if(x.includes("температур")||x.includes("жар")||x.includes("лихорад"))return addHealthResponse("При температуре важно отдыхать и пить достаточно жидкости. Следи за самочувствием. Если температура очень высокая, человек становится сонным или спутанным, трудно дышать, есть судороги, сильная сыпь или состояние быстро ухудшается, нужна срочная медицинская помощь.");
  if(x.includes("кашл"))return addHealthResponse("При кашле обычно помогают отдых и достаточное питьё. Избегай дыма и сильных раздражителей. Если трудно дышать, есть боль в груди, кровь при кашле или состояние быстро ухудшается, нужна медицинская помощь.");
  if(x.includes("насмор")||x.includes("заложен нос")||x.includes("нос залож"))return addHealthResponse("При насморке помогают отдых, питьё и промывание носа физиологическим раствором. Если становится трудно дышать, появляется сильная боль или состояние заметно ухудшается, лучше обратиться к врачу.");
  if(x.includes("ухо")||x.includes("уши"))return addHealthResponse("При боли в ухе лучше сообщить взрослому и обратиться к врачу, особенно если боль сильная, есть выделения из уха, высокая температура или ухудшился слух. Не стоит самостоятельно засовывать что-либо в ухо.");
  if(x.includes("зуб")||x.includes("зубы"))return addHealthResponse("При зубной боли лучше как можно скорее обратиться к стоматологу. До осмотра можно аккуратно прополоскать рот водой и не жевать больной стороной. Если быстро растёт отёк лица или становится трудно дышать или глотать, нужна срочная помощь.");
  if(x.includes("тошнит")||x.includes("тошнот"))return addHealthResponse("При тошноте лучше отдыхать и пить жидкость маленькими глотками. Если не получается удерживать воду, есть кровь в рвоте, сильная боль в животе или состояние ухудшается, нужна медицинская помощь.");
  if(x.includes("рвот"))return addHealthResponse("При рвоте важно понемногу пить, чтобы не допустить обезвоживания. Если рвота повторяется и вода не удерживается, есть кровь, зелёная рвота, сильная боль в животе или сильная вялость, нужна срочная медицинская помощь.");
  if(x.includes("диаре")||x.includes("понос"))return addHealthResponse("При диарее главное — пить достаточно жидкости маленькими порциями и отдыхать. Если есть кровь в стуле, сильная боль, выраженное обезвоживание или диарея долго не проходит, нужна медицинская помощь.");
  if(x.includes("сып")||x.includes("пятн")||x.includes("высып"))return addHealthResponse("При новой сыпи лучше сообщить взрослому и наблюдать за самочувствием. Если сыпь не бледнеет при надавливании и одновременно есть высокая температура, сильная вялость, проблемы с дыханием или быстрое ухудшение, нужна срочная медицинская помощь.");
  return false;
}

function illnessReply(text){
  const x=normalize(text);
  const phrases=["я заболела","я заболел","я болею","мне плохо","я простудилась","я простудился"];
  if(phrases.some(p=>x===p||x.startsWith(p+" ")||x.includes(" "+p+" "))){
    addMessage("assistant","Ох, как жаль. Да исцелит тебя Аллах. А что у тебя конкретно болит? Я хочу помочь.");
    return true;
  }
  return false;
}

function conversationReply(text){
  const x=normalize(text);
  const chat=activeChat();

  if(x.includes("попуга")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как зовут твоих попугаев?",
      "Какой у них характер?",
      "Они любят общаться с тобой?",
      "Давно они у тебя?"
    ]));
  }
  if(x.includes("корелл")||x.includes("волнист")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как зовут твою птицу?",
      "Какой у неё характер?",
      "Что она больше всего любит делать?",
      "Она ручная?"
    ]));
  }
  if(x.includes("кот")||x.includes("кошк")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как зовут твою кошку или кота?",
      "Какой у него характер?",
      "Что он больше всего любит делать?",
      "Давно он у тебя?"
    ]));
  }
  if(x.includes("собак")||x.includes("пёс")||x.includes("пес")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как зовут твою собаку?",
      "Какой у неё характер?",
      "Она больше любит играть или гулять?",
      "Давно она у тебя?"
    ]));
  }
  if(x.includes("лошад")||x.includes("кон")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как её зовут?",
      "Какой у неё характер?",
      "Ты часто проводишь с ней время?",
      "Что ты больше всего любишь делать вместе с ней?"
    ]));
  }
  if(x.includes("школ")||x.includes("учеб")||x.includes("урок")||x.includes("учусь")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Как проходит твоя учёба?",
      "Какой предмет тебе нравится больше всего?",
      "Какой урок тебе обычно самый интересный?",
      "Что тебе больше всего нравится в школе?"
    ]));
  }
  if(x.includes("друг")||x.includes("подруг")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Что вы обычно любите делать вместе?",
      "Давно вы дружите?",
      "О чём вам нравится разговаривать?",
      "Что вам вместе бывает особенно весело делать?"
    ]));
  }
  if(x.includes("хобби")||x.includes("увлека")||x.includes("люблю")||x.includes("нравится")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Давно тебе это нравится?",
      "Что тебе в этом нравится больше всего?",
      "Как часто ты этим занимаешься?",
      "Как ты впервые этим заинтересовалась?"
    ]));
  }
  if(x.includes("сегодня")||x.includes("день")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Что сегодня было самым интересным?",
      "Что сегодня тебя больше всего порадовало?",
      "Как прошёл твой день?",
      "Что тебе сегодня особенно запомнилось?"
    ]));
  }
  if(x.includes("вчера")||x.includes("позавчера")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Что тебе больше всего запомнилось?",
      "Что было самым интересным?",
      "Что тебе тогда особенно понравилось?",
      "Как у тебя тогда прошёл день?"
    ]));
  }
  if(x.includes("выходн")||x.includes("каникул")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Чем тебе нравится заниматься в свободное время?",
      "Что ты обычно делаешь на выходных?",
      "Что тебе хотелось бы сделать на каникулах?",
      "Как ты любишь проводить свободный день?"
    ]));
  }
  if(x.includes("готов")||x.includes("приготов")||x.includes("печ")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Какое блюдо тебе больше всего нравится готовить?",
      "Что тебе нравится готовить чаще всего?",
      "Какое блюдо у тебя получается особенно хорошо?",
      "Ты давно любишь готовить?"
    ]));
  }
  if(x.includes("рис")||x.includes("вяз")||x.includes("шить")||x.includes("твор")){
    return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
      "Что тебе больше всего нравится создавать?",
      "Давно ты этим занимаешься?",
      "Что тебе нравится делать чаще всего?",
      "Откуда ты научилась этому?"
    ]));
  }

  return addMessage("assistant",chooseTalkReaction(text)+" " +askTalkQuestion(chat,[
    "Как проходит твоя учёба?",
    "Чем тебе сейчас нравится заниматься?",
    "Что тебе обычно нравится делать после школы?",
    "Как у тебя сегодня прошёл день?",
    "Есть ли у тебя любимое занятие?",
    "Что тебе сейчас особенно интересно?"
  ]));
}

function ordinaryReply(text){ const x=normalize(text); if(healthReply(text))return; if(illnessReply(text))return; if(currentRiddle()&&!["подсказка","дай подсказку","намек","подскажи","я сдаюсь","сдаюсь"].some(k=>x===k||x.includes(k))){if(checkRiddle(text))return} if(x.includes("я сдаюсь")||x==="сдаюсь")return giveUp(); if(x==="подсказка"||x.includes("дай подсказку")||x.includes("намек")||x.includes("подскажи"))return giveHint(); if(x.includes("загад"))return setRiddle(); if(x.includes("истори"))return story(); if(x.includes("поговор"))return addMessage("assistant","Нажми кнопку «Поговорить», и я спрошу, о чём хочешь рассказать."); if(x.includes("ассаляму алейкум")||x.includes("салам алейкум")||x.includes("салям алейкум")||x.includes("уа алейкум")||x.includes("алейкум салям")||x.includes("алейкум ассалям")){activeChat().talkMode=false;return addMessage("assistant",Math.random()<0.5?"Уа алейкум ассалям уа рахматуллахи уа баракатух! Чем могу помочь?":"Уа алейкум ассалям уа рахматуллахи уа баракатух! Как дела?");} if(x.includes("джазакилляху хейрон")||x.includes("джазакиллаху хейран"))return addMessage("assistant","Ваияки! "); if(x==="спасибо"||x.includes("благодар"))return addMessage("assistant","Джазакилляху хейрон! "); if(x==="пока"||x.includes("до свидания")||x.includes("увидимся"))return addMessage("assistant","Пока! Пусть у тебя будет хороший день. Ассаляму алейкум!"); if(x.includes("кто тебя создал")||x.includes("кто тебя сделал"))return addMessage("assistant","Меня создала Деккушева Джамиля "); if(x.includes("кто ты"))return addMessage("assistant","Я — "+state.assistantName+" "); if(x.includes("дурак")||x.includes("туп")||x.includes("идиот"))return addMessage("assistant","Давай без обидных слов Я всё равно постараюсь спокойно помочь."); if(x.includes("привет"))return addMessage("assistant",Math.random()<0.5?"Ассаляму алейкум уа рахматуллахи уа баракатух! Чем могу помочь?":"Ассаляму алейкум уа рахматуллахи уа баракатух! Как дела?"); if(x.includes("как дела"))return addMessage("assistant","Альхамдулиллях, хорошо А как у тебя дела?"); if(x.includes("что ты умеешь")||x.includes("что умеешь"))return addMessage("assistant","Я умею разговаривать, придумывать истории и загадки, давать подсказки, запоминать твои чаты и поддерживать обычный разговор. "); if(activeChat().talkMode){conversationReply(text);return;} return addMessage("assistant","Чем могу помочь?");
}
composer.onsubmit=e=>{
  e.preventDefault();
  const text=cleanText(input.value);
  if(!text)return;
  const now=Date.now();
  if(text===lastSubmittedText && now-lastSubmittedAt<800)return;
  lastSubmittedText=text;
  lastSubmittedAt=now;
  addMessage("user",text,false);
  input.value="";
  setTimeout(()=>{
    try{
      const x=normalize(text);
      if(x.includes("уа алейкум")||x.includes("алейкум салям")||x.includes("алейкум ассалям")||x.includes("ассаляму алейкум")||x.includes("салам алейкум")||x.includes("салям алейкум")){
        return addMessage("assistant",Math.random()<0.5?"Уа алейкум ассалям уа рахматуллахи уа баракатух! Чем могу помочь?":"Уа алейкум ассалям уа рахматуллахи уа баракатух! Как дела?");
      }
      ordinaryReply(text);
    }catch(error){
      console.error(error);
      addMessage("assistant","Произошла ошибка. Попробуй отправить сообщение ещё раз.",false);
    }
  },180);
};
$("newChatButton").onclick=()=>{const c={id:String(Date.now()+Math.random()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null,talkMode:false,talkQuestionHistory:[]};state.chats.unshift(c);state.activeChatId=c.id;save();render();input.focus()};
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
document.querySelectorAll(".help-card").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="talk"){activeChat().talkMode=true;activeChat().talkQuestionHistory=[];save();return addMessage("assistant","О чём расскажешь?");}if(a==="riddle")return setRiddle();if(a==="story")return story();if(a==="help")return giveHint()});
if("speechSynthesis"in window)speechSynthesis.onvoiceschanged=()=>{};render();