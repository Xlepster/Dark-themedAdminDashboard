import { useState, useEffect, useRef } from 'react'
import { T, PayoutOffer, AcceptedPayout, TraderBalance, fmtNum, fmtTimer, numStyle, RATE } from '../store'
import { IcClock, IcInfo, IcPaperclip, IcVideo, IcFilePdf, IcX, IcCheckSquare } from '../icons'
import { Pill, GreenBtn, CopyBtn, Modal, GhostBtn, BlueBtn } from '../ui'

function ConfirmModal({offer,onConfirm,onClose,t}:{offer:PayoutOffer;onConfirm:()=>void;onClose:()=>void;t:T}) {
  return (
    <Modal title="Подтверждение выплаты" onClose={onClose} t={t}>
      <div style={{marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
          <Pill color={offer.method==='sbp'?'blue':'green'}>{offer.method==='sbp'?'СБП':'Карта'}</Pill>
          <span style={{fontSize:13,color:t.textSec}}>{offer.bank}</span>
        </div>
        <div style={{fontSize:16,fontWeight:600,color:t.text,marginBottom:4}}>{offer.fio}</div>
        <div style={{fontSize:13,color:t.textSec,...numStyle,marginBottom:12}}>{offer.account}</div>
        <div style={{fontSize:24,fontWeight:700,color:t.text,...numStyle,textAlign:'center',padding:'16px 0',backgroundColor:t.inputBg,borderRadius:10}}>
          {fmtNum(offer.amount)} ₽
        </div>
      </div>
      <div style={{fontSize:13,color:t.textSec,marginBottom:20,textAlign:'center'}}>
        Вы хотите взять эту заявку на выплату в работу?
      </div>
      <div style={{display:'flex',gap:10}}>
        <GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn>
        <div style={{flex:1}}/>
        <GreenBtn onClick={()=>{onConfirm();onClose()}}>Принять в работу</GreenBtn>
      </div>
    </Modal>
  )
}

export default function VyplatyPage({offers,accepted,onAccept,addReceipt,removeReceipt,markPaid,vyplatyOn,t,isMobile,traderBal}:{offers:PayoutOffer[];accepted:AcceptedPayout[];onAccept:(id:string)=>void;addReceipt:(id:string,name:string,type:'pdf'|'video')=>void;removeReceipt:(id:string,idx:number)=>void;markPaid:(id:string)=>void;vyplatyOn:boolean;t:T;isMobile:boolean;traderBal?:TraderBalance|null}) {
  const [tick,setTick]=useState(0)
  const [confirmOffer,setConfirmOffer]=useState<PayoutOffer|null>(null)
  useEffect(()=>{const i=setInterval(()=>setTick(n=>n+1),1000);return()=>clearInterval(i)},[])
  void tick

  const active=accepted.filter(a=>!a.paidAt)
  const paid=accepted.filter(a=>!!a.paidAt)
  const activeCount=active.length
  const maxReached=activeCount>=3

  const fileRefs=useRef<Record<string,HTMLInputElement|null>>({})

  const handleFile=(id:string,e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]
    if(!f) return
    const type: 'pdf'|'video' = f.type.startsWith('video/') ? 'video' : 'pdf'
    addReceipt(id, f.name, type)
    e.target.value=''
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {!vyplatyOn&&(
        <div style={{padding:'12px 16px',backgroundColor:'rgba(255,149,0,.08)',border:'1px solid rgba(255,149,0,.25)',borderRadius:12,fontSize:13,color:'#FF9500',display:'flex',alignItems:'center',gap:8}}>
          <IcInfo/> Включите кнопку «Выплаты» вверху, чтобы принимать заявки
        </div>
      )}

      {maxReached&&(
        <div style={{padding:'12px 16px',backgroundColor:'rgba(139,92,246,.08)',border:'1px solid rgba(139,92,246,.25)',borderRadius:12,fontSize:13,color:'#8B5CF6',display:'flex',alignItems:'center',gap:8}}>
          <IcInfo/> Достигнут лимит: 3 активных выплаты. Завершите текущие, чтобы взять новые.
        </div>
      )}

      {traderBal !== null && traderBal !== undefined && traderBal.usdt === 0 && (
        <div style={{padding:'12px 16px',backgroundColor:'rgba(255,59,48,.08)',border:'1px solid rgba(255,59,48,.25)',borderRadius:12,fontSize:13,color:'#FF3B30',display:'flex',alignItems:'center',gap:8}}>
          <IcInfo/> Баланс пуст. Пополните кошелёк, чтобы принимать выплаты.
        </div>
      )}

      {active.length>0&&(
        <div>
          <div style={{fontSize:15,fontWeight:600,color:t.text,marginBottom:10}}>Активные заявки ({active.length}/3)</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {active.map(a=>{
              const rem=Math.max(0,a.expiresAt-Date.now())
              const urgent=rem<30*60000
              const hasReceipts=(a.receipts||[]).length>0
              return (
                <div key={a.id} style={{backgroundColor:t.panel,borderRadius:12,padding:'14px 16px',borderLeft:'3px solid #34C759'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                    <div style={{flex:1,minWidth:140}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4,flexWrap:'wrap'}}>
                        <Pill color={a.method==='СБП'?'blue':'green'}>{a.method}</Pill>
                        <span style={{fontSize:12,color:t.textSec}}>{a.bank}</span>
                      </div>
                      <div style={{fontSize:14,fontWeight:600,color:t.text}}>{a.fio}</div>
                      <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:t.textSec,...numStyle,flexWrap:'wrap'}}>{a.account}<CopyBtn value={a.account}/></div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:isMobile?16:18,fontWeight:700,color:t.text,...numStyle}}>{fmtNum(a.amount)} ₽</div>
                      <div style={{display:'flex',alignItems:'center',gap:4,justifyContent:'flex-end',fontSize:13,fontWeight:600,color:urgent?'#FF3B30':'#FF9500',marginTop:4,...numStyle}}>
                        <IcClock/>{fmtTimer(rem,true)}
                      </div>
                    </div>
                  </div>

                  <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${t.border}`}}>
                    <input ref={el=>{fileRefs.current[a.id]=el}} type="file" accept=".pdf,video/*" style={{display:'none'}} onChange={e=>handleFile(a.id,e)}/>

                    {(a.receipts||[]).length>0&&(
                      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:10}}>
                        {(a.receipts||[]).map((r,i)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',backgroundColor:t.inputBg,borderRadius:8}}>
                            <span style={{color:r.type==='video'?'#FF9500':'#FF3B30',display:'flex'}}>{r.type==='video'?<IcVideo/>:<IcFilePdf/>}</span>
                            <span style={{fontSize:12,color:t.text,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</span>
                            <button onClick={()=>removeReceipt(a.id,i)} style={{background:'none',border:'none',cursor:'pointer',color:t.textSec,display:'flex',padding:2,flexShrink:0}}><IcX/></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                      <button onClick={()=>fileRefs.current[a.id]?.click()} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,border:`1.5px dashed ${t.border}`,backgroundColor:'transparent',color:t.textSec,cursor:'pointer',fontSize:12,fontFamily:'Inter,sans-serif'}}>
                        <IcPaperclip/> {(a.receipts||[]).length>0?'Добавить ещё':'Прикрепить чек / видео'}
                      </button>
                      {hasReceipts&&!a.paidAt&&(
                        <button onClick={()=>markPaid(a.id)} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:8,border:'1.5px solid #34C759',backgroundColor:'rgba(52,199,89,.12)',color:'#34C759',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'Inter,sans-serif'}}>
                          <IcCheckSquare/> Оплачено
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {paid.length>0&&(
        <div>
          <div style={{fontSize:14,fontWeight:600,color:t.textSec,marginBottom:8}}>Завершённые выплаты</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {paid.map(a=>(
              <div key={a.id} style={{backgroundColor:t.panel,borderRadius:10,padding:'10px 14px',opacity:.6,borderLeft:'3px solid #34C759',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:t.text}}>{a.fio}</div>
                  <div style={{fontSize:12,color:t.textSec,...numStyle}}>{a.account} · {a.bank}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:t.text,...numStyle}}>{fmtNum(a.amount)} ₽</span>
                  <Pill color="green">Оплачено</Pill>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:15,fontWeight:600,color:t.text}}>Доступные выплаты</div>
          <div style={{fontSize:12,color:t.textSec}}>Обновление каждые 30 мин</div>
        </div>
        {offers.length===0?(
          <div style={{backgroundColor:t.panel,borderRadius:12,padding:'32px 0',textAlign:'center',color:t.textSec,fontSize:14}}>
            <div style={{fontSize:24,marginBottom:8}}>💸</div>Нет доступных выплат
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[...offers].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(offer=>{
              const usdtNeeded = offer.amount / RATE
              const noBalance = traderBal !== null && traderBal !== undefined && traderBal.usdt < usdtNeeded
              const disabled = maxReached || !vyplatyOn || noBalance
              return (
                <div key={offer.id} style={{backgroundColor:t.panel,borderRadius:12,padding:'14px 16px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',opacity:disabled?.5:1}}>
                  <div style={{width:36,height:36,borderRadius:10,backgroundColor:offer.method==='sbp'?'rgba(0,122,255,.15)':'rgba(52,199,89,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                    {offer.method==='sbp'?'⚡':'💳'}
                  </div>
                  <div style={{flex:1,minWidth:100}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                      <Pill color={offer.method==='sbp'?'blue':'green'}>{offer.method==='sbp'?'СБП':'Карта'}</Pill>
                      <span style={{fontSize:12,color:t.textSec}}>{offer.bank}</span>
                    </div>
                    <div style={{fontSize:13,fontWeight:600,color:t.text}}>{offer.fio}</div>
                    <div style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:t.textSec,...numStyle}}>{offer.account}<CopyBtn value={offer.account}/></div>
                    {noBalance&&<div style={{fontSize:11,color:'#FF9500',marginTop:2}}>Недостаточно баланса ({usdtNeeded.toFixed(2)} USDT)</div>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>
                    <div style={{fontSize:isMobile?16:18,fontWeight:700,color:t.text,...numStyle}}>{fmtNum(offer.amount)} ₽</div>
                    <GreenBtn sm onClick={()=>setConfirmOffer(offer)} disabled={disabled}>Принять</GreenBtn>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {confirmOffer&&<ConfirmModal offer={confirmOffer} onConfirm={()=>onAccept(confirmOffer.id)} onClose={()=>setConfirmOffer(null)} t={t}/>}
    </div>
  )
}
