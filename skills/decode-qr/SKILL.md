---
name: decode-qr
trigger: /decode-qr
summary: Decode scanned QR strings into a git patch and apply it locally
---

This skill decodes scanned QR strings (one per line) into a git patch file and applies it locally.

Steps for the agent to perform when invoked:

- Ask the user to save all scanned QR lines into a file named `scanned.txt` in the repository root (one QR string per line).
- Run the decode script:

  node tools/decode-qr.mjs scanned.txt

- If the script writes `changes.patch`, run:

  git apply --3way changes.patch

- Report back which files were changed by the patch (use `git apply --stat changes.patch` or `git apply --check` then `git apply --3way`).

Guardrails:

- Never push or commit changes. Only apply the patch locally and report what changed.
- Use only the local filesystem and git; do not call external services.
