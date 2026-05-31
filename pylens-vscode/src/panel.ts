import * as vscode from 'vscode';
import { esc, safeUrl } from './html';
import { store } from './store';
import { ProvenanceRecord } from './types';

const TOOL_COLORS: Record<string, { bg: string; fg: string; track: string }> = {
  'Cursor':         { bg: 'rgba(0,122,204,0.15)',  fg: '#4fc3f7', track: '#007ACC' },
  'Claude':         { bg: 'rgba(217,119,6,0.15)',  fg: '#fbbf24', track: '#D97706' },
  'GitHub Copilot': { bg: 'rgba(109,40,217,0.15)', fg: '#c4b5fd', track: '#6D28D9' },
  'ChatGPT':        { bg: 'rgba(5,150,105,0.15)',  fg: '#6ee7b7', track: '#059669' },
};
const DEFAULT_COLOR = { bg: 'rgba(107,114,128,0.12)', fg: '#9ca3af', track: '#6B7280' };
const TRACK_COLORS = ['#007ACC','#D97706','#6D28D9','#059669','#DC2626','#0891B2'];

function toolColor(tool: string | undefined) { return TOOL_COLORS[tool ?? ''] ?? DEFAULT_COLOR; }
function timeAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return 'today'; if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`; if (days < 30) return `${Math.floor(days/7)}w ago`;
  if (days < 365) return `${Math.floor(days/30)}mo ago`; return `${Math.floor(days/365)}y ago`;
}
function fmt(d: string) { return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

export class PyLensPanelProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'pylens.panel';
  private _view?: vscode.WebviewView;

  resolveWebviewView(webviewView: vscode.WebviewView, _c: vscode.WebviewViewResolveContext, _t: vscode.CancellationToken) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._buildHtml();
    webviewView.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'open') vscode.commands.executeCommand('pylens.showProvenance', msg.record as ProvenanceRecord);
    });
  }

  private _buildHtml(): string {
    const records = store.getAllRecords().sort((a,b) => new Date(b.commit.date).getTime() - new Date(a.commit.date).getTime());
    const tracked = records.length;
    const withAI = records.filter(r => r.aiSession).length;
    const reqCount = new Set(records.map(r => r.requirement.id)).size;
    const tools = [...new Set(records.map(r => r.aiSession?.tool ?? 'Unknown'))];

    const kindIcon = (r: ProvenanceRecord) => r.target.kind === 'function' ? 'fn' : r.target.kind === 'file' ? 'file' : 'files';
    const kindLabel = (r: ProvenanceRecord) => {
      if (r.target.kind === 'function') return `${r.target.functionName}()`;
      if (r.target.kind === 'file') return r.target.label ?? r.target.filePath;
      return r.target.label;
    };
    const kindSub = (r: ProvenanceRecord) => {
      if (r.target.kind === 'function') return r.target.filePath;
      if (r.target.kind === 'file') return r.target.filePath;
      return r.target.filePaths.join(', ');
    };

    const prefixTrack = new Map<string,number>(); let ti = 0;
    for (const r of records) { const p = r.requirement.id.replace(/-\d+$/,''); if (!prefixTrack.has(p)) prefixTrack.set(p, ti++ % TRACK_COLORS.length); }

    const toolBtns = ['All',...tools].map(t =>
      `<button class="filter-btn${t==='All'?' active':''}" data-tool="${t}">${t}</button>`).join('');

    const rows = records.map((r, i) => {
      const c = toolColor(r.aiSession?.tool);
      const tc = TRACK_COLORS[prefixTrack.get(r.requirement.id.replace(/-\d+$/,'')) ?? 0];
      const isLast = i === records.length - 1;
      const msgCount = r.aiSession?.messages?.length ?? 0;
      const reqUrl = safeUrl(r.requirement.url);
      return `<tr class="row" data-tool="${esc(r.aiSession?.tool??'Unknown')}" data-idx="${i}"
          data-record='${JSON.stringify(r).replace(/'/g,'&#39;')}'>
        <td class="td-graph">
          <div class="track-wrap">
            ${i>0?`<div class="track-line" style="background:${tc};top:0;height:50%"></div>`:''}
            <div class="track-dot" style="background:${tc};box-shadow:0 0 0 3px ${tc}22"></div>
            ${!isLast?`<div class="track-line" style="background:${tc};top:50%;height:50%"></div>`:''}
          </div>
        </td>
        <td class="td-fn">
          <span class="kind-badge kind-${r.target.kind}">${kindIcon(r)}</span>
          <span class="fn-mono">${esc(kindLabel(r))}</span>
          <span class="fn-path">${esc(kindSub(r))}</span>
        </td>
        <td class="td-req">
          ${reqUrl?`<a class="req-id" href="${reqUrl}" target="_blank">${esc(r.requirement.id)}</a>`:`<span class="req-id">${esc(r.requirement.id)}</span>`}
          <span class="req-title">${esc(r.requirement.title)}</span>
        </td>
        <td class="td-ai">
          <span class="tool-pill" style="background:${c.bg};color:${c.fg}">${esc(r.aiSession?.tool??'—')}</span>
          ${msgCount?`<span class="msg-count">${msgCount} msgs</span>`:''}
        </td>
        <td class="td-commit">
          <code class="sha">${esc(r.commit.sha)}</code>
          <span class="commit-msg">${esc(r.commit.message)}</span>
        </td>
        <td class="td-date">
          <span class="date-main">${esc(timeAgo(r.commit.date))}</span>
          <span class="date-full">${esc(fmt(r.commit.date))}</span>
        </td>
      </tr>`;
    }).join('');

    // Pre-render conversation detail panels for all records
    const detailPanels = records.map((r, i) => {
      const ai = r.aiSession;
      const c = toolColor(ai?.tool);
      const msgs = (ai?.messages ?? []).map(m => {
        const isUser = m.role === 'user';
        return `<div class="msg msg-${isUser ? 'user' : 'assistant'}">
          <div class="msg-role">${isUser ? '👤 You' : `🤖 ${esc(ai?.tool)}`}</div>
          <div class="msg-content">${esc(m.content)}</div>
        </div>`;
      }).join('');

      const kp = (ai?.keyPoints ?? []).map(k => `<li>${esc(k)}</li>`).join('');
      const cs = (ai?.constraints ?? []).map(k => `<li>${esc(k)}</li>`).join('');
      const ds = (ai?.decisions ?? []).map(k => `<li>${esc(k)}</li>`).join('');

      return `<div class="detail" id="detail-${i}" style="display:none">
        <div class="detail-header">
          <div class="detail-fn"><span class="kind-badge kind-${r.target.kind}">${kindIcon(r)}</span>${esc(kindLabel(r))}</div>
          <div class="detail-meta">
            <span class="tool-pill" style="background:${c.bg};color:${c.fg}">${esc(ai?.tool??'—')}</span>
            <span class="detail-date">${ai ? esc(fmt(ai.date)) : ''}</span>
          </div>
        </div>

        ${msgs ? `<div class="section-label">Conversation</div><div class="conv">${msgs}</div>` : ''}

        ${kp ? `<div class="section-label">Key points</div><ul class="detail-list kp">${kp}</ul>` : ''}
        ${cs ? `<div class="section-label">Constraints</div><ul class="detail-list cs">${cs}</ul>` : ''}
        ${ds ? `<div class="section-label">Decisions</div><ul class="detail-list ds">${ds}</ul>` : ''}

        <div class="section-label">Commit</div>
        <div class="commit-card">
          <div><code class="sha">${esc(r.commit.sha)}</code> <span class="detail-date">${esc(fmt(r.commit.date))} · ${esc(r.commit.author)}</span></div>
          <div class="commit-msg-full">${esc(r.commit.message)}</div>
        </div>

        <div class="open-btn-wrap">
          <button class="open-btn" data-idx="${i}">Open in sidebar →</button>
        </div>
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
html,body{height:100%;overflow:hidden;}
body{font-family:var(--vscode-font-family);font-size:13px;color:var(--vscode-foreground);background:var(--vscode-panel-background,var(--vscode-editor-background));display:flex;flex-direction:column;}

