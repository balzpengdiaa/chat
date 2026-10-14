import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { sendOtp, verifyOtp, validUser } from '../apis/auth'

// mode: 'login' | 'register'
function OtpForm({ mode }) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const pageRoute = useNavigate()

  useEffect(() => {
    validUser().then((d) => { if (d?.user) window.location.href = '/chats' })
  }, [])
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const requestOtp = async (e) => {
    e && e.preventDefault()
    if (isRegister && !name.trim()) return toast.warning('Isi nama dulu')
    if (phone.replace(/\D/g, '').length < 9) return toast.warning('Nomor HP tidak valid')
    setLoading(true)
    const res = await sendOtp(phone, mode)
    setLoading(false)
    if (!res.ok) return toast.error(res.error)
    toast.success('OTP dikirim ke WhatsApp Anda')
    setStep(2)
    setCooldown(60)
  }
  const submitCode = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return toast.warning('Kode OTP 6 digit')
    setLoading(true)
    const res = await verifyOtp({ phone, code, name: isRegister ? name.trim() : undefined })
    setLoading(false)
    if (!res.ok) return toast.error(res.error)
    localStorage.setItem('userToken', res.data.token)
    toast.success(isRegister ? 'Berhasil mendaftar' : 'Berhasil masuk')
    pageRoute('/chats')
  }
  const input = 'bg-[#222222] h-[50px] pl-3 text-[#ffff] w-[100%] sm:w-[80%]'
  const btn = 'w-[100%] sm:w-[80%] h-[50px] font-bold text-[#121418] tracking-wide text-[17px]'
  const grad = { background: 'linear-gradient(90deg, rgba(0,195,154,1) 0%, rgba(224,205,115,1) 100%)' }

  return (
    <div className='bg-[#121418] w-[100vw] h-[100vh] flex justify-center items-center'>
      <div className='w-[90%] sm:w-[400px] relative'>
        <h3 className='text-[25px] font-bold tracking-wider text-[#fff]'>{isRegister ? 'Daftar' : 'Masuk'}</h3>
        <p className='text-[#fff] text-[12px] tracking-wider font-medium mb-6'>
          {isRegister ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <Link className='text-[rgba(0,195,154,1)] underline' to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Masuk' : 'Daftar'}
          </Link>
        </p>
        {step === 1 ? (
          <form className='flex flex-col gap-y-3' onSubmit={requestOtp}>
            {isRegister && (
              <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder='Nama' maxLength={50} required />
            )}
            <input className={input} type='tel' inputMode='tel' value={phone} onChange={(e) => setPhone(e.target.value)} placeholder='Nomor HP, mis. 08123456789' required />
            <button style={grad} className={btn} type='submit' disabled={loading}>{loading ? 'Mengirim...' : 'Kirim OTP via WhatsApp'}</button>
          </form>
        ) : (
          <form className='flex flex-col gap-y-3' onSubmit={submitCode}>
            <p className='text-[#fff] text-[13px]'>Masukkan 6 digit kode yang dikirim ke WhatsApp {phone}</p>
            <input className={input + ' tracking-[0.5em] text-center text-[20px]'} inputMode='numeric' maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder='------' autoFocus required />
            <button style={grad} className={btn} type='submit' disabled={loading}>{loading ? 'Memeriksa...' : 'Verifikasi'}</button>
            <div className='flex justify-between w-[100%] sm:w-[80%] text-[13px]'>
              <button type='button' className='text-[#fff] underline' onClick={() => { setStep(1); setCode('') }}>Ganti nomor</button>
              <button type='button' disabled={cooldown > 0 || loading} className='text-[rgba(0,195,154,1)] underline disabled:opacity-50' onClick={requestOtp}>
                {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
export default OtpForm
