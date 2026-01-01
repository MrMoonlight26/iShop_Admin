import Link from 'next/link'

interface Props { params: { id: string } }

export default async function ShopDetail(props: Props) {
  // `params` may itself be a promise in the app router environment; await params directly before using its properties
  const { params } = props
  const { id } = (await Promise.resolve(params)) as { id: string }
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  let url = `${API_BASE || ''}/api/admin/shops?id=${id}`
  if (!API_BASE) url = `/api/admin/shops?id=${id}`
  let r: Response
  try {
    r = await fetch(url, { cache: 'no-store' })
  } catch (err: any) {
    const msg = err?.message || String(err)
    return (
      <div className="p-6">
        <div className="mb-2 font-medium">Error fetching shop</div>
        <div className="text-sm text-muted-foreground">Attempted: <span className="font-mono">{url}</span></div>
        <div className="mt-2 text-xs text-red-600">{msg}</div>
      </div>
    )
  }

  if (!r.ok) {
    const body = await r.text().catch(() => '')
    return (
      <div className="p-6">
        <div className="mb-2 font-medium">Shop not found</div>
        <div className="text-sm text-muted-foreground">Fetched: <span className="font-mono">{url}</span> (status: {r.status})</div>
        {body && <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{body}</pre>}
      </div>
    )
  }
  const shop = await r.json()

  const ownerType = shop.ownerType
  const ordersCount = shop.ordersCount ?? 0

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/admin/shops" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="text-2xl font-bold">{shop.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Shop ID</div>
          <div className="font-mono text-sm">{shop.id}</div>

          <div className="mt-4 text-sm text-muted-foreground">Status</div>
          <div className={`inline-block mt-1 px-2 py-1 rounded ${shop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : shop.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{shop.status}</div>

          {ownerType && (
            <>
              <div className="mt-4 text-sm text-muted-foreground">Owner Type</div>
              <div className="mt-1 text-sm">{ownerType}</div>
            </>
          )}

          <div className="mt-4 text-sm text-muted-foreground">Created</div>
          <div className="mt-1 text-sm">{shop.createdAt ? new Date(shop.createdAt).toLocaleString() : ''}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Owner</div>
          <div className="mt-1 text-sm">{shop.owner?.name ?? '—'}</div>
          <div className="text-xs text-muted-foreground">{shop.owner?.email ?? ''}</div>

          <div className="mt-4 text-sm text-muted-foreground">Counts</div>
          <div className="mt-1 text-sm">Products: {shop._count?.shopProducts ?? 0}</div>
          <div className="mt-1 text-sm">Orders: {ordersCount ?? 0}</div>
        </div>
      </div>
    </div>
  )
}