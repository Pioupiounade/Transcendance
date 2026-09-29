import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  AccountStatus,
  FriendRequestStatus,
  FriendshipStatus,
  PrismaClient,
  ProfileVisibility,
  RoleApp,
  MemberStatus,
  OrganizationStatus,
  RoleOrg,
  Category,
  ActionStatus,
} from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

type DemoUser = {
  name: string;
  visibility?: ProfileVisibility;
  role?: RoleApp;
  status?: AccountStatus;
};

const users: DemoUser[] = [
  { name: 'alice', visibility: ProfileVisibility.PUBLIC },
  { name: 'bob', visibility: ProfileVisibility.FRIENDS_ONLY },
  { name: 'claire', visibility: ProfileVisibility.PRIVATE },
  { name: 'damien', visibility: ProfileVisibility.PUBLIC },
  { name: 'emma', visibility: ProfileVisibility.PUBLIC },
  { name: 'franck', visibility: ProfileVisibility.PUBLIC },
  { name: 'grace', visibility: ProfileVisibility.PUBLIC, role: RoleApp.ADMIN },
  {
    name: 'hugo',
    visibility: ProfileVisibility.PUBLIC,
    status: AccountStatus.SUSPENDED,
  },
  { name: 'nouveau' }, // Aucun profil : on pourra le créer depuis l'interface.
];

async function ensureOrganization(
  title: string,
  creatorId: bigint,
  status: OrganizationStatus,
) {
  const existing = await prisma.organization.findFirst({
    where: { title, creator_id: creatorId },
  });

  return existing ?? prisma.organization.create({
    data: {
      title,
      description: `Demo organization: ${title}`,
      organization_status: status,
      creator_id: creatorId,
      address: 'Paris, France',
      location: [48.8566, 2.3522],
    },
  });
}

async function ensureMember(
  organizationId: bigint,
  userId: bigint,
  role: RoleOrg,
  status: MemberStatus,
) {
  await prisma.organizationMember.upsert({
    where: {
      organization_id_user_id: {
        organization_id: organizationId,
        user_id: userId,
      },
    },
    update: {},
    create: {
      organization_id: organizationId,
      user_id: userId,
      role,
      status,
      validated_by_org_man: status === MemberStatus.ACTIVE,
      validated_at: status === MemberStatus.ACTIVE ? new Date() : null,
    },
  });
}

async function ensureFriendship(
  firstId: bigint,
  secondId: bigint,
  status: FriendshipStatus,
  blockedById?: bigint,
) {
  const [user1Id, user2Id] =
    firstId < secondId ? [firstId, secondId] : [secondId, firstId];

  await prisma.friendship.upsert({
    where: {
      user1_id_user2_id: {
        user1_id: user1Id,
        user2_id: user2Id,
      },
    },
    update: {},
    create: {
      user1_id: user1Id,
      user2_id: user2Id,
      status,
      blocked_by_user_id: blockedById,
    },
  });
}

async function ensureAction(
  title: string,
  creatorId: bigint,
  options: {
    organizationId: bigint;
    category: Category;
    status?: ActionStatus;
    participants?: bigint[];
    maxParticipants?: number;
    validatorId?: bigint;
    daysFromNow?: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.action.findFirst({
      where: { title, creator_id: creatorId },
    });
    if (existing) return existing;

    const action = await tx.action.create({
      data: {
        title,
        description: `Demo action: ${title}`,
        creator_id: creatorId,
        organization_id: options.organizationId,
        category: options.category,
        status: options.status ?? ActionStatus.PENDING,
        location: [48.8566, 2.3522],
        min_participants: 3,
        max_participants: options.maxParticipants ?? 6,
        validated_by_user_id: options.validatorId,
        validated_at: options.validatorId ? new Date() : null,
        scheduled_at: new Date(
          Date.now() + (options.daysFromNow ?? 30) * 24 * 60 * 60 * 1000,
        ),
      },
    });

    for (const userId of options.participants ?? []) {
      await tx.participation.create({
        data: { action_id: action.action_id, user_id: userId },
      });
    }

    return action;
  });
}

async function ensureComment(
  actionId: bigint,
  userId: bigint,
  content: string,
) {
  const existing = await prisma.actionComment.findFirst({
    where: { action_id: actionId, user_id: userId },
  });

  if (!existing) {
    await prisma.actionComment.create({
      data: {
        action_id: actionId,
        user_id: userId,
        content,
      },
    });
  }
}

