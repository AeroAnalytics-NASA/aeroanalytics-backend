import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { prisma } from "../lib/prisma";

app.http("updateUserSubscription", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users/{id}/subscription/{action}",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const userId = req.params.id;
      const action = req.params.action;

      if (!userId) {
        return {
          status: 400,
          jsonBody: { error: "user id is required" }
        };
      }

      if (!action || (action !== "subscribe" && action !== "unsubscribe")) {
        return {
          status: 400,
          jsonBody: { error: "action must be 'subscribe' or 'unsubscribe'" }
        };
      }

      const isSubscribed = action === "subscribe";

      const user = await prisma.user.update({
        where: { id: userId },
        data: { isSubscribed }
      });

      return {
        status: 200,
        jsonBody: {
          id: user.id,
          email: user.email,
          isSubscribed: user.isSubscribed,
          message: `Successfully ${action}d`,
          updatedAt: user.updatedAt
        }
      };
    } catch (err: any) {
      ctx.error(err);
      if (err.code === 'P2025') {
        return {
          status: 404,
          jsonBody: { error: "user not found" }
        };
      }
      return {
        status: 500,
        jsonBody: { error: "failed to update user subscription", detail: err?.message ?? String(err) }
      };
    }
  }
});