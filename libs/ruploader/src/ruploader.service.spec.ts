import { Test, TestingModule } from '@nestjs/testing';
import { RuploaderService } from './ruploader.service';

describe('RuploaderService', () => {
  let service: RuploaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuploaderService],
    }).compile();

    service = module.get<RuploaderService>(RuploaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
