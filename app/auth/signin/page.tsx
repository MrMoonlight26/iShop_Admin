"use client"

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const router = useRouter()

  async function submit(e) {
    e.preventDefault()
    const res = await signIn('credentials', { redirect: false, email, password })
    if ((res as any)?.error) {
      alert('Sign in failed')
    } else {
      router.push('/admin/units')
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <input className="border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="border p-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-primary text-white px-4 py-2 mt-2">Sign in</button>
      </form>
    </div>
  )
}