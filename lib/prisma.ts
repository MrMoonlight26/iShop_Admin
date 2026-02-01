// Stub Prisma for frontend-only mode
// This file satisfies imports during build. If any server route attempts to use
// Prisma at runtime, it will throw a clear error directing developers to use
// the external backend instead.

const handler: ProxyHandler<any> = {
  get() {
    return () => {
      throw new Error(
        'Prisma client is not available in this frontend-only build. Use the external backend API instead.'
      );
    };
  },
};

export const prisma = new Proxy({}, handler);
