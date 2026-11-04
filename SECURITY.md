# Security policy

## Supported versions

Security fixes go into `main` and the latest release.

| Version | Supported |
| --- | --- |
| 0.2.x | Yes |
| Earlier | No |

## Reporting a vulnerability

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**.
Please do not open a public issue or pull request for it.

Include what is affected (the web app, the demo store Worker, the MCP Worker and its OAuth flow, or the deploy
scripts), the steps to reproduce it, and the impact you expect. The report stays private while it is being fixed, and
you will be credited in the advisory unless you ask otherwise.

## What is expected behaviour

The public demo runs on the mock adapter with seeded data, and some of its openness is deliberate:

- The demo MCP tokens (`demo-owner-token`, `demo-manager-token`, `demo-staff-token`) are public and read-only.
- Each visitor's demo data is a copy of the seed, isolated per session and reset on request.

A way around those limits, such as writing with a public token, reading another visitor's session, or acting beyond
an OAuth grant's scopes, is a vulnerability and worth reporting.
