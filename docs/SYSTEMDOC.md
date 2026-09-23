# System Document

## Current Reality

z-messenger is a Node.js 20+ application launched by `npm start`. `server.js` serves the browser client from `public/` and attaches a `ws` WebSocket server to the same HTTP port (8080 by default, overridable with `PORT`). It retains only an in-memory map of live WebSocket sessions to usernames; chats are ephemeral.

## Protocol

Every outgoing server frame includes `type`, `payload`, and `timestamp`. Client frames must be JSON objects with a type and object payload.

- `JOIN` accepts a unique, case-insensitive username of 2–24 permitted characters, then emits `JOIN_ACK`, `USER_LIST`, and `USER_JOINED` to others.
- `CHAT_MESSAGE` accepts a 1–2,000-character message. `recipient: "ALL"` broadcasts it; a named recipient receives a private message and the sender receives the echo.
- `NUDGE` broadcasts a notification to current sessions.
- `USER_LEFT` follows a disconnected joined session.
- Invalid JSON, invalid frames, invalid or duplicate names, unauthenticated actions, invalid messages, unavailable recipients, and unknown actions receive `ERROR` without ending the server.

The server derives sender identity and timestamps and never trusts either from a client.

## Client Experience

The accessible responsive client has a sign-in view, availability/contact sidebar, conversation targeting, message composer, live system events, non-blocking error toast, sign-out action, and nudge animation. It uses semantic buttons, labels, keyboard form submission, and text-content rendering for remote message text.

## Verification

`npm run lint` runs syntax checks. `npm test` runs WebSocket integration coverage for group/presence/disconnect behavior, private-message isolation, and protocol error paths. Manual local verification is performed by opening multiple windows at `http://localhost:8080`.