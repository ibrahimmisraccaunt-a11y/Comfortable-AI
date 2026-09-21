const REPO_OWNER="ibrahimmisraccaunt-a11y";
const REPO_NAME="Comfortable-AI";
const BRANCH="main";
const KNOWLEDGE_PATH="knowledge.json";
const ALLOWED_ORIGIN="https://ibrahimmisraccaunt-a11y.github.io";

function corsHeaders(origin){
  const allowed=origin===ALLOWED_ORIGIN?"https://ibrahimmisraccaunt-a11y.github.io":ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin":allowed,
    "Access-Control-Allow-Methods":"POST, OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Content-Type":"application/json; charset=utf-8"
  };
}
function normalizeQuestion(text){
  return String(text||"").toLowerCase().replace(/ё/g,"е").replace(/[?!.]+$/g,"").trim();
}
function cleanText(text,max){
  return String(text||"").replace(/[<>]/g,"").replace(/\s+/g," ").trim().slice(0,max);
}
function decodeBase64(value){
  const binary=atob(String(value||"").replace(/\n/g,""));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function encodeBase64(value){
  const bytes=new TextEncoder().encode(value);
  let binary="";
  for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(binary);
}
async function github(path,init={}){
  const token=process.env.GITHUB_TOKEN;
  if(!token)throw new Error("GITHUB_TOKEN is not configured");
  const response=await fetch("https://api.github.com"+path,{
    ...init,
    headers:{
      "Accept":"application/vnd.github+json",
      "Authorization":"Bearer "+token,
      "X-GitHub-Api-Version":"2022-11-28",
      ...(init.headers||{})
    }
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=new Error(data?.message||("GitHub API "+response.status));
    error.status=response.status;
    throw error;
  }
  return data;
}
async function readKnowledge(){
  const data=await github(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${KNOWLEDGE_PATH}?ref=${BRANCH}`);
  const content=JSON.parse(decodeBase64(data.content));
  return {sha:data.sha,knowledge:content};
}
async function writeKnowledge(sha,knowledge){
  return github(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${KNOWLEDGE_PATH}`,{
    method:"PUT",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      message:"learn: add user knowledge",
      content:encodeBase64(JSON.stringify(knowledge,null,2)+"\n"),
      sha,
      branch:BRANCH
    })
  });
}
export default async function handler(req,res){
  const origin=req.headers?.origin||"";
  Object.entries(corsHeaders(origin)).forEach(([key,value])=>res.setHeader(key,value));
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return res.status(405).json({ok:false,error:"POST only"});

  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):(req.body||{});
    const question=cleanText(body.question,500);
    const answer=cleanText(body.answer,2500);
    if(question.length<2||answer.length<2)return res.status(400).json({ok:false,error:"question and answer are required"});

    for(let attempt=0;attempt<2;attempt++){
      const {sha,knowledge}=await readKnowledge();
      const entries=Array.isArray(knowledge.entries)?knowledge.entries:[];
      const normalized=normalizeQuestion(question);
      const existing=entries.find(item=>normalizeQuestion(item.question)===normalized);

      if(existing){
        const candidates=Array.isArray(existing.candidates)?existing.candidates:[];
        if(!candidates.some(item=>String(item.answer||"")===answer)){
          candidates.push({answer,learnedAt:new Date().toISOString()});
        }
        existing.candidates=candidates.slice(-20);
        existing.votes=Number(existing.votes||1)+1;
        existing.updatedAt=new Date().toISOString();
      }else{
        entries.push({
          question,
          answer,
          votes:1,
          candidates:[],
          learnedAt:new Date().toISOString()
        });
      }

      knowledge.version=1;
      knowledge.entries=entries.slice(-5000);

      try{
        await writeKnowledge(sha,knowledge);
        return res.status(200).json({ok:true,message:"Knowledge saved"});
      }catch(error){
        if(error?.status!==409||attempt===1)throw error;
      }
    }
  }catch(error){
    console.error(error);
    return res.status(500).json({ok:false,error:"Could not save knowledge"});
  }
}
