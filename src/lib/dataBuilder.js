/**
 * dataBuilder.js — v3
 * Supporte deux formats de fichier noms :
 *  FORMAT EA    : nameid,commentaryid,name
 *  FORMAT KAGGLE: player_id,short_name,long_name,overall,...
 *
 * Jeunes : extraits depuis trainingteamplayers (mêmes stats que pros)
 *          + trainingteamplayernames (noms en-save)
 * Palmarès : career_managerhistory (par saison)
 */

export const POS_MAP = {
  0:'GK',3:'RB',4:'RCB',5:'CB',6:'LCB',7:'LB',
  9:'RDM',10:'CDM',11:'LDM',12:'RM',13:'RCM',14:'CM',15:'LCM',16:'LM',
  17:'RAM',18:'CAM',19:'LAM',20:'RF',22:'LF',23:'RW',24:'RS',25:'ST',26:'LS',27:'LW',
}
export const mapPos = id => POS_MAP[id] ?? ''
export const posGroup = pos => {
  if (pos==='GK') return 'GK'
  if (['RB','RCB','CB','LCB','LB'].includes(pos)) return 'DEF'
  if (['RS','ST','LS','RW','LW','RF','LF'].includes(pos)) return 'ATT'
  return 'MID'
}

const PS1=['Finesse Shot','Chip Shot','Power Shot','Dead Ball','Power Header','Incisive Pass','Pinged Pass','Long Ball Pass','Tiki Taka','Whipped Cross','Jockey','Block','Intercept','Anticipate','Slide Tackle','Bruiser','Technical','Rapid','Flair','First Touch','Trickster','Press Proven','Quick Step','Relentless','Trivela','Acrobatic','Long Throw','Aerial','Far Throw','Footwork'].reverse()
const PS2=['Cross Claimer','1v1 Close Down','Far Reach','Quick Reflexes','Long Shot Taker','Early Crosser','Solid Player','Team Player','One Club Player','Injury Prone','Leadership'].reverse()
const bitmask=(val,len)=>(new Uint32Array([val])[0]>>>0).toString(2).padStart(len,'0')
const parseBits=(m,n)=>m.split('').reduce((a,b,i)=>{if(b==='1')a.push(n[i]);return a},[])
const getPS=p=>[...parseBits(bitmask(p.trait1??0,PS1.length),PS1),...parseBits(bitmask(p.trait2??0,PS2.length),PS2)]
const getPSP=p=>[...parseBits(bitmask(p.icontrait1??0,PS1.length),PS1),...parseBits(bitmask(p.icontrait2??0,PS2.length),PS2)]

const EA_EPOCH=new Date('1582-10-15').getTime()
const eaDateToStr=d=>{if(!d||d<=0)return null;return new Date(EA_EPOCH+d*86400000).toISOString().split('T')[0]}
const eaDateToAge=d=>{
  if(!d||d<=0)return null
  const b=new Date(EA_EPOCH+d*86400000),n=new Date()
  let a=n.getFullYear()-b.getFullYear()
  if(n.getMonth()-b.getMonth()<0||(n.getMonth()===b.getMonth()&&n.getDate()<b.getDate()))a--
  return a
}

function parseCSVRow(line){
  const r=[];let c='',q=false
  for(const ch of line){if(ch==='"'){q=!q}else if(ch===','&&!q){r.push(c);c=''}else{c+=ch}}
  r.push(c);return r
}

