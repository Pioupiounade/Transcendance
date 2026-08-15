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