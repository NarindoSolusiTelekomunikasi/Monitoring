# Free Deployment Guide

This project can be deployed for free with:

- Frontend: GitHub Pages
- Backend API: Google Apps Script

## 1. Deploy Google Apps Script

Use the files in [`apps-script`](./apps-script).

1. Open [https://script.new](https://script.new)
2. Paste [`Code.gs`](./apps-script/Code.gs)
3. Replace the manifest with [`appsscript.json`](./apps-script/appsscript.json)
4. In `Project Settings` -> `Script properties`, add:

```text
SPREADSHEET_ID=1xKFr7vfaEltmSJu6UAodKBqk-fdST8I9vEU-fyC1xLM
```

5. Deploy as a `Web app`
6. Execute as: `Me`
7. Access: `Anyone`
8. Copy the final `.../exec` URL

Test:

```text
https://YOUR_SCRIPT_URL/exec?route=health
```

## 2. Configure GitHub Pages Workflow Variables

In GitHub:

1. Open repo `Settings`
2. Open `Secrets and variables`
3. Open `Actions`
4. Create repository variable:

```text
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Optional variables:

```text
VITE_API_STYLE=apps-script
VITE_AUTO_REFRESH_MS=30000
VITE_ROUTER_MODE=hash
VITE_BASE_PATH=/Monitoring/
```

## 3. Enable GitHub Pages

1. Open repo `Settings`
2. Open `Pages`
3. Source: `GitHub Actions`

The workflow file is [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml).

## 4. Push Changes

From the repo root:

```bash
git add .
git commit -m "Configure free deployment"
git push
```

## 5. Open the Website

After GitHub Actions finishes, your site will be available at:

```text
https://narindosolusitelekomunikasi.github.io/Monitoring/
```
