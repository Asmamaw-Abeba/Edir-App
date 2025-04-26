import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  members: [],
};

const membersSlice = createSlice({
  name: 'members',
  initialState,
  reducers: {
    addMember: (state, action) => {
      state.members.push(action.payload);
    },
  },
});

export const { addMember } = membersSlice.actions;
export default membersSlice.reducer;
