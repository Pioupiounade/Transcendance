Quand je m'installe sur un nouvel ordi:
-> git clone le projet dans goinfre
-> 
```
    cd backend
    npm ci
```
-> verifier Prism
```
    npx prisma --version
    npx prisma generate
    npx prisma validate
```
-> verifier Docker
```
    cd ../docker
    docker compose up --build -d
    docker compose ps
```
-> verifier les logs 
```
    cd ../docker
    docker compose ps
    docker compose logs backend --tail=50

```
-> verifier avec curl
```
    curl http://localhost:3000/users
```

-> lancer prisma sur un navigateur
```
    cd backend
    npx prisma studio
```
-> creer un nouveau module, service, controller
```
    npx nest generate module nom
    npx nest generate service nom
    npx nest generate controller nom
```

-> migrer prismascheme
```
    npx prisma format
    npx prisma validate
    npx prisma migrate dev --name nom_explicit_de_la_modification
    npx prisma generate
```

-> verifier que prisma compile bien
``` 
    cd backend
    npm run build
```