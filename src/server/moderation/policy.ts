export const MODERATION_REPORT_REASONS = [
  "SPAM",
  "PHISHING",
  "MALWARE",
  "IMPERSONATION",
  "ABUSE",
  "ADULT_CONTENT",
  "EXPLOITATION",
  "MINOR_SAFETY",
  "OTHER",
] as const;

export type ModerationReportReason =
  (typeof MODERATION_REPORT_REASONS)[number];

const priorities: Record<ModerationReportReason, number> = {
  MINOR_SAFETY: 100,
  EXPLOITATION: 90,
  PHISHING: 80,
  MALWARE: 80,
  IMPERSONATION: 60,
  ABUSE: 50,
  ADULT_CONTENT: 40,
  SPAM: 20,
  OTHER: 10,
};

export function moderationReasonPriority(reason: ModerationReportReason) {
  return priorities[reason];
}
