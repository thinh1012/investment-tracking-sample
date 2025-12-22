# Project Rules & Collaboration Guidelines

To ensure a smooth and predictable development process, the following rules apply to all AI-driven interactions within this project.

## 1. Planning & Approval
- **Mandatory Implementation Plans**: Before making any significant code changes (new features, major refactors, or multi-file edits), the AI must provide a detailed `implementation_plan.md`.
- **Approval Gateway**: The AI must **wait for explicit user approval** on the implementation plan before moving to the EXECUTION phase.
- **No "Over-Clutching"**: Do not skip the planning phase or proceed straight to implementation even if the task seems "simple" unless explicitly told to "just do it."

## 2. Execution & Deployment
- **No Automatic Pushes**: No automatic `git push` to production deployment unless the user explicitly requests it.
- **Local Verification First**: Always attempt to verify changes locally (e.g., `npm run dev`, `npm run typecheck`) before considering a task complete.
- **Walkthroughs**: After completing a task, provide a `walkthrough.md` (or update the existing one) to document what was changed and how to verify it.

## 3. Communication Style
- **Proactive Check-ins**: If a task becomes more complex than initially thought, stop and update the implementation plan rather than making assumptions.
- **Respect the "Manual" Path**: If the user prefers a manual workflow (e.g., manual data entry over auto-sync), design features that enhance and empower that manual process rather than trying to automate it away.

## 4. Technical Standards
- **Clean Architecture**: Follow the established patterns in `src/domain`, `src/services`, and `src/hooks`.
- **Type Safety**: Maintain strict TypeScript types. Avoid using `any` unless absolutely necessary.
- **Visual Excellence**: All UI changes must adhere to the high-quality, premium aesthetic already established in the dashboard.
