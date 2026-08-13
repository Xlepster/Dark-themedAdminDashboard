import { useState, useCallback, useEffect } from 'react'

// ─── Schema guard ─────────────────────────────────────────────────────────────
export const SCHEMA_V = 'v9'
if (typeof localStorage !== 'undefined' && localStorage.getItem('_sv') !== SCHEMA_V) {
  ;['requisites','archivedRequisites','employees','deals','payoutOffers','acceptedPayouts',
    'txHistory','priom','vyplatyToggle','notifs','twofa','tgUser','timezone','language',
    'lastPayoutGen','lastPayoutAccepted','page','auth','authUser'
  ].forEach(k => { try { localStorage.removeItem(k) } catch {} })
  try { localStorage.setItem('_sv', SCHEMA_V) } catch {}
}

// ─── Hardcoded credentials — change here in source code to update logins ──────
export const VALID_CREDENTIALS = [
  { login: 'admin',    password: 'Matrix2024!' },
  { login: 'trader',   password: 'Trade@2024'  },
  { login: 'operator', password: 'Oper@2025'   },
]

// ─── Types ────────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'
export type Page = 'main' | 'deals' | 'vyplaty' | 'disputes' | 'stats' | 'requisites' | 'staff' | 'settings' | 'traders'

// ─── Auth user ────────────────────────────────────────────────────────────────
export interface AuthUser {
  role: 'admin' | 'trader'
  login: string
  traderId?: string
  traderName?: string
}

// ─── Trader (Supabase) ────────────────────────────────────────────────────────
export interface Trader {
  id: string; login: string; name: string; email: string
  createdAt: string; status: 'active' | 'blocked'
}
export interface TraderBalance { usdt: number; insurance: number; locked: number }
export interface BalanceTx {
  id: string; traderId: string; type: 'credit' | 'debit'
  amount: number; note: string; adminLogin: string; createdAt: string
}
export interface TraderDetail extends Trader {
  balance: TraderBalance; transactions: BalanceTx[]; lastActivity?: string
}
export interface DepositRequest {
  id: string; traderId: string; traderName: string; traderLogin: string
  amount: number; status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string; resolvedAt?: string
}

export interface Requisite {
  id: string; method: 'sbp' | 'card' | 'mobile'; bank: string; operator: string
  fio: string; account: string; minAmount: number; maxAmount: number
  limitAmount: number; dailyLimit: number; monthlyLimit: number
  status: 'active' | 'paused'; createdAt: string
}
export type ArchivedRequisite = Requisite & { deletedAt: string }
export interface Employee { id: string; name: string; email: string; password: string }
export interface Deal {
  id: string; requisiteId: string; amount: number; amountUsdt: number
  method: string; bank: string; fio: string; account: string
  status: 'pending' | 'completed' | 'cancelled'; expiresAt: number
  createdAt: string; rate: number
}
export interface PayoutOffer {
  id: string; method: 'sbp' | 'card'; bank: string; fio: string
  account: string; amount: number; createdAt: string
}
export interface AcceptedPayout {
  id: string; method: string; bank: string; fio: string; account: string
  amount: number; acceptedAt: number; expiresAt: number
  receipts?: { name: string; type: 'pdf' | 'video' }[]
  paidAt?: number
}
export interface TxHistory {
  id: string; type: 'deposit' | 'withdraw'; amount: number
  address: string; status: 'completed' | 'pending'; createdAt: string
}

