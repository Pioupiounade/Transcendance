# Transcendence Modules

This document maps the official **ft_transcendence** modules to the Pioupiounades project. It explains how each module is implemented, which features validate it, and the number of points it contributes toward the required total.

| Module | Type | Points | Project Features |
|--------|------|-------:|------------------|
| **Web Frameworks** | Major | **2** | React frontend, NestJS backend, REST API architecture |
| **ORM** | Minor | **1** | Prisma ORM with PostgreSQL database |
| **Standard User Management** | Major | **2** | User registration, authentication, profile management, avatar upload, public profile |
| **Real-time Features** | Major | **2** | Private messaging, live notifications, real-time action updates using WebSockets |
| **User Interaction** | Major | **2** | Private messaging, user profiles, friends system, online status |
| **Notification System** | Minor | **1** | Real-time notifications for messages, comments, participation, action updates |
| **File Upload & Management** | Minor | **1** | Profile pictures, action photos, suggestion photos, before/after pictures |
| **Advanced Search** | Minor | **1** | Search, filters, sorting, pagination, category and location search |
| **Organization System** | Major | **2** | Associations and local businesses can create organizations, manage members and organize community initiatives |

## Total

**16 points**

---

# Module Details

## 1. Web Frameworks (Major – 2 pts)

**Official module**

Use a frontend and backend framework.

**Pioupiounades implementation**

- React frontend
- NestJS backend
- REST API
- Responsive SPA architecture

**Related Epics**

- User Accounts
- Citizen Actions
- Participation
- Communication
- Administration

---

## 2. ORM (Minor – 1 pt)

**Official module**

Use an ORM for the database.

**Pioupiounades implementation**

- PostgreSQL
- Prisma ORM
- Database migrations
- Entity relationships
- Type-safe queries

**Related Epics**

All Epics

---

## 3. Standard User Management (Major – 2 pts)

**Official module**

Standard authentication and user profiles.

**Pioupiounades implementation**

- User registration
- Login / logout
- Profile management
- Avatar upload
- Public profile pages

**Related Epic**

- User Accounts

---

## 4. Real-time Features (Major – 2 pts)

**Official module**

Implement WebSocket-based real-time communication.

**Pioupiounades implementation**

- Private chat
- Live notifications
- Live participant updates
- Real-time comments

**Technology**

- Socket.IO
- NestJS Gateway

**Related Epics**

- Communication
- Notifications

---

## 5. User Interaction (Major – 2 pts)

**Official module**

Allow users to interact with each other.

**Pioupiounades implementation**

- User profiles
- Private messaging
- Friends system
- Online presence

**Related Epics**

- User Accounts
- Communication

---

## 6. Notification System (Minor – 1 pt)

**Official module**

Notify users about create/update/delete actions.

**Pioupiounades implementation**

Notifications for:

- new messages
- comments
- participation requests
- action updates
- cancelled initiatives

**Related Epic**

- Notifications

---

## 7. File Upload & Management (Minor – 1 pt)

**Official module**

Secure upload and management of user files.

**Pioupiounades implementation**

- Profile pictures
- Suggestion photos
- Action photos
- Before / After photos

Features include:

- upload progress
- validation
- preview
- deletion
- secure storage

**Related Epic**

- Photos

---

## 8. Advanced Search (Minor – 1 pt)

**Official module**

Advanced search with filters and pagination.

**Pioupiounades implementation**

Search by:

- keyword
- category
- organizer
- date
- location

Filters:

- distance
- theme
- status

Sorting:

- nearest
- newest
- popularity

Pagination for large result sets.

**Related Epics**

- Citizen Actions
- Map

---

## 9. Organization System (Major – 2 pts)

**Official module**

Organizations with member management.

**Pioupiounades implementation**

Organizations represent:

- Associations
- Local businesses
- Community groups

Features:

- create an organization
- edit an organization
- delete an organization
- invite members
- remove members
- publish initiatives
- manage organization profile

**Related Epics**

- User Accounts
- Citizen Actions
- Administration

---

# Planned Total

| Module | Points |
|---------|-------:|
| Web Frameworks | 2 |
| ORM | 1 |
| Standard User Management | 2 |
| Real-time Features | 2 |
| User Interaction | 2 |
| Notification System | 1 |
| File Upload | 1 |
| Advanced Search | 1 |
| Organization System | 2 |

## **Total: 16 points**