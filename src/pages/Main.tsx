import { useState } from 'react'
import { T, AuthUser, Deal, WALLET, ratesIn, ratesOut, numStyle, traderAPI, TraderBalance } from '../store'
import { GhostBtn, CopyBtn, Modal, Field, SInput, GreenBtn } from '../ui'
import { IcCheck } from '../icons'

const barData=[
  {range:'0 — 500',mob:62,sbp:100,card:100},{range:'500 — 1 000',mob:72,sbp:100,card:100},
  {range:'1 000 — 1 500',mob:32,sbp:100,card:100},{range:'1 500 — 2 000',mob:18,sbp:100,card:100},
  {range:'2 000 — 2 500',mob:14,sbp:0,card:100},{range:'2 500 — 3 000',mob:4,sbp:100,card:100},
  {range:'3 000 — 3 500',mob:3,sbp:60,card:60},{range:'3 500 — 4 000',mob:0,sbp:4,card:4},
  {range:'4 000 — 4 500',mob:0,sbp:2,card:100},{range:'4 500 — 5 000',mob:100,sbp:2,card:100},
  {range:'5 000 — 5 500',mob:3,sbp:60,card:0},{range:'6 000 — 7 000',mob:0,sbp:85,card:45},
  {range:'8 000 — 9 000',mob:70,sbp:20,card:90},{range:'10 000 — 11 000',mob:0,sbp:55,card:100},
  {range:'15 000 — 20 000',mob:40,sbp:0,card:80},{range:'30 000 — 50 000',mob:0,sbp:100,card:30},
  {range:'60 000 — 100 000',mob:15,sbp:0,card:75},
]
function barColor(v:number){return v>70?'#FF3B30':v>30?'#FF9500':'#34C759'}

