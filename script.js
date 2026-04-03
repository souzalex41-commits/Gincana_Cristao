let data = { teams: [], players: [], verses: [], niches: [], activities: [] };
const KEY = 'gincana_data';

function load() { 
  const s = localStorage.getItem(KEY); 
  if(s) {
    data = JSON.parse(s); 
    if (!data.activities) data.activities = [];
  }
  updateUI(); 
}

function save() { 
  localStorage.setItem(KEY, JSON.stringify(data)); 
  updateUI(); 
}

function genId() { return Math.random().toString(36).substr(2,9); }

function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.currentTarget.classList.add('active');
}

function updateUI() {
  // 1. Ranking de Equipes
  const ts = [...data.teams].sort((a,b) => b.score - a.score);
  document.getElementById('ranking-teams').innerHTML = ts.map((t,i) => `
    <div class="list-item ${i===0&&t.score>0?'leader':''}" style="border-left:4px solid ${t.color}">
      <div class="item-info"><h3>${i===0&&t.score>0?'👑 ':''}${t.name}</h3></div>
      <div class="score-controls">
        <button class="score-btn minus" onclick="updT('${t.id}',-1,event)">-1</button>
        <div class="score-display">${t.score}</div>
        <button class="score-btn" onclick="updT('${t.id}',1,event)">+1</button>
      </div>
    </div>`).join('') || '<p class="text-muted text-center">Vazio</p>';

  // 2. Ranking Individual
  const psIndiv = [...data.players].sort((a,b) => b.score - a.score);
  document.getElementById('ranking-individual').innerHTML = psIndiv.map((p,i) => {
    const t = data.teams.find(x => x.id === p.teamId);
    const tCol = t ? t.color : '#888';
    const tName = t ? t.name : 'Indiv';
    return `
    <div class="list-item ${i===0&&p.score>0?'leader':''}">
      <div class="item-info">
        <h3>${i===0&&p.score>0?'👑 ':''}${p.name}</h3>
        <span class="badge" style="color:${tCol};border:1px solid ${tCol}">${tName}</span>
      </div>
      <div class="score-controls">
        <button class="score-btn minus" onclick="updP('${p.id}',-1,event)">-1</button>
        <div class="score-display">${p.score}</div>
        <button class="score-btn" onclick="updP('${p.id}',1,event)">+1</button>
      </div>
    </div>`}).join('') || '<p class="text-muted text-center">Vazio</p>';

  // 3. Ranking Total
  const psTotal = data.players.map(p => {
    const t = data.teams.find(x => x.id === p.teamId);
    return { ...p, tScore: t?t.score:0, tot: p.score + (t?t.score:0), tName: t?t.name:'Indiv', tCol: t?t.color:'#888' };
  }).sort((a,b) => b.tot - a.tot);
  
  document.getElementById('ranking-total').innerHTML = psTotal.map((p,i) => `
    <div class="list-item ${i===0&&p.tot>0?'leader':''}">
      <div class="item-info">
        <h3>${i===0&&p.tot>0?'👑 ':''}${p.name}</h3>
        <span class="badge" style="color:${p.tCol};border:1px solid ${p.tCol}">${p.tName}</span>
      </div>
      <div class="score-controls">
        <div style="text-align:right;font-size:0.7rem;color:var(--text-muted);margin-right:5px;">Ind:${p.score}<br>Eqp:${p.tScore}</div>
        <div class="score-display">${p.tot}</div>
      </div>
    </div>`).join('') || '<p class="text-muted text-center">Vazio</p>';

  // Activities List
  document.getElementById('activities-list').innerHTML = data.activities.map(a => `
    <div class="list-item">
      <div class="item-info">
        <h3>${a.name}</h3>
        <p>${a.type === 'team' ? '👥 Equipe' : '🧑 Individual'} ${a.description ? '- ' + a.description : ''}</p>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-primary btn-sm" onclick="openActivity('${a.id}')">▶ Iniciar</button>
        <button class="btn btn-danger btn-sm" onclick="delActivity('${a.id}')">Excluir</button>
      </div>
    </div>
  `).join('') || '<p class="text-muted text-center">Nenhuma gincana cadastrada</p>';

  // Manage Teams
  document.getElementById('teams-list').innerHTML = data.teams.map(t => `
    <div class="list-item" style="border-left:4px solid ${t.color}">
      <div class="item-info"><h3>${t.name}</h3></div>
      <button class="btn btn-danger btn-sm" onclick="delT('${t.id}')">Excluir</button>
    </div>`).join('');
    
  // Manage Players
  document.getElementById('players-list').innerHTML = data.players.map(p => {
    const t = data.teams.find(x => x.id === p.teamId);
    return `<div class="list-item"><div class="item-info"><h3>${p.name}</h3><p>${t?t.name:'Indiv'}</p></div><button class="btn btn-danger btn-sm" onclick="delP('${p.id}')">Excluir</button></div>`;
  }).join('');

  // Update Selects
  const tOpts = '<option value="">Individual</option>' + data.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  const pt = document.getElementById('player-team'); const ptv = pt.value; pt.innerHTML = tOpts; pt.value = ptv;

  document.getElementById('verses-list').innerHTML = data.verses.map(v => `
    <div class="list-item"><div class="item-info"><h3 style="color:var(--gold)">${v.reference}</h3><p>"${v.text}"</p></div><button class="btn btn-danger btn-sm" onclick="delV('${v.id}')">Excluir</button></div>`).join('');

  const nOpts = '<option value="" disabled selected>Selecione...</option>' + data.niches.map(n => `<option value="${n.id}">${n.name}</option>`).join('');
  document.getElementById('item-niche-select').innerHTML = nOpts;
  document.getElementById('draw-niche-select').innerHTML = nOpts;

  document.getElementById('niches-list').innerHTML = data.niches.map(n => `
    <div class="card" style="margin-bottom:1rem;background:var(--bg);padding:1rem;">
      <div style="display:flex;justify-content:space-between;margin-bottom:1rem;"><h3 style="color:var(--secondary)">${n.name} <span class="badge">${n.items.length}</span></h3><button class="btn btn-danger btn-sm" onclick="delN('${n.id}')">Excluir</button></div>
      <div>${n.items.map(i => `<span style="display:inline-block;background:var(--surface);padding:0.2rem 0.5rem;border-radius:12px;margin:0.2rem;font-size:0.85rem;border:1px solid var(--border)">${i.name} <button style="background:none;border:none;color:var(--danger);cursor:pointer;font-weight:bold;margin-left:5px;" onclick="delNI('${n.id}','${i.id}')">×</button></span>`).join('')}</div>
    </div>`).join('');
}

