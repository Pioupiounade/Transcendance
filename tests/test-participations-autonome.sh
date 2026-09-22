#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-http://localhost:3000}"
RUN_ID="$(date +%s%N)"
PASSWORD="Participation123!"
TMP_DIR="$(mktemp -d)"
PASS=0
FAIL=0

trap 'rm -rf "$TMP_DIR"' EXIT

# ============================================================
# Ce script est autonome :
# - crée 5 utilisateurs uniques
# - récupère leurs JWT via /auth/register
# - crée les actions nécessaires
# - prépare les participations
# - approuve une action
# - teste toutes les règles de participation
# - teste la concurrence sur la dernière place
#
# Prérequis : backend lancé sur BASE_URL, curl et python3.
# ============================================================

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Commande requise absente : $1"
    exit 1
  fi
}

need_command curl
need_command python3

json_get() {
  local field="$1"
  python3 -c '
import json, sys
field = sys.argv[1]
try:
    data = json.load(sys.stdin)
    value = data
    for part in field.split("."):
        if isinstance(value, dict):
            value = value.get(part)
        else:
            value = None
            break
    if value is None:
        print("")
    elif isinstance(value, (dict, list)):
        print(json.dumps(value))
    else:
        print(value)
except Exception:
    print("")
' "$field"
}

print_json() {
  python3 -m json.tool 2>/dev/null || cat
}

request() {
  local method="$1"
  local url="$2"
  local token="${3:-}"
  local data="${4:-}"
  local body_file="$5"

  local args=(
    -sS
    -o "$body_file"
    -w "%{http_code}"
    -X "$method"
    "$url"
    -H "Content-Type: application/json"
  )

  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if [[ -n "$data" ]]; then
    args+=(--data-binary "$data")
  fi

  curl "${args[@]}"
}

setup_expect() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local body_file="$4"

  if [[ "$actual" != "$expected" ]]; then
    echo "❌ SETUP FAILED — $label"
    echo "HTTP $actual (attendu $expected)"
    cat "$body_file" | print_json
    exit 1
  fi
}

test_expect() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  local body_file="$4"

  echo
  echo "========================================"
  echo "$label"
  echo "========================================"
  echo "HTTP: $actual (attendu: $expected)"
  cat "$body_file" | print_json
  echo

  if [[ "$actual" == "$expected" ]]; then
    echo "✅ TEST OK"
    PASS=$((PASS + 1))
  else
    echo "❌ TEST FAILED"
    FAIL=$((FAIL + 1))
  fi
}

register_user() {
  local label="$1"
  local email="$2"
  local body_file="$TMP_DIR/register_${label}.json"

  local payload
  payload=$(python3 - "$email" "$PASSWORD" <<'PY'
import json, sys
print(json.dumps({
    "email": sys.argv[1],
    "password": sys.argv[2],
}))
PY
)

  local status
  status=$(request POST "$BASE_URL/auth/register" "" "$payload" "$body_file")
  setup_expect "register $label" "201" "$status" "$body_file"

  local token
  token=$(cat "$body_file" | json_get "access_token")

  if [[ -z "$token" ]]; then
    echo "❌ SETUP FAILED — access_token absent pour $label"
    cat "$body_file" | print_json
    exit 1
  fi

  printf '%s' "$token"
}

create_action() {
  local label="$1"
  local token="$2"
  local max_participants="$3"
  local body_file="$TMP_DIR/action_${label}.json"

  local payload
  payload=$(python3 - "$label" "$max_participants" <<'PY'
import json, sys
label = sys.argv[1]
max_participants = int(sys.argv[2])

print(json.dumps({
    "title": f"Test participation {label}",
    "description": f"Action automatique pour tester la gestion des participations ({label}).",
    "location": [48.8566, 2.3522],
    "category": "ENVIRONMENT",
    "max_participants": max_participants,
    "scheduled_at": "2027-12-31T18:00:00.000Z"
}))
PY
)

  local status
  status=$(request POST "$BASE_URL/actions" "$token" "$payload" "$body_file")
  setup_expect "création action $label" "201" "$status" "$body_file"

  local action_id
  action_id=$(cat "$body_file" | json_get "action_id")

  if [[ -z "$action_id" ]]; then
    echo "❌ SETUP FAILED — action_id absent pour $label"
    cat "$body_file" | print_json
    exit 1
  fi

  printf '%s' "$action_id"
}

