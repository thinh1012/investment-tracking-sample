# Project Rules: Security First 🛡️

This document outlines the non-negotiable architectural and developmental rules for this project. **Security and Data Integrity are our #1 Priority.**

## 1. Security First Principle
- **No Compromise**: Any feature, no matter how "cool," must be rejected if it introduces a foreseeable security vulnerability.
- **Data Privacy**: User investment data must be treated as highly sensitive. Avoid logging any private symbols, quantities, or personal identifiers to external services unless explicitly required and anonymized.

## 2. Planning & Approval
- **Mandatory Implementation Plans**: Before making any significant code changes (new features, major refactors, or multi-file edits), the AI must provide a detailed `implementation_plan.md`.
- **Approval Gateway**: The AI must **wait for explicit user approval** on the implementation plan before moving to the EXECUTION phase.
- **No "Over-Clutching"**: Do not skip the planning phase or proceed straight to implementation even if the task seems "simple" unless explicitly told to "just do it."

## 3. Deployment & Git Policy
- **Hard Rule: No Unrequested Pushes**: The AI is **strictly prohibited** from executing `git push` unless the user explicitly requests a deployment or a push.
- **Local-First Development**: All work must be committed locally; the user will manage the deployment cadence.
- **Local Verification First**: Always attempt to verify changes locally before considering a task complete.
- **Resilience Audit**: Before completing a feature, ask: "If the network fails or the phone crashes right now, will the user lose data?" If the answer is yes, propose a fix.

## 4. Communication Style
- **Transparency**: The user must always know the state of their data (e.g., "Syncing", "Saved", "Offline").
- **Proactive Check-ins**: If a task becomes more complex than initially thought, stop and update the implementation plan rather than making assumptions.
- **Privacy Awareness**: Never ask the user to share private keys, seed phrases, or unmasked sensitive data.

## 5. Technical Standards
- **Security First Architecture**: Avoid storing sensitive secrets in the frontend. Use environment variables and secure Supabase isolation rules.
- **Clean Architecture**: Follow the established patterns in `src/domain`, `src/services`, and `src/hooks`.
- **Type Safety**: Maintain strict TypeScript types. Avoid using `any` unless absolutely necessary.
- **Visual Excellence**: All UI changes must adhere to the high-quality, professional Material Surface aesthetic.
