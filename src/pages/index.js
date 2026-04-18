import { useEffect, useState, useCallback } from 'react'
import parser from '@/parser/parser'
import { buildGameState, posGroup, mapPos } from '@/lib/dataBuilder'
const Buffer = require('buffer/').Buffer

// ── Stats labels ─────────────────────────────────────────────────────────
const STAT_GROUPS = {
  'Technique':['finishing','dribbling','ball_control','fk_accuracy','curve','volleys'],
  'Passe':    ['short_passing','long_passing','crossing','heading'],
  'Vitesse':  ['acceleration','sprint_speed','agility','reactions','balance'],
  'Physique': ['shot_power','jumping','stamina','strength','long_shots','aggression'],
  'Défense':  ['defensive_awareness','sliding_tackle','standing_tackle','interceptions'],
  'Mentale':  ['positioning','vision','penalties','composure'],
  'Gardien':  ['gk_diving','gk_reflexes','gk_kicking','gk_handling','gk_positioning'],
}
const STAT_FR={finishing:'Finition',dribbling:'Dribble',ball_control:'Contrôle',fk_accuracy:'Coup franc',curve:'Effet',volleys:'Volée',short_passing:'Passe courte',long_passing:'Passe longue',crossing:'Centre',heading:'Jeu de tête',acceleration:'Accélération',sprint_speed:'Vitesse',agility:'Agilité',reactions:'Réactions',balance:'Équilibre',shot_power:'Puissance',jumping:'Saut',stamina:'Endurance',strength:'Force',long_shots:'Tir lointain',aggression:'Agressivité',defensive_awareness:'Conscience déf.',sliding_tackle:'Tacle glissé',standing_tackle:'Tacle debout',interceptions:'Interceptions',positioning:'Placement',vision:'Vision',penalties:'Pénalty',composure:'Sang-froid',gk_diving:'Plongeon',gk_reflexes:'Réflexes',gk_kicking:'Dégagement',gk_handling:'Relance',gk_positioning:'Placement GB'}

const statColor=v=>v>=85?'#00d084':v>=75?'#58a6ff':v>=65?'#d29922':'#f85149'
const posColor=g=>g==='GK'?'#f0a500':g==='DEF'?'#58a6ff':g==='MID'?'#3fb950':'#f85149'
const fmtK=v=>v!=null&&v>0?`${Math.round(v/1000)}K€/s`:'—'
const fmtM=v=>v!=null&&v>0?`${(v/1e6).toFixed(1)}M€`:'—'
const fmtStar=n=>'★'.repeat(Math.min(n,5))+'☆'.repeat(Math.max(0,5-n))

// ═══════════════════════════════════════════════════════════════════════════
// FORMATIONS — 15 dispositifs avec coordonnées pitch (%)
// ═══════════════════════════════════════════════════════════════════════════
const FORMATIONS = {
  '4-3-3 (Attack)': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LM',x:22,y:53},{p:'CM',x:50,y:51},{p:'RM',x:78,y:53},
    {p:'LW',x:18,y:22},{p:'ST',x:50,y:16},{p:'RW',x:82,y:22},
  ],
  '4-3-3 (Hold)': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LDM',x:30,y:58},{p:'CM',x:50,y:55},{p:'RDM',x:70,y:58},
    {p:'LW',x:18,y:26},{p:'ST',x:50,y:18},{p:'RW',x:82,y:26},
  ],
  '4-2-3-1': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LDM',x:36,y:60},{p:'RDM',x:64,y:60},
    {p:'LAM',x:16,y:40},{p:'CAM',x:50,y:40},{p:'RAM',x:84,y:40},
    {p:'ST',x:50,y:17},
  ],
  '4-4-2': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LM',x:10,y:53},{p:'LCM',x:37,y:53},{p:'RCM',x:63,y:53},{p:'RM',x:90,y:53},
    {p:'LS',x:36,y:17},{p:'RS',x:64,y:17},
  ],
  '4-4-2 (Flat)': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LM',x:10,y:53},{p:'LCM',x:36,y:57},{p:'RCM',x:64,y:57},{p:'RM',x:90,y:53},
    {p:'LS',x:33,y:19},{p:'RS',x:67,y:19},
  ],
  '4-5-1': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LM',x:8,y:50},{p:'LCM',x:28,y:53},{p:'CM',x:50,y:54},{p:'RCM',x:72,y:53},{p:'RM',x:92,y:50},
    {p:'ST',x:50,y:18},
  ],
  '4-1-4-1': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'CDM',x:50,y:63},
    {p:'LM',x:10,y:44},{p:'LCM',x:33,y:46},{p:'RCM',x:67,y:46},{p:'RM',x:90,y:44},
    {p:'ST',x:50,y:18},
  ],
  '4-1-2-1-2': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'CDM',x:50,y:63},
    {p:'LM',x:22,y:50},{p:'RM',x:78,y:50},
    {p:'CAM',x:50,y:38},
    {p:'LS',x:33,y:18},{p:'RS',x:67,y:18},
  ],
  '4-3-2-1': [
    {p:'GK',x:50,y:92},{p:'LB',x:13,y:73},{p:'LCB',x:36,y:77},{p:'RCB',x:64,y:77},{p:'RB',x:87,y:73},
    {p:'LCM',x:25,y:57},{p:'CM',x:50,y:58},{p:'RCM',x:75,y:57},
    {p:'LAM',x:30,y:38},{p:'RAM',x:70,y:38},
    {p:'ST',x:50,y:18},
  ],
  '3-5-2': [
    {p:'GK',x:50,y:92},{p:'LCB',x:22,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:78,y:77},
    {p:'LM',x:8,y:54},{p:'LCM',x:30,y:56},{p:'CM',x:50,y:56},{p:'RCM',x:70,y:56},{p:'RM',x:92,y:54},
    {p:'LS',x:34,y:18},{p:'RS',x:66,y:18},
  ],
  '3-4-3': [
    {p:'GK',x:50,y:92},{p:'LCB',x:22,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:78,y:77},
    {p:'LM',x:14,y:56},{p:'LCM',x:38,y:58},{p:'RCM',x:62,y:58},{p:'RM',x:86,y:56},
    {p:'LW',x:18,y:22},{p:'ST',x:50,y:17},{p:'RW',x:82,y:22},
  ],
  '3-4-2-1': [
    {p:'GK',x:50,y:92},{p:'LCB',x:22,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:78,y:77},
    {p:'LM',x:14,y:58},{p:'LCM',x:36,y:60},{p:'RCM',x:64,y:60},{p:'RM',x:86,y:58},
    {p:'LAM',x:30,y:38},{p:'RAM',x:70,y:38},
    {p:'ST',x:50,y:18},
  ],
  '5-3-2': [
    {p:'GK',x:50,y:92},{p:'LB',x:8,y:71},{p:'LCB',x:26,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:74,y:77},{p:'RB',x:92,y:71},
    {p:'LCM',x:25,y:53},{p:'CM',x:50,y:51},{p:'RCM',x:75,y:53},
    {p:'LS',x:34,y:18},{p:'RS',x:66,y:18},
  ],
  '5-4-1': [
    {p:'GK',x:50,y:92},{p:'LB',x:8,y:71},{p:'LCB',x:26,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:74,y:77},{p:'RB',x:92,y:71},
    {p:'LM',x:10,y:52},{p:'LCM',x:34,y:54},{p:'RCM',x:66,y:54},{p:'RM',x:90,y:52},
    {p:'ST',x:50,y:18},
  ],
  '5-2-1-2': [
    {p:'GK',x:50,y:92},{p:'LB',x:8,y:71},{p:'LCB',x:26,y:77},{p:'CB',x:50,y:79},{p:'RCB',x:74,y:77},{p:'RB',x:92,y:71},
    {p:'LDM',x:32,y:60},{p:'RDM',x:68,y:60},
    {p:'CAM',x:50,y:41},
    {p:'LS',x:33,y:18},{p:'RS',x:67,y:18},
  ],
}

