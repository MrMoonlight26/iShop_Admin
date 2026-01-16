import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || undefined
  const page = parseInt(url.searchParams.get('page') || '0', 10)
  const size = Math.min(parseInt(url.searchParams.get('size') || '10', 10), 200)
  const skip = page * size

  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } }
    ]
  }

  const total = await prisma.product.count({ where })
  const products = await prisma.product.findMany({ where, skip, take: size, orderBy: { createdAt: 'desc' } })

  const content = products.map((p) => ({
    productId: p.id,
    name: p.name,
    description: p.description,
    categoryId: null,
    sku: p.sku ?? null,
    barcode: null,
    imageUrl: null
  }))

  const totalPages = Math.max(0, Math.ceil(total / size))

  return NextResponse.json({
    totalPages,
    totalElements: total,
    size,
    content,
    number: page,
    first: page === 0,
    last: page + 1 >= totalPages,
    numberOfElements: content.length,
    pageable: { offset: skip, pageNumber: page, pageSize: size, paged: true, unpaged: false },
    empty: content.length === 0,
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, description, sku, defaultUnitId } = body
    if (!name) return new NextResponse('Missing name', { status: 400 })

    const product = await prisma.product.create({ data: { name, description: description || null, sku: sku || null, defaultUnitId: defaultUnitId || null } })

    return NextResponse.json({ productId: product.id, name: product.name, description: product.description, sku: product.sku })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Create failed', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, description, sku, defaultUnitId } = body
    if (!id) return new NextResponse('Missing id', { status: 400 })
    const updated = await prisma.product.update({ where: { id }, data: { name, description: description || null, sku: sku || null, defaultUnitId: defaultUnitId || null } })
    return NextResponse.json({ productId: updated.id, name: updated.name, description: updated.description, sku: updated.sku })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Update failed', { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return new NextResponse('Missing id', { status: 400 })
    await prisma.product.delete({ where: { id } })
    return new NextResponse('Deleted', { status: 200 })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Delete failed', { status: 500 })
  }
}
