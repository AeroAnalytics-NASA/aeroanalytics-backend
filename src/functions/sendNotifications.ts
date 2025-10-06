import { app, InvocationContext, Timer } from "@azure/functions";
import { prisma } from "../lib/prisma";
import * as sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

app.timer("sendNotifications", {
  schedule: process.env.NOTIFICATION_CRON_SCHEDULE || "0 0 9 * * *", // Default: daily at 9:00 AM
  handler: async (
    _myTimer: Timer,
    context: InvocationContext
  ): Promise<void> => {
    context.log("Notification timer trigger function started");

    // Check if notifications are enabled
    const notificationsEnabled = process.env.NOTIFICATIONS_ENABLED === "true";
    if (!notificationsEnabled) {
      context.log("Notifications are disabled via NOTIFICATIONS_ENABLED flag");
      return;
    }

    try {
      // Get notification area from environment variables (default: Vancouver area)
      const notificationArea = {
        minLat: parseFloat(process.env.NOTIFICATION_MIN_LAT || "49.0"),
        maxLat: parseFloat(process.env.NOTIFICATION_MAX_LAT || "49.5"),
        minLng: parseFloat(process.env.NOTIFICATION_MIN_LNG || "-123.5"),
        maxLng: parseFloat(process.env.NOTIFICATION_MAX_LNG || "-123.0"),
      };

      context.log("Notification area:", notificationArea);

      // Get subscribed users within the specified area
      const subscribedUsers = await prisma.user.findMany({
        where: {
          isSubscribed: true,
          OR: [
            {
              AND: [
                { latitude1: { gte: notificationArea.minLat } },
                { latitude1: { lte: notificationArea.maxLat } },
                { longitude1: { gte: notificationArea.minLng } },
                { longitude1: { lte: notificationArea.maxLng } },
              ],
            },
            {
              AND: [
                { latitude2: { gte: notificationArea.minLat } },
                { latitude2: { lte: notificationArea.maxLat } },
                { longitude2: { gte: notificationArea.minLng } },
                { longitude2: { lte: notificationArea.maxLng } },
              ],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          latitude1: true,
          longitude1: true,
          latitude2: true,
          longitude2: true,
        },
      });

      context.log(
        `Found ${subscribedUsers.length} subscribed users in the notification area`
      );

      if (subscribedUsers.length === 0) {
        context.log("No subscribed users found in the notification area");
        return;
      }

      // Process notifications for each user
      for (const user of subscribedUsers) {
        try {
          await sendNotificationToUser(user, context);
          context.log(`Notification sent to user ${user.id} (${user.email})`);
        } catch (error) {
          context.error(
            `Failed to send notification to user ${user.id}:`,
            error
          );
        }
      }

      context.log("Notification timer trigger function completed");
    } catch (error) {
      context.error("Error in notification timer function:", error);
      throw error;
    }
  },
});

const sendNotificationToUser = async (
  user: {
    id: string;
    email: string;
    latitude1: number;
    longitude1: number;
    latitude2: number | null;
    longitude2: number | null;
  },
  context: InvocationContext
): Promise<void> => {
  context.log(
    `Preparing notification for user ${user.email} at coordinates (${user.latitude1}, ${user.longitude1})`
  );

  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL || "noreply@aeroanalytics.com";
  const unsubscribeUrl = `${process.env.BASE_URL || "http://localhost:7071"}/api/users/${user.id}/subscription/unsubscribe`;

  const msg = {
    to: user.email,
    from: fromEmail,
    subject: "AeroAnalytics Notification",
    html: `
      <h2>AeroAnalytics Update</h2>
      <p>Hello!</p>
      <p>This is your notification for the area you're monitoring.</p>
      <p><strong>Your Locations:</strong></p>
      <ul>
        <li>Primary: ${user.latitude1}, ${user.longitude1}</li>
        ${
          user.latitude2 && user.longitude2
            ? `<li>Secondary: ${user.latitude2}, ${user.longitude2}</li>`
            : ""
        }
      </ul>
      <p>Notification sent at: ${new Date().toLocaleString()}</p>
      <hr>
      <p><small>
        Don't want to receive these notifications?
        <a href="${unsubscribeUrl}">Unsubscribe here</a>
      </small></p>
    `,
    text: `
      AeroAnalytics Update

      Hello!

      This is your notification for the area you're monitoring.

      Your Locations:
      - Primary: ${user.latitude1}, ${user.longitude1}
      ${
        user.latitude2 && user.longitude2
          ? `- Secondary: ${user.latitude2}, ${user.longitude2}`
          : ""
      }

      Notification sent at: ${new Date().toLocaleString()}

      Don't want to receive these notifications?
      Unsubscribe here: ${unsubscribeUrl}
    `,
  };

  try {
    await sgMail.send(msg);
    context.log(`Email sent successfully to ${user.email}`);
  } catch (error) {
    context.error(`Failed to send email to ${user.email}:`, error);
    throw error;
  }
};