// ════════════════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════════════════
const css=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{background:#0d1117;color:#e6edf3;font-family:-apple-system,'Segoe UI',sans-serif;font-size:14px}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#0d1117}::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
.shell{display:flex;height:100vh;overflow:hidden}
.sidebar{width:210px;flex-shrink:0;background:#161b22;border-right:1px solid #21262d;display:flex;flex-direction:column;padding:12px 0;overflow-y:auto}
.main{flex:1;overflow-y:auto;padding:24px}
.logo{text-align:center;padding:0 12px 16px;border-bottom:1px solid #21262d;margin-bottom:8px}
.logo-icon{font-size:32px}.logo-name{color:#e6edf3;font-size:14px;font-weight:700;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.logo-sub{color:#58a6ff;font-size:11px}
.nav-section{font-size:10px;color:#444d56;text-transform:uppercase;letter-spacing:1px;padding:14px 14px 5px}
.nav-btn{width:100%;padding:9px 14px;text-align:left;background:none;border:none;color:#8b949e;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:8px;transition:all .15s}
.nav-btn:hover{background:#1c2128;color:#e6edf3}
.nav-btn.active{background:#1f2937;color:#58a6ff;border-left:2px solid #58a6ff}
.page-title{font-size:20px;font-weight:800;margin-bottom:18px;display:flex;align-items:center;gap:10px}
.section-title{font-size:11px;font-weight:600;color:#8b949e;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px}
.kpi{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:14px}
.kpi-label{font-size:10px;color:#8b949e;text-transform:uppercase;letter-spacing:.8px}
.kpi-value{font-size:22px;font-weight:800;margin:4px 0}
.kpi-sub{font-size:11px;color:#58a6ff}
.card{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:14px;margin-bottom:14px}
.card-title{font-size:13px;font-weight:600;margin-bottom:10px}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:7px 10px;color:#8b949e;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #21262d;white-space:nowrap;cursor:pointer;position:sticky;top:0;background:#161b22}
th:hover{color:#e6edf3}
td{padding:7px 10px;border-bottom:1px solid #1c2128;white-space:nowrap}
tr:hover td{background:#1c2128}
tr.row-sel td{background:#1f2937}
.badge{display:inline-block;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700}
.oval{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;font-weight:800;color:#0d1117;flex-shrink:0}
.pos-tag{border-radius:3px;padding:1px 5px;font-size:10px;font-weight:700}
.tag{background:#1c2128;border:1px solid #30363d;border-radius:4px;padding:1px 7px;font-size:11px;color:#8b949e;display:inline-block;margin:2px}
.btn{border:none;border-radius:6px;padding:7px 14px;font-size:12px;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn:hover{opacity:.85}
.btn-primary{background:#238636;color:#fff}
.btn-blue{background:#1f6feb;color:#fff}
.btn-ghost{background:#21262d;color:#e6edf3;border:1px solid #30363d}
.inp{background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:7px 11px;font-size:12px;outline:none}
.inp:focus{border-color:#58a6ff}
select.inp option{background:#1c2128}
.stat-bar{height:4px;border-radius:2px;background:#21262d;margin-top:2px}
.stat-bar-fill{height:100%;border-radius:2px}
.filter-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#161b22;border:1px solid #30363d;border-radius:12px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;padding:22px}
.tcard{background:#161b22;border:1px solid #21262d;border-radius:10px;padding:14px;cursor:pointer;transition:all .15s}
.tcard:hover{border-color:#58a6ff;transform:translateY(-2px)}
.tcard.my-team{border-color:#3fb950}
.team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}
.pcard{background:#1c2128;border:1px solid #30363d;border-radius:7px;padding:9px 11px;cursor:pointer;transition:all .15s}
.pcard:hover{border-color:#58a6ff}
.upload-zone{border:2px dashed #30363d;border-radius:12px;padding:40px 30px;text-align:center;transition:all .2s;cursor:pointer}
.upload-zone:hover,.drag{border-color:#58a6ff;background:#1c2128}
.alert{border-radius:8px;padding:10px 14px;font-size:12px;margin-bottom:14px}
.al-err{background:#2d1b1b;border:1px solid #5a1d1d;color:#f85149}
.al-ok{background:#1a2d1a;border:1px solid #238636;color:#3fb950}
.al-info{background:#1b2d3d;border:1px solid #1d4a6e;color:#58a6ff}
.progress-bg{background:#21262d;border-radius:4px;height:7px;overflow:hidden}
.progress-fill{height:100%;border-radius:4px;transition:width .3s}
.grow-up{color:#3fb950}.grow-dn{color:#f85149}.grow-eq{color:#8b949e}

/* ── PITCH REDESIGN ── */
.pitch-outer{background:linear-gradient(160deg,#0f2d0f,#14381a,#0f2d0f);border:2px solid #1e4a1e;border-radius:12px;position:relative;overflow:hidden;box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
.pitch-line{position:absolute;background:rgba(255,255,255,.1)}
.pitch-center-circle{position:absolute;left:50%;top:50%;width:90px;height:90px;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.1);border-radius:50%}
.pitch-stripe{position:absolute;left:0;right:0;top:50%;height:50%;background:rgba(0,0,0,.04)}
.pslot{position:absolute;transform:translate(-50%,-50%);text-align:center;cursor:pointer;z-index:3;transition:transform .15s}
.pslot:hover{transform:translate(-50%,-50%) scale(1.08)}
.pslot-disc{width:46px;height:46px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto;border:2px solid rgba(255,255,255,.2);box-shadow:0 2px 8px rgba(0,0,0,.5);transition:border-color .2s,box-shadow .2s}
.pslot-disc.active-slot{border-color:#58a6ff;box-shadow:0 0 12px rgba(88,166,255,.4)}
.pslot-disc.empty-slot{background:#1a2a1a;border-style:dashed}
.pslot-ovr{font-size:13px;font-weight:800;color:#0d1117;line-height:1}
.pslot-pos{font-size:9px;font-weight:700;color:rgba(0,0,0,.6);line-height:1;margin-top:1px}
.pslot-name{font-size:9px;color:rgba(255,255,255,.8);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60px}
.pslot-empty-label{font-size:10px;font-weight:700;color:#3d5c3d}

/* Formation selector */
.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px}
.form-btn{border:1px solid #30363d;border-radius:8px;padding:10px 8px;background:#1c2128;color:#8b949e;cursor:pointer;text-align:center;font-size:12px;font-weight:600;transition:all .15s}
.form-btn:hover{border-color:#58a6ff;color:#e6edf3}
.form-btn.active-form{border-color:#3fb950;color:#3fb950;background:#1a2d1a}
.form-btn .form-num{font-size:16px;font-weight:800;display:block;margin-bottom:2px}

/* Trophy row */
.trophy-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px}
.trophy-card{background:linear-gradient(135deg,#1c1a10,#252210);border:1px solid #3d3510;border-radius:10px;padding:14px 20px;text-align:center;min-width:120px}
.trophy-icon{font-size:32px;display:block;margin-bottom:4px}
.trophy-count{font-size:28px;font-weight:800;color:#f0a500}
.trophy-label{font-size:11px;color:#8b949e}

/* Season row */
.season-row{display:flex;align-items:center;gap:12px;background:#1c2128;border-radius:8px;padding:10px 14px;margin-bottom:8px}
.season-pos{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex-shrink:0}
`

// ── Atoms ─────────────────────────────────────────────────────────────────
const Oval=({v,size=30})=>{const c=statColor(v);return<div className="oval"style={{width:size,height:size,background:c,fontSize:size*.34,flexShrink:0}}>{v}</div>}
const Pos=({p,lg})=>{const g=posGroup(p);const c=posColor(g);return<span className="pos-tag"style={{background:c,color:'#0d1117',fontSize:lg?12:10}}>{p||'?'}</span>}
const StatBar=({k,v})=><div style={{marginBottom:7}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:1}}><span style={{color:'#8b949e'}}>{STAT_FR[k]??k}</span><span style={{fontWeight:700,color:statColor(v)}}>{v}</span></div><div className="stat-bar"><div className="stat-bar-fill"style={{width:`${v}%`,background:statColor(v)}}/></div></div>

// ── Player Modal ──────────────────────────────────────────────────────────
function PlayerModal({p,onClose}){
  if(!p)return null
  const isGK=p.preferredposition==='GK'
  const groups=Object.entries(STAT_GROUPS).filter(([g])=>isGK?g!=='Défense':g!=='Gardien')
  return(
    <div className="modal-bg"onClick={onClose}>
      <div className="modal"onClick={e=>e.stopPropagation()}>
        <button onClick={onClose}style={{float:'right',background:'none',border:'none',color:'#8b949e',cursor:'pointer',fontSize:18}}>✕</button>
        <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:16}}>
          <Oval v={p.overall}size={52}/>
          <div>
            <div style={{fontSize:20,fontWeight:800}}>{p.name}</div>
            <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
              <Pos p={p.preferredposition}lg/>
              <span style={{color:'#8b949e',fontSize:12}}>{p.teamname||p.isyouth?'🌱 Académie':''}</span>
              {p.isloaned&&<span className="badge"style={{background:'#9e6a03',color:'#fff'}}>PRÊT·{p.loanedfrom}</span>}
              {p.isyouth&&<span className="badge"style={{background:'#1f4f1f',color:'#3fb950'}}>JEUNE</span>}
            </div>
          </div>
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <div style={{color:'#58a6ff',fontSize:22,fontWeight:700}}>{p.potential}</div>
            <div style={{color:'#8b949e',fontSize:10}}>Potentiel</div>
          </div>
        </div>
        <div className="three-col"style={{marginBottom:14}}>
          {[
            ['🎂 Naissance',p.birthdate??'—'],['🎂 Âge',p.age?`${p.age} ans`:'—'],
            ['📏 Taille',p.height?`${p.height}cm`:'—'],
            ['⚽ Buts',p.leaguegoals??0],['📅 Matchs',p.appearances??0],
            ['💵 Salaire',fmtK(p.wage)],['📋 Contrat',p.contractuntil??'—'],
            ['🦶 Pied',p.preferredfoot],['⭐ Dribbles','★'.repeat(Math.min(p.skillmoves??0,5))],
            ['🌍 Réputation','★'.repeat(Math.min(p.intlrep??1,5))],
            ['📈 Croissance',p.growth!=null?<span className={p.growth>0?'grow-up':p.growth<0?'grow-dn':'grow-eq'}>{p.growth>0?'▲':p.growth<0?'▼':'='}{Math.abs(p.growth)}</span>:'—'],
            p.isyouth?['🏅 Tier',p.playertier!=null?`Tier ${p.playertier}`:'—']:['💧 Pied faible','★'.repeat(Math.min(p.weakfoot??1,5))],
          ].map(([l,v])=>(
            <div key={l}style={{background:'#1c2128',borderRadius:6,padding:'7px 10px'}}>
              <div style={{color:'#8b949e',fontSize:10}}>{l}</div>
              <div style={{fontWeight:600,fontSize:12,marginTop:1}}>{v}</div>
            </div>
          ))}
        </div>
        <div className="two-col">
          {groups.map(([grp,keys])=>(
            <div key={grp}><div className="section-title">{grp}</div>{keys.map(k=><StatBar key={k}k={k}v={p.stats[k]??0}/>)}</div>
          ))}
        </div>
        {p.playstyles?.length>0&&(
          <div style={{marginTop:12}}>
            <div className="section-title"style={{marginBottom:6}}>Playstyles</div>
            {p.playstyles.map(ps=><span key={ps}className="tag">{ps}</span>)}
            {p.playstylesplus?.map(ps=><span key={ps}className="tag"style={{borderColor:'#58a6ff',color:'#58a6ff'}}>★ {ps}</span>)}
          </div>
        )}
        {p.allpositions?.length>1&&(
          <div style={{marginTop:10}}>
            <div className="section-title"style={{marginBottom:6}}>Autres positions</div>
            {p.allpositions.map(pp=><span key={pp}style={{marginRight:4}}><Pos p={pp}/></span>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// UPLOAD PAGE
// ════════════════════════════════════════════════════════════════════════════
function UploadPage({onLoaded}){
  const[loading,setLoading]=useState(false)
  const[err,setErr]=useState(null)
  const[drag,setDrag]=useState(false)
  const[meta,setMeta]=useState(null)
  const[names,setNames]=useState(null)
  const[namesType,setNamesType]=useState(null)

  useEffect(()=>{
    fetch('./fifa_ng_db-meta.xml').then(r=>r.text()).then(setMeta)
    fetch('./playernames.csv').then(r=>r.text()).then(t=>{
      setNames(t)
      setNamesType(t.toLowerCase().includes('player_id')||t.toLowerCase().includes('short_name')?'kaggle':'ea')
    })
  },[])

  const process=useCallback(async file=>{
    if(!meta||!names){setErr('Ressources non chargées, patiente 1s…');return}
    setLoading(true);setErr(null)
    try{
      const buf=await file.arrayBuffer()
      const data=await parser.parseSave(new Buffer(buf),meta)
      if(!data||data.every(d=>!d))throw new Error('Aucune base EA trouvée dans ce fichier.')
      onLoaded(buildGameState(data,names))
    }catch(e){setErr(e.message??String(e))}
    finally{setLoading(false)}
  },[meta,names,onLoaded])

  const onFile=e=>{const f=e.target.files[0];if(f)process(f)}
  const onDrop=e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)process(f)}

  return(
    <div style={{maxWidth:600,margin:'60px auto',padding:'0 20px'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:56}}>⚽</div>
        <h1 style={{fontSize:24,fontWeight:800,margin:'10px 0 6px'}}>FC 26 Manager Dashboard</h1>
        <p style={{color:'#8b949e',fontSize:14}}>Charge ta sauvegarde Career Mode</p>
      </div>
      {err&&<div className="alert al-err">❌ {err}</div>}
      {namesType&&(
        <div className={`alert ${namesType==='kaggle'?'al-ok':'al-info'}`}>
          {namesType==='kaggle'?'✅ playernames.csv — Format Kaggle FC26 détecté':'ℹ️ playernames.csv — Format EA détecté (remplace par le dataset Kaggle FC26 pour de meilleurs noms)'}
        </div>
      )}
      {loading?(
        <div className="card"style={{textAlign:'center',padding:36}}>
          <div style={{fontSize:28,marginBottom:10}}>⏳</div>
          <div style={{fontWeight:600}}>Extraction en cours…</div>
          <div style={{color:'#8b949e',fontSize:12,marginTop:6}}>Lecture des bases de données EA</div>
        </div>
      ):(
        <label>
          <input type="file"style={{display:'none'}}onChange={onFile}/>
          <div className={`upload-zone${drag?' drag':''}`}
            onDragOver={e=>{e.preventDefault();setDrag(true)}}onDragLeave={()=>setDrag(false)}onDrop={onDrop}>
            <div style={{fontSize:40,marginBottom:12}}>📁</div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Glisse ton fichier ici</div>
            <div style={{color:'#8b949e',fontSize:13,marginBottom:14}}>ou clique pour parcourir</div>
            <div className="btn btn-primary"style={{display:'inline-block'}}>Choisir la sauvegarde</div>
          </div>
        </label>
      )}
      <div className="card"style={{marginTop:16}}>
        <div className="card-title">📌 Localisation & Noms</div>
        <div style={{fontSize:12,color:'#8b949e',lineHeight:1.8}}>
          <strong style={{color:'#e6edf3'}}>Saves Windows : </strong><code>Documents\EA Sports\EA SPORTS FC 26\saves\</code><br/>
          <strong style={{color:'#e6edf3'}}>Pour les noms FC26 : </strong>télécharge le CSV Kaggle <em>fc-26-fifa-26-player-data</em>, renomme-le <code>playernames.csv</code> et remplace-le dans <code>public/</code>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TEAM SELECT
// ════════════════════════════════════════════════════════════════════════════
function TeamSelectPage({state,onSelect}){
  const[search,setSearch]=useState('')
  const[league,setLeague]=useState('all')
  const leagues=[...new Set(Object.values(state.teams).map(t=>t.leaguename).filter(Boolean))].sort()
  const teams=Object.values(state.teams)
    .filter(t=>t.teamname?.trim())
    .filter(t=>league==='all'||t.leaguename===league)
    .filter(t=>!search||t.teamname.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{if(a.teamid===state.userTeamId)return -1;if(b.teamid===state.userTeamId)return 1;return a.teamname.localeCompare(b.teamname)})
  return(
    <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>
      <div className="page-title">🏟️ Choisir un club</div>
      {state.userTeamId&&(
        <div className="alert al-ok"style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span>✅ Club détecté : <strong>{state.teams[state.userTeamId]?.teamname}</strong></span>
          <button className="btn btn-primary"style={{padding:'4px 12px',fontSize:11}}onClick={()=>onSelect(state.userTeamId)}>Sélectionner →</button>
        </div>
      )}
      <div className="filter-row">
        <input className="inp"placeholder="🔍 Rechercher…"value={search}onChange={e=>setSearch(e.target.value)}style={{width:230}}/>
        <select className="inp"value={league}onChange={e=>setLeague(e.target.value)}>
          <option value="all">Toutes les ligues</option>
          {leagues.map(l=><option key={l}>{l}</option>)}
        </select>
        <span style={{color:'#8b949e',fontSize:12}}>{teams.length} clubs</span>
      </div>
      <div className="team-grid">
        {teams.map(t=>{
          const pl=state.playersByTeam[t.teamid]??[]
          const avg=pl.length?Math.round(pl.reduce((s,p)=>s+p.overall,0)/pl.length):0
          return(
            <div key={t.teamid}className={`tcard${t.teamid===state.userTeamId?' my-team':''}`}onClick={()=>onSelect(t.teamid)}>
              {t.teamid===state.userTeamId&&<div style={{fontSize:10,color:'#3fb950',marginBottom:3}}>★ TON ÉQUIPE</div>}
              <div style={{fontWeight:700,fontSize:14}}>{t.teamname}</div>
              <div style={{color:'#8b949e',fontSize:11,margin:'3px 0'}}>{t.leaguename}</div>
              <div style={{display:'flex',gap:10,alignItems:'center',marginTop:6}}>
                <span style={{fontSize:11,color:'#8b949e'}}>{pl.length} joueurs</span>
                {avg>0&&<Oval v={avg}size={24}/>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SQUAD PAGE
// ════════════════════════════════════════════════════════════════════════════
function SquadPage({players}){
  const[sort,setSort]=useState({key:'overall',dir:-1})
  const[pos,setPos]=useState('all')
  const[search,setSearch]=useState('')
  const[sel,setSel]=useState(null)
  const setS=k=>setSort(s=>({key:k,dir:s.key===k?-s.dir:-1}))
  const list=[...players]
    .filter(p=>pos==='all'||p.posgroup===pos||p.preferredposition===pos)
    .filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{const va=a[sort.key]??a.stats?.[sort.key]??0;const vb=b[sort.key]??b.stats?.[sort.key]??0;return(va-vb)*sort.dir})
  const Th=({k,l})=><th onClick={()=>setS(k)}>{l}{sort.key===k?(sort.dir<0?' ▼':' ▲'):''}</th>
  return(
    <div>
      <div className="filter-row">
        <input className="inp"placeholder="🔍 Nom…"value={search}onChange={e=>setSearch(e.target.value)}style={{width:190}}/>
        {['all','GK','DEF','MID','ATT'].map(p=>(
          <button key={p}className={`btn ${pos===p?'btn-blue':'btn-ghost'}`}style={{padding:'5px 11px'}}onClick={()=>setPos(p)}>{p==='all'?'Tous':p}</button>
        ))}
        <span style={{color:'#8b949e',fontSize:12,marginLeft:'auto'}}>{list.length} joueurs</span>
      </div>
      <div className="card"style={{padding:0}}>
        <div className="table-wrap"><table>
          <thead><tr>
            <Th k="jerseynumber"l="#"/><th>Joueur</th><Th k="overall"l="OVR"/><Th k="potential"l="POT"/>
            <th>Pos</th><Th k="stats.finishing"l="FIN"/><Th k="stats.dribbling"l="DRI"/>
            <Th k="stats.short_passing"l="PAS"/><Th k="stats.sprint_speed"l="VIT"/>
            <Th k="stats.defensive_awareness"l="DEF"/><Th k="stats.stamina"l="END"/>
            <Th k="leaguegoals"l="Buts"/><Th k="appearances"l="Matchs"/>
            <Th k="wage"l="Salaire"/><Th k="contractuntil"l="Contrat"/>
          </tr></thead>
          <tbody>
            {list.map(p=>{const s=p.stats;return(
              <tr key={p.playerid}className={sel?.playerid===p.playerid?'row-sel':''}style={{cursor:'pointer'}}onClick={()=>setSel(p)}>
                <td style={{color:'#8b949e'}}>{p.jerseynumber??'—'}</td>
                <td><div style={{fontWeight:600}}>{p.name}</div>{p.isloaned&&<div style={{fontSize:10,color:'#d29922'}}>Prêt·{p.loanedfrom}</div>}</td>
                <td><Oval v={p.overall}size={28}/></td>
                <td style={{color:'#8b949e'}}>{p.potential}</td>
                <td><Pos p={p.preferredposition}/></td>
                {[s?.finishing,s?.dribbling,s?.short_passing,s?.sprint_speed,s?.defensive_awareness,s?.stamina].map((v,i)=>(
                  <td key={i}style={{color:statColor(v??0),fontWeight:600}}>{v??'—'}</td>
                ))}
                <td style={{color:'#3fb950',fontWeight:600}}>{p.leaguegoals??0}</td>
                <td style={{color:'#8b949e'}}>{p.appearances??0}</td>
                <td style={{color:'#8b949e'}}>{fmtK(p.wage)}</td>
                <td style={{color:(p.contractuntil??9999)<2027?'#f85149':'#8b949e'}}>{p.contractuntil??'—'}</td>
              </tr>
            )})}
          </tbody>
        </table></div>
      </div>
      {sel&&<PlayerModal p={sel}onClose={()=>setSel(null)}/>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TACTICS — Redesigné
// ════════════════════════════════════════════════════════════════════════════
function TacticsPage({players}){
  const[form,setForm]=useState('4-3-3 (Attack)')
  const[slots,setSlots]=useState({})
  const[activeSl,setActiveSl]=useState(null)
  const[pickSearch,setPickSearch]=useState('')
  const[selP,setSelP]=useState(null)

  const layout=FORMATIONS[form]??FORMATIONS['4-3-3 (Attack)']
  const usedIds=new Set(Object.values(slots).map(p=>p.playerid))
  const available=players.filter(p=>!usedIds.has(p.playerid))
    .filter(p=>!pickSearch||p.name.toLowerCase().includes(pickSearch.toLowerCase()))
    .sort((a,b)=>b.overall-a.overall).slice(0,60)

  const assign=(i,p)=>{setSlots(s=>({...s,[i]:p}));setActiveSl(null)}
  const remove=i=>setSlots(s=>{const n={...s};delete n[i];return n})

  const autoFill=()=>{
    const used=new Set();const ns={}
    layout.forEach((slot,i)=>{
      const g=slot.p==='GK'?'GK':['LB','RB','LCB','RCB','CB'].includes(slot.p)?'DEF':['ST','LS','RS','LW','RW','RF','LF'].includes(slot.p)?'ATT':'MID'
      const c=players.filter(p=>!used.has(p.playerid)&&p.posgroup===g).sort((a,b)=>b.overall-a.overall)[0]
             ??players.filter(p=>!used.has(p.playerid)).sort((a,b)=>b.overall-a.overall)[0]
      if(c){ns[i]=c;used.add(c.playerid)}
    })
    setSlots(ns)
  }

  const totalOvr=Object.values(slots).length>0
    ?Math.round(Object.values(slots).reduce((s,p)=>s+p.overall,0)/Object.values(slots).length):0

  return(
    <div>
      {/* Formation picker */}
      <div className="form-grid">
        {Object.keys(FORMATIONS).map(f=>(
          <button key={f}className={`form-btn${form===f?' active-form':''}`}
            onClick={()=>{setForm(f);setSlots({})}}>
            <span className="form-num">{f.split(' ')[0]}</span>
            <span style={{fontSize:10,color:form===f?'#3fb950':'#555'}}>{f.includes('(')?f.slice(f.indexOf('(')):''}</span>
          </button>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 270px',gap:16}}>
        {/* Pitch */}
        <div>
          <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'center'}}>
            <button className="btn btn-primary"style={{padding:'6px 14px'}}onClick={autoFill}>⚡ Auto-remplir</button>
            <button className="btn btn-ghost"style={{padding:'6px 14px'}}onClick={()=>setSlots({})}>🗑 Vider</button>
            {totalOvr>0&&<span style={{marginLeft:'auto',color:statColor(totalOvr),fontWeight:800,fontSize:20}}>OVR {totalOvr}</span>}
          </div>

          <div className="pitch-outer"style={{height:500}}>
            <div className="pitch-stripe"/>
            {/* Lignes */}
            <div className="pitch-line"style={{left:'5%',right:'5%',top:1,height:1}}/>
            <div className="pitch-line"style={{left:'5%',right:'5%',bottom:1,height:1}}/>
            <div className="pitch-line"style={{left:'5%',right:'5%',top:'50%',height:1}}/>
            <div className="pitch-line"style={{left:'5%',width:1,top:'5%',bottom:'5%'}}/>
            <div className="pitch-line"style={{right:'5%',width:1,top:'5%',bottom:'5%'}}/>
            {/* Surfaces */}
            <div className="pitch-line"style={{left:'30%',right:'30%',top:'5%',height:'14%'}}/>
            <div className="pitch-line"style={{left:'30%',right:'30%',bottom:'5%',height:'14%'}}/>
            <div className="pitch-line"style={{left:'38%',right:'38%',top:'5%',height:'7%'}}/>
            <div className="pitch-line"style={{left:'38%',right:'38%',bottom:'5%',height:'7%'}}/>
            <div className="pitch-center-circle"/>

            {layout.map((slot,i)=>{
              const p=slots[i]
              const isActive=activeSl===i
              const g=p?posGroup(p.preferredposition):null
              const bg=p?posColor(g):'#1a3020'
              return(
                <div key={i}className="pslot"style={{left:`${slot.x}%`,top:`${slot.y}%`}}
                  onClick={()=>{if(p){setSelP(p)}else{setActiveSl(isActive?null:i)}}}>
                  <div className={`pslot-disc${isActive?' active-slot':p?'':' empty-slot'}`}
                    style={{background:p?bg:'#1a3020'}}>
                    {p?(
                      <>
                        <div className="pslot-ovr">{p.overall}</div>
                        <div className="pslot-pos">{p.preferredposition}</div>
                      </>
                    ):(
                      <div className="pslot-empty-label">{slot.p}</div>
                    )}
                  </div>
                  <div className="pslot-name">{p?p.name.split(' ').pop():''}</div>
                  {isActive&&!p&&(
                    <div style={{position:'absolute',top:'110%',left:'50%',transform:'translateX(-50%)',
                      background:'#1f6feb',color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:9,
                      whiteSpace:'nowrap',zIndex:5}}>← sélectionner</div>
                  )}
                  {p&&(
                    <button onClick={e=>{e.stopPropagation();remove(i)}}
                      style={{position:'absolute',top:-4,right:-4,background:'#f85149',border:'none',
                        color:'#fff',borderRadius:'50%',width:14,height:14,cursor:'pointer',
                        fontSize:9,display:'flex',alignItems:'center',justifyContent:'center',zIndex:4}}>✕</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Picker */}
        <div>
          <div style={{fontSize:12,fontWeight:600,color:activeSl!==null?'#58a6ff':'#8b949e',marginBottom:8}}>
            {activeSl!==null?`▶ Poste : ${layout[activeSl]?.p}`:'Cliquer un emplacement vide'}
          </div>
          <input className="inp"placeholder="🔍 Rechercher…"value={pickSearch}
            onChange={e=>setPickSearch(e.target.value)}style={{width:'100%',marginBottom:8}}/>
          <div style={{maxHeight:440,overflowY:'auto',display:'flex',flexDirection:'column',gap:5}}>
            {available.map(p=>(
              <div key={p.playerid}className="pcard"
                onClick={()=>{if(activeSl!==null)assign(activeSl,p);else setSelP(p)}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <Oval v={p.overall}size={26}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <Pos p={p.preferredposition}/>
                  </div>
                  <span style={{fontSize:10,color:'#8b949e'}}>{p.potential}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XI résumé */}
      {Object.keys(slots).length>0&&(
        <div className="card"style={{marginTop:14}}>
          <div className="card-title">📋 XI Titulaire — {form}</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {layout.map((slot,i)=>{
              const p=slots[i];if(!p)return null
              const g=posGroup(p.preferredposition)
              return(
                <div key={i}style={{background:'#1c2128',borderRadius:6,padding:'6px 10px',
                  border:`1px solid ${posColor(g)}40`,minWidth:110}}>
                  <div style={{fontSize:10,color:'#8b949e'}}>{slot.p}</div>
                  <div style={{fontSize:12,fontWeight:600}}>{p.name}</div>
                  <div style={{display:'flex',gap:3,alignItems:'center',marginTop:2}}>
                    <Oval v={p.overall}size={20}/><Pos p={p.preferredposition}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {selP&&<PlayerModal p={selP}onClose={()=>setSelP(null)}/>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// YOUTH ACADEMY
// ════════════════════════════════════════════════════════════════════════════
function YouthPage({youth}){
  const[sel,setSel]=useState(null)
  if(!youth?.length)return<div className="alert al-info">Aucun joueur dans le centre de formation (trainingteamplayers vide).</div>
  return(
    <div>
      <div style={{color:'#8b949e',fontSize:12,marginBottom:12}}>
        {youth.length} jeune(s) — Données extraites directement depuis la sauvegarde
      </div>
      <div className="card"style={{padding:0}}>
        <div className="table-wrap"><table>
          <thead><tr>
            <th>Joueur</th><th>OVR</th><th>POT</th><th>Pos</th>
            <th>Âge</th><th>Tier</th><th>Mois squad</th><th>Buts</th><th>Matchs</th>
          </tr></thead>
          <tbody>
            {[...youth].sort((a,b)=>b.potential-a.potential).map(p=>(
              <tr key={p.playerid}style={{cursor:'pointer'}}onClick={()=>setSel(p)}>
                <td style={{fontWeight:600}}>{p.name}</td>
                <td><Oval v={p.overall}size={26}/></td>
                <td style={{color:statColor(p.potential??0),fontWeight:700}}>{p.potential}</td>
                <td><Pos p={p.preferredposition}/></td>
                <td style={{color:'#8b949e'}}>{p.age??'—'}</td>
                <td>{p.playertier!=null?<span className="badge"style={{background:'#1f4f1f',color:'#3fb950'}}>T{p.playertier}</span>:'—'}</td>
                <td style={{color:'#8b949e'}}>{p.monthsinsquad??'—'}</td>
                <td style={{color:'#3fb950',fontWeight:600}}>{p.leaguegoals??0}</td>
                <td style={{color:'#8b949e'}}>{p.appearances??0}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {sel&&<PlayerModal p={sel}onClose={()=>setSel(null)}/>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PALMARES PAGE
// ════════════════════════════════════════════════════════════════════════════
function PalmaresPage({palmares,manager,teams}){
  if(!palmares?.history?.length)return<div className="alert al-info">Aucun historique de carrière disponible (career_managerhistory vide — normal si c'est la 1ère saison).</div>
  const totalTrophies=palmares.totalLeagueTrophies+palmares.totalDomesticCupTrophies+palmares.totalContinentalTrophies
  const winPct=palmares.totalGames>0?Math.round(palmares.totalWins/palmares.totalGames*100):0

  return(
    <div>
      {/* Trophées */}
      <div className="trophy-row">
        {[
          ['🏆','Ligues',palmares.totalLeagueTrophies],
          ['🥇','Coupes Nat.',palmares.totalDomesticCupTrophies],
          ['🌟','Coupes Cont.',palmares.totalContinentalTrophies],
          ['🎖️','Total',totalTrophies],
        ].map(([ico,label,n])=>(
          <div key={label}className="trophy-card">
            <span className="trophy-icon">{ico}</span>
            <div className="trophy-count">{n}</div>
            <div className="trophy-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Stats globales */}
      <div className="kpi-grid"style={{marginBottom:20}}>
        {[
          ['⚽ Matchs totaux',palmares.totalGames,'carrière'],
          ['✅ Victoires',palmares.totalWins,`${winPct}% de victoires`],
          ['🟡 Nuls',palmares.totalDraws,''],
          ['❌ Défaites',palmares.totalLosses,''],
        ].map(([l,v,s])=>(
          <div key={l}className="kpi"><div className="kpi-label">{l}</div><div className="kpi-value">{v}</div><div className="kpi-sub">{s}</div></div>
        ))}
      </div>

      {/* Records */}
      {(manager.bigwin?.team||manager.bigloss?.team)&&(
        <div className="two-col"style={{marginBottom:16}}>
          {manager.bigwin?.team&&(
            <div className="card">
              <div className="card-title">🏆 Plus grande victoire</div>
              <div style={{fontSize:24,fontWeight:800,color:'#3fb950'}}>{manager.bigwin.score}</div>
              <div style={{color:'#8b949e',fontSize:13}}>vs {manager.bigwin.team}</div>
            </div>
          )}
          {manager.bigloss?.team&&(
            <div className="card">
              <div className="card-title">😞 Plus lourde défaite</div>
              <div style={{fontSize:24,fontWeight:800,color:'#f85149'}}>{manager.bigloss.score}</div>
              <div style={{color:'#8b949e',fontSize:13}}>vs {manager.bigloss.team}</div>
            </div>
          )}
        </div>
      )}

      {/* Historique par saison */}
      <div className="card">
        <div className="card-title">📅 Historique saison par saison</div>
        {palmares.history.map((h,i)=>{
          const posColor=h.tableposition<=3?'#3fb950':h.tableposition<=6?'#58a6ff':h.tableposition<=10?'#8b949e':'#f85149'
          const trophies=h.leaguetrophies+h.domesticcuptrophies+h.continentalcuptrophies
          return(
            <div key={i}className="season-row">
              <div className="season-pos"style={{background:posColor+'20',color:posColor}}>{h.tableposition||'—'}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13}}>Saison {h.season+1} — {h.teamname}</div>
                <div style={{color:'#8b949e',fontSize:11}}>{h.leaguename}</div>
              </div>
              <div style={{display:'flex',gap:16,alignItems:'center',fontSize:12}}>
                <span style={{color:'#3fb950',fontWeight:600}}>{h.wins}V</span>
                <span style={{color:'#d29922'}}>{h.draws}N</span>
                <span style={{color:'#f85149'}}>{h.losses}D</span>
                <span style={{color:'#8b949e'}}>{h.points} pts</span>
                <span style={{color:'#58a6ff'}}>{h.goals_for}:{h.goals_against}</span>
                {trophies>0&&<span style={{color:'#f0a500',fontWeight:700}}>{'🏆'.repeat(Math.min(trophies,5))}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MANAGER PAGE
// ════════════════════════════════════════════════════════════════════════════
function ManagerPage({mgr}){
  const repStars=Math.min(5,Math.round((mgr.reputation??0)/300))
  return(
    <div>
      <div className="kpi-grid">
        {[
          ['🏆 Réputation',fmtStar(repStars),`${mgr.reputation} pts`],
          ['🤝 Confiance CA',`${mgr.boardconfidence}%`,mgr.boardconfidence>70?'Excellent':mgr.boardconfidence>40?'Correct':'Faible'],
          ['💰 Salaire',fmtK(mgr.wage),'par semaine'],
          ['💵 Total Gains',fmtM(mgr.totalearnings),'carrière'],
        ].map(([l,v,s])=>(
          <div key={l}className="kpi"><div className="kpi-label">{l}</div><div className="kpi-value"style={{fontSize:18}}>{v}</div><div className="kpi-sub">{s}</div></div>
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-title">📋 Objectifs de saison</div>
          {(mgr.objectives??[]).map((o,i)=>(
            <div key={i}style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <span style={{fontSize:12}}>Objectif {i+1}</span>
              <span className="badge"style={{background:mgr.objectiveResults?.[i]>=2?'#238636':mgr.objectiveResults?.[i]===1?'#9e6a03':'#6e1d1d',color:'#fff'}}>
                {mgr.objectiveResults?.[i]>=2?'✅ Atteint':mgr.objectiveResults?.[i]===1?'🔶 Partiel':'❌ Échoué'}
              </span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title">📊 Confiance CA</div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:8}}>
            <span>Niveau</span>
            <span style={{color:mgr.boardconfidence>70?'#3fb950':mgr.boardconfidence>40?'#d29922':'#f85149',fontWeight:700}}>{mgr.boardconfidence}%</span>
          </div>
          <div className="progress-bg">
            <div className="progress-fill"style={{width:`${mgr.boardconfidence}%`,background:mgr.boardconfidence>70?'#3fb950':mgr.boardconfidence>40?'#d29922':'#f85149'}}/>
          </div>
          {(mgr.losingstreak??0)>0&&(
            <div style={{marginTop:12}}><div style={{color:'#8b949e',fontSize:10}}>📉 Série défaites</div>
            <div style={{color:'#f85149',fontWeight:600}}>{mgr.losingstreak} match(s)</div></div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// COMPARE PAGE
// ════════════════════════════════════════════════════════════════════════════
function ComparePage({players}){
  const[p1,setP1]=useState(null);const[p2,setP2]=useState(null)
  const[s1,setS1]=useState('');const[s2,setS2]=useState('')
  const top=[...players].sort((a,b)=>b.overall-a.overall)
  const ALL_KEYS=Object.values(STAT_GROUPS).flat()
  const Picker=({search,setSearch,player,setPlayer,label})=>(
    <div>
      <div style={{fontWeight:600,marginBottom:7,fontSize:13}}>{label}</div>
      {player?(
        <div className="card"style={{display:'flex',gap:10,alignItems:'center',cursor:'pointer',padding:'10px 12px'}}onClick={()=>setPlayer(null)}>
          <Oval v={player.overall}size={42}/>
          <div><div style={{fontWeight:700}}>{player.name}</div><Pos p={player.preferredposition}/></div>
          <button className="btn btn-ghost"style={{marginLeft:'auto',padding:'3px 9px',fontSize:10}}>Changer</button>
        </div>
      ):(
        <>
          <input className="inp"placeholder="🔍…"value={search}onChange={e=>setSearch(e.target.value)}style={{width:'100%',marginBottom:7}}/>
          <div style={{maxHeight:190,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
            {top.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).slice(0,12).map(p=>(
              <div key={p.playerid}className="pcard"style={{padding:'7px 10px'}}onClick={()=>setPlayer(p)}>
                <div style={{display:'flex',gap:8,alignItems:'center'}}><Oval v={p.overall}size={24}/><span style={{fontSize:12,fontWeight:600}}>{p.name}</span><Pos p={p.preferredposition}/></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
  return(
    <div>
      <div className="two-col"style={{marginBottom:16}}>
        <Picker search={s1}setSearch={setS1}player={p1}setPlayer={setP1}label="Joueur 1"/>
        <Picker search={s2}setSearch={setS2}player={p2}setPlayer={setP2}label="Joueur 2"/>
      </div>
      {p1&&p2&&(
        <div className="card">
          <div className="card-title">📊 {p1.name} vs {p2.name}</div>
          {ALL_KEYS.map(k=>{
            const v1=p1.stats[k]??0;const v2=p2.stats[k]??0
            return(
              <div key={k}style={{display:'grid',gridTemplateColumns:'1fr 70px 1fr',gap:6,marginBottom:7,alignItems:'center'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,justifyContent:'flex-end'}}>
                  <span style={{fontWeight:v1>v2?700:400,color:v1>v2?'#3fb950':'#e6edf3',fontSize:11}}>{v1}</span>
                  <div style={{width:`${v1}%`,maxWidth:80,height:5,background:statColor(v1),borderRadius:2}}/>
                </div>
                <div style={{textAlign:'center',fontSize:10,color:'#8b949e'}}>{STAT_FR[k]??k}</div>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <div style={{width:`${v2}%`,maxWidth:80,height:5,background:statColor(v2),borderRadius:2}}/>
                  <span style={{fontWeight:v2>v1?700:400,color:v2>v1?'#3fb950':'#e6edf3',fontSize:11}}>{v2}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SCOUTING
// ════════════════════════════════════════════════════════════════════════════
function ScoutingPage({state}){
  const[search,setSearch]=useState('');const[league,setLeague]=useState('all')
  const[viewTeam,setViewTeam]=useState(null);const[selP,setSelP]=useState(null)
  const leagues=[...new Set(Object.values(state.teams).map(t=>t.leaguename).filter(Boolean))].sort()
  const teams=Object.values(state.teams).filter(t=>t.teamname?.trim())
    .filter(t=>league==='all'||t.leaguename===league)
    .filter(t=>!search||t.teamname.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      const pa=state.playersByTeam[a.teamid]??[];const pb=state.playersByTeam[b.teamid]??[]
      const avgA=pa.length?pa.reduce((s,p)=>s+p.overall,0)/pa.length:0
      const avgB=pb.length?pb.reduce((s,p)=>s+p.overall,0)/pb.length:0
      return avgB-avgA
    })
  return(
    <div>
      {!viewTeam?(
        <>
          <div className="filter-row">
            <input className="inp"placeholder="🔍 Club…"value={search}onChange={e=>setSearch(e.target.value)}style={{width:210}}/>
            <select className="inp"value={league}onChange={e=>setLeague(e.target.value)}>
              <option value="all">Toutes les ligues</option>
              {leagues.map(l=><option key={l}>{l}</option>)}
            </select>
            <span style={{color:'#8b949e',fontSize:12}}>{teams.length} équipes</span>
          </div>
          <div className="team-grid">
            {teams.map(t=>{
              const pl=state.playersByTeam[t.teamid]??[]
              const avg=pl.length?Math.round(pl.reduce((s,p)=>s+p.overall,0)/pl.length):0
              const top3=[...pl].sort((a,b)=>b.overall-a.overall).slice(0,3)
              return(
                <div key={t.teamid}className={`tcard${t.teamid===state.userTeamId?' my-team':''}`}onClick={()=>setViewTeam(t)}>
                  {t.teamid===state.userTeamId&&<div style={{fontSize:10,color:'#3fb950',marginBottom:3}}>★ MON CLUB</div>}
                  <div style={{fontWeight:700,fontSize:13}}>{t.teamname}</div>
                  <div style={{color:'#8b949e',fontSize:11,margin:'3px 0'}}>{t.leaguename}</div>
                  <div style={{display:'flex',gap:8,alignItems:'center',marginTop:5}}>
                    <span style={{fontSize:11,color:'#8b949e'}}>{pl.length}j</span>
                    {avg>0&&<Oval v={avg}size={22}/>}
                  </div>
                  <div style={{marginTop:5,display:'flex',gap:3,flexWrap:'wrap'}}>
                    {top3.map(p=><span key={p.playerid}className="tag"style={{fontSize:9}}>{p.name.split(' ').pop()}</span>)}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ):(
        <>
          <button className="btn btn-ghost"style={{marginBottom:14}}onClick={()=>setViewTeam(null)}>← Retour</button>
          <div className="page-title">{viewTeam.teamname}<span style={{fontSize:13,color:'#8b949e',fontWeight:400,marginLeft:8}}>{viewTeam.leaguename}</span></div>
          <div className="card"style={{padding:0}}>
            <div className="table-wrap"><table>
              <thead><tr><th>Joueur</th><th>OVR</th><th>POT</th><th>Pos</th><th>Buts</th><th>Salaire</th><th>Contrat</th></tr></thead>
              <tbody>
                {(state.playersByTeam[viewTeam.teamid]??[]).sort((a,b)=>b.overall-a.overall).map(p=>(
                  <tr key={p.playerid}style={{cursor:'pointer'}}onClick={()=>setSelP(p)}>
                    <td style={{fontWeight:600}}>{p.name}</td>
                    <td><Oval v={p.overall}size={26}/></td>
                    <td style={{color:'#8b949e'}}>{p.potential}</td>
                    <td><Pos p={p.preferredposition}/></td>
                    <td style={{color:'#3fb950',fontWeight:600}}>{p.leaguegoals??0}</td>
                    <td style={{color:'#8b949e'}}>{fmtK(p.wage)}</td>
                    <td style={{color:(p.contractuntil??9999)<2027?'#f85149':'#8b949e'}}>{p.contractuntil??'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}
      {selP&&<PlayerModal p={selP}onClose={()=>setSelP(null)}/>}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TRANSFERS PAGE
// ════════════════════════════════════════════════════════════════════════════
function TransfersPage({state}){
  const presigned=state.presigned??[];const block=state.transferBlock??[]
  return(
    <div>
      <div className="card">
        <div className="card-title">📥 Transferts en attente</div>
        {presigned.length===0?<div style={{color:'#8b949e',fontSize:12}}>Aucun transfert en attente</div>:(
          <div className="table-wrap"><table>
            <thead><tr><th>Joueur</th><th>Vers</th><th>Pos</th><th>OVR</th></tr></thead>
            <tbody>{presigned.map((c,i)=>(<tr key={i}><td>{c.player?.name??`#${c.playerid}`}</td><td>{c.newteam}</td><td>{c.player&&<Pos p={c.player.preferredposition}/>}</td><td>{c.player?.overall??'—'}</td></tr>))}</tbody>
          </table></div>
        )}
      </div>
      <div className="card">
        <div className="card-title">🚫 Joueurs bloqués</div>
        {block.length===0?<div style={{color:'#8b949e',fontSize:12}}>Aucun joueur bloqué</div>:(
          <div className="table-wrap"><table>
            <thead><tr><th>Joueur</th><th>OVR</th><th>Pos</th></tr></thead>
            <tbody>{block.map((b,i)=>(<tr key={i}><td>{b.player?.name??`#${b.playerid}`}</td><td>{b.player?.overall??'—'}</td><td>{b.player&&<Pos p={b.player.preferredposition}/>}</td></tr>))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════════════════
const NAV=[
  {id:'squad',   icon:'👥',label:'Effectif',    section:'MON CLUB'},
  {id:'tactics', icon:'🎯',label:'Tactique',    section:null},
  {id:'compare', icon:'⚖️',label:'Comparaison', section:null},
  {id:'manager', icon:'🏆',label:'Manager',     section:null},
  {id:'palmares',icon:'🥇',label:'Palmarès',    section:null},
  {id:'youth',   icon:'🌱',label:'Académie',    section:null},
  {id:'transfers',icon:'💸',label:'Transferts', section:null},
  {id:'scout',   icon:'🌍',label:'Scout Mondial',section:'GLOBAL'},
  {id:'change',  icon:'🔄',label:'Changer club',section:null},
  {id:'newfile', icon:'📂',label:'Nouveau fichier',section:null},
]

export default function Home(){
  const[gs,setGs]=useState(null);const[tid,setTid]=useState(null);const[page,setPage]=useState('squad')
  const onLoaded=useCallback(state=>{setGs(state);if(state.userTeamId){setTid(state.userTeamId);setPage('squad')}else{setPage('__pick__')}},[])
  const onTeam=useCallback(id=>{setTid(id);setPage('squad')},[])
  if(page==='newfile'){setGs(null);setTid(null);setPage('squad');return null}
  return(
    <>
      <style>{css}</style>
      {!gs&&<UploadPage onLoaded={onLoaded}/>}
      {gs&&(!tid||page==='__pick__'||page==='change')&&<TeamSelectPage state={gs}onSelect={onTeam}/>}
      {gs&&tid&&page!=='__pick__'&&page!=='change'&&page!=='newfile'&&(()=>{
        const team=gs.teams[tid]
        const players=(gs.playersByTeam[tid]??[]).sort((a,b)=>b.overall-a.overall)
        return(
          <div className="shell">
            <aside className="sidebar">
              <div className="logo">
                <div className="logo-icon">⚽</div>
                <div className="logo-name">{team?.teamname??'Club'}</div>
                <div className="logo-sub">{team?.leaguename??''}</div>
              </div>
              {NAV.map(n=>(
                <div key={n.id}>
                  {n.section&&<div className="nav-section">{n.section}</div>}
                  <button className={`nav-btn${page===n.id?' active':''}`}onClick={()=>setPage(n.id)}>{n.icon} {n.label}</button>
                </div>
              ))}
            </aside>
            <main className="main">
              {!['scout'].includes(page)&&(
                <div className="page-title">
                  {NAV.find(n=>n.id===page)?.icon} {NAV.find(n=>n.id===page)?.label}
                </div>
              )}
              {page==='squad'    &&<SquadPage players={players}/>}
              {page==='tactics'  &&<TacticsPage players={players}/>}
              {page==='compare'  &&<ComparePage players={players}/>}
              {page==='manager'  &&<ManagerPage mgr={gs.manager}/>}
              {page==='palmares' &&<PalmaresPage palmares={gs.palmares}manager={gs.manager}teams={gs.teams}/>}
              {page==='youth'    &&<YouthPage youth={gs.youthPlayers}/>}
              {page==='transfers'&&<TransfersPage state={gs}/>}
              {page==='scout'    &&(<><div className="page-title">🌍 Scout Mondial</div><ScoutingPage state={gs}/></>)}
            </main>
          </div>
        )
      })()}
    </>
  )
}
