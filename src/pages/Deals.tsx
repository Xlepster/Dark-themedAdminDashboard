import { useState, useEffect } from 'react'
import { T, Deal, TraderBalance, fmtNum, fmtTimer, numStyle } from '../store'
import { IcCheck, IcClock, IcX, IcCheckCircle, IcMenu, IcInfo } from '../icons'
import { Pill, CopyBtn } from '../ui'
import { DealDetailModal } from '../modals'

function DealRow({deal,tick,onConfirm,onDetail,t,isMobile}:{deal:Deal;tick:number;onConfirm:()=>void;onDetail:()=>void;t:T;isMobile:boolean}) {
  void tick
  const remaining=deal.status==='pending'?Math.max(0,deal.expiresAt-Date.now()):-1
  const isUrgent=remaining>=0&&remaining<120000
  const ok=deal.status==='completed', pending=deal.status==='pending'
  return (
    <div style={{backgroundColor:t.panel,borderRadius:12,padding:'10px 14px',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',borderLeft:`3px solid ${pending?'#007AFF':ok?'#34C759':'#FF3B30'}`}}>
      <div style={{width:22,height:22,borderRadius:'50%',backgroundColor:pending?'rgba(0,122,255,.15)':ok?'rgba(52,199,89,.2)':'rgba(255,59,48,.15)',border:`2px solid ${pending?'#007AFF':ok?'#34C759':'#FF3B30'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:pending?'#007AFF':ok?'#34C759':'#FF3B30'}}>
        {ok?<IcCheck/>:pending?<IcClock/>:<IcX/>}
      </div>

      <div style={{flexShrink:0,minWidth:80}}>
        <Pill color="blue">приём</Pill>
        <div style={{fontSize:11,fontWeight:600,color:t.text,marginTop:2,...numStyle,display:'flex',alignItems:'center',gap:3}}>{deal.id}<CopyBtn value={deal.id}/></div>
        {!isMobile&&<div style={{fontSize:10,color:t.textSec,...numStyle}}>{deal.createdAt}</div>}
      </div>

      <div style={{flexShrink:0,minWidth:80}}>
        <div style={{fontSize:12,fontWeight:500,color:pending?'#007AFF':ok?'#34C759':'#FF3B30'}}>{pending?'Ожидание':ok?'Завершена':'Отменена'}</div>
        {pending&&remaining>=0&&(
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:13,fontWeight:700,color:isUrgent?'#FF3B30':'#FF9500',marginTop:1,...numStyle}}>
            <IcClock/>{fmtTimer(remaining)}
          </div>
        )}
      </div>

      <div style={{flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:3,fontSize:13,color:t.text,...numStyle}}>{fmtNum(deal.amount)} ₽<CopyBtn value={String(deal.amount)}/></div>
        <div style={{fontSize:10,color:t.textSec,...numStyle}}>{deal.amountUsdt.toFixed(6)} USDT</div>
      </div>

      {!isMobile&&(
        <div style={{flexShrink:0,minWidth:80}}>
          <div style={{fontSize:10,color:t.textSec}}>{deal.method} · {deal.bank}</div>
          <div style={{display:'flex',alignItems:'center',gap:3,fontSize:11,color:t.text,...numStyle}}>{deal.account}<CopyBtn value={deal.account}/></div>
          <div style={{fontSize:10,color:t.textSec}}>{deal.fio}</div>
        </div>
      )}

      <div style={{marginLeft:'auto',display:'flex',gap:6,flexShrink:0}}>
        {pending&&(
          <button onClick={onConfirm} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:8,border:'1.5px solid #34C759',backgroundColor:'rgba(52,199,89,.12)',color:'#34C759',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'Inter,sans-serif'}}>
            <IcCheckCircle/>{!isMobile&&' Подтвердить'}
          </button>
        )}
        <button onClick={onDetail} title="Подробнее" style={{width:28,height:28,borderRadius:8,border:`1px solid ${t.border}`,backgroundColor:t.inputBg,cursor:'pointer',color:t.text,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <IcMenu/>
        </button>
      </div>
    </div>
  )
}

export default function DealsPage({deals,onConfirm,t,isMobile,traderBal}:{deals:Deal[];onConfirm:(id:string)=>void;t:T;isMobile:boolean;traderBal?:TraderBalance|null}) {
  const [tab,setTab]=useState<'all'|'done'|'cancel'>('all')
  const [tick,setTick]=useState(0)
  const [detailDeal,setDetailDeal]=useState<Deal|null>(null)
  useEffect(()=>{const i=setInterval(()=>setTick(n=>n+1),1000);return()=>clearInterval(i)},[])

  const pendingCount=deals.filter(d=>d.status==='pending').length

  // "Все" = only pending (live incoming queue)
  // After confirmed/cancelled → only in their respective folders
  const filtered=deals.filter(d=>{
    if(tab==='all')    return d.status==='pending'
    if(tab==='done')   return d.status==='completed'
    if(tab==='cancel') return d.status==='cancelled'
    return false
  }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))

  const tabs=[
    {key:'all'    as const, label: pendingCount>0?`Все (${pendingCount})`:'Все'},
    {key:'done'   as const, label:'Завершённые'},
    {key:'cancel' as const, label:'Отменённые'},
  ]

  const noBalance = traderBal !== null && traderBal !== undefined && traderBal.usdt === 0

  return (
    <div>
      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:12}}>Сделки</div>
      {noBalance&&(
        <div style={{padding:'12px 16px',backgroundColor:'rgba(255,59,48,.08)',border:'1px solid rgba(255,59,48,.25)',borderRadius:12,fontSize:13,color:'#FF3B30',display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <IcInfo/> Баланс пуст. Пополните кошелёк — новые заявки поступают только при наличии средств.
        </div>
      )}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
        {tabs.map(tb=>{
          const active=tab===tb.key
          const c=tb.key==='all'?'#007AFF':tb.key==='done'?'#34C759':'#FF3B30'
          return (
            <button key={tb.key} onClick={()=>setTab(tb.key)} style={{padding:'6px 14px',borderRadius:10,cursor:'pointer',backgroundColor:t.panel,border:`1.5px solid ${active?c:t.border}`,color:active?c:t.textSec,fontSize:13,fontWeight:active?600:400,fontFamily:'Inter,sans-serif'}}>
              {tb.label}
            </button>
          )
        })}
      </div>
      {tab==='all'&&pendingCount===0&&(
        <div style={{backgroundColor:t.panel,borderRadius:12,padding:'32px 0',textAlign:'center',color:t.textSec,fontSize:14}}>
          <div style={{fontSize:24,marginBottom:8}}>📋</div>
          Нет входящих заявок. Активируйте реквизит и включите «Приём» сверху.
        </div>
      )}
      {(tab!=='all'||pendingCount>0)&&filtered.length===0&&(
        <div style={{backgroundColor:t.panel,borderRadius:12,padding:'24px 0',textAlign:'center',color:t.textSec,fontSize:14}}>Сделки не найдены</div>
      )}
      {filtered.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {filtered.map(d=>(
            <DealRow key={d.id} deal={d} tick={tick} onConfirm={()=>onConfirm(d.id)} onDetail={()=>setDetailDeal(d)} t={t} isMobile={isMobile}/>
          ))}
        </div>
      )}
      {detailDeal&&<DealDetailModal deal={detailDeal} onClose={()=>setDetailDeal(null)} t={t}/>}
    </div>
  )
}
