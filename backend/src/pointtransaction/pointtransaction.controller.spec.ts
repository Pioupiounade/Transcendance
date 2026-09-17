import { Test, TestingModule } from '@nestjs/testing';
import { PointtransactionController } from './pointtransaction.controller';

describe('PointtransactionController', () => {
  let controller: PointtransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PointtransactionController],
    }).compile();

    controller = module.get<PointtransactionController>(PointtransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
