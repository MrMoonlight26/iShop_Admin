import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET() {
  try {
    const units = await prisma.unitType.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(units)
  } catch (err) {
    // Fallback mock data when DB/backend unavailable
    const mock = [
      { id: 'mock-kg', name: 'Kilogram', short: 'kg', value: 1 },
      { id: 'mock-pc', name: 'Piece', short: 'pc', value: 1 },
      { id: 'mock-l', name: 'Litre', short: 'L', value: 1 }
    ]
    return NextResponse.json(mock)
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { name, short, value, valueRaw } = body
  if (!name) return new NextResponse('Missing name', { status: 400 })
  const hasValidNumber = typeof value === 'number' && value > 0
  const hasValidRaw = typeof valueRaw === 'string' && valueRaw.trim().length > 0
  if (!hasValidNumber && !hasValidRaw) return new NextResponse('Missing or invalid value (must be > 0 or a non-empty string)', { status: 400 })
  const data: any = { name, short }
  if (hasValidNumber) data.value = value
  if (hasValidRaw) data.valueRaw = valueRaw.trim()
  const unit = await prisma.unitType.create({ data })
  return NextResponse.json(unit)
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, name, short, value, valueRaw } = body
  if (!id || !name) return new NextResponse('Missing fields', { status: 400 })
  const hasValidNumber = typeof value === 'number' && value > 0
  const hasValidRaw = typeof valueRaw === 'string' && valueRaw.trim().length > 0
  if (!hasValidNumber && !hasValidRaw) return new NextResponse('Missing or invalid value (must be > 0 or a non-empty string)', { status: 400 })
  const data: any = { name, short }
  if (hasValidNumber) data.value = value
  if (hasValidRaw) data.valueRaw = valueRaw.trim()
  const unit = await prisma.unitType.update({ where: { id }, data })
  return NextResponse.json(unit)
}

export async function DELETE(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id } = body
  if (!id) return new NextResponse('Missing id', { status: 400 })
  await prisma.unitType.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
