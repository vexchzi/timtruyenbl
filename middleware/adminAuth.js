/**
 * Admin auth middleware (no user accounts).
 *
 * Security model:
 * - Admin endpoints require a secret token configured in environment: ADMIN_TOKEN
 * - Client must send header: X-Admin-Token: <token>
 *
 * This is intentionally simple and works well for "only me can access" use-cases,
 * as long as the token is kept secret.
 */

function requireAdminToken(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;

  // If no token configured, disable admin endpoints by default.
  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'Admin disabled',
      message: 'ADMIN_TOKEN is not configured on server.'
    });
  }

  const provided =
    req.get('x-admin-token') ||
    req.get('X-Admin-Token') ||
    req.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';

  if (provided && provided === expected) return next();

  return res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Missing or invalid admin token.'
  });
}

module.exports = { requireAdminToken };

