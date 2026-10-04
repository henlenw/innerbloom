export interface DBResult<T=Record<string,unknown>> { results:T[]; meta:{changes:number}; success:boolean }
export interface Statement { bind(...values:unknown[]):Statement; first<T=Record<string,unknown>>():Promise<T|null>; all<T=Record<string,unknown>>():Promise<DBResult<T>>; run():Promise<DBResult> }
export interface Database { prepare(sql:string):Statement; batch<T=Record<string,unknown>>(queries:Statement[]):Promise<DBResult<T>[]> }
export interface Env { DB:Database; ADMIN_PASSWORD:string; ADMIN_SESSION_SECRET:string }
export type Scope='single'|'love'|'career'|'personality'|'all';
export interface CodeRow { code:string; scope:Scope; quiz_id:string|null; batch_id:string; created_at:number; used_at:number|null; owner_hash?:string|null }
