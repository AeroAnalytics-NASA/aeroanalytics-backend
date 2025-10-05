import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { prisma } from "../../lib/database";
import { validateRegisterUserRequest } from "../../lib/validation";
import { createPointGeometry, createOptionalPointGeometry } from "../../lib/geography";
import { RegisterUserRequest } from "../../types/user";

export const registerUser = async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
  try {
    if (req.method !== "POST") {
      return {
        status: 405,
        jsonBody: { error: "Method not allowed" }
      };
    }

    const body = await req.json() as RegisterUserRequest;

    const validation = validateRegisterUserRequest(body);
    if (!validation.isValid) {
      return {
        status: 400,
        jsonBody: { error: validation.error }
      };
    }

    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: {
        latitude1: body.latitude,
        longitude1: body.longitude,
        latitude2: body.latitude2,
        longitude2: body.longitude2,
        loc1: createPointGeometry(body.longitude, body.latitude),
        loc2: createOptionalPointGeometry(body.longitude2, body.latitude2),
        updatedAt: new Date(),
      },
      create: {
        email: body.email,
        latitude1: body.latitude,
        longitude1: body.longitude,
        latitude2: body.latitude2,
        longitude2: body.longitude2,
        loc1: createPointGeometry(body.longitude, body.latitude),
        loc2: createOptionalPointGeometry(body.longitude2, body.latitude2),
      },
    });

    return {
      status: 200,
      jsonBody: {
        id: user.id,
        email: user.email,
        latitude: user.latitude1,
        longitude: user.longitude1,
        latitude2: user.latitude2,
        longitude2: user.longitude2,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    };

  } catch (error) {

    ctx.error("Error registering user:", error);
    return {
      status: 500,
      jsonBody: { error: "Internal server error" }
    };
  }
};

app.http("registerUser", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: registerUser,
});