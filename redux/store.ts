"use client";
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./api/apiSlice";
import authSlice from "./auth/authSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authSlice,
  },
  devTools: process.env.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

// On every page load:
// 1. First try to refresh the access token using the httpOnly refresh cookie
// 2. Then load the user with the new access token
const initializeApp = async () => {
  try {
    // Step 1: refresh → gets a new accessToken stored in Redux
    await store.dispatch(
      apiSlice.endpoints.refreshToken.initiate({}, { forceRefetch: true })
    );

    // Step 2: load user using updated token from state
    const token = store.getState().auth.token;
    if (token) {
      await store.dispatch(
        apiSlice.endpoints.loadUser.initiate(token, { forceRefetch: true })
      );
    }
  } catch (err) {
    // Not logged in — that's fine, let the page handle it
    console.log("Session not found");
  }
};

initializeApp();

export default store;