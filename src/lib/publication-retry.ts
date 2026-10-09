/** P1 deterministic Make delivery classification; no network calls or credentials. */
export type PublicationPresence = "present" | "missing" | "unknown";
export type DeliveryClassification = "acknowledged" | "transient" | "ambiguous" | "conflict" | "terminal";
export type PublicationFollowUp = "confirmed" | "retry-status" | "retry-same-payload" | "failed" | "status-unknown";
export interface MakeDeliveryObservation {
  httpStatus?: number | null;
  success?: boolean | null;
  receivedType?: string | null;
}
export function classifyMakeDelivery(
  observation: MakeDeliveryObservation,
  expectedReportType: string,
): DeliveryClassification {
  const { httpStatus, success, receivedType } = observation;
  if (httpStatus === 409) return "conflict";
  if (httpStatus != null) {
    if ([400, 401, 403, 404, 415, 422].includes(httpStatus)) return "terminal";
    if ([408, 425, 429].includes(httpStatus) || (httpStatus >= 500 && httpStatus <= 599)) return "transient";
    if (httpStatus < 200 || httpStatus >= 300) return "terminal";
  }
  if (success === true && receivedType === expectedReportType) return "acknowledged";
  if (success === true && receivedType !== expectedReportType) return "terminal";
  return "ambiguous";
}
export function decidePublicationFollowUp(args: {
  delivery: DeliveryClassification;
  presence: PublicationPresence;
  attemptsMade: number;
  statusChecksMade: number;
}): PublicationFollowUp {
  const { delivery, presence, attemptsMade, statusChecksMade } = args;
  if (presence === "present") return "confirmed";
  if (presence === "unknown") return statusChecksMade < 3 ? "retry-status" : "status-unknown";
  if (delivery === "acknowledged") return statusChecksMade < 3 ? "retry-status" : "failed";
  if (delivery === "terminal" || delivery === "conflict") return "failed";
  return attemptsMade < 3 ? "retry-same-payload" : "failed";
}
