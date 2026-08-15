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
