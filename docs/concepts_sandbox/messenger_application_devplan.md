Technical Specification & Development Document
Generic Minimal Instant Messenger (MSN-Style) Application
1. Executive Summary
This document provides a complete technical specification and architectural plan for a lightweight, real-time Instant Messenger (IM) application inspired by classic messaging tools (such as MSN Messenger). The solution consists of a Minimal WebSocket Server and a Basic Web Chat Client.

2. System Architecture
┌─────────────────────────────────────────┐
│               Web Browser               │
│  ┌───────────────────────────────────┐  │
│  │    Frontend Client (HTML/CSS/JS)  │  │
│  └─────────────────┬─────────────────┘  │
└────────────────────┼────────────────────┘
                     │  WebSocket (ws://)
                     ▼
┌─────────────────────────────────────────┐
│            WebSocket Server             │
│  ┌───────────────────────────────────┐  │
│  │   Connection & Session Manager    │  │
│  └─────────────────┬─────────────────┘  │
│  ┌─────────────────▼─────────────────┐  │
│  │    Message Router & Relay         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
Architectural Principles
Real-time Bidirectional Communication: Low-latency message transmission over a persistent TCP connection via WebSockets.

Stateless Message Routing: Server acts as a hub, handling authentication/identification, presence tracking, and routing without persistent chat storage (ephemeral messaging).

Minimal Dependencies: Built using core language standards and lightweight WebSocket libraries to maximize portability.

3. Communication Protocol Specification
All communication between the client and server occurs via JSON payloads over standard WebSocket connections (ws:// or wss://).

Message Frame Schema
JSON
{
  "type": "MESSAGE_TYPE",
  "payload": { ... },
  "timestamp": 1690000000000
}
Protocol Operations
1. Join / Authentication (JOIN)
Sent by the client upon establishing a WebSocket connection to register a username.

Client Request:

JSON
{
  "type": "JOIN",
  "payload": {
    "username": "Alice"
  }
}
Server Response (Success):

JSON
{
  "type": "JOIN_ACK",
  "payload": {
    "status": "SUCCESS",
    "username": "Alice"
  }
}
Server Response (Error - Name Taken / Invalid):

JSON
{
  "type": "ERROR",
  "payload": {
    "message": "Username already taken or invalid."
  }
}
2. Presence Updates (USER_LIST, USER_JOINED, USER_LEFT)
User List Broadcast (to newly connected user):

JSON
{
  "type": "USER_LIST",
  "payload": {
    "users": ["Alice", "Bob", "Charlie"]
  }
}
User Joined Broadcast (to existing users):

JSON
{
  "type": "USER_JOINED",
  "payload": {
    "username": "David"
  }
}
User Left Broadcast:

JSON
{
  "type": "USER_LEFT",
  "payload": {
    "username": "David"
  }
}
3. Chat Messages (CHAT_MESSAGE)
Client Broadcast Message:

JSON
{
  "type": "CHAT_MESSAGE",
  "payload": {
    "recipient": "ALL",
    "text": "Hello world!"
  }
}
Client Direct Message (Private):

JSON
{
  "type": "CHAT_MESSAGE",
  "payload": {
    "recipient": "Bob",
    "text": "Hey Bob, got a minute?"
  }
}
Server Relay Message:

JSON
{
  "type": "CHAT_MESSAGE",
  "payload": {
    "sender": "Alice",
    "recipient": "Bob",
    "text": "Hey Bob, got a minute?",
    "timestamp": 1690000000000
  }
}
4. Classic MSN Actions (Optional / Extended)
Nudge / Action (NUDGE):

JSON
{
  "type": "NUDGE",
  "payload": {
    "sender": "Alice",
    "recipient": "ALL"
  }
}
4. Implementation Details
Option A: Node.js Reference Implementation
1. Server (server.js)
Requires ws package (npm install ws).

JavaScript
const WebSocket = require('ws');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

// Active sessions: Map<WebSocket, string>
const clients = new Map();

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (err) {
      sendError(ws, "Invalid JSON format");
    }
  });

  ws.on('close', () => {
    const username = clients.get(ws);
    if (username) {
      clients.delete(ws);
      broadcast({
        type: 'USER_LEFT',
        payload: { username }
      });
    }
  });
});

function handleMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'JOIN': {
      const username = payload.username ? payload.username.trim() : '';
      if (!username || Array.from(clients.values()).includes(username)) {
        return sendError(ws, "Username invalid or already taken.");
      }

      clients.set(ws, username);

      // Acknowledge join
      send(ws, { type: 'JOIN_ACK', payload: { status: 'SUCCESS', username } });

      // Send existing user list to new user
      send(ws, { type: 'USER_LIST', payload: { users: Array.from(clients.values()) } });

      // Notify others
      broadcast({ type: 'USER_JOINED', payload: { username } }, ws);
      break;
    }

    case 'CHAT_MESSAGE': {
      const sender = clients.get(ws);
      if (!sender) return sendError(ws, "Unauthenticated client.");

      const msgPayload = {
        sender,
        recipient: payload.recipient || 'ALL',
        text: payload.text,
        timestamp: Date.now()
      };

      if (payload.recipient && payload.recipient !== 'ALL') {
        // Direct Message
        let delivered = false;
        for (const [clientWs, clientName] of clients.entries()) {
          if (clientName === payload.recipient) {
            send(clientWs, { type: 'CHAT_MESSAGE', payload: msgPayload });
            delivered = true;
            break;
          }
        }
        if (delivered) {
          // Echo back to sender
          send(ws, { type: 'CHAT_MESSAGE', payload: msgPayload });
        } else {
          sendError(ws, `User ${payload.recipient} not found.`);
        }
      } else {
        // Broadcast to all
        broadcast({ type: 'CHAT_MESSAGE', payload: msgPayload });
      }
      break;
    }

    case 'NUDGE': {
      const sender = clients.get(ws);
      if (!sender) return sendError(ws, "Unauthenticated client.");
      broadcast({ type: 'NUDGE', payload: { sender } });
      break;
    }

    default:
      sendError(ws, "Unknown action type.");
  }
}

