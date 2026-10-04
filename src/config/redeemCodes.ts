export const codeScopes=[
 {value:'single',label:'单个测试'},
 {value:'love',label:'恋爱测试'},
 {value:'career',label:'职业测试'},
 {value:'personality',label:'性格与成长'},
 {value:'all',label:'全部测试'},
] as const;
export type CodeScope=typeof codeScopes[number]['value'];
