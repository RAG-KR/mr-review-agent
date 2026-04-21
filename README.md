# MR Review Agent

AI-powered merge request review agent that runs locally using Ollama.

**Use in ANY git repository. One command: `mr-review`**

👉 **[Quick Start Guide](./QUICKSTART.md)** - Get running in 5 minutes!

## Features

- 🚀 Run code reviews locally with `npm run review`
- 🤖 Powered by Ollama (Gemma 4 or any local model)
- 📝 Generates detailed review reports as markdown
- 🎯 Customizable review criteria via skills system
- 🔒 Completely local - no external API calls
- ⚙️ Configurable via `.reviewrc` file

## Prerequisites

1. **Node.js** (v18+)
2. **Ollama** with a model installed
   ```bash
   # Install Ollama
   brew install ollama  # macOS
   # or download from ollama.ai

   # Pull a model (one-time)
   ollama pull gemma4:26b
   ```

## Installation

### Option 1: Global Install (Use in ANY codebase)
```bash
# Clone this repo
git clone <this-repo-url>
cd mr-review-agent

# Install globally
npm install -g .

# Now use in ANY git repository!
cd /path/to/your/project
mr-review
```

### Option 2: Local Development
```bash
# Clone and install
git clone <this-repo-url>
cd mr-review-agent
npm install

# Build
npm run build

# Link globally (like global install)
npm link

# Use anywhere
cd /path/to/any/project
mr-review
```

### Option 3: Use in One Project
```bash
# In your project
npm install /path/to/mr-review-agent

# Add to package.json scripts
{
  "scripts": {
    "review": "mr-review"
  }
}

# Run
npm run review
```

## Usage

### Basic Usage
```bash
# In any git branch with changes
mr-review

# Reads: REVIEW.md
```

### Options
```bash
# Different model
mr-review --model gemma2:9b

# Different base branch
mr-review --base-branch develop

# Custom output
mr-review --output my-review.md
```

## Configuration (Optional)

Create `.reviewrc` in your project to customize:

```json
{
  "model": {
    "name": "gemma4:26b",
    "temperature": 0.2
  },
  "review": {
    "baseBranch": "main",
    "outputPath": "./REVIEW.md"
  }
}
```

Works without config! Defaults are sensible.

## Add Custom Review Rules (Optional)

Create `skills/` folder in your project:

```bash
mkdir skills
echo "# Our coding standards" > skills/code_standards.md
```

Agent will automatically use them!

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
