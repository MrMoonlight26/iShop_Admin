import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: NextRequest) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id
    const body = await req.json()
    const { name, abbreviation, conversionFactor, unitClassId } = body

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid unit type ID' }, { status: 400 })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid name' }, { status: 400 })
    }

    const unitType = await prisma.unitType.update({
      where: { id: id.trim() },
      data: {
        name: name.trim(),
        abbreviation: abbreviation ? String(abbreviation).trim() : null,
        conversionFactor: typeof conversionFactor === 'number' ? conversionFactor : 1,
        unitClassId: unitClassId ? String(unitClassId).trim() : null,
      },
    })

    return NextResponse.json({
      id: unitType.id,
      name: unitType.name,
      abbreviation: unitType.abbreviation,
      unitClassId: unitType.unitClassId,
      conversionFactor: unitType.conversionFactor,
    })
  } catch (err: any) {
    console.error('PATCH /api/admin/units/types/[id] error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Unit type not found' }, { status: 404 })
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Unit type name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update unit type' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const id = params.id

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid unit type ID' }, { status: 400 })
    }

    await prisma.unitType.delete({
      where: { id: id.trim() },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    console.error('DELETE /api/admin/units/types/[id] error:', err)
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Unit type not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete unit type' }, { status: 500 })
  }
}
