# Rules for Prisma ORM 

## Users :

   - Mandatory fields for new user creations :
        `email` and `password`
    - `password` is hashed
    - Methods :
        - Get all the users
        - Get a specific user with his ID
        - Create a new user
        - Update the email adress of the user
        - Update the password
        - Deactivate the user
        - Suspend the user -> only ADMINS can do that **to be corrected when authentification is done***
        - Reactivate the user : **to be corrected when authentification is done***
            -> if the account was deactivated, both USER and ADMIN can 
            -> if the acocune was suspended, only an ADMIN can

## Organizations :

   - Mandatory fields for new organization creations :
        `title`, `description`, `adress`, `location`, `creator_id`
   - Methods :
        - Get all the organizations
        - Get a specific organization with the organization_id
        - Get the organizations by creator_id
        - Get the organizations by area
        - Get a specific organization by title with autofilling completion
        - Create a new organization -> USER or ADMIN should be ACTIVE -> **to be corrected when authentification is done***
        - Update the organization -> only the CREATOR of the organization, a MANAGER or OWNER can update the information ->**to be corrected when authentification is done***
        - Suspend the organization -> only an ADMIN can -> **to be corrected when authentification is done***
        - Deactivate the organization -> only ADMIN, CREATOR of the organization,  a MANAGER or OWNER -> **to be corrected when authentification is done***
        - Reactivatie the organization : -> **to be corrected when authentification is done***
            -> if the account was deactivated, both ADMIN, CREATOR of the organization, a MANAGER or OWNER
            -> if the account was suspended, only and ADMIN can

## Actions :

   - Mandatory fields for new action creations:
        `title`, `description`, `creator_id`, `location`, `category`, `scheduled at`
   - Methods :
        - Get all the actions
        - Get a specific action with the action_id
        - Get the actions by organization
        - Get the actions by category
        - Get the actions by creator_id
        - Get the actions by status
        - Get the action by area
        - Create a new action -> USER should be active
        - Update the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a rejected/cancelled/completed action can't be updated.
        - Approve the action ->  only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a approved/rejected/cancelled/completed action can't be completed
        - Cancel the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a rejected/completed action can't be cancelled.
        - Complete the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a pending/rejected/cancelled action can't be completed
    
## Profiles :

   - Mandatory fields for new profiles creations:
        `username`, `location`
   - `username` should be unique
   - `location` is used for internal purposes only and will never be visible for the other users
   -  only active and non suspended profiles will be visible
   - Methods :
        - Get all the profiles
        - Get a specific profile with the user_id
        - Get a specific profile by username with autofilling completion
        - Create a new profile -> USER can create only his own profile (1 max), USER should be active
        - Update his profile -> USER can update his profile only, USER should be active
        - Get my own profile -> USER can find his own profile even if PRIVATE, USER should be active

## UserInterests :

   - Users can declare only interests from the `InterestCategory` enum.
   - Each interest matches a category from the enum `Category`
   - Mandatory fields : None are manually entered
   - Categories :
          - ENVIRONMENT = ENV_FLOWER_POWER = Environment - flower power
          - ENVIRONMENT = ENV_CLEAN = Environment - let's clean
          - ENVIRONMENT = ENV_DO = Environment - let's do (-> like other but related to the environment)
          - SOCIAL = SOCIAL_SHARE = Social - let's share
          - SOCIAL = SOCIAL_MEET = Social - let's meet
          - SOCIAL = SOCIAL_DO = Social - let's do (-> like other but related to a social activity)
          - CULTURAL = CULTURAL_LEARN = Cultural - let's learn
          - CULTURAL = CULTURAL_CREATE = Cultural - let's create 
          - CULTURAL = CULTRUAL_DO = Cultural - let's do (-> liket other but related to a cultural activity)
   - Methods :
          - Select interest -> USER should be ACTIVE, interest can be selected one time only
          - Remove interest -> USER should be ACTIVE
          - Get selected interests of the user -> USER should be ACTIVE

## FriendRequest :

   - Mandatory fields : None are manually entered
   - Methods :
         - Send a new friend request -> sender should be ACTIVE, receiver should be ACTIVE with no pending/accepted/blocked request, not possible to send another request if PENDING, ACCEPTED, BLOCKED already exists 
         - See all my recevied pending friends requests
         - See all my sent pending friends requests
         - Accept the friend request -> sender should be ACTIVE, previous status must be PENDING
         - Reject the friend request -> sender should be ACTIVE, previous status must be PENDING
 

## Friendship :

   - Mandatory fields : None are manually entered
   - Methods :
        - See all my friends -> display username, avatar
        - See all my blocked friends
        - Block the friend -> sender should be ACTIVE, previous status must be ACTIVE
        - Unblock the friend -> sender should be ACTIVE, previous status must be BLOCKED
        - Remove friend -> user should be ACTIVE, friendship status ACCEPTED

## Participations :

   - Mandatory fields : None are manuallr entered
   - Methods :
        - Participate to an action -> USER should be ACTIVE, action should exist and be PENDING, current participants = max - 1, only one participation by USER, create participation
        - Cancel participation to an action -> USER should be ACTIVE, suscribed to the action, action should exist and should be PENDING, delete the participation
        - Cancel blocked/suspended user -> USER participation should be cancelled if the USER is deactivated or suspended, action should be PENDING
        - Get all the participants to the action -> USER should be ACTIVE, action status should be PENDING, APPROVED or COMPLETED
        - Get all the actions a participants did -> USER should be ACTIVE, actions status should be PENDING, APPROVED or COMPLETED

## OrganizationMembers :





## Points Transactions :
