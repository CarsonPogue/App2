# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in MOOVE, please report it privately to the maintainers. **Do not create a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: security@themoove.app (or contact the maintainers directly)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within 48 hours and provide a detailed response within 7 days.

## Security Best Practices

### For Users

1. **Never share your authentication tokens**
2. **Use strong, unique passwords**
3. **Enable two-factor authentication when available**
4. **Report suspicious activity immediately**

### For Developers

#### Environment Variables

- **NEVER commit `.env` files** - They are in `.gitignore` for a reason
- **NEVER hardcode secrets** - Always use environment variables
- **Use strong secrets** - JWT secrets must be at least 32 characters
- **Rotate secrets regularly** - Especially in production

#### Code Security

- **Validate all input** - Use Zod or similar validation libraries
- **Sanitize output** - Prevent XSS attacks
- **Use parameterized queries** - Prevent SQL injection
- **Implement rate limiting** - Prevent brute force attacks
- **Use HTTPS** - Never transmit secrets over HTTP

#### API Security

- **Authenticate all protected routes**
- **Implement proper authorization** - Check user permissions
- **Use short-lived tokens** - Access tokens expire in 15 minutes
- **Implement refresh token rotation**
- **Log security events** - Track authentication attempts

#### Database Security

- **Use strong passwords** - Never use default credentials
- **Limit database access** - Use principle of least privilege
- **Encrypt sensitive data** - Passwords are hashed with bcrypt
- **Regular backups** - Implement backup and recovery procedures

#### Third-Party APIs

- **Restrict API keys** - Limit keys to specific domains/IPs
- **Monitor API usage** - Detect unusual patterns
- **Use server-side calls** - Never expose API keys to clients

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Checklist for Deployment

Before deploying to production, ensure:

- [ ] All secrets are stored in environment variables or a secrets manager
- [ ] JWT secrets are at least 64 characters and randomly generated
- [ ] Database passwords are strong and unique
- [ ] HTTPS is enabled for all traffic
- [ ] CORS is configured to allow only trusted origins
- [ ] Rate limiting is enabled
- [ ] Error messages don't expose sensitive information
- [ ] Logging doesn't include sensitive data
- [ ] Dependencies are up to date
- [ ] Security headers are configured (Helmet.js)
- [ ] Input validation is implemented for all endpoints
- [ ] File uploads are validated and sanitized
- [ ] Authentication tokens are stored securely

## Security Headers

The backend automatically sets these security headers via Helmet.js:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (in production)
- `Content-Security-Policy`

## Dependency Security

We use automated tools to scan for vulnerabilities:

- **npm audit** - Run regularly to check for known vulnerabilities
- **Trivy** - Container vulnerability scanning in CI/CD
- **TruffleHog** - Scan for accidentally committed secrets

To check for vulnerabilities locally:

```bash
# Backend
cd backend && npm audit

# Mobile
cd mobile && npm audit
```

## Incident Response

In case of a security incident:

1. **Contain** - Isolate affected systems
2. **Assess** - Determine the scope and impact
3. **Remediate** - Fix the vulnerability
4. **Communicate** - Notify affected users if necessary
5. **Review** - Conduct a post-incident review
