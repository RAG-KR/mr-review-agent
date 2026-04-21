# MR Review Agent

AI-powered merge request review agent that runs locally using Ollama.

## Features

- 🚀 Run code reviews locally with `npm run review`
- 🤖 Powered by Ollama (Gemma 4 or any local model)
- 📝 Generates detailed review reports as markdown
- 🎯 Customizable review criteria via skills system
- 🔒 Completely local - no external API calls
- ⚙️ Configurable via `.reviewrc` file

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git** repository
3. **Ollama** installed and running
   ```bash
   # Install Ollama (macOS)
   brew install ollama

   # Pull the model
   ollama pull gemma4:26b
   ```

## Installation

```bash
# Install dependencies
npm install

# Verify setup
npm run dev
```

## Usage

### Basic Review

Review changes in your current branch against `main`:

```bash
npm run review
```

### Custom Options

```bash
# Use a different model
npm run review -- --model gemma2:9b

# Compare against a different base branch
npm run review -- --base-branch develop

# Save to a different output file
npm run review -- --output ./reviews/my-review.md
```

## Configuration

Create or edit `.reviewrc` in your project root:

```json
{
  "model": {
    "name": "gemma4:26b",
    "temperature": 0.2,
    "maxTokens": 8192
  },
  "review": {
    "baseBranch": "main",
    "includeTests": true,
    "skillsPath": "./skills",
    "outputPath": "./REVIEW.md"
  }
}
```

## Skills System

Add domain-specific knowledge and review criteria in the `skills/` folder:

```
skills/
├── code_standards.md      # Your team's coding standards
├── security_checklist.md  # Security review items
└── domain_knowledge.md    # Business logic rules
```

The agent will automatically load and apply these guidelines during review.

## Workflow

1. **Make changes** in your feature branch
2. **Commit changes** as usual
3. **Run review** before pushing:
   ```bash
   npm run review
   ```
4. **Read the report** in `REVIEW.md`
5. **Address issues** if any
6. **Push to GitLab** with confidence

## Output

The agent generates a detailed markdown report (`REVIEW.md`) with:

- **Summary**: Overview of changes
- **Issues Found**: Specific problems with file:line references
- **Recommendations**: Actionable suggestions
- **Positive Observations**: What was done well

## Troubleshooting

### Model not found
```bash
ollama pull gemma4:26b
```

### No changes found
Make sure you have commits on your branch that differ from the base branch.

### Ollama not running
```bash
ollama serve
```

## Development

```bash
# Build TypeScript
npm run build

# Run in dev mode
npm run dev

# Run built version
npm start
```

## Roadmap

- [ ] GitLab API integration (post reviews as MR comments)
- [ ] Jira integration (fetch ticket requirements)
- [ ] Web search for documentation lookup
- [ ] Multi-model pipeline (context + review models)
- [ ] Codebase indexing with vector database

## License

MIT
