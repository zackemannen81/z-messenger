# ZM-0002 — Initial Messenger Implementation

Status: Ready
Owner: Unassigned
Created: 2026-09-23
Source: `docs/concepts_sandbox/messenger_application_devplan.md`

## Goal

Deliver a locally runnable real-time messenger with a WebSocket server and a polished browser client.

## Primary Deliverable

An application that supports unique username joins, live presence, broadcast and direct messages, nudges, and disconnect handling.

## In Scope

- Establish the project runtime, dependency manifest, and local run instructions.
- Implement a WebSocket server with session ownership, validation, presence, routing, and safe error handling.
- Implement the browser client with login, contact selection, messages, nudge feedback, and a high-quality Apple-inspired interface.
- Implement verification for the protocol's key success and failure paths.

## Out of Scope

- Persistent accounts, chat storage, or authentication credentials.
- File transfer, group rooms, message history, read receipts, or production hosting.

## Definition of Done

- Multiple clients can connect with unique valid usernames.
- Presence, broadcast messages, private messages, nudges, and disconnects propagate correctly.
- Invalid JSON, duplicate usernames, unauthenticated requests, and unavailable recipients return errors without crashing the server.
- Local setup and verification instructions are documented.

## Minimum Verification Gates

- [ ] Automated server tests cover the protocol success and error paths.
- [ ] Manual multi-client verification covers the functional scenarios in the source plan.
- [ ] Build, lint, and test commands provided by the project succeed.
