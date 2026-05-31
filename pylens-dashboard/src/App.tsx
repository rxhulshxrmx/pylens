import { useState } from 'react';
import { GitCommit, Bot, FileCode, Code2, LayoutGrid, List, ChevronDown, ChevronRight, X, Search } from 'lucide-react';
import { REQUIREMENTS, PROVENANCE, TOOL_COLORS, STATUS_COLORS, PRIORITY_COLORS, timeAgo, fmtDate } from './data';
import type { Requirement, ProvenanceRecord } from './data';

function targetLabel(r: ProvenanceRecord) {
  if (r.target.kind === 'function') return `${r.target.functionName}()`;
  if (r.target.kind === 'file') return r.target.label ?? r.target.filePath;
  return r.target.label;
}
function targetSub(r: ProvenanceRecord) {
  if (r.target.kind === 'function') return r.target.filePath;
  if (r.target.kind === 'file') return r.target.filePath;
  return `${r.target.filePaths.length} files`;
}
function targetIcon(r: ProvenanceRecord) {
  if (r.target.kind === 'function') return <Code2 className="size-3.5 text-blue-500 shrink-0" />;
  if (r.target.kind === 'file') return <FileCode className="size-3.5 text-emerald-600 shrink-0" />;
  return <FileCode className="size-3.5 text-amber-600 shrink-0" />;
}

