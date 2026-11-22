---
title: Using opencode with Nebula (VU)
---

_Mahdi Rahimi · 19 November 2026, Windows and macOS added 22 November 2026_

This guide covers Ubuntu, macOS and Windows. Every step has instructions for all three.

| Platform | Status |
| --- | --- |
| Ubuntu | **Tested** on 19 November 2026 (opencode 1 from npm and the Flatpak desktop app) |
| macOS | Not tested yet. The commands are the same as on Ubuntu apart from the notes marked **macOS** |
| Windows | Not tested yet. Uses PowerShell versions of the commands. WSL (Ubuntu inside Windows) follows the Ubuntu steps |

If you try it on macOS or Windows, please tell us what worked and what didn't, so we can mark it tested.

## Quick start (about 10 minutes)

You can run opencode, an AI coding assistant in your terminal, on VU's own Nebula models, so your code and data don't go to a commercial AI company. You need a Nebula account, Node.js, and a terminal (Ubuntu: Terminal; macOS: Terminal; Windows: PowerShell in Windows Terminal).

1. Get an API key: in [Nebula](https://nebula.cs.vu.nl), click your profile, then **Settings → Account → API Keys**, and create one. It starts with `sk-`. Keep it private.
2. Install opencode: `npm install -g opencode-ai` (the same command on all three systems; see Step 2 for installing Node.js).
3. Write the config file with the script in Step 3 below: the bash script on Ubuntu and macOS, the PowerShell script on Windows. It asks for your key without showing it, writes `~/.config/opencode/opencode.json`, and checks it.
4. Check that opencode sees Nebula:
   - Ubuntu and macOS: `opencode models --standalone | grep -i nebula`
   - Windows: `opencode models --standalone | Select-String nebula`
5. Go to a project folder and run `opencode`. Type `/models` and pick a **Nebula** model, for example `SURF.Qwen3.8-27B-FP8`.

Only the Nebula models are covered by VU agreements. The other models opencode lists, including the free ones, belong to outside companies (see the next section).

## What these tools are, and where your data goes

**Nebula** is VU's LLM service, run by the Network Institute. It is a version of Open WebUI with a chat website and an API ([source code](https://github.com/networkinstitutevu/Nebula), [API examples](https://github.com/networkinstitutevu/nebula-api-examples)). **opencode** ([opencode.ai](https://opencode.ai)) is an open-source coding agent. It reads your files, edits them and runs commands, using whichever language model you point it at. This guide points it at Nebula.

Where a request goes depends only on the model you pick:

| Model you pick | Runs on | Your data |
| --- | --- | --- |
| `FAST.*` (Nebula) | VU hardware | Stays at VU |
| `SURF.*` (Nebula) | SURF, the Dutch academic computing cooperative | Leaves VU, stays within Dutch academic infrastructure |
| Anything else in opencode ("Big Pickle", Nemotron and other free models, or providers added with **Connect**: OpenAI, Anthropic and so on) | Outside companies | Leaves VU, under that company's terms |

Rules of thumb:

- Personal data, unpublished research data and confidential code go only to Nebula models. If in doubt, use `FAST.*`.
- opencode sends the files it reads to the model. Start it inside the project folder, not in your home folder.
- Your API key works like a password. Never paste it into a chat, an email, a screenshot or a Git repository. If it leaks, delete it in Nebula and create a new one.
- Check your faculty's data-management rules before using any model on sensitive data.

## Step 1: Get a Nebula API key

The key lets programs such as opencode use Nebula as you.

1. Log in at [nebula.cs.vu.nl](https://nebula.cs.vu.nl).
2. Click your name or picture (bottom left), then **Settings**.
3. Open **Account**, find **API Keys**, and click to create a key.
4. Copy the key. It starts with `sk-`. Keep it in your password manager.

No **API Keys** section? API access has to be switched on for your account. Ask the Nebula administrators at the Network Institute to enable it.

To test the key and see the models you can use, run this in a terminal. Replace `sk-...` with your key. Note that this puts the key in your shell history; Step 3 shows a way that doesn't.

**Ubuntu and macOS**

```bash
curl -s -H "Authorization: Bearer sk-..." https://nebula.cs.vu.nl/api/models | grep -o '"id":"[^"]*"' | sort -u
```

You should see a list such as `"id":"FAST.gpt-oss:120b"` and `"id":"SURF.Qwen3.8-27B-FP8"`. An empty result or `Not authenticated` means the key is wrong or not enabled.

**Windows (PowerShell)**

```powershell
(Invoke-RestMethod https://nebula.cs.vu.nl/api/models -Headers @{ Authorization = "Bearer sk-..." }).data.id | Sort-Object -Unique
```

You should see one model ID per line, such as `FAST.gpt-oss:120b` and `SURF.Qwen3.8-27B-FP8`. An error saying `(401) Unauthorized` or `Not authenticated` means the key is wrong or not enabled.

## Step 2: Install opencode

This guide uses the npm package `opencode-ai` (version 1.19.6 on 19 November 2026), which is what we tested. It needs Node.js 18 or newer. The install command is the same everywhere; only installing Node.js differs.

**Ubuntu (tested)**

```bash
node --version          # no Node yet? install it with nvm: https://github.com/nvm-sh/nvm
npm install -g opencode-ai
opencode --version
```

If `npm install -g` fails with a permission error, you installed Node with `apt`. Install Node with nvm instead rather than using `sudo npm`.

**macOS (not tested)**

Open **Terminal** (in Applications → Utilities). Install Node with [nvm](https://github.com/nvm-sh/nvm) or, if you use [Homebrew](https://brew.sh), with `brew install node`. Then:

```bash
node --version
npm install -g opencode-ai
opencode --version
```

If `npm install -g` fails with a permission error (`EACCES`), you probably installed Node with the installer from nodejs.org. Install it with nvm or Homebrew instead rather than using `sudo npm`.

**Windows (not tested)**

Use **PowerShell** inside **Windows Terminal** (the default terminal on Windows 11; on Windows 10 install it from the Microsoft Store). opencode's full-screen interface works best there. Install Node.js LTS from [nodejs.org](https://nodejs.org), or with `winget install OpenJS.NodeJS.LTS`, then open a new PowerShell window:

```powershell
node --version
npm install -g opencode-ai
opencode --version
```

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled on this system`, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

**Windows with WSL instead:** if you already use WSL (Ubuntu inside Windows), you can open the Ubuntu app and follow the Ubuntu steps throughout. opencode then lives inside Linux and works on files in your Linux home folder; its config is separate from a native Windows install.

**A note on opencode 2.** opencode.ai now also offers version 2, installed with `curl -fsSL https://opencode.ai/v2/install | bash`, plus desktop downloads. Its [migration page](https://opencode.ai/docs/migrate-v1/) says version 2 still reads the version 1 config format used in this guide, so the config below works for both. Don't install both side by side: remove the npm version first (`npm uninstall -g opencode-ai`) if you switch. The commands in this guide (`opencode models`, `--standalone`) were tested on version 1 only.

## Step 3: Write the config file

opencode reads its settings from `~/.config/opencode/opencode.json` on all three systems. On Windows, `~` is your user folder, so the file is `C:\Users\<you>\.config\opencode\opencode.json`. You add Nebula there as a provider called `nebula`. The fields that matter:

| Field | Value | Why |
| --- | --- | --- |
| `npm` | `@ai-sdk/openai-compatible` | Nebula speaks the OpenAI API format |
| `options.baseURL` | `https://nebula.cs.vu.nl/api` | Exactly this. No `/v1` at the end, no trailing slash |
| `options.apiKey` | your `sk-...` key | See "Where to keep the key" below |
| `models` | one entry per model ID | IDs must match Nebula's list exactly, including case and `:` |
| `model` (top level) | `nebula/<model ID>` | Optional: the model opencode starts with |

Editing JSON by hand is easy to break: one missing comma or quote and opencode silently ignores the whole file. The scripts below ask for your key without showing it on screen, write the file, make sure only you can read it, and check it. Each script overwrites any earlier `opencode.json`, so make a copy first if you had other settings.

### Ubuntu and macOS: one bash script

Paste it into a terminal as one block. It works in bash (Ubuntu) and zsh (the macOS default).

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

You should see `OK`. If you see an error such as `Expecting ',' delimiter: line 12 column 5`, the file is not valid JSON; run the script again rather than fixing it by hand. Two details in the script matter: `\$schema` has a backslash so the shell doesn't treat it as a variable, and `$NEBULA_KEY` has none so your key is filled in.

**macOS:** if the last line pops up a request to install "command line developer tools", cancel it and check the file with Node instead, which you already have:

```bash
node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log('OK')" ~/.config/opencode/opencode.json
```

### Windows: one PowerShell script (not tested)

Paste it into PowerShell as one block.

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

You should see `OK`. The script writes the file as UTF-8 without a byte-order mark, which is what opencode expects; Notepad and `Out-File` in older PowerShell versions may not. Files in your user folder are readable only by you and administrators, so there is no `chmod` step. If you see an error, run the script again rather than fixing the file by hand.

### Where to keep the key

You have three options. We recommend the first.

1. **In the file (recommended).** What the scripts above do. It is the most reliable: it works in the terminal and in the desktop app. Only your user account can read it (the `chmod 600` on Ubuntu and macOS; your user folder's permissions on Windows). Never commit this file to Git or share it.
2. **In an environment variable.** Use `"apiKey": "{env:NEBULA_API_KEY}"` in the config, then set the variable:
   - Ubuntu: add `export NEBULA_API_KEY=sk-...` to `~/.bashrc`, then open a new terminal.
   - macOS: the same line in `~/.zshrc`.
   - Windows: run `[Environment]::SetEnvironmentVariable("NEBULA_API_KEY", "sk-...", "User")` once, then open a new PowerShell window.

   Caveat: if the variable isn't set in the place opencode starts from, opencode silently uses an empty key and you get `Not authenticated`. On Ubuntu and macOS, desktop apps started from the menu or Dock do not read `~/.bashrc` or `~/.zshrc`, so this often fails there. This was the cause of our first failure. On Windows, apps pick up user variables after you sign out and in again.
3. **In a separate key file.** Save only the key in `~/.config/opencode/nebula.key` (on Ubuntu and macOS, `chmod 600` it) and use `"apiKey": "{file:~/.config/opencode/nebula.key}"`. This keeps the key out of the main config, which helps if you share or back up the config. We have not tested this one.

## Step 4: Choose models and fill in the list

opencode only shows the Nebula models listed in your config, and each ID must match Nebula's exactly. Common ones as of November 2026:

| Model ID | Runs on | Use it for |
| --- | --- | --- |
| `SURF.Qwen3.8-27B-FP8` | SURF | **Recommended for opencode.** Best tool use and coding of the current models; 262K-token context |
| `FAST.gpt-oss:120b` | VU | Best choice when data must stay at VU |
| `SURF.gpt-oss-120b` | SURF | Same model as above, run at SURF |
| `FAST.gemma4:31b` | VU | General writing and chat; weaker as a coding agent |

Avoid small models (a few billion parameters) and anything marked TEST for coding work. A coding agent needs a model that calls tools reliably and has a long context window; small models loop, stall or ignore files. The list changes, so check the current one with the command in Step 1.

### Add all models automatically

These scripts ask Nebula for every model you can use and write them all into your config. They keep the names you already gave, read the key from your config (or from `NEBULA_API_KEY` if you used option 2), and never print the key. Run one again whenever Nebula adds models.

**Ubuntu (tested) and macOS:** Python version.

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

An `HTTP Error 401` means the key is wrong.

**Windows, or macOS without Python:** Node.js version. It does the same thing and needs only Node. Download [add-nebula-models.mjs](scripts/add-nebula-models.mjs) from this site and run it:

```powershell
curl.exe -fsSLO https://geo-mahdi.github.io/nebula-coding-agents-tutorial/scripts/add-nebula-models.mjs
node add-nebula-models.mjs
```

On macOS, drop the `.exe` from `curl.exe`. You should see `Wrote ... models to ...`. `HTTP 401` means the key is wrong. We checked this script against a test server, not yet against Nebula itself.

Afterwards you can delete models you don't want from the `models` list, or leave them.

### Optional: tell opencode the context size

opencode works better when it knows how much text a model accepts, because it then summarises long sessions in time. You can add a `limit` to a model entry, for example:

```json
"SURF.Qwen3.8-27B-FP8": { "name": "Qwen3.8 27B (SURF)", "limit": { "context": 262144, "output": 16384 } }
```

The `output` value is a cautious guess; Nebula doesn't publish per-model limits. Validate the file again afterwards with the check at the end of the Step 3 script.

## Step 5: Use opencode

First check that opencode sees Nebula:

```bash
# Ubuntu and macOS
opencode models --standalone | grep -i nebula
```

```powershell
# Windows
opencode models --standalone | Select-String nebula
```

You should see lines such as `nebula/SURF.Qwen3.8-27B-FP8`. Nothing? See Troubleshooting.

Then start it inside the folder you want to work on:

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

The keys are the same on all three systems: use Ctrl, not Cmd, on macOS too.

Good habits:

- Use **Plan** first on unfamiliar code, then switch to **Build**.
- Use Git, and commit before you let the agent change things, so you can undo with `git diff` and `git restore`.
- Read commands before you approve them. The model can be wrong. On Windows the agent usually runs PowerShell commands, so check those too.
- Don't use **Connect** to add OpenAI, Anthropic or other providers, and don't pick the free models opencode lists outside the Nebula group, for anything sensitive. Those go to outside companies.
- Don't use `/share`: it uploads the conversation to opencode's servers and makes a public link to it.

## The desktop app

opencode also has a desktop app. It uses the same config format, but where it looks for the file depends on how you installed it.

| How you installed it | Config file it reads |
| --- | --- |
| Ubuntu `.deb` from opencode.ai | `~/.config/opencode/opencode.json` (the same file as the terminal) |
| Ubuntu Flatpak (`ai.opencode.opencode`) | `~/.var/app/ai.opencode.opencode/config/opencode/opencode.json` |
| macOS and Windows | Not tested by us. Expected to be the same `~/.config/opencode` file (Windows: `C:\Users\<you>\.config\opencode`); if Nebula doesn't appear, use the Custom provider screen below |

For the Flatpak, copy your working config into its folder, and copy it again whenever you change the original:

```bash
mkdir -p ~/.var/app/ai.opencode.opencode/config/opencode
cp ~/.config/opencode/opencode.json ~/.var/app/ai.opencode.opencode/config/opencode/
chmod 600 ~/.var/app/ai.opencode.opencode/config/opencode/opencode.json
```

Keep the key in the file (option 1 in Step 3). On Ubuntu and macOS the desktop app doesn't see variables you set in `~/.bashrc` or `~/.zshrc`.

**Without a config file:** the app has a **Custom provider** screen in its provider settings. Enter Provider ID `nebula`, Base URL `https://nebula.cs.vu.nl/api` and your API key, then add the model IDs from Step 4. Don't use the other providers listed on that screen.

Don't run the desktop app and the terminal version at the same time; see the port error under Troubleshooting.

## Troubleshooting

| What you see | What it means | Fix |
| --- | --- | --- |
| `Not authenticated` or HTTP 401 | opencode sent no key or a wrong one | Test the key with the command in Step 1. If you used `{env:NEBULA_API_KEY}`, check the variable in the same terminal: it should print `sk-..`. Ubuntu and macOS: `echo ${NEBULA_API_KEY:0:5}`. Windows: `$env:NEBULA_API_KEY.Substring(0,5)`. Otherwise put the key in the file (Step 3, option 1) |
| No Nebula models in `/models` or in `opencode models --standalone` | The config file is invalid and opencode ignored it, or it's in the wrong place | Run the check at the end of the Step 3 script. On error, rerun the Step 3 script. For the Flatpak, check the path in the desktop app section |
| `Expecting ':' delimiter`, `Expecting ',' delimiter` or `Unexpected token` | A hand edit broke the JSON (a missing quote, colon or comma) | Rerun the Step 3 script, then the Step 4 script |
| `Managed service port ... already in use` | The desktop app and the terminal version are both running | Close one of them, or run `opencode --standalone`. If no window is open, end the leftover process. Ubuntu and macOS: find it with `ps aux \| grep -i opencode` and end it with `kill <PID>`. Windows: `Get-Process *opencode* \| Stop-Process` |
| `model not found` or 404 | The model ID in your config doesn't match Nebula's | Rerun the Step 4 script, which copies the IDs exactly. Watch for `:` versus `-`, for example `FAST.gpt-oss:120b` and `SURF.gpt-oss-120b` |
| URLs end up as `.../api/v1/...` and fail | `/v1` was added to the base URL | Use `https://nebula.cs.vu.nl/api` exactly |
| `npm.ps1 cannot be loaded` (Windows) | PowerShell blocks scripts by default | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once |
| `opencode` is not recognised as a command (Windows) or `command not found` (macOS) | The terminal was opened before Node or opencode was installed | Open a new terminal window. If it persists, reinstall Node with the installer, nvm or Homebrew as in Step 2 |
| Garbled screen or keys not working (Windows) | The old console window doesn't support opencode's interface | Use PowerShell inside Windows Terminal |
| Agent loops, stops halfway or ignores tools | The model is too small for agent work | Switch to `SURF.Qwen3.8-27B-FP8` or `FAST.gpt-oss:120b` |
| Very slow replies | Nebula is busy or loading the model | Wait a minute and try again; `FAST.*` models share VU's GPUs with other users |
| Your key was exposed | Someone else could use Nebula as you | Delete the key in Nebula (Settings → Account → API Keys), create a new one, and rerun the Step 3 script |

Still stuck? Ask the Nebula administrators at the Network Institute. Send them the error message, never your key.

## Optional: Claude Code with Nebula (not yet tested)

Claude Code is Anthropic's coding agent. Nebula's software also offers an Anthropic-style endpoint (`/api/v1/messages`), so Claude Code should be able to use Nebula models instead of Anthropic's. We have not tested this on the live Nebula server, on any system, so treat it as an experiment and check that requests really go to Nebula.

**Ubuntu and macOS**

```bash
npm install -g @anthropic-ai/claude-code
printf "Nebula key: "; read -s ANTHROPIC_AUTH_TOKEN; echo
export ANTHROPIC_AUTH_TOKEN
export ANTHROPIC_BASE_URL=https://nebula.cs.vu.nl/api
export ANTHROPIC_MODEL=SURF.Qwen3.8-27B-FP8
export ANTHROPIC_DEFAULT_HAIKU_MODEL=SURF.Qwen3.8-27B-FP8
claude
```

**Windows (PowerShell)**

```powershell
npm install -g @anthropic-ai/claude-code
$env:ANTHROPIC_AUTH_TOKEN = [System.Net.NetworkCredential]::new("", (Read-Host "Nebula key" -AsSecureString)).Password
$env:ANTHROPIC_BASE_URL = "https://nebula.cs.vu.nl/api"
$env:ANTHROPIC_MODEL = "SURF.Qwen3.8-27B-FP8"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "SURF.Qwen3.8-27B-FP8"
claude
```

These settings last only for that terminal window.

Notes:

- The base URL has no `/v1`; Claude Code adds `/v1/messages` itself.
- `ANTHROPIC_DEFAULT_HAIKU_MODEL` matters: Claude Code also makes small background calls, which would otherwise ask for an Anthropic model Nebula doesn't have.
- If Claude Code asks you to log in to an Anthropic account, the variables aren't set in that terminal. Don't log in for sensitive work, because then requests go to Anthropic.
- Claude Code is built for Anthropic's models. Expect weaker results with open models than you would get from opencode with the same model.

## Sources

- [opencode documentation](https://opencode.ai/docs), [providers](https://opencode.ai/docs/providers), [config](https://opencode.ai/docs/config), [models](https://opencode.ai/docs/models), [migrating from version 1](https://opencode.ai/docs/migrate-v1/) (read 19 November 2026)
- [opencode-ai on npm](https://www.npmjs.com/package/opencode-ai) (latest 1.19.6, 17 November 2026)
- [Nebula source code](https://github.com/networkinstitutevu/Nebula) and [Nebula API examples](https://github.com/networkinstitutevu/nebula-api-examples)
- Setup tested on Ubuntu on 19 November 2026 with opencode 1 from npm and the Flatpak desktop app. The macOS and Windows instructions were added on 22 November 2026 and have not been tested on those systems yet
