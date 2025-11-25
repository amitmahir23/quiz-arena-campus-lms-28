# Unit Tests for Course Creation and Enrollment

This project includes Jest unit tests for two main features:

1. **Instructor Course Creation** - Tests for the `CreateCourseForm` component
2. **Student Enrollment** - Tests for the student enrollment functionality

## Setup

All testing dependencies have been installed. The project uses:

- **Jest** - Testing framework
- **React Testing Library** - For testing React components
- **ts-jest** - TypeScript support for Jest

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Files

### 1. Instructor Course Creation Tests

**File:** `src/components/dashboard/instructor/__tests__/CreateCourseForm.test.tsx`

Tests cover:

- ✅ Form rendering with all input fields
- ✅ User input handling
- ✅ Successful course creation
- ✅ Course creation with zero price
- ✅ Error handling for database errors
- ✅ Form reset after successful creation
- ✅ Cancel button functionality
- ✅ Required field validation

### 2. Student Enrollment Tests

**File:** `src/pages/student/__tests__/StudentEnrollment.test.tsx`

Tests cover:

- ✅ Enrollment form rendering
- ✅ Successful enrollment with valid course code
- ✅ Error when course code is empty
- ✅ Error when user is not a student
- ✅ Error when course is not found
- ✅ Error when student is already enrolled
- ✅ Database error handling
- ✅ Course code input clearing after enrollment

## Test Structure

All tests use mocks for:

- Supabase client (`@/integrations/supabase/client`)
- Toast notifications (`sonner`)
- React Router (`react-router-dom`)
- Custom hooks (`useAuth`, `useEnrollments`)

## Configuration

- **Jest Config:** `jest.config.js`
- **Test Setup:** `src/setupTests.ts`
- **Module Aliases:** Configured to support `@/` imports

## Notes

- Tests are isolated and don't require a running database
- All external dependencies are mocked
- Tests follow React Testing Library best practices