// ── Détection et parsing du fichier de noms ───────────────────────────────
export function parsePlayerNamesFile(csv){
  const lines=csv.replaceAll('\r','').split('\n').filter(l=>l.trim())
  if(!lines.length)return{type:'ea',map:{}}
  const header=lines[0].toLowerCase()

  if(header.includes('player_id')||header.includes('short_name')||header.includes('sofifa_id')){
    const cols=lines[0].split(',')
    const fi=(n)=>cols.findIndex(c=>c.trim().toLowerCase()===n)
    const idIdx=fi('player_id')!==-1?fi('player_id'):fi('sofifa_id')
    const snIdx=fi('short_name')
    const lnIdx=fi('long_name')
    const map={}
    for(let i=1;i<lines.length;i++){
      const row=parseCSVRow(lines[i])
      const id=row[idIdx]?.trim()
      if(!id)continue
      map[id]={name:row[snIdx]?.trim()||row[lnIdx]?.trim()||`Player_${id}`,long_name:row[lnIdx]?.trim()||''}
    }
    return{type:'kaggle',map}
  }

  // Format EA
  const map={}
  for(let i=1;i<lines.length;i++){
    const line=lines[i],fc=line.indexOf(','),sc=line.indexOf(',',fc+1)
    if(fc===-1||sc===-1)continue
    map[line.slice(0,fc).trim()]=line.slice(sc+1).trim()
  }
  return{type:'ea',map}
}

function detectDBs(data){
  let cDB=null,sDB=null
  for(const db of data){
    if(!db)continue
    if(db.career_managerinfo||db.career_playercontract||db.career_users)cDB=db
    if(db.players&&db.teamplayerlinks&&db.teams)sDB=db
  }
  if(!cDB&&!sDB){cDB=data[0];sDB=data[1]}
  else if(!sDB)sDB=data.find(d=>d&&d!==cDB)??data[1]??{}
  else if(!cDB)cDB=data.find(d=>d&&d!==sDB)??data[0]??{}
  return{careerDB:cDB??{},squadsDB:sDB??{}}
}

const arr=(db,t)=>Array.isArray(db?.[t])?db[t]:[]
const idx=(list,key)=>Object.fromEntries((list??[]).map(r=>[r[key],r]))

