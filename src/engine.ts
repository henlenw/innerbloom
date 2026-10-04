import {observations} from './data/observations';
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
const contexts={
 love:'这些选择描述的是你在亲密关系中更容易注意到的部分，并不是对关系好坏的评价。面对不同的人、不同的阶段，你也可能展现其他相处方式。此刻的偏好值得被看见，变化之后的自己也同样值得被理解。',
 career:'这份画像关注你此刻对工作方式的偏好，不是能力排名，也不对应某一种必须选择的职业。相同的优势可以在很多任务里发挥作用，环境、经验和当下的精力，也会影响你最舒服的做事方式。',
 personality:'这份画像只是一次日常选择的轻松观察，不是固定的性格标签。你可以在不同情境中拥有不同的样子，安静与活跃、坚持与调整，也可以同时存在。比起像不像某一种类型，哪些描述让你有所感受，可能更值得停留。'
};
export function resultContent(quiz:Quiz,r:RecordData){
 if(!r.complete||!r.unlocked)throw new Error('结果尚未解锁');
 const index=score(quiz,r.answers),profile=quiz.profiles[index];
 const evidence=quiz.questions.map((q,i)=>({q,option:q.options[r.answers[i]]})).filter(x=>x.option.scores[index]>0).slice(0,2);
 const reflection=quiz.id==='personality-bigfive'?'五个侧面的刻度只表示本组题目中选择的方向，没有常模、百分位或诊断含义。它们并不是能力分数，也不适合用来与别人比较。可以看看哪一个侧面最贴近你的日常，再把真实经历放回这张画像里。':`你在回答中选择了${evidence.length?evidence.map(x=>`“${x.option.text}”`).join('和'):'多种不同的相处方式'}。这些小选择提供了一条理解自己的线索。它们只代表你此刻更认同的回应，不要求每个场景都如此，也不会替你决定下一步。`;
 return {index,profile,paragraphs:[profile.detail,reflection,contexts[quiz.category]+observations[quiz.id]],closing:'你不需要急着成为谁，慢慢成为自己喜欢的样子，也很好。',five:getBigFive(quiz,r.answers)};
}
export function fullText(quiz:Quiz,r:RecordData){const d=resultContent(quiz,r);return [d.profile.title,d.profile.quote,d.profile.keywords.join(' · '),...d.paragraphs,...d.profile.strengths,d.profile.tip,d.closing].join('\n\n')}
export function shareText(quiz:Quiz,profile:Profile){const relative=`/test/${quiz.id}`;const url=location.protocol==='file:'?'':`${location.origin}${relative}`;return `我刚刚在「心森 InnerBloom」测出了「${profile.title}」${profile.emoji}\n${profile.quote}\n你也来看看自己的结果吧。${url?'\n'+url:''}`;}
