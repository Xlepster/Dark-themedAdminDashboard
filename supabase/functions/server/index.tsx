import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const ADMIN_SECRET = "matrix-admin-secret-2024";
const BASE = "/make-server-baa0c261";

app.use("*", logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "X-Admin-Secret"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

app.get(`${BASE}/health`, (c) => c.json({ status: "ok", ts: new Date().toISOString() }));

// Global error handler for KV / JWT issues
app.onError((err, c) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Edge function error:", msg);
  return c.json({ error: msg }, 500);
});

const isAdmin = (c: any) => c.req.header("X-Admin-Secret") === ADMIN_SECRET;
const uid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 9);
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// ── Trader login (must be before /:id) ──────────────────────────────────────
app.post(`${BASE}/traders/login`, async (c) => {
  const { login, password } = await c.req.json();
  if (!login || !password) return c.json({ error: "Missing fields" }, 400);

  const creds = await kv.get(`trader_pwd:${login}`);
  if (!creds || creds.password !== password)
    return c.json({ error: "Неверный логин или пароль" }, 401);

  const traders: any[] = (await kv.get("traders")) || [];
  const trader = traders.find((t) => t.id === creds.id);
  if (!trader || trader.status === "blocked")
    return c.json({ error: "Аккаунт заблокирован или не найден" }, 403);

  const balance = (await kv.get(`trader_balance:${creds.id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${creds.id}`)) || [];

  return c.json({ ...trader, balance, transactions: txs.slice(-50) });
});

// ── List all traders (admin) ─────────────────────────────────────────────────
app.get(`${BASE}/traders`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const traders: any[] = (await kv.get("traders")) || [];
  const result = await Promise.all(traders.map(async (t) => {
    const balance = (await kv.get(`trader_balance:${t.id}`)) || { usdt: 0, insurance: 500, locked: 0 };
    const txs: any[] = (await kv.get(`trader_txs:${t.id}`)) || [];
    const lastTx = txs[txs.length - 1];
    return { ...t, balance, transactions: txs, lastActivity: lastTx?.createdAt || t.createdAt };
  }));

  return c.json(result);
});

// ── Create trader (admin) ────────────────────────────────────────────────────
app.post(`${BASE}/traders`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const { login, password, name, email } = await c.req.json();
  if (!login || !password || !name) return c.json({ error: "Заполните все поля" }, 400);

  const traders: any[] = (await kv.get("traders")) || [];
  if (traders.find((t) => t.login === login))
    return c.json({ error: "Логин уже занят" }, 409);

  const id = uid();
  const trader = { id, login, name, email: email || "", createdAt: now(), status: "active" };

  await kv.mset(
    ["traders", `trader_pwd:${login}`, `trader_balance:${id}`, `trader_txs:${id}`],
    [[...traders, trader], { id, password }, { usdt: 0, insurance: 500, locked: 0 }, []]
  );

  return c.json(trader, 201);
});

// ── Get single trader (admin) ────────────────────────────────────────────────
app.get(`${BASE}/traders/:id`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const traders: any[] = (await kv.get("traders")) || [];
  const trader = traders.find((t) => t.id === id);
  if (!trader) return c.json({ error: "Не найден" }, 404);

  const balance = (await kv.get(`trader_balance:${id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${id}`)) || [];

  return c.json({ ...trader, balance, transactions: txs });
});

// ── Update trader status (admin) ─────────────────────────────────────────────
app.put(`${BASE}/traders/:id`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const { status } = await c.req.json();
  const traders: any[] = (await kv.get("traders")) || [];
  const idx = traders.findIndex((t) => t.id === id);
  if (idx === -1) return c.json({ error: "Не найден" }, 404);

  traders[idx] = { ...traders[idx], status };
  await kv.set("traders", traders);

  return c.json(traders[idx]);
});

// ── Delete trader (admin) ────────────────────────────────────────────────────
app.delete(`${BASE}/traders/:id`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const traders: any[] = (await kv.get("traders")) || [];
  const trader = traders.find((t) => t.id === id);
  if (!trader) return c.json({ error: "Не найден" }, 404);

  await kv.set("traders", traders.filter((t) => t.id !== id));
  await kv.mdel([`trader_pwd:${trader.login}`, `trader_balance:${id}`, `trader_txs:${id}`]);

  return c.json({ ok: true });
});

// ── Credit balance (admin) ───────────────────────────────────────────────────
app.post(`${BASE}/traders/:id/credit`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const { amount, note, adminLogin } = await c.req.json();
  if (!amount || Number(amount) <= 0) return c.json({ error: "Некорректная сумма" }, 400);

  const balance = (await kv.get(`trader_balance:${id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${id}`)) || [];

  const newBalance = { ...balance, usdt: Math.round((balance.usdt + Number(amount)) * 1e8) / 1e8 };
  const tx = { id: uid(), traderId: id, type: "credit", amount: Number(amount), note: note || "", adminLogin: adminLogin || "admin", createdAt: now() };

  await kv.mset([`trader_balance:${id}`, `trader_txs:${id}`], [newBalance, [...txs, tx]]);

  return c.json({ balance: newBalance, tx });
});

