import { Test, TestingModule } from '@nestjs/testing';
import { RTechNotifier } from './rtechnotifier.service';

describe('RtechnotifierService', () => {
  let service: RTechNotifier;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RTechNotifier],
    }).compile();

    service = module.get<RTechNotifier>(RTechNotifier);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
