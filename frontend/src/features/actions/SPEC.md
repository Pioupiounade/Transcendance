# Technical Specification: Feature Actions - Ticket #34 (Action Details Page)

## 1. Domain Types (`src/features/actions/types.ts`)
- `ActionCategory`: 'environment' | 'social' | 'cultural'
- `ActionStatus`: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
- `ActionOrganizer`:
  - `userId`: string
  - `name`: string
  - `avatarUrl`?: string
  - `organizationTitle`?: string
  - `organizationId`?: string
- `ActionDetailData`:
  - `id`: string
  - `title`: string
  - `description`: string
  - `category`: ActionCategory
  - `status`: ActionStatus
  - `locationName`: string
  - `scheduledAt`: string (ISO 8601)
  - `minParticipants`: number
  - `maxParticipants`: number
  - `currentParticipants`: number
  - `images`: ActionPhoto[] (`{ src, phase: 'before' | 'after' }`): `images_before` then `images_after`, max 3 each, each tagged Before/After in the carousel
    - Add-only (no removal): before photos by the creator while `PENDING`, after photos by the creator or a participant once `COMPLETED` (status rule enforced in the UI only; the backend does not check it yet)
  - `organizer`: ActionOrganizer
  - `validatedByUserId`?: string
  - `validatedAt`?: string
  - `organizationId`?: string

## 2. API Contract & Mock (`src/features/actions/api/actionsApi.ts`)
- Function: `getActionById(id: string): Promise<ActionDetailData>`
- React Hook: `useActionDetail(actionId: string)` returning `{ action, isLoading, error }`
- Dataset: `mockActionDetail` with English mock values.

## 3. UI Component & Styles (`src/features/actions/components/`)
- Component: `ActionDetailsView.tsx` importing `./ActionDetailsView.css`.
- Reusable UI imports: `{ Avatar, Button }` from `../../shared/ui`.
- Visual sections:
  - Header: Category chip, verification badge ("✓ Action verified"), status.
  - Organizer summary using `<Avatar />`.
  - Photo carousel with prev/next buttons and thumbnail strip.
  - Logistics panel: Location, Date, and Available Spots.
  - Description text block.
  - Action trigger placeholder for Issue #35 ("Join" button).
- Styles: `ActionDetailsView.css` using system variables (`--brand`, `--ground`, `--surface`, `--line`, `--shadow`, `--r-card`).

## 4. Routed Page (`src/features/actions/pages/ActionDetailPage.tsx`)
- Reads `:id` from route via `useParams()`.
- Fetches data with `useActionDetail`.
- Handles loading and error/not found states in English.
- Renders `<ActionDetailsView action={action} />`.

## 5. Public Module Interface (`src/features/actions/index.ts`)
- Exports `ActionDetailPage` and domain types.
