/**
 * Custom Error Classes for Miru Backend
 * 
 * Provides structured error handling with consistent HTTP status codes
 * and error codes for API responses.
 */

/**
 * Base API Error class
 * All custom errors should extend this class
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Distinguishes from programming errors

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON response format
     */
    toJSON(): Record<string, unknown> {
        return {
            error: this.message,
            code: this.code,
            statusCode: this.statusCode,
        };
    }
}

/**
 * 400 Bad Request - Invalid input or parameters
 */
export class ValidationError extends ApiError {
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            field: this.field,
        };
    }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends ApiError {
    public readonly resource: string;

    constructor(resource: string, id?: string | number) {
        const message = id
            ? `${resource} with ID "${id}" not found`
            : `${resource} not found`;
        super(message, 404, 'NOT_FOUND');
        this.resource = resource;
    }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends ApiError {
    public readonly retryAfter?: number;

    constructor(retryAfter?: number) {
        super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT');
        this.retryAfter = retryAfter;
    }

    toJSON(): Record<string, unknown> {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
        };
    }
}

/**
 * 503 Service Unavailable - External service is down
 */
export class ServiceUnavailableError extends ApiError {
    public readonly service: string;

    constructor(service: string) {
        super(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE');
        this.service = service;
    }
}

/**
 * 500 Internal Server Error - Unexpected errors
 */
export class InternalError extends ApiError {
    constructor(message: string = 'An unexpected error occurred') {
        super(message, 500, 'INTERNAL_ERROR');
    }
}

/**
 * Type guard to check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/**
 * Convert any error to an ApiError
 * Useful for wrapping unknown errors in catch blocks
 */
export function toApiError(error: unknown): ApiError {
    if (isApiError(error)) {
        return error;
    }

    if (error instanceof Error) {
        return new InternalError(error.message);
    }

    return new InternalError('An unknown error occurred');
}
