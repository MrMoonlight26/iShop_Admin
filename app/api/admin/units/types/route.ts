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
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { abbreviation: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Get total count
    const totalElements = await prisma.unitType.count({ where })
    const totalPages = Math.ceil(totalElements / pageSize)

    // Get paginated results with class info
    const content = await prisma.unitType.findMany({
      where,
      include: {
        unitClass: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: pageSize,
    })

    // Transform response to match API spec
    const transformedContent = content.map((item: any) => ({
      id: item.id,
      unitClassId: item.unitClassId,
      name: item.name,
      unitClassName: item.unitClass?.name,
      abbreviation: item.abbreviation,
      conversionFactor: item.conversionFactor,
    }))

    return NextResponse.json({
      totalElements,
      totalPages,
      first: pageNumber === 0,
      last: pageNumber >= totalPages - 1,
      size: pageSize,
      content: transformedContent,
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
    console.error('GET /api/admin/units/types error:', err)
    return NextResponse.json({ error: 'Failed to fetch unit types' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, abbreviation, conversionFactor, unitClassId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Missing or invalid name' }, { status: 400 })
    }

    const unitType = await prisma.unitType.create({
      data: {
        name: name.trim(),
        abbreviation: abbreviation ? String(abbreviation).trim() : null,
        conversionFactor: typeof conversionFactor === 'number' ? conversionFactor : 1,
        unitClassId: unitClassId ? String(unitClassId).trim() : null,
      },
      include: {
        unitClass: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    })

    return NextResponse.json(
      {
        id: unitType.id,
        unitClassId: unitType.unitClassId,
        name: unitType.name,
        unitClassName: unitType.unitClass?.name,
        abbreviation: unitType.abbreviation,
        conversionFactor: unitType.conversionFactor,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('POST /api/admin/units/types error:', err)
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Unit type name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create unit type' }, { status: 500 })
  }
}
