# Frontend Architecture - SDA Principles

## Architecture Overview

This frontend follows a **Layered Architecture** with clear separation of concerns and proper application of design patterns.

## Layer Structure

```
src/
├── core/                       # Core Layer - Framework agnostic utilities
│   ├── constants/             # Application-wide constants
│   ├── interfaces/            # Core interfaces and contracts
│   ├── exceptions/            # Custom error types
│   └── types/                 # Shared TypeScript types
│
├── domain/                    # Domain Layer - Business entities
│   ├── models/               # Domain models (User, Workout, Exercise, etc.)
│   ├── value-objects/        # Immutable value objects
│   └── enums/                # Domain-specific enumerations
│
├── infrastructure/            # Infrastructure Layer - External concerns
│   ├── api/                  # HTTP client configuration
│   ├── repositories/         # Data access implementations (Repository Pattern)
│   ├── storage/              # LocalStorage/SessionStorage adapters
│   └── config/               # Configuration management
│
├── application/               # Application Layer - Business logic
│   ├── services/             # Business logic services
│   ├── factories/            # Object creation (Factory Pattern)
│   ├── strategies/           # Algorithm families (Strategy Pattern)
│   ├── validators/           # Input validation logic
│   └── use-cases/            # Application-specific business flows
│
├── presentation/              # Presentation Layer - UI
│   ├── pages/                # Page-level components
│   ├── components/           # Reusable UI components
│   ├── layouts/              # Layout components
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts (Observer Pattern)
│   └── routes/               # Routing configuration
│
└── di/                        # Dependency Injection Container
    └── container.ts          # IoC Container setup

```

## Design Patterns Applied

### 1. **Repository Pattern** (Data Access)

- Abstract data access behind interfaces
- `IUserRepository`, `IWorkoutRepository`, `IExerciseRepository`
- Implementation: `UserRepositoryImpl`, `WorkoutRepositoryImpl`

### 2. **Factory Pattern** (Object Creation)

- `WorkoutFactory` - Creates workout sessions
- `ExerciseFactory` - Creates exercise instances
- `TemplateFactory` - Creates workout templates

### 3. **Strategy Pattern** (Algorithms)

- `IUnitConversionStrategy` - Weight/distance conversions
- `IValidationStrategy` - Different validation rules
- `ISortingStrategy` - Various sorting algorithms

### 4. **Observer Pattern** (State Management)

- React Context API for reactive state
- `WorkoutContext`, `AuthContext`, `PreferencesContext`

### 5. **Singleton Pattern** (Single Instance)

- API client instance
- DI Container instance

### 6. **Adapter Pattern** (Interface Compatibility)

- `LocalStorageAdapter` - Adapts localStorage to repository interface
- `ApiAdapter` - Adapts axios to our HTTP interface

### 7. **Facade Pattern** (Simplified Interface)

- Service layer provides simplified API to complex subsystems

### 8. **Dependency Injection** (IoC)

- Constructor injection for all dependencies
- DI container manages object lifecycles

## SOLID Principles

### Single Responsibility Principle (SRP)

- Each class/module has one reason to change
- Services handle business logic
- Repositories handle data access
- Components handle UI rendering

### Open/Closed Principle (OCP)

- Open for extension, closed for modification
- Strategy pattern for algorithms
- Factory pattern for object creation

### Liskov Substitution Principle (LSP)

- Interfaces can be substituted with implementations
- All repository implementations are interchangeable

### Interface Segregation Principle (ISP)

- Small, focused interfaces
- No "fat" interfaces with unnecessary methods

### Dependency Inversion Principle (DIP)

- Depend on abstractions, not concretions
- Services depend on repository interfaces
- Components depend on service interfaces

## Data Flow

```
User Action → Component → Hook → Service → Repository → API
                                                      ↓
                                                 Domain Model
                                                      ↓
User Update ← Component ← Observer ← Context ← Service
```

## Best Practices

1. **Immutability** - Domain models are immutable
2. **Type Safety** - Comprehensive TypeScript types
3. **Error Handling** - Custom exceptions for different error types
4. **Validation** - Input validation at boundaries
5. **Testing** - Each layer is independently testable
6. **Separation of Concerns** - Clear boundaries between layers

## Example Usage

```typescript
// Service uses repository interface (DIP)
class WorkoutService {
  constructor(private workoutRepo: IWorkoutRepository) {}

  async startWorkout(data: StartWorkoutDTO): Promise<Workout> {
    // Validation
    // Business logic
    // Delegate to repository
  }
}

// Component uses service via hook
function WorkoutPage() {
  const { startWorkout } = useWorkout();
  // UI logic only
}
```
