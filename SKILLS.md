# SKILL.md

# SalimSpend Development Skill

This document defines the engineering practices used when developing SalimSpend.

`AGENT.md` defines **how the AI agent works**.

This file defines **how engineering work should be performed**.

---

# 1. Inspect Before Modifying

Before changing code:

- inspect the relevant files
- understand the current implementation
- identify existing patterns
- check how related features are implemented
- reuse existing project conventions when appropriate

Do not modify code based only on assumptions.

---

# 2. Decompose Complex Work

Break complex features into smaller implementation units.

A useful decomposition is:

```text
Feature
  ↓
Responsibilities
  ↓
Components / logic / data
  ↓
Implementation
  ↓
Verification
```

Prefer small, understandable changes over large changes that are difficult to verify.

Do not decompose simple work unnecessarily.

---

# 3. React Development

Follow the existing React architecture.

### Pages

Pages represent complete application screens.

### Components

Components represent meaningful UI responsibilities.

Create a component when it improves:

- readability
- reuse
- maintainability
- separation of responsibility

Do not create components only to make files smaller.

### State

Keep state as close as practical to the components that own it.

Avoid unnecessary global state.

Keep UI state, server data, and derived values conceptually separate.

---

# 4. Tailwind CSS

Tailwind CSS is the primary styling approach.

Prefer existing Tailwind patterns used in the project.

Use utility classes for:

- layout
- spacing
- typography
- colors
- borders
- responsive behavior
- states

Avoid introducing a second styling system unless explicitly approved.

Do not rewrite unrelated styling during feature work.

---

# 5. Supabase and PostgreSQL

Supabase/PostgreSQL is the persistent data layer.

When working with database features:

- inspect the existing schema first
- preserve existing ownership rules
- respect Row Level Security
- use the established Clerk identity model
- validate data before writing when appropriate
- handle database errors explicitly
- avoid exposing sensitive server credentials

Do not change the database schema as part of an unrelated UI task.

When schema changes are required, treat them as an explicit architectural/database change.

---

# 6. Authentication and Ownership

Clerk is the authentication provider.

Supabase relies on the established Clerk JWT integration.

For user-owned data, preserve the project's existing ownership pattern:

```text
Clerk user
   ↓
Clerk JWT
   ↓
Supabase
   ↓
Row Level Security
   ↓
User-owned records
```

Do not assume `auth.uid()` is automatically the raw Clerk user ID.

Use the project's established JWT/RLS ownership implementation.

Never bypass ownership checks for convenience.

---

# 7. Data Flow

Prefer predictable data flow:

```text
User interaction
      ↓
UI / component
      ↓
Application logic
      ↓
Supabase
      ↓
Database
      ↓
Application state
      ↓
UI
```

Keep data access logic separate from presentation when the existing architecture provides an appropriate boundary.

Do not place database credentials or server-only secrets in browser code.

---

# 8. Validation and Error Handling

Validate important user input before persistence.

Handle expected failures explicitly.

Errors should:

- provide useful information to the user when appropriate
- be useful for debugging
- avoid exposing secrets or sensitive implementation details

Do not silently swallow important errors.

---

# 9. Security

Never expose:

- secret keys
- service-role credentials
- private authentication credentials
- database credentials
- server-only environment variables

Do not trust client-provided ownership identifiers.

User ownership must be enforced by the established authentication and database security model.

Do not disable or weaken RLS to make development easier.

---

# 10. Testing and Verification

Testing should match the change.

For UI work:

- verify the affected page
- verify interaction states
- verify responsive behavior when relevant
- verify empty/loading/error states when applicable

For database work:

- verify the expected database operation
- verify ownership behavior
- verify error handling
- verify important constraints

For architecture changes:

- verify the application still builds
- verify affected features
- inspect the resulting code structure

Do not rely only on automated tests when manual verification is necessary.

---

# 11. Minimal Change Principle

Make the smallest reasonable change that solves the approved problem.

Avoid:

- unrelated refactoring
- speculative abstractions
- unnecessary dependencies
- unnecessary file creation
- broad formatting changes
- changing working code without a task-related reason

A clean existing pattern is usually preferable to introducing a new pattern.

---

# 12. Documentation

Use the appropriate documentation for the appropriate purpose.

```text
AGENT.md
→ How the AI agent should work

SKILL.md
→ How engineering work should be performed

docs/overview.md
→ What SalimSpend is and its project context

docs/tasks/
→ Specific task scope, decisions, implementation, and results

agent-review.md
→ Human review and approval workflow
```

Do not duplicate large sections of one document into another.

Keep documentation concise and maintainable.

All Markdown changes must follow the project's Documentation Transparency Rule defined in `AGENT.md`.

---

# 13. Git and Change Discipline

Keep implementation changes understandable and reviewable.

Before committing:

- inspect the diff
- verify the changes belong to the task
- check for accidental files
- check for generated files or secrets
- verify the implementation

Do not commit automatically.

Do not include unrelated work merely because it is present in the working tree unless the human explicitly chooses to do so.

---

# 14. Definition of Good Engineering Work

A good implementation should be:

- correct
- understandable
- appropriately scoped
- testable
- maintainable
- consistent with the existing project
- secure
- easy for a human to review

The goal is not to produce the most code.

The goal is to produce the **right code for the approved problem**.
