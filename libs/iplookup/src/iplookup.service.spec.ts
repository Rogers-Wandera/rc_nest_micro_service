import { Test, TestingModule } from '@nestjs/testing';
import { IplookupService } from './iplookup.service';

describe('IplookupService', () => {
  let service: IplookupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IplookupService],
    }).compile();

    service = module.get<IplookupService>(IplookupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
