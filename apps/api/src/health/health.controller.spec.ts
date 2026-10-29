import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  it('returns status ok after a successful database ping', async () => {
    const ping = jest.fn().mockResolvedValue([{ 1: 1 }]);
    // Test double: only the $queryRaw tag template the controller uses is needed.
    const prisma = { $queryRaw: ping } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('propagates database ping failures', async () => {
    const ping = jest.fn().mockRejectedValue(new Error('db unavailable'));
    const prisma = { $queryRaw: ping } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.check()).rejects.toThrow('db unavailable');
  });
});
