export class ApiError extends Error {
  public status: number;
  public details?: any;
  public code?: string;

  constructor(status: number, message: string, details?: any, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}
