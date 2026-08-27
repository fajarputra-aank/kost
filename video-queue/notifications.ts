export type RenderNotification = {
  eventId: string;
  userId: string;
  renderJobId: string;
  status: "completed" | "failed";
  title: string;
  message: string;
  outputUrl?: string;
};

export interface NotificationSink {
  hasSent(eventId: string): Promise<boolean>;
  send(notification: RenderNotification): Promise<void>;
}

export async function notifyRenderFinished(sink: NotificationSink, notification: RenderNotification) {
  if (await sink.hasSent(notification.eventId)) return { sent: false, reason: "duplicate" as const };
  await sink.send(notification);
  return { sent: true as const };
}

export function notificationForCompletedRender(input: {
  eventId: string;
  userId: string;
  renderJobId: string;
  outputUrl: string;
}): RenderNotification {
  return {
    ...input,
    status: "completed",
    title: "Video MP4 siap",
    message: "Render video selesai dan siap diunduh.",
  };
}

export function notificationForFailedRender(input: {
  eventId: string;
  userId: string;
  renderJobId: string;
  errorMessage: string;
}): RenderNotification {
  return {
    ...input,
    status: "failed",
    title: "Render video gagal",
    message: input.errorMessage,
  };
}
