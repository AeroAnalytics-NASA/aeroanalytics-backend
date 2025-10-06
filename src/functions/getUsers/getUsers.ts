import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { prisma } from "../../lib/prisma";

app.http("getUsers", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "users",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return {
        status: 200,
        jsonBody: users.map(user => ({
          id: user.id,
          email: user.email,
          latitude1: user.latitude1,
          longitude1: user.longitude1,
          latitude2: user.latitude2,
          longitude2: user.longitude2,
          isSubscribed: user.isSubscribed,
          createdAt: user.createdAt
        }))
      };
    } catch (err: any) {
      ctx.error(err);
      return {
        status: 500,
        jsonBody: { error: "failed to get users", detail: err?.message ?? String(err) }
      };
    }
  }
});