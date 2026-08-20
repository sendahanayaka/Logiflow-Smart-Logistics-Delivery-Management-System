import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  AUTH_STORAGE_KEY,
} from '../features/auth/authSlice'
import { api } from './api'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

let previousAuth = store.getState().auth

store.subscribe(() => {
  const currentAuth = store.getState().auth

  if (currentAuth === previousAuth || typeof window === 'undefined') {
    return
  }

  previousAuth = currentAuth

  if (currentAuth.accessToken) {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentAuth))
  } else {
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }
})
