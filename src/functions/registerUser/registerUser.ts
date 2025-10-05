import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { prisma } from "../../lib/prisma";
import { RegisterUserRequest } from "../../types/user";

app.http("registerUser", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "users",
  handler: async (
    req: HttpRequest,
    ctx: InvocationContext
  ): Promise<HttpResponseInit> => {
    try {
      const body = await req.json() as RegisterUserRequest;
      const email = String(body?.email ?? "").trim();
      const latitude1 = Number(body?.latitude1);
      const longitude1 = Number(body?.longitude1);
      const latitude2 = body?.latitude2 ? Number(body.latitude2) : null;
      const longitude2 = body?.longitude2 ? Number(body.longitude2) : null;

      if (!email) {
        return {
          status: 400,
          jsonBody: { error: "email is required" },
        };
      }

      if (isNaN(latitude1) || isNaN(longitude1)) {
        return {
          status: 400,
          jsonBody: {
            error: "latitude1 and longitude1 are required and must be numbers",
          },
        };
      }

      const user = await prisma.user.create({
        data: {
          email,
          latitude1,
          longitude1,
          latitude2: latitude2 || undefined,
          longitude2: longitude2 || undefined,
        },
      });

      return {
        status: 201,
        jsonBody: {
          id: user.id,
          email: user.email,
          latitude1: user.latitude1,
          longitude1: user.longitude1,
          latitude2: user.latitude2,
          longitude2: user.longitude2,
          createdAt: user.createdAt,
        },
      };
    } catch (err: any) {
      ctx.error(err);
      return {
        status: 500,
        jsonBody: {
          error: "failed to register user",
          detail: err?.message ?? String(err),
        },
      };
    }
  },
});
