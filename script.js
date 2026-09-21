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
const defaultState={chats:[{id:String(Date.now()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null,riddleHistory:[],talkMode:false,talkQuestionHistory:[],learningQuestion:null}],activeChatId:null,assistantName:"Comfortable AI",backgroundType:"preset",backgroundValue:DEFAULT_BG,voiceEnabled:false,voiceType:"female",learnedAnswers:[]};
let savedData=null;
try{
  savedData=localStorage.getItem(STORAGE_KEY)||localStorage.getItem("comfortable-ai-v3")||localStorage.getItem("comfortable-ai-v1")||localStorage.getItem("comfortable-ai");
}catch(error){
  console.warn("Не удалось прочитать сохранённые данные:",error);
}
let parsedState=null;
try{
  parsedState=savedData?JSON.parse(savedData):null;
}catch(error){
  console.warn("Сохранённые данные повреждены. Создаю новый чат:",error);
}
let state=migrateState(parsedState)||defaultState;
if(!state.chats.length)state.chats=[...defaultState.chats];
if(!state.activeChatId||!state.chats.some(c=>c.id===state.activeChatId))state.activeChatId=state.chats[0].id;
state.learnedAnswers=Array.isArray(state.learnedAnswers)?state.learnedAnswers.filter(item=>item&&typeof item.question==="string"&&typeof item.answer==="string"):[];
state.chats.forEach(c=>{
  c.pinned=!!c.pinned;
  c.learningQuestion=typeof c.learningQuestion==="string"?c.learningQuestion:null;
  const history=Array.isArray(c.riddleHistory)?c.riddleHistory:[];
  const fromMessages=riddles.map((r,i)=>({i,q:normalize(r.q)}))
    .filter(item=>Array.isArray(c.messages)&&c.messages.some(m=>Array.isArray(m)&&m[0]==="assistant"&&normalize(m[1]).includes(item.q)))
    .map(item=>item.i);
  c.talkMode=false;
  c.riddleHistory=[...new Set([...history,...fromMessages,...((c.riddle&&Number.isInteger(c.riddle.index))?[c.riddle.index]:[])])];
});

state.assistantName=cleanText(state.assistantName);
state.chats.forEach(chat=>{
  chat.name=cleanText(chat.name||"Новый чат")||"Новый чат";
  chat.messages=(Array.isArray(chat.messages)?chat.messages:[])
    .map(([role,text])=>[role==="user"?"user":"assistant",repairSavedMessageText(text)])
    .filter(([,text])=>text&&text!=="undefined");
});
save();
const $=id=>document.getElementById(id),chatList=$("chatList"),messages=$("messages"),chatTitle=$("chatTitle"),input=$("messageInput"),composer=$("composer"),backgroundInput=$("backgroundInput");
const chatSearchInput=$("chatSearchInput"),clearChatSearch=$("clearChatSearch");
chatSearchInput.oninput=()=>render();
loadSharedKnowledge();
clearChatSearch.onclick=()=>{chatSearchInput.value="";render();chatSearchInput.focus()};

const SHARED_KNOWLEDGE_URL="./knowledge.json";
const LEARNING_ENDPOINT="";
let sharedKnowledge=[];
async function loadSharedKnowledge(){
  try{
    const response=await fetch(SHARED_KNOWLEDGE_URL,{cache:"no-store"});
    if(!response.ok)return;
    const data=await response.json();
    sharedKnowledge=Array.isArray(data?.entries)?data.entries.filter(item=>item&&typeof item.question==="string"&&typeof item.answer==="string"):Array.isArray(data)?data:[];
  }catch(error){
    console.warn("Общая база знаний пока недоступна:",error);
  }
}
function normalizeLearnedQuestion(text){
  return normalize(cleanText(text)).replace(/[?!.]+$/g,"").trim();
}
function findLearnedAnswer(text){
  const target=normalizeLearnedQuestion(text);
  if(!target)return null;
  const pool=[...sharedKnowledge,...(Array.isArray(state.learnedAnswers)?state.learnedAnswers:[])];
  const exact=pool.find(item=>normalizeLearnedQuestion(item.question)===target);
  if(exact)return exact.answer;
  const similar=pool.find(item=>typoMatch(target,[normalizeLearnedQuestion(item.question)],1));
  return similar?similar.answer:null;
}
function rememberLearnedAnswer(question,answer){
  const q=cleanText(question);
  const a=cleanText(answer);
  if(!q||!a)return false;
  const normalizedQuestion=normalizeLearnedQuestion(q);
  state.learnedAnswers=Array.isArray(state.learnedAnswers)?state.learnedAnswers:[];
  const existing=state.learnedAnswers.find(item=>normalizeLearnedQuestion(item.question)===normalizedQuestion);
  const item={question:q,answer:a,learnedAt:new Date().toISOString()};
  if(existing)Object.assign(existing,item);else state.learnedAnswers.push(item);
  save();
  syncLearnedAnswer(q,a);
  return true;
}
function requestLearning(question){
  const chat=activeChat();
  chat.learningQuestion=cleanText(question);
  save();
  return addMessage("assistant","Я не знаю ответ на ваш вопрос. Можете подсказать мне, что это означает? Я запомню ответ.");
}
function cancelLearning(){
  const chat=activeChat();
  chat.learningQuestion=null;
  save();
  return addMessage("assistant","Хорошо, не буду запоминать этот вопрос.");
}
function handleLearningAnswer(text){
  const chat=activeChat();
  let question=chat.learningQuestion;
  if(!question){
    const messages=Array.isArray(chat.messages)?chat.messages:[];
    const lastAssistant=[...messages].reverse().find(item=>Array.isArray(item)&&item[0]==="assistant");
    const lastUserIndex=[...messages].map((item,index)=>({item,index})).reverse().find(item=>Array.isArray(item.item)&&item.item[0]==="user")?.index;
    const lastAssistantIndex=[...messages].map((item,index)=>({item,index})).reverse().find(item=>Array.isArray(item.item)&&item.item[0]==="assistant")?.index;
    if(lastAssistant&&String(lastAssistant[1]).startsWith("Я не знаю ответ на ваш вопрос.")&&
       (lastAssistantIndex===undefined||lastUserIndex===undefined||lastAssistantIndex>lastUserIndex)){
      question="(вопрос из предыдущего сообщения)";
    }
  }
  if(!question)return false;
  const x=normalize(text);
  if(x==="отмена"||x==="не хочу"||x==="не знаю")return cancelLearning();
  if(text.trim().length<2)return addMessage("assistant","Напиши ответ чуть подробнее, чтобы я смогла его запомнить.");
  if(question==="(вопрос из предыдущего сообщения)"){
    const messages=Array.isArray(chat.messages)?chat.messages:[];
    const previousUser=[...messages].reverse().find(item=>Array.isArray(item)&&item[0]==="user");
    question=previousUser?String(previousUser[1]):question;
  }
  chat.learningQuestion=null;
  rememberLearnedAnswer(question,text);
  addMessage("assistant","Спасибо! Я запомнила этот ответ и буду использовать его в следующий раз.");
  return true;
}
async function syncLearnedAnswer(question,answer){
  if(!LEARNING_ENDPOINT)return;
  try{
    await fetch(LEARNING_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question,answer})});
  }catch(error){
    console.warn("Не удалось отправить новое знание в общую базу:",error);
  }
}
function calculateSimpleExpression(text){
  const raw=cleanText(text).replace(/^(сколько будет|посчитай|вычисли|реши)\s*/i,"").trim();
  if(!raw||raw.length>90)return null;
  if(!/^[0-9+\-*/().,%\s^]+$/.test(raw))return null;
  const normalized=raw.replace(/,/g,".").replace(/(\d+(?:\.\d+)?)\s*%/g,"($1/100)").replace(/\^/g,"**");
  if(!/^[0-9+\-*/().\s*]+$/.test(normalized))return null;
  try{
    const result=Function('"use strict"; return ('+normalized+');')();
    if(typeof result!=="number"||!Number.isFinite(result))return null;
    return Number.isInteger(result)?String(result):String(Number(result.toFixed(10)));
  }catch(error){return null;}
}

