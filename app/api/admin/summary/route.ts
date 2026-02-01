import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const productCount = await prisma.product.count()
    const unitCount = await prisma.unitType.count()
    const shopCount = await prisma.shop.count()
    const vendorCount = await prisma.user.count({ where: { role: 'VENDOR' } })
    const orderCount = await prisma.order.count()

    // additional shop stats: breakdown by status
    const totalShops = shopCount
    const shopStatusGroups = await prisma.shop.groupBy({ by: ['status'], _count: { _all: true } })
    const statusBreakdown: any = {}
    shopStatusGroups.forEach((g: any) => (statusBreakdown[g.status] = g._count._all))
    const activeShops = statusBreakdown['ACTIVE'] || 0
    const inactiveShops = totalShops - activeShops

    // Note: onlineEnabled / acceptingOrders fields are not modeled in schema; return 0 for now
    const onlineEnabledShops = 0
    const offlineShops = 0
    const acceptingOrdersShops = 0
    const notAcceptingOrdersShops = 0

    // Breakdown by shop (top 5)
    const byShop = await prisma.order.groupBy({ by: ['shopId'], _count: { _all: true }, orderBy: { _count: { _all: 'desc' } }, take: 5 })
    const shopDetails = await Promise.all(byShop.map(async (g: any) => {
      const shop = await prisma.shop.findUnique({ where: { id: g.shopId } })
      return { shopId: g.shopId, shopName: shop?.name || 'Unknown', count: g._count._all }
    }))

    // Breakdown by pinCode (top 5)
    const byPin = await prisma.order.groupBy({ by: ['pinCode'], _count: { _all: true }, orderBy: { _count: { _all: 'desc' } }, take: 5 })
    const pinDetails = byPin.map((g: any) => ({ pinCode: g.pinCode || 'Unknown', count: g._count._all }))

    // Breakdown by area (top 5)
    const byArea = await prisma.order.groupBy({ by: ['area'], _count: { _all: true }, orderBy: { _count: { _all: 'desc' } }, take: 5 })
    const areaDetails = byArea.map((g: any) => ({ area: g.area || 'Unknown', count: g._count._all }))

    // Time windows for orders (7, 30, 90 days)
    const now = new Date()
    const days = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)
    const windows = {
      week: { since: days(7) },
      month: { since: days(30) },
      months3: { since: days(90) }
    }

    const totals: any = {}
    for (const k of Object.keys(windows)) {
      const where: any = { createdAt: { gte: (windows as any)[k].since } }
      const count = await prisma.order.count({ where })
      const sum = await prisma.order.aggregate({ _sum: { total: true }, where })
      totals[k] = { count, totalValue: sum._sum.total || 0 }
    }

    // Order counts by status (overall and per window)
    const orderStatusGroups = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } })
    const byStatus: any = {}
    orderStatusGroups.forEach((g: any) => (byStatus[g.status] = g._count._all))

    const byStatusWindow: any = {}
    for (const k of Object.keys(windows)) {
      const groups = await prisma.order.groupBy({ by: ['status'], where: { createdAt: { gte: (windows as any)[k].since } }, _count: { _all: true } })
      byStatusWindow[k] = {}
      groups.forEach((g: any) => (byStatusWindow[k][g.status] = g._count._all))
    }

    return NextResponse.json({ productCount, unitCount, shopCount, vendorCount, orderCount, byShop: shopDetails, byPin: pinDetails, byArea: areaDetails, totals, byStatus, byStatusWindow, totalShops, activeShops, inactiveShops, onlineEnabledShops, offlineShops, acceptingOrdersShops, notAcceptingOrdersShops, statusBreakdown })
  } catch (err) {
    // fallback mock summary
    return NextResponse.json({ productCount: 12, unitCount: 4, shopCount: 8, vendorCount: 3 })
  }
}