/* toolbar */
.toolbar{display:flex;align-items:center;gap:10px;padding:7px 14px;border-bottom:1px solid var(--vscode-panel-border);flex-shrink:0;flex-wrap:wrap;}
.logo{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;display:flex;align-items:center;gap:6px;}
.logo-icon{color:#D97706;}
.stats-row{display:flex;gap:16px;}
.stat{display:flex;align-items:baseline;gap:4px;}
.stat-num{font-size:16px;font-weight:700;}
.stat-label{font-size:10px;color:var(--vscode-descriptionForeground);}
.sep{width:1px;height:18px;background:var(--vscode-panel-border);}
.filters{display:flex;gap:4px;flex-wrap:wrap;}
.filter-btn{font-family:inherit;font-size:11px;padding:2px 8px;border-radius:3px;border:1px solid var(--vscode-widget-border);background:transparent;color:var(--vscode-descriptionForeground);cursor:pointer;}
.filter-btn:hover{color:var(--vscode-foreground);border-color:var(--vscode-focusBorder);}
.filter-btn.active{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border-color:var(--vscode-button-background);}
.search{margin-left:auto;}
.search input{font-family:inherit;font-size:12px;background:var(--vscode-input-background);color:var(--vscode-input-foreground);border:1px solid var(--vscode-input-border,var(--vscode-widget-border));border-radius:3px;padding:3px 8px;outline:none;width:150px;}
.search input:focus{border-color:var(--vscode-focusBorder);}

/* split */
.split{flex:1;display:flex;overflow:hidden;}
.left{flex:1;overflow-y:auto;min-width:0;}
.divider-v{width:1px;background:var(--vscode-panel-border);flex-shrink:0;}
.right{width:340px;flex-shrink:0;overflow-y:auto;background:var(--vscode-editor-background);}
.right-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;color:var(--vscode-descriptionForeground);font-size:12px;text-align:center;padding:24px;}
.right-empty-icon{font-size:24px;}

