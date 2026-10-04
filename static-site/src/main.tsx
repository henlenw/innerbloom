import {CodeGenerator} from './CodeGenerator';
import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Header,Footer,Home,Catalog,pathNow,Link} from './shell';
import {TestPage,ResultPage,RedeemPage} from './flows';
import './style.css';
function App(){const [path,setPath]=useState(pathNow());useEffect(()=>{const fn=()=>setPath(pathNow());addEventListener('popstate',fn);addEventListener('hashchange',fn);return()=>{removeEventListener('popstate',fn);removeEventListener('hashchange',fn)}},[]);useEffect(()=>{document.title='心森 InnerBloom · '+(path==='/'?'认识自己的小森林':path==='/redeem'?'兑换结果':path.endsWith('/code-generator')?'兑换码生成器':'有趣地认识自己')},[path]);let content;if(path==='/')content=<Home/>;else if(path==='/tests')content=<Catalog/>;else if(['/love','/career','/personality'].includes(path))content=<Catalog category={path.slice(1) as 'love'|'career'|'personality'}/>;else if(path==='/redeem')content=<RedeemPage/>;else if(['/tools/code-generator','/code-generator'].includes(path))content=<CodeGenerator/>;else if(/^\/test\/[a-z-]+$/.test(path))content=<TestPage id={path.split('/')[2]}/>;else if(/^\/result\/[a-z-]+$/.test(path))content=<ResultPage id={path.split('/')[2]}/>;else content=<main className="page empty"><h1>这条小路还没有开放</h1><p>回到小森林，重新选个方向吧。</p><Link to="/" className="button">回到首页</Link></main>;return <><Header path={path}/>{content}<Footer/></>};
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