export function buildGameState(data,playerNamesContent){
  const nf=parsePlayerNamesFile(playerNamesContent)
  const{careerDB,squadsDB}=detectDBs(data)

  const resolveName=(p,altNames)=>{
    if(altNames){
      const fn=altNames[p.firstnameid]??''
      const ln=altNames[p.lastnameid]??''
      const cn=altNames[p.commonnameid]??''
      return cn||`${fn} ${ln}`.trim()||`Jeune_${p.playerid}`
    }
    if(nf.type==='kaggle'){
      return nf.map[String(p.playerid)]?.name??`Player_${p.playerid}`
    }
    const fn=nf.map[p.firstnameid]??''
    const ln=nf.map[p.lastnameid]??''
    const cn=nf.map[p.commonnameid]??''
    return cn||`${fn} ${ln}`.trim()||`Player_${p.playerid}`
  }

  const teamsById =idx(arr(squadsDB,'teams'),'teamid')
  const leagueById=idx(arr(squadsDB,'leagues'),'leagueid')
  const teamLeague={}
  arr(squadsDB,'leagueteamlinks').forEach(l=>{teamLeague[l.teamid]=l.leagueid})

  const teams={}
  for(const[tid,t]of Object.entries(teamsById)){
    const lid=teamLeague[tid]
    teams[tid]={teamid:t.teamid,teamname:t.teamname??'',leagueid:lid??null,
      leaguename:leagueById[lid]?.leaguename??'',clubworth:t.clubworth??0,
      overallrating:t.matchdayoverallrating??0,attackrating:t.attackrating??0}
  }

  let userTeamId=null
  const mgrArr=arr(careerDB,'career_managerinfo')
  if(mgrArr.length>0)userTeamId=mgrArr[0].clubteamid??null
  if(!userTeamId){const u=arr(careerDB,'career_users');if(u.length>0)userTeamId=u[0].clubteamid??u[0].teamid??null}

  const tplByPlayer     =idx(arr(squadsDB,'teamplayerlinks'),'playerid')
  const contractByPlayer=idx(arr(careerDB,'career_playercontract'),'playerid')
  const loanByPlayer    =idx(arr(squadsDB,'playerloans'),'playerid')
  const rankByPlayer    =idx(arr(careerDB,'career_squadranking'),'playerid')

  const buildPlayer=(p,altNames,youthMeta)=>{
    const name=resolveName(p,altNames)
    const tpl=tplByPlayer[p.playerid]
    const contract=contractByPlayer[p.playerid]
    const loan=loanByPlayer[p.playerid]
    const rank=rankByPlayer[p.playerid]
    const teamId=tpl?.teamid??null
    const loanFrom=loan?teamsById[loan.teamidloanedfrom]:null
    const prefPos=mapPos(p.preferredposition1)
    const allPos=[...new Set([p.preferredposition1,p.preferredposition2,p.preferredposition3,p.preferredposition4].filter(x=>x!=null&&x>=0).map(mapPos).filter(Boolean))]

    return{
      playerid:p.playerid,name,
      birthdate:eaDateToStr(p.birthdate),age:eaDateToAge(p.birthdate),
      nationality:p.nationality,height:p.height,weight:p.weight,
      overall:p.overallrating,potential:p.potential,
      preferredposition:prefPos,allpositions:allPos,posgroup:posGroup(prefPos),
      teamid:teamId,teamname:teamsById[teamId]?.teamname??'',
      isloaned:!!loanFrom,loanedfrom:loanFrom?.teamname??null,
      isyouth:!!altNames,
      playertype:youthMeta?.playertype??null,playertier:youthMeta?.playertier??null,
      monthsinsquad:youthMeta?.monthsinsquad??null,
      jerseynumber:tpl?.jerseynumber??null,leaguegoals:tpl?.leaguegoals??0,
      appearances:tpl?.leagueappearances??0,form:tpl?.form??0,
      injury:tpl?.injury??0,yellows:tpl?.yellows??0,reds:tpl?.reds??0,
      contractuntil:p.contractvaliduntil>0?p.contractvaliduntil:null,
      wage:contract?.wage??null,
      curroverall:rank?.curroverall??p.overallrating,lastoverall:rank?.lastoverall??null,
      growth:(rank?.curroverall&&rank?.lastoverall)?rank.curroverall-rank.lastoverall:null,
      preferredfoot:p.preferredfoot===1?'Droite':p.preferredfoot===2?'Gauche':'?',
      skillmoves:p.skillmoves??0,weakfoot:p.weakfootabilitytypecode??1,intlrep:p.internationalrep??1,
      playstyles:getPS(p),playstylesplus:getPSP(p),
      stats:{
        gk_diving:p.gkdiving,gk_reflexes:p.gkreflexes,gk_kicking:p.gkkicking,
        gk_handling:p.gkhandling,gk_positioning:p.gkpositioning,
        crossing:p.crossing,finishing:p.finishing,heading:p.headingaccuracy,
        volleys:p.volleys,short_passing:p.shortpassing,dribbling:p.dribbling,
        curve:p.curve,fk_accuracy:p.freekickaccuracy,long_passing:p.longpassing,
        ball_control:p.ballcontrol,acceleration:p.acceleration,sprint_speed:p.sprintspeed,
        agility:p.agility,reactions:p.reactions,balance:p.balance,shot_power:p.shotpower,
        jumping:p.jumping,stamina:p.stamina,strength:p.strength,long_shots:p.longshots,
        aggression:p.aggression,interceptions:p.interceptions,positioning:p.positioning,
        vision:p.vision,penalties:p.penalties,composure:p.composure,
        defensive_awareness:p.defensiveawareness,sliding_tackle:p.slidingtackle,
        standing_tackle:p.standingtackle,
      }
    }
  }

  // Joueurs normaux
  const allPlayers=arr(squadsDB,'players').filter(p=>p.gender===0).map(p=>buildPlayer(p,null,null))

  // Jeunes depuis trainingteamplayers (même schéma que players)
  const youthNamesRaw=idx(arr(squadsDB,'trainingteamplayernames'),'nameid')
  const youthNames=Object.fromEntries(Object.entries(youthNamesRaw).map(([id,r])=>[id,r.name??'']))
  const youthMeta=idx(arr(careerDB,'career_youthplayers'),'playerid')
  const youthHistory=idx(arr(careerDB,'career_youthplayerhistory'),'playerid')

  const youthPlayers=arr(squadsDB,'trainingteamplayers').map(p=>{
    const y=buildPlayer(p,youthNames,youthMeta[p.playerid])
    const hist=youthHistory[p.playerid]
    y.leaguegoals=hist?.goals??0
    y.appearances=hist?.appearances??0
    return y
  })

  const playersById=Object.fromEntries([...allPlayers,...youthPlayers].map(p=>[p.playerid,p]))
  const playersByTeam={}
  allPlayers.forEach(p=>{if(p.teamid!==null){if(!playersByTeam[p.teamid])playersByTeam[p.teamid]=[];playersByTeam[p.teamid].push(p)}})

  // Manager
  const mgr=mgrArr[0]??{}
  const manager={
    clubteamid:mgr.clubteamid,teamname:teams[mgr.clubteamid]?.teamname??'',
    reputation:mgr.managerreputation??0,boardconfidence:mgr.boardconfidence??0,
    wage:mgr.wage??0,totalearnings:mgr.totalearnings??0,losingstreak:mgr.losingstreak??0,
    bigwin:{score:`${mgr.bigwinuserscore??0}-${mgr.bigwinoppscore??0}`,team:teams[mgr.bigwinoppteamid]?.teamname??''},
    bigloss:{score:`${mgr.biglossuserscore??0}-${mgr.biglossoppscore??0}`,team:teams[mgr.biglossoppteamid]?.teamname??''},
    objectives:[mgr.seasonobjective1,mgr.seasonobjective2,mgr.seasonobjective3],
    objectiveResults:[mgr.seasonobjectiveresult1,mgr.seasonobjectiveresult2,mgr.seasonobjectiveresult3],
  }

  // Palmarès
  const managerHistory=arr(careerDB,'career_managerhistory').map(h=>({
    season:h.season??0,teamid:h.teamid,
    teamname:teams[h.teamid]?.teamname??`Équipe #${h.teamid}`,
    leaguename:leagueById[h.leagueid]?.leaguename??'',
    wins:h.wins??0,draws:h.draws??0,losses:h.losses??0,points:h.points??0,
    goals_for:h.goals_for??0,goals_against:h.goals_against??0,
    tableposition:h.tableposition??0,
    leaguetrophies:h.leaguetrophies??0,
    domesticcuptrophies:h.domesticcuptrophies??0,
    continentalcuptrophies:h.continentalcuptrophies??0,
    bigsellplayername:h.bigsellplayername??'',
    bigsellamount:h.bigsellamount??0,bigbuyamount:h.bigbuyamount??0,
  })).sort((a,b)=>b.season-a.season)

  const palmares={
    history:managerHistory,
    totalLeagueTrophies:managerHistory.reduce((s,h)=>s+h.leaguetrophies,0),
    totalDomesticCupTrophies:managerHistory.reduce((s,h)=>s+h.domesticcuptrophies,0),
    totalContinentalTrophies:managerHistory.reduce((s,h)=>s+h.continentalcuptrophies,0),
    totalWins:managerHistory.reduce((s,h)=>s+h.wins,0),
    totalDraws:managerHistory.reduce((s,h)=>s+h.draws,0),
    totalLosses:managerHistory.reduce((s,h)=>s+h.losses,0),
    totalGames:managerHistory.reduce((s,h)=>s+(h.wins+h.draws+h.losses),0),
  }

  const presigned=arr(careerDB,'career_presignedcontract').map(c=>({...c,player:playersById[c.playerid]??null,newteam:teams[c.teamid]?.teamname??`#${c.teamid}`}))
  const transferBlock=arr(careerDB,'career_transferblock').map(t=>({...t,player:playersById[t.playerid]??null}))
  const compById=idx(arr(squadsDB,'competition'),'competitionid')
  const competitions=arr(careerDB,'career_competitionprogress').map(cp=>({...cp,name:compById[cp.competitionid]?.competitionname??`Comp #${cp.competitionid}`}))

  return{
    namesFileType:nf.type,
    userTeamId,teams,teamsById:teams,leagueById,
    players:playersById,playersByTeam,allPlayers,youthPlayers,
    manager,palmares,presigned,transferBlock,competitions,
    dbTables:{career:Object.keys(careerDB),squads:Object.keys(squadsDB)},
    raw:{careerDB,squadsDB},
  }
}
