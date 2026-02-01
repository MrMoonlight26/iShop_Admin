"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/frontendAuth'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { signinPath } from '@/lib/appPaths'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)

  async function submit(e: any) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        email,
        password,
        clientId: 'ADMIN_APP' as const,
        appInstanceId: authService.getAppInstanceId(),
        deviceToken: 'WEB_BROWSER'
      }
      const res = await authService.login(payload as any)
      if (!res || !res.success) {
        toast.error('Sign in failed: invalid credentials')
        setSubmitting(false)
        return
      }
      // Attempt to create a NextAuth session (dev-compatible credentials provider)
      try {
        // call next-auth signIn to populate its session (redirect disabled)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const sa = await signIn('credentials', { redirect: false, email, password })
        // if signIn failed, we still proceed — server cookies are primary auth
      } catch (e) {}

      // success — perform a full navigation so cookies set by the server are included
      if (!res.isProfileComplete) window.location.href = '/admin/settings/profile'
      else window.location.href = '/admin/units'
    } catch (err: any) {
      toast.error(String(err?.message || 'Sign in failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Top progress bar when submitting */}
      {submitting && (
        <div className="fixed left-0 top-0 w-full z-50">
          <div className="h-1 bg-primary animate-pulse" style={{ width: '100%' }} />
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input className="border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-primary text-white px-4 py-2 mt-2" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}