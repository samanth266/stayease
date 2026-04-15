import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'host' ? '/dashboard' : '/'} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const loggedInUser = await login(formData.email.trim(), formData.password)
      navigate(loggedInUser.role === 'host' ? '/dashboard' : '/', { replace: true })
    } catch (err) {
      const message = err?.response?.data?.detail || 'Login failed. Please check your credentials.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
  <div style={{display:'flex', minHeight:'100vh'}}>
    <div style={{display:'none', flex:1, background:'linear-gradient(135deg, #FF385C 0%, #c2185b 100%)', alignItems:'center', justifyContent:'center', padding:'64px 48px'}} className="lg:flex">
      <div style={{color:'white', maxWidth:'360px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'32px'}}>
          <div style={{width:'48px', height:'48px', background:'rgba(255,255,255,0.2)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg viewBox="0 0 24 24" style={{width:'28px', height:'28px'}} fill="white"><path d="M12 3L2 12h3v9h6v-5h2v5h6v-9h3z"/></svg>
          </div>
          <span style={{fontSize:'28px', fontWeight:'800', letterSpacing:'-0.5px'}}>StayEase</span>
        </div>
        <h2 style={{fontSize:'28px', fontWeight:'700', marginBottom:'12px', lineHeight:'1.2'}}>Find your perfect stay</h2>
        <p style={{fontSize:'16px', opacity:'0.85', marginBottom:'40px', lineHeight:'1.6'}}>Join thousands of travelers discovering amazing places around the world.</p>
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          {['Thousands of unique stays', 'Verified hosts worldwide', 'Book with confidence', 'Secure payments'].map(item => (
            <div key={item} style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'24px', height:'24px', borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <svg viewBox="0 0 24 24" style={{width:'14px', height:'14px'}} fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span style={{fontSize:'15px', opacity:'0.92'}}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'white', padding:'48px 24px'}}>
      <div style={{width:'100%', maxWidth:'400px'}}>
        <div style={{marginBottom:'32px'}}>
          <h1 style={{fontSize:'32px', fontWeight:'800', color:'#111827', marginBottom:'8px', letterSpacing:'-0.5px'}}>Welcome back</h1>
          <p style={{fontSize:'15px', color:'#6b7280'}}>Sign in to your StayEase account</p>
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          <div>
            <label style={{display:'block', fontSize:'14px', fontWeight:'600', color:'#374151', marginBottom:'8px'}} htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email" autoComplete="email" required
              value={formData.email} onChange={handleChange}
              placeholder="you@example.com"
              style={{width:'100%', padding:'12px 16px', border:'1.5px solid #e5e7eb', borderRadius:'12px', fontSize:'15px', color:'#111827', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s'}}
              onFocus={e => e.target.style.borderColor='#FF385C'}
              onBlur={e => e.target.style.borderColor='#e5e7eb'}
            />
          </div>

          <div>
            <label style={{display:'block', fontSize:'14px', fontWeight:'600', color:'#374151', marginBottom:'8px'}} htmlFor="password">Password</label>
            <div style={{position:'relative'}}>
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'}
                autoComplete="current-password" required
                value={formData.password} onChange={handleChange}
                placeholder="Enter your password"
                style={{width:'100%', padding:'12px 48px 12px 16px', border:'1.5px solid #e5e7eb', borderRadius:'12px', fontSize:'15px', color:'#111827', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s'}}
                onFocus={e => e.target.style.borderColor='#FF385C'}
                onBlur={e => e.target.style.borderColor='#e5e7eb'}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9ca3af', padding:'4px'}}>
                {showPassword
                  ? <svg viewBox="0 0 24 24" style={{width:'20px', height:'20px'}} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18M10.58 10.58A2 2 0 0 0 13.42 13.42M9.88 5.07A10.5 10.5 0 0 1 12 4.75c5.5 0 9.5 7.25 9.5 7.25a19.4 19.4 0 0 1-4.34 5.14M6.61 6.61A19.4 19.4 0 0 0 2.5 12S6.5 19.25 12 19.25"/></svg>
                  : <svg viewBox="0 0 24 24" style={{width:'20px', height:'20px'}} fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.75-7.25 10-7.25S22 12 22 12s-3.75 7.25-10 7.25S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {error && <div style={{padding:'12px 16px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', fontSize:'14px', color:'#dc2626'}}>{error}</div>}

          <button type="submit" disabled={isSubmitting || isLoading}
            style={{width:'100%', padding:'14px', background:'#FF385C', color:'white', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'700', cursor:'pointer', transition:'background 0.2s', opacity: (isSubmitting || isLoading) ? 0.6 : 1}}
            onMouseOver={e => e.target.style.background='#e01f48'}
            onMouseOut={e => e.target.style.background='#FF385C'}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{textAlign:'center', fontSize:'14px', color:'#6b7280', marginTop:'24px'}}>
          New to StayEase?{' '}
          <Link to="/register" style={{color:'#FF385C', fontWeight:'600', textDecoration:'none'}}>Create an account</Link>
        </p>
      </div>
    </div>
  </div>
)
}

export default Login
