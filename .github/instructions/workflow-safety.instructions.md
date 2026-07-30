---
applyTo: ".github/**,scripts/**,docs/**"
---

# Product workflow safety

- Keep generators deterministic and dry-run by default. A draft is not authorization to write remotely.
- Show the exact proposed external change and require explicit human review before issue, Project, PR, or integration writes.
- Do not add secrets, real integration endpoints, MCP configuration, or real customer content.
- Validate inputs and fail with actionable errors; use Node built-ins unless the repository already provides a dependency.
- When workflow text asserts repository behavior, include `path:line` evidence or mark it as an assumption/unknown.
