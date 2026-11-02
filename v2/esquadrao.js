/* Esquadrão Midiando: motor compartilhado dos jogos v2.
   Sprites em pixel art, trilha chiptune e efeitos sintetizados, partículas, ofensiva e cartão final. */
(function(){
const ESQ = window.ESQ = {};
const $ = s => document.querySelector(s);
ESQ.$ = $;
ESQ.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
ESQ.sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- armazenamento local (cada pessoa no seu navegador) ---------- */
ESQ.store = {
  get(k, d){ try{ const v = localStorage.getItem('esq:'+k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem('esq:'+k, JSON.stringify(v)); }catch(e){} }
};
const day = off => new Date(Date.now() + off*864e5).toLocaleDateString('sv');
ESQ.streak = {
  get(){ const s = ESQ.store.get('streak', {n:0, last:null}); return (s.last===day(0) || s.last===day(-1)) ? s.n : 0; },
  hit(){
    const s = ESQ.store.get('streak', {n:0, last:null});
    if(s.last === day(0)) return {n:s.n, novo:false};
    s.n = s.last === day(-1) ? s.n + 1 : 1; s.last = day(0);
    ESQ.store.set('streak', s); return {n:s.n, novo:true};
  }
};

/* ---------- cores e sprites ---------- */
ESQ.COLORS = [
  {k:'azul', nome:'Azul', c:'#2F4BFF'}, {k:'lima', nome:'Lima', c:'#D4F000'}, {k:'laranja', nome:'Laranja', c:'#FF5A1F'},
  {k:'rosa', nome:'Rosa', c:'#FF7AD9'}, {k:'verde', nome:'Verde', c:'#3AD67A'}, {k:'roxo', nome:'Roxo', c:'#8B5CF6'}
];
ESQ.shade = (hex, amt) => {
  const n = parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255;
  const f = v => Math.max(0, Math.min(255, Math.round(amt>0 ? v+(255-v)*amt : v*(1+amt))));
  return '#' + [f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
};
ESQ.HERO = [
  '......KKKK......','....KKHHHHKK....','...KHHHHHHHHK...','..KHHhHHHHHHHK..','..KHVVVVVVVVHK..',
  '..KHVvvVVVVVHK..','..KHVVVVVVVVHK..','...KHHHHHHHHK...','....KKSSSSKK....','..KKSSSWWSSSKK..',
  '.KSSSSSWWSSSSSK.','KSSKSSSSSSSSKSSK','KWWKSSSSSSSSKWWK','.KK.KWWWWWWK.KK.','....KSSSKSSSK...',
  '....KSSSKSSSK...','....KSSSKSSSK...','....KsSSKSSsK...','....KWWWKWWWK...','...KKKKKKKKKKK..'
];
ESQ.MONSTER = [
  '......KKKK......','....KKMMMMKK....','...KMMMMMMMMK...','..KMMmMMMMMMMK..','.KMMWWMMMMWWMMK.',
  '.KMMWKMMMMWKMMK.','.KMMMMMMMMMMMMK.','KMMMMKKKKKKMMMMK','KMMMKRRRRRRKMMMK','KMMMKWKWKWKKMMMK',
  'KMMMMKKKKKKMMMMK','.KMMMMMMMMMMMMK.','.KMMmMMMMMMmMMK.','..KMMMKMMKMMMK..','..KMMK.KK.KMMK..','..KKK......KKK..'
];
ESQ.heroPal = c => ({K:'#0B0D1A', H:c, h:ESQ.shade(c,.45), V:'#141A3A', v:'#9FE8FF', S:c, s:ESQ.shade(c,-.3), W:'#F4F5F0'});
ESQ.monPal = c => ({K:'#0B0D1A', M:c, m:ESQ.shade(c,.35), W:'#F4F5F0', R:'#7A0F1E'});
ESQ.sprite = (rows, pal, scale=4) => {
  const h = rows.length, w = rows[0].length, cv = document.createElement('canvas');
  cv.width = w*scale; cv.height = h*scale; const x = cv.getContext('2d');
  rows.forEach((r,y)=>{ for(let i=0;i<w;i++){ const col = pal[r[i]]; if(!col) continue; x.fillStyle = col; x.fillRect(i*scale, y*scale, scale, scale); } });
  cv.className = 'px'; return cv;
};
ESQ.hero = (c, scale=4) => ESQ.sprite(ESQ.HERO, ESQ.heroPal(c), scale);
ESQ.monster = (c, scale=4) => ESQ.sprite(ESQ.MONSTER, ESQ.monPal(c), scale);

ESQ.ICON = {
  heart:'<svg viewBox="0 0 10 9" shape-rendering="crispEdges"><path fill="#FF3B4E" d="M1 0h3v1h2V0h3v1h1v3H9v1H8v1H7v1H6v1H4V7H3V6H2V5H1V4H0V1h1z"/><path fill="#fff9" d="M2 1h1v1H2z"/></svg>',
  flame:'<svg viewBox="0 0 10 12" shape-rendering="crispEdges"><path fill="#FF5A1F" d="M5 0h1v2h1v1h1v2h1v4H8v2H7v1H3v-1H2V9H1V5h1V4h1V2h1V1h1z"/><path fill="#FFC93C" d="M5 5h1v1h1v3H6v1H4V9H3V7h1V6h1z"/></svg>',
  xp:'<svg viewBox="0 0 10 10" shape-rendering="crispEdges"><path fill="#FFC93C" d="M4 0h2v3h3v2H6v5H4V5H1V3h3z"/></svg>',
  star:'<svg viewBox="0 0 10 10" shape-rendering="crispEdges"><path fill="#0B0D1A" d="M4 0h2v3h4v2H8v1h1v4H7V9H3v1H1V6h1V5H0V3h4z"/></svg>',
  chest:'<svg viewBox="0 0 16 14" shape-rendering="crispEdges"><path fill="#0B0D1A" d="M2 0h12v1h1v1h1v12H0V2h1V1h1z"/><path fill="#C48A10" d="M2 1h12v1h1v4H1V2h1z"/><path fill="#8A5A1E" d="M1 7h14v6H1z"/><path fill="#FFC93C" d="M7 5h2v4H7z"/></svg>',
  chestOpen:'<svg viewBox="0 0 16 14" shape-rendering="crispEdges"><path fill="#0B0D1A" d="M1 0h14v6h1v8H0V6h1z"/><path fill="#5A3A10" d="M2 1h12v5H2z"/><path fill="#FFE27A" d="M3 4h10v2H3z"/><path fill="#8A5A1E" d="M1 7h14v6H1z"/><path fill="#FFC93C" d="M7 7h2v3H7z"/></svg>',
  trophy:'<svg viewBox="0 0 12 12" shape-rendering="crispEdges"><path fill="#0B0D1A" d="M2 0h8v1h2v3h-1v1H9v1H8v2h1v2h1v2H2v-2h1V8h1V6H3V5H1V4H0V1h2z"/><path fill="#FFE27A" d="M3 1h6v4H8v1H4V5H3z"/></svg>',
  lock:'<svg viewBox="0 0 10 12" shape-rendering="crispEdges"><path fill="#6C74A8" d="M3 0h4v1h1v4h1v7H1V5h1V1h1zm0 2v3h4V2z"/></svg>',
  sound:'<svg viewBox="0 0 12 10" shape-rendering="crispEdges"><path fill="#F4F5F0" d="M0 3h3V2h1V1h1V0h1v10H5V9H4V8H3V7H0zM8 2h1v1h1v4H9v1H8V7h1V3H8z"/></svg>',
  mute:'<svg viewBox="0 0 12 10" shape-rendering="crispEdges"><path fill="#6C74A8" d="M0 3h3V2h1V1h1V0h1v10H5V9H4V8H3V7H0zM8 3h1v1h1V3h1v1h-1v1h1v1h-1v1h-1V6H9v1H8V6h1V5H8z"/></svg>'
};

/* ---------- áudio: chiptune e efeitos (Web Audio) ---------- */
const A = ESQ.audio = {ctx:null, on:ESQ.store.get('som', true), cur:null, step:0, nt:0};
const midi = m => 440*Math.pow(2,(m-69)/12);
A.init = () => {
  if(A.ctx){ if(A.ctx.state === 'suspended') A.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if(!C) return;
  const c = A.ctx = new C();
  A.master = c.createGain(); A.master.gain.value = A.on ? .8 : 0; A.master.connect(c.destination);
  A.sfxG = c.createGain(); A.sfxG.gain.value = .5; A.sfxG.connect(A.master);
  A.musG = c.createGain(); A.musG.gain.value = .15; A.musG.connect(A.master);
  const len = c.sampleRate*.5, b = c.createBuffer(1,len,c.sampleRate), d = b.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
  A.noiseBuf = b; A.nt = c.currentTime + .05;
  setInterval(tick, 40);
};
function tone(f, t, d, type='square', v=.2, dest=A.sfxG, slide=0){
  const c = A.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f*slide), t+d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t+.008); g.gain.exponentialRampToValueAtTime(.0001, t+d);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t+d+.03);
}
function noise(t, d, freq, v, dest=A.sfxG, type='bandpass'){
  const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = A.noiseBuf; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t+d);
  s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t+d+.02);
}
const T = () => A.ctx.currentTime;
const ok = () => A.ctx && A.ctx.state === 'running';
A.sfx = {
  click(){ if(!ok()) return; tone(1320, T(), .04, 'square', .07); },
  select(){ if(!ok()) return; tone(880, T(), .05, 'triangle', .12); tone(1320, T()+.04, .05, 'triangle', .1); },
  correct(combo=0){ if(!ok()) return; const t=T(), k=Math.min(combo,6); tone(midi(76+k), t, .12, 'square', .1); tone(midi(83+k), t+.09, .22, 'square', .1); tone(midi(88+k), t+.09, .22, 'triangle', .08); },
  wrong(){ if(!ok()) return; const t=T(); tone(220, t, .16, 'square', .1); tone(155, t+.14, .3, 'square', .1, A.sfxG, .8); },
  hit(){ if(!ok()) return; const t=T(); noise(t, .15, 900, .5); tone(140, t, .18, 'sine', .4, A.sfxG, .35); },
  zap(){ if(!ok()) return; tone(1800, T(), .22, 'sawtooth', .06, A.sfxG, .15); },
  boom(){ if(!ok()) return; const t=T(); noise(t, .9, 400, .7, A.sfxG, 'lowpass'); tone(90, t, .6, 'sine', .5, A.sfxG, .3); },
  heart(){ if(!ok()) return; tone(660, T(), .5, 'square', .08, A.sfxG, .3); },
  xp(){ if(!ok()) return; tone(1500+Math.random()*300, T(), .03, 'square', .04); },
  scan(){ if(!ok()) return; const t=T(); for(let i=0;i<5;i++) tone(600+i*220, t+i*.035, .05, 'triangle', .07); },
  win(){ if(!ok()) return; const t=T(); [72,76,79,84,79,84,88].forEach((m,i)=>tone(midi(m), t+i*.09, i===6?.6:.12, 'square', .08)); noise(t+.6, .5, 6000, .12); },
  chest(){ if(!ok()) return; const t=T(); tone(200, t, .5, 'sawtooth', .05, A.sfxG, 6); [84,88,91,96].forEach((m,i)=>tone(midi(m), t+.45+i*.06, .25, 'triangle', .1)); noise(t+.45, .6, 8000, .12); },
  join(){ if(!ok()) return; const t=T(); [67,71,74,79,83].forEach((m,i)=>tone(midi(m), t+i*.07, .2, 'square', .08)); },
  talk(base=400){ if(!ok()) return; tone(base*(.9+Math.random()*.25), T(), .035, 'square', .03); },
  key(){ if(!ok()) return; tone(1250, T(), .05, 'square', .07); },
  urna(){ if(!ok()) return; const t=T(); for(let i=0;i<5;i++) tone(1050, t+i*.11, i===4?.5:.07, 'square', .08); }
};
/* músicas: notas MIDI por semicolcheia; '.' é pausa */
const P = s => s.trim().split(/\s+/).map(x => x === '.' ? null : +x);
const SONGS = {
  title:{bpm:150, lead:P(`72 . 72 . 79 . . 77 76 . 74 . 72 . . .  74 . 74 . 81 . . 79 77 . 76 . 74 . . .  76 . 77 . 79 . 84 . 83 . 79 . 76 . 74 .  72 . . 72 74 . 76 . 79 . . . 72 . . .`),
    bass:P(`48 . 60 . 48 . 60 . 48 . 60 . 48 . 60 .  43 . 55 . 43 . 55 . 43 . 55 . 43 . 55 .  45 . 57 . 45 . 57 . 41 . 53 . 41 . 53 .  43 . 55 . 43 . 55 . 48 . 60 . 48 . 48 .`),
    drums:'k.h.s.h.k.h.s.hk'},
  map:{bpm:104, lead:P(`72 . 76 . 79 . 76 . 74 . 77 . 81 . 77 .  76 . 79 . 84 . 79 . 74 . 71 . 67 . . .`),
    bass:P(`48 . . . 55 . . . 50 . . . 57 . . .  52 . . . 55 . . . 43 . . . 47 . . .`), drums:'..h...h...h...h.', soft:true},
  battle:{bpm:164, lead:P(`69 . 72 . 76 . 72 . 74 . 72 . 71 . 67 .  69 . 72 . 76 . 79 . 77 . 76 . 74 . 71 .  72 . 74 . 76 . 77 . 76 . 74 . 72 . 71 .  69 . . 69 71 . 72 . 71 . 68 . 64 . . .`),
    bass:P(`45 45 57 45 45 45 57 45 41 41 53 41 41 41 53 41  43 43 55 43 43 43 55 43 40 40 52 40 40 40 52 40`), drums:'k.hsk.hsk.hsk.hs'}
};
function tick(){
  if(!ok() || !A.cur) return;
  const s = SONGS[A.cur], st = 60/s.bpm/4;
  if(A.nt < A.ctx.currentTime) A.nt = A.ctx.currentTime + .02;
  while(A.nt < A.ctx.currentTime + .18){
    const i = A.step, l = s.lead[i % s.lead.length], b = s.bass[i % s.bass.length], d = s.drums[i % s.drums.length];
    if(l) tone(midi(l), A.nt, st*1.7, s.soft ? 'triangle' : 'square', s.soft ? .18 : .11, A.musG);
    if(b) tone(midi(b), A.nt, st*1.5, 'triangle', .3, A.musG);
    if(d === 'k') tone(150, A.nt, .12, 'sine', .55, A.musG, .3);
    if(d === 's') noise(A.nt, .1, 1800, .25, A.musG);
    if(d === 'h') noise(A.nt, .03, 8000, s.soft ? .05 : .08, A.musG, 'highpass');
    A.nt += st; A.step++;
  }
}
A.music = name => { if(A.cur === name) return; A.cur = name; A.step = 0; if(A.ctx) A.nt = A.ctx.currentTime + .05; };
A.setOn = on => {
  A.on = on; ESQ.store.set('som', on);
  if(A.master) A.master.gain.setTargetAtTime(on ? .8 : 0, A.ctx.currentTime, .05);
  document.querySelectorAll('[data-som]').forEach(b => { b.innerHTML = on ? ESQ.ICON.sound : ESQ.ICON.mute; b.setAttribute('aria-label', on ? 'Desligar som' : 'Ligar som'); });
};
ESQ.soundButton = () => `<button class="x" data-som aria-label="${A.on?'Desligar som':'Ligar som'}" style="width:34px;height:34px;display:grid;place-items:center">${A.on ? ESQ.ICON.sound : ESQ.ICON.mute}</button>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-som]'); if(b){ A.init(); A.setOn(!A.on); } });
document.addEventListener('pointerdown', () => A.init(), {once:false, passive:true});
document.addEventListener('visibilitychange', () => { if(!A.ctx) return; document.hidden ? A.ctx.suspend() : A.ctx.resume(); });

/* ---------- partículas e efeitos ---------- */
const fx = document.createElement('canvas'); fx.id = 'fx'; document.body.appendChild(fx);
const fctx = fx.getContext('2d'); let parts = [], running = false;
const fsize = () => { fx.width = innerWidth; fx.height = innerHeight; };
fsize(); addEventListener('resize', fsize);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function loop(){
  fctx.clearRect(0,0,fx.width,fx.height);
  parts = parts.filter(p => p.life > 0);
  for(const p of parts){
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= .985; p.life -= 1;
    fctx.globalAlpha = Math.min(1, p.life/20); fctx.fillStyle = p.c;
    fctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
  }
  fctx.globalAlpha = 1;
  if(parts.length){ requestAnimationFrame(loop); } else running = false;
}
const go = () => { if(!running){ running = true; requestAnimationFrame(loop); } };
ESQ.burst = (x, y, colors, n=26, speed=5) => {
  if(reduce) return;
  for(let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, v = speed*(.4+Math.random());
    parts.push({x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v-2, g:.18, life:40+Math.random()*30, s:4+Math.floor(Math.random()*2)*2, c:colors[i%colors.length]}); }
  go();
};
ESQ.confetti = () => {
  if(reduce) return;
  const cols = ['#E6FF3B','#FF7AD9','#3AD67A','#2F4BFF','#FF5A1F','#FFC93C'];
  for(let i=0;i<120;i++) parts.push({x:Math.random()*innerWidth, y:-20-Math.random()*200, vx:(Math.random()-.5)*3, vy:2+Math.random()*3, g:.05, life:160+Math.random()*80, s:6, c:cols[i%cols.length]});
  go();
};
ESQ.center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; };
ESQ.float = (text, el, color) => {
  const [x,y] = ESQ.center(el), f = document.createElement('div');
  f.className = 'float'; f.textContent = text; if(color) f.style.color = color;
  f.style.left = (x-40)+'px'; f.style.top = (y-20)+'px'; document.body.appendChild(f); setTimeout(()=>f.remove(), 1000);
};
ESQ.anim = (el, cls, ms=600) => { if(!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(()=>el.classList.remove(cls), ms); };
ESQ.countUp = (el, to, ms=900) => new Promise(res => {
  const t0 = performance.now(); let lastTick = 0;
  const f = now => { const k = Math.min(1,(now-t0)/ms), v = Math.round(to*(1-Math.pow(1-k,3)));
    el.textContent = v; if(now-lastTick > 60 && k<1){ A.sfx.xp(); lastTick = now; }
    k < 1 ? requestAnimationFrame(f) : res(); };
  requestAnimationFrame(f);
});
ESQ.toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(()=>t.remove(), 2400); };

/* ---------- cartão compartilhável (1080x1350) ---------- */
ESQ.card = async ({kicker, title, highlight, heroes, stats, lines, footer}) => {
  try{ await Promise.race([Promise.all([document.fonts.load('40px "Press Start 2P"'), document.fonts.load('40px "Pixelify Sans"')]), ESQ.sleep(1500)]); }catch(e){}
  const W=1080, H=1350, cv = document.createElement('canvas'); cv.width=W; cv.height=H; const x = cv.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.fillStyle = '#0E1230'; x.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){ x.fillStyle = i%3 ? '#ffffff55' : '#ffffffaa'; const s = i%5 ? 4 : 8; x.fillRect((i*389)%W, (i*211)%820, s, s); }
  x.save(); x.translate(W/2, 1350); x.strokeStyle = '#3AD67A55'; x.lineWidth = 3;
  for(let i=-12;i<=12;i++){ x.beginPath(); x.moveTo(i*40, -520); x.lineTo(i*220, 0); x.stroke(); }
  for(let j=0;j<9;j++){ const y = -520 + Math.pow(j/8,1.8)*520; x.beginPath(); x.moveTo(-W, y); x.lineTo(W, y); x.stroke(); }
  x.restore();
  const bars = ['#ffffff','#E6FF3B','#5CE1E6','#3AD67A','#FF7AD9','#FF3B4E','#2F4BFF']; bars.forEach((c,i)=>{ x.fillStyle=c; x.fillRect(80+i*60, 70, 60, 22); });
  x.textAlign = 'left'; x.fillStyle = '#A9B0D6'; x.font = '26px "Press Start 2P", monospace'; x.fillText(kicker, 80, 150);
  x.fillStyle = '#F4F5F0'; x.font = '54px "Press Start 2P", monospace';
  title.forEach((t,i)=>x.fillText(t, 80, 240+i*74));
  const hy = 240 + title.length*74 - 20;
  let fs = 54; x.font = fs+'px "Press Start 2P", monospace';
  while(x.measureText(highlight).width > W-200 && fs > 24){ fs -= 2; x.font = fs+'px "Press Start 2P", monospace'; }
  const hw = x.measureText(highlight).width;
  x.fillStyle = '#E6FF3B'; x.fillRect(66, hy, hw+28, 86); x.fillStyle = '#0B0D1A'; x.fillText(highlight, 80, hy+43+fs/2);
  const n = heroes.length, sc = n > 3 ? 11 : 14, sw = 16*sc, gap = 24, total = n*sw + (n-1)*gap; let hx = (W-total)/2;
  heroes.forEach(c => { const s = ESQ.sprite(ESQ.HERO, ESQ.heroPal(c), sc); x.drawImage(s, hx, 560); hx += sw + gap; });
  const sy = 560 + 20*sc + 40;
  const bw = (W-160-40)/3;
  stats.forEach(([lab,val],i)=>{
    const bx = 80 + i*(bw+20);
    x.fillStyle = '#FFC93C'; x.fillRect(bx, sy, bw, 44); x.fillStyle = '#1B2150'; x.fillRect(bx, sy+44, bw, 96);
    x.fillStyle = '#0B0D1A'; x.font = '18px "Press Start 2P", monospace'; x.textAlign='center'; x.fillText(lab, bx+bw/2, sy+31);
    x.fillStyle = '#FFC93C'; x.font = '38px "Press Start 2P", monospace'; x.fillText(String(val), bx+bw/2, sy+112);
  });
  x.textAlign = 'left'; x.fillStyle = '#F4F5F0'; x.font = '34px "Pixelify Sans", sans-serif';
  (lines||[]).forEach((l,i)=>x.fillText(l, 80, sy+200+i*46));
  x.fillStyle = '#A9B0D6'; x.font = '22px "Press Start 2P", monospace'; x.fillText(footer, 80, H-60);
  return cv.toDataURL('image/png');
};
ESQ.copy = async (text) => { try{ await navigator.clipboard.writeText(text); ESQ.toast('Legenda copiada'); }catch(e){ ESQ.toast(text); } };
})();
