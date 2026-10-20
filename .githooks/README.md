This folder contains Git hooks included in the repository.

How to enable these hooks locally:

1. Configure Git to use this folder as hooks directory (run once per clone):

```bash
git config core.hooksPath .githooks
```

2. Make sure the scripts are executable (on Unix/macOS/Git Bash):

```bash
chmod +x .githooks/pre-commit
```

What it does:

- The `pre-commit` hook rejects any commit that would ADD files under `node_modules/` (for example via `git add *`), while allowing the staged deletions from the repository cleanup to pass through.
