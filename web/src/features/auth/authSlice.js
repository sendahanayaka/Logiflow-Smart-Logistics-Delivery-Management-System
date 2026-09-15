import { createSlice } from '@reduxjs/toolkit'

export const AUTH_STATUS = {
  INITIALIZING: 'initializing',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
}

export const initialAuthState = {
  accessToken: null,
  expiresAt: null,
  user: null,
  status: AUTH_STATUS.INITIALIZING,
}

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.expiresAt = action.payload.expiresAt
      state.user = action.payload.user
      state.status = AUTH_STATUS.AUTHENTICATED
    },
    setCurrentUser: (state, action) => {
      state.user = action.payload
    },
    clearCredentials: (state) => {
      state.accessToken = null
      state.expiresAt = null
      state.user = null
      state.status = AUTH_STATUS.UNAUTHENTICATED
    },
  },
})

export const { setCredentials, setCurrentUser, clearCredentials } =
  authSlice.actions

export const selectAuth = (state) => state.auth
export const selectCurrentUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken
export const selectAuthStatus = (state) => state.auth.status

export default authSlice.reducer
