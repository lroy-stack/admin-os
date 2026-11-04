# Contributing to admin-OS

Thank you for helping. This page is the workflow; the code conventions are in [`AGENTS.md`](AGENTS.md), which people
and coding agents follow alike, and the guides are in [`docs/`](docs/README.md).

## Before you start

- For a bug, open an [issue](https://github.com/lroy-stack/admin-os/issues) with the steps, what you expected, what
  happened, and the preset, role, viewport and browser.
- For a feature or a larger change, open an issue first, so the approach is agreed before the code. A new screen
  pattern, window type, token or dependency needs that conversation: the design rules and the layers are settled
  ([`AGENTS.md`](AGENTS.md), [Architecture](docs/guides/architecture.md)).
- To report a vulnerability, follow [`SECURITY.md`](SECURITY.md); do not open a public issue.

## Set up

Fork the repository, clone your fork and follow the [development guide](docs/guides/development.md):

```bash
git clone https://github.com/<your-user>/admin-os.git
cd admin-os
npm install
npm run dev
```

## Make the change

- Branch from `main`: `feat/<topic>`, `fix/<topic>` or `docs/<topic>`.
- Keep a commit to one concern, with a [Conventional Commits](https://www.conventionalcommits.org/) message:
  `feat(bookings): …`, `fix(ds): …`, `docs: …`, `test: …`, `ci: …`, `chore: …`.
- A bug fix starts with a test that fails without it.
- Follow the paths in [Building on the template](docs/guides/extending.md) for modules, presets, controls, adapters
  and MCP tools.

## Check it

These must pass before you push; CI runs them on every pull request.

```bash
npm run check
npx tsc --noEmit
npm test
```

Also run, when they apply:

| When you change… | Run |
| --- | --- |
| the shell, routing or how a screen loads | `npm run test:e2e` |
| what a screen looks like | `npm run media`, and commit the regenerated images in `media/` |
| a capability or the MCP manifest | `npm run mcp:reference`, before `npm test` |

The pre-commit hook runs Biome on the staged files and the layer rules; fix what it reports rather than bypassing it.

## Open the pull request

- Say what changed, why, and how you verified it (the commands and their result).
- For a visible change, add screenshots at phone and desktop width, in light and dark.
- Link the issue it closes.
- Keep it focused: a refactor that the change does not need belongs in its own pull request.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).
