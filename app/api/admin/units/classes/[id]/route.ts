import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: NextRequest) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function PATCH(req: NextRequest, context: any) {
  const params = context.params as any
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id
    const body = await req.json()
    const { name, baseUnitName } = body

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid unit class ID' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid name' }, { status: 400 })
    }

    await prisma.unitClass.update({
      where: { id: id.trim() },
      data: {
        name: name.trim(),
        baseUnitName: baseUnitName ? String(baseUnitName).trim() : null,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('PATCH /api/admin/units/classes/[id] error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Unit class not found' }, { status: 404 })
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Unit class name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update unit class' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const params = context.params as any
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid unit class ID' }, { status: 400 })
    }

    await prisma.unitClass.delete({ where: { id: id.trim() } })

    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('DELETE /api/admin/units/classes/[id] error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Unit class not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete unit class' }, { status: 500 })
  }
}
