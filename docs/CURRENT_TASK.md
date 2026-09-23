# Current Task

# ZM-0006 — Add Message File Attachments

Status: Complete
Owner: Agent 008
Created: 2026-09-24

## Goal

Allow users to attach a small file to a group or private message.

## Done when

- The composer provides an accessible file chooser and shows the selected filename.
- A message can contain text, one attachment, or both.
- The server validates attachment metadata, safe filename, type, and a 1 MiB payload limit before forwarding it only to the appropriate recipients.
- Recipients can preview supported images and download every attachment.
- Lint and protocol tests pass.
