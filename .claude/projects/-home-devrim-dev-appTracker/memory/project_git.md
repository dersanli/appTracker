---
name: Git remote SSH configuration
description: Remote uses dersanli SSH host alias for push access
type: project
---

The git remote is configured to use `git@github.com-dersanli:dersanli/appTracker.git` (SSH host alias defined in `~/.ssh/config`).

**Why:** Multiple GitHub accounts on this machine; default SSH key resolves to `devrim9`, not `dersanli` (the repo owner).
**How to apply:** If the remote ever needs to be reset, use `git remote set-url origin git@github.com-dersanli:dersanli/appTracker.git`.
