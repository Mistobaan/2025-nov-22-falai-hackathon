# Development Standards

## Package Management
- **Tool**: Use `bun` for all package installations and script execution.
- **Command**: `bun install <package>`

## Language & Frameworks
- **Frontend**: Next.js (App Router)
- **Language**: TypeScript (`.tsx` for components/pages, `.ts` for logic)
- **Styling**: Tailwind CSS + Shadcn UI

## Architectural Rules
- Components must not call APIs directly. All API interaction should live in `app/` route handlers or shared helpers under `src/lib/`. Keep UI components data-agnostic and pass in data/actions via props/hooks.

## UI/UX Guidelines
### Remote Operations
Any action that triggers a remote API call (e.g., image generation, AI analysis) MUST:
1. **Display In-Progress State**: The triggering button must show a loading spinner or text and be disabled.
2. **Timeout**: The operation must timeout after a configurable duration (Default: **120 seconds**).
3. **Error Handling**: Display a user-friendly error message if the operation fails or times out.

## Configuration
- **Environment Variables**: Store sensitive keys and configuration in `.env` or `.env.local`.
- **Claude Model**: Use `ANTHROPIC_MODEL` to specify the Claude model version. Default to `claude-3-5-sonnet-20241022`.
