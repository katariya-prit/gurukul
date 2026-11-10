# Copilot instructions

Read and follow AGENTS.md in the repository root. These are the rules that matter most:

- Reply to the developer in Gujarati written in English letters (Gujlish), short and practical. Code and identifiers stay in English.
- Never write code comments.
- TypeScript strict. No unused variables or imports. The build must pass.
- Read the files involved first. Never guess paths, columns or API shapes. Ask for missing files.
- Output complete files one at a time. No zip files.
- Auth is session cookie. No tokens, no Authorization header. Never trust role or user ids sent by the client.
- Permissions workflow, in this order, for any module, page, operation or access change: 1) Role create screen in the frontend (Create-Role.tsx), 2) backend seeder in D:\MP\gurukul-backend-app (database/seeders, merge-only), 3) route, sidebar and API enforcement, 4) tell the developer what to run.
- Never run destructive database commands. Never print secrets.