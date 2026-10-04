import { jest } from '@jest/globals';

const executeQuery = jest.fn();
jest.unstable_mockModule('../config/database.js', () => ({ executeQuery }));

const { default: MessagerieService } = await import('./messagerieService.js');

describe('MessagerieService conversation authorization', () => {
  beforeEach(() => executeQuery.mockReset());

  it('allows either conversation participant', async () => {
    const conversation = { id: 7, client_id: 11, prestataire_id: 22 };
    executeQuery.mockResolvedValueOnce([conversation]);

    await expect(MessagerieService.getForParticipant(7, 22)).resolves.toBe(conversation);
  });

  it('rejects a user who is not a participant', async () => {
    executeQuery.mockResolvedValueOnce([{ id: 7, client_id: 11, prestataire_id: 22 }]);

    await expect(MessagerieService.getForParticipant(7, 33)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('does not mark messages read for a non-participant', async () => {
    executeQuery.mockResolvedValueOnce([{ id: 7, client_id: 11, prestataire_id: 22 }]);

    await expect(MessagerieService.markAsRead(7, 33)).rejects.toMatchObject({ statusCode: 403 });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });
});