# AeroAnalytics Backend (Azure Functions + TypeScript)

Local development, adding functions, and deployment for Azure Functions (Node.js, TypeScript, Programming Model v4).

## Prerequisites

- Node.js 18 or 20
- Azure Functions Core Tools v4
- npm
- Optional: Azurite (for local emulation of Azure Storage triggers)

Project assumptions:
- Source: `src/**`
- Build output: `dist/**`
- Functions entry: `dist/functions/**/index.js`
- package.json:
  ```json
  {
    "main": "dist/functions/**/index.js"
  }
  ```

### macOS
- Core Tools:
  ```sh
  brew tap azure/functions
  brew install azure-functions-core-tools@4
  ```
  If `func` isn’t found (zsh):
  ```sh
  echo 'export PATH="/opt/homebrew/opt/azure-functions-core-tools@4/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```
- Azurite (optional):
  ```sh
  npm i -g azurite
  ```

### Windows
- Core Tools (pick one):
  - Winget:
    ```powershell
    winget install -e --id Microsoft.AzureFunctionsCoreTools
    ```
  - Chocolatey:
    ```powershell
    choco install azure-functions-core-tools-4 -y
    ```
  Then restart Terminal/PowerShell and verify:
  ```powershell
  func --version
  ```
- Azurite (optional):
  ```powershell
  npm i -g azurite
  ```

## Setup

Install dependencies:
```sh
npm ci
```

Create `local.settings.json` if needed (do not commit):
```jsonc
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true" // only when using Storage-based triggers
  }
}
```

## Run locally

- One command:
  ```sh
  npm start
  ```
  Runs `clean -> build -> func start`.

- Manual:
  ```sh
  npm run clean
  npm run build
  func start
  ```

You should see something like:
```
Functions:

        httpHello: [GET,POST] http://localhost:7071/api/httpHello
```

Test:
- http://localhost:7071/api/httpHello?name=Masa

Faster feedback:
- Terminal 1: `npm run watch`
- Terminal 2: `func start`

Change port if needed:
```sh
func start --port 7072
```

## Add a new function (HTTP trigger example)

1) Create `src/functions/hello2/index.ts`:
```ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function hello2(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const name = req.query.get("name") ?? (await req.text() || "");
  return {
    status: 200,
    jsonBody: { message: `Hello2 ${name || "world"} 👋`, time: new Date().toISOString() }
  };
}

app.http("hello2", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: hello2,
});
```

2) Build and run:
```sh
npm run build
func start
```

3) Verify:
- http://localhost:7071/api/hello2?name=Masa

Note:
- Programming Model v4 does not require `function.json`. Functions are discovered from code (`app.http(...)`, `app.timer(...)`, etc.) in the built `.js`.

## Deploy

### VS Code
1) Sign in to Azure (Azure Functions extension)
2) Command Palette: “Azure Functions: Create Function App in Azure (Advanced)”
   - Runtime: Node
   - Version: 18 or 20
   - OS: Linux
   - Plan: Consumption
3) Right-click the project > “Deploy to Function App”
4) `local.settings.json` is not deployed; copy required settings into Azure Portal > Function App > Configuration

### Azure CLI (macOS/Windows)
Bash/zsh:
```sh
az login
RG=aeroanalytics-rg
LOC=japaneast
SA=aeroanalyticssa$RANDOM
APP=aeroanalytics-func-$RANDOM

az group create -n $RG -l $LOC
az storage account create -n $SA -g $RG -l $LOC --sku Standard_LRS
az functionapp create -n $APP -g $RG -s $SA -c $LOC \
  --consumption-plan-location $LOC --runtime node --runtime-version 20 \
  --functions-version 4 --os-type Linux

npm ci
npm run build
func azure functionapp publish $APP
```

Windows PowerShell (env vars syntax):
```powershell
az login
$env:RG = "aeroanalytics-rg"
$env:LOC = "japaneast"
$env:SA = "aeroanalyticssa$([Random]::new().Next(10000,99999))"
$env:APP = "aeroanalytics-func-$([Random]::new().Next(10000,99999))"

az group create -n $env:RG -l $env:LOC
az storage account create -n $env:SA -g $env:RG -l $env:LOC --sku Standard_LRS
az functionapp create -n $env:APP -g $env:RG -s $env:SA -c $env:LOC `
  --consumption-plan-location $env:LOC --runtime node --runtime-version 20 `
  --functions-version 4 --os-type Linux

npm ci
npm run build
func azure functionapp publish $env:APP
```

Verify:
```sh
curl "https://$APP.azurewebsites.net/api/httpHello?name=Masa"
```

## Troubleshooting

- Worker cannot find entry point:
  ```
  Error: Worker was unable to load entry point "dist/.../*.js": Found zero files matching the supplied pattern
  ```
  Fix:
  - Ensure `tsconfig.json` has `"rootDir": "src"`, `"outDir": "dist"`.
  - Ensure built files exist under `dist/functions/.../index.js`:
    ```sh
    ls dist/functions/httpHello/
    ```
  - Ensure `package.json` has `"main": "dist/functions/**/index.js"`.
  - Rebuild and restart:
    ```sh
    npm run clean && npm run build && func start
    ```
  - Use `func start --verbose` for more detail.

- Port in use:
  ```sh
  func start --port 7072
  ```

- Extension bundle/SSL or proxy issues:
  - Set proxy (if corporate network):
    ```sh
    export HTTPS_PROXY="http://proxy:port"
    export HTTP_PROXY="http://proxy:port"
    ```
  - Try again later in case of transient network errors.

## References

- Azure Functions (Node v4) Programming Model: https://aka.ms/AzFuncNodeV4
- Run locally with Core Tools: https://learn.microsoft.com/azure/azure-functions/functions-run-local
- Azurite: https://github.com/Azure/Azurite