# Project Brief

Status: Active product direction.

## Purpose

z-messenger is a lightweight, real-time web instant messenger with the familiar conversational feel of classic MSN Messenger and the visual polish of a native Apple application.

## Product Scope

The first release provides ephemeral, WebSocket-based messaging for connected users:

- unique username registration;
- live presence and contact-list updates;
- messages to everyone or one selected user;
- nudge notifications with a client animation; and
- graceful handling of disconnects and malformed or invalid requests.

Messages are not persistently stored. The server is a small routing and session-management hub.

## Product Source

`docs/concepts_sandbox/messenger_application_devplan.md` is the initial product and protocol specification. It is reference material; durable decisions and delivered behavior belong in this docs-first control plane.
