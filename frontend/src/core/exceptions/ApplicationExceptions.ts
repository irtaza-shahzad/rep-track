/**
 * Custom Exception Classes
 * Following Exception Hierarchy Pattern
 */

/**
 * Base Application Exception
 * All custom exceptions should extend this
 */
export class ApplicationException extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Authentication related exceptions
 */
export class AuthenticationException extends ApplicationException {
    constructor(message: string = 'Authentication failed') {
        super(message, 'AUTH_ERROR', 401);
    }
}

export class UnauthorizedException extends ApplicationException {
    constructor(message: string = 'Unauthorized access') {
        super(message, 'UNAUTHORIZED', 403);
    }
}

/**
 * Validation related exceptions
 */
export class ValidationException extends ApplicationException {
    constructor(
        message: string,
        public readonly errors: Record<string, string[]> = {}
    ) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}

/**
 * Resource not found exception
 */
export class NotFoundException extends ApplicationException {
    constructor(resource: string, identifier?: string | number) {
        const message = identifier
            ? `${resource} with identifier ${identifier} not found`
            : `${resource} not found`;
        super(message, 'NOT_FOUND', 404);
    }
}

/**
 * Business logic violation exception
 */
export class BusinessRuleException extends ApplicationException {
    constructor(message: string) {
        super(message, 'BUSINESS_RULE_VIOLATION', 422);
    }
}

/**
 * Network related exceptions
 */
export class NetworkException extends ApplicationException {
    constructor(message: string = 'Network error occurred') {
        super(message, 'NETWORK_ERROR', 503);
    }
}

/**
 * Data consistency exception
 */
export class DataIntegrityException extends ApplicationException {
    constructor(message: string) {
        super(message, 'DATA_INTEGRITY_ERROR', 409);
    }
}
