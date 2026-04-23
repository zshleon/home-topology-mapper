# Git Workflow

## Initialization

```bash
git init
git add .
git commit -m "chore: initialize home topology mapper"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

## Daily Development

```bash
git checkout main
git pull --ff-only
git checkout -b feature/<task-name>
# edit files
git add .
git commit -m "feat: <description>"
git push origin feature/<task-name>
```

Open a PR with:

- title
- task from `TASKS.md`
- summary
- changed files
- test plan
- compatibility notes

