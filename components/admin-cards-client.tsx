"use client"

import dynamic from 'next/dynamic'
import React from 'react'

const AdminCardsWrapper = dynamic(() => import('./admin-cards-wrapper').then(m => m.default), { ssr: false })

export default function AdminCardsClient() {
  return <AdminCardsWrapper />
}
