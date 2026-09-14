import { Test, TestingModule } from '@nestjs/testing';
import { PointtransactionService } from './pointtransaction.service';

describe('PointtransactionService', () => {
  let service: PointtransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PointtransactionService],
    }).compile();

    service = module.get<PointtransactionService>(PointtransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
