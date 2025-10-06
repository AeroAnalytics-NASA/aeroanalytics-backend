import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

/**
 * Azure Functions HTTP trigger for a simple hello world endpoint
 * Accepts an optional name parameter and returns a greeting message
 *
 * @param req - The HTTP request object containing query parameters or request body
 * @param ctx - The Azure Functions invocation context for logging
 * @returns Promise resolving to HTTP response with greeting message and timestamp
 *
 * @example
 * GET /?name=John → { message: "Hello John 👋", time: "2025-10-06T..." }
 * GET / → { message: "Hello world 👋", time: "2025-10-06T..." }
 */
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