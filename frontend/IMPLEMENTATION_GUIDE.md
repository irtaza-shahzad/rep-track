# Frontend Refactoring Implementation Guide

## Current Status

✅ **Architecture Designed** - Complete layered architecture following SDA principles
✅ **Core Layer Complete** - Constants, Exceptions, Interfaces, Types
✅ **Domain Models Created** - User and Exercise entities with proper encapsulation
✅ **Repository Interfaces Defined** - Following Repository Pattern and DIP
✅ **HTTP Client Adapter** - Axios adapter implementing IHttpClient interface

## Design Patterns Implemented

### 1. **Layered Architecture** ⭐⭐⭐

- **Core Layer**: Framework-agnostic utilities, interfaces, constants
- **Domain Layer**: Business entities and value objects
- **Infrastructure Layer**: External concerns (API, storage, repositories)
- **Application Layer**: Business logic, services, use cases
- **Presentation Layer**: UI components and React-specific code

### 2. **Repository Pattern** ⭐⭐⭐

```typescript
// Interface (abstraction)
interface IUserRepository {
  findById(id: number): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
}

// Implementation (concrete)
class UserRepositoryImpl implements IUserRepository {
  constructor(private httpClient: IHttpClient) {}
  // Implementation details...
}
```

### 3. **Dependency Inversion Principle (DIP)** ⭐⭐⭐

- High-level modules depend on abstractions (interfaces)
- Services depend on IRepository, not concrete implementations
- Easy to swap implementations (API → LocalStorage → Mock)

### 4. **Adapter Pattern** ⭐⭐

```typescript
// Our interface
interface IHttpClient {
  get();
  post();
  put();
  delete();
}

// Axios adapter
class AxiosHttpClient implements IHttpClient {
  // Adapts axios to our interface
}
```

### 5. **Singleton Pattern** ⭐⭐

```typescript
class AxiosHttpClient {
  private static instance: AxiosHttpClient;

  public static getInstance(): AxiosHttpClient {
    if (!this.instance) {
      this.instance = new AxiosHttpClient();
    }
    return this.instance;
  }
}
```

### 6. **Factory Pattern** ⭐⭐

```typescript
class User {
  private constructor() {} // Private constructor

  // Factory method
  static fromDTO(dto: UserDTO): User {
    return new User(dto.id, dto.full_name, dto.email);
  }

  static create(name: string, email: string): Partial<User> {
    return { fullName: name, email, createdAt: new Date() };
  }
}
```

### 7. **Exception Hierarchy** ⭐⭐

```typescript
ApplicationException (base)
├── AuthenticationException
├── ValidationException
├── NotFoundException
├── BusinessRuleException
└── NetworkException
```

## SOLID Principles Application

### Single Responsibility Principle (SRP) ✅

- Each class has one reason to change
- `UserRepository` → Only data access
- `UserService` → Only business logic
- `UserComponent` → Only UI rendering

### Open/Closed Principle (OCP) ✅

- Open for extension, closed for modification
- Can add new repository implementations without changing service
- Can add new strategies without modifying strategy pattern

### Liskov Substitution Principle (LSP) ✅

- Any `IRepository` implementation can be substituted
- All implementations honor the contract

### Interface Segregation Principle (ISP) ✅

- Small, focused interfaces
- `IHttpClient` has only HTTP methods
- `IUserRepository` extends base `IRepository` with user-specific methods

### Dependency Inversion Principle (DIP) ✅

- Depend on abstractions (interfaces), not concretions
- Services receive `IRepository` interface, not concrete class

## Next Steps to Complete

### 1. Implement Repository Implementations

```typescript
// src/infrastructure/repositories/UserRepositoryImpl.ts
export class UserRepositoryImpl implements IUserRepository {
  constructor(private httpClient: IHttpClient) {}

  async findById(id: number): Promise<User> {
    const response = await this.httpClient.get<UserDTO>(`/api/users/${id}`);
    return User.fromDTO(response.data);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const response = await this.httpClient.get<UserDTO>(
        `/api/users/email/${email}`
      );
      return User.fromDTO(response.data);
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  // ... other methods
}
```

### 2. Implement Service Layer

```typescript
// src/application/services/AuthService.ts
export class AuthService {
  constructor(
    private userRepository: IUserRepository,
    private httpClient: IHttpClient
  ) {}

  async login(email: string, password: string): Promise<User> {
    // Validation
    if (!email || !password) {
      throw new ValidationException("Email and password required");
    }

    // Business logic
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const response = await this.httpClient.post("/api/auth/login", formData);
    const user = User.fromDTO(response.data.user);

    // Store token
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.access_token);
    this.userRepository.setCurrentUser(user);

    return user;
  }
}
```

### 3. Create Strategy Pattern for Unit Conversion

