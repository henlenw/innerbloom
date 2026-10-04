import { useRef, useState } from 'react';
import { Check, Clipboard, Ticket, Sparkles } from 'lucide-react';
import { catalog } from './data/catalog';
import { codeScopes, generateCodes, type CodeScope } from './config/redeemCodes';

export function CodeGenerator() {
  const [scope, setScope] = useState<CodeScope>('love');
  const [quizId, setQuizId] = useState<string>(catalog[0][0]);
  const [count, setCount] = useState(10);
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const output = useRef<HTMLTextAreaElement>(null);
  const resetOutput = () => { setCodes([]); setMessage(''); setCopied(false); };
  async function copy() {
    try {
      await Promise.race([
        navigator.clipboard.writeText(codes.join('\n')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('copy unavailable')), 1500)),
      ]);
      setCopied(true);
      setMessage(`已复制 ${codes.length} 个兑换码，可以发送给客户了。`);
    } catch {
      output.current?.focus();
      output.current?.select();
      setMessage('已选中全部兑换码，请长按文字或按 Ctrl+C 复制。');
    }
  }
  return <main className="generator-page">
    <div className="generator-intro">
      <span className="generator-icon"><Ticket size={27}/></span>
      <div className="eyebrow">INNERBLOOM · 小小运营工具</div>
      <h1>兑换码生成器</h1>
      <p>选好范围，生成一批，就可以发给客户。</p>
    </div>
    <section className="generator-card">
      <form onSubmit={e => {
        e.preventDefault();
        try { setCodes(generateCodes(scope, count, quizId)); setCopied(false); setMessage(`已生成 ${count} 个兑换码，现在就可以使用。`); }
        catch (error) { setMessage((error as Error).message); }
      }}>
        <fieldset className="scope-fieldset"><legend>兑换范围</legend>
          <div className="scope-options">{codeScopes.map(s => <label key={s.value} className={scope === s.value ? 'selected' : ''}>
            <input type="radio" name="scope" value={s.value} checked={scope === s.value} onChange={() => { setScope(s.value); resetOutput(); }}/>
            <span>{s.label}</span>
          </label>)}</div>
        </fieldset>
        {scope === 'single' && <label className="generator-field">选择测试
          <select value={quizId} onChange={e => { setQuizId(e.target.value); resetOutput(); }}>{catalog.map(q => <option key={q[0]} value={q[0]}>{q[2]}</option>)}</select>
        </label>}
        <label className="generator-field">生成数量
          <select value={count} onChange={e => { setCount(Number(e.target.value)); resetOutput(); }}>{[10, 50, 100].map(n => <option key={n} value={n}>{n} 个</option>)}</select>
        </label>
        <button className="button primary-wide" type="submit"><Sparkles size={18}/>生成兑换码</button>
      </form>
      {codes.length > 0 && <div className="code-output">
        <div className="code-output-heading"><label htmlFor="generated-codes">这批兑换码</label><span>{codes.length} 个 · {codeScopes.find(s => s.value === scope)?.label}</span></div>
        <textarea ref={output} id="generated-codes" readOnly spellCheck={false} value={codes.join('\n')} rows={Math.min(10, codes.length)} />
        <button className="button primary-wide secondary" type="button" onClick={copy}>{copied ? <Check size={18}/> : <Clipboard size={18}/>} {copied ? '已复制全部' : '一键复制全部'}</button>
      </div>}
      <p className="generator-status" role="status" aria-live="polite">{message}</p>
      <div className="generator-help"><p>兑换码生成后立即生效，无需上传或重新发布网站。</p><p>客户完成测试后输入适用的兑换码，即可查看完整分析。同一个码可以重复使用。</p><p>此页面不保存兑换码。关闭或刷新前，记得复制需要的内容。</p></div>
    </section>
  </main>;
}