participate_setup() {
  local action_id="$1"
  local token="$2"
  local label="$3"
  local body_file="$TMP_DIR/setup_participation_${label}.json"

  local status
  status=$(request POST "$BASE_URL/participations/$action_id" "$token" "" "$body_file")
  setup_expect "participation setup $label" "201" "$status" "$body_file"
}

echo "========================================"
echo "TEST PARTICIPATION MANAGEMENT — AUTONOME"
echo "========================================"
echo "Backend : $BASE_URL"
echo "Run ID  : $RUN_ID"
echo

# Vérifie que le backend répond.
HEALTH_BODY="$TMP_DIR/backend_check.json"
HEALTH_STATUS=$(request GET "$BASE_URL/actions" "" "" "$HEALTH_BODY")

if [[ "$HEALTH_STATUS" == "000" ]]; then
  echo "❌ Backend inaccessible sur $BASE_URL"
  exit 1
fi

echo "1) Création automatique des utilisateurs..."

CREATOR_EMAIL="p15.creator.${RUN_ID}@example.com"
USER1_EMAIL="p15.user1.${RUN_ID}@example.com"
USER2_EMAIL="p15.user2.${RUN_ID}@example.com"
USER3_EMAIL="p15.user3.${RUN_ID}@example.com"
USER4_EMAIL="p15.user4.${RUN_ID}@example.com"

TOKEN_CREATOR=$(register_user "creator" "$CREATOR_EMAIL")
TOKEN_USER1=$(register_user "user1" "$USER1_EMAIL")
TOKEN_USER2=$(register_user "user2" "$USER2_EMAIL")
TOKEN_USER3=$(register_user "user3" "$USER3_EMAIL")
TOKEN_USER4=$(register_user "user4" "$USER4_EMAIL")

echo "✅ 5 utilisateurs créés et JWT récupérés"
echo

echo "2) Création automatique des actions de test..."

# Action pour inscription normale / doublon / créateur / annulation.
ACTION_PENDING_ID=$(create_action "pending" "$TOKEN_CREATOR" 4)

# Action à remplir complètement.
ACTION_FULL_ID=$(create_action "full" "$TOKEN_CREATOR" 3)

# Action qui sera approuvée.
ACTION_APPROVED_ID=$(create_action "approved" "$TOKEN_CREATOR" 4)

# Action avec 1 seule place restante pour le test concurrent.
ACTION_CONCURRENCY_ID=$(create_action "concurrency" "$TOKEN_CREATOR" 3)

echo "✅ Actions créées :"
echo "   PENDING     = $ACTION_PENDING_ID"
echo "   FULL        = $ACTION_FULL_ID"
echo "   APPROVED    = $ACTION_APPROVED_ID"
echo "   CONCURRENCY = $ACTION_CONCURRENCY_ID"
echo

# ============================================================
# TEST 1 — inscription normale
# ============================================================

BODY="$TMP_DIR/test1.json"
STATUS=$(request POST "$BASE_URL/participations/$ACTION_PENDING_ID" "$TOKEN_USER1" "" "$BODY")
test_expect "TEST 1 — INSCRIPTION NORMALE" "201" "$STATUS" "$BODY"

# ============================================================
# TEST 2 — doublon
# ============================================================

BODY="$TMP_DIR/test2.json"
STATUS=$(request POST "$BASE_URL/participations/$ACTION_PENDING_ID" "$TOKEN_USER1" "" "$BODY")
test_expect "TEST 2 — DOUBLE INSCRIPTION" "400" "$STATUS" "$BODY"

