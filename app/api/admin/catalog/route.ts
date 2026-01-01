import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({ include: { defaultUnit: true }, orderBy: { name: 'asc' } })
    return NextResponse.json(products)
  } catch (err) {
    // Fallback mock products when DB/backend unavailable
    const mock = [
      { id: 'mock-1', name: 'Sample Rice 5kg', sku: 'RICE-5KG', description: 'Fallback sample', defaultUnit: { id: 'mock-kg', name: 'Kilogram', short: 'kg' } },
      { id: 'mock-2', name: 'Sample Sugar 1kg', sku: 'SUGAR-1KG', description: 'Fallback sample', defaultUnit: { id: 'mock-kg', name: 'Kilogram', short: 'kg' } }
    ]
    return NextResponse.json(mock)
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { name, description, sku, defaultUnitId } = body
  if (!name) return new NextResponse('Missing name', { status: 400 })
  const product = await prisma.product.create({ data: { name, description, sku, defaultUnitId } })
  return NextResponse.json(product)
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, name, description, sku, defaultUnitId } = body
  if (!id || !name) return new NextResponse('Missing fields', { status: 400 })
  const product = await prisma.product.update({ where: { id }, data: { name, description, sku, defaultUnitId } })
  return NextResponse.json(product)
}

export async function DELETE(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id } = body
  if (!id) return new NextResponse('Missing id', { status: 400 })
  await prisma.product.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