// --- Score Logic ---
function updT(id, a, e) { 
  const t = data.teams.find(x=>x.id===id); 
  if(t){ 
    t.score=Math.max(0,t.score+a); 
    float(e,a); 
    save(); 
  } 
}
function updP(id, a, e) { 
  const p = data.players.find(x=>x.id===id); 
  if(p){ 
    p.score=Math.max(0,p.score+a); 
    float(e,a); 
    save(); 
  } 
}
function float(e, a) {
  if(!e) return; 
  const el = document.createElement('div'); 
  el.className = `floating-point ${a<0?'negative':''}`; 
  el.textContent = a>0?`+${a}`:a;
  const r = e.target.getBoundingClientRect(); 
  el.style.left = `${r.left+window.scrollX+10}px`; 
  el.style.top = `${r.top+window.scrollY-10}px`;
  document.body.appendChild(el); 
  setTimeout(()=>el.remove(), 1000);
}

// --- Activities Logic ---
let currentActivity = null;
let activeParticipants = [];

function addActivity(e) {
  e.preventDefault();
  const name = document.getElementById('act-name').value;
  const desc = document.getElementById('act-desc').value;
  const type = document.getElementById('act-type').value;
  
  data.activities.push({ id: genId(), name, description: desc, type });
  
  document.getElementById('act-name').value = '';
  document.getElementById('act-desc').value = '';
  save();
}

function delActivity(id) {
  customConfirm('Excluir esta gincana?', () => {
    data.activities = data.activities.filter(a => a.id !== id);
    save();
  });
}

