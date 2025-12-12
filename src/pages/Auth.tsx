import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const Auth: React.FC = () => {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)

    console.log('Mode:', isLogin ? 'LOGIN' : 'SIGNUP') // Debug line

    try {
      if (isLogin) {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          setMessage(error.message)
        }
      } else {
        const { error } = await signUp(email.trim(), password)
        if (error) {
          setMessage(error.message)
        } else {
          setMessage('Check your email to confirm (or try logging in now).')
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: 'white' }}>
      <div style={{ width: 360, padding: 24, borderRadius: 12, background: '#020617', boxShadow: '0 20px 40px rgba(15,23,42,0.9)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 16 }}>
          {isLogin ? 'Login' : 'Create account'}
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 24, fontSize: 13, color: '#9ca3af' }}>
          Fake Transaction Detector prototype
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="email" style={{ fontSize: 13 }}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid #4b5563', background: '#020617', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="password" style={{ fontSize: 13 }}>Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid #4b5563', background: '#020617', color: 'white' }}
            />
          </div>
          {message && (
            <p style={{ fontSize: 12, color: '#f97316', marginBottom: 8 }}>{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: 10, 
              borderRadius: 6, 
              border: 'none', 
              background: '#4f46e5', 
              color: 'white', 
              fontWeight: 600, 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign up')}
          </button>
        </form>
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setMessage('')
          }}
          style={{ 
            marginTop: 12, 
            width: '100%', 
            fontSize: 13, 
            color: '#9ca3af', 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isLogin ? 'New here? Create account' : 'Already have an account? Login'}
        </button>
      </div>
    </div>
  )
}

export default Auth