const TRACK_COLORS = ['#007ACC','#D97A14','#6D28D9','#059669','#DC2626','#0891B2','#7C3AED'];

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ view, setView }: { view: string; setView: (v: string) => void }) {
  const nav = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="size-4" /> },
    { id: 'requirements', label: 'Requirements', icon: <List className="size-4" /> },
    { id: 'provenance', label: 'Provenance', icon: <span className="text-sm font-bold leading-none">⬡</span> },
    { id: 'ai-sessions', label: 'AI Sessions', icon: <Bot className="size-4" /> },
  ];
  const tracked = PROVENANCE.length;
  const total = REQUIREMENTS.length;
  return (
    <aside className="w-56 shrink-0 border-r border-hairline bg-white flex flex-col">
      <div className="px-5 py-4 border-b border-hairline">
        <div className="flex items-center gap-2"><span className="text-xl text-amber-500 font-bold">⬡</span><span className="font-bold text-ink tracking-tight">PyLens</span></div>
        <p className="text-xs text-muted mt-0.5">Provenance tracking</p>
      </div>
      <nav className="p-3 space-y-0.5 flex-1">
        {nav.map(n => (
          <button key={n.id} onClick={() => setView(n.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${view===n.id?'bg-amber-500 text-white font-medium':'text-muted hover:bg-hairline hover:text-ink'}`}>
            {n.icon}{n.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-hairline">
        <div className="text-xs text-muted space-y-1.5">
          <div className="flex justify-between"><span>Coverage</span><span className="font-mono text-ink font-medium">{tracked}/{total}</span></div>
          <div className="h-1.5 bg-hairline rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{width:`${(tracked/total)*100}%`}} /></div>
        </div>
      </div>
    </aside>
  );
}

// ── Overview ───────────────────────────────────────────────────────────────────
function Overview({ setView }: { setView: (v: string) => void }) {
  const byTool = PROVENANCE.reduce<Record<string,number>>((acc,r) => { const t=r.aiSession?.tool??'Unknown'; acc[t]=(acc[t]??0)+1; return acc; },{});
  const byStatus = REQUIREMENTS.reduce<Record<string,number>>((acc,r) => { acc[r.status]=(acc[r.status]??0)+1; return acc; },{});
  return (
    <div className="p-8 space-y-8 overflow-y-auto flex-1">
      <div><h1 className="text-2xl font-bold text-ink">Overview</h1><p className="text-muted mt-1">Full provenance picture for this workspace</p></div>
      <div className="grid grid-cols-4 gap-4">
        {[
          {label:'Functions tracked',value:PROVENANCE.filter(r=>r.target.kind==='function').length,sub:'across all languages'},
          {label:'Files tracked',value:PROVENANCE.filter(r=>r.target.kind!=='function').length,sub:'configs, migrations, multi-file'},
          {label:'Requirements',value:REQUIREMENTS.length,sub:`${byStatus.done??0} done`},
          {label:'AI sessions',value:PROVENANCE.filter(r=>r.aiSession).length,sub:'with conversation history'},
        ].map(s => (
          <div key={s.label} className="bg-white border border-hairline rounded-xl p-5">
            <p className="text-3xl font-bold text-ink">{s.value}</p>
            <p className="text-sm font-medium text-ink mt-1">{s.label}</p>
            <p className="text-xs text-muted mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-hairline rounded-xl p-5">
          <h3 className="font-semibold text-ink mb-4">By AI tool</h3>
          <div className="space-y-3">
            {Object.entries(byTool).sort((a,b)=>b[1]-a[1]).map(([tool,count]) => {
              const c=TOOL_COLORS[tool]; const pct=Math.round((count/PROVENANCE.length)*100);
              return (<div key={tool} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className={`font-medium ${c?.text??'text-gray-600'}`}>{tool}</span><span className="text-muted">{count} · {pct}%</span></div>
                <div className="h-1.5 bg-hairline rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${pct}%`,background:c?.dot??'#888'}} /></div>
              </div>);
            })}
          </div>
        </div>
        <div className="bg-white border border-hairline rounded-xl p-5">
          <h3 className="font-semibold text-ink mb-4">Requirements status</h3>
          <div className="space-y-3">
            {[['done','Done'],['in_progress','In Progress'],['todo','Todo'],['backlog','Backlog']].map(([s,label]) => {
              const count=byStatus[s]??0; const pct=Math.round((count/REQUIREMENTS.length)*100);
              return (<div key={s} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="font-medium text-ink">{label}</span><span className="text-muted">{count}</span></div>
                <div className="h-1.5 bg-hairline rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{width:`${pct}%`}} /></div>
              </div>);
            })}
          </div>
        </div>
      </div>
      <div className="bg-white border border-hairline rounded-xl p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-ink">Recent provenance</h3><button onClick={()=>setView('provenance')} className="text-xs text-amber-600 hover:underline">View all →</button></div>
        <div className="space-y-2">
          {[...PROVENANCE].sort((a,b)=>new Date(b.commit.date).getTime()-new Date(a.commit.date).getTime()).slice(0,5).map((r,i)=>{
            const req=REQUIREMENTS.find(q=>q.id===r.requirementId); const c=TOOL_COLORS[r.aiSession?.tool??''];
            return (<div key={r.id} className="flex items-center gap-3 py-2 border-b border-hairline last:border-0">
              <div className="size-2 rounded-full shrink-0" style={{background:TRACK_COLORS[i%TRACK_COLORS.length]}} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">{targetIcon(r)}<span className="text-sm font-mono font-medium text-ink truncate">{targetLabel(r)}</span></div>
                <p className="text-xs text-muted">{req?.id} · {req?.title}</p>
              </div>
              {r.aiSession&&<span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${c?.bg??''} ${c?.text??'text-gray-600'}`}>{r.aiSession.tool}</span>}
              <span className="text-xs text-muted shrink-0">{timeAgo(r.commit.date)}</span>
            </div>);
          })}
        </div>
      </div>
    </div>
  );
}

// ── Requirements ───────────────────────────────────────────────────────────────
function Requirements({ onSelect }: { onSelect: (r: Requirement) => void }) {
  const [search,setSearch]=useState(''); const [sf,setSf]=useState('all');
  const filtered=REQUIREMENTS.filter(r=>(sf==='all'||r.status===sf)&&(r.title.toLowerCase().includes(search.toLowerCase())||r.id.toLowerCase().includes(search.toLowerCase())));
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-hairline">
        <h2 className="font-bold text-ink text-lg flex-1">Requirements</h2>
        <div className="flex items-center gap-2 bg-white border border-hairline rounded-lg px-3 py-1.5">
          <Search className="size-3.5 text-muted" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="bg-transparent text-sm outline-none w-40 text-ink placeholder:text-muted" />
        </div>
        <div className="flex gap-1">
          {['all','backlog','todo','in_progress','done'].map(s=>(
            <button key={s} onClick={()=>setSf(s)} className={`text-xs px-2.5 py-1 rounded-full capitalize transition-colors ${sf===s?'bg-amber-500 text-white':'bg-hairline text-muted hover:text-ink'}`}>{s==='all'?'All':s.replace('_',' ')}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b border-hairline">
            <tr>{['ID','Title','Status','Priority','Code'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.map(req=>{
              const linked=PROVENANCE.filter(p=>p.requirementId===req.id);
              return (<tr key={req.id} onClick={()=>onSelect(req)} className="hover:bg-amber-50/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><span className="font-mono text-xs font-bold text-amber-600">{req.id}</span></td>
                <td className="px-4 py-3"><span className="font-medium text-ink">{req.title}</span></td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[req.status]}`}>{req.status.replace('_',' ')}</span></td>
                <td className="px-4 py-3"><span className={`text-xs capitalize ${PRIORITY_COLORS[req.priority]}`}>{req.priority}</span></td>
                <td className="px-4 py-3">{linked.length>0?<span className="text-xs font-medium text-emerald-600">⬡ {linked.length} linked</span>:<span className="text-xs text-muted">—</span>}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Provenance timeline ────────────────────────────────────────────────────────
function ProvenanceTimeline({ onSelect }: { onSelect: (r: ProvenanceRecord) => void }) {
  const [search,setSearch]=useState('');
  const sorted=[...PROVENANCE].sort((a,b)=>new Date(b.commit.date).getTime()-new Date(a.commit.date).getTime()).filter(r=>!search||targetLabel(r).toLowerCase().includes(search.toLowerCase())||r.requirementId.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-hairline">
        <h2 className="font-bold text-ink text-lg flex-1">⬡ Provenance</h2>
        <div className="flex items-center gap-2 bg-white border border-hairline rounded-lg px-3 py-1.5">
          <Search className="size-3.5 text-muted" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search functions…" className="bg-transparent text-sm outline-none w-44 text-ink placeholder:text-muted" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b border-hairline">
            <tr>{['','Target','Requirement','AI Session','Commit','Date'].map(h=><th key={h} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted ${h===''?'w-8':''}`}>{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {sorted.map((r,i)=>{
              const req=REQUIREMENTS.find(q=>q.id===r.requirementId); const c=TOOL_COLORS[r.aiSession?.tool??''];
              return (<tr key={r.id} onClick={()=>onSelect(r)} className="hover:bg-amber-50/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="size-2 rounded-full" style={{background:TRACK_COLORS[i%TRACK_COLORS.length]}} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.target.kind==='function'?'bg-blue-50 text-blue-600':r.target.kind==='file'?'bg-emerald-50 text-emerald-600':'bg-amber-50 text-amber-600'}`}>{r.target.kind}</span>
                    <div><p className="font-mono font-medium text-ink">{targetLabel(r)}</p><p className="text-xs text-muted truncate max-w-48">{targetSub(r)}</p></div>
                  </div>
                </td>
                <td className="px-4 py-3"><p className="text-xs font-bold text-amber-600">{req?.id}</p><p className="text-xs text-muted truncate max-w-40">{req?.title}</p></td>
                <td className="px-4 py-3">{r.aiSession&&<span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c?.bg??'bg-gray-50 border-gray-200'} ${c?.text??'text-gray-600'}`}>{r.aiSession.tool} · {r.aiSession.messages.length} msgs</span>}</td>
                <td className="px-4 py-3"><code className="text-xs bg-surface-2 px-1.5 py-0.5 rounded font-mono text-muted">{r.commit.sha}</code><p className="text-xs text-muted truncate max-w-36 mt-0.5">{r.commit.message}</p></td>
                <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{timeAgo(r.commit.date)}</td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── AI Sessions ────────────────────────────────────────────────────────────────
function AISessions({ onSelect }: { onSelect: (r: ProvenanceRecord) => void }) {
  const byTool=PROVENANCE.filter(r=>r.aiSession).reduce<Record<string,ProvenanceRecord[]>>((acc,r)=>{const t=r.aiSession!.tool;if(!acc[t])acc[t]=[];acc[t].push(r);return acc;},{});
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div><h2 className="font-bold text-ink text-lg">AI Sessions</h2><p className="text-muted text-sm mt-1">Conversation history for every AI-generated function</p></div>
      {Object.entries(byTool).map(([tool,records])=>{
        const c=TOOL_COLORS[tool];
        return (<div key={tool} className="bg-white border border-hairline rounded-xl overflow-hidden">
          <div className={`px-5 py-3 border-b border-hairline flex items-center gap-3 ${c?.bg??''}`}>
            <Bot className={`size-4 ${c?.text??'text-gray-600'}`} /><span className={`font-semibold ${c?.text??'text-gray-600'}`}>{tool}</span><span className="text-xs text-muted ml-auto">{records.length} sessions</span>
          </div>
          <div className="divide-y divide-hairline">
            {records.map(r=>{
              const req=REQUIREMENTS.find(q=>q.id===r.requirementId);
              return (<div key={r.id} onClick={()=>onSelect(r)} className="px-5 py-4 hover:bg-amber-50/30 cursor-pointer transition-colors">
                <div className="flex items-start gap-3">
                  {targetIcon(r)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1"><span className="font-mono font-medium text-sm text-ink">{targetLabel(r)}</span><span className="text-xs text-amber-600 font-bold">{req?.id}</span><span className="text-xs text-muted ml-auto">{r.aiSession!.messages.length} msgs · {fmtDate(r.aiSession!.date)}</span></div>
                    <p className="text-xs text-muted italic line-clamp-1">"{r.aiSession!.messages[0].content}"</p>
                    {r.aiSession!.keyPoints&&<div className="flex flex-wrap gap-1 mt-2">{r.aiSession!.keyPoints.slice(0,3).map((kp,i)=><span key={i} className="text-[10px] bg-surface-2 text-muted px-2 py-0.5 rounded-full">{kp}</span>)}</div>}
                  </div>
                </div>
              </div>);
            })}
          </div>
        </div>);
      })}
    </div>
  );
}

// ── Provenance drawer ──────────────────────────────────────────────────────────
function ProvenanceDrawer({ record, req, onClose }: { record: ProvenanceRecord; req: Requirement|undefined; onClose: () => void }) {
  const [convOpen,setConvOpen]=useState(true);
  const c=TOOL_COLORS[record.aiSession?.tool??''];
  return (
    <div className="w-96 shrink-0 border-l border-hairline bg-white flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
        <div className="flex items-center gap-2 min-w-0">{targetIcon(record)}<span className="font-mono font-semibold text-ink truncate">{targetLabel(record)}</span></div>
        <button onClick={onClose} className="p-1 hover:bg-hairline rounded shrink-0"><X className="size-4 text-muted" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-4 border-b border-hairline"><p className="text-xs font-mono text-muted">{targetSub(record)}</p>{record.target.kind==='files'&&<ul className="mt-2 space-y-1">{record.target.filePaths.map((fp,i)=><li key={i} className="text-xs font-mono text-ink bg-surface-2 px-2 py-1 rounded">{fp}</li>)}</ul>}</div>
        <div className="px-5 py-4 border-b border-hairline">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Requirement</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-amber-700">{req?.id}</span><span className={`text-xs px-1.5 py-0.5 rounded capitalize ${STATUS_COLORS[req?.status??'backlog']}`}>{req?.status?.replace('_',' ')}</span></div>
            <p className="text-sm font-medium text-ink">{req?.title}</p>
          </div>
        </div>
        {record.aiSession&&(
          <div className="px-5 py-4 border-b border-hairline space-y-3">
            <div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted flex-1">AI Session</p><span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${c?.bg??''} ${c?.text??''}`}>{record.aiSession.tool}</span><span className="text-xs text-muted">{fmtDate(record.aiSession.date)}</span></div>
            <button onClick={()=>setConvOpen(!convOpen)} className="flex items-center gap-1.5 text-xs text-amber-600 hover:underline">{convOpen?<ChevronDown className="size-3"/>:<ChevronRight className="size-3"/>}Conversation ({record.aiSession.messages.length} messages)</button>
            {convOpen&&<div className="space-y-2">{record.aiSession.messages.map((m,i)=>(
              <div key={i} className={`rounded-lg px-3 py-2.5 text-xs leading-relaxed ${m.role==='user'?'bg-surface-2 border border-hairline':'bg-amber-50/60 border border-amber-100'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">{m.role==='user'?'👤 You':`🤖 ${record.aiSession!.tool}`}</p>
                <p className="text-ink">{m.content}</p>
              </div>
            ))}</div>}
            {record.aiSession.keyPoints?.length&&<div><p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Key points</p><ul className="space-y-1">{record.aiSession.keyPoints.map((kp,i)=><li key={i} className="flex items-start gap-1.5 text-xs text-ink"><span className="text-amber-500 mt-0.5 shrink-0">·</span>{kp}</li>)}</ul></div>}
            {record.aiSession.constraints?.length&&<div><p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Constraints</p><ul className="space-y-1">{record.aiSession.constraints.map((c,i)=><li key={i} className="flex items-start gap-1.5 text-xs text-ink"><span className="text-red-400 mt-0.5 shrink-0">·</span>{c}</li>)}</ul></div>}
            {record.aiSession.decisions?.length&&<div><p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">Decisions</p><ul className="space-y-1">{record.aiSession.decisions.map((d,i)=><li key={i} className="flex items-start gap-1.5 text-xs text-ink"><span className="text-emerald-500 mt-0.5 shrink-0">·</span>{d}</li>)}</ul></div>}
          </div>
        )}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Commit</p>
          <div className="bg-surface-2 border border-hairline rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1.5"><GitCommit className="size-3.5 text-muted"/><code className="text-xs font-mono text-muted">{record.commit.sha}</code><span className="text-xs text-muted ml-auto">{fmtDate(record.commit.date)}</span></div>
            <p className="text-sm font-medium text-ink">{record.commit.message}</p>
            <p className="text-xs text-muted mt-1">{record.commit.author}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-hairline bg-surface-2"><p className="text-xs text-muted flex items-center gap-1.5"><span className="text-amber-500">⬡</span>Open in VS Code extension to see inline annotations</p></div>
    </div>
  );
}

// ── Requirement drawer ─────────────────────────────────────────────────────────
function RequirementDrawer({ req, onClose, onProvenanceSelect }: { req: Requirement; onClose: () => void; onProvenanceSelect: (r: ProvenanceRecord) => void }) {
  const linked=PROVENANCE.filter(p=>p.requirementId===req.id);
  return (
    <div className="w-96 shrink-0 border-l border-hairline bg-white flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
        <div><span className="font-mono text-xs font-bold text-amber-600">{req.id}</span><p className="font-semibold text-ink">{req.title}</p></div>
        <button onClick={onClose} className="p-1 hover:bg-hairline rounded"><X className="size-4 text-muted" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="flex gap-3">
          <span className={`text-xs px-2 py-0.5 rounded capitalize ${STATUS_COLORS[req.status]}`}>{req.status.replace('_',' ')}</span>
          <span className={`text-xs capitalize ${PRIORITY_COLORS[req.priority]}`}>{req.priority} priority</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Linked code ({linked.length})</p>
          {linked.length===0?(
            <div className="text-center py-8 border-2 border-dashed border-hairline rounded-xl"><p className="text-2xl mb-2">⬡</p><p className="text-sm text-muted">No code linked yet</p><p className="text-xs text-muted mt-1 max-w-48 mx-auto">Install the VS Code extension to track which functions implement this requirement</p></div>
          ):(
            <div className="space-y-2">{linked.map(r=>{const c=TOOL_COLORS[r.aiSession?.tool??''];return(<div key={r.id} onClick={()=>onProvenanceSelect(r)} className="border border-hairline rounded-lg p-3 hover:border-amber-300 hover:bg-amber-50/30 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 mb-1.5">{targetIcon(r)}<span className="font-mono text-sm font-medium text-ink">{targetLabel(r)}</span>{r.aiSession&&<span className={`text-[10px] ml-auto px-1.5 py-0.5 rounded-full border ${c?.bg} ${c?.text}`}>{r.aiSession.tool}</span>}</div>
              <p className="text-xs text-muted">{targetSub(r)}</p>
              <div className="flex items-center gap-2 mt-2"><code className="text-[10px] font-mono bg-surface-2 px-1.5 py-0.5 rounded">{r.commit.sha}</code><span className="text-[10px] text-muted">{timeAgo(r.commit.date)}</span></div>
            </div>);})}
          </div>)}
        </div>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [view,setView]=useState('overview');
  const [selectedP,setSelectedP]=useState<ProvenanceRecord|null>(null);
  const [selectedR,setSelectedR]=useState<Requirement|null>(null);
  const handleP=(r: ProvenanceRecord)=>{setSelectedP(r);setSelectedR(null);};
  const handleR=(r: Requirement)=>{setSelectedR(r);setSelectedP(null);};
  return (
    <div className="h-screen flex overflow-hidden bg-surface-2 text-ink">
      <Sidebar view={view} setView={v=>{setView(v);setSelectedP(null);setSelectedR(null);}} />
      <main className="flex-1 flex overflow-hidden bg-surface-2">
        {view==='overview'&&<Overview setView={setView}/>}
        {view==='requirements'&&<Requirements onSelect={handleR}/>}
        {view==='provenance'&&<ProvenanceTimeline onSelect={handleP}/>}
        {view==='ai-sessions'&&<AISessions onSelect={handleP}/>}
        {selectedP&&<ProvenanceDrawer record={selectedP} req={REQUIREMENTS.find(r=>r.id===selectedP.requirementId)} onClose={()=>setSelectedP(null)}/>}
        {selectedR&&<RequirementDrawer req={selectedR} onClose={()=>setSelectedR(null)} onProvenanceSelect={handleP}/>}
      </main>
    </div>
  );
}
