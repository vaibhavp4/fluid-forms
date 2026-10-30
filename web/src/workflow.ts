import type { FormSpec, Interpretation } from "./types";
export const issueLabels: Record<string, string> = {
  none: "Positive / no concern",
  negative_feedback: "Negative or mixed feedback",
  request: "Request or enquiry",
  wrong_material: "Wrong materials delivered",
  late_delivery: "Late delivery",
  weather: "Weather delay",
  other: "Other concern",
  uncertain: "Not sure",
};
export const activeQuestions = (spec: FormSpec, result: Interpretation) =>
  (spec.follow_up_rules || []).filter((r) => r.trigger === result.issue);
export const isSite = (spec: FormSpec) =>
  !spec.template_id || spec.template_id === "daily-site";
