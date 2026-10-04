import { jest } from '@jest/globals';

const getForParticipant = jest.fn();
jest.unstable_mockModule('../services/messagerieService.js', () => ({
  default: { getForParticipant },
}));

const { joinConversationRoom } = await import('./socket.js');

describe('joinConversationRoom', () => {
  let socket;
  let acknowledge;

  beforeEach(() => {
    getForParticipant.mockReset();
    socket = { userId: 22, join: jest.fn() };
    acknowledge = jest.fn();
  });

  it('joins the room only after participant authorization succeeds', async () => {
    getForParticipant.mockResolvedValueOnce({ id: 7 });

    await joinConversationRoom(socket, '7', acknowledge);

    expect(getForParticipant).toHaveBeenCalledWith(7, 22);
    expect(socket.join).toHaveBeenCalledWith('conversation_7');
    expect(acknowledge).toHaveBeenCalledWith({ success: true });
  });

  it('does not join the room when the user is not a participant', async () => {
    getForParticipant.mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { statusCode: 403 }));

    await joinConversationRoom(socket, 7, acknowledge);

    expect(socket.join).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({ success: false, message: 'Accès refusé' });
  });

  it('rejects invalid conversation identifiers without querying access', async () => {
    await joinConversationRoom(socket, 'invalid', acknowledge);

    expect(getForParticipant).not.toHaveBeenCalled();
    expect(socket.join).not.toHaveBeenCalled();
    expect(acknowledge).toHaveBeenCalledWith({ success: false, message: 'Identifiant invalide' });
  });
});