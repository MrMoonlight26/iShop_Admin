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
    const q = url.searchParams.get('q') || undefined
    const page = parseInt(url.searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 200)
    const skip = (page - 1) * limit
    const id = url.searchParams.get('id') || undefined

    // If id is provided, return single shop record
    if (id) {
      const shop = await prisma.shop.findUnique({ where: { id }, include: { owner: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { shopProducts: true } } } }) as any
      if (!shop) return new NextResponse('Not found', { status: 404 })
      const ordersCount = await (prisma as any).order.count({ where: { shopId: id } })
      const normalized = {
        shopId: shop.id,
        name: shop.name,
        status: shop.status,
        ownerType: shop.owner ? (shop.owner.role === 'VENDOR' ? 'RETAILER' : shop.owner.role) : undefined,
        mobile: undefined,
        onlineEnabled: false,
        fulfillmentTypes: [],
        createdAt: shop.createdAt.toISOString(),
        owner: shop.owner ? { id: shop.owner.id, name: shop.owner.name, email: shop.owner.email } : undefined,
        _count: shop._count,
        ordersCount
      }
      return NextResponse.json(normalized)
    }

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { owner: { name: { contains: q, mode: 'insensitive' } } }
      ]
    }

    const total = await prisma.shop.count({ where })
    const shops = await prisma.shop.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { shopProducts: true } }
      },
      skip,
      take: limit
    }) as any[]

    // normalize to richer paginated shape (content + pageable metadata)
    const content = shops.map((s) => ({
      shopId: s.id,
      name: s.name,
      status: s.status,
      ownerType: s.owner ? (s.owner.role === 'VENDOR' ? 'RETAILER' : s.owner.role) : undefined,
      owner: s.owner ? { id: s.owner.id, name: s.owner.name, email: s.owner.email } : undefined,
      mobile: undefined,
      onlineEnabled: false,
      fulfillmentTypes: [],
      createdAt: s.createdAt.toISOString(),
      _count: s._count
    }))

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const pageable = {
      pageNumber: page - 1,
      pageSize: limit,
      sort: { sorted: true, empty: false, unsorted: false },
      offset: (page - 1) * limit,
      paged: true,
      unpaged: false
    }

    return NextResponse.json({
      content,
      pageable,
      totalElements: total,
      totalPages,
      last: page >= totalPages,
      size: limit,
      number: page - 1,
      sort: { sorted: true, empty: false, unsorted: false },
      numberOfElements: shops.length,
      first: page === 1,
      empty: shops.length === 0
    })
  } catch (err) {
    const mock = [
      { id: 'shop-1', name: 'Kirana Store 1', address: 'Area 1', status: 'ACTIVE', approval: 'APPROVED', owner: { name: 'Vendor A', email: 'v1@example.com' }, _count: { shopProducts: 3, orders: 5 } },
      { id: 'shop-2', name: 'Kirana Store 2', address: 'Area 2', status: 'PAUSED', approval: 'PENDING', owner: { name: 'Vendor B', email: 'v2@example.com' }, _count: { shopProducts: 2, orders: 1 } },
    ]
    return NextResponse.json({ data: mock, total: mock.length, page: 1, limit: mock.length })
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, status, approval } = body
  if (!id) return new NextResponse('Missing id', { status: 400 })
  const data: any = {}
  if (status !== undefined) {
    if (!['ACTIVE', 'PAUSED', 'BLOCKED'].includes(status)) return new NextResponse('Invalid status', { status: 400 })
    data.status = status
  }
  if (approval !== undefined) {
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(approval)) return new NextResponse('Invalid approval', { status: 400 })
    data.approval = approval
  }
  if (Object.keys(data).length === 0) return new NextResponse('Nothing to update', { status: 400 })
  try {
    const shop = await prisma.shop.update({ where: { id }, data })
    return NextResponse.json(shop)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Update failed', { status: 400 })
  }
}