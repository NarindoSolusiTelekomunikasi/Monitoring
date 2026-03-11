# Google Apps Script Backend

This folder contains a free spreadsheet-backed API for the frontend.

## What it does

- Reads the Google Sheet directly by spreadsheet ID
- Exposes JSON endpoints through a Google Apps Script web app
- Supports the same frontend data shapes used by the current dashboard

## Deploy Steps

1. Open [https://script.new](https://script.new)
2. Replace the default `Code.gs` with [`Code.gs`](./Code.gs)
3. Add the manifest from [`appsscript.json`](./appsscript.json)
4. In Apps Script:
   - `Project Settings`
   - `Script properties`
   - add `SPREADSHEET_ID=1xKFr7vfaEltmSJu6UAodKBqk-fdST8I9vEU-fyC1xLM`
5. Click `Deploy` -> `New deployment`
6. Type: `Web app`
7. Execute as: `Me`
8. Who has access: `Anyone`
9. Deploy
10. Copy the `.../exec` URL

## Route Format

Use query-based routes:

- `...?route=health`
- `...?route=dashboard`
- `...?route=tickets`
- `...?route=tickets/INC123`
- `...?route=teams`
- `...?route=imjas`
- `...?route=unspec`

Example:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?route=health
```