function localAnswer(text){
  const x=normalize(text);
  const learned=findLearnedAnswer(text);
  if(learned)return learned;
  const calc=calculateSimpleExpression(text);
  if(calc!==null)return "Ответ: "+calc;
  if(x.includes("какая сегодня дата")||x.includes("какое сегодня число")||x.includes("какой сегодня день")){
    return "Сегодня "+new Intl.DateTimeFormat("ru-RU",{day:"numeric",month:"long",year:"numeric"}).format(new Date())+".";
  }
  if(x.includes("сколько времени")||x.includes("который час")){
    return "Сейчас "+new Intl.DateTimeFormat("ru-RU",{hour:"2-digit",minute:"2-digit"}).format(new Date())+".";
  }

  const rules=[
    [["что такое биология"],"Биология — это наука о живых организмах. Она изучает их строение, работу, развитие, происхождение и взаимодействие с окружающей средой."],
    [["что такое физика"],"Физика — наука о природе, материи, движении, энергии, силах и законах, по которым работает окружающий мир."],
    [["что такое химия"],"Химия — наука о веществах: из чего они состоят, какими свойствами обладают и как превращаются друг в друга."],
    [["что такое география"],"География изучает Землю, её природу, страны, население и связи между людьми и окружающей средой."],
    [["что такое математика"],"Математика изучает числа, величины, формы, закономерности и точные способы рассуждения."],
    [["что такое история"],"История изучает события и процессы прошлого людей и обществ, опираясь на сохранившиеся источники."],
    [["что такое программирование"],"Программирование — это создание инструкций для компьютера с помощью языков программирования."],
    [["что такое интернет"],"Интернет — глобальная сеть, соединяющая устройства и позволяющая им обмениваться данными."],
    [["что такое искусственный интеллект","что такое ии"],"Искусственный интеллект — это программы и системы, которые выполняют задачи, связанные с анализом информации, поиском закономерностей и созданием результатов."],
    [["что такое солнце"],"Солнце — звезда в центре Солнечной системы. Земля и другие планеты обращаются вокруг него."],
    [["что такое луна"],"Луна — естественный спутник Земли. Она обращается вокруг нашей планеты и отражает свет Солнца."],
    [["почему небо голубое"],"Небо кажется голубым из-за рассеяния солнечного света в атмосфере. Синие составляющие света рассеиваются сильнее красных."],
    [["почему идет дождь","почему идёт дождь"],"Вода испаряется, поднимается в атмосферу, охлаждается и образует капли в облаках. Когда капли становятся достаточно тяжёлыми, выпадает дождь."],
    [["что такое гравитация"],"Гравитация — это взаимодействие, из-за которого тела притягиваются друг к другу. Притяжение Земли удерживает нас на её поверхности."],
    [["что такое атом"],"Атом — очень маленькая частица вещества, состоящая из ядра и электронов."],
    [["что такое молекула"],"Молекула — частица вещества, состоящая из двух или нескольких связанных атомов."],
    [["кто такой альберт эйнштейн"],"Альберт Эйнштейн — физик XX века, создатель теории относительности и один из самых известных учёных своего времени."],
    [["кто такой александр пушкин","кто такой пушкин"],"Александр Пушкин — русский поэт и писатель XIX века, один из основоположников современной русской литературы."],
    [["что такое javascript"],"JavaScript — язык программирования, который часто используется для создания интерактивных веб-страниц и приложений."],
    [["что такое html"],"HTML — язык разметки, который описывает структуру веб-страницы."],
    [["что такое css"],"CSS отвечает за внешний вид веб-страницы: цвета, размеры, расположение элементов, шрифты и многое другое."],
    [["как тебя зовут"],()=> "Меня зовут "+state.assistantName+"."],
    [["кто тебя создал","кто тебя сделал"],"Меня создала Деккушева Джамиля."],
    [["что ты умеешь","что умеешь"],"Я умею отвечать на заранее подготовленные вопросы, поддерживать разговор по темам, загадывать загадки, давать подсказки, придумывать истории и запоминать чаты."],
    [["помоги с английским","учить английский","изучать английский"],"Конечно. Напиши английскую фразу или слово, и я разберу его по заранее подготовленным правилам."],
    [["помоги с арабским","учить арабский","изучать арабский"],"Конечно. Напиши арабское слово или предложение, которое хочешь разобрать."],
    [["как дела"],"Альхамдулиллях, хорошо. А как у тебя дела?"],
    [["хорошо","отлично","класс"],"Рада это слышать. Рассказывай, что ещё произошло."],
    [["мне грустно","грустно"],"Мне жаль, что тебе грустно. Расскажи, что случилось, и я постараюсь поддержать тебя."],
    [["мне скучно","скучно"],"Давай придумаем что-нибудь интересное: загадку, историю или тему для разговора."],
    [["что такое комфортный ии","что такое comfortable ai"],"Comfortable AI — это уютный помощник, который работает прямо в браузере и использует заранее подготовленные правила ответов."]
  ];
  for(const [patterns,response] of rules){
    if(patterns.some(p=>x===p||x.includes(p))){
      return typeof response==="function"?response():response;
    }
  }
  if(x.includes("переведи ")||x.startsWith("перевод ")){
    return "Я могу отвечать на заранее подготовленные переводы. Напиши короткую фразу и укажи направление перевода.";
  }
  if(x.includes("реши задачу")||x.includes("помоги решить")||x.includes("задача")){
    return "Напиши условие задачи полностью. Простые вычисления я умею решать сразу.";
  }
  return null;
}

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
function repairSavedMessageText(text){
  const value=cleanText(text);
  if(!value)return "";
  if((value.startsWith("[")&&value.endsWith("]"))){
    try{
      const parsed=JSON.parse(value);
      if(Array.isArray(parsed)&&parsed.every(item=>typeof item==="string")){
        return cleanText(parsed.find(item=>item.trim())||"");
      }
    }catch(error){}
  }
  return value;
}
function migrateState(old){
  if(!old||!Array.isArray(old.chats))return null;
  const chats=old.chats.filter(c=>c&&typeof c==="object").map(c=>({
    id:String(c.id??Date.now()+Math.random()),
    name:cleanText(c.name||"Новый чат")||"Новый чат",
    messages:Array.isArray(c.messages)?c.messages.map(m=>{
      const pair=Array.isArray(m)?m:[m?.role||"assistant",m?.text||""];
      return [pair[0]==="user"?"user":"assistant",repairSavedMessageText(pair[1])];
    }).filter(m=>m[1]):[],
    riddle:c.riddle&&typeof c.riddle==="object"?c.riddle:null,
    riddleHistory:Array.isArray(c.riddleHistory)?c.riddleHistory.filter(i=>Number.isInteger(i)):[],
    talkMode:false,
    talkQuestionHistory:Array.isArray(c.talkQuestionHistory)?c.talkQuestionHistory.filter(q=>typeof q==="string"):[],
    pinned:!!c.pinned,
    learningQuestion:typeof c.learningQuestion==="string"?c.learningQuestion:null,
  }));
  return {
    ...defaultState,
    assistantName:cleanText(old.assistantName||defaultState.assistantName)||defaultState.assistantName,
    chats:chats.length?chats:defaultState.chats,
    activeChatId:String(old.activeChatId??chats[0]?.id??defaultState.chats[0].id),
    backgroundType:old.backgroundType==="image"?"image":"preset",
    backgroundValue:old.backgroundValue||defaultState.backgroundValue,
    voiceEnabled:!!old.voiceEnabled,
    voiceType:["female","male","child"].includes(old.voiceType)?old.voiceType:defaultState.voiceType,
    learnedAnswers:Array.isArray(old.learnedAnswers)?old.learnedAnswers.filter(item=>item&&typeof item.question==="string"&&typeof item.answer==="string"):[]
  };
}
function save(){
  try{
    state.chats.forEach(c=>{
      c.name=cleanText(c.name||"Новый чат")||"Новый чат";
      c.messages=(Array.isArray(c.messages)?c.messages:[])
        .map(([role,text])=>[role==="user"?"user":"assistant",repairSavedMessageText(text)])
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
      .map(([role,text])=>[role==="user"?"user":"assistant",repairSavedMessageText(text)])
      .filter(([,text])=>text);
  });
  save();
  chatTitle.textContent=chat.name;
  chatList.innerHTML="";
  const searchQuery=normalize(chatSearchInput?.value||"");
  const visibleChats=state.chats.filter(item=>{
    if(!searchQuery)return true;
    const haystack=normalize(item.name+" "+(Array.isArray(item.messages)?item.messages.map(m=>Array.isArray(m)?m[1]:"").join(" "):""));
    return haystack.includes(searchQuery);
  });
  const orderedChats=[...state.chats].sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
  orderedChats.forEach(item=>{
    const row=document.createElement("div");
    row.className="chat-row"+(item.id===state.activeChatId?" active":"");

    const b=document.createElement("button");
    b.className="chat-item";
    b.textContent=item.name;
    b.onclick=()=>{state.activeChatId=item.id;save();render()};

    const actions=document.createElement("div");
    actions.className="chat-actions";

    const pin=document.createElement("button");
    pin.className="chat-action pin";
    pin.type="button";
    pin.textContent=item.pinned?"Открепить":"Закрепить";
    pin.title=item.pinned?"Открепить чат":"Закрепить чат";
    pin.onclick=(e)=>{e.stopPropagation();item.pinned=!item.pinned;save();render()};



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
          riddleHistory:[],
          talkMode:false,
          talkQuestionHistory:[],
          pinned:false,
          learningQuestion:null
        });
      }
      if(!state.chats.some(c=>c.id===state.activeChatId)){
        state.activeChatId=state.chats[0].id;
      }
      save();
      render();
    };

    actions.appendChild(pin);
    actions.appendChild(rename);
    actions.appendChild(remove);
    row.appendChild(b);
    row.appendChild(actions);
    if(visibleChats.includes(item))chatList.appendChild(row);
  });
  if(!visibleChats.length){
    const empty=document.createElement("div");
    empty.className="chat-search-empty";
    empty.textContent=searchQuery?"Ничего не найдено":"Нет чатов";
    chatList.appendChild(empty);
  }
  messages.innerHTML="";
  chat.messages.forEach(([role,text])=>{
    const d=document.createElement("div");
    d.className="msg "+role;
    d.textContent=repairSavedMessageText(text);
    messages.appendChild(d);
  });
  messages.scrollTop=messages.scrollHeight;
  applyBackground();
  $("voiceEnabled").checked=!!state.voiceEnabled;
}
function applyBackground(){ if(state.backgroundType==="image"){document.body.style.backgroundImage="url(\""+state.backgroundValue+"\")";document.body.style.backgroundColor="#f4f0ff"} else document.body.style.backgroundImage=backgroundPresets[state.backgroundValue]||backgroundPresets[DEFAULT_BG];
}
function addMessage(role,text,speak=true){text=role==="assistant"?repairSavedMessageText(text):cleanText(text);const chat=activeChat();const last=chat.messages[chat.messages.length-1];if(role==="assistant"&&last&&last[0]==="assistant"&&last[1]===text)return;chat.messages.push([role,text]);save();render();if(role==="assistant"&&speak)speakText(text)}
function normalize(text){return text.toLowerCase().replace(/ё/g,"е").trim()}
function editDistance(a,b){
  const prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
    const cur=[i];
    cur[0]=i;
    for(let j=1;j<=b.length;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+cost);
    }
    for(let j=0;j<cur.length;j++)prev[j]=cur[j];
  }
  return prev[b.length];
}
function typoMatch(text,words,maxDistance=1){
  const value=normalize(text);
  const tokens=value.split(/[^a-zа-я0-9]+/).filter(Boolean);
  return words.some(word=>{
    const target=normalize(word);
    return tokens.some(token=>{
      if(token===target)return true;
      if(target.length<5||token.length<target.length-1||token.length>target.length+1)return false;
      return editDistance(token,target)<=maxDistance;
    });
  });
}

