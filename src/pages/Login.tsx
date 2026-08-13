import { useState } from 'react'
import { T, Theme, VALID_CREDENTIALS, AuthUser, traderAPI } from '../store'
import { IcSun, IcMoon, MpLogo } from '../icons'
import { SInput, Field } from '../ui'

export default function LoginPage({ onAuth, theme, toggleTheme, t }: { onAuth: (user: AuthUser) => void; theme: Theme; toggleTheme: () => void; t: T }) {
  const [login, setLogin] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!login.trim() || !pass.trim()) { setErr('Введите логин и пароль'); return }
    setErr(''); setLoading(true)

    // 1. Check hardcoded admin credentials first
    const admin = VALID_CREDENTIALS.find(c => c.login === login && c.password === pass)
    if (admin) {
      setLoading(false)
      onAuth({ role: 'admin', login })
      return
    }

    // 2. Try Supabase trader login
    try {
      const trader = await traderAPI.login(login, pass)
      onAuth({ role: 'trader', login, traderId: trader.id, traderName: trader.name })
    } catch (e: any) {
      setErr(e.message || 'Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') submit() }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'fixed', top: 16, right: 16 }}>
        <button onClick={toggleTheme} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.border}`, backgroundColor: t.panel, cursor: 'pointer', color: t.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {theme === 'dark' ? <IcSun /> : <IcMoon />}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: 380, padding: '0 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><MpLogo size={56} /></div>
          <div style={{ fontSize: 22, fontWeight: 700, color: t.text }}>MATRIX PAYMENT</div>
          <div style={{ fontSize: 13, color: t.textSec, marginTop: 4 }}>Платёжная платформа</div>
        </div>

        <div style={{ backgroundColor: t.panel, borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: t.text, marginBottom: 20 }}>Вход</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Логин"><SInput placeholder="username" value={login} onChange={setLogin} t={t} /></Field>
            <Field label="Пароль"><SInput placeholder="••••••••" value={pass} onChange={setPass} type="password" t={t} /></Field>
            {err && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(255,59,48,.1)', border: '1px solid rgba(255,59,48,.3)', borderRadius: 8, fontSize: 13, color: '#FF3B30', textAlign: 'center' }}>{err}</div>
            )}
            <button
              onClick={submit}
              onKeyDown={onKey}
              disabled={loading}
              style={{ padding: '10px', fontSize: 14, fontWeight: 600, backgroundColor: loading ? '#48484a' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter,sans-serif', width: '100%', transition: 'background .2s' }}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34C759' }} />
          <span style={{ fontSize: 12, color: t.textSec }}>Все системы работают</span>
        </div>
      </div>
    </div>
  )
}
