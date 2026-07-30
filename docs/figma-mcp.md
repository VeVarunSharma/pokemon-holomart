# Optional Figma MCP setup

Figma is optional. The reliable demo path is the committed local design context; this repository does not commit or enable MCP configuration.

## Official references

- [Figma MCP developer documentation](https://developers.figma.com/docs/figma-mcp-server/)
- [Remote server installation](https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/)
- [Tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)

The official remote endpoint is documented by Figma as `https://mcp.figma.com/mcp`. Confirm it independently before setup. Do not add repository-scoped MCP configuration.

## Guided setup

Before the event:

1. Review Figma documentation and your organization’s MCP policy.
2. Use the client’s interactive add-server flow and prefer user-scoped configuration.
3. Complete browser authorization yourself and verify the account, file permission, scopes, and data policy.
4. Test read access with a non-sensitive demo selection.
5. Confirm no comment or write action is enabled for the session.

Never paste OAuth tokens, access tokens, private file content, customer data, or credentials into chat or repository files.

## Read-only prompts

```text
Using only this pre-authorized Figma selection, summarize layout, components, variables, and interaction states relevant to HoloMart Saved Searches and card listings. Do not modify Figma or infer unseen frames: <PASTE SELECTION URL>
```

```text
Compare the supplied selection with design/saved-searches-ux-brief.md and app/app.js. Review keyboard, screen-reader, 320 px/400% reflow, listing trust context, empty/loading/error/recovery states, and local-only copy.
```

## Local fallback

Use:

- `design/local-design-context.json`
- `design/saved-searches-ux-brief.md`
- `design/tokens.json`
- `.github/prompts/figma-ux-review.prompt.md`

```text
/figma-ux-review Review HoloMart Saved Searches using only the committed local design fallback. Mark unverifiable visual judgments unknown.
```
