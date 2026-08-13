import { useState, useEffect, useRef } from 'react'
import { useLS, useMobile, themes, Theme, Page, AuthUser, Requisite, ArchivedRequisite, Employee, Deal, PayoutOffer, AcceptedPayout, TxHistory, TraderBalance, uid, fmtDate, rand, createPendingDeal, genPayoutOffer, reqActiveTotal, reqDailyTotal, reqMonthlyTotal, RATE, traderAPI, T } from './store'
import { MpLogo, IcHome, IcDeals, IcVyplaty, IcDisputes, IcStats, IcReqs, IcStaff, IcSettings, IcSun, IcMoon, IcLogout, IcMenu2 } from './icons'
import { PillToggle } from './ui'
import { WithdrawModal, HistoryModal, RequisiteModal, EmployeeModal } from './modals'
import LoginPage from './pages/Login'
import MainPage from './pages/Main'
import DealsPage from './pages/Deals'
import VyplatyPage from './pages/Vyplaty'
import { DisputesPage, StatsPage } from './pages/Other'
import RequisitesPage from './pages/Requisites'
import StaffPage from './pages/Staff'
import SettingsPage from './pages/Settings'
import TradersPage from './pages/Traders'

import './store'

const IcTraders = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

function Topbar({ theme, toggleTheme, priom, setPriom, vyplaty, setVyplaty, onLogout, t, isMobile, onMenuOpen, authUser }: { theme: Theme; toggleTheme: () => void; priom: boolean; setPriom: (v: boolean) => void; vyplaty: boolean; setVyplaty: (v: boolean) => void; onLogout: () => void; t: T; isMobile: boolean; onMenuOpen?: () => void; authUser: AuthUser }) {
  return (
    <div style={{ backgroundColor: t.sidebar, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 12px' : '0 20px', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, flexWrap: isMobile ? 'wrap' : 'nowrap', height: isMobile ? 'auto' : '48px', minHeight: '48px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 48 }}>
        {isMobile && (
          <button onClick={onMenuOpen} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, cursor: 'pointer', color: t.text, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><IcMenu2 /></button>
        )}
        <MpLogo size={28} />
        <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: t.text, letterSpacing: '.05em' }}>MATRIX PAYMENT</span>
        {!isMobile && (
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, backgroundColor: authUser.role === 'admin' ? 'rgba(124,58,237,.2)' : 'rgba(52,199,89,.15)', color: authUser.role === 'admin' ? '#A78BFA' : '#34C759', fontWeight: 600 }}>
            {authUser.role === 'admin' ? 'Администратор' : authUser.traderName || authUser.login}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 48 }}>
        <button onClick={toggleTheme} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.inputBg, cursor: 'pointer', color: t.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <IcSun /> : <IcMoon />}
        </button>
        {!isMobile && <PillToggle on={priom} onChange={setPriom} label="Приём" />}
        {!isMobile && <PillToggle on={vyplaty} onChange={setVyplaty} label="Выплаты" />}
        <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${t.border}`, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', color: t.textSec, fontSize: 12, fontFamily: 'Inter,sans-serif', height: 30 }}>
          <IcLogout />{!isMobile && ' Выйти'}
        </button>
      </div>
      {isMobile && (
        <div style={{ display: 'flex', gap: 8, width: '100%', paddingBottom: 8 }}>
          <PillToggle on={priom} onChange={setPriom} label="Приём" />
          <PillToggle on={vyplaty} onChange={setVyplaty} label="Выплаты" />
        </div>
      )}
    </div>
  )
}

const ALL_NAV: { key: Page; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
  { key: 'main',       label: 'Главная',    icon: <IcHome /> },
  { key: 'deals',      label: 'Сделки',     icon: <IcDeals /> },
  { key: 'vyplaty',    label: 'Выплаты',    icon: <IcVyplaty /> },
  { key: 'disputes',   label: 'Споры',      icon: <IcDisputes /> },
  { key: 'stats',      label: 'Статистика', icon: <IcStats /> },
  { key: 'requisites', label: 'Реквизиты',  icon: <IcReqs /> },
  { key: 'traders',    label: 'Трейдеры',   icon: <IcTraders />, adminOnly: true },
  { key: 'staff',      label: 'Сотрудники', icon: <IcStaff />, adminOnly: true },
  { key: 'settings',   label: 'Настройки',  icon: <IcSettings /> },
]

function Sidebar({ page, setPage, t, isAdmin }: { page: Page; setPage: (p: Page) => void; t: T; isAdmin: boolean }) {
  const items = ALL_NAV.filter(i => !i.adminOnly || isAdmin)
  return (
    <div style={{ width: 220, minHeight: '100vh', backgroundColor: t.sidebar, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', position: 'fixed', top: 48, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }}>
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {items.map(item => {
          const active = page === item.key
          return (
            <button key={item.key} onClick={() => setPage(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', backgroundColor: active ? t.activeNav : 'transparent', border: 'none', borderRadius: 10, color: active ? t.text : t.textSec, fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter,sans-serif', marginBottom: 2 }}
              onMouseEnter={e => { if (!active)(e.currentTarget as HTMLButtonElement).style.backgroundColor = t.activeNav }}
              onMouseLeave={e => { if (!active)(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}>
              {item.icon} {item.label}
              {item.adminOnly && <span style={{ marginLeft: 'auto', fontSize: 9, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(124,58,237,.2)', color: '#A78BFA', fontWeight: 700 }}>ADM</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function BottomNav({ page, setPage, t, onMenuOpen }: { page: Page; setPage: (p: Page) => void; t: T; onMenuOpen: () => void }) {
  const main5 = ALL_NAV.filter(i => !i.adminOnly).slice(0, 5)
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, backgroundColor: t.sidebar, borderTop: `1px solid ${t.border}`, display: 'flex', zIndex: 100 }}>
      {main5.map(item => {
        const active = page === item.key
        return (
          <button key={item.key} onClick={() => setPage(item.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: active ? '#7C3AED' : t.textSec, fontFamily: 'Inter,sans-serif', padding: 0 }}>
            <div style={{ transform: 'scale(1.1)' }}>{item.icon}</div>
            <span style={{ fontSize: 9, fontWeight: active ? 600 : 400 }}>{item.label}</span>
          </button>
        )
      })}
      <button onClick={onMenuOpen} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, background: 'none', border: 'none', cursor: 'pointer', color: t.textSec, fontFamily: 'Inter,sans-serif', padding: 0 }}>
        <IcMenu2 /><span style={{ fontSize: 9 }}>Ещё</span>
      </button>
    </div>
  )
}

function DrawerNav({ page, setPage, t, onClose, onLogout, priom, setPriom, vyplaty, setVyplaty, isAdmin, authUser }: { page: Page; setPage: (p: Page) => void; t: T; onClose: () => void; onLogout: () => void; priom: boolean; setPriom: (v: boolean) => void; vyplaty: boolean; setVyplaty: (v: boolean) => void; isAdmin: boolean; authUser: AuthUser }) {
  const items = ALL_NAV.filter(i => !i.adminOnly || isAdmin)
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 270, backgroundColor: t.sidebar, zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.4)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px', borderBottom: `1px solid ${t.border}` }}>
          <MpLogo size={30} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, letterSpacing: '.05em' }}>MATRIX PAYMENT</div>
            <div style={{ fontSize: 11, color: authUser.role === 'admin' ? '#A78BFA' : '#34C759', fontWeight: 600 }}>
              {authUser.role === 'admin' ? `Администратор · ${authUser.login}` : authUser.traderName || authUser.login}
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, padding: '4px 8px 12px' }}>
            <PillToggle on={priom} onChange={v => { setPriom(v) }} label="Приём" />
            <PillToggle on={vyplaty} onChange={v => { setVyplaty(v) }} label="Выплаты" />
          </div>
          {items.map(item => {
            const active = page === item.key
            return (
              <button key={item.key} onClick={() => { setPage(item.key); onClose() }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '11px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter,sans-serif', fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#fff' : t.textSec, backgroundColor: active ? 'rgba(124,58,237,0.25)' : 'transparent' }}>
                <span style={{ color: active ? '#A78BFA' : t.textSec, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                {item.label}
                {item.adminOnly && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, backgroundColor: 'rgba(124,58,237,.2)', color: '#A78BFA', fontWeight: 700 }}>ADM</span>}
                {active && <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#7C3AED', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
          <button onClick={() => { onLogout(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent', cursor: 'pointer', color: t.textSec, fontSize: 14, fontFamily: 'Inter,sans-serif' }}>
            <IcLogout /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </>
  )
}

export default function App() {
  const isMobile = useMobile()
  const [authUser, setAuthUser] = useLS<AuthUser | null>('authUser', null)
  const [page, setPage] = useLS<Page>('page', 'main')
  const [theme, setTheme] = useLS<Theme>('theme', 'dark')
  const [priom, setPriom] = useLS('priom', true)
  const [vyplatyOn, setVyplatyOn] = useLS('vyplatyToggle', false)
  const [requisites, setRequisites] = useLS<Requisite[]>('requisites', [])
  const [archivedRequisites, setArchivedRequisites] = useLS<ArchivedRequisite[]>('archivedRequisites', [])
  const [employees, setEmployees] = useLS<Employee[]>('employees', [{ id: 'default', name: 'Джони', email: 'gid202026@gmail.com', password: '' }])
  const [deals, setDeals] = useLS<Deal[]>('deals', [])
  const [payoutOffers, setPayoutOffers] = useLS<PayoutOffer[]>('payoutOffers', [])
  const [acceptedPayouts, setAcceptedPayouts] = useLS<AcceptedPayout[]>('acceptedPayouts', [])
  const [txHistory, setTxHistory] = useLS<TxHistory[]>('txHistory', [])
  const [lastPayoutAccepted, setLastPayoutAccepted] = useLS<number>('lastPayoutAccepted', 0)

  const [traderBal, setTraderBal] = useState<TraderBalance | null>(null)
  const traderBalRef = useRef<TraderBalance | null>(null)
  traderBalRef.current = traderBal

  const [dealQueue, setDealQueue] = useState<Deal[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modal, setModal] = useState<null | 'withdraw' | 'history' | { type: 'req-create' } | { type: 'req-edit'; req: Requisite } | { type: 'emp-create' } | { type: 'emp-edit'; emp: Employee }>(null)

  const t = themes[theme]
  const isAdmin = authUser?.role === 'admin'

  // Fetch trader balance for balance-gated logic (deals, payouts)
  useEffect(() => {
    if (authUser?.role !== 'trader' || !authUser.traderId) return
    const doFetch = () => traderAPI.balance(authUser.traderId!).then(d => setTraderBal(d.balance)).catch(() => {})
    doFetch()
    // Poll every 10s so balance updates from admin are reflected quickly
    const iv = setInterval(doFetch, 10000)
    return () => clearInterval(iv)
  }, [authUser])

  const reqsRef = useRef(requisites)
  reqsRef.current = requisites
  const priomRef = useRef(priom)
  priomRef.current = priom
  const authUserRef = useRef(authUser)
  authUserRef.current = authUser

  useEffect(() => {
    if (!dealQueue.length) return
    const deal = dealQueue[0]
    setDeals(prev => {
      const req = reqsRef.current.find(r => r.id === deal.requisiteId)
      if (!req || req.status === 'paused') return prev
      const total = reqActiveTotal(prev, deal.requisiteId)
      const daily = reqDailyTotal(prev, deal.requisiteId)
      const monthly = reqMonthlyTotal(prev, deal.requisiteId)
      if (total + deal.amount > req.limitAmount) return prev
      if (daily + deal.amount > req.dailyLimit) return prev
      if (monthly + deal.amount > req.monthlyLimit) return prev
      // For traders: block deal if available balance (total minus locked in pending) is insufficient
      if (authUserRef.current?.role === 'trader') {
        const bal = traderBalRef.current
        if (bal !== null) {
          const lockedUsdt = prev
            .filter(d => d.status === 'pending')
            .reduce((s, d) => s + d.amountUsdt, 0)
          if (bal.usdt - lockedUsdt < deal.amountUsdt) return prev
        }
      }
      return [...prev, deal]
    })
    setDealQueue(prev => prev.slice(1))
  }, [dealQueue, setDeals])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      timer = setTimeout(() => {
        if (priomRef.current) {
          const active = reqsRef.current.filter(r => r.status === 'active')
          if (active.length) {
            const req = active[rand(0, active.length - 1)]
            setDealQueue(prev => [...prev, createPendingDeal(req)])
          }
        }
        schedule()
      }, rand(5000, 20000))
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now()
      setDeals(prev => {
        let changed = false
        const updated = prev.map(d => {
          if (d.status !== 'pending' || now < d.expiresAt) return d
          changed = true
          return { ...d, status: 'cancelled' as const }
        })
        return changed ? updated : prev
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [setDeals])

  useEffect(() => {
    const generate = () => {
      if (Date.now() - lastPayoutAccepted < 30 * 60000) return
      const fresh = Array.from({ length: rand(3, 6) }, genPayoutOffer)
      setPayoutOffers(prev => [...prev.filter(o => new Date(o.createdAt).getTime() > Date.now() - 2 * 3600000), ...fresh])
      localStorage.setItem('lastPayoutGen', String(Date.now()))
    }
    const lastGen = parseInt(localStorage.getItem('lastPayoutGen') || '0')
    if (Date.now() - lastGen > 30 * 60000 || payoutOffers.length === 0) generate()
    const interval = setInterval(generate, 30 * 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastPayoutAccepted])

  const addRequisite = (req: Requisite) => { setRequisites(prev => [...prev, req]); setModal(null) }
  const editRequisite = (req: Requisite) => { setRequisites(prev => prev.map(r => r.id === req.id ? req : r)); setModal(null) }
  const archiveRequisite = (id: string) => {
    const req = requisites.find(r => r.id === id)
    if (req) setArchivedRequisites(prev => [...prev, { ...req, deletedAt: fmtDate(new Date()) }])
    setRequisites(prev => prev.filter(r => r.id !== id))
    setModal(null)
  }
  const deleteArchivedRequisite = (id: string) => setArchivedRequisites(prev => prev.filter(r => r.id !== id))
  const toggleRequisite = (req: Requisite) => setRequisites(prev => prev.map(r => r.id === req.id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r))
  const confirmDeal = (id: string) => setDeals(prev => prev.map(d => d.id !== id ? d : { ...d, status: 'completed' as const }))

  const acceptPayout = (id: string) => {
    const offer = payoutOffers.find(o => o.id === id)
    if (!offer || !vyplatyOn) return
    const activeCount = acceptedPayouts.filter(a => !a.paidAt).length
    if (activeCount >= 3) return
    const now = Date.now()
    setPayoutOffers(prev => prev.filter(o => o.id !== id))
    setLastPayoutAccepted(now)
    setAcceptedPayouts(prev => [...prev, { id: uid(), method: offer.method === 'sbp' ? 'СБП' : 'Карта', bank: offer.bank, fio: offer.fio, account: offer.account, amount: offer.amount, acceptedAt: now, expiresAt: now + 3 * 3600000 }])
  }

  const addReceipt = (payoutId: string, name: string, type: 'pdf' | 'video') =>
    setAcceptedPayouts(prev => prev.map(a => a.id === payoutId ? { ...a, receipts: [...(a.receipts || []), { name, type }] } : a))
  const removeReceipt = (payoutId: string, idx: number) =>
    setAcceptedPayouts(prev => prev.map(a => a.id === payoutId ? { ...a, receipts: (a.receipts || []).filter((_, i) => i !== idx) } : a))
  const markPaid = (payoutId: string) =>
    setAcceptedPayouts(prev => prev.map(a => a.id === payoutId ? { ...a, paidAt: Date.now() } : a))

  const addEmployee = (emp: Employee) => { setEmployees(prev => [...prev, emp]); setModal(null) }
  const editEmployee = (emp: Employee) => { setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e)); setModal(null) }
  const deleteEmployee = (id: string) => { setEmployees(prev => prev.filter(e => e.id !== id)); setModal(null) }
  const onWithdrawConfirm = (addr: string, amt: number) => setTxHistory(prev => [...prev, { id: uid(), type: 'withdraw', amount: amt, address: addr, status: 'completed', createdAt: fmtDate(new Date()) }])

  const topbarH = isMobile ? 80 : 48

  if (!authUser) return <LoginPage onAuth={user => setAuthUser(user)} theme={theme} toggleTheme={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} t={t} />

  const safePage: Page = (!isAdmin && (page === 'traders' || page === 'staff')) ? 'main' : page

  const pages: Record<Page, React.ReactNode> = {
    main:       <MainPage t={t} onWithdraw={() => setModal('withdraw')} onHistory={() => setModal('history')} isMobile={isMobile} authUser={authUser} traderBal={traderBal} deals={deals} />,
    deals:      <DealsPage deals={deals} onConfirm={confirmDeal} t={t} isMobile={isMobile} traderBal={authUser?.role === 'trader' ? traderBal : null} />,
    vyplaty:    <VyplatyPage offers={payoutOffers} accepted={acceptedPayouts} onAccept={acceptPayout} addReceipt={addReceipt} removeReceipt={removeReceipt} markPaid={markPaid} vyplatyOn={vyplatyOn} t={t} isMobile={isMobile} traderBal={authUser?.role === 'trader' ? traderBal : null} />,
    disputes:   <DisputesPage t={t} isMobile={isMobile} />,
    stats:      <StatsPage deals={deals} t={t} isMobile={isMobile} />,
    requisites: <RequisitesPage requisites={requisites} archivedRequisites={archivedRequisites} deals={deals} onAdd={() => setModal({ type: 'req-create' })} onEdit={r => setModal({ type: 'req-edit', req: r })} onToggle={toggleRequisite} onDeleteArchived={deleteArchivedRequisite} t={t} isMobile={isMobile} />,
    traders:    <TradersPage t={t} isMobile={isMobile} adminLogin={authUser.login} />,
    staff:      <StaffPage employees={employees} onAdd={() => setModal({ type: 'emp-create' })} onEdit={e => setModal({ type: 'emp-edit', emp: e })} t={t} isMobile={isMobile} />,
    settings:   <SettingsPage t={t} isMobile={isMobile} />,
  }

  return (
    <div style={{ backgroundColor: t.bg, minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
      <Topbar theme={theme} toggleTheme={() => setTheme(th => th === 'dark' ? 'light' : 'dark')} priom={priom} setPriom={setPriom} vyplaty={vyplatyOn} setVyplaty={setVyplatyOn} onLogout={() => setAuthUser(null)} t={t} isMobile={isMobile} onMenuOpen={() => setDrawerOpen(true)} authUser={authUser} />
      {!isMobile && <Sidebar page={safePage} setPage={setPage} t={t} isAdmin={!!isAdmin} />}
      <main style={{ marginLeft: isMobile ? 0 : 220, paddingTop: topbarH, paddingBottom: isMobile ? 64 : 0 }}>
        <div style={{ padding: isMobile ? 14 : 24 }}>{pages[safePage]}</div>
      </main>
      {isMobile && <BottomNav page={safePage} setPage={setPage} t={t} onMenuOpen={() => setDrawerOpen(true)} />}
      {isMobile && drawerOpen && <DrawerNav page={safePage} setPage={setPage} t={t} onClose={() => setDrawerOpen(false)} onLogout={() => setAuthUser(null)} priom={priom} setPriom={setPriom} vyplaty={vyplatyOn} setVyplaty={setVyplatyOn} isAdmin={!!isAdmin} authUser={authUser} />}

      {modal === 'withdraw' && <WithdrawModal onClose={() => setModal(null)} onConfirm={onWithdrawConfirm} t={t} />}
      {modal === 'history' && <HistoryModal history={txHistory} onClose={() => setModal(null)} t={t} />}
      {modal && typeof modal === 'object' && modal.type === 'req-create' && <RequisiteModal onSave={addRequisite} onClose={() => setModal(null)} t={t} />}
      {modal && typeof modal === 'object' && modal.type === 'req-edit' && <RequisiteModal initial={modal.req} onSave={editRequisite} onDelete={() => archiveRequisite(modal.req.id)} onClose={() => setModal(null)} t={t} />}
      {modal && typeof modal === 'object' && modal.type === 'emp-create' && <EmployeeModal onSave={addEmployee} onClose={() => setModal(null)} t={t} />}
      {modal && typeof modal === 'object' && modal.type === 'emp-edit' && <EmployeeModal initial={modal.emp} onSave={editEmployee} onDelete={() => deleteEmployee(modal.emp.id)} onClose={() => setModal(null)} t={t} />}
    </div>
  )
}
