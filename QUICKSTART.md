# Quick Start - MR Review Agent

## 1. Install Ollama (One-time)
```bash
brew install ollama
ollama pull gemma4:26b
```

## 2. Install Agent (One-time)
```bash
cd /path/to/mr-review-agent
npm install
npm run build
npm link
```

## 3. Use on ANY Project
```bash
cd /path/to/your/project

# Create a feature branch with changes
git checkout -b feature/my-feature
# ... make code changes ...
git add .
git commit -m "My changes"

# Review your changes
mr-review

# Read the review
cat REVIEW.md
```

## That's It!

**Works in ANY git repository with changes.**

## Common Commands
```bash
# Basic review
mr-review

# Different model
mr-review --model gemma2:9b

# Different base branch
mr-review --base-branch develop

# Help
mr-review --help
```

## What Gets Reviewed?
- All changes between current branch and `main` (or specified base)
- Checks: security, code quality, DRY, best practices
- Output: `REVIEW.md` with specific issues + fixes

## Customize (Optional)
Add `.reviewrc` in your project:
```json
{
  "model": {"name": "gemma4:26b"},
  "review": {"baseBranch": "develop"}
}
```

Add `skills/` folder with your coding standards (markdown files).
