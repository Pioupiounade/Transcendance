import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationmembersController } from './organizationmembers.controller';

describe('OrganizationmembersController', () => {
  let controller: OrganizationmembersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationmembersController],
    }).compile();

    controller = module.get<OrganizationmembersController>(OrganizationmembersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
