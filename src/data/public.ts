import {catalog} from './catalog';
import {questions,type Quiz} from './types';
import {loveQuestions} from './love-questions';
import {careerQuestions} from './career-questions';
import {personalityQuestions} from './personality-questions';
const allQuestions={...loveQuestions,...careerQuestions,...personalityQuestions};
allQuestions['personality-bigfive']=[
'一个没尝试过的新活动出现时，你的兴趣通常怎样？|很想了解，愿意试试|有一点兴趣，先看看|更倾向熟悉的活动|此刻不太想增加新体验',
'听到一个与自己不同的观点，你通常？|很想探索它的新角度|愿意先听一听|先参考自己熟悉的理解|更想保留目前的看法',
'一件需要连续完成的小事，你通常怎样安排？|拆成步骤，按计划推进|有大致安排，基本照着做|看当天情况灵活进行|暂时不安排固定节奏',
'一次出行前，你通常会？|提前核对路线和需要的物品|确认几件重要的事|出发前简单看看|到了现场再慢慢决定',
'参加一个轻松的聚会，你通常？|会主动和许多人交流|愿意和几个人聊聊|主要和熟悉的人说话|更多享受安静观察',
'一段空闲时间，你更想？|主动约人一起活动|和一个朋友分享近况|先独处，之后再看情况|把时间留给自己的兴趣',
'和朋友想法不一致时，你会多自然地了解对方的需要？|通常会主动认真了解|大多愿意问一问|先把自己的想法说明白|更想保留各自的观点',
'一起安排活动，你会怎样考虑大家的偏好？|很愿意协调不同的期待|通常会照顾到主要需要|先明确自己可接受的范围|更倾向各自安排适合的部分',
'小计划意外改变时，你通常怎样恢复节奏？|较快平静，能重新安排|稍作缓冲就可以继续|需要比较充分的整理时间|当下想先离开这件事休息',
'忙碌结束后，小烦恼会怎样影响你接下来的时间？|通常很快能放下|休息一会就轻一些|需要慢慢消化和梳理|会想留更多空间安顿心情'
];
export const quizzes:Quiz[]=catalog.map(([id,category,title,description,emoji,art])=>({id,category,title,description,emoji,art,profiles:[],questions:questions(allQuestions[id])}));
export const findQuiz=(id:string)=>quizzes.find(q=>q.id===id);
