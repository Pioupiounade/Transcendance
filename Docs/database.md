# Database

## Visual schema

```mermaid
erDiagram
    USERS ||--o{ ACTIONS : creates
    USERS ||--o{ ACTIONS : validates
    USERS ||--o{ PARTICIPATIONS : participates
    ACTIONS ||--o{ PARTICIPATIONS : has

    USERS ||--o{ ORGANIZATIONS : creates
    USERS ||--o{ ORGANIZATION_MEMBERS : belongs_to
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o{ ACTIONS : organizes

	USERS {
		bigint user_id PK "1"
		text email UK "alice@example.com"
		text username "Alice"
		text password_hash "a215fe51fed1f5d1e1c3b2a4f5e6d7c8"
		text role "user | admin | moderator"
		int points "0, 120"
		timestamptz created_at "2026-07-22 10:00:00+00"
		timestamptz updated_at "2026-07-22 10:15:00+00"
	}

	ACTIONS {
		bigint action_id PK "9515"
		text title "Central Park Bench"
		text description "Meeting spot near the main path"
        bigint creator_id FK "References USERS"
        bigint organization_id FK "Optional - References ORGANIZATIONS"
		geography location "POINT(-73.9654 40.7829)"
		text status "pending | approved | rejected"
		text category "Environment | Social | Cultural"
		text images_list "image1.jpg, image2.jpg"
		bigint validated_by_user_id FK "1"
		timestamptz validated_at "2026-07-22 11:00:00+00"
		timestamptz created_at "2026-07-22 10:45:00+00"
		timestamptz updated_at "2026-07-22 11:00:00+00"
	}

	PARTICIPATIONS {
		bigint action_id PK, FK "9515"
		bigint user_id PK, FK "1"
		text role "member"
		timestamptz created_at "2026-07-22 10:50:00+00"
	}

	ORGANIZATIONS {
		bigint organization_id PK "1"
		text title "Save the environment"
		text description "This NGO cleans the air"
		text adress "4 rue de la Boissiere"
		geography location "POINT(-73.9654 40.7829)"
		bigint creator_id FK "1"
		timestamptz created_at "2026-07-22 10:00:00+00"
		timestamptz updated_at "2026-07-22 10:15:00+00"
	}

	ORGANIZATION_MEMBERS {
		bigint organization_id PK "1"
		bigint user_id PK "1"
		text role "member | manager | owner"
		timestamptz created_at "2026-07-22 10:00:00+00"
		timestamptz updated_at "2026-07-22 10:15:00+00"
	}

```

## Rules

- `email` must be unique and not null.
- `password_hash` stores the hashed password, never the raw password.
- `role` can be something like `user` or `admin`.
- `points` should default to `0`.
- `status` lets an action stays `pending` until an admin approves it.
- `validated_by_user_id` stores which admin approved the POI.
- `participations` is the join table that lets one action list several users.
- `location` can be a PostGIS geography point if you want map queries later.