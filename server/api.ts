import { findQuiz } from '../src/data';
import { catalog } from '../src/data/catalog';
import { resultContent } from '../src/engine';
import type { Env, CodeRow, Scope } from './types';

const encoder=new TextEncoder();
const scopes=['single','love','career','personality','all'];
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const scopeNames:Record<string,string>={love:'恋爱测试',career:'职业测试',personality:'性格与成长',all:'全部测试',single:'单个测试'};
class ApiError extends Error { constructor(public status:number,message:string){super(message)} }
function json(value:unknown,status=200,headers:Record<string,string>={}) { return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}}); }
function cookie(request:Request,name:string) { return (request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||''; }
function cookieHeader(request:Request,name:string,value:string,seconds:number) { return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${new URL(request.url).protocol==='https:'?'; Secure':''}`; }
function randomHex(n=32) { return Array.from(crypto.getRandomValues(new Uint8Array(n)),n=>n.toString(16).padStart(2,'0')).join(''); }
async function digest(text:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))),n=>n.toString(16).padStart(2,'0')).join(''); }
async function key(env:Env) { return crypto.subtle.importKey('raw',encoder.encode(env.ADMIN_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
async function sign(env:Env,text:string) { const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',await key(env),encoder.encode(text))); return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join(''); }
async function verify(env:Env,text:string,signature:string) { if(!/^[a-f0-9]{64}$/.test(signature))return false; const bytes=Uint8Array.from(signature.match(/../g)!,h=>parseInt(h,16)); return crypto.subtle.verify('HMAC',await key(env),bytes,encoder.encode(text)); }
async function admin(request:Request,env:Env) { const token=cookie(request,'ib_admin');const [expiry,nonce,sig]=token.split('.');return /^\d{13}$/.test(expiry||'')&&Number(expiry)>Date.now()&&Number(expiry)<Date.now()+9*3600000&&/^[a-f0-9]{32}$/.test(nonce||'')&&await verify(env,`admin.${expiry}.${nonce}`,sig||''); }
async function owner(request:Request) { const token=cookie(request,'ib_visitor');return /^[a-f0-9]{64}$/.test(token)?await digest(token):null; }
async function hasAccess(request:Request,env:Env,quizId:string) { const quiz=findQuiz(quizId);if(!quiz)throw new ApiError(404,'没有找到这项测试。');const hash=await owner(request);if(!hash)return false;return !!await env.DB.prepare("SELECT code FROM codes WHERE owner_hash=? AND used_at IS NOT NULL AND (scope='all' OR scope=? OR (scope='single' AND quiz_id=?)) LIMIT 1").bind(hash,quiz.category,quizId).first(); }
async function body(request:Request) { if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new ApiError(415,'请求格式不正确。');const text=await request.text();if(text.length>8192)throw new ApiError(413,'请求内容过长。');try{const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))throw 0;return value as Record<string,unknown>}catch{throw new ApiError(400,'请求内容不正确。')} }
async function limit(request:Request,env:Env,action:string,max:number,minutes:number) { const now=Date.now();const id=await digest(`${env.ADMIN_SESSION_SECRET}:${action}:${request.headers.get('CF-Connecting-IP')||'local'}`);await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at < ?').bind(now).run();const row=await env.DB.prepare('INSERT INTO rate_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING attempts').bind(id,now+minutes*60000,now,now).first<{attempts:number}>();if(!row||row.attempts>max)throw new ApiError(429,`操作有些频繁，请 ${minutes} 分钟后再试。`); }
function filters(url:URL) { const parts:string[]=[];const args:unknown[]=[];const status=url.searchParams.get('status');const scope=url.searchParams.get('scope');const query=(url.searchParams.get('q')||'').trim().toUpperCase().slice(0,30);if(status==='used')parts.push('used_at IS NOT NULL');if(status==='unused')parts.push('used_at IS NULL');if(scope&&scopes.includes(scope)){parts.push('scope=?');args.push(scope)}if(query){if(!/^[A-Z0-9-]+$/.test(query))throw new ApiError(400,'请只输入兑换码中的字母、数字或横线。');parts.push('code LIKE ?');args.push(query+'%')}return {where:parts.length?' WHERE '+parts.join(' AND '):'',args}; }
function scopeLabel(row:CodeRow) {return row.scope==='single'?catalog.find(q=>q[0]===row.quiz_id)?.[2]||'单个测试':scopeNames[row.scope]}

export async function handleApi(request:Request,env:Env):Promise<Response> {
 try {
  const url=new URL(request.url);const path=url.pathname.replace(/\/$/,'');const method=request.method;
  if(!env.DB||!env.ADMIN_PASSWORD||!env.ADMIN_SESSION_SECRET)throw new ApiError(503,'服务正在准备中，请稍后再试。');
  if(method!=='GET'&&method!=='POST')throw new ApiError(405,'暂不支持这个操作。');
  if(method==='POST'&&request.headers.get('Origin')!==url.origin)throw new ApiError(403,'请在心森网站内完成操作。');
  if(path==='/api/health'&&method==='GET'){await env.DB.prepare('SELECT code FROM codes LIMIT 1').first();return json({ok:true,version:2})}
  if(path==='/api/access'&&method==='GET'){
   const quizId=url.searchParams.get('quiz')||'';const access=await hasAccess(request,env,quizId);const token=cookie(request,'ib_visitor');
   return json({access},200,/^[a-f0-9]{64}$/.test(token)?{}:{'Set-Cookie':cookieHeader(request,'ib_visitor',randomHex(),31536000)});
  }
  if(path==='/api/redeem'&&method==='POST'){
   const data=await body(request);const quiz=typeof data.quizId==='string'?findQuiz(data.quizId):undefined;if(!quiz)throw new ApiError(400,'请先选择并完成一项测试。');
   const hash=await owner(request);if(!hash)throw new ApiError(400,'请刷新页面后重试，并允许浏览器保存本网站的记录。');
   await limit(request,env,'redeem',60,10);
   const code=String(data.code||'').trim().toUpperCase();if(!/^INB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code))throw new ApiError(400,'兑换码不正确，请检查后重试。');
   const row=await env.DB.prepare("UPDATE codes SET used_at=?,owner_hash=? WHERE code=? AND used_at IS NULL AND (scope='all' OR scope=? OR (scope='single' AND quiz_id=?)) RETURNING code,scope,quiz_id").bind(Date.now(),hash,code,quiz.category,quiz.id).first<CodeRow>();
   if(!row){const existing=await env.DB.prepare('SELECT used_at FROM codes WHERE code=?').bind(code).first<CodeRow>();if(!existing)throw new ApiError(400,'兑换码不正确，请检查后重试。');if(existing.used_at)throw new ApiError(409,'这个兑换码已经使用过了。');throw new ApiError(403,'这个兑换码不适用于当前测试，请确认购买的范围。')}
   return json({ok:true,scope:row.scope,label:scopeLabel(row)});
  }
  if(path==='/api/result'&&method==='POST'){
   const data=await body(request);const quiz=typeof data.quizId==='string'?findQuiz(data.quizId):undefined;if(!quiz)throw new ApiError(400,'没有找到这项测试。');
   if(!await hasAccess(request,env,quiz.id))throw new ApiError(403,'请先输入有效兑换码。');
   if(!Array.isArray(data.answers)||data.answers.length!==quiz.questions.length||!data.answers.every((a,i)=>Number.isInteger(a)&&a>=0&&a<quiz.questions[i].options.length))throw new ApiError(400,'请先完成全部题目。');
   return json(resultContent(quiz,{answers:data.answers as number[],complete:true,unlocked:true,updatedAt:Date.now()}));
  }
  if(path==='/api/admin/login'&&method==='POST'){
   await limit(request,env,'login',10,15);const data=await body(request);const candidate=typeof data.password==='string'?data.password:'';
   if(candidate.length>200||!await verify(env,candidate,await sign(env,env.ADMIN_PASSWORD)))throw new ApiError(401,'管理员密码不正确。');
   const expiry=Date.now()+8*3600000;const nonce=randomHex(16);const sig=await sign(env,`admin.${expiry}.${nonce}`);return json({ok:true},200,{'Set-Cookie':cookieHeader(request,'ib_admin',`${expiry}.${nonce}.${sig}`,8*3600)});
  }
  if(path==='/api/admin/logout'&&method==='POST')return json({ok:true},200,{'Set-Cookie':cookieHeader(request,'ib_admin','',0)});
  if(path.startsWith('/api/admin/')){
   if(!await admin(request,env))throw new ApiError(401,'请先登录管理后台。');
   if(path==='/api/admin/session'&&method==='GET')return json({ok:true});
   if(path==='/api/admin/codes'&&method==='POST'){
    const data=await body(request);const scope=String(data.scope) as Scope;const count=Number(data.count);const quizId=scope==='single'?String(data.quizId||''):null;
    if(!scopes.includes(scope)||!Number.isInteger(count)||count<1||count>100||(scope==='single'&&!findQuiz(quizId!)))throw new ApiError(400,'请选择有效范围，数量为 1–100 个。');
    const createdAt=Date.now();const batch=crypto.randomUUID();const codes=new Set<string>();while(codes.size<count){const letters=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%32]).join('');codes.add(`INB-${letters.slice(0,4)}-${letters.slice(4)}`)}
    await env.DB.batch([...codes].map(code=>env.DB.prepare('INSERT INTO codes(code,scope,quiz_id,batch_id,created_at) VALUES(?,?,?,?,?)').bind(code,scope,quizId,batch,createdAt)));
    return json({codes:[...codes],batchId:batch,scope,quizId,createdAt},201);
   }
   if(path==='/api/admin/stats'&&method==='GET'){
    const offset=Number(url.searchParams.get('offset')||0);if(!Number.isInteger(offset)||Math.abs(offset)>840)throw new ApiError(400,'时区格式不正确。');const now=Date.now();const today=Math.floor((now-offset*60000)/86400000)*86400000+offset*60000;
    const row=await env.DB.prepare('SELECT COUNT(*) AS total,COUNT(used_at) AS used,COUNT(*)-COUNT(used_at) AS unused,COALESCE(SUM(CASE WHEN used_at>=? THEN 1 ELSE 0 END),0) AS today,COALESCE(SUM(CASE WHEN used_at>=? THEN 1 ELSE 0 END),0) AS week FROM codes').bind(today,now-7*86400000).first();return json({...row,tests:catalog.length});
   }
   if(path==='/api/admin/codes'&&method==='GET'){
    const {where,args}=filters(url);const page=Math.max(1,Math.min(100000,Number(url.searchParams.get('page'))||1));if(!Number.isInteger(page))throw new ApiError(400,'页码不正确。');const count=await env.DB.prepare('SELECT COUNT(*) AS total FROM codes'+where).bind(...args).first<{total:number}>();
    const rows=await env.DB.prepare('SELECT code,scope,quiz_id,batch_id,created_at,used_at FROM codes'+where+' ORDER BY created_at DESC,code LIMIT 25 OFFSET ?').bind(...args,(page-1)*25).all<CodeRow>();return json({items:rows.results.map(row=>({...row,label:scopeLabel(row)})),total:count?.total||0,page,pageSize:25});
   }
   if(path==='/api/admin/export'&&method==='GET'){
    const {where,args}=filters(url);const rows=await env.DB.prepare('SELECT code,scope,quiz_id,batch_id,created_at,used_at FROM codes'+where+' ORDER BY created_at DESC,code LIMIT 10001').bind(...args).all<CodeRow>();if(rows.results.length>10000)throw new ApiError(413,'一次最多导出 10000 个，请缩小筛选范围。');
    const format=url.searchParams.get('format')==='csv'?'csv':'txt';const field=(v:unknown)=>'"'+String(v??'').replace(/"/g,'""')+'"';
    const content=format==='txt'?rows.results.map(r=>r.code).join('\r\n'):'\uFEFF'+[['兑换码','兑换范围','状态','生成时间 UTC','兑换时间 UTC'],...rows.results.map(r=>[r.code,scopeLabel(r),r.used_at?'已使用':'未使用',new Date(r.created_at).toISOString(),r.used_at?new Date(r.used_at).toISOString():''])].map(row=>row.map(field).join(',')).join('\r\n');
    return new Response(content,{headers:{'Content-Type':format==='csv'?'text/csv; charset=utf-8':'text/plain; charset=utf-8','Content-Disposition':`attachment; filename="innerbloom-codes.${format}"`,'Cache-Control':'no-store'}});
   }
  }
  throw new ApiError(404,'没有找到这个操作。');
 }catch(error){if(error instanceof ApiError)return json({error:error.message},error.status);return json({error:'服务暂时不可用，请稍后重试。'},503)}
}