/* table */
table{width:100%;border-collapse:collapse;}
thead tr{position:sticky;top:0;z-index:5;background:var(--vscode-panel-background,var(--vscode-editor-background));}
th{padding:5px 10px 5px 6px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--vscode-descriptionForeground);text-align:left;border-bottom:1px solid var(--vscode-panel-border);white-space:nowrap;}
th:first-child{width:26px;padding-left:10px;}
.row{cursor:pointer;}
.row:hover td{background:var(--vscode-list-hoverBackground);}
.row.selected td{background:var(--vscode-list-activeSelectionBackground);color:var(--vscode-list-activeSelectionForeground);}
.row.hidden{display:none;}
td{padding:7px 10px 7px 6px;border-bottom:1px solid var(--vscode-widget-border,rgba(255,255,255,.05));vertical-align:middle;}

/* track */
.td-graph{width:26px;padding:0 0 0 10px!important;position:relative;}
.track-wrap{position:absolute;inset:0;left:10px;display:flex;flex-direction:column;align-items:center;}
.track-line{width:2px;position:absolute;left:50%;transform:translateX(-50%);}
.track-dot{width:8px;height:8px;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1;}

/* cells */
.td-fn{min-width:140px;}
.kind-badge{font-size:9px;font-weight:700;letter-spacing:.04em;padding:1px 5px;border-radius:3px;margin-right:5px;vertical-align:middle;}
.kind-function{background:rgba(0,122,204,.15);color:#4fc3f7;}
.kind-file{background:rgba(16,185,129,.15);color:#6ee7b7;}
.kind-files{background:rgba(245,158,11,.15);color:#fbbf24;}
.fn-mono{display:inline;font-family:var(--vscode-editor-font-family);font-size:12px;font-weight:500;}
.fn-path{display:block;font-size:10px;color:var(--vscode-descriptionForeground);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;}
.td-req{max-width:180px;}
.req-id{display:block;font-size:10px;font-weight:700;color:var(--vscode-textLink-foreground);text-decoration:none;margin-bottom:2px;}
.req-id:hover{text-decoration:underline;}
.req-title{display:block;font-size:11px;color:var(--vscode-descriptionForeground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.td-ai{white-space:nowrap;}
.tool-pill{font-size:10px;font-weight:600;padding:2px 7px;border-radius:10px;}
.msg-count{display:block;font-size:10px;color:var(--vscode-descriptionForeground);margin-top:3px;}
.td-commit{max-width:180px;}
.sha{font-size:10px;background:var(--vscode-textCodeBlock-background);padding:1px 5px;border-radius:3px;}
.commit-msg{display:block;font-size:10px;color:var(--vscode-descriptionForeground);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;}
.td-date{white-space:nowrap;}
.date-main{display:block;font-size:11px;}
.date-full{display:block;font-size:10px;color:var(--vscode-descriptionForeground);margin-top:2px;}

/* detail panel */
.detail{padding:14px;}
.detail-header{margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--vscode-widget-border);}
.detail-fn{font-family:var(--vscode-editor-font-family);font-size:13px;font-weight:600;margin-bottom:6px;}
.detail-meta{display:flex;align-items:center;gap:8px;}
.detail-date{font-size:11px;color:var(--vscode-descriptionForeground);}
.section-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--vscode-descriptionForeground);margin:14px 0 8px;}
.section-label:first-of-type{margin-top:0;}

/* conversation */
.conv{display:flex;flex-direction:column;gap:8px;}
.msg{border-radius:6px;padding:8px 10px;}
.msg-user{background:var(--vscode-editor-background);border:1px solid var(--vscode-widget-border);}
.msg-assistant{background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.2);}
.msg-role{font-size:10px;font-weight:600;color:var(--vscode-descriptionForeground);margin-bottom:5px;}
.msg-content{font-size:12px;line-height:1.5;}

/* lists */
.detail-list{padding-left:16px;}
.detail-list li{font-size:12px;line-height:1.6;color:var(--vscode-foreground);}
.kp li::marker{color:#D97706;}
.cs li::marker{color:#DC2626;}
.ds li::marker{color:#059669;}

/* commit card */
.commit-card{background:var(--vscode-editor-background);border:1px solid var(--vscode-widget-border);border-radius:4px;padding:9px 11px;}
.commit-msg-full{font-size:12px;color:var(--vscode-descriptionForeground);margin-top:5px;}

/* open btn */
.open-btn-wrap{margin-top:16px;}
.open-btn{font-family:inherit;font-size:12px;padding:6px 14px;border-radius:3px;border:1px solid var(--vscode-widget-border);background:transparent;color:var(--vscode-foreground);cursor:pointer;width:100%;}
.open-btn:hover{background:var(--vscode-button-background);color:var(--vscode-button-foreground);border-color:var(--vscode-button-background);}

::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--vscode-scrollbarSlider-background);border-radius:3px;}
a{color:var(--vscode-textLink-foreground);}
</style>
</head>
<body>

<div class="toolbar">
  <div class="logo"><span class="logo-icon">⬡</span>PyLens</div>
  <div class="sep"></div>
  <div class="stats-row">
    <div class="stat"><span class="stat-num">${tracked}</span><span class="stat-label">tracked</span></div>
    <div class="stat"><span class="stat-num">${withAI}</span><span class="stat-label">AI sessions</span></div>
    <div class="stat"><span class="stat-num">${reqCount}</span><span class="stat-label">requirements</span></div>
  </div>
  <div class="sep"></div>
  <div class="filters">${toolBtns}</div>
  <div class="search"><input id="search" type="text" placeholder="Search…" spellcheck="false"></div>
</div>

<div class="split">
  <div class="left">
    <table>
      <thead><tr>
        <th></th><th>Function</th><th>Requirement</th><th>AI Session</th><th>Commit</th><th>Date</th>
      </tr></thead>
      <tbody id="tbody">${rows}</tbody>
    </table>
  </div>
  <div class="divider-v"></div>
  <div class="right" id="right">
    <div class="right-empty" id="right-empty">
      <div class="right-empty-icon">⬡</div>
      <div>Click a function to see its AI conversation history</div>
    </div>
    ${detailPanels}
  </div>
</div>

<script>
const vscode = acquireVsCodeApi();
let activeTool = 'All', searchTerm = '', activeIdx = -1;
const records = ${JSON.stringify(records)};

function applyFilters() {
  let visible = 0;
  document.querySelectorAll('.row').forEach(row => {
    const tool = row.dataset.tool ?? '';
    const text = row.textContent.toLowerCase();
    const hide = (activeTool !== 'All' && tool !== activeTool) || (searchTerm && !text.includes(searchTerm));
    row.classList.toggle('hidden', hide);
    if (!hide) visible++;
  });
}

function showDetail(idx) {
  document.querySelectorAll('.row').forEach(r => r.classList.remove('selected'));
  document.querySelectorAll(\`.row[data-idx="\${idx}"]\`).forEach(r => r.classList.add('selected'));
  document.getElementById('right-empty').style.display = 'none';
  document.querySelectorAll('.detail').forEach(d => d.style.display = 'none');
  const d = document.getElementById('detail-' + idx);
  if (d) d.style.display = 'block';
  activeIdx = idx;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTool = btn.dataset.tool;
    applyFilters();
  });
});

document.getElementById('search').addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase().trim();
  applyFilters();
});

document.querySelectorAll('.row').forEach(row => {
  row.addEventListener('click', () => showDetail(+row.dataset.idx));
});

document.querySelectorAll('.open-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = +btn.dataset.idx;
    vscode.postMessage({ command: 'open', record: records[idx] });
  });
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); document.getElementById('search').focus(); }
  if (e.key === 'Escape') document.getElementById('search').blur();
  if (e.key === 'ArrowDown' && activeIdx < records.length - 1) showDetail(activeIdx + 1);
  if (e.key === 'ArrowUp' && activeIdx > 0) showDetail(activeIdx - 1);
});
</script>
</body>
</html>`;
  }
}
