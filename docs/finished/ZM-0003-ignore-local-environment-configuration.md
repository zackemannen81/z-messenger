# ZM-0003 — Ignore Local Environment Configuration

Status: Complete
Owner: Rickard
Created: 2026-09-23
Completed: 2026-09-23

## Outcome

Added a root `.gitignore` that excludes `.env.local` from Git tracking.

## Verification

- Confirmed `git check-ignore -v --no-index .env.local` reports the root `.gitignore` rule.
- Commit and push pending.
