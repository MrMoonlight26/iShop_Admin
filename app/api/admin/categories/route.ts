import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: Request) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET() {
  try {
    // return top-level categories with children
    const cats = await prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(cats)
  } catch (err) {
    const mock = [
      { id: 'mock-food', name: 'Food', slug: 'food', children: [{ id: 'mock-veg', name: 'Vegetables', slug: 'vegetables' }] },
      { id: 'mock-electronics', name: 'Electronics', slug: 'electronics', children: [] }
    ]
    return NextResponse.json(mock)
  }
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { name, slug, parentId } = body
  if (!name) return new NextResponse('Missing name', { status: 400 })

  const data: any = { name }
  if (slug) data.slug = slug
  if (parentId) data.parentId = parentId

  try {
    const cat = await prisma.category.create({ data })
    return NextResponse.json(cat)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Create failed', { status: 400 })
  }
}

export async function PUT(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id, name, slug, parentId } = body
  if (!id || !name) return new NextResponse('Missing fields', { status: 400 })

  const data: any = { name }
  if (slug !== undefined) data.slug = slug
  if (parentId !== undefined) data.parentId = parentId

  try {
    const cat = await prisma.category.update({ where: { id }, data })
    return NextResponse.json(cat)
  } catch (err: any) {
    return new NextResponse(err?.message || 'Update failed', { status: 400 })
  }
}

export async function DELETE(req: Request) {
  if (!(await isAuthorized(req))) return new NextResponse('Unauthorized', { status: 401 })
  const body = await req.json()
  const { id } = body
  if (!id) return new NextResponse('Missing id', { status: 400 })

  try {
    // delete will cascade children if necessary depending on your desired policy; Prisma doesn't cascade by default.
    // Here we delete children first to keep it safe.
    await prisma.category.deleteMany({ where: { parentId: id } })
    await prisma.category.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return new NextResponse(err?.message || 'Delete failed', { status: 400 })
  }
}