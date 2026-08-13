import { useState } from 'react'
import { T, Deal, TxHistory, Requisite, Employee, BANKS, OPERATORS, uid, fmtDate, fmtNum, fmtTimer, numStyle } from './store'
import { IcCheck, IcClock, IcDownload, IcArrow, IcArchive, IcTrash, IcX } from './icons'
import { Modal, Field, SInput, SSelect, BlueBtn, GhostBtn, RedBtn, Pill, Toggle, CopyBtn } from './ui'

export function DealDetailModal({deal,onClose,t}:{deal:Deal;onClose:()=>void;t:T}) {
  const ok=deal.status==='completed', pending=deal.status==='pending'
  const statusColor=pending?'#007AFF':ok?'#34C759':'#FF3B30'
  const statusLabel=pending?'Ожидание':ok?'Завершена':'Отменена'
  const Row=({label,value,copy}:{label:string;value:string;copy?:boolean})=>(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${t.border}`}}>
      <span style={{fontSize:13,color:t.textSec}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600,color:t.text,...numStyle,display:'flex',alignItems:'center',gap:4}}>{value}{copy&&<CopyBtn value={value}/>}</span>
    </div>
  )
  return (
    <Modal title={`Заявка #${deal.id}`} onClose={onClose} t={t}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
        <span style={{width:10,height:10,borderRadius:'50%',backgroundColor:statusColor,display:'inline-block'}}/>
        <span style={{fontSize:14,fontWeight:600,color:statusColor}}>{statusLabel}</span>
        <Pill color="blue">приём</Pill>
      </div>
      <Row label="Номер заявки" value={deal.id} copy/>
      <Row label="Сумма" value={`${fmtNum(deal.amount)} ₽`}/>
      <Row label="Сумма USDT" value={`${deal.amountUsdt.toFixed(8)} USDT`}/>
      <Row label="Курс приёма" value={`${deal.rate.toFixed(2)} ₽/USDT`}/>
      <Row label="Способ оплаты" value={deal.method}/>
      <Row label="Банк / Оператор" value={deal.bank}/>
      <Row label="ФИО" value={deal.fio}/>
      <Row label="Реквизит" value={deal.account} copy/>
      <Row label="Создана" value={deal.createdAt}/>
      {pending&&deal.expiresAt>0&&(
        <div style={{marginTop:12,padding:'10px 14px',backgroundColor:'rgba(255,149,0,.08)',border:'1px solid rgba(255,149,0,.25)',borderRadius:10,fontSize:13,color:'#FF9500',display:'flex',alignItems:'center',gap:6}}>
          <IcClock/> Истекает через {fmtTimer(Math.max(0,deal.expiresAt-Date.now()))}
        </div>
      )}
    </Modal>
  )
}

export function WithdrawModal({onClose,onConfirm,t}:{onClose:()=>void;onConfirm:(addr:string,amt:number)=>void;t:T}) {
  const [addr,setAddr]=useState('')
  const [amt,setAmt]=useState('')
  const [done,setDone]=useState(false)
  const submit=()=>{if(!addr||!amt)return;onConfirm(addr,parseFloat(amt));setDone(true);setTimeout(onClose,1800)}
  return (
    <Modal title="Вывод средств" onClose={onClose} t={t}>
      {done?(<div style={{textAlign:'center',padding:'20px 0'}}><div style={{width:48,height:48,borderRadius:'50%',backgroundColor:'rgba(52,199,89,.2)',border:'2px solid #34C759',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}><IcCheck/></div><div style={{fontSize:16,fontWeight:600,color:'#34C759'}}>Заявка отправлена</div></div>):(
        <>
          <Field label="TRC-20 адрес получателя"><SInput placeholder="T..." value={addr} onChange={setAddr} t={t}/></Field>
          <Field label="Сумма вывода (USDT)"><SInput placeholder="0.00" value={amt} onChange={setAmt} t={t}/></Field>
          <div style={{padding:'10px 14px',backgroundColor:'rgba(255,149,0,.1)',border:'1px solid rgba(255,149,0,.3)',borderRadius:10,fontSize:12,color:'#FF9500',marginBottom:16}}>Только сеть TRC-20. Проверьте адрес перед отправкой.</div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}><GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn><BlueBtn onClick={submit}>Отправить</BlueBtn></div>
        </>
      )}
    </Modal>
  )
}

