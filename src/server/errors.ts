export type AppErrorCode="UNAUTHORIZED"|"FORBIDDEN"|"NOT_FOUND"|"VALIDATION_ERROR"|"RATE_LIMITED"|"FEATURE_NOT_AVAILABLE"|"PLAN_LIMIT_REACHED"|"ACCOUNT_SUSPENDED"|"CONFLICT";
export class AppError extends Error{constructor(public readonly code:AppErrorCode,message:string,public readonly cause?:unknown){super(message);this.name="AppError";}}
