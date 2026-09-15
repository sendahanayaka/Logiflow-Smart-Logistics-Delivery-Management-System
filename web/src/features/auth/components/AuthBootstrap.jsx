import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import {
  AUTH_STATUS,
  clearCredentials,
  setCredentials,
} from '../authSlice'
import { useRefreshMutation } from '../authApi'

export default function AuthBootstrap({ children }) {
  const dispatch = useDispatch()
  const [refresh] = useRefreshMutation()
  const initialization = useRef(null)

  useEffect(() => {
    if (!initialization.current) {
      initialization.current = refresh()
        .unwrap()
        .then((session) =>
          dispatch((authDispatch, getState) => {
            if (getState().auth.status === AUTH_STATUS.INITIALIZING) {
              authDispatch(setCredentials(session))
            }
          }),
        )
        .catch(() =>
          dispatch((authDispatch, getState) => {
            if (getState().auth.status === AUTH_STATUS.INITIALIZING) {
              authDispatch(clearCredentials())
            }
          }),
        )
    }
  }, [dispatch, refresh])

  return children
}
