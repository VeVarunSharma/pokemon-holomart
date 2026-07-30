# Optional Figma MCP guided setup

Figma is an optional design-context path, not a prerequisite. This repository intentionally does **not** commit or enable MCP configuration, and these instructions do not authenticate on your behalf. The stage-safe default is the committed local design fallback.

## Official references

- [Figma MCP developer documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Remote server installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma Help Center guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Official Figma MCP guide repository](https://github.com/figma/mcp-server-guide)

Discovery metadata for a compatible client may be read from:

```text
https://api.mcp.github.com/v0.1/servers/com.figma.mcp%2Fmcp/versions/latest
```

The official remote Streamable HTTP endpoint is documented as:

```text
https://mcp.figma.com/mcp
```

These URLs are documentation, **not committed configuration**. Do not add `.vscode/mcp.json` (or another MCP config) to this repository.

## Guided setup

Do this before the event, in an approved Copilot/MCP client:

1. Read the official remote-installation guide and your organization’s MCP policy.
2. Review the registry entry and publisher/endpoint details. An Agent Finder score of **90 means relevance only**—it is not a trust, privacy, security, or safety rating.
3. Use the client’s interactive “add MCP server” flow. Prefer user-scoped configuration unless your organization requires otherwise; do not save configuration in this repository.
4. Enter the official remote endpoint only after independently confirming it against Figma’s documentation.
5. Complete Figma’s browser authorization yourself. Check the account, workspace/file permission, requested scopes, plan/rate limits, and organization policy before consenting.
6. Verify read access with a non-sensitive demo file and a copied link to a specific selection.
7. Confirm no write/comment operation is enabled or requested for this session. Disconnect or disable the server after rehearsal if it is not needed.

Never paste OAuth tokens, personal access tokens, private file content, customer data, or credentials into chat or repository files. MCP exposes context to the selected client/model under applicable provider and organizational policies; verify data handling and retention before using confidential designs. Existing Figma access controls still matter, but authentication is not proof that content is appropriate to share.

## Read-only demo prompts

After authentication and permission are explicitly confirmed:

```text
Using only this pre-authorized Figma selection URL, summarize layout, components, variables, and interaction states relevant to Saved Views. Do not modify Figma, write comments, or infer unseen frames. Mark missing states unknown: <PASTE SELECTION URL>
```

```text
Compare the supplied Figma selection with design/saved-views-ux-brief.md and app/app.js. Cite the selection and repository path:line evidence. Review keyboard, screen-reader, 320 px/400% reflow, empty/loading/error/recovery, and local-only copy. Preview findings only.
```

Do not claim the connection is active until the client shows it and a human confirms the account/file. Do not use a generic file URL when a permitted selection link is sufficient.

## Local design fallback

If setup, authentication, permissions, rate limits, privacy review, or network access is uncertain, say so and use:

- `design/local-design-context.json`
- `design/saved-views-ux-brief.md`
- `design/tokens.json`
- `.github/prompts/figma-ux-review.prompt.md`

Paste:

```text
/figma-ux-review Review Saved Views using only the committed local design fallback. Do not assume Figma access, and mark unverifiable visual judgments unknown.
```

This path is complete for the conference story and requires no external authentication.
