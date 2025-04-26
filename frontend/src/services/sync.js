import axios from 'axios';
import { getMembersOffline } from './offlineStorage';

export const syncMembers = async () => {
  const offlineMembers = await getMembersOffline();
  offlineMembers.forEach(async (member) => {
    await axios.post('/api/members', member);
  });
};