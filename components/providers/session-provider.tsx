"use client"

import React from 'react'
import { SessionProvider } from 'next-auth/react'

export default function NextSessionProvider({ children }: { children: React.ReactNode }) {
  // Production: do not inject any dev mock session here.
  return <SessionProvider>{children}</SessionProvider>
}
