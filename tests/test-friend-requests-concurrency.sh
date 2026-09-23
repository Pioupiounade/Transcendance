#!/usr/bin/env bash
set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSWORD="${PASSWORD:-Password123!}"
RUN_ID="$(date +%s%N)"
PASS=0
FAIL=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if ! command -v curl >/dev/null 2>&1; then
  echo "ERREUR: curl est requis."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERREUR: jq est requis."
  exit 1
fi

section() {
  echo
  echo "=========================================="
  echo " $1"
  echo "=========================================="
}

ok() {
  PASS=$((PASS + 1))
  echo "✅ PASS - $1"
}

ko() {
  FAIL=$((FAIL + 1))
  echo "❌ FAIL - $1"
}

register_user() {
  local label="$1"
  local email="friend.concurrent.${label}.${RUN_ID}@example.com"
  local response

  response="$(curl -sS -X POST "${BASE_URL}/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"

  local token id
  token="$(printf '%s' "$response" | jq -r '.access_token // empty')"
  id="$(printf '%s' "$response" | jq -r '.user.user_id // empty')"

  if [[ -z "$token" || -z "$id" ]]; then
    echo "Échec register ${label}:" >&2
    printf '%s\n' "$response" | jq . >&2 || printf '%s\n' "$response" >&2
    return 1
  fi

  printf '%s|%s' "$id" "$token"
}

curl_with_status() {
  local outfile="$1"
  shift
  curl -sS -o "$outfile" -w '%{http_code}' "$@"
}

section "0. CREATION DES UTILISATEURS"

A_DATA="$(register_user a)" || exit 1
B_DATA="$(register_user b)" || exit 1
C_DATA="$(register_user c)" || exit 1
D_DATA="$(register_user d)" || exit 1

A_ID="${A_DATA%%|*}"
A_TOKEN="${A_DATA#*|}"
B_ID="${B_DATA%%|*}"
B_TOKEN="${B_DATA#*|}"
C_ID="${C_DATA%%|*}"
C_TOKEN="${C_DATA#*|}"
D_ID="${D_DATA%%|*}"
D_TOKEN="${D_DATA#*|}"

echo "A=${A_ID}  B=${B_ID}  C=${C_ID}  D=${D_ID}"

section "1. ENVOIS CONCURRENTS EN DIRECTIONS INVERSES A→B ET B→A"

