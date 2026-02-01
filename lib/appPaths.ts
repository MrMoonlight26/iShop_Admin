export function getBasePath(): string {
  const p = process.env.NEXT_PUBLIC_BASE_PATH || ''
  if (!p) return ''
  return `/${String(p).replace(/^\/+|\/+$/g, '')}`
}

export function signinPath(): string {
  const base = getBasePath()
  return `${base}/signin`.replace(/\/+/g, '/')
}

export default { getBasePath, signinPath }
