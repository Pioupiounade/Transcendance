"""Peuple la base de dev via l'API (`python3 -I frontend/docs/populate_dev_db.py` depuis la racine, conteneurs lancés, après `make seed`) (http://localhost:3000) : comptes, profils, organisations, actions, inscriptions,
approbations, commentaires. Réexécutable : un compte déjà pris passe par /auth/login."""
import json, random, datetime, urllib.request, urllib.error

API = 'http://localhost:3000'
PWD = 'DemoPass123!'
random.seed(42)

def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    if token: req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'null')

def auth(email):
    s, b = call('POST', '/auth/register', {'email': email, 'password': PWD})
    if s != 201 or not b.get('access_token'):
        s, b = call('POST', '/auth/login', {'email': email, 'password': PWD})
    assert b.get('access_token'), (email, s, b)
    return b['access_token'], b['user']['user_id']

PEOPLE = [  # name, lat, lng, description
    ('lea', 48.8905, 2.3195, 'Batignolles. Gardens, compost and coffee.'),
    ('karim', 48.8838, 2.3271, 'Épinettes. I fix bikes on Sunday mornings.'),
    ('nina', 48.8580, 2.3605, 'Marais. Books, plants and long walks.'),
    ('theo', 48.8712, 2.3652, 'Canal Saint-Martin. Kayak and clean-ups.'),
    ('sofia', 48.8865, 2.3431, 'Montmartre. Street library volunteer.'),
    ('marc', 48.8532, 2.3692, 'Bastille. Woodwork and repair cafés.'),
    ('ines', 48.8625, 2.3410, 'Les Halles. New here, say hi!'),
    ('yanis', 48.8460, 2.3520, 'Quartier Latin. Chess in the park.'),
    ('chloe', 48.8285, 2.3500, 'Butte-aux-Cailles. Murals and flowers.'),
    ('omar', 48.8770, 2.3210, 'Place de Clichy. Football with the kids.'),
    ('julie', 48.8655, 2.3785, 'Belleville. Cooking for the block.'),
    ('paul', 48.8415, 2.3230, 'Montparnasse. Retired, free on weekdays.'),
]
tokens, ids = {}, {}
for name, lat, lng, desc in PEOPLE:
    t, uid = auth(f'demo.extra.{name}@example.test')
    tokens[name], ids[name] = t, uid
    s, b = call('POST', '/profiles', {'username': f'demo_{name}', 'description': desc, 'location': [lat, lng], 'visibility': 'PUBLIC'}, t)
    print('profile', name, s if s != 201 else 'ok')
for name in ('alice', 'bob', 'claire', 'damien', 'emma', 'grace', 'hugo'):
    t, uid = auth(f'demo.seed.{name}@example.test'); tokens[name], ids[name] = t, uid

ORGS = [  # owner, title, address, lat, lng, description
    ('lea', 'Épinettes Shared Gardens', '12 rue des Épinettes, Paris 17e', 48.8945, 2.3240, 'Three plots behind the school, open every Saturday. Tools and seeds provided, bring gloves.'),
    ('marc', 'Repair Café Bastille', '5 rue de Lappe, Paris 11e', 48.8535, 2.3718, 'We fix toasters, lamps, bikes and clothes together instead of throwing them away.'),
    ('theo', 'Canal Clean Collective', 'Quai de Valmy, Paris 10e', 48.8720, 2.3645, 'Monthly clean-ups along the canal, kayaks on loan, hot drinks after.'),
    ('sofia', 'Montmartre Street Library', 'Place des Abbesses, Paris 18e', 48.8845, 2.3385, 'A library on wheels that stops in squares and courtyards every Wednesday.'),
    ('chloe', 'Butte-aux-Cailles Neighbours', '45 rue de la Butte-aux-Cailles, Paris 13e', 48.8282, 2.3505, 'Flower boxes, murals and a yearly block party.'),
]
org_ids = {}
for owner, title, address, lat, lng, desc in ORGS:
    s, b = call('POST', '/organizations', {'title': title, 'description': desc, 'address': address, 'location': [lat, lng]}, tokens[owner])
    if s == 201: org_ids[title] = b['organization_id']
    print('org', title, s if s != 201 else b['organization_id'])

