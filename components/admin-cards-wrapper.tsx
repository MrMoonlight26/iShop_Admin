"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { AdminCards } from './admin-cards'

export default function AdminCardsWrapper() {
  const { data: session, status } = useSession()
  if (status === 'loading') return null
  if (!session || String((session as any).user?.role || '').toLowerCase() !== 'admin') return null
  return <AdminCards />
}
