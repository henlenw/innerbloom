import assert from 'node:assert/strict';
import {quizzes} from '../src/data/index';
import {score,fullText,resultContent,validRecord,getBigFive} from '../src/engine';
import {validCode,generateCodes,codeScopes} from '../src/config/redeemCodes';
assert.equal(quizzes.length,30);
assert.deepEqual(['love','career','personality'].map(c=>quizzes.filter(q=>q.category===c).length),[12,10,8]);
assert.equal(new Set(quizzes.map(q=>q.id)).size,30);
const lengths:number[]=[];const short:string[]=[];let paths=0;let totalQuestions=0;
for(const q of quizzes){
 assert.ok(q.questions.length>=8&&q.questions.length<=12,q.id);assert.equal(q.profiles.length,4);totalQuestions+=q.questions.length;
 q.questions.forEach(question=>{assert.ok(question.text);assert.ok(question.options.length>=4&&question.options.length<=6);assert.equal(new Set(question.options.map(o=>o.text)).size,question.options.length);question.options.forEach(o=>{assert.equal(o.scores.length,4);assert.ok(o.scores.every(Number.isFinite))})});
 const found=new Set<number>();
 for(let pattern=0;pattern<512;pattern++){
  const answers=q.questions.map((question,i)=>pattern<4?question.options.findIndex(o=>o.scores[pattern]===3):((Math.imul(pattern+1,1664525+i*7919)>>>((i%5)+1))>>>0)%4);
  const answer=score(q,answers);assert.equal(answer,score(q,[...answers]));found.add(answer);paths++;
  const record={answers,complete:true,unlocked:true,updatedAt:1};assert.ok(validRecord(q,record));assert.throws(()=>resultContent(q,{...record,unlocked:false}));assert.throws(()=>resultContent(q,{...record,complete:false}));
  const d=resultContent(q,record);assert.ok(d.profile.tip.length>10);assert.ok(d.profile.keywords.length>=3&&d.profile.keywords.length<=5);assert.ok(d.profile.strengths.length>=2&&d.profile.strengths.length<=4);
  const length=fullText(q,record).replace(/\s/g,'').length;lengths.push(length);if(length<250||length>500){if(!short.some(s=>s.startsWith(q.id+':'+answer+':')))short.push(`${q.id}:${answer}:${length}`)}
 }
 assert.equal(found.size,4,`${q.id}: some profiles are unreachable`);
 assert.throws(()=>score(q,[]));assert.throws(()=>score(q,q.questions.map(()=>9)));assert.ok(!validRecord(q,{answers:[],complete:true,unlocked:true,updatedAt:1}));
 for(const p of q.profiles){assert.ok(!/你注定|你性格有问题|你应该辞职|你应该马上分手|你必须改变自己|一定失败/.test(JSON.stringify(p)))}
}
assert.equal(validCode('  demoall  ','love'),true);assert.equal(validCode('demolove','love'),true);assert.equal(validCode('DEMOCAREER','career'),true);assert.equal(validCode('DEMOLOVE','career'),false);assert.equal(validCode('DEMOCAREER','personality'),false);assert.equal(validCode('wrong','love'),false);assert.equal(validCode('','love'),false);assert.equal(validCode('toString','love'),false);assert.equal(validCode('__proto__','love'),false);
const big=quizzes.find(q=>q.id==='personality-bigfive')!;const high=big.questions.map(q=>q.options.findIndex(o=>o.scores[0]===3));const low=big.questions.map(q=>q.options.findIndex(o=>o.scores[3]===3));assert.deepEqual(getBigFive(big,high)?.map(x=>x.value),[6,6,6,6,6]);assert.deepEqual(getBigFive(big,low)?.map(x=>x.value),[0,0,0,0,0]);
console.log(JSON.stringify({tests:quizzes.length,questions:totalQuestions,profiles:quizzes.reduce((n,q)=>n+q.profiles.length,0),answerPaths:paths,minResultLength:Math.min(...lengths),maxResultLength:Math.max(...lengths),outsideLength:short},null,2));
assert.equal(short.length,0,'Result text must contain 250–500 characters');

let generatedCount=0;
for(const scope of codeScopes){
 for(const count of [10,50,100]){
  const target=quizzes[4];const codes=generateCodes(scope.value,count,target.id);assert.equal(codes.length,count);assert.equal(new Set(codes).size,count);generatedCount+=count;
  for(const code of codes){
   for(const quiz of quizzes){const expected=scope.value==='all'||(scope.value==='single'?quiz.id===target.id:quiz.category===scope.value);assert.equal(validCode('  '+code.toLowerCase()+'  ',quiz.category,quiz.id),expected,`${scope.value} ${quiz.id}`)}
  }
 }
}
for(const quiz of quizzes){const [code]=generateCodes('single',10,quiz.id);assert.ok(validCode(code,quiz.category,quiz.id));assert.equal(validCode(code,quiz.category),false);}
for(const code of ['LOVE-','LOVE-1234','LOVE-123456','LOVE-AB!12','LOVE-A B12','ALL-','GROWTH-ABCD_','TEST-NOT-EXIST-ABCDE','TEST-LOVE-ANIMAL-1234'])assert.equal(validCode(code,'love','love-animal'),false,code);
assert.equal(validCode('ALL-ABCDE','invalid'),false);assert.equal(validCode('GROWTH-Q82LA','personality','personality-tree'),true);assert.equal(validCode('DEMOPERSONALITY','personality'),true);assert.throws(()=>generateCodes('single',10,'missing'));assert.throws(()=>generateCodes('love',1000));
console.log(JSON.stringify({generatedCodes:generatedCount,scopePermissionChecks:generatedCount*30,singleTestTargets:quizzes.length,generator:'passed'},null,2));
