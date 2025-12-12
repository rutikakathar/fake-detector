import React, { useEffect, useState } from 'react'
import { supabase, useAuth } from '../hooks/useAuth'
import { parse } from 'papaparse'
import { format } from 'date-fns'

type Transaction = {
  id?: string
  user_id?: string
  amount: number
  merchant: string
  date: string
  status?: 'safe' | 'fake' | 'suspicious'
  risk_level?: 'low' | 'medium' | 'high'
  confidence?: number
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  // Very simple fake detection rules just for demo
  const fakeDetector = (t: Transaction): Transaction => {
    const hour = new Date(t.date).getHours()
    let status: Transaction['status'] = 'safe'
    let risk: Transaction['risk_level'] = 'low'
    let confidence = 0.7

    if (t.amount > 2000 || hour < 5) {
      status = 'fake'
      risk = 'high'
      confidence = 0.95
    } else if (t.amount > 500) {
      status = 'suspicious'
      risk = 'medium'
      confidence = 0.85
    }

    return { ...t, status, risk_level: risk, confidence }
  }

  const fetchTransactions = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error && data) setTransactions(data as Transaction[])
    setLoading(false)
  }

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async results => {
        const rows = results.data as any[]
        const base: Transaction[] = rows.map(r => ({
          amount: Number(r.amount),
          merchant: String(r.merchant),
          date: r.date || new Date().toISOString()
        }))

        const scored = base.map(fakeDetector)

        if (user) {
          const toInsert = scored.map(t => ({
            user_id: user.id,
            amount: t.amount,
            merchant: t.merchant,
            date: t.date,
            status: t.status,
            risk_level: t.risk_level,
            confidence: t.confidence
          }))

          await supabase.from('transactions').insert(toInsert)
          fetchTransactions()
        } else {
          setTransactions(scored)
          setLoading(false)
        }
      }
    })
  }

  const safeCount = transactions.filter(t => t.status === 'safe').length
  const fakeCount = transactions.filter(t => t.status === 'fake').length
  const suspiciousCount = transactions.filter(t => t.status === 'suspicious').length

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: 'white' }}>
      <header style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1f2937' }}>
        <h1>Fake Transaction Detector</h1>
        <div>
          <span style={{ marginRight: 12, fontSize: 13, color: '#9ca3af' }}>
            {user?.email}
          </span>
          <button
            onClick={signOut}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #4b5563', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: 12 }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: 16 }}>
        <section style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 8 }}>Upload transactions CSV</h2>
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
            File must have columns: merchant, amount, date
          </p>
        </section>

        <section style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#111827' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Safe</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>{safeCount}</div>
          </div>
          <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#111827' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Fake</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#ef4444' }}>{fakeCount}</div>
          </div>
          <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#111827' }}>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Suspicious</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#eab308' }}>{suspiciousCount}</div>
          </div>
        </section>

        <section>
          <h2 style={{ marginBottom: 8 }}>Latest transactions</h2>
          {loading && <p>Processing...</p>}
          {!loading && transactions.length === 0 && (
            <p style={{ fontSize: 13, color: '#9ca3af' }}>No transactions yet. Upload a CSV to see results.</p>
          )}
          {!loading && transactions.length > 0 && (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#111827' }}>
                  <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Merchant</th>
                  <th style={{ textAlign: 'right', padding: 8 }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Risk</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id ?? `${t.merchant}-${t.date}-${t.amount}`}>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937' }}>
                      {format(new Date(t.date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937' }}>{t.merchant}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937', textAlign: 'right' }}>
                      ₹{t.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937' }}>
                      {t.status}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937' }}>
                      {t.risk_level}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #1f2937' }}>
                      {(t.confidence ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}

export default Dashboard