function DepositModal({ authUser, t, onClose }: { authUser: AuthUser; t: T; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setErr('Введите корректную сумму USDT'); return }
    if (!authUser.traderId) { setErr('Ошибка: нет ID трейдера'); return }
    setLoading(true); setErr('')
    try {
      await traderAPI.depositRequest(authUser.traderId, amt, authUser.traderName || authUser.login, authUser.login)
      setDone(true)
    } catch (e: any) {
      setErr(e.message || 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Пополнение баланса" onClose={onClose} t={t}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(52,199,89,.15)', border: '2px solid #34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#34C759' }}><IcCheck /></div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#34C759', marginBottom: 6 }}>Заявка отправлена</div>
          <div style={{ fontSize: 13, color: t.textSec }}>Администратор проверит поступление и зачислит средства</div>
          <button onClick={onClose} style={{ marginTop: 20, padding: '10px 28px', borderRadius: 10, backgroundColor: t.inputBg, border: `1px solid ${t.border}`, color: t.text, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Закрыть</button>
        </div>
      ) : (
        <>
          <div style={{ backgroundColor: t.inputBg, borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: t.textSec, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Адрес для пополнения (TRC-20)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#26A17B', wordBreak: 'break-all', flex: 1, ...numStyle }}>{WALLET}</div>
              <CopyBtn value={WALLET} />
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', backgroundColor: 'rgba(255,149,0,.08)', border: '1px solid rgba(255,149,0,.3)', borderRadius: 8, fontSize: 11, color: '#FF9500' }}>
              Отправляйте только USDT по сети TRC-20. Другие сети и токены не принимаются.
            </div>
          </div>

          <Field label="Сумма, которую вы отправили (USDT)">
            <SInput placeholder="Например: 50.00" value={amount} onChange={setAmount} t={t} />
          </Field>

          {err && <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,59,48,.1)', border: '1px solid rgba(255,59,48,.3)', borderRadius: 8, fontSize: 12, color: '#FF3B30', marginBottom: 8 }}>{err}</div>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn>
            <GreenBtn onClick={submit} disabled={loading}>{loading ? 'Отправка...' : 'Отправить заявку'}</GreenBtn>
          </div>
        </>
      )}
    </Modal>
  )
}

export default function MainPage({t,onWithdraw,onHistory,isMobile,authUser,traderBal,deals=[]}:{t:T;onWithdraw:()=>void;onHistory:()=>void;isMobile:boolean;authUser:AuthUser;traderBal?:TraderBalance|null;deals?:Deal[]}) {
  const [depositModal, setDepositModal] = useState(false)

  // USDT locked in pending deals (local, real-time)
  const lockedUsdt = deals
    .filter(d => d.status === 'pending')
    .reduce((s, d) => s + d.amountUsdt, 0)

  const totalUsdt = authUser.role === 'trader' ? (traderBal?.usdt ?? null) : 0
  // Available = total minus locked in pending deals
  const balUsdt = totalUsdt === null ? null : Math.max(0, totalUsdt - lockedUsdt)
  const balInsurance = authUser.role === 'trader' ? (traderBal?.insurance ?? 500) : 500
  const balLocked = authUser.role === 'trader' ? lockedUsdt : 0

  const rewards=['SBP 1-3k: 8.0%','BTV_A: 5.5%','BTVx_SBP: 6.5%','BTV_C_SBP: 7.0%','BTV_S(3K)_SBP: 7.5%','SIM0: 15.0%','SIM: 13.5%']
  const Tag=({v}:{v:string})=><span style={{fontSize:11,padding:'2px 8px',borderRadius:6,backgroundColor:t.inputBg,color:t.text,...numStyle}}>{v}</span>
  return (
    <>
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{backgroundColor:t.panel,borderRadius:14,padding:20}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{width:48,height:48,borderRadius:14,backgroundColor:'#26A17B',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>₮</div>
            <div>
              <div style={{fontSize:28,fontWeight:700,color:t.text,letterSpacing:'-0.5px',...numStyle}}>
              {balUsdt === null ? <span style={{fontSize:16,color:t.textSec}}>Загрузка...</span> : <>{balUsdt.toFixed(4)} <span style={{color:'#26A17B',fontSize:18}}>USDT</span></>}
            </div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                <span style={{fontSize:12,color:t.textSec,...numStyle}}>{WALLET.slice(0,8)}...{WALLET.slice(-6)} (TRC20)</span>
                <CopyBtn value={WALLET}/>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {authUser.role === 'trader' && <GhostBtn t={t} onClick={() => setDepositModal(true)}>Пополнить</GhostBtn>}
            <GhostBtn t={t} onClick={onWithdraw}>Вывести</GhostBtn>
            <GhostBtn t={t} onClick={onHistory}>История</GhostBtn>
          </div>
        </div>
        <div style={{display:'flex',gap:24,marginTop:16,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>🛡️</span>
            <div><div style={{fontSize:11,color:t.textSec}}>Страховой лимит</div><div style={{fontSize:13,fontWeight:600,color:t.text,...numStyle}}>{balInsurance.toFixed(2)} / {balInsurance.toFixed(2)} USDT</div></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:16}}>🔒</span>
            <div>
              <div style={{fontSize:11,color:t.textSec}}>Заблокировано в сделках</div>
              <div style={{fontSize:13,fontWeight:600,color:balLocked>0?'#FF9500':t.text,...numStyle}}>
                {balLocked.toFixed(4)} USDT
                {balLocked > 0 && <span style={{fontSize:11,color:t.textSec,fontWeight:400}}> · {deals.filter(d=>d.status==='pending').length} заявок</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{backgroundColor:t.panel,borderRadius:14,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:12}}>Торговое вознаграждение</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:12,color:t.textSec,flexShrink:0}}>Приём:</span>
          {rewards.map(r=><Tag key={r} v={r}/>)}
        </div>
      </div>

      <div style={{backgroundColor:t.panel,borderRadius:14,padding:20}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:12}}>Курсы валют</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-start',marginBottom:10}}>
          <span style={{fontSize:12,color:t.textSec,flexShrink:0,paddingTop:2,width:52}}>Приём:</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{ratesIn.map(r=><Tag key={r} v={r}/>)}</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-start'}}>
          <span style={{fontSize:12,color:t.textSec,flexShrink:0,paddingTop:2,width:52}}>Выплата:</span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{ratesOut.filter(r=>!r.startsWith('SIM:')&&!r.startsWith('SIM0:')&&!r.startsWith('BTV_A:')).map(r=><Tag key={r} v={r}/>)}</div>
        </div>
        <div style={{fontSize:11,color:t.textMut,marginTop:8}}>&nbsp;</div>
      </div>

      <div>
        <div style={{fontSize:15,fontWeight:600,color:'#FF3B30',marginBottom:10}}>Активные споры</div>
        <div style={{backgroundColor:t.panel,borderRadius:12,padding:'16px 0',textAlign:'center',color:t.textSec,fontSize:14}}>Нет активных споров</div>
      </div>

      <div style={{backgroundColor:t.panel,borderRadius:14,padding:isMobile?14:20,overflowX:'auto'}}>
        <div style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>Лимиты сумм</div>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:isMobile?360:560}}>
          <thead><tr>{['Сумма','Моб. телефон','СБП','Карта'].map(h=><th key={h} style={{textAlign:'left',fontSize:12,color:t.textSec,fontWeight:500,padding:'0 0 10px',paddingRight:20}}>{h}</th>)}</tr></thead>
          <tbody>
            {barData.map(row=>(
              <tr key={row.range}>
                <td style={{fontSize:12,color:t.textSec,padding:'3px 20px 3px 0',whiteSpace:'nowrap',...numStyle}}>{row.range}</td>
                {[row.mob,row.sbp,row.card].map((v,i)=>(
                  <td key={i} style={{padding:'3px 20px 3px 0'}}><div style={{width:Math.max(v*1.1,v>0?4:0),height:10,backgroundColor:barColor(v),borderRadius:3}}/></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {depositModal && <DepositModal authUser={authUser} t={t} onClose={() => setDepositModal(false)} />}
  </>
  )
}