```typescript
// src/application/strategies/IUnitConversionStrategy.ts
interface IUnitConversionStrategy {
  convert(value: number, fromUnit: string, toUnit: string): number;
}

class WeightConversionStrategy implements IUnitConversionStrategy {
  convert(value: number, from: string, to: string): number {
    if (from === "lbs" && to === "kg") return value * 0.453592;
    if (from === "kg" && to === "lbs") return value * 2.20462;
    return value;
  }
}
```

### 4. Update Components to Use Services

```typescript
// src/presentation/pages/LoginPage.tsx
function LoginPage() {
  const authService = useService(AuthService); // From DI container

  const handleLogin = async () => {
    try {
      const user = await authService.login(email, password);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof ValidationException) {
        // Show validation errors
      } else if (error instanceof AuthenticationException) {
        // Show auth error
      }
    }
  };
}
```

### 5. Create Dependency Injection Container

```typescript
// src/di/Container.ts
class DIContainer {
  private static instance: DIContainer;
  private services = new Map();

  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) throw new Error(`Service ${key} not registered`);
    return factory();
  }
}

// Setup
const container = DIContainer.getInstance();

// Register dependencies
const httpClient = AxiosHttpClient.getInstance();
container.register("HttpClient", () => httpClient);
container.register("UserRepository", () => new UserRepositoryImpl(httpClient));
container.register(
  "AuthService",
  () =>
    new AuthService(
      container.resolve("UserRepository"),
      container.resolve("HttpClient")
    )
);
```

## Benefits of This Architecture

1. **Testability** ⭐⭐⭐

   - Easy to mock dependencies
   - Each layer tested independently
   - Services receive interfaces, can inject mocks

2. **Maintainability** ⭐⭐⭐

   - Clear separation of concerns
   - Changes isolated to specific layers
   - Easy to understand code organization

3. **Scalability** ⭐⭐⭐

   - Can add new features without modifying existing code
   - Can swap implementations easily
   - Can add new strategies/patterns

4. **Flexibility** ⭐⭐
   - Can change backend (REST → GraphQL)
   - Can change storage (API → LocalStorage)
   - Can change HTTP library (axios → fetch)

## File Organization Quick Reference

```
src/
├── core/                      # Framework agnostic
│   ├── constants/
│   │   └── AppConstants.ts
│   ├── interfaces/
│   │   ├── IRepository.ts
│   │   └── IHttpClient.ts
│   ├── exceptions/
│   │   └── ApplicationExceptions.ts
│   └── types/
│
├── domain/                    # Business entities
│   ├── models/
│   │   ├── User.ts
│   │   └── Exercise.ts
│   └── enums/
│       └── DomainEnums.ts
│
├── infrastructure/            # External concerns
│   ├── api/
│   │   └── AxiosHttpClient.ts (Adapter Pattern)
│   └── repositories/
│       ├── UserRepositoryImpl.ts
│       └── WorkoutRepositoryImpl.ts
│
├── application/               # Business logic
│   ├── services/
│   │   ├── AuthService.ts
│   │   └── WorkoutService.ts
│   ├── factories/
│   │   └── WorkoutFactory.ts
│   └── strategies/
│       └── UnitConversionStrategy.ts
│
└── presentation/              # UI layer
    ├── pages/
    ├── components/
    └── hooks/

```

## Migration Strategy

1. ✅ Create new folder structure
2. ✅ Define interfaces and domain models
3. ⏳ Implement repositories
4. ⏳ Implement services
5. ⏳ Update components to use services
6. ⏳ Move existing files to new structure
7. ⏳ Update all imports
8. ⏳ Test thoroughly

## Time-Saving Tips for Deadline

1. **Start with Authentication** - Most critical path

   - Move `authService.ts` logic into proper `AuthService` class
   - Implement `UserRepositoryImpl`
   - Update `Login.tsx` to use new service

2. **Then Workout Logging** - Core feature

   - Implement `WorkoutRepositoryImpl`
   - Create `WorkoutService`
   - Update `Workout.tsx` page

3. **Keep Old Files** - Don't delete until new ones work

   - Create new implementations alongside old
   - Test thoroughly before removing old code

4. **Use Type Aliases** - Quick compatibility
   ```typescript
   // Temporary compatibility
   export type { UserDTO as User } from "./domain/models/User";
   ```

## Documentation for Your Report

Include these diagrams in your SDA documentation:

1. **Layer Diagram** - Show 5 layers and dependencies
2. **Class Diagram** - Show User, Repository, Service relationships
3. **Sequence Diagram** - Login flow through layers
4. **Pattern Application** - List each pattern with code example

This architecture demonstrates:

- ✅ Understanding of layered architecture
- ✅ Proper application of design patterns
- ✅ SOLID principles throughout
- ✅ Separation of concerns
- ✅ Dependency inversion
- ✅ Interface-based programming
- ✅ Testability and maintainability