function openActivity(id) {
  currentActivity = data.activities.find(a => a.id === id);
  if (!currentActivity) return;
  
  document.getElementById('activities-list-view').style.display = 'none';
  document.getElementById('activity-execution-view').style.display = 'block';
  document.getElementById('exec-setup').style.display = 'block';
  document.getElementById('exec-run').style.display = 'none';
  
  document.getElementById('exec-act-name').textContent = currentActivity.name;
  document.getElementById('exec-act-desc').textContent = currentActivity.description;
  
  const listEl = document.getElementById('exec-participants-list');
  if (currentActivity.type === 'team') {
    listEl.innerHTML = data.teams.map(t => `
      <label class="list-item participant-label" style="border-left:4px solid ${t.color}">
        <div class="item-info"><h3>${t.name}</h3></div>
        <input type="checkbox" value="${t.id}" class="participant-cb" checked>
      </label>
    `).join('') || '<p class="text-muted">Nenhuma equipe cadastrada.</p>';
  } else {
    listEl.innerHTML = data.players.map(p => {
      const t = data.teams.find(x => x.id === p.teamId);
      return `
      <label class="list-item participant-label" style="border-left:4px solid ${t ? t.color : '#888'}">
        <div class="item-info"><h3>${p.name}</h3><p>${t ? t.name : 'Indiv'}</p></div>
        <input type="checkbox" value="${p.id}" class="participant-cb" checked>
      </label>
    `}).join('') || '<p class="text-muted">Nenhum jogador cadastrado.</p>';
  }
}

function closeActivity() {
  currentActivity = null;
  document.getElementById('activities-list-view').style.display = 'block';
  document.getElementById('activity-execution-view').style.display = 'none';
}

function startActivityExecution() {
  const cbs = document.querySelectorAll('.participant-cb:checked');
  activeParticipants = Array.from(cbs).map(cb => cb.value);
  
  if (activeParticipants.length === 0) {
    showNotification('Selecione pelo menos um participante!', 'warning');
    return;
  }
  
  document.getElementById('exec-setup').style.display = 'none';
  document.getElementById('exec-run').style.display = 'block';
  
  renderExecution();
}

function renderExecution() {
  const container = document.getElementById('exec-active-participants');
  
  if (currentActivity.type === 'team') {
    const teams = data.teams.filter(t => activeParticipants.includes(t.id));
    container.innerHTML = teams.map(t => `
      <div class="card text-center" style="border-top: 4px solid ${t.color}">
        <h2 style="margin-bottom:0.5rem; font-size:1.5rem;">${t.name}</h2>
        <div class="score-display" style="font-size:4rem; margin-bottom:1rem;" id="exec-score-${t.id}">${t.score}</div>
        <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-danger btn-lg" style="width:auto;" onclick="execAddScore('${t.id}', -1, event)">-1</button>
          <button class="btn btn-primary btn-lg" style="width:auto;" onclick="execAddScore('${t.id}', 1, event)">+1</button>
          <button class="btn btn-secondary btn-lg" style="width:auto;" onclick="execAddScore('${t.id}', 5, event)">+5</button>
        </div>
      </div>
    `).join('');
  } else {
    const players = data.players.filter(p => activeParticipants.includes(p.id));
    container.innerHTML = players.map(p => {
      const t = data.teams.find(x => x.id === p.teamId);
      const color = t ? t.color : '#888';
      return `
      <div class="card text-center" style="border-top: 4px solid ${color}">
        <h2 style="margin-bottom:0.2rem; font-size:1.5rem;">${p.name}</h2>
        <p class="text-muted mb-1">${t ? t.name : 'Individual'}</p>
        <div class="score-display" style="font-size:4rem; margin-bottom:1rem;" id="exec-score-${p.id}">${p.score}</div>
        <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-danger btn-lg" style="width:auto;" onclick="execAddScore('${p.id}', -1, event)">-1</button>
          <button class="btn btn-primary btn-lg" style="width:auto;" onclick="execAddScore('${p.id}', 1, event)">+1</button>
          <button class="btn btn-secondary btn-lg" style="width:auto;" onclick="execAddScore('${p.id}', 5, event)">+5</button>
        </div>
      </div>
    `}).join('');
  }
}

function execAddScore(id, amount, event) {
  if (currentActivity.type === 'team') {
    updT(id, amount, event);
    const t = data.teams.find(x => x.id === id);
    if (t) document.getElementById(`exec-score-${id}`).textContent = t.score;
  } else {
    updP(id, amount, event);
    const p = data.players.find(x => x.id === id);
    if (p) document.getElementById(`exec-score-${id}`).textContent = p.score;
  }
}

