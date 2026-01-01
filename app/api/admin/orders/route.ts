import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const shopId = url.searchParams.get('shopId')
    const pinCode = url.searchParams.get('pinCode')
    const area = url.searchParams.get('area')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 200)
    const skip = (page - 1) * limit
    const since = url.searchParams.get('since') || undefined

    const where: any = {}
    if (shopId) where.shopId = shopId
    if (pinCode) where.pinCode = pinCode
    if (area) where.area = area
    if (status) where.status = status
    if (q) where.OR = [{ id: { contains: q } }, { pinCode: { contains: q } }, { area: { contains: q } }, { customer: { name: { contains: q, mode: 'insensitive' } } }]
    if (since) where.createdAt = { gte: new Date(since) }

    const total = await prisma.order.count({ where })
    const orders = await prisma.order.findMany({ where, include: { items: true, shop: true, vendor: true, customer: true }, orderBy: { createdAt: 'desc' }, skip, take: limit })
    return NextResponse.json({ data: orders, total, page, limit })
  } catch (err) {
    return NextResponse.json({ data: [], total: 0, page: 1, limit: 0 })
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { shopId, vendorId, pinCode, area, total, items } = body
  if (!shopId || !total || !items || items.length === 0) return new NextResponse('Missing fields', { status: 400 })

  try {
    const order = await prisma.order.create({ data: { shopId, vendorId, pinCode, area, total, items: { create: items } } })
    return NextResponse.json(order)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Create failed', { status: 400 })
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, status } = body
  if (!id || !status) return new NextResponse('Missing fields', { status: 400 })
  if (!['PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) return new NextResponse('Invalid status', { status: 400 })
  try {
    const order = await prisma.order.update({ where: { id }, data: { status } })
    return NextResponse.json(order)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Update failed', { status: 400 })
  }
}