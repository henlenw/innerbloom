import {explainAnswers} from './data/analysis';
import type {Quiz,Profile} from './data/types';
export type RecordData={answers:number[];complete:boolean;unlocked:boolean;updatedAt:number};
const prefix='innerbloom.v1.';
const memory=new Map<string,RecordData>();
let storageAvailable=true;
export const isStorageAvailable=()=>storageAvailable;
export function validRecord(quiz:Quiz,value:unknown):value is RecordData{
 const r=value as RecordData;return !!r&&Array.isArray(r.answers)&&r.answers.length<=quiz.questions.length&&r.answers.every((a,i)=>Number.isInteger(a)&&a>=0&&a<quiz.questions[i].options.length)&&typeof r.complete==='boolean'&&typeof r.unlocked==='boolean'&&Number.isFinite(r.updatedAt)&&(!r.complete||r.answers.length===quiz.questions.length)&&(!r.unlocked||r.complete);
}
export function loadRecord(quiz:Quiz):RecordData|undefined{try{const raw=localStorage.getItem(prefix+quiz.id);if(raw){const value=JSON.parse(raw);if(validRecord(quiz,value)){memory.set(quiz.id,value);return value;}}}catch{storageAvailable=false;}return memory.get(quiz.id);}
export function saveRecord(quiz:Quiz,r:RecordData){if(!validRecord(quiz,r))throw new Error('答题记录不完整');memory.set(quiz.id,r);try{localStorage.setItem(prefix+quiz.id,JSON.stringify(r))}catch{storageAvailable=false;}return r;}
export function clearRecord(quiz:Quiz){memory.delete(quiz.id);try{localStorage.removeItem(prefix+quiz.id)}catch{storageAvailable=false;}}
export function getBigFive(quiz:Quiz,answers:number[]){if(quiz.id!=='personality-bigfive')return undefined;return ['开放体验','有序投入','互动意愿','体谅倾向','情绪缓冲'].map((label,dim)=>({label,value:[dim*2,dim*2+1].reduce((n,qi)=>n+3-quiz.questions[qi].options[answers[qi]].scores.indexOf(3),0)}));}
export function score(quiz:Quiz,answers:number[]):number{
 if(answers.length!==quiz.questions.length||!answers.every((a,i)=>Number.isInteger(a)&&a>=0&&a<quiz.questions[i].options.length))throw new Error('请先完成全部题目');
 const five=getBigFive(quiz,answers);if(five){const [o,c,e,a,b]=five.map(d=>d.value);const scores=[o,c,(e+a)/2,(b+6-e)/2];return scores.indexOf(Math.max(...scores));}
 const totals=[0,0,0,0];answers.forEach((a,i)=>quiz.questions[i].options[a].scores.forEach((n,j)=>totals[j]+=n));const top=Math.max(...totals);const tied=totals.map((n,i)=>n===top?i:-1).filter(i=>i>=0);if(tied.length===1)return tied[0];
 // A tie is resolved by the earliest answer that supports one of the tied profiles.
 for(let i=0;i<answers.length;i++){const chosen=quiz.questions[i].options[answers[i]].scores;const match=tied.find(t=>chosen[t]===Math.max(...chosen));if(match!==undefined)return match;}return tied[0];
}
export function resultContent(quiz:Quiz,r:RecordData){
 if(!r.complete||!r.unlocked)throw new Error('结果尚未解锁');
 const index=score(quiz,r.answers),five=getBigFive(quiz,r.answers);
 const {profile,paragraphs}=explainAnswers(quiz,r.answers,index,five);
 return {index,profile,paragraphs,closing:profile.closing,five};
}
export function fullText(quiz:Quiz,r:RecordData){const d=resultContent(quiz,r);return [d.profile.title,d.profile.quote,d.profile.keywords.join(' · '),...d.paragraphs,...d.profile.strengths,d.profile.tip,d.closing].join('\n\n')}
export function shareText(quiz:Quiz,profile:Profile){const relative=`/test/${quiz.id}`;const url=location.protocol==='file:'?'':`${location.origin}${relative}`;return `我刚刚在「心森 InnerBloom」测出了「${profile.title}」${profile.emoji}\n${profile.quote}\n你也来看看自己的结果吧。${url?'\n'+url:''}`;}
