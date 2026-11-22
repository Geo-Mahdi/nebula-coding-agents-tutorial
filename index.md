---
title: Coding agents with Nebula (VU)
---

_Mahdi Rahimi · Vrije Universiteit Amsterdam · first version 19 November 2026, revised 22 November 2026_

**Summary.** This tutorial explains how researchers and students at VU Amsterdam can run coding agents on Nebula, the university's own large language model (LLM) service, instead of on commercial AI services. It defines what a coding agent is, explains where data goes when you use one, and gives step-by-step instructions for two agents, opencode and Claude Code, on Ubuntu, macOS and Windows.

## Contents
{:.no_toc}

* Table of contents
{:toc}

## 1. Introduction

### 1.1 What is a coding agent?

A **coding agent** is a program that uses a large language model to carry out software tasks on your computer, rather than only answering questions about them. You describe a goal in plain language, for example "find why `clean_data.py` drops rows with missing dates and fix it". The agent then works in a loop:

1. **Plan.** The model decides what to do next.
2. **Act.** It calls a *tool*: read a file, search the project, edit a file, or run a command such as a test or a script.
3. **Observe.** The result of that tool (file contents, command output, an error) is sent back to the model.
4. **Repeat** until the task is done or the agent needs your decision.

Three properties distinguish a coding agent from related tools:

| Tool type | What it does | Example |
| --- | --- | --- |
| Chat assistant | Answers in text; you copy code in and out yourself | The Nebula web chat |
| Code completion | Suggests the next lines while you type in an editor | Editor autocomplete |
| **Coding agent** | Reads your files, changes them and runs commands itself, in several steps, with you approving actions | opencode, Claude Code |

Two consequences follow, and the rest of this tutorial is built around them:

- **The agent sends your files to the model.** Everything it reads, including data files and command output, becomes part of the request. Which model you choose therefore decides where your data goes (Section 2).
- **The agent needs a capable model.** It must follow instructions over many steps, call tools in the correct format and keep a long history in view. Small models fail at this (Section 6).

### 1.2 Nebula

**Nebula** is VU's LLM service, run by the Network Institute at [nebula.cs.vu.nl](https://nebula.cs.vu.nl). It is a version of Open WebUI with a chat website and an API ([source code](https://github.com/networkinstitutevu/Nebula), [API examples](https://github.com/networkinstitutevu/nebula-api-examples)). The API offers two formats, which is why it works with both agents in this tutorial:

| API format | Address | Used by |
| --- | --- | --- |
| OpenAI-compatible | `https://nebula.cs.vu.nl/api` (for example `/api/chat/completions`, `/api/models`) | opencode |
| Anthropic Messages | `https://nebula.cs.vu.nl/api/v1/messages` | Claude Code |

### 1.3 The two agents covered

