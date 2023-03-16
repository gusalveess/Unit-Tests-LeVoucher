type AppErrorTypes =
  | "conflict"
  | "not_found"
  | "unauthorized"
  | "wrong_schema"
  | "bad_request";
  
export interface AppError {
  type: AppErrorTypes;
  name: string;
  message: string;
}

export function isAppError(error: object): error is AppError {
  return (error as AppError).type !== undefined;
}

export function errorTypeToStatusCode(type: AppErrorTypes) {
  if (type === "conflict") return 409;
  if (type === "not_found") return 404;
  if (type === "unauthorized") return 401;
  if (type === "wrong_schema") return 422;

  return 400;
}

export function badRequestError(message?: string): AppError {
  return { type: "bad_request", name: 'BadRequest', message };
}

export function conflictError(message?: string): AppError {
  return { type: "conflict", name: 'Conflict', message };
}

export function notFoundError(message?: string): AppError {
  return { type: "not_found", name: 'NotFound', message };
}

export function unauthorizedError(message?: string): AppError {
  return { type: "unauthorized", name: 'Unauthorized', message };
}

export function wrongSchemaError(message?: string): AppError {
  return { type: "wrong_schema", name: 'WrongSchema', message };
}