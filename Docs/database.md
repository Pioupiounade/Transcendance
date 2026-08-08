# Database

## Visual schema

```mermaid
<<<<<<< HEAD
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

=======
   erDiagram

	USERS ||--|| PROFILES : has

    USERS ||--o{ ACTIONS : creates
    USERS ||--o{ ACTIONS : validates
    USERS ||--o{ PARTICIPATIONS : participates
    ACTIONS ||--o{ PARTICIPATIONS : has

    USERS ||--o{ ORGANIZATIONS : creates
    USERS ||--o{ ORGANIZATION_MEMBERS : belongs_to
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : has
    ORGANIZATIONS ||--o{ ACTIONS : organizes

    USERS ||--o{ USER_INTERESTS : has
    INTERESTS ||--o{ USER_INTERESTS : selected_by

    USERS ||--o{ FRIENDSHIPS : sends
    USERS ||--o{ FRIENDSHIPS : receives

    USERS {
        bigint user_id PK "1"
        text email UK "alice@example.com"
        text password_hash "hashed password"
        text role "user | admin | moderator"
		text account_status "active | suspended | deactivated"
        int points "0"
        timestamptz created_at "2026-07-22 10:00:00+00"
        timestamptz updated_at "2026-07-22 10:15:00+00"
    }

    PROFILES {
        bigint user_id PK,FK "References USERS"
        text username "Alice"
        text description "I love neighborhood initiatives"
        text profile_picture "avatar.jpg"
    }

    ACTIONS {
        bigint action_id PK "9515"
        text title "Neighborhood cleanup"
        text description "Citizen cleaning action"
        bigint creator_id FK "References USERS"
        bigint organization_id FK "Optional - References ORGANIZATIONS"
        geography location "POINT(-73.9654 40.7829)"
        text status "pending | approved | rejected"
        text category "environment | social | cultural"
        text images_list "image1.jpg, image2.jpg"
        bigint validated_by_user_id FK "Optional - References USERS"
        timestamptz validated_at "Optional"
        timestamptz scheduled_at "2026-08-15 10:00:00+00"
        timestamptz created_at "2026-07-22 10:45:00+00"
        timestamptz updated_at "2026-07-22 11:00:00+00"
    }

    PARTICIPATIONS {
        bigint action_id PK,FK "References ACTIONS"
        bigint user_id PK,FK "References USERS"
        text role "member"
        timestamptz created_at "2026-07-22 10:50:00+00"
    }

    ORGANIZATIONS {
        bigint organization_id PK "1"
        text title "Save the environment"
        text description "This NGO cleans the neighborhood"
        text address "4 rue de la Boissiere"
        geography location "POINT(-73.9654 40.7829)"
        bigint creator_id FK "References USERS"
        timestamptz created_at "2026-07-22 10:00:00+00"
        timestamptz updated_at "2026-07-22 10:15:00+00"
    }

    ORGANIZATION_MEMBERS {
        bigint organization_id PK,FK "References ORGANIZATIONS"
        bigint user_id PK,FK "References USERS"
        text status "pending | approved | rejected"
        bigint validated_by_user_id FK "Optional - References USERS"
        timestamptz validated_at "Optional"
        text role "member | manager | owner"
        timestamptz created_at "2026-07-22 10:00:00+00"
        timestamptz updated_at "2026-07-22 10:15:00+00"
    }

	FRIENDSHIPS {
    	bigint requester_id PK,FK "References USERS"
    	bigint addressee_id PK,FK "References USERS"
    	text status "pending | accepted | rejected | blocked"
    	timestamptz created_at "2026-07-22"
    	timestamptz accepted_at "Optional"
	}

    INTERESTS {
        bigint interest_id PK "1"
        text name UK "Environment"
    }

    USER_INTERESTS {
        bigint user_id PK,FK "References USERS"
        bigint interest_id PK,FK "References INTERESTS"
    }
>>>>>>> refs/remotes/origin/main
```

## Rules

- `email` must be unique and not null.
- `password_hash` stores the hashed password, never the raw password.
- `role` can be something like `user` or `admin`.
- `points` should default to `0`.
- `status` lets an action stays `pending` until an admin approves it.
<<<<<<< HEAD
- `validated_by_user_id` stores which admin approved the POI.
- `participations` is the join table that lets one action list several users.
- `location` can be a PostGIS geography point if you want map queries later.
=======
- `validated_by_user_id` stores which admin approved the action.
- `participations` is the join table that lets one action list several users.
- `location` can be a PostGIS geography point if you want map queries later.
- A `user` has one `profile`.
- A `user` can participate in several `actions`.
- A `user` can belong to several `organizations`.
- An `organization` can have several `members`.
- A `user` can select several `interests`.
- `USER_INTERESTS` is the join table between `users` and `interests`.
- A `friendship` links two users and has a status such as `pending`, `accepted`, `rejected`, or `blocked`.
- User account status is separate from the user role.
- Organization status is separate from membership status.
>>>>>>> refs/remotes/origin/main
