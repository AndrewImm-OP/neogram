# neogram v10.0.2 Examples

All examples use a default test bot token. Set your own via environment variable:

```bash
# bash/zsh
export BOT_TOKEN="your_token_here"
node examples/simple-bot.js

# fish
set -x BOT_TOKEN "your_token_here"
node examples/simple-bot.js
```

## Available Examples

| File | Description |
|------|-------------|
| `simple-bot.js` | Minimal echo bot using handler system |
| `test-bot.js` | Feature-rich demo — commands, photos, polls, dice, keyboards |
| `test-bot-full.js` | Complete bot with all features and inline callbacks |
| `test-bot-comprehensive.js` | Full API test suite — 25+ commands testing every API method |
| `test-bot-debug.js` | Debug/connectivity test — verifies token and API calls |
| `ai-bot.js` | AI-powered bot using OnlySQ with conversation history |