# Demandes d'adhésion puis quelques approbations par le propriétaire.
JOINS = [('karim', 'Épinettes Shared Gardens', True), ('omar', 'Épinettes Shared Gardens', True), ('alice', 'Épinettes Shared Gardens', False),
         ('nina', 'Repair Café Bastille', True), ('yanis', 'Repair Café Bastille', False), ('julie', 'Canal Clean Collective', True),
         ('ines', 'Canal Clean Collective', False), ('bob', 'Montmartre Street Library', True), ('paul', 'Montmartre Street Library', True),
         ('emma', 'Butte-aux-Cailles Neighbours', True)]
owners = {title: owner for owner, title, *_ in ORGS}
for who, title, approve in JOINS:
    oid = org_ids.get(title)
    if not oid: continue
    s, b = call('POST', f'/organization-members/organization/{oid}/join', None, tokens[who])
    if approve and s in (200, 201):
        call('PATCH', f'/organization-members/organization/{oid}/member/{ids[who]}/approve', None, tokens[owners[title]])
    print('join', who, title, s)

now = datetime.datetime.now(datetime.timezone.utc)
def when(days, hour): return (now + datetime.timedelta(days=days)).replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()
ACTIONS = [  # creator, title, category, days, hour, lat, lng, max, org, description
    ('lea', 'Plant the autumn beds', 'ENVIRONMENT', 2, 10, 48.8945, 2.3240, 8, 'Épinettes Shared Gardens', 'Garlic, broad beans and winter salads go in this weekend. Two hours, then soup.'),
    ('karim', 'Sunday bike check-up', 'SOCIAL', 5, 9, 48.8838, 2.3271, 6, None, 'Bring your bike, we check brakes, tyres and chains. Free, tools provided.'),
    ('nina', 'Book swap under the arcades', 'CULTURAL', 3, 15, 48.8565, 2.3630, 20, None, 'Leave one, take one. Place des Vosges, under the arcades if it rains.'),
    ('theo', 'Canal clean-up by kayak', 'ENVIRONMENT', 6, 9, 48.8720, 2.3645, 10, 'Canal Clean Collective', 'Six kayaks, life jackets provided. We collect what floats between Valmy and Jemmapes.'),
    ('sofia', 'Street library at Abbesses', 'CULTURAL', 1, 14, 48.8845, 2.3385, 5, 'Montmartre Street Library', 'Help set up the cart, read to kids, pack up at six.'),
    ('marc', 'Fix-it afternoon: lamps and toasters', 'SOCIAL', 4, 14, 48.8535, 2.3718, 12, 'Repair Café Bastille', 'Bring what is broken. Three repairers, one soldering iron, lots of patience.'),
    ('ines', 'Welcome walk for new neighbours', 'SOCIAL', 7, 11, 48.8625, 2.3410, 15, None, 'A slow loop around Les Halles: the market, the garden, the best bakery.'),
    ('yanis', 'Chess in the Luxembourg', 'CULTURAL', 8, 15, 48.8470, 2.3370, 8, None, 'All levels. We bring four boards, you bring a scarf.'),
    ('chloe', 'Mural touch-up on rue Barrault', 'CULTURAL', 9, 10, 48.8280, 2.3480, 6, 'Butte-aux-Cailles Neighbours', 'The 2024 mural needs fresh paint on the lower half. Brushes and tarps provided.'),
    ('omar', 'Five-a-side at Square Berlioz', 'SOCIAL', 2, 18, 48.8790, 2.3240, 10, None, 'Mixed teams, no experience needed, bring water.'),
    ('julie', 'Soup for the block', 'SOCIAL', 10, 12, 48.8655, 2.3785, 9, None, 'We cook forty litres of pumpkin soup and hand it out on the square.'),
    ('paul', 'Compost workshop for beginners', 'ENVIRONMENT', 12, 10, 48.8415, 2.3230, 7, None, 'Where to put it, what to feed it, why it does not smell. Starter kits to take home.'),
    ('alice', 'Seed library launch', 'ENVIRONMENT', 11, 16, 48.8600, 2.3500, 12, None, 'First exchange of the seed library: bring envelopes, label your seeds.'),
    ('bob', 'Night walk: lights of the Marais', 'CULTURAL', 13, 20, 48.8580, 2.3620, 15, None, 'Two hours, three courtyards, one hidden garden. Flashlights welcome.'),
    ('lea', 'Leaf collection for compost', 'ENVIRONMENT', 15, 9, 48.8935, 2.3225, 8, 'Épinettes Shared Gardens', 'Rakes and bags provided. Leaves go to the garden compost.'),
    ('theo', 'Kayak intro for neighbours', 'SOCIAL', 17, 10, 48.8725, 2.3650, 6, 'Canal Clean Collective', 'Never paddled? One hour on flat water, then coffee.'),
    ('sofia', 'Poetry reading on the steps', 'CULTURAL', 18, 17, 48.8862, 2.3431, 25, 'Montmartre Street Library', 'Open mic on the Sacré-Cœur steps. Five minutes each, any language.'),
    ('marc', 'Build bird boxes', 'ENVIRONMENT', 20, 14, 48.8540, 2.3700, 8, 'Repair Café Bastille', 'Pre-cut kits, screws and paint. One box per person, for your balcony or the park.'),
]
action_ids = []
for creator, title, cat, days, hour, lat, lng, maxp, org, desc in ACTIONS:
    body = {'title': title, 'description': desc, 'category': cat, 'scheduled_at': when(days, hour), 'location': [lat, lng], 'max_participants': maxp}
    if org and org in org_ids: body['organization_id'] = int(org_ids[org])
    s, b = call('POST', '/actions', body, tokens[creator])
    if s == 201: action_ids.append((b['action_id'], creator, title))
    print('action', title, s if s != 201 else b['action_id'])

