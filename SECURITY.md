# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us at: **security@nanalyzer.dev**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Principles

### Privacy-First Design

nAnalyzer is built with privacy at its core:

1. **Local Processing**: All audio and ML processing happens on your device
2. **No Cloud Dependencies**: Core functionality works completely offline
3. **No Data Collection**: We don't collect or transmit user data
4. **Encrypted Storage**: All stored data is encrypted at rest (AES-256)

### Data Handling

- **Audio Files**: Automatically deleted after configurable retention period (default: 7 days)
- **Transcripts**: Stored locally with optional PII redaction
- **Analysis Results**: Stored locally, never transmitted
- **User Credentials**: Hashed with bcrypt, never stored in plain text

### Secure Communication

- WebSocket connections use WSS (encrypted) in production
- API authentication via JWT tokens with short expiration
- HTTPS required for all web traffic in production
- CORS properly configured to prevent unauthorized access

## Supported Versions

We release security updates for:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Best Practices for Users

### Installation

1. **Verify Downloads**: Check checksums for downloaded models
2. **Use Virtual Environment**: Install Python dependencies in isolated environment
3. **Review Dependencies**: Audit third-party packages periodically

### Configuration

1. **Change Default Secrets**: Update `JWT_SECRET_KEY` in production
2. **Enable PII Redaction**: Turn on automatic PII detection and redaction
3. **Configure Auto-Delete**: Set appropriate audio file retention period
4. **Use Strong Passwords**: If enabling multi-user authentication

### Deployment

1. **HTTPS Only**: Use TLS certificates in production
2. **Firewall Rules**: Restrict access to backend API
3. **Regular Updates**: Keep dependencies and models up to date
4. **Monitor Logs**: Review audit logs for suspicious activity

## Known Security Considerations

### Local Storage

- Audio files and transcripts are stored unencrypted by default
- Enable encryption in settings for sensitive data
- Use full-disk encryption (FileVault, BitLocker, etc.)

### Model Security

- ML models are downloaded from trusted sources
- Verify model checksums before use
- Models are not sandboxed - malicious models could execute code

### Multi-User Deployments

- Shared deployments require proper access controls
- Implement RBAC for team environments
- Use separate databases per team/organization

## Security Audit History

- **2025-01-05**: Initial security review (v0.1.0)
- No known vulnerabilities at this time

## Contact

For security-related questions or concerns:
- Email: security@nanalyzer.dev
- GPG Key: [Available on request]

Thank you for helping keep nAnalyzer secure! 🔒