(
  curl_with_status "$TMP_DIR/send_ab.body" \
    -X PATCH "${BASE_URL}/friend-requests/me/send" \
    -H "Authorization: Bearer ${A_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "{\"addressee_id\":\"${B_ID}\"}" \
    > "$TMP_DIR/send_ab.code"
) &
PID1=$!

(
  curl_with_status "$TMP_DIR/send_ba.body" \
    -X PATCH "${BASE_URL}/friend-requests/me/send" \
    -H "Authorization: Bearer ${B_TOKEN}" \
    -H 'Content-Type: application/json' \
    -d "{\"addressee_id\":\"${A_ID}\"}" \
    > "$TMP_DIR/send_ba.code"
) &
PID2=$!

wait "$PID1"
wait "$PID2"

CODE_AB="$(cat "$TMP_DIR/send_ab.code")"
CODE_BA="$(cat "$TMP_DIR/send_ba.code")"

echo "A→B : HTTP ${CODE_AB}"
cat "$TMP_DIR/send_ab.body" | jq . 2>/dev/null || cat "$TMP_DIR/send_ab.body"
echo
echo "B→A : HTTP ${CODE_BA}"
cat "$TMP_DIR/send_ba.body" | jq . 2>/dev/null || cat "$TMP_DIR/send_ba.body"
echo

if [[ ("$CODE_AB" == "200" && "$CODE_BA" == "400") || ("$CODE_AB" == "400" && "$CODE_BA" == "200") ]]; then
  ok "une seule des deux demandes concurrentes est créée"
else
  ko "attendu: un HTTP 200 et un HTTP 400 ; obtenu: ${CODE_AB} / ${CODE_BA}"
fi

SENT_A="$(curl -sS "${BASE_URL}/friend-requests/sentRequests" -H "Authorization: Bearer ${A_TOKEN}")"
SENT_B="$(curl -sS "${BASE_URL}/friend-requests/sentRequests" -H "Authorization: Bearer ${B_TOKEN}")"

COUNT_A="$(printf '%s' "$SENT_A" | jq 'length' 2>/dev/null || echo -1)"
COUNT_B="$(printf '%s' "$SENT_B" | jq 'length' 2>/dev/null || echo -1)"
TOTAL_PENDING=$((COUNT_A + COUNT_B))

if [[ "$TOTAL_PENDING" -eq 1 ]]; then
  ok "il n'existe qu'une seule demande PENDING entre A et B"
else
  ko "attendu: 1 demande PENDING au total ; obtenu: ${TOTAL_PENDING}"
fi

section "2. PREPARATION D'UNE DEMANDE C→D"

SEND_CD_BODY="$TMP_DIR/send_cd.body"
CODE_CD="$(curl_with_status "$SEND_CD_BODY" \
  -X PATCH "${BASE_URL}/friend-requests/me/send" \
  -H "Authorization: Bearer ${C_TOKEN}" \
  -H 'Content-Type: application/json' \
  -d "{\"addressee_id\":\"${D_ID}\"}")"

cat "$SEND_CD_BODY" | jq . 2>/dev/null || cat "$SEND_CD_BODY"
echo

REQUEST_ID="$(jq -r '.friend_request_id // empty' "$SEND_CD_BODY" 2>/dev/null || true)"

if [[ "$CODE_CD" == "200" && -n "$REQUEST_ID" ]]; then
  ok "demande C→D créée pour le test d'acceptation"
else
  ko "impossible de créer la demande C→D (HTTP ${CODE_CD})"
  echo
  echo "Tests interrompus: pas de requestId exploitable."
  exit 1
fi

section "3. DEUX ACCEPTATIONS SIMULTANEES DE LA MEME DEMANDE"

(
  curl_with_status "$TMP_DIR/accept_1.body" \
    -X PATCH "${BASE_URL}/friend-requests/${REQUEST_ID}/accept" \
    -H "Authorization: Bearer ${D_TOKEN}" \
    > "$TMP_DIR/accept_1.code"
) &
PID3=$!

(
  curl_with_status "$TMP_DIR/accept_2.body" \
    -X PATCH "${BASE_URL}/friend-requests/${REQUEST_ID}/accept" \
    -H "Authorization: Bearer ${D_TOKEN}" \
    > "$TMP_DIR/accept_2.code"
) &
PID4=$!

wait "$PID3"
wait "$PID4"

CODE_ACCEPT_1="$(cat "$TMP_DIR/accept_1.code")"
CODE_ACCEPT_2="$(cat "$TMP_DIR/accept_2.code")"

echo "Acceptation 1 : HTTP ${CODE_ACCEPT_1}"
cat "$TMP_DIR/accept_1.body" | jq . 2>/dev/null || cat "$TMP_DIR/accept_1.body"
echo
echo "Acceptation 2 : HTTP ${CODE_ACCEPT_2}"
cat "$TMP_DIR/accept_2.body" | jq . 2>/dev/null || cat "$TMP_DIR/accept_2.body"
echo

if [[ ("$CODE_ACCEPT_1" == "200" && "$CODE_ACCEPT_2" == "400") || ("$CODE_ACCEPT_1" == "400" && "$CODE_ACCEPT_2" == "200") ]]; then
  ok "une seule acceptation réussit et l'autre devient une erreur métier"
else
  ko "attendu: un HTTP 200 et un HTTP 400 ; obtenu: ${CODE_ACCEPT_1} / ${CODE_ACCEPT_2}"
fi

if [[ "$CODE_ACCEPT_1" != "500" && "$CODE_ACCEPT_2" != "500" ]]; then
  ok "aucune acceptation concurrente ne produit de HTTP 500"
else
  ko "une acceptation concurrente a produit un HTTP 500"
fi

section "4. VERIFICATION DE L'AMITIE C↔D"

FRIENDS_C="$(curl -sS "${BASE_URL}/friendships/me" -H "Authorization: Bearer ${C_TOKEN}")"
FRIENDS_D="$(curl -sS "${BASE_URL}/friendships/me" -H "Authorization: Bearer ${D_TOKEN}")"

C_HAS_D="$(printf '%s' "$FRIENDS_C" | jq --arg id "$D_ID" '[.[] | select(.user_id == $id)] | length' 2>/dev/null || echo 0)"
D_HAS_C="$(printf '%s' "$FRIENDS_D" | jq --arg id "$C_ID" '[.[] | select(.user_id == $id)] | length' 2>/dev/null || echo 0)"

if [[ "$C_HAS_D" -eq 1 && "$D_HAS_C" -eq 1 ]]; then
  ok "une seule amitié active C↔D est visible des deux côtés"
else
  ko "amitié C↔D inattendue (C voit D=${C_HAS_D}, D voit C=${D_HAS_C})"
fi

section "RESULTAT"

echo "PASS: ${PASS}"
echo "FAIL: ${FAIL}"

if [[ "$FAIL" -eq 0 ]]; then
  echo "✅ Tous les tests de concurrence friend requests sont passés."
  exit 0
else
  echo "❌ Certains tests ont échoué."
  exit 1
fi