# Inscriptions : 2 à 7 voisins par action (jamais le créateur), les comptes de démo compris.
everyone = list(tokens)
joined = {}
for aid, creator, title in action_ids:
    pool = [p for p in everyone if p != creator and p != 'grace']
    picks = random.sample(pool, random.randint(2, 7))
    joined[aid] = []
    for who in picks:
        s, b = call('POST', f'/participations/{aid}', None, tokens[who])
        if s == 201: joined[aid].append(who)
    print('joined', title, len(joined[aid]))

# Approbations (admin grace) : les actions qui ont atteint 3 inscrits, une sur deux.
approved = 0
for i, (aid, creator, title) in enumerate(action_ids):
    if len(joined[aid]) >= 3 and i % 2 == 0:
        s, b = call('PATCH', f'/actions/{aid}/approve', None, tokens['grace'])
        approved += s == 200
print('approved', approved)

# Commentaires d'action (participants) et d'organisation.
COMMENTS = ['Count me in, I can bring a thermos.', 'Is there a spot for kids?', 'See you there, I will be a bit late.',
            'Can I bring a friend from the next street?', 'Great idea, the square needs it.', 'I have spare gloves if anyone needs some.']
for aid, creator, title in action_ids[::2]:
    for who in joined[aid][:2]:
        call('POST', f'/actions/{aid}/comments', {'content': random.choice(COMMENTS)}, tokens[who])
for title, oid in list(org_ids.items())[:3]:
    for who in ('alice', 'nina', 'omar'):
        call('POST', f'/organizations/{oid}/comments', {'comment': random.choice(COMMENTS)}, tokens[who])

s, b = call('GET', '/actions'); print('total actions', len(b) if isinstance(b, list) else b)
s, b = call('GET', '/organizations'); print('total organizations', len(b) if isinstance(b, list) else b)
