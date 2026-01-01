import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 200)
    const skip = (page - 1) * limit

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } }
      ]
    }

    const total = await prisma.user.count({ where })
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit })
    return NextResponse.json({ data: users, total, page, limit })
  } catch (err) {
    const mock = [
      { id: 'user-1', name: 'Vendor A', email: 'v1@example.com', role: 'VENDOR', status: 'ACTIVE' },
      { id: 'user-2', name: 'Vendor B', email: 'v2@example.com', role: 'VENDOR', status: 'PAUSED' },
    ]
    return NextResponse.json({ data: mock, total: mock.length, page: 1, limit: mock.length })
  }
}

import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return new NextResponse('Missing fields', { status: 400 })
  if (!['ACTIVE', 'PAUSED', 'BLOCKED'].includes(status)) return new NextResponse('Invalid status', { status: 400 })
  try {
    const user = await prisma.user.update({ where: { id }, data: { status } })
    return NextResponse.json(user)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Update failed', { status: 400 })
  }
}