function setRiddle(){
  const chat=activeChat();
  if(chat.riddle&&chat.riddle.stage==="active"){
    return addMessage("assistant","У тебя уже есть активная загадка. Попробуй ответить, попроси подсказку или нажми «Я сдаюсь».");
  }

  let history=Array.isArray(chat.riddleHistory)?chat.riddleHistory.filter(i=>Number.isInteger(i)&&i>=0&&i<riddles.length):[];
  const previous=chat.riddle&&Number.isInteger(chat.riddle.index)?chat.riddle.index:null;
  let available=riddles.map((_,i)=>i).filter(i=>!history.includes(i));

  if(!available.length){
    history=[];
    available=riddles.map((_,i)=>i);
  }

  if(previous!==null&&available.length>1){
    available=available.filter(i=>i!==previous);
  }

  const index=available[Math.floor(Math.random()*available.length)];
  chat.riddleHistory=[...history,index];
  chat.riddle={index:index,stage:"active",hintCount:0};
  save();
  addMessage("assistant"," "+riddles[index].q);
}
function currentRiddle(){const stateRiddle=activeChat().riddle;if(!stateRiddle||stateRiddle.stage!=="active")return null;const base=riddles[stateRiddle.index];if(!base)return null;return {...base,index:stateRiddle.index,stage:stateRiddle.stage,hintCount:Number.isFinite(stateRiddle.hintCount)?stateRiddle.hintCount:0}}
function checkRiddle(text){const r=currentRiddle();if(!r)return false;const answer=normalize(text);if(r.a.some(x=>answer===normalize(x)||answer.includes(normalize(x)))){activeChat().riddle.stage="solved";save();addMessage("assistant","Да! Правильный ответ!");return true}addMessage("assistant","Нет Попробуй ещё раз или напиши «Подсказка».");return true}
function giveHint(){
  const chat=activeChat();
  const r=currentRiddle();
  if(!r)return addMessage("assistant","Сначала нажми «Загадка», и я загадаю её.");
  const hintCount=Number.isFinite(chat.riddle.hintCount)?chat.riddle.hintCount:0;
  if(hintCount>=r.h.length){
    return addMessage("assistant","Это уже все подсказки. Попробуй ответить или нажми «Я сдаюсь».");
  }
  chat.riddle.hintCount=hintCount+1;
  save();
  return addMessage("assistant",r.h[hintCount]);
}
function giveUp(){const r=currentRiddle();if(!r){addMessage("assistant","Сейчас нет активной загадки ");return}activeChat().riddle.stage="solved";save();addMessage("assistant"," Ответ: "+r.a[0]+". Ничего страшного! Хочешь ещё одну загадку?")}
function story(){
  const stories=[
    `Однажды вечером девочка по имени Лея возвращалась домой через старый парк. День уже закончился, фонари тихо светились вдоль дорожки, а над деревьями медленно появлялись первые звёзды. Вдруг возле старой скамейки она заметила маленький серебряный ключ.

Она подняла его и увидела, что на ручке ключа вырезано облако. Рядом на траве лежала крошечная записка: «Если найдёшь дверь, которую никто не замечает, не бойся её открыть».

Лея решила посмотреть внимательнее. За кустами она обнаружила в стене парка маленькую дверцу, которой раньше никогда не видела. Ключ подошёл идеально.

За дверью оказался не шкаф и не комната, а огромная светящаяся библиотека. Стеллажи тянулись так высоко, что их верхушки исчезали в мягких облаках. Книги там летали по воздуху, сами находили свои полки и иногда тихонько перелистывались.

Навстречу Лее приплыло маленькое облако в синем шарфике.

— Наконец-то кто-то пришёл, — сказало оно. — Нам очень нужна помощь.

Оказалось, что в библиотеке пропала Книга Пяти Дорог. Она показывала каждому путнику путь к тому месту, куда он действительно хотел попасть. Без неё облачные библиотекари не могли вернуть домой маленькое облачко, которое случайно залетело слишком далеко.

Лея отправилась на поиски. Сначала она прошла по Залу Тихих Ветров, где книги шептались о дальних странах. Потом попала в комнату, где потолок был похож на ночное небо, а звёзды медленно двигались по своим местам.

Наконец она услышала музыку. В самом конце коридора стояла маленькая книжная башня. На верхней полке лежала Книга Пяти Дорог.

Но взять её было непросто. Между Леей и полкой стояла огромная куча книг. Девочка заметила, что каждая книга носит своё название, и начала раскладывать их по порядку: сначала книги о доброте, потом о смелости, затем о дружбе, знаниях и терпении.

Когда последняя книга встала на место, башня засветилась. Книга Пяти Дорог сама спустилась с полки.

Лея принесла её облачным библиотекарям. Маленькое облачко открыло страницу, и на ней появилась светящаяся дорожка, уходящая прямо к его дому.

— Ты спасла нас, — сказало облако.

Лея улыбнулась.

Перед тем как уйти, она спросила:

— А дверь снова откроется?

Облако тихонько засмеялось.

— Она открывается не для каждого. Но иногда она появляется там, где кто-то готов помочь другому.

Лея вернулась в парк. За спиной дверца исчезла, будто её никогда не было. Только серебряный ключ остался у неё в ладони.

На следующий вечер Лея снова пришла к той же скамейке. Серебряный ключ неожиданно стал тёплым. В воздухе появились маленькие светящиеся точки, а листья на деревьях зашептались, словно вспоминали старую тайну.

Перед девочкой возникла крошечная карта. На ней были нарисованы три места: библиотека, сад, в котором росли звёзды, и озеро, где отражалось небо даже днём.

Лея поняла, что библиотека была только началом.

Она снова открыла дверь и прошла по новому коридору. Там книги уже не стояли на полках — они летали вокруг неё и рассказывали истории о путешественниках, которые когда-то нашли смелость помочь кому-то другому.

В саду звёзд Лея увидела маленький росток. На нём должна была появиться новая звезда, но росток никак не хотел распускаться. Лея не стала торопить его. Она просто осталась рядом, полила землю водой и дождалась утра.

С первыми лучами света цветок раскрылся. На нём появилась маленькая серебряная звёздочка.

Тогда Лея поняла одну важную вещь: некоторые чудеса происходят не потому, что кто-то умеет колдовать, а потому, что кто-то умеет ждать, помогать и заботиться.

С тех пор каждый раз, когда Лея видела особенно яркую звезду, она улыбалась и вспоминала библиотеку. А где-то далеко среди облаков маленькие библиотекари уже готовили для неё новую книгу.

На обложке будущей книги было написано одно слово: «Доброта».

И Лея знала, что это только следующая глава её волшебного путешествия.`,
    
    `В одном очень далёком лесу стоял дом, которого не было ни на одной карте. Его стены были покрыты плющом, окна светились тёплым золотым светом, а возле двери росло дерево с листьями всех оттенков зелёного.

Однажды утром девочка Мира нашла возле этого дерева маленькую деревянную коробочку. Внутри лежал компас, но вместо стрелки в нём плавал крошечный светящийся огонёк.

Компас повёл Миру в самую глубину леса.

По дороге она встретила белого зайца, который умел читать, говорящего ворона, который собирал красивые пуговицы, и старый мост, который каждый раз перестраивался на новое место.

Наконец Мира пришла к озеру. В центре озера стоял остров, а на острове — высокая башня.

Дверь башни открылась сама.

Внутри было много комнат. В одной комнате хранились звуки дождя. В другой — запах свежего хлеба. В третьей на полках стояли маленькие стеклянные баночки, внутри которых мерцали воспоминания о счастливых днях.

На самом верхнем этаже Мира увидела огромные часы.

Они остановились.

Рядом лежала записка: «Часы этого леса не считают время. Они помогают каждому дню не потерять своё самое важное мгновение».

Мира подумала и вспомнила, что утром её маленький брат очень хотел показать ей бумажный кораблик, который он сделал своими руками. Она поспешила отказываться, потому что хотела идти дальше, но потом всё-таки остановилась и посмотрела на кораблик.

Именно это воспоминание и оказалось потерянным мгновением.

Мира положила его рядом с часами.

Стрелки снова начали двигаться.

Башня засветилась, лес зашумел листвой, а на озере появились сотни маленьких светящихся дорожек.

Когда Мира вернулась домой, прошло всего несколько минут.

Но в её кармане лежал маленький лист дерева с острова.

Она сохранила его на память.

И с тех пор старалась внимательнее замечать хорошие маленькие моменты, которые иногда кажутся обычными, но потом становятся самыми дорогими воспоминаниями.

Через несколько недель Мира снова нашла деревянную коробочку. В этот раз внутри лежал не компас, а тонкая серебряная лента.

Она привела её к другому концу леса, где стояла старая оранжерея. Стёкла сияли мягким голубым светом, а внутри росли растения, которых Мира никогда прежде не видела.

У одного дерева листья меняли цвет в зависимости от того, какое настроение было у человека рядом. У другого на ветках появлялись крошечные бумажные фонарики.

В самом центре оранжереи стоял маленький фонтан. Вода в нём светилась, но не била вверх — она плавно поднималась в воздух и превращалась в маленькие облака.

Однажды Мира заметила, что одно облако никак не может найти дорогу обратно к потолку оранжереи. Она помогла ему, поставив рядом несколько маленьких камней, по которым можно было перейти от фонтана к окну.

Облако поднялось выше и осветило весь зал.

На стене появилась надпись: «Самые настоящие чудеса становятся ярче, когда ими делятся».

Мира улыбнулась.

Она поняла, что волшебный лес хранит не столько тайны, сколько напоминания о простых вещах: заботе, терпении, внимательности и умении замечать красоту вокруг.

Когда она вернулась домой, серебряная лента исчезла.

Но на её ладони остался маленький светящийся лист.

И иногда, когда Мира помогала кому-то или просто останавливалась, чтобы внимательно посмотреть на мир вокруг, лист становился немного ярче.

Она никому не рассказывала обо всём лесу.

Не потому, что хотела сохранить тайну, а потому, что знала: самые добрые чудеса не всегда нужно объяснять. Иногда достаточно просто сделать что-то хорошее, и тогда обычный день сам становится немного волшебным.`
  ];

  addMessage("assistant",stories[Math.floor(Math.random()*stories.length)]);
}
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
  if(/(^|\\s)живот(?:ик)?(?:е|а|ом|у)?(?=$|\\s|[?!.,])/i.test(x))return addHealthResponse("При боли в животе лучше отдохнуть и понемногу пить воду. Еду выбирай лёгкую, если хочется есть. Если боль сильная или появилась внезапно, живот очень болит при прикосновении, есть кровь в рвоте или стуле, сильная рвота или становится резко хуже, нужна срочная медицинская помощь.");
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

  const answer=localAnswer(text);
  if(answer)return addMessage("assistant",answer);
  return requestLearning(text);
}

