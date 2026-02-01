import Link from 'next/link'

export default async function ProductDetail({ params }: any) {
  const { id } = (await Promise.resolve(params)) as { id: string }
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')
  let url = `${API_BASE || ''}/api/v1/admin/catalog/${id}`
  if (!API_BASE) url = `/api/v1/admin/catalog/${id}`

  let r: Response
  try {
    r = await fetch(url, { cache: 'no-store' })
  } catch (err: any) {
    const msg = err?.message || String(err)
    return (
      <div className="p-6">
        <div className="mb-2 font-medium">Error fetching product</div>
        <div className="text-sm text-muted-foreground">Attempted: <span className="font-mono">{url}</span></div>
        <div className="mt-2 text-xs text-red-600">{msg}</div>
      </div>
    )
  }

  if (!r.ok) {
    const body = await r.text().catch(() => '')
    return (
      <div className="p-6">
        <div className="mb-2 font-medium">Product not found</div>
        <div className="text-sm text-muted-foreground">Fetched: <span className="font-mono">{url}</span> (status: {r.status})</div>
        {body && <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{body}</pre>}
      </div>
    )
  }

  const p = await r.json()

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <Link href="/admin/catalog" className="text-sm text-muted-foreground">← Back</Link>
        <h1 className="text-2xl font-bold">{p.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Product ID</div>
          <div className="font-mono text-sm">{p.productId}</div>

          <div className="mt-4 text-sm text-muted-foreground">SKU</div>
          <div className="mt-1 text-sm">{p.sku ?? '—'}</div>

          <div className="mt-4 text-sm text-muted-foreground">Category</div>
          <div className="mt-1 text-sm">{p.categoryId ?? '—'}</div>

          <div className="mt-4 text-sm text-muted-foreground">Barcode</div>
          <div className="mt-1 text-sm">{p.barcode ?? '—'}</div>
        </div>

        <div className="p-4 border rounded">
          <div className="text-sm text-muted-foreground">Description</div>
          <div className="mt-1 text-sm">{p.description ?? '—'}</div>

          <div className="mt-4 text-sm text-muted-foreground">Image</div>
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} className="mt-2 max-w-full h-auto rounded" />
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">No image</div>
          )}
        </div>
      </div>

      {Array.isArray(p.variants) && p.variants.length > 0 && (
        <div className="mt-6 p-4 border rounded">
          <h2 className="text-lg font-medium mb-2">Variants</h2>
          <div className="space-y-3">
            {p.variants.map((v: any, idx: number) => (
              <div key={idx} className="p-3 border rounded">
                <div className="text-sm text-muted-foreground">Barcode</div>
                <div className="mt-1 text-sm font-mono">{v.barcode ?? '—'}</div>

                <div className="mt-2 text-sm text-muted-foreground">Weights</div>
                <div className="mt-1 text-sm">Actual: {v.actualWeightKg ?? 0} kg • Volumetric: {v.volumetricWeightKg ?? 0} kg</div>

                {Array.isArray(v.images) && v.images.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground">Images</div>
                    <div className="mt-2 flex gap-2">
                      {v.images.map((img: any, i: number) => (
                        <img key={i} src={img.imageUrl} alt={`variant-${idx}-img-${i}`} className="w-20 h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
