import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getReqToken } from '@/lib/auth'

async function isAuthorized(req: NextRequest) {
  const token = await getReqToken(req)
  return token && (token as any).role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const pageStr = searchParams.get('page') || '0'
    const sizeStr = searchParams.get('size') || '20'
    const q = searchParams.get('q') || ''

    const pageNumber = Math.max(0, parseInt(pageStr, 10) || 0)
    const pageSize = Math.max(1, parseInt(sizeStr, 10) || 20)
    const skip = pageNumber * pageSize

    // Build where clause for search
    const where: any = {}
    if (q) {
      where.OR = [{ name: { contains: q, mode: 'insensitive' } }]
    }

    // Get total count
    const totalElements = await prisma.unitClass.count({ where })
    const totalPages = Math.ceil(totalElements / pageSize)

    // Get paginated results
    const content = await prisma.unitClass.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    })

    return NextResponse.json({
      totalElements,
      totalPages,
      first: pageNumber === 0,
      last: pageNumber >= totalPages - 1,
      size: pageSize,
      content,
      number: pageNumber,
      numberOfElements: content.length,
      pageable: {
        offset: skip,
        pageSize,
        pageNumber,
        paged: true,
        unpaged: false,
      },
      empty: content.length === 0,
      sort: [
        {
          direction: 'ASC',
          property: 'name',
          ignoreCase: false,
          nullHandling: 'NATIVE',
          ascending: true,
        },
      ],
    })
  } catch (err) {
    console.error('GET /api/admin/units/classes error:', err)
    return NextResponse.json({ error: 'Failed to fetch unit classes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, baseUnitName } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid name' }, { status: 400 })
    }

    const unitClass = await prisma.unitClass.create({
      data: {
        name: name.trim(),
        baseUnitName: baseUnitName ? String(baseUnitName).trim() : null,
      },
    })

    return NextResponse.json(
      {
        id: unitClass.id,
        name: unitClass.name,
        baseUnit: unitClass.baseUnitName,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('POST /api/admin/units/classes error:', err)
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Unit class name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create unit class' }, { status: 500 })
  }
}