// ─── localStorage hook ────────────────────────────────────────────────────────
export function useLS<T>(key: string, init: T) {
  const [val, setVal] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init } catch { return init }
  })
  const set = useCallback((v: T | ((p: T) => T)) => {
    setVal(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
      return next
    })
  }, [key])
  return [val, set] as const
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const WALLET = 'TWc8y9S1ymnaHfY6UtzjZGf9Qubpf2zdPh'
export const RATE = 88.50
export const BANKS = [
  'Сбербанк','ВТБ','Газпромбанк','Альфа-Банк','Россельхозбанк','Открытие','Совкомбанк',
  'Т-Банк (Тинькофф)','Почта Банк','Росбанк','Промсвязьбанк','Уралсиб','МТС Банк',
  'Ак Барс','Банк Санкт-Петербург','РНКБ','СКБ-Банк','Банк Зенит','Транскапиталбанк',
  'Русский Стандарт','Хоум Банк','ОТП Банк','Банк Синара','Экспобанк','ДОМ.РФ',
]
export const OPERATORS = ['МТС','Билайн','МегаФон','Теле2','Yota','СберМобайл','Тинькофф Мобайл','Ростелеком']
export const NAMES = ['Иванов И.И.','Петров С.А.','Сидорова А.В.','Козлов М.Р.','Новиков Д.А.',
  'Морозов Е.В.','Попова Т.С.','Соколов В.Н.','Лебедева К.О.','Волков А.П.',
  'Захаров Р.М.','Кузнецов С.Е.','Смирнова Ю.В.','Орлов Д.И.','Фёдорова Л.Н.']

export const PRIOM_RATE_DATA = [
  { label: 'SIM',       v: [82.29, 87.23] },
  { label: 'BTV_S_SBP', v: [88.87, 90.52] },
  { label: 'BTV_C_SBP', v: [88.05, 87.23] },
  { label: 'SIM0',      v: [82.29, 82.29] },
  { label: 'SBP 1-3k',  v: [88.46, 89.70] },
  { label: 'BTV_A',     v: [88.05, 90.52] },
  { label: 'BTVx_SBP',  v: [90.52, 90.52] },
]
export const ratesIn  = PRIOM_RATE_DATA.map(r => `${r.label}: ${r.v.join('/')} RUB`)
export const ratesOut = PRIOM_RATE_DATA.map(r => `${r.label}: ${r.v.map(v => (v * 0.93).toFixed(2)).join('/')} RUB`)

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function uid() { return Math.random().toString(36).slice(2, 11) }
export function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
export function fmtDate(d: Date) { return d.toISOString().slice(0, 19).replace('T', ' ') }
export function fmtNum(n: number) { return n.toLocaleString('ru-RU') }
export function genPhone() { return `+7(${rand(900,999)})${rand(100,999)}-${rand(10,99)}-${rand(10,99)}` }
export function genCard()  { return `${rand(4000,4999)} ${rand(1000,9999)} ${rand(1000,9999)} ${rand(1000,9999)}` }

