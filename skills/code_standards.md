# Code Standards

## General Guidelines
- Write clean, readable, and maintainable code
- Follow the DRY (Don't Repeat Yourself) principle
- Use meaningful variable and function names
- Keep functions small and focused (< 50 lines ideally)

## Naming Conventions
- **Variables**: camelCase (e.g., `userName`, `isActive`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `API_KEY`)
- **Functions**: camelCase, use verb prefixes (e.g., `getUserData`, `calculateTotal`)
- **Classes**: PascalCase (e.g., `UserService`, `OrderProcessor`)

## Code Organization
- One responsibility per function
- Avoid deep nesting (max 3 levels)
- Group related functions together
- Separate business logic from presentation

## Comments & Documentation
- Explain "why", not "what"
- Document complex algorithms
- Keep comments up-to-date with code changes
- Remove commented-out code before committing

## Error Handling
- Always handle errors appropriately
- Use try-catch for async operations
- Provide meaningful error messages
- Log errors with sufficient context

## Testing
- Write tests for new features
- Ensure existing tests still pass
- Test edge cases and error scenarios
