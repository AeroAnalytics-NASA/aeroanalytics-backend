# AeroAnalytics Backend (Azure Functions + TypeScript)

Local development, adding functions, and deployment for Azure Functions (Node.js, TypeScript, Programming Model v4).

## Prerequisites

- Node.js 22
- Azure Functions Core Tools v4
- npm
- Optional: Azurite (for local emulation of Azure Storage triggers)

Project assumptions:
- Source: `src/**`
- Build output: `dist/**`
- Functions entry: `dist/index.js`
- package.json:
  ```json
  {
    "main": "dist/index.js"
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
- http://localhost:7071/api/httpHello?name=NASA

Faster feedback:
- Terminal 1: `npm run watch`
- Terminal 2: `func start`

Change port if needed:
```sh
func start --port 7072
```

## Add a new function (HTTP trigger example)

1) Create `src/functions/hello2.ts`:
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

2) Add the import to `src/index.ts`:
```ts
import "./functions/hello2";
```

3) Build and run:
```sh
npm run build
func start
```

4) Verify:
- http://localhost:7071/api/hello2?name=NASA

Note:
- Programming Model v4 does not require `function.json`. Functions are discovered from code (`app.http(...)`, `app.timer(...)`, etc.) in the built `.js`.

## Deploy

Deployment is automated via GitHub Actions. When code is pushed to the `main` branch, it will automatically build and deploy to Azure Functions.

### Automatic Deployment
- Push changes to the `main` branch
- GitHub Actions will automatically:
  1. Build the project
  1. Deploy to Azure Functions
  1. Update the live environment

### Manual Deployment (if needed)
If you need to deploy manually:

#### VS Code
1. Sign in to Azure (Azure Functions extension)
1. Command Palette: "Azure Functions: Create Function App in Azure (Advanced)"
   - Runtime: Node
   - Version: 22
   - OS: Linux
   - Plan: Flex Consumption
1. Right-click the project > "Deploy to Function App"
1. `local.settings.json` is not deployed; copy required settings into Azure Portal > Function App > Configuration

#### Azure CLI
```sh
npm ci
npm run build
func azure functionapp publish <APP_NAME>
```

### Verify Deployment
After deployment, verify the functions are working:
```sh
curl "https://<APP_NAME>.azurewebsites.net/api/httpHello?name=NASA"
```

## References

- Azure Functions (Node v4) Programming Model: https://aka.ms/AzFuncNodeV4
- Run locally with Core Tools: https://learn.microsoft.com/azure/azure-functions/functions-run-local
- Azurite: https://github.com/Azure/Azurite
