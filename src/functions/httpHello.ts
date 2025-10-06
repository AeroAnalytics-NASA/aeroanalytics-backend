import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export const httpHello = async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
  const name = req.query.get("name") ?? (await req.text() || "");

  return {
    status: 200,
    jsonBody: {
      message: `Hello ${name || "world"} 👋`,
      time: new Date().toISOString(),
    }
  };
};

app.http("httpHello", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: httpHello,
});