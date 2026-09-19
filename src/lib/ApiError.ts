export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  static badRequest = (m: string, d?: unknown) => new ApiError(400, m, d);
  static unauthorized = (m = "Not authenticated") => new ApiError(401, m);
  static forbidden = (m = "Not allowed") => new ApiError(403, m);
  static notFound = (m = "Not found") => new ApiError(404, m);
  static tooMany = (m = "Too many requests") => new ApiError(429, m);
}