function ordinaryReply(text){ const x=normalize(text); if(handleLearningAnswer(text))return; if(healthReply(text))return; if(illnessReply(text))return; if(x.includes("я сдаюсь")||x==="сдаюсь")return giveUp(); if(x==="подсказка"||x.includes("дай подсказку")||x.includes("намек")||x.includes("подскажи"))return giveHint(); if(x.includes("загад"))return setRiddle(); if(x.includes("истори"))return story(); if(x.includes("поговор"))return addMessage("assistant","Нажми кнопку «Поговорить», и я спрошу, о чём хочешь рассказать."); if(currentRiddle()){if(checkRiddle(text))return;} if(x.includes("ассаляму алейкум")||x.includes("салам алейкум")||x.includes("салям алейкум")||x.includes("уа алейкум")||x.includes("алейкум салям")||x.includes("алейкум ассалям")){activeChat().talkMode=false;return addMessage("assistant",Math.random()<0.5?"Уа алейкум ассалям уа рахматуллахи уа баракатух! Чем могу помочь?":"Уа алейкум ассалям уа рахматуллахи уа баракатух! Как дела?");} if(x.includes("джазакилляху хейрон")||x.includes("джазакиллаху хейран"))return addMessage("assistant","Ваияки! "); if(x==="спасибо"||x.includes("благодар"))return addMessage("assistant","Джазакилляху хейрон! "); if(x==="пока"||x.includes("до свидания")||x.includes("увидимся")){activeChat().talkMode=false;save();return addMessage("assistant","Пока! Пусть у тебя будет хороший день. Ассаляму алейкум!");} if(x.includes("кто тебя создал")||x.includes("кто тебя сделал"))return addMessage("assistant","Меня создала Деккушева Джамиля "); if(x.includes("кто ты"))return addMessage("assistant","Я — "+state.assistantName+" "); if(typoMatch(text,["дурак","тупой","идиот"])||x.includes("туп"))return addMessage("assistant","Давай без обидных слов Я всё равно постараюсь спокойно помочь."); if(x.includes("привет")){activeChat().talkMode=false;save();return addMessage("assistant",Math.random()<0.5?"Ассаляму алейкум уа рахматуллахи уа баракатух! Чем могу помочь?":"Ассаляму алейкум уа рахматуллахи уа баракатух! Как дела?");} if(x.includes("как дела"))return addMessage("assistant","Альхамдулиллях, хорошо А как у тебя дела?"); if(x.includes("что ты умеешь")||x.includes("что умеешь"))return addMessage("assistant","Я умею разговаривать, придумывать истории и загадки, давать подсказки, запоминать твои чаты и поддерживать обычный разговор. В обычных сообщениях использует собственную систему заранее подготовленных ответов и правил."); if(handleLearningAnswer(text))return;
  if(activeChat().talkMode){conversationReply(text);return;}
  const answer=localAnswer(text);
  if(answer)return addMessage("assistant",answer);
  return requestLearning(text);
}
function submitMessage(rawText){
  const text=cleanText(rawText);
  if(!text)return;
  const now=Date.now();
  if(text===lastSubmittedText && now-lastSubmittedAt<800)return;
  lastSubmittedText=text;
  lastSubmittedAt=now;
  addMessage("user",text,false);
  input.value="";
  setTimeout(()=>{
    try{
      if(handleLearningAnswer(text))return;
      const x=normalize(text);
      if(x.includes("уа алейкум")||x.includes("алейкум салям")||x.includes("алейкум ассалям")||x.includes("ассаляму алейкум")||x.includes("салам алейкум")||x.includes("салям алейкум")){
        activeChat().talkMode=false;
        save();
        return addMessage("assistant",Math.random()<0.5?"Уа алейкум ассалям уа рахматуллахи уа баракатух! Чем могу помочь?":"Уа алейкум ассалям уа рахматуллахи уа баракатух! Как дела?");
      }
      ordinaryReply(text);
    }catch(error){
      console.error(error);
      addMessage("assistant","Произошла ошибка. Попробуй отправить сообщение ещё раз.",false);
    }
  },180);
}
composer.onsubmit=e=>{e.preventDefault();submitMessage(input.value)};$("newChatButton").onclick=()=>{const c={id:String(Date.now()+Math.random()),name:"Новый чат",messages:[["assistant","Ассаляму алейкум уа рахматуллахи уа баракатух! "]],riddle:null,riddleHistory:[],talkMode:false,talkQuestionHistory:[],pinned:false,learningQuestion:null};state.chats.unshift(c);state.activeChatId=c.id;save();render();input.focus()};
$("renameChatButton").onclick=()=>{const name=prompt("Название чата:",activeChat().name);if(name&&name.trim()){activeChat().name=name.trim();save();render()}};
$("nameButton").onclick=()=>{const name=prompt("Как назвать помощника?",state.assistantName);if(name&&name.trim()){state.assistantName=name.trim();save();render();addMessage("assistant","Теперь я буду называться "+state.assistantName+" ")}};
$("backgroundButton").onclick=()=>openModal("backgroundPanel");$("closeBackground").onclick=()=>closeModal("backgroundPanel");$("uploadBackground").onclick=()=>backgroundInput.click();$("resetBackground").onclick=()=>{state.backgroundType="preset";state.backgroundValue=DEFAULT_BG;save();render()};
backgroundInput.onchange=()=>{const file=backgroundInput.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const max=1500,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");ctx.drawImage(img,0,0,canvas.width,canvas.height);state.backgroundType="image";state.backgroundValue=canvas.toDataURL("image/jpeg",.78);save();render();closeModal("backgroundPanel")};img.src=reader.result};reader.readAsDataURL(file)};
document.querySelectorAll("[data-bg]").forEach(b=>b.onclick=()=>{state.backgroundType="preset";state.backgroundValue=b.dataset.bg;save();render()});
$("capabilitiesButton").onclick=()=>openModal("capabilitiesPanel");$("closeCapabilities").onclick=()=>closeModal("capabilitiesPanel");
$("settingsButton").onclick=openSettings;
$("closeSettings").onclick=()=>closeModal("settingsPanel");
$("settingsName").onclick=()=>{closeModal("settingsPanel");$("nameButton").click()};
$("settingsBackground").onclick=()=>{closeModal("settingsPanel");$("backgroundButton").click()};
$("settingsVoice").onclick=()=>{closeModal("settingsPanel");$("voiceButton").click()};
$("resetSettings").onclick=()=>{
  state.assistantName="Comfortable AI";
  state.backgroundType="preset";
  state.backgroundValue=DEFAULT_BG;
  state.voiceEnabled=false;
  state.voiceType="female";
  save();
  render();
  updateSettingsSummary();
};
$("voiceButton").onclick=()=>openModal("voicePanel");$("closeVoice").onclick=()=>closeModal("voicePanel");$("voiceEnabled").onchange=e=>{state.voiceEnabled=e.target.checked;save()};document.querySelectorAll("[data-voice]").forEach(b=>b.onclick=()=>{state.voiceType=b.dataset.voice;save()});$("testVoice").onclick=()=>speakText("Ассаляму алейкум! Я проверяю выбранный голос.");
function settingsBackgroundLabel(){
  if(state.backgroundType==="image")return "Своя картинка";
  const names={lavender:"Лавандовый",sunset:"Закат",ocean:"Океан",mint:"Мятный",pink:"Розовый",sky:"Небесный"};
  return names[state.backgroundValue]||"Лавандовый";
}
function settingsVoiceLabel(){
  if(!state.voiceEnabled)return "Выключена";
  const names={female:"Женский",male:"Мужской",child:"Детский"};
  return "Включена, "+(names[state.voiceType]||"Женский").toLowerCase();
}
function updateSettingsSummary(){
  const nameValue=$("settingsNameValue"), backgroundValue=$("settingsBackgroundValue"), voiceValue=$("settingsVoiceValue");
  if(nameValue)nameValue.textContent=state.assistantName||"Comfortable AI";
  if(backgroundValue)backgroundValue.textContent=settingsBackgroundLabel();
  if(voiceValue)voiceValue.textContent=settingsVoiceLabel();
}
function openSettings(){
  updateSettingsSummary();
  openModal("settingsPanel");
}
function openModal(id){$(id).classList.remove("hidden");$(id).setAttribute("aria-hidden","false")}function closeModal(id){$(id).classList.add("hidden");$(id).setAttribute("aria-hidden","true")}
function chooseVoice(){if(!("speechSynthesis"in window))return null;const voices=speechSynthesis.getVoices()||[],ru=voices.filter(v=>v.lang.toLowerCase().startsWith("ru"));if(!ru.length)return null;const words=state.voiceType==="female"?["female","woman","milena","alena","svetlana","irina","katya","yelena"]:state.voiceType==="male"?["male","man","pavel","alexander","dmitry","yuri"]:["child","kid","girl","boy","junior"];return ru.find(v=>words.some(w=>v.name.toLowerCase().includes(w)))||ru[0]}
function speakText(text){if(!state.voiceEnabled||!("speechSynthesis"in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="ru-RU";u.rate=state.voiceType==="child"?1.08:.96;u.pitch=state.voiceType==="female"?1.05:state.voiceType==="child"?1.3:.88;u.volume=1;const voice=chooseVoice();if(voice)u.voice=voice;speechSynthesis.speak(u)}
document.querySelectorAll(".quick-actions button").forEach(b=>{b.type="button";b.onclick=()=>submitMessage(b.dataset.text)});
document.querySelectorAll(".help-card").forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==="talk"){activeChat().talkMode=true;activeChat().talkQuestionHistory=[];save();return addMessage("assistant","О чём расскажешь?");}if(a==="riddle")return setRiddle();if(a==="story")return story();if(a==="help")return giveHint()});
if("speechSynthesis"in window)speechSynthesis.onvoiceschanged=()=>{};
render();
