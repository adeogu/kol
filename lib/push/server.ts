import webpush from "web-push";
import { createAdminSupabase } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type PushResult = {
  sent: number;
  revoked: number;
  skipped: boolean;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT ?? "mailto:support@huntstay.ie";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<PushResult> {
  if (!configureVapid()) {
    return { sent: 0, revoked: 0, skipped: true };
  }

  const admin = createAdminSupabase();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", userId)
    .is("revoked_at", null);

  if (error || !subscriptions?.length) {
    return { sent: 0, revoked: 0, skipped: false };
  }

  let sent = 0;
  let revoked = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key,
          },
        },
        JSON.stringify(payload),
        {
          TTL: 300,
        },
      );
      sent += 1;
    } catch (errorWithStatus) {
      const statusCode = (errorWithStatus as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        revoked += 1;
        await admin
          .from("push_subscriptions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("id", subscription.id);
      }
    }
  }

  return { sent, revoked, skipped: false };
}
