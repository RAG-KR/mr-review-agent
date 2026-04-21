# Security Checklist

## Common Vulnerabilities to Check

### Injection Attacks
- **SQL Injection**: Use parameterized queries, never concatenate user input into SQL
- **XSS (Cross-Site Scripting)**: Sanitize and escape user input before rendering
- **Command Injection**: Validate and sanitize inputs to shell commands

### Authentication & Authorization
- Check that authentication is required for protected routes
- Verify authorization checks are in place
- Ensure password policies are followed
- Check for proper session management

### Data Protection
- **No Hardcoded Secrets**: API keys, passwords, tokens should use environment variables
- **Sensitive Data**: Don't log sensitive information (passwords, tokens, PII)
- **Input Validation**: Validate all user inputs on the server side
- **HTTPS Only**: Ensure external API calls use HTTPS

### Dependencies
- Check for known vulnerabilities in dependencies
- Keep dependencies up-to-date
- Avoid using deprecated or unmaintained packages

### General Security
- Implement proper rate limiting
- Use secure random number generators
- Validate file uploads (type, size, content)
- Sanitize outputs to prevent XSS
