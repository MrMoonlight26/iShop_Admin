const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Create an admin user for dev
  const password = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Super Admin',
      password,
      role: 'ADMIN'
    }
  })

  // Seed unit types
  const units = [
    { name: 'Kilogram', short: 'kg', value: 1, valueRaw: '1' },
    { name: 'Gram', short: 'g', value: 0.001, valueRaw: '0.001' },
    { name: 'Litre', short: 'L', value: 1, valueRaw: '1' },
    { name: 'Piece', short: 'pc', value: 1, valueRaw: '1' }
  ]

  for (const u of units) {
    await prisma.unitType.upsert({
      where: { name: u.name },
      update: {},
      create: u
    })
  }

  // Seed categories
  const categories = [
    { name: 'Food', slug: 'food' },
    { name: 'Beverages', slug: 'beverages' },
    { name: 'Electronics', slug: 'electronics' }
  ]

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c
    })
  }

  // Seed a sample central product
  await prisma.product.upsert({
    where: { name: 'Sample Rice 5kg' },
    update: {},
    create: {
      name: 'Sample Rice 5kg',
      description: 'Sample central catalog product',
    }
  })

  // Seed vendors and shops
  const vendorPassword = await bcrypt.hash('vendor123', 10)
  const vendor1 = await prisma.user.upsert({
    where: { email: 'vendor1@example.com' },
    update: {},
    create: { email: 'vendor1@example.com', name: 'Vendor One', password: vendorPassword, role: 'VENDOR', status: 'ACTIVE' }
  })
  const vendor2 = await prisma.user.upsert({
    where: { email: 'vendor2@example.com' },
    update: {},
    create: { email: 'vendor2@example.com', name: 'Vendor Two', password: vendorPassword, role: 'VENDOR', status: 'PAUSED' }
  })

  let shop1 = await prisma.shop.findFirst({ where: { name: 'Kirana Shop 1' } })
  if (!shop1) {
    shop1 = await prisma.shop.create({ data: { name: 'Kirana Shop 1', ownerId: vendor1.id, address: 'MG Road, Area 42', status: 'ACTIVE' } })
  }
  let shop2 = await prisma.shop.findFirst({ where: { name: 'Kirana Shop 2' } })
  if (!shop2) {
    shop2 = await prisma.shop.create({ data: { name: 'Kirana Shop 2', ownerId: vendor2.id, address: 'Market Street', status: 'PAUSED' } })
  }

  // Seed customers
  const customer1 = await prisma.user.upsert({
    where: { email: 'cust1@example.com' },
    update: {},
    create: { email: 'cust1@example.com', name: 'Customer One', password: vendorPassword, role: 'USER', status: 'ACTIVE' }
  })
  const customer2 = await prisma.user.upsert({
    where: { email: 'cust2@example.com' },
    update: {},
    create: { email: 'cust2@example.com', name: 'Customer Two', password: vendorPassword, role: 'USER', status: 'ACTIVE' }
  })

  // Create multiple sample orders across different dates for reporting
  const product = await prisma.product.findFirst({ where: { name: 'Sample Rice 5kg' } })
  if (product && shop1) {
    // Recent order (today)
    await prisma.order.create({
      data: {
        shopId: shop1.id,
        vendorId: vendor1.id,
        customerId: customer1.id,
        pinCode: '560001',
        area: 'MG Road',
        total: 250,
        status: 'COMPLETED',
        items: {
          create: [ { productId: product.id, name: product.name, quantity: 1, unit: '5kg', price: 250 } ]
        }
      }
    })

    // 10 days ago
    await prisma.order.create({
      data: {
        shopId: shop1.id,
        vendorId: vendor1.id,
        customerId: customer2.id,
        pinCode: '560002',
        area: 'Market Road',
        total: 180,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        items: {
          create: [ { productId: product.id, name: product.name, quantity: 1, unit: '5kg', price: 180 } ]
        }
      }
    })

    // 40 days ago (last month)
    await prisma.order.create({
      data: {
        shopId: shop1.id,
        vendorId: vendor1.id,
        customerId: customer1.id,
        pinCode: '560003',
        area: 'North End',
        total: 320,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        items: {
          create: [ { productId: product.id, name: product.name, quantity: 2, unit: '5kg', price: 160 } ]
        }
      }
    })

    // 100 days ago (~3 months)
    await prisma.order.create({
      data: {
        shopId: shop1.id,
        vendorId: vendor1.id,
        customerId: customer2.id,
        pinCode: '560004',
        area: 'Lakeside',
        total: 400,
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
        items: {
          create: [ { productId: product.id, name: product.name, quantity: 4, unit: '5kg', price: 100 } ]
        }
      }
    })
  }

  // Update shop approvals for testing
  await prisma.shop.update({ where: { id: shop1.id }, data: { approval: 'APPROVED' } })
  await prisma.shop.update({ where: { id: shop2.id }, data: { approval: 'REJECTED' } })

  console.log('Seed complete')
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
