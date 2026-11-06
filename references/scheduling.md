# Scheduling a hunt

The suite never schedules itself silently. Set up a schedule only when the user asks, show the exact prompt and cadence, and let them confirm.

## The scheduled prompt (same on every surface)

```
Run client-hunter in mode: scheduled.
Budget: normal. Languages and offers: from my profile.
Do not ask questions. Do not contact anyone. Save leads and gates to my Client Hunter Ledger and finish with the short report.
```

Variants: add `Budget: quick` for twice-daily runs, or `Offers: sourcing only` to focus.

## Cowork scheduled tasks (recommended)

Cowork can run a saved prompt on a cadence, with connectors, installed skills and plugins. Two ways:
- In any Cowork task type `/schedule`, paste the prompt above, choose the cadence, and confirm with "Schedule".
- Or open "Scheduled" in the left sidebar, choose "New task", then "Create with Claude" or "Set up manually".

Notes for the user:
- Install Client Hunter in the account first (the one-file bundle saved in the Claude app) so the scheduled run can load it.
- If your Reddit connectors are local servers in Claude Desktop (they time out when the desktop app is closed), a cloud run cannot reach them; choose a local scheduled run with the computer awake and the app open, or accept web-only Reddit coverage on those runs.
- Runs that only need remote connectors and web access can run in the cloud. Anything that needs a local app (Chrome for LinkedIn and X) only runs when the computer is awake and Claude Desktop is open; otherwise those sources are skipped and reported.
- Results appear on the Scheduled page and in the ledger page's Runs and Decisions tabs.

Behaviour of scheduled tasks can change between releases; if a step differs, check the current help article on scheduled tasks in Cowork at support.claude.com.

## Claude Code (alternative)

Use headless mode from the operating system scheduler. Example for Windows Task Scheduler (action: start a program):

```
Program: claude
Arguments: -p "Run client-hunter in mode: scheduled. Budget: normal. Do not ask questions. Do not contact anyone." --permission-mode acceptEdits
Start in: C:\Users\<you>\client-hunter-workspace
```

Example cron line (Linux/macOS), every weekday at 08:00:

```
0 8 * * 1-5 cd ~/client-hunter-workspace && claude -p "Run client-hunter in mode: scheduled. Budget: normal. Do not ask questions. Do not contact anyone." >> hunt.log 2>&1
```

Allow only the tools the run needs (web, the Reddit fetch script, file writes in the workspace). In Claude Code the ledger is local (`~/.client-hunter/`); import `export.json` into the ledger page from its Data tab when convenient.

## Claude app chat

A regular chat cannot run on a timer. Use Cowork scheduled tasks, or run "client hunter, hunt" manually.
