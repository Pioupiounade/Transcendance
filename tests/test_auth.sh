#!/bin/bash

BASE_URL="http://localhost:3000"
EMAIL="quentin.test@example.com"
PASSWORD="Password123!"

echo "=========================================="
echo " 1. REGISTER"
echo "=========================================="
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}" | jq .
echo -e "\n"

echo "=========================================="
echo " 2. LOGIN"
echo "=========================================="
# On récupère la réponse complète pour extraire les tokens si besoin
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "$LOGIN_RES" | jq .
echo -e "\n"

# Extraction automatique des tokens (nécessite jq)
ACCESS_TOKEN=$(echo "$LOGIN_RES" | jq -r '.access_token')
REFRESH_TOKEN=$(echo "$LOGIN_RES" | jq -r '.refresh_token')

echo "Access Token récupéré : ${ACCESS_TOKEN:0:20}..."
echo -e "\n"

echo "=========================================="
echo " 3. GET /AUTH/ME (Route protégée)"
echo "=========================================="
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
echo -e "\n"

echo "=========================================="
echo " 4. GET /AUTH/ME (Test Token invalide/coupé -> Doit échouer 401)"
echo "=========================================="
curl -i -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer ${ACCESS_TOKEN:0:30}"
echo -e "\n"

echo "=========================================="
echo " 5. REFRESH TOKEN (Rotation)"
echo "=========================================="
REFRESH_RES=$(curl -s -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

echo "$REFRESH_RES" | jq .
echo -e "\n"

echo "=========================================="
echo " 6. LOGOUT"
echo "=========================================="
curl -i -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$NEW_REFRESH\"}"
echo -e "\n"

echo "=========================================="
echo " 7. REFRESH APRES LOGOUT (Doit échouer 401/403)"
echo "=========================================="
curl -i -X POST "$BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$NEW_REFRESH\"}"
echo -e "\n"
