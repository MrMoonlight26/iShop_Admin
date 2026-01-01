import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

function csvEscape(val: any) {
  if (val === null || val === undefined) return '""'
  const s = String(val).replace(/"/g, '""')
  return `"${s}"`
}

export async function GET(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })

  try {
    const url = new URL(req.url)
    const shopId = url.searchParams.get('shopId')
    const pinCode = url.searchParams.get('pinCode')
    const area = url.searchParams.get('area')
    const status = url.searchParams.get('status')

    const where: any = {}
    if (shopId) where.shopId = shopId
    if (pinCode) where.pinCode = pinCode
    if (area) where.area = area
    if (status) where.status = status

    const orders = await prisma.order.findMany({ where, include: { items: true, shop: true, vendor: true }, orderBy: { createdAt: 'desc' }, take: 1000 })

    const header = ['orderId','shop','vendor','pinCode','area','total','status','createdAt','items']
    const lines = [header.join(',')]

    for (const o of orders) {
      const itemsStr = o.items.map((it: any) => `${it.name}(${it.quantity}${it.unit ? ' '+it.unit : ''})@${it.price}`).join('; ')
      const row = [o.id, o.shop?.name || '', o.vendor?.name || '', o.pinCode || '', o.area || '', o.total, o.status, o.createdAt.toISOString(), itemsStr]
      lines.push(row.map(csvEscape).join(','))
    }

    const csv = lines.join('\n')

    return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="orders.csv"' } })
  } catch (err) {
    return new NextResponse('Export failed', { status: 500 })
  }
}