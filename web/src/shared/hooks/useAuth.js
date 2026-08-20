import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '../../app/api'
import {
  clearCredentials,
  selectAuth,
  setCredentials,
  setCurrentUser,
} from '../../features/auth/authSlice'

export default function useAuth() {
  const dispatch = useDispatch()
  const auth = useSelector(selectAuth)
  // Authentication expiry is intentionally evaluated against the current clock.
  const expiryTime = auth.expiresAt
    ? new Date(auth.expiresAt).getTime()
    : null
  // oxlint-disable-next-line react/purity
  const currentTime = Date.now()
  const isExpired = expiryTime !== null && expiryTime <= currentTime
  const isAuthenticated = Boolean(auth.accessToken) && !isExpired

  const signIn = useCallback(
    (payload) => dispatch(setCredentials(payload)),
    [dispatch],
  )

  const updateUser = useCallback(
    (user) => dispatch(setCurrentUser(user)),
    [dispatch],
  )

  const signOut = useCallback(() => {
    dispatch(clearCredentials())
    dispatch(api.util.resetApiState())
  }, [dispatch])

  const hasRole = useCallback(
    (role) => isAuthenticated && auth.user?.role === role,
    [auth.user?.role, isAuthenticated],
  )

  return {
    ...auth,
    isAuthenticated,
    isExpired,
    hasRole,
    signIn,
    signOut,
    logout: signOut,
    updateUser,
  }
}