export function HistoryModal({history,onClose,t}:{history:TxHistory[];onClose:()=>void;t:T}) {
  return (
    <Modal title="История транзакций" onClose={onClose} t={t}>
      {history.length===0?(<div style={{textAlign:'center',padding:'24px 0',color:t.textSec,fontSize:14}}>История пуста</div>):(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[...history].reverse().map(tx=>{
            const isD=tx.type==='deposit'
            return (
              <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',backgroundColor:t.inputBg,borderRadius:10}}>
                <div style={{width:36,height:36,borderRadius:'50%',backgroundColor:isD?'rgba(52,199,89,.15)':'rgba(255,59,48,.15)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{isD?<IcDownload/>:<IcArrow/>}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,color:t.text}}>{isD?'Пополнение':'Вывод'}</div>
                  <div style={{fontSize:11,color:t.textSec,...numStyle}}>{tx.address.slice(0,10)}...{tx.address.slice(-6)}</div>
                  <div style={{fontSize:11,color:t.textSec}}>{tx.createdAt}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14,fontWeight:700,color:isD?'#34C759':'#FF3B30',...numStyle}}>{isD?'+':'-'}{tx.amount.toFixed(4)} USDT</div>
                  <Pill color={tx.status==='completed'?'green':'orange'}>{tx.status==='completed'?'Выполнено':'Ожидание'}</Pill>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

export function RequisiteModal({onSave,onDelete,onClose,initial,t}:{onSave:(r:Requisite)=>void;onDelete?:()=>void;onClose:()=>void;initial?:Requisite;t:T}) {
  const [method,setMethod]=useState<'sbp'|'card'|'mobile'>(initial?.method||'sbp')
  const [bank,setBank]=useState(initial?.bank||'')
  const [operator,setOperator]=useState(initial?.operator||'')
  const [fio,setFio]=useState(initial?.fio||'')
  const [account,setAccount]=useState(initial?.account||'')
  const [minAmt,setMinAmt]=useState(initial?String(initial.minAmount):'')
  const [maxAmt,setMaxAmt]=useState(initial?String(initial.maxAmount):'')
  const [limit,setLimit]=useState(initial?String(initial.limitAmount):'')
  const [daily,setDaily]=useState(initial?String(initial.dailyLimit):'')
  const [monthly,setMonthly]=useState(initial?String(initial.monthlyLimit):'')
  const [statusEnabled,setStatusEnabled]=useState(initial?.status==='active'||false)
  const [err,setErr]=useState('')

  const save=()=>{
    const min=parseFloat(minAmt),max=parseFloat(maxAmt),lim=parseFloat(limit),day=parseFloat(daily),mon=parseFloat(monthly)
    if(!fio.trim()||!account.trim()||!minAmt||!maxAmt||!limit||!daily||!monthly){setErr('Заполните все поля');return}
    if(isNaN(min)||isNaN(max)||isNaN(lim)||isNaN(day)||isNaN(mon)){setErr('Суммы должны быть числами');return}
    if(min>=max){setErr('Мин. сумма должна быть меньше макс.');return}
    if(method!=='mobile'&&!bank){setErr('Выберите банк');return}
    if(method==='mobile'&&!operator){setErr('Выберите оператора');return}
    setErr('')
    onSave({id:initial?.id||uid(),method,bank:method!=='mobile'?bank:'',operator:method==='mobile'?operator:'',fio,account,minAmount:min,maxAmount:max,limitAmount:lim,dailyLimit:day,monthlyLimit:mon,status:statusEnabled?'active':'paused',createdAt:initial?.createdAt||fmtDate(new Date())})
  }
  return (
    <Modal title={initial?'Редактировать реквизит':'Создать реквизит'} onClose={onClose} t={t} wide>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,color:t.textSec,marginBottom:8,fontWeight:500}}>Способ оплаты</div>
        <div style={{display:'flex',gap:8}}>
          {(['sbp','card','mobile'] as const).map(m=>(
            <button key={m} onClick={()=>setMethod(m)} style={{flex:1,padding:'10px 0',borderRadius:10,cursor:'pointer',backgroundColor:method===m?'#007AFF':t.inputBg,color:method===m?'#fff':t.textSec,border:`1.5px solid ${method===m?'#007AFF':t.border}`,fontSize:14,fontWeight:500,fontFamily:'Inter,sans-serif'}}>
              {m==='sbp'?'СБП':m==='card'?'Карта':'Моб. ком.'}
            </button>
          ))}
        </div>
      </div>
      {method!=='mobile'
        ?<Field label="Банк"><SSelect value={bank} onChange={setBank} placeholder="Выберите банк" t={t} options={BANKS.map(b=>({value:b,label:b}))}/></Field>
        :<Field label="Мобильный оператор"><SSelect value={operator} onChange={setOperator} placeholder="Выберите оператора" t={t} options={OPERATORS.map(o=>({value:o,label:o}))}/></Field>
      }
      <Field label="ФИО"><SInput value={fio} onChange={setFio} placeholder="Иванов Иван Иванович" t={t}/></Field>
      <Field label={method==='card'?'Номер карты':'Номер телефона'}>
        <SInput value={account} onChange={setAccount} placeholder={method==='card'?'0000 0000 0000 0000':'+7 (___) ___-__-__'} t={t}/>
      </Field>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:10}}>
        <Field label="Мин. сумма (₽)"><SInput value={minAmt} onChange={setMinAmt} placeholder="1000" t={t}/></Field>
        <Field label="Макс. сумма (₽)"><SInput value={maxAmt} onChange={setMaxAmt} placeholder="15000" t={t}/></Field>
        <Field label="Лимит суммы (₽)"><SInput value={limit} onChange={setLimit} placeholder="500000" t={t}/></Field>
        <Field label="Дневной лимит (₽)"><SInput value={daily} onChange={setDaily} placeholder="50000" t={t}/></Field>
        <Field label="Месячный лимит (₽)"><SInput value={monthly} onChange={setMonthly} placeholder="1500000" t={t}/></Field>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 0',borderTop:`1px solid ${t.border}`,marginTop:4}}>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:t.text}}>Активировать реквизит</div>
          <div style={{fontSize:12,color:t.textSec,marginTop:2}}>{statusEnabled?'Заявки начнут поступать сразу':'Реквизит будет создан в выключенном состоянии'}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:13,color:statusEnabled?'#34C759':t.textSec,fontWeight:500}}>{statusEnabled?'Включён':'Выключен'}</span>
          <Toggle on={statusEnabled} onChange={setStatusEnabled}/>
        </div>
      </div>
      {err&&<div style={{padding:'8px 12px',backgroundColor:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.3)',borderRadius:8,fontSize:12,color:'#FF3B30',marginBottom:8}}>{err}</div>}
      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
        {initial&&onDelete&&<RedBtn sm onClick={onDelete}><IcArchive/> В архив</RedBtn>}
        <div style={{flex:1}}/><GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn><BlueBtn onClick={save}>Сохранить</BlueBtn>
      </div>
    </Modal>
  )
}

export function EmployeeModal({onSave,onDelete,onClose,initial,t}:{onSave:(e:Employee)=>void;onDelete?:()=>void;onClose:()=>void;initial?:Employee;t:T}) {
  const [name,setName]=useState(initial?.name||'')
  const [email,setEmail]=useState(initial?.email||'')
  const [pass,setPass]=useState(initial?.password||'')
  const [err,setErr]=useState('')
  const save=()=>{if(!name.trim()||!email.trim()||!pass.trim()){setErr('Заполните все поля');return}setErr('');onSave({id:initial?.id||uid(),name,email,password:pass})}
  return (
    <Modal title={initial?'Редактировать сотрудника':'Добавить сотрудника'} onClose={onClose} t={t}>
      <Field label="Имя"><SInput value={name} onChange={setName} placeholder="Иван Петров" t={t}/></Field>
      <Field label="Email"><SInput value={email} onChange={setEmail} placeholder="ivan@company.com" type="email" t={t}/></Field>
      <Field label="Пароль"><SInput value={pass} onChange={setPass} placeholder="••••••••" type="password" t={t}/></Field>
      {err&&<div style={{padding:'8px 12px',backgroundColor:'rgba(255,59,48,.1)',border:'1px solid rgba(255,59,48,.3)',borderRadius:8,fontSize:12,color:'#FF3B30',marginBottom:8}}>{err}</div>}
      <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
        {initial&&onDelete&&<RedBtn sm onClick={onDelete}><IcTrash/> Удалить</RedBtn>}
        <div style={{flex:1}}/><GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn><BlueBtn onClick={save}>Сохранить</BlueBtn>
      </div>
    </Modal>
  )
}
