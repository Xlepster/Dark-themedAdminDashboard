import { useState } from 'react'
import { T, Deal, fmtNum, numStyle } from '../store'
import { BlueBtn, GhostBtn, SInput, SSelect } from '../ui'

export function DisputesPage({t,isMobile}:{t:T;isMobile?:boolean}) {
  void isMobile
  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:4}}>Споры</div>
      <div><div style={{fontSize:15,fontWeight:600,color:'#FF3B30',marginBottom:10}}>Активные споры</div><div style={{backgroundColor:t.panel,borderRadius:12,padding:'20px 0',textAlign:'center',color:t.textSec,fontSize:14}}>Нет активных споров</div></div>
      <div><div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:10}}>Последние споры</div><div style={{backgroundColor:t.panel,borderRadius:12,padding:'20px 0',textAlign:'center',color:t.textSec,fontSize:14}}>Споры не найдены</div></div>
    </div>
  )
}

export function StatsPage({deals,t,isMobile}:{deals:Deal[];t:T;isMobile?:boolean}) {
  const [dateFrom,setDateFrom]=useState('')
  const [dateTo,setDateTo]=useState('')
  const [method,setMethod]=useState('')
  const [filtered,setFiltered]=useState<Deal[]|null>(null)
  const apply=()=>{let r=deals;if(method)r=r.filter(d=>d.method===method);if(dateFrom)r=r.filter(d=>d.createdAt>=dateFrom);if(dateTo)r=r.filter(d=>d.createdAt<=dateTo);setFiltered(r)}
  const reset=()=>{setDateFrom('');setDateTo('');setMethod('');setFiltered(null)}
  const data=filtered||deals
  const completed=data.filter(d=>d.status==='completed')
  const cancelled=data.filter(d=>d.status==='cancelled')
  const totalRub=completed.reduce((s,d)=>s+d.amount,0)
  const totalUsdt=completed.reduce((s,d)=>s+d.amountUsdt,0)
  const byMethod=['СБП','Карта','Моб. ком.'].map(m=>({method:m,total:completed.filter(d=>d.method===m).length,rub:completed.filter(d=>d.method===m).reduce((s,d)=>s+d.amount,0)}))
  const Card=({label,value,color}:{label:string;value:string;color?:string})=>(
    <div style={{backgroundColor:t.panel,borderRadius:12,padding:isMobile?'12px 14px':'16px 20px',flex:1,minWidth:isMobile?'calc(50% - 6px)':130}}>
      <div style={{fontSize:11,color:t.textSec,marginBottom:4}}>{label}</div>
      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:color||t.text,...numStyle}}>{value}</div>
    </div>
  )
  const td=(p:string|number,bold?:boolean)=>(
    <td style={{padding:isMobile?'10px 12px':'12px 20px',fontSize:isMobile?12:14,color:t.text,fontWeight:bold?500:400,...numStyle}}>{p}</td>
  )
  return (
    <div>
      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:12}}>Статистика</div>
      <div style={{backgroundColor:t.panel,borderRadius:14,padding:isMobile?12:16,marginBottom:16}}>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:10}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <SInput placeholder="Дата от" value={dateFrom} onChange={setDateFrom} t={t}/>
            <SInput placeholder="Дата до" value={dateTo} onChange={setDateTo} t={t}/>
          </div>
          <SSelect placeholder="Способ оплаты" value={method} onChange={setMethod} t={t} options={['СБП','Карта','Моб. ком.'].map(v=>({value:v,label:v}))}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <BlueBtn sm onClick={apply}>Применить</BlueBtn>
          <GhostBtn t={t} onClick={reset}>Сбросить</GhostBtn>
        </div>
      </div>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
        <Card label="Всего сделок" value={String(data.filter(d=>d.status!=='pending').length)}/>
        <Card label="Завершено" value={String(completed.length)} color="#34C759"/>
        <Card label="Отменено" value={String(cancelled.length)} color="#FF3B30"/>
        <Card label="Объём (₽)" value={fmtNum(Math.round(totalRub))}/>
        <Card label="Объём (USDT)" value={totalUsdt.toFixed(2)} color="#26A17B"/>
      </div>
      <div style={{backgroundColor:t.panel,borderRadius:14,overflow:'hidden'}}>
        <div style={{padding:isMobile?'12px 14px':'14px 20px',borderBottom:`1px solid ${t.border}`,fontSize:14,fontWeight:600,color:t.text}}>По способу оплаты</div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:280}}>
            <thead><tr style={{borderBottom:`1px solid ${t.border}`}}>{['Способ','Сделок','Объём (₽)'].map(h=><th key={h} style={{textAlign:'left',fontSize:11,color:t.textSec,fontWeight:500,padding:isMobile?'8px 12px':'10px 20px'}}>{h}</th>)}</tr></thead>
            <tbody>{byMethod.map((row,i)=>(<tr key={row.method} style={{borderBottom:i<byMethod.length-1?`1px solid ${t.border}`:'none'}}>{td(row.method,true)}{td(row.total)}{td(fmtNum(Math.round(row.rub))+' ₽')}</tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
