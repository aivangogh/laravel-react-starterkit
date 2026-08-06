# Security Policy

## Supported Versions

Only the latest release line receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, report them privately via GitHub's security advisory feature:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability** to open a private advisory.
3. Include as much detail as possible: affected version, steps to reproduce, impact, and any suggested fix.

Alternatively, you can email the maintainer at **krmediante27@gmail.com** with the subject line `[SECURITY] laravel-vue-starterkit`.

### What to expect

- **Acknowledgement** within 72 hours of your report.
- **Status updates** at least once a week while the report is being investigated.
- If the vulnerability is **accepted**, we will work on a fix, credit you in the release notes (unless you prefer to stay anonymous), and publish a security advisory once a patched version is available.
- If the vulnerability is **declined**, we will explain why.

### Scope

This policy covers the code in this repository: the Laravel API (`backend/`), the Vue SPA (`apps/web/`), shared packages (`packages/`), and the `create-laravel-vue-starterkit` scaffolder published to npm. Vulnerabilities in upstream dependencies (Laravel, Vue, etc.) should be reported to their respective maintainers.
