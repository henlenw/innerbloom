import type { resultContent } from './engine';
export type ResultData=ReturnType<typeof resultContent>;
export class RequestError extends Error { constructor(message:string,public status=0){super(message)} }
export async function api<T>(path:string,data?:unknown):Promise<T>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
 try {const response=await fetch(path,{method:data===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),signal:controller.signal});const contentType=response.headers.get('Content-Type')||'';if(!contentType.includes('application/json'))throw new RequestError('服务暂时不可用，请稍后重试。',response.status);const result=await response.json();if(!response.ok)throw new RequestError(result.error||'操作没有完成，请稍后重试。',response.status);return result as T;}catch(error){if(error instanceof RequestError)throw error;throw new RequestError('暂时无法连接，请检查网络后重试。');}finally{clearTimeout(timer)}
}
export const getAccess=(quizId:string)=>api<{access:boolean}>(`/api/access?quiz=${encodeURIComponent(quizId)}`);
export const getResult=(quizId:string,answers:number[])=>api<ResultData>('/api/result',{quizId,answers});
export const redeem=(quizId:string,code:string)=>api<{ok:boolean;label:string}>('/api/redeem',{quizId,code});
