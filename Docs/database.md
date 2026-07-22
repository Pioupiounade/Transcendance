# Database

## Visual schema

```mermaid
erDiagram
	USERS ||--o{ POI_USERS : linked_to
	USERS ||--o{ POINTS_OF_INTEREST : validates
	POINTS_OF_INTEREST ||--o{ POI_USERS : has

	USERS {
		bigint user_id PK "1"
		text email UK "alice@example.com"
		text username "Alice"
		text password_hash "a215fe51fed1f5d1e1c3b2a4f5e6d7c8"
		text role "user | admin"
		int points "0, 120"
		timestamptz created_at "2026-07-22 10:00:00+00"
		timestamptz updated_at "2026-07-22 10:15:00+00"
	}

	POINTS_OF_INTEREST {
		bigint poi_id PK "9515"
		text name "Central Park Bench"
		text description "Meeting spot near the main path"
		geography location "POINT(-73.9654 40.7829)"
		text status "pending | approved | rejected"
		text category "bench | fountain | statue"
		text images_list "image1.jpg, image2.jpg"
		bigint validated_by_user_id FK "1"
		timestamptz validated_at "2026-07-22 11:00:00+00"
		timestamptz created_at "2026-07-22 10:45:00+00"
		timestamptz updated_at "2026-07-22 11:00:00+00"
	}

	POI_USERS {
		bigint poi_id PK, FK "9515"
		bigint user_id PK, FK "1"
		text role "member"
		timestamptz created_at "2026-07-22 10:50:00+00"
	}
```

## Rules

- `email` must be unique and not null.
- `password_hash` stores the hashed password, never the raw password.
- `role` can be something like `user` or `admin`.
- `points` should default to `0`.
- `status` lets a POI stay `pending` until an admin approves it.
- `validated_by_user_id` stores which admin approved the POI.
- `poi_users` is the join table that lets one point of interest list several users.
- `location` can be a PostGIS geography point if you want map queries later.