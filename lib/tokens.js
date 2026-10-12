import crypto from 'crypto';

// Invite links carry a random token. Only its hash is stored in the database.
export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const hashToken = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
