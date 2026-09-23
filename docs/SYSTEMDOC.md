# System Document

## Current Reality

No application code has been implemented. The repository currently contains only the docs-first control plane and the source development plan.

## Planned System

The intended system is a browser client connected to a WebSocket server over `ws://` during local development, with `wss://` supported for secure deployment. The server owns transient sessions, username uniqueness, presence, and message routing; it does not persist chat history.

### Protocol

Protocol frames are JSON objects with `type`, `payload`, and (where applicable) a timestamp. The planned operations are:

- `JOIN` / `JOIN_ACK` / `ERROR` for registration and validation;
- `USER_LIST`, `USER_JOINED`, and `USER_LEFT` for presence;
- `CHAT_MESSAGE` for broadcast and private delivery; and
- `NUDGE` for a broadcast action notification.

The server derives the sender from the registered session rather than trusting a client-supplied sender value.

### Client Experience

The client will provide a username entry screen, live contact list, broadcast and direct-message selection, conversation view, send input, and nudge feedback. The design target is a polished native Apple-app feel, not the reference page's basic styling.
