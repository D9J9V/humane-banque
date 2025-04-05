# CLAUDE.md - Development Guidelines

## Build/Lint/Test Commands
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm tsc` - Run TypeScript type checking
- `pnpm tsc --noEmit <file>` - Type check single file

## Code Style Guidelines
- **Imports**: Group imports by external, internal (@/), and relative paths
- **Components**: Use named exports for components, client/server directives at top
- **Types**: Use TypeScript with strict mode, prefer explicit return types
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Use conditional rendering for loading/error states
- **Formatting**: Follow Next.js/React best practices, use tailwindcss classes
- **File Structure**: Group related components in feature-based directories
- **State Management**: Use React hooks (useState, useContext) and next-auth
- **Authentication**: Use next-auth with Worldcoin provider
- **API Routes**: Place in app/api, use proper error handling with status codes