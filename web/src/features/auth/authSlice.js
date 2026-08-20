import { createSlice } from '@reduxjs/toolkit'

export const AUTH_STORAGE_KEY = 'logiflow.auth'

function readStoredAuth() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedValue = window.sessionStorage.getItem(AUTH_STORAGE_KEY)
    return storedValue ? JSON.parse(storedValue) : null
  } catch {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

const storedAuth = readStoredAuth()

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    accessToken: storedAuth?.accessToken ?? null,
    expiresAt: storedAuth?.expiresAt ?? null,
    user: storedAuth?.user ?? null,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.accessToken = action.payload.accessToken
      state.expiresAt = action.payload.expiresAt
      state.user = action.payload.user
    },
    setCurrentUser: (state, action) => {
      state.user = action.payload
    },
    clearCredentials: (state) => {
      state.accessToken = null
      state.expiresAt = null
      state.user = null
    },
  },
})

export const { setCredentials, setCurrentUser, clearCredentials } =
  authSlice.actions

export const selectAuth = (state) => state.auth
export const selectCurrentUser = (state) => state.auth.user
export const selectAccessToken = (state) => state.auth.accessToken

export default authSlice.reducer