# ============================================================
# TEST 3 — créateur interdit
# ============================================================

BODY="$TMP_DIR/test3.json"
STATUS=$(request POST "$BASE_URL/participations/$ACTION_PENDING_ID" "$TOKEN_CREATOR" "" "$BODY")
test_expect "TEST 3 — CREATEUR SUR SA PROPRE ACTION" "400" "$STATUS" "$BODY"

# ============================================================
# TEST 4 — annulation en PENDING
# ============================================================

BODY="$TMP_DIR/test4.json"
STATUS=$(request DELETE "$BASE_URL/participations/$ACTION_PENDING_ID" "$TOKEN_USER1" "" "$BODY")
test_expect "TEST 4 — ANNULATION EN PENDING" "200" "$STATUS" "$BODY"

# ============================================================
# Préparation ACTION_FULL : 3 / 3
# ============================================================

echo
echo "Préparation de l'action FULL (3 participants)..."
participate_setup "$ACTION_FULL_ID" "$TOKEN_USER1" "full_user1"
participate_setup "$ACTION_FULL_ID" "$TOKEN_USER2" "full_user2"
participate_setup "$ACTION_FULL_ID" "$TOKEN_USER3" "full_user3"
echo "✅ Action FULL remplie"

# ============================================================
# TEST 5 — capacité maximale
# ============================================================

BODY="$TMP_DIR/test5.json"
STATUS=$(request POST "$BASE_URL/participations/$ACTION_FULL_ID" "$TOKEN_USER4" "" "$BODY")
test_expect "TEST 5 — CAPACITE MAXIMALE ATTEINTE" "400" "$STATUS" "$BODY"

# ============================================================
# Préparation ACTION_APPROVED : 3 participants puis approval
# ============================================================

echo
echo "Préparation de l'action APPROVED..."
participate_setup "$ACTION_APPROVED_ID" "$TOKEN_USER1" "approved_user1"
participate_setup "$ACTION_APPROVED_ID" "$TOKEN_USER2" "approved_user2"
participate_setup "$ACTION_APPROVED_ID" "$TOKEN_USER3" "approved_user3"

BODY="$TMP_DIR/approve.json"
STATUS=$(request PATCH "$BASE_URL/actions/$ACTION_APPROVED_ID/approve" "$TOKEN_CREATOR" "" "$BODY")
setup_expect "approbation action" "200" "$STATUS" "$BODY"
echo "✅ Action approuvée"

# ============================================================
# TEST 6 — rejoindre une action non PENDING
# ============================================================

BODY="$TMP_DIR/test6.json"
STATUS=$(request POST "$BASE_URL/participations/$ACTION_APPROVED_ID" "$TOKEN_USER4" "" "$BODY")
test_expect "TEST 6 — INSCRIPTION SUR ACTION NON PENDING" "400" "$STATUS" "$BODY"

# ============================================================
# TEST 7 — annuler après APPROVED
# ============================================================

BODY="$TMP_DIR/test7.json"
STATUS=$(request DELETE "$BASE_URL/participations/$ACTION_APPROVED_ID" "$TOKEN_USER1" "" "$BODY")
test_expect "TEST 7 — ANNULATION APRES APPROBATION" "400" "$STATUS" "$BODY"

# ============================================================
# Préparation concurrence : 2 / 3, donc une seule place.
# ============================================================

echo
echo "Préparation du test de concurrence (2 participants sur 3)..."
participate_setup "$ACTION_CONCURRENCY_ID" "$TOKEN_USER1" "concurrency_user1"
participate_setup "$ACTION_CONCURRENCY_ID" "$TOKEN_USER2" "concurrency_user2"
echo "✅ Il reste exactement une place"

# ============================================================
# TEST 8 — deux inscriptions simultanées sur la dernière place
# ============================================================

