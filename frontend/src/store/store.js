// import { configureStore } from '@reduxjs/toolkit';
// import membersReducer from './membersSlice';

// export const store = configureStore({
//   reducer: {
//     members: membersReducer,
//   },
// });

import { configureStore } from '@reduxjs/toolkit';
import membersReducer from './membersSlice';

const store = configureStore({
  reducer: {
    members: membersReducer,
  },
});

export default store; // Use default export