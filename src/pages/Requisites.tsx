import { useState } from 'react'
import { T, Requisite, ArchivedRequisite, Deal, fmtNum, reqTotal, numStyle } from '../store'
import { IcArchive, IcEdit, IcPlus, IcTrash } from '../icons'
import { Pill, BlueBtn, RedBtn, Toggle, CopyBtn } from '../ui'

export default function RequisitesPage({requisites,archivedRequisites,deals,onAdd,onEdit,onToggle,onDeleteArchived,t,isMobile}:{requisites:Requisite[];archivedRequisites:ArchivedRequisite[];deals:Deal[];onAdd:()=>void;onEdit:(r:Requisite)=>void;onToggle:(r:Requisite)=>void;onDeleteArchived:(id:string)=>void;t:T;isMobile:boolean}) {
  const [tab,setTab]=useState<'active'|'archive'>('active')
  const [confirmDel,setConfirmDel]=useState<string|null>(null)

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {([['active','Реквизиты'],['archive',`Архив${archivedRequisites.length>0?` (${archivedRequisites.length})`:''}`]] as const).map(([key,label])=>{
            const active=tab===key
            return <button key={key} onClick={()=>setTab(key)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:10,cursor:'pointer',backgroundColor:t.panel,border:`1.5px solid ${active?'#007AFF':t.border}`,color:active?'#007AFF':t.textSec,fontSize:13,fontWeight:active?600:400,fontFamily:'Inter,sans-serif'}}>{key==='archive'&&<IcArchive/>}{label}</button>
          })}
        </div>
        {tab==='active'&&<BlueBtn sm onClick={onAdd}><IcPlus/> Создать</BlueBtn>}
      </div>

      {tab==='active'&&(
        requisites.length===0?(
          <div style={{backgroundColor:t.panel,borderRadius:12,padding:'32px 0',textAlign:'center',color:t.textSec,fontSize:14}}><div style={{fontSize:24,marginBottom:8}}>💳</div>Реквизиты не добавлены</div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {requisites.map(req=>{
              const total=reqTotal(deals,req.id),pct=Math.min(100,Math.round((total/req.limitAmount)*100)),active=req.status==='active'
              const method=req.method==='sbp'?'СБП':req.method==='card'?'Карта':'Моб. ком.'
              return (
                <div key={req.id} style={{backgroundColor:t.panel,borderRadius:12,padding:'14px 16px',opacity:active?1:.7}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                    <div style={{flex:1,minWidth:160}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
                        <Pill color={req.method==='sbp'?'blue':req.method==='card'?'green':'orange'}>{method}</Pill>
                        <Pill color={active?'green':'gray'}>{active?'Активен':'Отключён'}</Pill>
                      </div>
                      <div style={{fontSize:15,fontWeight:600,color:t.text}}>{req.fio}</div>
                      <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:t.textSec,...numStyle,flexWrap:'wrap'}}>{req.account}<CopyBtn value={req.account}/></div>
                      <div style={{fontSize:12,color:t.textSec,marginTop:2}}>{req.bank||req.operator}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
                      {!isMobile&&(
                        <div style={{fontSize:12,color:t.textSec,textAlign:'right'}}>
                          <div>Мин/Макс: <b style={{color:t.text,...numStyle}}>{fmtNum(req.minAmount)} — {fmtNum(req.maxAmount)} ₽</b></div>
                          <div>Лимит: <b style={{color:t.text,...numStyle}}>{fmtNum(req.limitAmount)} ₽</b></div>
                          <div>День/Мес: <b style={{color:t.text,...numStyle}}>{fmtNum(req.dailyLimit)}/{fmtNum(req.monthlyLimit)} ₽</b></div>
                        </div>
                      )}
                      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                        <span style={{fontSize:12,color:active?'#34C759':t.textSec}}>{active?'Вкл':'Выкл'}</span>
                        <Toggle on={active} onChange={()=>onToggle(req)}/>
                        <button onClick={()=>onEdit(req)} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:8,border:`1px solid ${t.border}`,backgroundColor:t.inputBg,color:t.text,fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}><IcEdit/>{!isMobile&&' Ред.'}</button>
                      </div>
                    </div>
                  </div>
                  {isMobile&&(
                    <div style={{marginTop:8,fontSize:11,color:t.textSec,display:'flex',gap:12,flexWrap:'wrap'}}>
                      <span>Мин: <b style={{color:t.text,...numStyle}}>{fmtNum(req.minAmount)} ₽</b></span>
                      <span>Макс: <b style={{color:t.text,...numStyle}}>{fmtNum(req.maxAmount)} ₽</b></span>
                      <span>Лимит: <b style={{color:t.text,...numStyle}}>{fmtNum(req.limitAmount)} ₽</b></span>
                    </div>
                  )}
                  <div style={{marginTop:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:t.textSec,marginBottom:4}}>
                      <span>Обработано: {fmtNum(Math.round(total))} ₽</span><span>{pct}%</span>
                    </div>
                    <div style={{height:6,backgroundColor:t.inputBg,borderRadius:3}}><div style={{height:'100%',width:`${pct}%`,backgroundColor:pct>85?'#FF3B30':pct>60?'#FF9500':'#34C759',borderRadius:3,transition:'width .3s'}}/></div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab==='archive'&&(
        archivedRequisites.length===0?(
          <div style={{backgroundColor:t.panel,borderRadius:12,padding:'32px 0',textAlign:'center',color:t.textSec,fontSize:14}}><div style={{fontSize:24,marginBottom:8}}>🗂️</div>Архив пуст</div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[...archivedRequisites].reverse().map(req=>{
              const method=req.method==='sbp'?'СБП':req.method==='card'?'Карта':'Моб. ком.'
              const dealsForReq=deals.filter(d=>d.requisiteId===req.id)
              const completedCount=dealsForReq.filter(d=>d.status==='completed').length
              const totalR=dealsForReq.filter(d=>d.status==='completed').reduce((s,d)=>s+d.amount,0)
              return (
                <div key={req.id} style={{backgroundColor:t.panel,borderRadius:12,padding:'12px 14px',opacity:.7,borderLeft:'3px solid #48484a'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}><Pill color="gray">{method}</Pill><Pill color="gray">Архив</Pill></div>
                      <div style={{fontSize:14,fontWeight:600,color:t.text}}>{req.fio}</div>
                      <div style={{fontSize:12,color:t.textSec,...numStyle}}>{req.account} · {req.bank||req.operator}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <div style={{fontSize:12,color:t.textSec,textAlign:'right'}}>
                        <div>Удалён: {req.deletedAt.slice(0,10)}</div>
                        <div>Сделок: <b style={{color:t.text}}>{completedCount}</b></div>
                        <div>Объём: <b style={{color:t.text,...numStyle}}>{fmtNum(Math.round(totalR))} ₽</b></div>
                      </div>
                      {confirmDel===req.id?(
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>setConfirmDel(null)} style={{fontSize:12,color:t.textSec,background:'none',border:`1px solid ${t.border}`,borderRadius:6,padding:'4px 8px',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Отмена</button>
                          <button onClick={()=>{onDeleteArchived(req.id);setConfirmDel(null)}} style={{fontSize:12,color:'#fff',background:'#FF3B30',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontFamily:'Inter,sans-serif'}}>Удалить</button>
                        </div>
                      ):(
                        <button onClick={()=>setConfirmDel(req.id)} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:8,border:'1px solid rgba(255,59,48,.4)',backgroundColor:'rgba(255,59,48,.08)',color:'#FF3B30',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif'}}>
                          <IcTrash/> Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
