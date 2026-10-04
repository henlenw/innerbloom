export type Category = 'love' | 'career' | 'personality';
export type Profile = { title: string; emoji: string; quote: string; keywords: string[]; detail: string; strengths: string[]; tip: string };
export type Question = { text: string; options: { text: string; scores: number[] }[] };
export type Quiz = { id: string; category: Category; title: string; description: string; emoji: string; art: string; profiles: Profile[]; questions: Question[] };
export function profiles(rows: string[]): Profile[] {
  return rows.map(row => {const [title,emoji,quote,keys,detail,advantages,tip] = row.split('|');return {title,emoji,quote,keywords:keys.split('、'),detail,strengths:advantages.split('、'),tip};});
}
export function questions(rows: string[]): Question[] {
  return rows.map((row,qi) => { const [text,...answers]=row.split('|'); return {text,options:answers.map((text,i)=>({text,scores:[0,1,2,3].map(n=>n===i?3:0)})).map((_,i,all)=>all[(i+qi)%4])}; });
}
