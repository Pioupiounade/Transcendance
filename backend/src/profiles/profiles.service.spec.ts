import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountStatus, ProfileVisibility } from '../../generated/prisma/client';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let prisma: {
    profile: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    friendship: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      profile: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
      friendship: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('allows the owner to view a private profile', async () => {
    prisma.profile.findUnique.mockResolvedValue({
      user_id: BigInt('123'),
      username: 'owner',
      description: 'bio',
      profile_picture: null,
      location: [48.8566, 2.3522],
      visibility: ProfileVisibility.PRIVATE,
      commune: 'Paris',
      user: {
        account_status: AccountStatus.ACTIVE,
        interests: [],
      },
    });

    await expect(service.findOne('123', '123')).resolves.toMatchObject({
      user_id: '123',
      username: 'owner',
      visibility: ProfileVisibility.PRIVATE,
      interests: [],
    });
  });

  it('rejects a non-owner trying to view a private profile', async () => {
    prisma.profile.findUnique.mockResolvedValue({
      user_id: BigInt('123'),
      username: 'owner',
      description: 'bio',
      profile_picture: null,
      location: [48.8566, 2.3522],
      visibility: ProfileVisibility.PRIVATE,
      commune: 'Paris',
      user: {
        account_status: AccountStatus.ACTIVE,
        interests: [],
      },
    });

    await expect(service.findOne('123', '456')).rejects.toBeInstanceOf(NotFoundException);
  });
});