// --- Manage Logic ---
function addTeam(e) { e.preventDefault(); const n = document.getElementById('team-name'); const c = document.getElementById('team-color'); data.teams.push({id:genId(),name:n.value,color:c.value,score:0}); n.value=''; c.value='#f97316'; save(); }
function addPlayer(e) { e.preventDefault(); const n = document.getElementById('player-name'); const t = document.getElementById('player-team'); data.players.push({id:genId(),name:n.value,teamId:t.value||null,score:0}); n.value=''; save(); }
function delT(id) { customConfirm('Excluir equipe?', () => { data.teams=data.teams.filter(x=>x.id!==id); data.players.forEach(p=>{if(p.teamId===id)p.teamId=null;}); save(); }); }
function delP(id) { customConfirm('Excluir jogador?', () => { data.players=data.players.filter(x=>x.id!==id); save(); }); }

// --- Verses Logic ---
function addVerse(e) { e.preventDefault(); const r = document.getElementById('verse-ref'); const t = document.getElementById('verse-text'); data.verses.push({id:genId(),reference:r.value,text:t.value}); r.value=''; t.value=''; save(); }
function delV(id) { customConfirm('Excluir versículo?', () => { data.verses=data.verses.filter(x=>x.id!==id); save(); }); }
function drawVerse() {
  if(!data.verses.length) return showNotification('Cadastre versículos ou use o botão de Demo!', 'warning');
  let c=0; const int = setInterval(()=>{
    const r = data.verses[Math.floor(Math.random()*data.verses.length)]; openM('Sorteando...', `"${r.text}"`, r.reference);
    if(++c>10){ clearInterval(int); const f = data.verses[Math.floor(Math.random()*data.verses.length)]; openM('📖 Sorteado!', `"${f.text}"`, f.reference); }
  }, 100);
}

// --- Niches Logic ---
function addNiche(e) { e.preventDefault(); const n = document.getElementById('niche-name'); data.niches.push({id:genId(),name:n.value,items:[]}); n.value=''; save(); }
function addNicheItem(e) { e.preventDefault(); const s = document.getElementById('item-niche-select'); const n = document.getElementById('item-name'); const nc = data.niches.find(x=>x.id===s.value); if(nc){ nc.items.push({id:genId(),name:n.value}); n.value=''; save(); } }
function delN(id) { customConfirm('Excluir nicho?', () => { data.niches=data.niches.filter(x=>x.id!==id); save(); }); }
function delNI(nId, iId) { customConfirm('Excluir este item do nicho?', () => { const n = data.niches.find(x=>x.id===nId); if(n){ n.items=n.items.filter(x=>x.id!==iId); save(); } }); }
function drawNicheItem() {
  const s = document.getElementById('draw-niche-select').value;
  const n = data.niches.find(x=>x.id===s);
  if(!n || !n.items.length) return showNotification('Selecione um nicho com itens!', 'warning');
  let c=0; const int = setInterval(()=>{
    const i = n.items[Math.floor(Math.random()*n.items.length)]; openM('Sorteando...', i.name, n.name);
    if(++c>10){ clearInterval(int); const f = n.items[Math.floor(Math.random()*n.items.length)]; openM('🎯 Sorteado!', f.name, n.name); }
  }, 100);
}

// --- Timer Logic ---
let tInt, tLeft=0;
function fmtT(s) { const m=Math.floor(s/60); const ss=s%60; return `${m.toString().padStart(2,'0')}:${ss.toString().padStart(2,'0')}`; }
function updateT() { document.getElementById('timer-display').textContent = fmtT(tLeft); }
function setTimer(s) { clearInterval(tInt); tLeft=s; updateT(); }
function setCustomTimer() { const v = document.getElementById('custom-time').value; if(v>0) setTimer(parseInt(v)); }
function startTimer() { if(tLeft<=0)return; clearInterval(tInt); tInt=setInterval(()=>{ tLeft--; updateT(); if(tLeft<=0){ clearInterval(tInt); showNotification('⏱️ Tempo esgotado!', 'danger'); } },1000); }
function pauseTimer() { clearInterval(tInt); }
function resetTimer() { clearInterval(tInt); tLeft=0; updateT(); }

// --- Modal Logic ---
function openM(t, b, r='') { document.getElementById('modal-title').textContent=t; document.getElementById('modal-body').textContent=b; document.getElementById('modal-ref').textContent=r; document.getElementById('modal').classList.add('active'); }
function closeModal() { document.getElementById('modal').classList.remove('active'); }

