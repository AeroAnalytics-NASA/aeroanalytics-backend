import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function httpHello(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
  const name = req.query.get("name") ?? (await req.text() || "");

  return {
    status: 200,
    jsonBody: {
      message: `Hello ${name || "world"} 👋`,
      time: new Date().toISOString(),
    }
  };
}

app.http("httpHello", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: httpHello,
});
