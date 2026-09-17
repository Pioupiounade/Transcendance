import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationmembersService } from './organizationmembers.service';

describe('OrganizationmembersService', () => {
  let service: OrganizationmembersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationmembersService],
    }).compile();

    service = module.get<OrganizationmembersService>(OrganizationmembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