function openInputM() {
  document.getElementById('input-modal').classList.add('active');
  document.getElementById('input-modal-confirm').onclick = () => {
    const count = parseInt(document.getElementById('input-modal-field').value);
    if (count > 0 && count <= 50) {
      generateDemoVerses(count);
      closeInputM();
    } else {
      showNotification('Por favor, escolha entre 1 e 50.', 'warning');
    }
  };
}
function closeInputM() { document.getElementById('input-modal').classList.remove('active'); }

function customConfirm(message, callback) {
  const modal = document.getElementById('confirm-modal');
  const msgEl = document.getElementById('confirm-modal-message');
  const yesBtn = document.getElementById('confirm-modal-yes');
  const noBtn = document.getElementById('confirm-modal-no');

  msgEl.textContent = message;
  modal.classList.add('active');

  const close = () => modal.classList.remove('active');

  yesBtn.onclick = () => { close(); callback(); };
  noBtn.onclick = close;
}

function openNicheDemoModal() { document.getElementById('niche-demo-modal').classList.add('active'); }
function closeNicheDemoModal() { document.getElementById('niche-demo-modal').classList.remove('active'); }
function confirmNicheDemo() {
  const category = document.getElementById('niche-demo-category').value;
  generateDemoNiche(category);
  closeNicheDemoModal();
}

// --- Config Logic ---
function openResetModal(type) {
  const modal = document.getElementById('reset-modal');
  const title = document.getElementById('reset-modal-title');
  const desc = document.getElementById('reset-modal-desc');
  const options = document.getElementById('reset-options');
  
  options.innerHTML = '';
  modal.classList.add('active');

  if (type === 'scores') {
    title.textContent = 'Zerar Pontuações';
    desc.textContent = 'Escolha quais pontuações deseja zerar:';
    options.innerHTML = `
      <button class="btn btn-primary" onclick="confirmReset('scores', 'teams')">Zerar Equipes</button>
      <button class="btn btn-primary" onclick="confirmReset('scores', 'players')">Zerar Jogadores</button>
      <button class="btn btn-danger" onclick="confirmReset('scores', 'all')">Zerar Tudo (Geral)</button>
    `;
  } else if (type === 'niches_acts') {
    title.textContent = 'Zerar Nichos/Gincanas';
    desc.textContent = 'Escolha o que deseja remover:';
    options.innerHTML = `
      <button class="btn btn-primary" onclick="confirmReset('niches_acts', 'niches')">Remover Nichos</button>
      <button class="btn btn-primary" onclick="confirmReset('niches_acts', 'acts')">Remover Gincanas</button>
      <button class="btn btn-danger" onclick="confirmReset('niches_acts', 'all')">Remover Tudo (Geral)</button>
    `;
  } else if (type === 'teams_players') {
    title.textContent = 'Zerar Equipes/Jogadores';
    desc.textContent = 'Escolha o que deseja remover:';
    options.innerHTML = `
      <button class="btn btn-primary" onclick="confirmReset('teams_players', 'teams')">Remover Equipes</button>
      <button class="btn btn-primary" onclick="confirmReset('teams_players', 'players')">Remover Jogadores</button>
      <button class="btn btn-danger" onclick="confirmReset('teams_players', 'all')">Remover Tudo (Geral)</button>
    `;
  }
}

function closeResetModal() {
  document.getElementById('reset-modal').classList.remove('active');
}

function confirmReset(category, type) {
  customConfirm('Tem certeza? Esta ação não pode ser desfeita.', () => {
    if (category === 'scores') {
      if (type === 'teams' || type === 'all') data.teams.forEach(t => t.score = 0);
      if (type === 'players' || type === 'all') data.players.forEach(p => p.score = 0);
      showNotification('Pontuações zeradas com sucesso!', 'success');
    } else if (category === 'niches_acts') {
      if (type === 'niches' || type === 'all') data.niches = [];
      if (type === 'acts' || type === 'all') data.activities = [];
      showNotification('Nichos/Gincanas removidos!', 'success');
    } else if (category === 'teams_players') {
      if (type === 'teams' || type === 'all') {
        data.teams = [];
        data.players.forEach(p => p.teamId = null);
      }
      if (type === 'players' || type === 'all') data.players = [];
      showNotification('Equipes/Jogadores removidos!', 'success');
    }

    save();
    closeResetModal();
  });
}

function factoryReset() { customConfirm('APAGAR TUDO? Isso não pode ser desfeito.', () => { localStorage.removeItem(KEY); location.reload(); }); }

