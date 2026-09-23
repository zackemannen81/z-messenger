# z-messenger

A polished, ephemeral real-time messenger for local use. It provides unique-name sign-in, live presence, group and private messaging, and nudges over WebSockets. No messages or accounts are persisted.

## Requirements

- Node.js 20 or later

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:8080` in two or more browser windows and join with different names. For automatic server restarts during development, run `npm run dev`.

## Quality checks

```bash
npm run lint
npm test
```

The integration tests exercise joins, live presence, group messages, private-message isolation, disconnects, malformed JSON, unauthenticated use, duplicate names, and unavailable recipients.

## Protocol

The browser and server exchange JSON WebSocket frames. `JOIN`, `CHAT_MESSAGE`, and `NUDGE` are client actions. `JOIN_ACK`, `USER_LIST`, `USER_JOINED`, `USER_LEFT`, `CHAT_MESSAGE`, `NUDGE`, and `ERROR` are server events. Sender identity and message timestamps are assigned by the server.