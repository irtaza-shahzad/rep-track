/**
 * Domain Models - User Aggregate
 * Following Domain-Driven Design principles
 * Immutable and encapsulated
 */

export interface IUser {
    getId(): number;
    getFullName(): string;
    getEmail(): string;
    getCreatedAt(): Date;
    toJSON(): UserDTO;
}

export interface UserDTO {
    id: number;
    full_name: string;
    email: string;
    created_at: string;
}

/**
 * User Entity
 * Represents a user in the system
 */
export class User implements IUser {
    private constructor(
        private readonly id: number,
        private readonly fullName: string,
        private readonly email: string,
        private readonly createdAt: Date
    ) { }

    /**
     * Factory method to create User from DTO
     * @param dto - User data transfer object
     */
    static fromDTO(dto: UserDTO): User {
        return new User(
            dto.id,
            dto.full_name,
            dto.email,
            new Date(dto.created_at)
        );
    }

    /**
     * Factory method to create new User
     */
    static create(fullName: string, email: string): { fullName: string; email: string; createdAt: Date } {
        return {
            fullName,
            email,
            createdAt: new Date(),
        };
    }

    // Getters following encapsulation
    getId(): number {
        return this.id;
    }

    getFullName(): string {
        return this.fullName;
    }

    getEmail(): string {
        return this.email;
    }

    getCreatedAt(): Date {
        return new Date(this.createdAt); // Return copy to maintain immutability
    }

    /**
     * Convert to DTO for API communication
     */
    toJSON(): UserDTO {
        return {
            id: this.id,
            full_name: this.fullName,
            email: this.email,
            created_at: this.createdAt.toISOString(),
        };
    }

    /**
     * Compare users by ID
     */
    equals(other: User): boolean {
        return this.id === other.id;
    }
}
