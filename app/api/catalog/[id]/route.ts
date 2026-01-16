import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop()
  if (!id) return new NextResponse('Missing id', { status: 400 })
  const p = await prisma.product.findUnique({ where: { id } })
  if (!p) return new NextResponse('Not found', { status: 404 })

  const result = {
    productId: p.id,
    name: p.name,
    description: p.description,
    categoryId: null,
    sku: p.sku || null,
    barcode: null,
    imageUrl: null
  }
  return NextResponse.json(result)
}
