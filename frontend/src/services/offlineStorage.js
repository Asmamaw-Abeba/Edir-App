import localForage from 'localforage';

export const saveMemberOffline = async (member) => {
  await localForage.setItem(`member_${member.id}`, member);
};

export const getMembersOffline = async () => {
  const members = [];
  await localForage.iterate((value) => {
    members.push(value);
  });
  return members;
};