| | opencode | Claude Code |
| --- | --- | --- |
| Made by | Open-source project ([opencode.ai](https://opencode.ai)) | Anthropic |
| Designed for | Any model, from any provider | Anthropic's Claude models; other models through a custom address |
| Connects to Nebula through | The OpenAI-compatible API | The Anthropic Messages API |
| Status with Nebula | **Tested** on Ubuntu, 19 November 2026 | **Not yet tested on the live Nebula server** (configuration checked against a test server, see Section 5) |
| Recommendation | Start here | Try it if you already know Claude Code |

### 1.4 Platforms and what has been tested

| Platform | Status |
| --- | --- |
| Ubuntu | opencode **tested** on 19 November 2026 (opencode 1 from npm and the Flatpak desktop app) |
| macOS | Not tested yet. Commands are the same as on Ubuntu except where marked **macOS** |
| Windows | Not tested yet. Uses PowerShell versions of the commands. WSL (Ubuntu inside Windows) follows the Ubuntu steps |

If you try a step that is marked untested, please tell us what worked and what didn't, so we can update this page.

## 2. Data protection and security

### 2.1 Where your data goes

Where a request goes depends only on the model you pick, not on the agent:

| Model you pick | Runs on | Your data |
| --- | --- | --- |
| `FAST.*` (Nebula) | VU hardware | Stays at VU |
| `SURF.*` (Nebula) | SURF, the Dutch academic computing cooperative | Leaves VU, stays within Dutch academic infrastructure |
| Anything else ("Big Pickle", Nemotron and other free models in opencode, providers added with **Connect**: OpenAI, Anthropic and so on, or Claude Code logged in to an Anthropic account) | Outside companies | Leaves VU, under that company's terms |

Only the Nebula models are covered by VU agreements.

### 2.2 Rules of thumb

- Personal data, unpublished research data and confidential code go only to Nebula models. If in doubt, use `FAST.*`.
- An agent sends the files it reads to the model. Start it inside the project folder, not in your home folder.
- Check your faculty's data-management rules before using any model on sensitive data.

### 2.3 Handling your API key

Your API key works like a password: anyone who has it can use Nebula as you.

- Never paste it into a chat, an email, a screenshot or a Git repository.
- The setup scripts in this tutorial ask for the key without showing it on screen and store it in a file only you can read.
- If it leaks, delete it in Nebula (**Settings → Account → API Keys**), create a new one, and rerun the setup script.

## 3. Prerequisites

### 3.1 A Nebula API key

1. Log in at [nebula.cs.vu.nl](https://nebula.cs.vu.nl).
2. Click your name or picture (bottom left), then **Settings**.
3. Open **Account**, find **API Keys**, and click to create a key.
4. Copy the key. It starts with `sk-`. Keep it in your password manager.

No **API Keys** section? API access has to be switched on for your account. Ask the Nebula administrators at the Network Institute to enable it.

**Test the key** and list the models you can use. Replace `sk-...` with your key. This puts the key in your shell history; the setup scripts later avoid that.

Ubuntu and macOS:

```bash
curl -s -H "Authorization: Bearer sk-..." https://nebula.cs.vu.nl/api/models | grep -o '"id":"[^"]*"' | sort -u
```

Windows (PowerShell):

```powershell
(Invoke-RestMethod https://nebula.cs.vu.nl/api/models -Headers @{ Authorization = "Bearer sk-..." }).data.id | Sort-Object -Unique
```

You should see model IDs such as `FAST.gpt-oss:120b` and `SURF.Qwen3.8-27B-FP8`. An empty result, `Not authenticated` or `(401) Unauthorized` means the key is wrong or not enabled.

### 3.2 A terminal

| Platform | Terminal to use |
| --- | --- |
| Ubuntu | Terminal |
| macOS | Terminal (Applications → Utilities). Its default shell is zsh; the bash commands here work in it |
| Windows | PowerShell inside **Windows Terminal** (the default on Windows 11; on Windows 10 install it from the Microsoft Store). Agents' full-screen interfaces work best there |

### 3.3 Node.js 18 or newer

opencode is installed with npm, which comes with Node.js. The scripts in this tutorial also use Node to check files. Claude Code can be installed without Node (Section 4.1).

**Ubuntu (tested).** Install Node with [nvm](https://github.com/nvm-sh/nvm). If you installed Node with `apt`, `npm install -g` will fail with a permission error; switch to nvm rather than using `sudo npm`.

**macOS (not tested).** Install Node with [nvm](https://github.com/nvm-sh/nvm) or, if you use [Homebrew](https://brew.sh), with `brew install node`. The installer from nodejs.org often causes `EACCES` permission errors with `npm install -g`; use nvm or Homebrew instead rather than `sudo npm`.

**Windows (not tested).** Install Node.js LTS from [nodejs.org](https://nodejs.org) or with `winget install OpenJS.NodeJS.LTS`, then open a new PowerShell window. If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled on this system`, run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Check the result on any platform with `node --version`.

**Windows with WSL instead:** if you already use WSL, open the Ubuntu app and follow the Ubuntu steps throughout. The agent then lives inside Linux and works on files in your Linux home folder; its configuration is separate from a native Windows install.

## 4. Setting up opencode

### 4.1 Install

This tutorial uses the npm package `opencode-ai` (version 1.19.6 on 19 November 2026), which is what we tested. The command is the same on all three platforms:

```bash
npm install -g opencode-ai
opencode --version
```

**A note on opencode 2.** opencode.ai now also offers version 2, installed with `curl -fsSL https://opencode.ai/v2/install | bash`, plus desktop downloads. Its [migration page](https://opencode.ai/docs/migrate-v1/) says version 2 still reads the version 1 config format used here, so the configuration below works for both. Don't install both side by side: remove the npm version first (`npm uninstall -g opencode-ai`) if you switch. The commands in this tutorial (`opencode models`, `--standalone`) were tested on version 1 only.

### 4.2 Configure

opencode reads its settings from `~/.config/opencode/opencode.json` on all three platforms. On Windows, `~` is your user folder, so the file is `C:\Users\<you>\.config\opencode\opencode.json`. You add Nebula there as a provider called `nebula`:

| Field | Value | Why |
| --- | --- | --- |
| `npm` | `@ai-sdk/openai-compatible` | Nebula speaks the OpenAI API format |
| `options.baseURL` | `https://nebula.cs.vu.nl/api` | Exactly this. No `/v1` at the end, no trailing slash |
| `options.apiKey` | your `sk-...` key | See "Where to keep the key" below |
| `models` | one entry per model ID | IDs must match Nebula's list exactly, including case and `:` |
| `model` (top level) | `nebula/<model ID>` | Optional: the model opencode starts with |

Editing JSON by hand is easy to break: one missing comma or quote and opencode silently ignores the whole file. The scripts below ask for your key without showing it, write the file, make sure only you can read it, and check it. Each overwrites any earlier `opencode.json`, so make a copy first if you had other settings.

**Ubuntu (tested) and macOS.** Paste into a terminal as one block. It works in bash and zsh.

```bash
printf "Paste your Nebula API key, then press Enter: "; read -s NEBULA_KEY; echo
mkdir -p ~/.config/opencode
cat > ~/.config/opencode/opencode.json <<EOF
{
  "\$schema": "https://opencode.ai/config.json",
  "model": "nebula/SURF.Qwen3.8-27B-FP8",
  "provider": {
    "nebula": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Nebula (VU)",
      "options": {
        "baseURL": "https://nebula.cs.vu.nl/api",
        "apiKey": "$NEBULA_KEY"
      },
      "models": {
        "SURF.Qwen3.8-27B-FP8": { "name": "Qwen3.8 27B (SURF)" },
        "FAST.gpt-oss:120b": { "name": "gpt-oss 120B (VU)" }
      }
    }
  }
}
EOF
chmod 600 ~/.config/opencode/opencode.json
unset NEBULA_KEY
python3 -m json.tool ~/.config/opencode/opencode.json > /dev/null && echo OK
```

You should see `OK`. If you see an error such as `Expecting ',' delimiter: line 12 column 5`, run the script again rather than fixing the file by hand. Two details matter: `\$schema` has a backslash so the shell doesn't treat it as a variable, and `$NEBULA_KEY` has none so your key is filled in.

**macOS:** if the last line asks you to install "command line developer tools", cancel and check the file with Node instead:

```bash
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log('OK')" ~/.config/opencode/opencode.json
```

**Windows (not tested).** Paste into PowerShell as one block.

```powershell
$secure = Read-Host "Paste your Nebula API key, then press Enter" -AsSecureString
$key = [System.Net.NetworkCredential]::new("", $secure).Password
$dir = Join-Path $HOME ".config\opencode"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$config = [ordered]@{
  '$schema' = "https://opencode.ai/config.json"
  model     = "nebula/SURF.Qwen3.8-27B-FP8"
  provider  = @{
    nebula = [ordered]@{
      npm     = "@ai-sdk/openai-compatible"
      name    = "Nebula (VU)"
      options = [ordered]@{
        baseURL = "https://nebula.cs.vu.nl/api"
        apiKey  = $key
      }
      models  = [ordered]@{
        "SURF.Qwen3.8-27B-FP8" = @{ name = "Qwen3.8 27B (SURF)" }
        "FAST.gpt-oss:120b"    = @{ name = "gpt-oss 120B (VU)" }
      }
    }
  }
}
$file = Join-Path $dir "opencode.json"
[System.IO.File]::WriteAllText($file, ($config | ConvertTo-Json -Depth 10))
Remove-Variable key, secure
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log('OK')" $file
```

You should see `OK`. The script writes UTF-8 without a byte-order mark, which opencode expects. Files in your user folder are readable only by you and administrators, so there is no `chmod` step.

#### Where to keep the key

You have three options. We recommend the first.

1. **In the file (recommended).** What the scripts above do. It is the most reliable: it works in the terminal and in the desktop app. Never commit this file to Git or share it.
2. **In an environment variable.** Use `"apiKey": "{env:NEBULA_API_KEY}"` in the config, then set the variable:
   - Ubuntu: add `export NEBULA_API_KEY=sk-...` to `~/.bashrc`, then open a new terminal.
   - macOS: the same line in `~/.zshrc`.
   - Windows: run `[Environment]::SetEnvironmentVariable("NEBULA_API_KEY", "sk-...", "User")` once, then open a new PowerShell window.

   Caveat: if the variable isn't set where opencode starts, opencode silently uses an empty key and you get `Not authenticated`. On Ubuntu and macOS, desktop apps started from the menu or Dock do not read `~/.bashrc` or `~/.zshrc`, so this often fails there. This was the cause of our first failure. On Windows, apps pick up user variables after you sign out and in again.
3. **In a separate key file.** Save only the key in `~/.config/opencode/nebula.key` (on Ubuntu and macOS, `chmod 600` it) and use `"apiKey": "{file:~/.config/opencode/nebula.key}"`. This keeps the key out of the main config. We have not tested this one.

### 4.3 Add Nebula's models

opencode only shows the Nebula models listed in your config. These scripts ask Nebula for every model you can use and write them all in. They keep names you already gave, read the key from your config (or from `NEBULA_API_KEY` if you used option 2), and never print the key. Run one again whenever Nebula adds models. Section 6.1 explains which model to choose.

**Ubuntu (tested) and macOS:**

```bash
python3 - <<'PY'
import json, os, urllib.request
path = os.path.expanduser("~/.config/opencode/opencode.json")
with open(path) as f:
    cfg = json.load(f)
nebula = cfg["provider"]["nebula"]
key = nebula["options"]["apiKey"]
if key.startswith("{env:"):
    key = os.environ.get(key[5:-1], "")
url = nebula["options"]["baseURL"].rstrip("/") + "/models"
req = urllib.request.Request(url, headers={"Authorization": "Bearer " + key})
data = json.load(urllib.request.urlopen(req, timeout=30))["data"]
ids = sorted({m["id"] for m in data})
old = nebula.get("models", {})
nebula["models"] = {i: old.get(i, {}) for i in ids}
with open(path, "w") as f:
    json.dump(cfg, f, indent=2)
print(f"Wrote {len(ids)} models to {path}")
PY
```

**Windows, or macOS without Python:** download [add-nebula-models.mjs](scripts/add-nebula-models.mjs) from this site and run it with Node. It does the same thing. We checked it against a test server, not yet against Nebula itself.

```powershell
curl.exe -fsSLO https://geo-mahdi.github.io/nebula-coding-agents-tutorial/scripts/add-nebula-models.mjs
node add-nebula-models.mjs
```

On macOS, write `curl` instead of `curl.exe`. Either script reports `HTTP 401` if the key is wrong. Afterwards you can delete models you don't want from the `models` list.

**Optional: context size.** opencode summarises long sessions in time when it knows how much text a model accepts. Add a `limit` to a model entry, then check the file again:

```json
"SURF.Qwen3.8-27B-FP8": { "name": "Qwen3.8 27B (SURF)", "limit": { "context": 262144, "output": 16384 } }
```

The `output` value is a cautious guess; Nebula doesn't publish per-model limits.

### 4.4 Verify and use

Check that opencode sees Nebula:

```bash
opencode models --standalone | grep -i nebula             # Ubuntu and macOS
opencode models --standalone | Select-String nebula       # Windows
```

You should see lines such as `nebula/SURF.Qwen3.8-27B-FP8`. Then start opencode inside the folder you want to work on:

```bash
cd ~/projects/my-analysis      # Windows: cd $HOME\projects\my-analysis
opencode
```

| To do this | Type or press |
| --- | --- |
| Pick a model | `/models` or Ctrl+P, then choose one under **Nebula (VU)** |
| Ask a question or give a task | Just type, for example "Explain what clean\_data.py does" |
| Switch between planning and making changes | Tab (the **Plan** agent only reads and suggests; **Build** edits files and runs commands) |
| Start a fresh conversation | `/new` |
| Quit | `/exit` or Ctrl+C |

The keys are the same on all platforms; use Ctrl, not Cmd, on macOS too.

opencode-specific cautions:

- Don't use **Connect** to add OpenAI, Anthropic or other providers, and don't pick the free models listed outside the Nebula group, for anything sensitive. Those go to outside companies.
- Don't use `/share`: it uploads the conversation to opencode's servers and makes a public link to it.

### 4.5 The desktop app

opencode also has a desktop app. It uses the same config format, but where it looks for the file depends on how you installed it.

| How you installed it | Config file it reads |
| --- | --- |
| Ubuntu `.deb` from opencode.ai | `~/.config/opencode/opencode.json` (the same file as the terminal) |
| Ubuntu Flatpak (`ai.opencode.opencode`) | `~/.var/app/ai.opencode.opencode/config/opencode/opencode.json` |
| macOS and Windows | Not tested. Expected to be the same `~/.config/opencode` file (Windows: `C:\Users\<you>\.config\opencode`); if Nebula doesn't appear, use the Custom provider screen below |

For the Flatpak, copy your working config into its folder, and copy it again whenever you change the original:

```bash
mkdir -p ~/.var/app/ai.opencode.opencode/config/opencode
cp ~/.config/opencode/opencode.json ~/.var/app/ai.opencode.opencode/config/opencode/
chmod 600 ~/.var/app/ai.opencode.opencode/config/opencode/opencode.json
```

Keep the key in the file (option 1 above); on Ubuntu and macOS the desktop app doesn't see variables set in `~/.bashrc` or `~/.zshrc`.

**Without a config file:** the app has a **Custom provider** screen in its provider settings. Enter Provider ID `nebula`, Base URL `https://nebula.cs.vu.nl/api` and your API key, then add the model IDs from Section 6.1. Don't use the other providers listed on that screen.

Don't run the desktop app and the terminal version at the same time (see the port error in Section 7).

## 5. Setting up Claude Code

**Status.** Claude Code has not yet been tested against the live Nebula server. On 22 November 2026 we ran Claude Code 2.1.330 against a test server that imitates Nebula's address. That confirmed the configuration below: Claude Code reads it from its settings file, sends requests to `https://nebula.cs.vu.nl/api/v1/messages`, sends your key as `Authorization: Bearer`, uses the model IDs you set, and includes its tools. What remains unverified is whether Nebula's Anthropic endpoint handles Claude Code's streaming and tool calls correctly. Section 5.3 shows how to check that first.

### 5.1 Install

Claude Code has its own installer, which doesn't need Node.js.

Ubuntu and macOS:

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude --version
```

Windows (PowerShell). Install [Git for Windows](https://git-scm.com/downloads/win) first: Claude Code uses its Git Bash to run commands where it can, and some features need it.

```powershell
irm https://claude.ai/install.ps1 | iex
claude --version
```

Alternatives on any platform: `npm install -g @anthropic-ai/claude-code` if you already have Node.js, `brew install --cask claude-code` on macOS, or `winget install Anthropic.ClaudeCode` on Windows. If `claude` is not found afterwards, open a new terminal; `claude doctor` reports installation problems.

### 5.2 Configure

Claude Code is pointed at Nebula with environment variables. You can put them in its user settings file, `~/.claude/settings.json` (Windows: `C:\Users\<you>\.claude\settings.json`), so they apply every time you start it.

| Setting | Value | Why |
| --- | --- | --- |
| `ANTHROPIC_BASE_URL` | `https://nebula.cs.vu.nl/api` | No `/v1`: Claude Code adds `/v1/messages` itself |
| `ANTHROPIC_AUTH_TOKEN` | your `sk-...` key | Sent as `Authorization: Bearer`, the format Nebula expects. Use this, not `ANTHROPIC_API_KEY` |
| `ANTHROPIC_MODEL` | `SURF.Qwen3.8-27B-FP8` | The main model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_HAIKU_MODEL` | the same model ID | Claude Code switches between these three model tiers, and makes small background calls with the Haiku one. Without these, it asks Nebula for Anthropic models that Nebula doesn't have |
| `CLAUDE_CODE_SUBAGENT_MODEL` | the same model ID | Model for helper agents Claude Code starts on its own |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS` | `262144` | Claude Code doesn't know Nebula's models and otherwise assumes a context window of 1 million tokens; this sets the real size of `SURF.Qwen3.8-27B-FP8` |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | `1` | Turns off usage statistics, error reports and update checks that Claude Code would otherwise send to outside services |

The scripts below write this file. They overwrite an existing `settings.json`, keeping a copy as `settings.json.bak`; if you already had Claude Code settings, merge them back by hand. Because the settings apply to every Claude Code session, Claude Code will then always use Nebula. To go back to Anthropic, delete the file or remove its `env` block.

**Ubuntu and macOS (not tested on Nebula).** Paste as one block.

```bash
printf "Paste your Nebula API key, then press Enter: "; read -s NEBULA_KEY; echo
mkdir -p ~/.claude
[ -f ~/.claude/settings.json ] && cp ~/.claude/settings.json ~/.claude/settings.json.bak
M=SURF.Qwen3.8-27B-FP8
cat > ~/.claude/settings.json <<EOF
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://nebula.cs.vu.nl/api",
    "ANTHROPIC_AUTH_TOKEN": "$NEBULA_KEY",
    "ANTHROPIC_MODEL": "$M",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "$M",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "$M",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "$M",
    "CLAUDE_CODE_SUBAGENT_MODEL": "$M",
    "CLAUDE_CODE_MAX_CONTEXT_TOKENS": "262144",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
EOF
chmod 600 ~/.claude/settings.json
unset NEBULA_KEY
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log('OK')" ~/.claude/settings.json
```

**Windows (not tested on Nebula).** Paste into PowerShell as one block.

```powershell
$secure = Read-Host "Paste your Nebula API key, then press Enter" -AsSecureString
$key = [System.Net.NetworkCredential]::new("", $secure).Password
$dir = Join-Path $HOME ".claude"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$file = Join-Path $dir "settings.json"
if (Test-Path $file) { Copy-Item $file "$file.bak" -Force }
$m = "SURF.Qwen3.8-27B-FP8"
$settings = @{
  env = [ordered]@{
    ANTHROPIC_BASE_URL                       = "https://nebula.cs.vu.nl/api"
    ANTHROPIC_AUTH_TOKEN                     = $key
    ANTHROPIC_MODEL                          = $m
    ANTHROPIC_DEFAULT_OPUS_MODEL             = $m
    ANTHROPIC_DEFAULT_SONNET_MODEL           = $m
    ANTHROPIC_DEFAULT_HAIKU_MODEL            = $m
    CLAUDE_CODE_SUBAGENT_MODEL               = $m
    CLAUDE_CODE_MAX_CONTEXT_TOKENS           = "262144"
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
  }
}
[System.IO.File]::WriteAllText($file, ($settings | ConvertTo-Json -Depth 5))
Remove-Variable key, secure
Get-Content $file -Raw | ConvertFrom-Json | Out-Null; "OK"
```

You should see `OK`. Without Node on Ubuntu or macOS, replace the last line with `python3 -m json.tool ~/.claude/settings.json > /dev/null && echo OK`.

**Trying it out for one session only.** Instead of the settings file, you can set the same variables in a single terminal; they disappear when you close it.

Ubuntu and macOS:

```bash
printf "Nebula key: "; read -s ANTHROPIC_AUTH_TOKEN; echo
export ANTHROPIC_AUTH_TOKEN
export ANTHROPIC_BASE_URL=https://nebula.cs.vu.nl/api
export ANTHROPIC_MODEL=SURF.Qwen3.8-27B-FP8
export ANTHROPIC_DEFAULT_OPUS_MODEL=$ANTHROPIC_MODEL ANTHROPIC_DEFAULT_SONNET_MODEL=$ANTHROPIC_MODEL ANTHROPIC_DEFAULT_HAIKU_MODEL=$ANTHROPIC_MODEL CLAUDE_CODE_SUBAGENT_MODEL=$ANTHROPIC_MODEL
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=262144 CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
claude
```

Windows (PowerShell):

```powershell
$env:ANTHROPIC_AUTH_TOKEN = [System.Net.NetworkCredential]::new("", (Read-Host "Nebula key" -AsSecureString)).Password
$env:ANTHROPIC_BASE_URL = "https://nebula.cs.vu.nl/api"
$env:ANTHROPIC_MODEL = "SURF.Qwen3.8-27B-FP8"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = $env:ANTHROPIC_MODEL
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = $env:ANTHROPIC_MODEL
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = $env:ANTHROPIC_MODEL
$env:CLAUDE_CODE_SUBAGENT_MODEL = $env:ANTHROPIC_MODEL
$env:CLAUDE_CODE_MAX_CONTEXT_TOKENS = "262144"
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = "1"
claude
```

To use a different Nebula model, replace `SURF.Qwen3.8-27B-FP8` everywhere and set `CLAUDE_CODE_MAX_CONTEXT_TOKENS` to that model's context size, if known.

### 5.3 Verify

**First, check that Nebula's Anthropic endpoint answers**, before involving Claude Code. Replace `sk-...` with your key.

Ubuntu and macOS:

```bash
curl -s https://nebula.cs.vu.nl/api/v1/messages \
  -H "Authorization: Bearer sk-..." \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"SURF.Qwen3.8-27B-FP8","max_tokens":50,"messages":[{"role":"user","content":"Say hello"}]}'
```

Windows (PowerShell):

```powershell
$body = '{"model":"SURF.Qwen3.8-27B-FP8","max_tokens":50,"messages":[{"role":"user","content":"Say hello"}]}'
Invoke-RestMethod https://nebula.cs.vu.nl/api/v1/messages -Method Post -ContentType "application/json" -Body $body -Headers @{ Authorization = "Bearer sk-..."; "anthropic-version" = "2023-06-01" }
```

A reply containing `"type":"message"` and some text means the endpoint works. A 404 means this Nebula version doesn't offer the Anthropic endpoint; in that case Claude Code won't work with Nebula, and you should use opencode.

**Then check Claude Code.** Go to a test folder and run a one-off prompt:

```bash
claude -p "Reply with the word OK"
```

Finally start `claude` interactively and type `/status`. It should list `https://nebula.cs.vu.nl/api` as the API address and `ANTHROPIC_AUTH_TOKEN` as the source of the key. If Claude Code instead asks you to log in to an Anthropic account, the settings were not picked up: don't log in for sensitive work, because then requests go to Anthropic, and see Section 7.

### 5.4 Use

Start Claude Code inside the folder you want to work on:

```bash
cd ~/projects/my-analysis      # Windows: cd $HOME\projects\my-analysis
claude
```

| To do this | Type or press |
| --- | --- |
| Ask a question or give a task | Just type, for example "Explain what clean\_data.py does" |
| Switch between asking before every change, accepting edits, and plan mode (read and suggest only) | Shift+Tab |
| Approve or refuse an action | Answer the prompt Claude Code shows before it edits a file or runs a command |
| Check the address, key source and model | `/status` |
| Switch model tier | `/model` (all tiers point to the Nebula model you set) |
| Write a project notes file the agent reads every session | `/init` (creates `CLAUDE.md`) |
| Start a fresh conversation | `/clear` |
| Quit | `/exit` or Ctrl+C twice |

Limitations to expect:

- Claude Code is built and tuned for Anthropic's Claude models. With open models it usually works less well than opencode with the same model: more failed tool calls, more need to steer it.
- Features that rely on Anthropic's own services, such as web search and logging in with an Anthropic account, don't apply when it uses Nebula.
- The "Status" note at the start of this section applies: report back if it works, or doesn't, on the live server.

## 6. Choosing a model and working well

### 6.1 Which Nebula model

Both agents need the exact model ID as Nebula lists it. Common ones as of November 2026:

| Model ID | Runs on | Use it for |
| --- | --- | --- |
| `SURF.Qwen3.8-27B-FP8` | SURF | **Recommended for coding agents.** Best tool use and coding of the current models; 262K-token context |
| `FAST.gpt-oss:120b` | VU | Best choice when data must stay at VU |
| `SURF.gpt-oss-120b` | SURF | Same model as above, run at SURF |
| `FAST.gemma4:31b` | VU | General writing and chat; weaker as a coding agent |

Avoid small models (a few billion parameters) and anything marked TEST for coding work. As Section 1.1 explains, an agent needs a model that calls tools reliably and has a long context window; small models loop, stall or ignore files. The list changes, so check the current one with the command in Section 3.1. Watch for `:` versus `-` in the IDs, for example `FAST.gpt-oss:120b` and `SURF.gpt-oss-120b`.

### 6.2 Good practice with any coding agent

- **Plan first.** On unfamiliar code, use the read-only mode (opencode's **Plan** agent, Claude Code's plan mode) before letting the agent change anything.
- **Use Git.** Commit before you let the agent change things, so you can review with `git diff` and undo with `git restore`.
- **Read commands before approving them.** The model can be wrong. On Windows the agent usually runs PowerShell or Git Bash commands; check those too.
- **Keep the scope small.** Start the agent in the project folder only, and give it one clear task at a time.
- **Check the results.** Run the tests or the analysis yourself. An agent's summary of what it did is not proof that it worked.

## 7. Troubleshooting

### 7.1 Both agents

| What you see | What it means | Fix |
| --- | --- | --- |
| `Not authenticated` or HTTP 401 | The agent sent no key or a wrong one | Test the key with the command in Section 3.1. If you used an environment variable, check it in the same terminal; it should print `sk-..`. Ubuntu and macOS: `echo ${NEBULA_API_KEY:0:5}`. Windows: `$env:NEBULA_API_KEY.Substring(0,5)` |
| `model not found` or 404 on a model | The model ID doesn't match Nebula's | Copy the ID exactly from Nebula's list (Section 3.1); for opencode rerun the script in Section 4.3 |
| URLs end up as `.../api/v1/v1/...` or `.../api/v1/models` and fail | `/v1` was added to the base address | Use `https://nebula.cs.vu.nl/api` exactly, for both agents |
| Agent loops, stops halfway or ignores tools | The model is too small for agent work | Switch to `SURF.Qwen3.8-27B-FP8` or `FAST.gpt-oss:120b` |
| Very slow replies | Nebula is busy or loading the model | Wait a minute and try again; `FAST.*` models share VU's GPUs with other users |
| `npm.ps1 cannot be loaded` (Windows) | PowerShell blocks scripts by default | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| `opencode` or `claude` not recognised (Windows) or `command not found` (macOS, Ubuntu) | The terminal was opened before the installation | Open a new terminal window. If it persists, reinstall as in Sections 3.3, 4.1 or 5.1 |
| Garbled screen or keys not working (Windows) | The old console window doesn't support the agent's interface | Use PowerShell inside Windows Terminal |
| Your key was exposed | Someone else could use Nebula as you | Delete the key in Nebula (Settings → Account → API Keys), create a new one, and rerun the setup script |

### 7.2 opencode

| What you see | What it means | Fix |
| --- | --- | --- |
| No Nebula models in `/models` or in `opencode models --standalone` | The config file is invalid and opencode ignored it, or it's in the wrong place | Run the check at the end of the Section 4.2 script. On error, rerun the script. For the Flatpak, check the path in Section 4.5 |
| `Expecting ':' delimiter`, `Expecting ',' delimiter` or `Unexpected token` | A hand edit broke the JSON | Rerun the Section 4.2 script, then the Section 4.3 script |
| `Managed service port ... already in use` | The desktop app and the terminal version are both running | Close one of them, or run `opencode --standalone`. If no window is open, end the leftover process. Ubuntu and macOS: `ps aux \| grep -i opencode`, then `kill <PID>`. Windows: `Get-Process *opencode* \| Stop-Process` |

### 7.3 Claude Code

| What you see | What it means | Fix |
| --- | --- | --- |
| Claude Code asks you to log in to Anthropic | It didn't read your settings | Check that `~/.claude/settings.json` exists and passes the check in Section 5.2, then restart `claude`. Don't log in for sensitive work |
| `/status` shows an Anthropic address instead of Nebula | Same cause, or an older login takes priority | Fix the settings file; run `/logout` inside Claude Code if you were logged in to Anthropic before |
| 404 on `/api/v1/messages` | This Nebula version has no Anthropic endpoint | Use opencode instead |
| Errors about tools, `tool_use` or the stream stopping mid-answer | Nebula's Anthropic endpoint doesn't fully handle Claude Code's requests, or the model handles tools poorly | Try `SURF.Qwen3.8-27B-FP8`; if it persists, use opencode and report it to the Nebula administrators |
| `doesn't recognize the model ... assumes a context window` | `CLAUDE_CODE_MAX_CONTEXT_TOKENS` is not set | Add it as in Section 5.2 |
| `Git Bash was not found` (Windows) | Git for Windows is missing | Install [Git for Windows](https://git-scm.com/downloads/win) and open a new terminal |

Still stuck? Ask the Nebula administrators at the Network Institute. Send them the error message, never your key.

## 8. References

- Nebula: [source code](https://github.com/networkinstitutevu/Nebula) and [API examples](https://github.com/networkinstitutevu/nebula-api-examples)
- opencode: [documentation](https://opencode.ai/docs), [providers](https://opencode.ai/docs/providers), [config](https://opencode.ai/docs/config), [models](https://opencode.ai/docs/models), [migrating from version 1](https://opencode.ai/docs/migrate-v1/) (read 19 November 2026); [opencode-ai on npm](https://www.npmjs.com/package/opencode-ai) (latest 1.19.6, 17 November 2026)
- Claude Code: [documentation](https://code.claude.com/docs), including [settings](https://code.claude.com/docs/en/settings) and [model configuration](https://code.claude.com/docs/en/model-config)
- Testing record: opencode tested on Ubuntu on 19 November 2026 with opencode 1 from npm and the Flatpak desktop app. Claude Code 2.1.330 configuration checked against a test server on 22 November 2026, not yet against Nebula. The macOS and Windows instructions have not been tested on those systems