async function main() {
  const passwordHash = await argon2.hash('DemoPass123!');
  const ids: Record<string, bigint> = {};

  for (const { name, visibility, role, status } of users) {
    const email = `demo.seed.${name}@example.test`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password_hash: passwordHash,
        role: role ?? RoleApp.USER,
        account_status: status ?? AccountStatus.ACTIVE,
      },
    });

    ids[name] = user.user_id;

    if (visibility) {
      await prisma.profile.upsert({
        where: { user_id: user.user_id },
        update: {},
        create: {
          user_id: user.user_id,
          username: `demo_${name}`,
          description: `Demo profile for ${name}`,
          location: [48.8566, 2.3522],
          commune: 'Paris',
          visibility,
        },
      });
    }

    console.log(`${email} → user_id ${user.user_id}`);
  }

  const paris = await ensureOrganization(
  'Demo - Paris Collective',
  ids.alice,
  OrganizationStatus.ACTIVE,
  );

  const neighborhood = await ensureOrganization(
    'Demo - Neighborhood Support',
    ids.damien,
    OrganizationStatus.SUSPENDED,
  );

  // Organisation active : owner, manager et deux membres.
  await ensureMember(paris.organization_id, ids.alice, RoleOrg.OWNER, MemberStatus.ACTIVE);
  await ensureMember(paris.organization_id, ids.bob, RoleOrg.MANAGER, MemberStatus.ACTIVE);
  await ensureMember(paris.organization_id, ids.claire, RoleOrg.MEMBER, MemberStatus.ACTIVE);
  await ensureMember(paris.organization_id, ids.damien, RoleOrg.MEMBER, MemberStatus.ACTIVE);

  // Deux cas supplémentaires pour tester les restrictions et demandes.
  await ensureMember(paris.organization_id, ids.franck, RoleOrg.MEMBER, MemberStatus.BANNED);
  await ensureMember(paris.organization_id, ids.emma, RoleOrg.MEMBER, MemberStatus.PENDING);

  // Organisation suspendue : owner, manager et deux membres.
  await ensureMember(neighborhood.organization_id, ids.damien, RoleOrg.OWNER, MemberStatus.ACTIVE);
  await ensureMember(neighborhood.organization_id, ids.emma, RoleOrg.MANAGER, MemberStatus.ACTIVE);
  await ensureMember(neighborhood.organization_id, ids.bob, RoleOrg.MEMBER, MemberStatus.ACTIVE);
  await ensureMember(neighborhood.organization_id, ids.claire, RoleOrg.MEMBER, MemberStatus.ACTIVE);

  console.log(`Organizations: active=${paris.organization_id}, suspended=${neighborhood.organization_id}`);

  await ensureFriendship(ids.alice, ids.bob, FriendshipStatus.ACTIVE);
  await ensureFriendship(
    ids.alice,
    ids.emma,
    FriendshipStatus.BLOCKED,
    ids.alice,
  );

  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      requester_id: ids.claire,
      addressee_id: ids.alice,
    },
  });

  if (!pendingRequest) {
    await prisma.friendRequest.create({
      data: {
        requester_id: ids.claire,
        addressee_id: ids.alice,
        status: FriendRequestStatus.PENDING,
      },
    });
  }

  console.log('Friendships and pending friend request ready');

  const gardening = await ensureAction('Demo - Gardening Together', ids.alice, {
  organizationId: paris.organization_id,
  category: Category.ENVIRONMENT,
  });

  const awaitingApproval = await ensureAction(
    'Demo - Cleanup Awaiting Approval',
    ids.alice,
    {
      organizationId: paris.organization_id,
      category: Category.ENVIRONMENT,
      participants: [ids.bob, ids.claire, ids.damien],
    },
  );

  const full = await ensureAction('Demo - Full Action', ids.alice, {
    organizationId: paris.organization_id,
    category: Category.SOCIAL,
    maxParticipants: 3,
    participants: [ids.bob, ids.claire, ids.damien],
  });

  const completed = await ensureAction('Demo - Completed Collection', ids.alice, {
    organizationId: paris.organization_id,
    category: Category.ENVIRONMENT,
    status: ActionStatus.COMPLETED,
    participants: [ids.bob, ids.claire, ids.damien],
    validatorId: ids.alice,
    daysFromNow: -7,
  });

  const suspendedOrgAction = await ensureAction(
    'Demo - Local Support',
    ids.damien,
    {
      organizationId: neighborhood.organization_id,
      category: Category.SOCIAL,
    },
  );

  console.log(
    `Actions: gardening=${gardening.action_id}, ` +
    `awaiting approval=${awaitingApproval.action_id}, ` +
    `full=${full.action_id}, completed=${completed.action_id}, ` +
    `suspended organization=${suspendedOrgAction.action_id}`,
  );

  await ensureComment(
  gardening.action_id,
  ids.bob,
  'I can bring some plants!',
  );

  await ensureComment(
    awaitingApproval.action_id,
    ids.claire,
    'We have enough people to get started.',
  );

  await ensureComment(
    completed.action_id,
    ids.bob,
    'Thanks everyone for helping with the collection!',
  );

  console.log('Demo comments ready');
}

  main()
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });