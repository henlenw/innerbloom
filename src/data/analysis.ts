import type {Profile,Quiz} from './types';

type Dimension={label:string;value:number};
const quote=(text:string)=>`「${text}」`;

// Describes existing scores and selected answers; it does not choose a result.
export function explainAnswers(quiz:Quiz,answers:number[],index:number,five?:Dimension[]){
 if(five)return explainFive(quiz,answers,index,five);
 const profile=quiz.profiles[index];
 const selections=quiz.questions.map((question,i)=>question.options[answers[i]]);
 const counts=quiz.profiles.map((_,i)=>selections.filter(option=>option.scores[i]>0).length);
 const tied=counts.filter(n=>n===counts[index]).length>1;
 const evidence=selections.filter(option=>option.scores[index]>0).slice(0,2);
 const first=`${quiz.questions.length} 道情境题里，${counts[index]} 个选择指向「${profile.signal}」。${tied?'最高项并列，本次名称按最早出现的相关选择确定，解读时需同时看其他倾向。':''}例如，你选了${evidence.map(option=>quote(option.text)).join('和')}。`;
 const secondary=counts.map((count,i)=>({count,i})).filter(item=>item.i!==index&&item.count>0).sort((a,b)=>b.count-a.count)[0];
 const paragraphs=[first,profile.detail];
 if(secondary){const option=selections.find(option=>option.scores[secondary.i]>0)!;paragraphs.push(`你还选择了${quote(option.text)}，反映出「${quiz.profiles[secondary.i].signal}」的一面。因此，这次结果需要连同这项偏好一起理解。`)}
 return {profile,paragraphs};
}

const dimensionCopy=[
 {context:'新活动与不同观点',low:'你更偏向熟悉的体验和已有理解',middle:'你对新体验的接受程度保留了一些余地',high:'你更愿意探索新活动和不同观点',keys:['熟悉优先','选择性尝新','开放尝新'],strengths:['你倾向于从熟悉经验出发，能为开始行动保留可参考的做法。','你愿意接触部分新内容，同时保留已有经验作为判断的参照。','你愿意接触新的信息来源，有助于为熟悉问题增加不同的观察角度。']},
 {context:'任务安排与出行准备',low:'你更偏向灵活推进，把安排留到具体情境中处理',middle:'你会做部分准备，也为临时调整留空间',high:'你更愿意提前安排步骤并核对准备事项',keys:['灵活推进','适度准备','计划明确'],strengths:['你较少依赖固定步骤，愿意为现场信息保留调整安排的空间。','你会确认部分重要事项，同时为后续调整保留余地。','你重视步骤和准备，能为需要连续推进的任务提供清楚的起点。']},
 {context:'聚会交流与空闲安排',low:'你更少主动扩展互动，偏向熟悉的人或个人活动',middle:'你愿意参与一部分交流，也保留自己的活动时间',high:'你更愿意主动交流和发起共同活动',keys:['独处偏好','适量互动','主动交流'],strengths:['你倾向于保留个人活动，能让日常体验不完全依赖共同安排。','你愿意参与交流，也保留个人时间，为安排社交密度提供选择。','你倾向于主动发起联系，能为建立共同话题和获取信息创造机会。']},
 {context:'意见分歧与共同安排',low:'你更倾向先明确自身观点和可接受的范围',middle:'你会考虑他人需要，也保留自己的立场',high:'你更愿意主动了解并协调不同的需要',keys:['立场明确','兼顾需要','主动协调'],strengths:['你倾向于说明自己的观点和范围，有助于让分歧中的条件更清楚。','你愿意考虑不同需要，同时保留个人立场作为协商的依据。','你会主动了解他人的需要，有助于共同安排发现尚未被表达的限制。']},
 {context:'计划变化与忙后烦恼',low:'你的回答偏向需要较充分的整理或休息时间',middle:'你的回答偏向稍作缓冲，或在部分情境里慢慢消化',high:'你的回答偏向较快恢复，并继续安排接下来的事情',keys:['需要缓冲','逐步恢复','恢复较快'],strengths:['你留意到了整理和休息的需要，这能为安排缓冲时间提供具体线索。','你愿意为恢复留出一些时间，能在重新投入前调整安排的密度。','你较快转回可处理的事情，有助于在小变化之后重新组织行动。']},
];

function explainFive(quiz:Quiz,answers:number[],index:number,five:Dimension[]){
 const values=five.map(item=>item.value);
 const [o,c,e,a,b]=values;
 // These are the same components used by the existing scoring function.
 const focus=index===0?0:index===1?1:index===2?(e>=a?2:3):(6-e>b?2:4);
 const dimensions=index===0?[0,1,4]:index===1?[1,0,4]:index===2?[2,3,4]:[2,4,1];
 const level=(value:number)=>value>=5?2:value<=1?0:1;
 const mixed=(dim:number)=>{const levels=[dim*2,dim*2+1].map(qi=>3-quiz.questions[qi].options[answers[qi]].scores.indexOf(3));return Math.abs(levels[0]-levels[1])>=2};
 const description=(dim:number)=>{
  const copy=dimensionCopy[dim];
  return mixed(dim)?`在${copy.context}两题里，你选择的方向有差别，需要分情境理解。`:`关于${copy.context}，${[copy.low,copy.middle,copy.high][level(values[dim])]}。`;
 };
 const selected=[focus*2,focus*2+1].map(qi=>quote(quiz.questions[qi].options[answers[qi]].text));
 const reasons=[
  '狐狸名称来自新体验这一侧面在本次综合规则中的相对位置，不等于五个侧面都偏向探索。',
  '海狸名称来自安排与准备这一侧面在本次综合规则中的相对位置，不代表所有情境都按计划行动。',
  '水獭名称合并参考互动与体谅，两项可能强弱不同；只有一项突出，也可能得到这一画像。',
  '小熊名称合并参考较少主动互动与较快恢复，两者不是同一特征，不能直接把名称等同于情绪稳定。',
 ];
 const summary=dimensions.map(description).join('');
 const profile:Profile={...quiz.profiles[index],
  quote:index===2?`本次${e>a?'主动互动':e<a?'体谅协调':'互动与体谅'}的选择，更影响了你的水獭画像。`:index===3?`本次${6-e>b?'较少主动社交':b>6-e?'恢复节奏':'独处与恢复'}的选择，更影响了你的小熊画像。`:mixed(focus)?`你在${dimensionCopy[focus].context}两题中，呈现了不同的选择。`:description(focus),
  keywords:dimensions.map(dim=>mixed(dim)?['体验有差异','安排看情境','互动看情境','协调看情境','恢复有差异'][dim]:dimensionCopy[dim].keys[level(values[dim])]),
  strengths:dimensions.slice(0,2).map(dim=>mixed(dim)?`你在${dimensionCopy[dim].context}中作了不同选择，回看差异能帮助你分清两类场景需要的条件。`:dimensionCopy[dim].strengths[level(values[dim])]),
  detail:summary,
 };
 return {profile,paragraphs:[`你在${dimensionCopy[focus].context}两题中，分别选了${selected.join('和')}。${reasons[index]}`,summary,'每个侧面只有两道趣味情境题，刻度只表示这组回答的方向，不是人群排名或心理诊断。']};
}
