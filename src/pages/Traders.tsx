import { useState, useEffect, useCallback } from 'react'
import { T, TraderDetail, BalanceTx, DepositRequest, traderAPI, depositAPI, fmtNum, numStyle } from '../store'
import { IcPlus, IcEdit, IcTrash, IcX, IcCheck, IcArrow, IcDownload } from '../icons'
import { BlueBtn, GhostBtn, RedBtn, GreenBtn, SInput, Pill, Field, Modal } from '../ui'

function BalanceModal({ trader, onClose, onDone, adminLogin, t }: { trader: TraderDetail; onClose: () => void; onDone: () => void; adminLogin: string; t: T }) {
  const [type, setType] = useState<'credit' | 'debit' | 'insurance'>('credit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 0) { setErr('Введите корректную сумму'); return }
    if (type !== 'insurance' && amt <= 0) { setErr('Введите корректную сумму'); return }
    setLoading(true); setErr('')
    try {
      if (type === 'credit') await traderAPI.credit(trader.id, amt, note, adminLogin)
      else if (type === 'debit') await traderAPI.debit(trader.id, amt, note, adminLogin)
      else await traderAPI.setInsurance(trader.id, amt)
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 1200)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const tabs: { key: 'credit' | 'debit' | 'insurance'; label: string; color: string; bg: string }[] = [
    { key: 'credit',    label: '+ Пополнить',      color: '#34C759', bg: 'rgba(52,199,89,.12)' },
    { key: 'debit',     label: '− Списать',         color: '#FF3B30', bg: 'rgba(255,59,48,.1)' },
    { key: 'insurance', label: '🛡 Лимит',          color: '#FF9500', bg: 'rgba(255,149,0,.1)' },
  ]

  return (
    <Modal title={`Баланс — ${trader.name}`} onClose={onClose} t={t}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(52,199,89,.2)', border: '2px solid #34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><IcCheck /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#34C759' }}>Выполнено</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => { setType(tab.key); setErr('') }} style={{ flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${type === tab.key ? tab.color : t.border}`, backgroundColor: type === tab.key ? tab.bg : t.inputBg, color: type === tab.key ? tab.color : t.textSec, fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, padding: '12px 14px', backgroundColor: t.inputBg, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: t.textSec, marginBottom: 3 }}>Баланс</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#26A17B', ...numStyle }}>{trader.balance.usdt.toFixed(4)} USDT</div>
            </div>
            <div style={{ flex: 1, padding: '12px 14px', backgroundColor: type === 'insurance' ? 'rgba(255,149,0,.08)' : t.inputBg, borderRadius: 10, textAlign: 'center', border: type === 'insurance' ? '1.5px solid rgba(255,149,0,.4)' : `1.5px solid transparent` }}>
              <div style={{ fontSize: 11, color: t.textSec, marginBottom: 3 }}>Страховой лимит</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FF9500', ...numStyle }}>{trader.balance.insurance.toFixed(2)} USDT</div>
            </div>
          </div>

          {type === 'insurance' ? (
            <Field label="Новый страховой лимит (USDT)">
              <SInput placeholder={`Текущий: ${trader.balance.insurance.toFixed(2)}`} value={amount} onChange={setAmount} t={t} />
            </Field>
          ) : (
            <>
              <Field label="Сумма (USDT)"><SInput placeholder="0.00" value={amount} onChange={setAmount} t={t} /></Field>
              <Field label="Примечание"><SInput placeholder="Пополнение депозита, комиссия…" value={note} onChange={setNote} t={t} /></Field>
            </>
          )}

          {err && <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,59,48,.1)', border: '1px solid rgba(255,59,48,.3)', borderRadius: 8, fontSize: 12, color: '#FF3B30', marginBottom: 8 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn>
            {type === 'credit' && <GreenBtn onClick={submit} disabled={loading}>{loading ? '...' : 'Пополнить'}</GreenBtn>}
            {type === 'debit' && <RedBtn onClick={submit} disabled={loading}>{loading ? '...' : 'Списать'}</RedBtn>}
            {type === 'insurance' && (
              <button onClick={submit} disabled={loading} style={{ padding: '9px 20px', fontSize: 14, fontWeight: 500, backgroundColor: loading ? '#48484a' : '#FF9500', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif' }}>
                {loading ? '...' : 'Установить'}
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  )
}

function TraderDetailModal({ trader, onClose, onRefresh, adminLogin, t }: { trader: TraderDetail; onClose: () => void; onRefresh: () => void; adminLogin: string; t: T }) {
  const [detail, setDetail] = useState<TraderDetail>(trader)
  const [balModal, setBalModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)

  const reload = useCallback(async () => {
    try { const d = await traderAPI.get(trader.id); setDetail(d) } catch {}
  }, [trader.id])

  useEffect(() => { reload() }, [reload])

  const toggleStatus = async () => {
    setLoading(true)
    try {
      await traderAPI.setStatus(trader.id, detail.status === 'active' ? 'blocked' : 'active')
      await reload(); onRefresh()
    } catch {} finally { setLoading(false) }
  }

  const txIcon = (type: string) => type === 'credit'
    ? <IcDownload />
    : <IcArrow />

  return (
    <>
      <Modal title={detail.name} onClose={onClose} t={t} wide>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#A78BFA', flexShrink: 0 }}>{detail.name.slice(0, 1).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>{detail.name}</div>
            <div style={{ fontSize: 13, color: t.textSec }}>@{detail.login}{detail.email ? ` · ${detail.email}` : ''}</div>
            <div style={{ fontSize: 12, color: t.textSec, marginTop: 2 }}>Зарегистрирован: {detail.createdAt}</div>
          </div>
          <Pill color={detail.status === 'active' ? 'green' : 'red'}>{detail.status === 'active' ? 'Активен' : 'Заблокирован'}</Pill>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Баланс', value: `${detail.balance.usdt.toFixed(4)} USDT`, color: '#26A17B' },
            { label: 'Страховой лимит', value: `${detail.balance.insurance.toFixed(2)} USDT` },
            { label: 'Заблокировано', value: `${detail.balance.locked.toFixed(2)} USDT` },
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: t.inputBg, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: t.textSec, marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: card.color || t.text, ...numStyle }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <BlueBtn sm onClick={() => setBalModal(true)}>Изменить баланс</BlueBtn>
          <button onClick={toggleStatus} disabled={loading} style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, backgroundColor: detail.status === 'active' ? 'rgba(255,59,48,.1)' : 'rgba(52,199,89,.1)', color: detail.status === 'active' ? '#FF3B30' : '#34C759', border: `1px solid ${detail.status === 'active' ? 'rgba(255,59,48,.4)' : 'rgba(52,199,89,.4)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>
            {loading ? '...' : detail.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
          </button>
          {!delConfirm
            ? <button onClick={() => setDelConfirm(true)} style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: 13, fontWeight: 500, backgroundColor: 'rgba(255,59,48,.08)', color: '#FF3B30', border: '1px solid rgba(255,59,48,.3)', borderRadius: 10, cursor: 'pointer', fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}><IcTrash /> Удалить</button>
            : <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button onClick={() => setDelConfirm(false)} style={{ padding: '7px 12px', fontSize: 12, color: t.textSec, background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Отмена</button>
              <RedBtn sm onClick={async () => { await traderAPI.remove(trader.id); onRefresh(); onClose() }}>Удалить навсегда</RedBtn>
            </div>
          }
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 10 }}>История операций</div>
        {detail.transactions.length === 0
          ? <div style={{ padding: '20px 0', textAlign: 'center', color: t.textSec, fontSize: 14 }}>Операций нет</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
            {[...detail.transactions].reverse().map((tx: BalanceTx) => (
              <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', backgroundColor: t.inputBg, borderRadius: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: tx.type === 'credit' ? 'rgba(52,199,89,.15)' : 'rgba(255,59,48,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: tx.type === 'credit' ? '#34C759' : '#FF3B30' }}>{txIcon(tx.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{tx.note || (tx.type === 'credit' ? 'Пополнение' : 'Списание')}</div>
                  <div style={{ fontSize: 11, color: t.textSec }}>{tx.createdAt} · {tx.adminLogin}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tx.type === 'credit' ? '#34C759' : '#FF3B30', ...numStyle, flexShrink: 0 }}>
                  {tx.type === 'credit' ? '+' : '−'}{tx.amount.toFixed(4)} USDT
                </div>
              </div>
            ))}
          </div>
        }
      </Modal>

      {balModal && (
        <BalanceModal trader={detail} onClose={() => setBalModal(false)} onDone={() => { reload(); onRefresh() }} adminLogin={adminLogin} t={t} />
      )}
    </>
  )
}

function CreateTraderModal({ onClose, onCreated, t }: { onClose: () => void; onCreated: () => void; t: T }) {
  const [name, setName] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!name.trim() || !login.trim() || !password.trim()) { setErr('Заполните обязательные поля'); return }
    if (password.length < 6) { setErr('Пароль минимум 6 символов'); return }
    setLoading(true); setErr('')
    try {
      await traderAPI.create({ login: login.trim(), password, name: name.trim(), email: email.trim() })
      setDone(true)
      setTimeout(() => { onCreated(); onClose() }, 1200)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Создать трейдера" onClose={onClose} t={t}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(52,199,89,.2)', border: '2px solid #34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><IcCheck /></div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#34C759' }}>Трейдер создан</div>
        </div>
      ) : (
        <>
          <Field label="Имя *"><SInput placeholder="Иван Петров" value={name} onChange={setName} t={t} /></Field>
          <Field label="Логин *"><SInput placeholder="ivan2024" value={login} onChange={setLogin} t={t} /></Field>
          <Field label="Пароль *"><SInput placeholder="минимум 6 символов" value={password} onChange={setPassword} type="password" t={t} /></Field>
          <Field label="Email"><SInput placeholder="ivan@mail.ru" value={email} onChange={setEmail} t={t} /></Field>
          {err && <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,59,48,.1)', border: '1px solid rgba(255,59,48,.3)', borderRadius: 8, fontSize: 12, color: '#FF3B30', marginBottom: 8 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <GhostBtn t={t} onClick={onClose}>Отмена</GhostBtn>
            <BlueBtn onClick={submit}>{loading ? 'Создание...' : 'Создать'}</BlueBtn>
          </div>
        </>
      )}
    </Modal>
  )
}

function DepositRequestsPanel({ t, isMobile, adminLogin }: { t: T; isMobile?: boolean; adminLogin: string }) {
  const [requests, setRequests] = useState<DepositRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRequests(await depositAPI.list()) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const pending = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  const confirm = async (r: DepositRequest) => {
    setProcessing(r.id)
    try { await depositAPI.confirm(r.id, adminLogin); await load() } catch {} finally { setProcessing(null) }
  }
  const reject = async (r: DepositRequest) => {
    setProcessing(r.id)
    try { await depositAPI.reject(r.id); await load() } catch {} finally { setProcessing(null) }
  }

  const RequestCard = ({ r }: { r: DepositRequest }) => (
    <div style={{ backgroundColor: t.panel, borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderLeft: `3px solid ${r.status === 'pending' ? '#FF9500' : r.status === 'confirmed' ? '#34C759' : '#FF3B30'}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{r.traderName}</span>
          <span style={{ fontSize: 12, color: t.textSec }}>@{r.traderLogin}</span>
          <Pill color={r.status === 'pending' ? 'orange' : r.status === 'confirmed' ? 'green' : 'red'}>
            {r.status === 'pending' ? 'Ожидает' : r.status === 'confirmed' ? 'Подтверждено' : 'Отклонено'}
          </Pill>
        </div>
        <div style={{ fontSize: 12, color: t.textSec }}>{r.createdAt}{r.resolvedAt ? ` → ${r.resolvedAt}` : ''}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#26A17B', ...numStyle, flexShrink: 0 }}>{r.amount.toFixed(4)} USDT</div>
      {r.status === 'pending' && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <GreenBtn sm onClick={() => confirm(r)} disabled={processing === r.id}>{processing === r.id ? '...' : 'Подтвердить'}</GreenBtn>
          <RedBtn sm onClick={() => reject(r)} disabled={processing === r.id}>Отклонить</RedBtn>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 700, color: t.text }}>
          Заявки на пополнение
          {pending.length > 0 && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, backgroundColor: '#FF9500', color: '#fff', borderRadius: 10, padding: '2px 8px' }}>{pending.length}</span>}
        </div>
        <button onClick={load} style={{ fontSize: 12, color: t.textSec, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}>Обновить</button>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: t.textSec, fontSize: 14 }}>Загрузка...</div>
      ) : requests.length === 0 ? (
        <div style={{ backgroundColor: t.panel, borderRadius: 12, padding: '28px 0', textAlign: 'center', color: t.textSec, fontSize: 14 }}>Заявок нет</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending.map(r => <RequestCard key={r.id} r={r} />)}
          {resolved.length > 0 && pending.length > 0 && <div style={{ height: 1, backgroundColor: t.border, margin: '4px 0' }} />}
          {[...resolved].reverse().slice(0, 10).map(r => <RequestCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  )
}

export default function TradersPage({ t, isMobile, adminLogin }: { t: T; isMobile?: boolean; adminLogin: string }) {
  const [traders, setTraders] = useState<TraderDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [search, setSearch] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [detailTrader, setDetailTrader] = useState<TraderDetail | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try { setTraders(await traderAPI.list()) }
    catch (e: any) { setErr(e.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = traders.filter(tr =>
    tr.name.toLowerCase().includes(search.toLowerCase()) ||
    tr.login.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: t.text }}>
          Трейдеры {!loading && <span style={{ fontSize: 13, fontWeight: 400, color: t.textSec }}>({traders.length})</span>}
        </div>
        <BlueBtn sm onClick={() => setCreateModal(true)}><IcPlus /> Создать трейдера</BlueBtn>
      </div>

      <div style={{ marginBottom: 14 }}>
        <SInput placeholder="Поиск по имени или логину..." value={search} onChange={setSearch} t={t} />
      </div>

      {err && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(255,59,48,.1)', border: '1px solid rgba(255,59,48,.3)', borderRadius: 12, fontSize: 13, color: '#FF3B30', marginBottom: 14 }}>
          Ошибка: {err}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: t.textSec, fontSize: 14 }}>Загрузка трейдеров...</div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: t.panel, borderRadius: 12, padding: '40px 0', textAlign: 'center', color: t.textSec, fontSize: 14 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
          {traders.length === 0 ? 'Нет зарегистрированных трейдеров' : 'Никого не найдено'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(tr => (
            <div key={tr.id} style={{ backgroundColor: t.panel, borderRadius: 12, padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: tr.status === 'blocked' ? 0.6 : 1 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(124,58,237,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#A78BFA', flexShrink: 0 }}>
                {tr.name.slice(0, 1).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{tr.name}</div>
                  <Pill color={tr.status === 'active' ? 'green' : 'red'}>{tr.status === 'active' ? 'Активен' : 'Заблок.'}</Pill>
                </div>
                <div style={{ fontSize: 12, color: t.textSec }}>@{tr.login} · с {tr.createdAt.slice(0, 10)}</div>
              </div>

              {!isMobile && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#26A17B', ...numStyle }}>{tr.balance.usdt.toFixed(4)} USDT</div>
                  <div style={{ fontSize: 11, color: t.textSec }}>Страховой: {tr.balance.insurance.toFixed(2)}</div>
                </div>
              )}

              {isMobile && (
                <div style={{ fontSize: 14, fontWeight: 700, color: '#26A17B', ...numStyle, flexShrink: 0 }}>{tr.balance.usdt.toFixed(2)} USDT</div>
              )}

              <button onClick={() => setDetailTrader(tr)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 9, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, color: t.text, fontSize: 12, cursor: 'pointer', fontFamily: 'Inter,sans-serif', flexShrink: 0 }}>
                <IcEdit />{!isMobile && ' Управление'}
              </button>
            </div>
          ))}
        </div>
      )}

      <DepositRequestsPanel t={t} isMobile={isMobile} adminLogin={adminLogin} />

      {createModal && <CreateTraderModal onClose={() => setCreateModal(false)} onCreated={load} t={t} />}
      {detailTrader && <TraderDetailModal trader={detailTrader} onClose={() => setDetailTrader(null)} onRefresh={load} adminLogin={adminLogin} t={t} />}
    </div>
  )
}