// --- Notification Logic ---
function showNotification(message, type = 'primary') {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `
    <span>${message}</span>
    <button style="background:none; border:none; color:inherit; cursor:pointer; font-weight:bold; font-size:1.2rem;" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(notif);

  // Auto remove after 5s
  setTimeout(() => {
    if (notif.parentElement) {
      notif.remove();
    }
  }, 5000);
}

// --- Demo Data ---
function generateDemoVerses(count = 50) {
  data.verses = []; // Limpa versículos antigos
  const realVerses = [
    { ref: "Gênesis 1:1", text: "No princípio criou Deus o céu e a terra." },
    { ref: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
    { ref: "Salmos 23:1", text: "O Senhor é o meu pastor, nada me faltará." },
    { ref: "Filipenses 4:13", text: "Posso todas as coisas naquele que me fortalece." },
    { ref: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito." },
    { ref: "Salmos 119:105", text: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho." },
    { ref: "Provérbios 3:5", text: "Confia no Senhor de todo o teu coração, e não te estribes no teu próprio entendimento." },
    { ref: "Mateus 6:33", text: "Mas, buscai primeiro o reino de Deus, e a sua justiça, e todas estas coisas vos serão acrescentadas." },
    { ref: "Josué 1:9", text: "Não mo ordenei eu? Esforça-te, e tem bom ânimo; não temas, nem te espantes; porque o Senhor teu Deus é contigo, por onde quer que andares." },
    { ref: "Salmos 46:1", text: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia." },
    { ref: "1 Coríntios 13:4", text: "O amor é sofredor, é benigno; o amor não é invejoso; o amor não trata com leviandade, não se ensoberbece." },
    { ref: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça." },
    { ref: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais." },
    { ref: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei." },
    { ref: "Salmos 37:4", text: "Deleita-te também no Senhor, e ele te concederá os desejos do teu coração." },
    { ref: "Provérbios 16:3", text: "Confia ao Senhor as tuas obras, e teus pensamentos serão estabelecidos." },
    { ref: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?" },
    { ref: "João 14:6", text: "Disse-lhe Jesus: Eu sou o caminho, e a verdade e a vida; ninguém vem ao Pai, senão por mim." },
    { ref: "Efésios 2:8", text: "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus." },
    { ref: "Gálatas 5:22", text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança." },
    { ref: "Salmos 91:1", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará." },
    { ref: "Mateus 5:16", text: "Assim resplandeça a vossa luz diante dos homens, para que vejam as vossas boas obras e glorifiquem a vosso Pai, que está nos céus." },
    { ref: "Salmos 121:1", text: "Levantarei os meus olhos para os montes, de onde vem o meu socorro." },
    { ref: "Provérbios 22:6", text: "Educa a criança no caminho em que deve andar; e até quando envelhecer não se desviará dele." },
    { ref: "Isaías 40:31", text: "Mas os que esperam no Senhor renovarão as forças, subirão com asas como águias; correrão, e não se cansarão; caminharão, e não se fatigarão." },
    { ref: "Tiago 4:7", text: "Sujeitai-vos, pois, a Deus, resisti ao diabo, e ele fugirá de vós." },
    { ref: "Salmos 34:7", text: "O anjo do Senhor acampa-se ao redor dos que o temem, e os livra." },
    { ref: "Mateus 28:19", text: "Portanto ide, fazei discípulos de todas as nações, batizando-os em nome do Pai, e do Filho, e do Espírito Santo." },
    { ref: "Romanos 12:2", text: "E não sede conformados com este mundo, mas sede transformados pela renovação do vosso entendimento." },
    { ref: "Salmos 1:1", text: "Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem se detém no caminho dos pecadores." },
    { ref: "João 8:32", text: "E conhecereis a verdade, e a verdade vos libertará." },
    { ref: "Hebreus 11:1", text: "Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem." },
    { ref: "Salmos 100:1", text: "Celebrai com júbilo ao Senhor, todas as terras." },
    { ref: "Provérbios 1:7", text: "O temor do Senhor é o princípio do conhecimento; os loucos desprezam a sabedoria e a instrução." },
    { ref: "Mateus 7:7", text: "Pedi, e dar-se-vos-á; buscai, e encontrareis; batei, e abrir-se-vos-á." },
    { ref: "1 João 4:8", text: "Aquele que não ama não conhece a Deus; porque Deus é amor." },
    { ref: "Salmos 19:1", text: "Os céus declaram a glória de Deus e o firmamento anuncia a obra das suas mãos." },
    { ref: "Apocalipse 21:4", text: "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor." },
    { ref: "Salmos 118:24", text: "Este é o dia que fez o Senhor; regozijemo-nos, e alegremo-nos nele." },
    { ref: "Colossenses 3:23", text: "E tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor, e não aos homens." },
    { ref: "Salmos 139:14", text: "Eu te louvarei, porque de um modo assustador, e tão maravilhoso fui feito; maravilhosas são as tuas obras." },
    { ref: "Provérbios 4:23", text: "Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as fontes da vida." },
    { ref: "Mateus 22:37", text: "E Jesus disse-lhe: Amarás o Senhor teu Deus de todo o teu coração, e de toda a tua alma, e de todo o teu pensamento." },
    { ref: "João 15:5", text: "Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer." },
    { ref: "Romanos 5:8", text: "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores." },
    { ref: "Salmos 51:10", text: "Cria em mim, ó Deus, um coração puro, e renova em mim um espírito reto." },
    { ref: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." },
    { ref: "Salmos 147:3", text: "Sara os quebrantados de coração, e liga-lhes as feridas." },
    { ref: "Provérbios 18:10", text: "Torre forte é o nome do Senhor; a ela correrá o justo, e estará em alto retiro." },
    { ref: "2 Timóteo 1:7", text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, e de amor, e de moderação." }
  ];

  // Shuffle and take count
  const shuffled = [...realVerses].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  for (const v of selected) {
    data.verses.push({
      id: genId(),
      reference: v.ref,
      text: v.text
    });
  }
  
  save();
  showNotification(`📖 ${count} versículos bíblicos gerados aleatoriamente!`, 'success');
}

function generateDemoNiche(category) {
  const pools = {
    personagens: ["Adão", "Eva", "Caim", "Abel", "Noé", "Abraão", "Isaque", "Jacó", "José", "Moisés", "Arão", "Josué", "Gideão", "Sansão", "Rute", "Samuel", "Saul", "Davi", "Salomão", "Elias", "Eliseu", "Isaías", "Jeremias", "Ezequiel", "Daniel", "Oséias", "Joel", "Amós", "Jonas", "Miquéias", "João Batista", "Pedro", "André", "Tiago", "João", "Filipe", "Bartolomeu", "Mateus", "Tomé", "Judas Tadeu", "Simão", "Paulo", "Estêvão", "Barnabé", "Timóteo", "Tito", "Lídia", "Priscila", "Áquila", "Maria Madalena"],
    passagens: ["Gênesis 1:1", "João 3:16", "Salmos 23:1", "Filipenses 4:13", "Romanos 8:28", "Salmos 119:105", "Provérbios 3:5", "Mateus 6:33", "Josué 1:9", "Salmos 46:1", "1 Coríntios 13:4", "Isaías 41:10", "Jeremias 29:11", "Mateus 11:28", "Salmos 37:4", "Provérbios 16:3", "Salmos 27:1", "João 14:6", "Efésios 2:8", "Gálatas 5:22", "Salmos 91:1", "Mateus 5:16", "Salmos 121:1", "Provérbios 22:6", "Isaías 40:31", "Tiago 4:7", "Salmos 34:7", "Mateus 28:19", "Romanos 12:2", "Salmos 1:1", "João 8:32", "Hebreus 11:1", "Salmos 100:1", "Provérbios 1:7", "Mateus 7:7", "1 João 4:8", "Salmos 19:1", "Apocalipse 21:4", "Salmos 118:24", "Colossenses 3:23", "Salmos 139:14", "Provérbios 4:23", "Mateus 22:37", "João 15:5", "Romanos 5:8", "Salmos 51:10", "1 Pedro 5:7", "Salmos 147:3", "Provérbios 18:10", "2 Timóteo 1:7"],
    louvores: ["Porque Ele Vive", "Grandioso És Tu", "Alvo Mais Que a Neve", "Rude Cruz", "Vencendo Vem o Jesus", "Tu És Fiel", "Firme nas Promessas", "Sossegai", "Mais Perto Quero Estar", "Oh! Quão Cego Pus-me a Orar", "Chuvas de Bênçãos", "Cristo Cura Sim", "A Mensagem da Cruz", "Em Fervorosa Oração", "Grato a Ti", "Deus é Deus", "Noites Traiçoeiras", "Raridade", "Sabor de Mel", "Ressuscita-me", "Faz um Milagre em Mim", "Casa do Pai", "Advogado Fiel", "O Escudo", "Sobrevivi", "Deus do Impossível", "Acalma o Meu Coração", "Espírito Santo", "Renova-me", "Alfa e Ômega", "Agnus Dei", "Hosana", "Quão Grande é o Meu Deus", "Ele é Exaltado", "Reina em Mim", "Vim para Adorar-te", "Te Louvarei", "A Ele a Glória", "Teu Santo Nome", "Me Atraiu", "Bondade de Deus", "Yeshua", "Ousado Amor", "Lindo És", "Só Tu És Santo", "Maranata", "Que Se Abram os Céus", "Aba Pai", "Atos 2", "Que Ruja o Leão"],
    objetos: ["Arca da Aliança", "Cajado de Moisés", "Funda de Davi", "Harpa de Davi", "Trombeta", "Jarro de Azeite", "Cesto de Juncos", "Tábua dos Mandamentos", "Altar de Incenso", "Candelabro", "Mesa dos Pães", "Véu do Templo", "Coroa de Espinhos", "Cruz de Cristo", "Túmulo Vazio", "Redes de Pesca", "Barco de Pedro", "Moeda de Prata", "Perfume de Alabastro", "Túnica de José", "Capa de Elias", "Espada de Gideão", "Tocha", "Cântaro", "Moinho", "Arado", "Foice", "Odre de Vinho", "Sandálias", "Cinto de Verdade", "Couraça da Justiça", "Escudo da Fé", "Capacete da Salvação", "Espada do Espírito", "Âncora", "Lâmpada", "Pão", "Vinho", "Mel", "Sal", "Trigo", "Joio", "Videira", "Oliveira", "Figueira", "Cedro do Líbano", "Ouro", "Incenso", "Mirra", "Pérola de Grande Valor"]
  };

  const names = { personagens: "Personagens Bíblicos", passagens: "Passagens Bíblicas", louvores: "Louvores/Hinos", objetos: "Objetos Bíblicos" };
  const nicheName = names[category];
  
  // Find or create niche
  let niche = data.niches.find(n => n.name === nicheName);
  if (!niche) {
    niche = { id: genId(), name: nicheName, items: [] };
    data.niches.push(niche);
  }

  // Clear existing items
  niche.items = [];

  // Shuffle and take 30
  const pool = pools[category];
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 30);

  for (const item of selected) {
    niche.items.push({ id: genId(), name: item });
  }

  save();
  showNotification(`📦 Nicho "${nicheName}" atualizado com 30 itens aleatórios!`, 'success');
}

function suggestGincana() {
  const suggestions = [
    { name: "Espada para o Ar", desc: "Os participantes seguram a Bíblia fechada acima da cabeça. O líder dita uma referência. O primeiro a encontrar e começar a ler ganha os pontos.", type: "individual" },
    { name: "Quiz Bíblico Relâmpago", desc: "Perguntas rápidas sobre personagens ou histórias da Bíblia. Quem responder primeiro ganha.", type: "individual" },
    { name: "Mímica de Histórias", desc: "Um membro da equipe faz mímica de uma história bíblica para sua equipe adivinhar em 1 minuto.", type: "team" },
    { name: "Cabo de Guerra da Fé", desc: "Clássico cabo de guerra entre as equipes.", type: "team" },
    { name: "Corrida do Versículo", desc: "Os participantes devem correr até uma mesa, escrever um versículo específico e voltar. A equipe mais rápida vence.", type: "team" },
    { name: "Qual é o Hino?", desc: "O líder toca os primeiros segundos de um hino/louvor e a equipe deve adivinhar o nome.", type: "team" },
    { name: "Ponte de Papel", desc: "As equipes devem construir uma ponte usando apenas papel e fita que suporte o peso de uma Bíblia.", type: "team" },
    { name: "Telefone Sem Fio Bíblico", desc: "Uma frase bíblica longa é passada. A última pessoa deve dizer a frase correta.", type: "team" }
  ];

  const random = suggestions[Math.floor(Math.random() * suggestions.length)];
  
  document.getElementById('act-name').value = random.name;
  document.getElementById('act-desc').value = random.desc;
  document.getElementById('act-type').value = random.type;
  
  showNotification('💡 Ideia sugerida! Clique em "Criar Gincana" para salvar.', 'primary');
}
