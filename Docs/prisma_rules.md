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
        - Update the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one
        - Approve the action ->  only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a approved/rejected/cancelled/completed action can't be completed
        - Cancel the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a rejected/completed action can't be cancelled.
        - Complete the action -> only by ADMIN or CREATOR, MANAGER, OWNER of the organization if there is one, a pending/rejected/cancelled action can't be completed
    

