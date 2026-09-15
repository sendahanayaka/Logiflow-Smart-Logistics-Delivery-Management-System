import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { api } from '../../app/api'
import { useLogoutMutation } from '../../features/auth/authApi'
import {
  AUTH_STATUS,
  clearCredentials,
  selectAuth,
  setCredentials,
  setCurrentUser,
} from '../../features/auth/authSlice'

export default function useAuth() {
  const dispatch = useDispatch()
  const auth = useSelector(selectAuth)
  const [requestLogout, logoutState] = useLogoutMutation()
  const isAuthenticated = auth.status === AUTH_STATUS.AUTHENTICATED
  const isInitializing = auth.status === AUTH_STATUS.INITIALIZING

  const signIn = useCallback(
    (payload) => dispatch(setCredentials(payload)),
    [dispatch],
  )

  const updateUser = useCallback(
    (user) => dispatch(setCurrentUser(user)),
    [dispatch],
  )

  const logout = useCallback(async () => {
    await requestLogout().unwrap()
    dispatch(clearCredentials())
    dispatch(api.util.resetApiState())
  }, [dispatch, requestLogout])

  const hasRole = useCallback(
    (role) => isAuthenticated && auth.user?.role === role,
    [auth.user?.role, isAuthenticated],
  )

  return {
    ...auth,
    isAuthenticated,
    isInitializing,
    hasRole,
    signIn,
    logout,
    logoutState,
    updateUser,
  }
}