function send(ws, msg) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(msg, excludeWs = null) {
  const data = JSON.stringify(msg);
  for (const [ws] of clients.entries()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function sendError(ws, message) {
  send(ws, { type: 'ERROR', payload: { message } });
}
2. Web Client (index.html)
This is a basic concept of the client, the actual client interface should be visually polished and the application user experience needs to be the same as a high tier finished application.
Graphics should be top design together with the disposition of all elements. 
It should look and feel like a genuine native Apple app.
HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Minimal Messenger</title>
  <style>
    * { box-sizing: border-box; font-family: Tahoma, Segoe UI, sans-serif; }
    body { background: #eef2f5; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    #app { width: 700px; height: 500px; background: #fff; border: 1px solid #ccc; display: flex; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    
    /* Login Screen */
    #login-screen { position: absolute; width: 700px; height: 500px; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; z-index: 10; }
    
    /* Chat UI Layout */
    #sidebar { width: 200px; border-right: 1px solid #ddd; background: #f7f9fa; padding: 10px; display: flex; flex-direction: column; }
    #user-list { list-style: none; padding: 0; margin: 10px 0 0 0; flex: 1; overflow-y: auto; }
    #user-list li { padding: 6px; cursor: pointer; border-radius: 4px; font-size: 14px; }
    #user-list li.selected { background: #0078d7; color: white; }
    
    #main-chat { flex: 1; display: flex; flex-direction: column; }
    #messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .msg { font-size: 14px; }
    .msg .sender { font-weight: bold; color: #0078d7; }
    .msg .time { font-size: 10px; color: #888; margin-left: 5px; }
    .system-msg { font-style: italic; color: #777; font-size: 12px; }
    
    #input-area { padding: 10px; border-top: 1px solid #ddd; display: flex; gap: 5px; }
    #input-area input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 3px; }
    #input-area button { padding: 8px 12px; border: none; background: #0078d7; color: white; cursor: pointer; border-radius: 3px; }
    #nudge-btn { background: #d9534f !important; }
    
    /* Nudge Animation */
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      40% { transform: translate(1px, -1px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      80% { transform: translate(1px, 1px) rotate(1deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .shake { animation: shake 0.5s; }
  </style>
</head>
<body>

<div id="app">
  <!-- Login Overlay -->
  <div id="login-screen">
    <h2>Minimal Messenger</h2>
    <input type="text" id="username-input" placeholder="Enter username..." />
    <button onclick="login()">Connect</button>
  </div>

  <!-- Sidebar -->
  <div id="sidebar">
    <h3>Contacts</h3>
    <ul id="user-list">
      <li class="selected" onclick="selectRecipient('ALL')"> Broadcast (ALL)</li>
    </ul>
  </div>

  <!-- Main Chat Window -->
  <div id="main-chat">
    <div id="messages"></div>
    <div id="input-area">
      <button id="nudge-btn" onclick="sendNudge()">Nudge!</button>
      <input type="text" id="message-input" placeholder="Type a message..." onkeypress="handleKeyPress(event)" />
      <button onclick="sendMessage()">Send</button>
    </div>
  </div>
</div>

<script>
  let ws;
  let currentUser = '';
  let selectedRecipient = 'ALL';
  let users = [];

  function login() {
    const input = document.getElementById('username-input');
    const username = input.value.trim();
    if (!username) return alert('Please enter a username');

    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JOIN', payload: { username } }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerEvent(data);
    };

    ws.onclose = () => {
      appendSystemMessage("Disconnected from server.");
    };
  }

  function handleServerEvent(data) {
    const { type, payload } = data;

    switch (type) {
      case 'JOIN_ACK':
        currentUser = payload.username;
        document.getElementById('login-screen').style.display = 'none';
        appendSystemMessage(`Connected as ${currentUser}`);
        break;

      case 'USER_LIST':
        users = payload.users;
        renderUserList();
        break;

      case 'USER_JOINED':
        if (!users.includes(payload.username)) users.push(payload.username);
        renderUserList();
        appendSystemMessage(`${payload.username} has logged in.`);
        break;

      case 'USER_LEFT':
        users = users.filter(u => u !== payload.username);
        renderUserList();
        appendSystemMessage(`${payload.username} has logged out.`);
        break;

      case 'CHAT_MESSAGE':
        appendChatMessage(payload);
        break;

      case 'NUDGE':
        triggerNudge(payload.sender);
        break;

      case 'ERROR':
        alert(payload.message);
        break;
    }
  }

  function renderUserList() {
    const list = document.getElementById('user-list');
    list.innerHTML = `<li class="${selectedRecipient === 'ALL' ? 'selected' : ''}" onclick="selectRecipient('ALL')">📢 Broadcast (ALL)</li>`;
    
    users.forEach(user => {
      if (user !== currentUser) {
        const li = document.createElement('li');
        li.innerText = `👤 ${user}`;
        if (selectedRecipient === user) li.classList.add('selected');
        li.onclick = () => selectRecipient(user);
        list.appendChild(li);
      }
    });
  }

  function selectRecipient(user) {
    selectedRecipient = user;
    renderUserList();
  }

  function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text || !ws) return;

    ws.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      payload: { recipient: selectedRecipient, text }
    }));

    input.value = '';
  }

  function sendNudge() {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'NUDGE', payload: {} }));
  }

  function triggerNudge(sender) {
    appendSystemMessage(`${sender} sent a NUDGE!`);
    const app = document.getElementById('app');
    app.classList.add('shake');
    setTimeout(() => app.classList.remove('shake'), 500);
  }

  function appendChatMessage(msg) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'msg';
    
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const directTag = msg.recipient !== 'ALL' ? ' (Private)' : '';
    
    div.innerHTML = `<span class="sender">${msg.sender}${directTag}:</span> ${escapeHtml(msg.text)} <span class="time">${time}</span>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function appendSystemMessage(text) {
    const container = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
  }

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
</script>

</body>
</html>
5. Verification & Testing Plan
1. Functional Verification
Multi-Client Connection: Open multiple browser tabs navigating to index.html. Connect with unique usernames (UserA, UserB). Verify user lists update in real time across all windows.

Global Broadcasting: Send a broadcast message from UserA. Confirm UserB receives it.

Private Messaging: Select UserB from UserA's contact list and send a message. Verify UserC (a third client) does not receive the message.

Nudge Action: Click the Nudge! button on UserA. Verify screen animation plays on all connected clients.

Disconnection Handling: Close the browser tab for UserA. Verify UserB receives a logout notification and UserA is removed from the active contact list.

2. Edge Case Handling
Duplicate Username: Attempt to join with an already registered username. Ensure the server rejects the connection with a descriptive error.

Empty Payload / Invalid JSON: Send malformed strings over WebSocket using dev tools. Ensure the server catches the exception without crashing.