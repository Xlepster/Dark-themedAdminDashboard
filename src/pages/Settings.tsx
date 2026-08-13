import { useState, useRef } from 'react'
import { T, useLS } from '../store'
import { IcX, IcTelegram } from '../icons'
import { BlueBtn, GhostBtn, RedBtn, SInput, SSelect, Pill, Toggle, CheckRow } from '../ui'

function TgConnectInput({onSave,t}:{onSave:(v:string)=>void;t:T}) {
  const ref=useRef<HTMLInputElement>(null)
  const save=()=>{if(ref.current?.value.trim())onSave(ref.current.value.trim())}
  return (
    <div>
      <input ref={ref} placeholder="@username" defaultValue="" style={{width:'100%',padding:'10px 14px',backgroundColor:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,outline:'none',fontFamily:'Inter,sans-serif'}} onFocus={e=>e.target.style.borderColor='#007AFF'} onBlur={e=>e.target.style.borderColor=t.border} onKeyDown={e=>{if(e.key==='Enter')save()}}/>
      <div style={{marginTop:8}}><BlueBtn sm onClick={save}>Привязать</BlueBtn></div>
    </div>
  )
}

export default function SettingsPage({t,isMobile}:{t:T;isMobile?:boolean}) {
  const [twofa,setTwofa]=useLS('twofa',true)
  const [tgUser,setTgUser]=useLS<string|null>('tgUser',null)
  const [tgEditing,setTgEditing]=useState(false)
  const [newPass,setNewPass]=useState('')
  const [confPass,setConfPass]=useState('')
  const [timezone,setTimezone]=useLS('timezone','Europe/Moscow')
  const [language,setLanguage]=useLS('language','ru')
  const [saved,setSaved]=useState('')
  const [notifs,setNotifs]=useLS('notifs',{cancelled:true,completed:true,newPriom:true,disputeBot:true,disputeGroup:true,notFound:true,confirmTransfer:true,acceptPayout:true,newPayout:true,cancelPayout:true,limits:true,deviceStatus:false,weeklyReport:false})
  const tgEditRef=useRef<HTMLInputElement>(null)
  const save=(s:string)=>{setSaved(s);setTimeout(()=>setSaved(''),2000)}

  const notifLabels:[keyof typeof notifs,string][]=[
    ['cancelled','Сделка отменена'],['completed','Сделка завершена'],['newPriom','Новая сделка на приём'],
    ['disputeBot','Открыт диспут (бот)'],['disputeGroup','Открыт диспут (группа)'],['notFound','Сделка не найдена'],
    ['confirmTransfer','Подтверждение перевода'],['acceptPayout','Принятие выплаты'],
    ['newPayout','Новая выплата'],['cancelPayout','Отмена выплаты'],
    ['limits','Лимиты по реквизитам'],['deviceStatus','Статус устройства'],['weeklyReport','Еженедельный отчёт'],
  ]
  const Sec=({title,children}:{title:string;children:React.ReactNode})=>(
    <div style={{marginBottom:20}}>
      <div style={{fontSize:15,fontWeight:700,color:t.text,marginBottom:10}}>{title}</div>
      <div style={{backgroundColor:t.panel,borderRadius:14,padding:isMobile?14:20}}>{children}</div>
    </div>
  )
  const Row=({label,children}:{label:string;children:React.ReactNode})=>(
    <div style={{display:'flex',flexDirection:isMobile?'column':'row',alignItems:'flex-start',gap:isMobile?6:16,marginBottom:14}}>
      <div style={{width:isMobile?'100%':200,flexShrink:0,fontSize:13,color:t.textSec,paddingTop:isMobile?0:10,fontWeight:500}}>{label}</div>
      <div style={{flex:1,width:'100%'}}>{children}</div>
    </div>
  )

  return (
    <div style={{maxWidth:860}}>
      <div style={{fontSize:isMobile?16:20,fontWeight:700,color:t.text,marginBottom:16}}>Настройки</div>

      <Sec title="Безопасность">
        <Row label="2FA аутентификация">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Toggle on={!!twofa} onChange={v=>setTwofa(v)}/>
            <span style={{fontSize:14,fontWeight:500,color:twofa?'#34C759':t.textSec}}>{twofa?'Включено':'Отключено'}</span>
          </div>
        </Row>
        <Row label="Новый пароль"><SInput placeholder="" value={newPass} onChange={setNewPass} type="password" t={t}/></Row>
        <Row label="Подтвердите пароль"><SInput placeholder="" value={confPass} onChange={setConfPass} type="password" t={t}/></Row>
        <BlueBtn sm onClick={()=>save('sec')}>{saved==='sec'?'Сохранено ✓':'Сохранить'}</BlueBtn>
      </Sec>

      <Sec title="Telegram">
        <Row label="Бот уведомлений">
          {tgUser&&!tgEditing?(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><IcTelegram/><span style={{fontSize:14,fontWeight:600,color:'#007AFF'}}>{tgUser}</span><Pill color="green">Подключён</Pill></div>
              <RedBtn sm onClick={()=>setTgEditing(true)}><IcX/> Отвязать</RedBtn>
            </div>
          ):tgEditing?(
            <div>
              <div style={{fontSize:13,color:t.textSec,marginBottom:10}}>Введите новый @username или оставьте пустым для отвязки.</div>
              <input ref={tgEditRef} placeholder={tgUser||'@username'} defaultValue="" style={{width:'100%',padding:'10px 14px',backgroundColor:t.inputBg,border:`1px solid ${t.border}`,borderRadius:10,color:t.text,fontSize:14,outline:'none',fontFamily:'Inter,sans-serif'}} onFocus={e=>e.target.style.borderColor='#007AFF'} onBlur={e=>e.target.style.borderColor=t.border}/>
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <BlueBtn sm onClick={()=>{const v=tgEditRef.current?.value.trim()||'';if(v)setTgUser(v.startsWith('@')?v:'@'+v);else setTgUser(null);setTgEditing(false)}}>Сохранить</BlueBtn>
                <GhostBtn t={t} onClick={()=>setTgEditing(false)}>Отмена</GhostBtn>
              </div>
            </div>
          ):(
            <TgConnectInput onSave={v=>setTgUser(v.startsWith('@')?v:'@'+v)} t={t}/>
          )}
        </Row>
        <Row label="Уведомления">
          <div style={{display:'flex',flexDirection:'column',gap:2}}>
            {notifLabels.map(([key,label])=>(
              <CheckRow key={key} label={label} checked={(notifs as any)[key]} onChange={v=>setNotifs((p:any)=>({...p,[key]:v}))} t={t}/>
            ))}
          </div>
        </Row>
        <BlueBtn sm onClick={()=>save('tg')}>{saved==='tg'?'Сохранено ✓':'Сохранить'}</BlueBtn>
      </Sec>

      <Sec title="Профиль">
        <Row label="Таймзона"><SSelect value={timezone} onChange={setTimezone} t={t} options={['Europe/Moscow','UTC','Asia/Almaty','Europe/London','Asia/Novosibirsk'].map(v=>({value:v,label:v}))}/></Row>
        <Row label="Язык"><SSelect value={language} onChange={setLanguage} t={t} options={[{value:'ru',label:'Русский'},{value:'en',label:'English'}]}/></Row>
        <BlueBtn sm onClick={()=>save('profile')}>{saved==='profile'?'Сохранено ✓':'Сохранить'}</BlueBtn>
      </Sec>
    </div>
  )
}
