# Database

## Visual schema

```mermaid
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

    USERS ||--o{ FRIENDSHIPS : sends
    USERS ||--o{ FRIENDSHIPS : receives

    USERS ||--o{ POINT_TRANSACTIONS : earns

    USERS {
        bigint user_id PK "1"
        text email UK "alice@example.com"
        text password_hash "hashed password"
        text role "user | admin | moderator"
        text account_status "active | suspended | deactivated"
        int points "0"
        timestamptz created_at "2026-07-22"
        timestamptz updated_at "2026-07-22"
    }

    PROFILES {
        bigint user_id PK,FK "References USERS"
        text username "Alice"
        text description "I love neighborhood initiatives"
        text profile_picture "avatar.jpg"
        geography location "POINT"
        text visibility "public | private | friends only"

    }

    ACTIONS {
        bigint action_id PK "9515"
        text title "Neighborhood cleanup"
        text description "Citizen cleaning action"
        bigint creator_id FK "References USERS"
        bigint organization_id FK "Optional"
        int min_participants "10"
        int max_participants "20"
        geography location "POINT"
        text status "pending | approved | rejected"
        text category "environment | social | cultural"
        text images_list "image1.jpg, image2.jpg"
        bigint validated_by_user_id FK "Optional"
        timestamptz validated_at "Optional"
        timestamptz scheduled_at "2026-08-15"
        timestamptz created_at "2026-07-22"
        timestamptz updated_at "2026-07-22"
    }

    PARTICIPATIONS {
        bigint action_id PK,FK "References ACTIONS"
        bigint user_id PK,FK "References USERS"
        timestamptz created_at "2026-07-22"
    }

    ORGANIZATIONS {
        bigint organization_id PK "1"
        text title "Save the environment"
        text description "This NGO cleans the neighborhood"
        text organization_status "active | suspended | closed"
        text address "4 rue de la Boissiere"
        geography location "POINT"
        bigint creator_id FK "References USERS"
        timestamptz created_at "2026-07-22"
        timestamptz updated_at "2026-07-22"
    }

    ORGANIZATION_MEMBERS {
        bigint organization_id PK,FK "References ORGANIZATIONS"
        bigint user_id PK,FK "References USERS"
        text status "pending | approved | rejected"
        boolean validated_by_org_man "false | true"
        timestamptz validated_at "Optional"
        text role "member | manager | owner"
        timestamptz created_at "2026-07-22"
        timestamptz updated_at "2026-07-22"
    }

    FRIENDSHIPS {
        bigint requester_id PK,FK "References USERS"
        bigint addressee_id PK,FK "References USERS"
        text status "pending | accepted | rejected | blocked"
        timestamptz created_at "2026-07-22"
        timestamptz accepted_at "Optional"
    }

    USER_INTERESTS {
        bigint user_id PK,FK "References USERS"
        text InterestCategory "Select from InterestCategory enum"
    }

    POINT_TRANSACTIONS {
        bigint point_transaction_id PK "1"
        bigint user_id FK "References USERS"
        int points "10"
        text reason "action_created | action_completed | action_participated | organization_joined"
        timestamptz created_at "2026-07-22"
    }
```

## Rules

- `email` must be unique and not null.
- `password_hash` stores the hashed password, never the raw password.
- `role` can be something like `user` or `admin`.
- `points` should default to `0`.
- `status` lets an action stays `pending` until an admin approves it.
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
- `POINT_TRANSACTIONS` stores the history of points earned by users.
- `USERS.points` stores the current total for quick access.
- The user status level is derived from the points total:
  - `< 70`: Petit PiouPiou
  - `70-209`: Grand PiouPiou
  - `>= 210`: PiouPiou d'Or