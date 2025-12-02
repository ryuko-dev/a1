# Security Notice

Date: 2025-12-02

Vulnerability: High severity issues found in the `xlsx` package (direct dependency).

Details:
- Prototype Pollution in sheetJS (affects `xlsx` versions < 0.19.3).
- Regular Expression Denial of Service (ReDoS) (affects `xlsx` versions < 0.20.2).

Repository decision:
- After evaluation, the project maintainer opted to *retain* `xlsx@^0.18.5` for now.
- Rationale: current usage in the codebase is limited to client-side Excel file generation (writing), and upgrading may require code changes or behavior checks.

Mitigations in place / recommended:
- Avoid parsing untrusted Excel files. Do not accept or process Excel files from untrusted sources.
- Prefer exporting (writing) Excel files on the client only; server-side parsing of uploaded Excel files is disabled unless explicitly reviewed.
- Monitor releases of `xlsx` and upgrade as soon as a patched release is available.
- Add automated `npm audit` checks to CI and treat high/critical findings as blockers.
- If Excel parsing is needed in future, prefer safer libraries or robust input validation/sanitization.

Contact:
- If you discover a security issue or have concerns, open an issue in this repository and tag @ryuko-dev.