echo
echo "========================================"
echo "TEST 8 — CONCURRENCE SUR LA DERNIERE PLACE"
echo "========================================"
echo "Lancement simultané USER3 / USER4..."

curl -sS \
  -o "$TMP_DIR/concurrency_user3.json" \
  -w "%{http_code}" \
  -X POST \
  "$BASE_URL/participations/$ACTION_CONCURRENCY_ID" \
  -H "Authorization: Bearer $TOKEN_USER3" \
  -H "Content-Type: application/json" \
  > "$TMP_DIR/concurrency_user3.status" &

PID1=$!

curl -sS \
  -o "$TMP_DIR/concurrency_user4.json" \
  -w "%{http_code}" \
  -X POST \
  "$BASE_URL/participations/$ACTION_CONCURRENCY_ID" \
  -H "Authorization: Bearer $TOKEN_USER4" \
  -H "Content-Type: application/json" \
  > "$TMP_DIR/concurrency_user4.status" &

PID2=$!

wait "$PID1"
wait "$PID2"

STATUS1=$(cat "$TMP_DIR/concurrency_user3.status")
STATUS2=$(cat "$TMP_DIR/concurrency_user4.status")

echo
echo "USER3 -> HTTP $STATUS1"
cat "$TMP_DIR/concurrency_user3.json" | print_json
echo
echo "USER4 -> HTTP $STATUS2"
cat "$TMP_DIR/concurrency_user4.json" | print_json
echo

if {
  [[ "$STATUS1" == "201" && "$STATUS2" == "400" ]] ||
  [[ "$STATUS1" == "400" && "$STATUS2" == "201" ]];
}; then
  echo "✅ TEST OK — une seule inscription a pris la dernière place"
  PASS=$((PASS + 1))
else
  echo "❌ TEST FAILED — attendu : un HTTP 201 et un HTTP 400"
  FAIL=$((FAIL + 1))
fi

# ============================================================
# TEST 9 — vérification participant_count / remaining_seats
# ============================================================

BODY="$TMP_DIR/test9.json"
STATUS=$(request GET "$BASE_URL/actions/$ACTION_CONCURRENCY_ID" "" "" "$BODY")

echo
echo "========================================"
echo "TEST 9 — PARTICIPANT_COUNT / REMAINING_SEATS"
echo "========================================"
echo "HTTP: $STATUS (attendu: 200)"
cat "$BODY" | print_json
echo

PARTICIPANT_COUNT=$(cat "$BODY" | json_get "participant_count")
REMAINING_SEATS=$(cat "$BODY" | json_get "remaining_seats")

if [[ "$STATUS" == "200" && "$PARTICIPANT_COUNT" == "3" && "$REMAINING_SEATS" == "0" ]]; then
  echo "✅ TEST OK — participant_count=3, remaining_seats=0"
  PASS=$((PASS + 1))
else
  echo "❌ TEST FAILED — attendu participant_count=3 et remaining_seats=0"
  FAIL=$((FAIL + 1))
fi

# ============================================================
# RÉSUMÉ
# ============================================================

echo
echo "========================================"
echo "RESUME"
echo "========================================"
echo "✅ Réussis : $PASS"
echo "❌ Échoués : $FAIL"
echo
echo "Données créées pour ce run :"
echo "  creator : $CREATOR_EMAIL"
echo "  user1   : $USER1_EMAIL"
echo "  user2   : $USER2_EMAIL"
echo "  user3   : $USER3_EMAIL"
echo "  user4   : $USER4_EMAIL"
echo
echo "Actions :"
echo "  pending     : $ACTION_PENDING_ID"
echo "  full        : $ACTION_FULL_ID"
echo "  approved    : $ACTION_APPROVED_ID"
echo "  concurrency : $ACTION_CONCURRENCY_ID"
echo

if [[ "$FAIL" -eq 0 ]]; then
  echo "🎉 TOUS LES TESTS PARTICIPATION SONT OK"
  exit 0
else
  echo "⚠️ Certains tests ont échoué"
  exit 1
fi
