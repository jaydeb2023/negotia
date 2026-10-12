// Tiny helpers so every API route handles methods and errors the same way.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const fail = (status, message) => {
  throw new HttpError(status, message);
};

// route({ GET: fn, POST: fn }) -> a Next.js API handler.
export function route(handlers) {
  return async function handler(req, res) {
    const fn = handlers[req.method];
    if (!fn) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
      console.error(`[${req.method} ${req.url}]`, err);
      res.status(500).json({ error: 'Server error' });
    }
  };
}
