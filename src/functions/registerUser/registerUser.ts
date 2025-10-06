import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { prisma } from "../../lib/prisma";
import { RegisterUserRequest } from "../../types/user";
import * as sgMail from "@sendgrid/mail";

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

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

      // Send subscription verification email
      try {
        await sendSubscriptionVerificationEmail(user, ctx);
        ctx.log(`Verification email sent to ${user.email}`);
      } catch (emailError) {
        ctx.error(`Failed to send verification email to ${user.email}:`, emailError);
        // Continue with user creation even if email fails
      }

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

async function sendSubscriptionVerificationEmail(
  user: {
    id: string;
    email: string;
    latitude1: number;
    longitude1: number;
    latitude2: number | null;
    longitude2: number | null;
  },
  context: InvocationContext
): Promise<void> {
  if (!apiKey) {
    context.warn("SendGrid API key not configured, skipping verification email");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@aeroanalytics.com";
  const baseUrl = process.env.BASE_URL || "http://localhost:7071";
  const subscribeUrl = `${baseUrl}/api/users/${user.id}/subscription/subscribe`;
  const unsubscribeUrl = `${baseUrl}/api/users/${user.id}/subscription/unsubscribe`;

  const msg = {
    to: user.email,
    from: fromEmail,
    subject: "Welcome to AeroAnalytics - Confirm Your Subscription",
    html: `
      <h2>Welcome to AeroAnalytics!</h2>
      <p>Thank you for registering with AeroAnalytics. Your account has been created successfully.</p>
      
      <p><strong>Your registered locations:</strong></p>
      <ul>
        <li>Primary: ${user.latitude1}, ${user.longitude1}</li>
        ${user.latitude2 && user.longitude2 ? 
          `<li>Secondary: ${user.latitude2}, ${user.longitude2}</li>` : 
          ''
        }
      </ul>
      
      <h3>Subscription Options</h3>
      <p>Would you like to receive notifications for your monitored areas?</p>
      
      <p>
        <a href="${subscribeUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          ✅ Yes, Subscribe to Notifications
        </a>
      </p>
      
      <p>
        <a href="${unsubscribeUrl}" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          ❌ No, Don't Send Notifications
        </a>
      </p>
      
      <hr>
      <p><small>
        You can change your subscription preferences at any time by using the links above.<br>
        If you didn't create this account, please ignore this email.
      </small></p>
    `,
    text: `
      Welcome to AeroAnalytics!
      
      Thank you for registering with AeroAnalytics. Your account has been created successfully.
      
      Your registered locations:
      - Primary: ${user.latitude1}, ${user.longitude1}
      ${user.latitude2 && user.longitude2 ? 
        `- Secondary: ${user.latitude2}, ${user.longitude2}` : 
        ''
      }
      
      Subscription Options:
      Would you like to receive notifications for your monitored areas?
      
      Subscribe to notifications: ${subscribeUrl}
      Don't send notifications: ${unsubscribeUrl}
      
      You can change your subscription preferences at any time by using the links above.
      If you didn't create this account, please ignore this email.
    `
  };

  await sgMail.send(msg);
}