export function fmtTimer(ms: number, hours = false) {
  if (ms <= 0) return hours ? '00:00:00' : '00:00'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (hours) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
  return `${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

export function createPendingDeal(req: Requisite): Deal {
  const amount = rand(req.minAmount, req.maxAmount)
  return {
    id: String(rand(10000000, 99999999)), requisiteId: req.id, amount,
    amountUsdt: parseFloat((amount / RATE).toFixed(8)),
    method: req.method === 'sbp' ? 'СБП' : req.method === 'card' ? 'Карта' : 'Моб. ком.',
    bank: req.bank || req.operator, fio: req.fio, account: req.account,
    status: 'pending', expiresAt: Date.now() + 10 * 60 * 1000,
    createdAt: fmtDate(new Date()), rate: RATE,
  }
}
export function genPayoutOffer(): PayoutOffer {
  const method = Math.random() > 0.5 ? 'sbp' : 'card'
  return {
    id: uid(), method, bank: BANKS[rand(0, BANKS.length - 1)],
    fio: NAMES[rand(0, NAMES.length - 1)],
    account: method === 'card' ? genCard() : genPhone(),
    amount: rand(5, 100) * 1000,
    createdAt: fmtDate(new Date()),
  }
}
// Counts completed deals for requisite progress bar display
export function reqTotal(deals: Deal[], reqId: string) {
  return deals.filter(d => d.requisiteId === reqId && d.status === 'completed').reduce((s, d) => s + d.amount, 0)
}

// Counts pending + completed (non-cancelled) for limit enforcement
export function reqActiveTotal(deals: Deal[], reqId: string) {
  return deals.filter(d => d.requisiteId === reqId && d.status !== 'cancelled').reduce((s, d) => s + d.amount, 0)
}

// Daily total for limit enforcement (today's non-cancelled deals)
export function reqDailyTotal(deals: Deal[], reqId: string) {
  const today = new Date().toISOString().slice(0, 10)
  return deals.filter(d => d.requisiteId === reqId && d.status !== 'cancelled' && d.createdAt.startsWith(today)).reduce((s, d) => s + d.amount, 0)
}

// Monthly total for limit enforcement (this month's non-cancelled deals)
export function reqMonthlyTotal(deals: Deal[], reqId: string) {
  const month = new Date().toISOString().slice(0, 7)
  return deals.filter(d => d.requisiteId === reqId && d.status !== 'cancelled' && d.createdAt.startsWith(month)).reduce((s, d) => s + d.amount, 0)
}

// ─── Theme ────────────────────────────────────────────────────────────────────
export const themes = {
  dark:  { bg:'#131313', sidebar:'#1a1a1a', panel:'#1e1e1e', border:'rgba(255,255,255,0.07)',
           text:'#ffffff', textSec:'#8e8e93', textMut:'#48484a', inputBg:'#2c2c2e', activeNav:'rgba(255,255,255,0.1)' },
  light: { bg:'#f2f2f7', sidebar:'#ffffff',  panel:'#ffffff',  border:'rgba(0,0,0,0.08)',
           text:'#000000', textSec:'#6e6e73', textMut:'#aeaeb2', inputBg:'#f2f2f7', activeNav:'rgba(0,0,0,0.07)' },
}
export type T = typeof themes.dark
export const numStyle = { fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"tnum"' }

// ─── Supabase API client ──────────────────────────────────────────────────────
const API = 'https://wjrhiitoxxstelfksyeb.supabase.co/functions/v1/make-server-baa0c261'
const ADMIN_SECRET = 'matrix-admin-secret-2024'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcmhpaXRveHhzdGVsZmtzeWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTEyNjQsImV4cCI6MjEwMjEyNzI2NH0.9gyXOghDPs--t0GMY0WJg5rin3x-ZuOlA4yRMe--BDo'

async function apiFetch(path: string, method = 'GET', body?: unknown, asAdmin = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
  }
  if (asAdmin) headers['X-Admin-Secret'] = ADMIN_SECRET
  const res = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера')
  return data
}

export const traderAPI = {
  login:  (login: string, password: string)                                      => apiFetch('/traders/login', 'POST', { login, password }),
  list:   ()                                                                      => apiFetch('/traders', 'GET', undefined, true),
  create: (d: { login: string; password: string; name: string; email?: string }) => apiFetch('/traders', 'POST', d, true),
  get:    (id: string)                                                            => apiFetch(`/traders/${id}`, 'GET', undefined, true),
  setStatus: (id: string, status: string)                                         => apiFetch(`/traders/${id}`, 'PUT', { status }, true),
  remove: (id: string)                                                            => apiFetch(`/traders/${id}`, 'DELETE', undefined, true),
  credit: (id: string, amount: number, note: string, adminLogin: string)         => apiFetch(`/traders/${id}/credit`, 'POST', { amount, note, adminLogin }, true),
  debit:  (id: string, amount: number, note: string, adminLogin: string)         => apiFetch(`/traders/${id}/debit`,  'POST', { amount, note, adminLogin }, true),
  balance:      (id: string)                                                            => apiFetch(`/traders/${id}/balance`),
  setInsurance: (id: string, insurance: number)                                         => apiFetch(`/traders/${id}/set-insurance`, 'POST', { insurance }, true),
  depositRequest: (id: string, amount: number, traderName: string, traderLogin: string) => apiFetch(`/traders/${id}/deposit-request`, 'POST', { amount, traderName, traderLogin }),
}

export const depositAPI = {
  list:    ()                                           => apiFetch('/deposit-requests', 'GET', undefined, true),
  confirm: (reqId: string, adminLogin: string)          => apiFetch(`/deposit-requests/${reqId}/confirm`, 'PUT', { adminLogin }, true),
  reject:  (reqId: string)                              => apiFetch(`/deposit-requests/${reqId}/reject`, 'PUT', {}, true),
}

// ─── Mobile breakpoint hook ───────────────────────────────────────────────────
export function useMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return mobile
}
