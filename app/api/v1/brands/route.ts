import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(brands)
  } catch (err) {
    const mock = [
      {
        id: 'mock-brand-1',
        name: 'Acme',
        description: 'Sample brand',
        logoUrl: '',
        isGlobal: true,
        ownerId: 'mock-owner',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    return NextResponse.json(mock)
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { name, description, logoUrl, isActive, isGlobal } = body
  if (!name || typeof name !== 'string') return new NextResponse('Missing or invalid name', { status: 400 })
  const token = await getReqToken(req)
  const ownerId = (token as any)?.sub || (token as any)?.id || null
  const data: any = { name, description: description || null, logoUrl: logoUrl || null, isActive: typeof isActive === 'boolean' ? isActive : true, isGlobal: typeof isGlobal === 'boolean' ? isGlobal : false }
  if (ownerId) data.ownerId = ownerId
  const brand = await prisma.brand.create({ data })
  return NextResponse.json(brand, { status: 201 })
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const url = new URL(req.url)
  const possibleId = url.pathname.split('/').pop()
  const body = await req.json()
  const id = (body && body.id) || possibleId
  if (!id) return new NextResponse('Missing id', { status: 400 })
  const { name, description, logoUrl, isActive, isGlobal } = body
  if (!name || typeof name !== 'string') return new NextResponse('Missing or invalid name', { status: 400 })
  const data: any = { name, description: description || null, logoUrl: logoUrl || null, isActive: typeof isActive === 'boolean' ? isActive : true, isGlobal: typeof isGlobal === 'boolean' ? isGlobal : false }
  const brand = await prisma.brand.update({ where: { id }, data })
  return NextResponse.json(brand)
}