// ── Debit balance (admin) ────────────────────────────────────────────────────
app.post(`${BASE}/traders/:id/debit`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const { amount, note, adminLogin } = await c.req.json();
  if (!amount || Number(amount) <= 0) return c.json({ error: "Некорректная сумма" }, 400);

  const balance = (await kv.get(`trader_balance:${id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${id}`)) || [];

  const newBalance = { ...balance, usdt: Math.max(0, Math.round((balance.usdt - Number(amount)) * 1e8) / 1e8) };
  const tx = { id: uid(), traderId: id, type: "debit", amount: Number(amount), note: note || "", adminLogin: adminLogin || "admin", createdAt: now() };

  await kv.mset([`trader_balance:${id}`, `trader_txs:${id}`], [newBalance, [...txs, tx]]);

  return c.json({ balance: newBalance, tx });
});

// ── Get trader balance (trader self) ─────────────────────────────────────────
app.get(`${BASE}/traders/:id/balance`, async (c) => {
  const id = c.req.param("id");
  const balance = (await kv.get(`trader_balance:${id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${id}`)) || [];
  return c.json({ balance, transactions: txs.slice(-50) });
});

// ── Set insurance limit (admin) ──────────────────────────────────────────────
app.post(`${BASE}/traders/:id/set-insurance`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const { insurance } = await c.req.json();
  if (insurance === undefined || Number(insurance) < 0) return c.json({ error: "Некорректная сумма" }, 400);

  const balance = (await kv.get(`trader_balance:${id}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const newBalance = { ...balance, insurance: Math.round(Number(insurance) * 100) / 100 };
  await kv.set(`trader_balance:${id}`, newBalance);

  return c.json({ balance: newBalance });
});

// ── Submit deposit request (trader) ─────────────────────────────────────────
app.post(`${BASE}/traders/:id/deposit-request`, async (c) => {
  const id = c.req.param("id");
  const { amount, traderName, traderLogin } = await c.req.json();
  if (!amount || Number(amount) <= 0) return c.json({ error: "Некорректная сумма" }, 400);

  const traders: any[] = (await kv.get("traders")) || [];
  const trader = traders.find((t) => t.id === id);
  if (!trader) return c.json({ error: "Трейдер не найден" }, 404);

  const requests: any[] = (await kv.get("deposit_requests")) || [];
  const req = {
    id: uid(),
    traderId: id,
    traderName: traderName || trader.name,
    traderLogin: traderLogin || trader.login,
    amount: Number(amount),
    status: "pending",
    createdAt: now(),
  };

  await kv.set("deposit_requests", [...requests, req]);
  return c.json(req, 201);
});

// ── List deposit requests (admin) ────────────────────────────────────────────
app.get(`${BASE}/deposit-requests`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);
  const requests: any[] = (await kv.get("deposit_requests")) || [];
  return c.json(requests);
});

// ── Confirm deposit request (admin) ──────────────────────────────────────────
app.put(`${BASE}/deposit-requests/:reqId/confirm`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const reqId = c.req.param("reqId");
  const body = await c.req.json().catch(() => ({}));
  const adminLogin = body?.adminLogin || "admin";

  const requests: any[] = (await kv.get("deposit_requests")) || [];
  const idx = requests.findIndex((r) => r.id === reqId);
  if (idx === -1) return c.json({ error: "Не найдено" }, 404);
  if (requests[idx].status !== "pending") return c.json({ error: "Уже обработано" }, 409);

  const { traderId, amount } = requests[idx];
  const balance = (await kv.get(`trader_balance:${traderId}`)) || { usdt: 0, insurance: 500, locked: 0 };
  const txs: any[] = (await kv.get(`trader_txs:${traderId}`)) || [];

  const newBalance = { ...balance, usdt: Math.round((balance.usdt + Number(amount)) * 1e8) / 1e8 };
  const tx = { id: uid(), traderId, type: "credit", amount: Number(amount), note: "Пополнение баланса (подтверждено)", adminLogin, createdAt: now() };

  requests[idx] = { ...requests[idx], status: "confirmed", resolvedAt: now() };
  await kv.mset(
    ["deposit_requests", `trader_balance:${traderId}`, `trader_txs:${traderId}`],
    [requests, newBalance, [...txs, tx]]
  );

  return c.json({ ok: true, balance: newBalance });
});

// ── Reject deposit request (admin) ────────────────────────────────────────────
app.put(`${BASE}/deposit-requests/:reqId/reject`, async (c) => {
  if (!isAdmin(c)) return c.json({ error: "Unauthorized" }, 401);

  const reqId = c.req.param("reqId");
  const requests: any[] = (await kv.get("deposit_requests")) || [];
  const idx = requests.findIndex((r) => r.id === reqId);
  if (idx === -1) return c.json({ error: "Не найдено" }, 404);

  requests[idx] = { ...requests[idx], status: "rejected", resolvedAt: now() };
  await kv.set("deposit_requests", requests);

  return c.json({ ok: true });
});

Deno.serve(app.fetch);
