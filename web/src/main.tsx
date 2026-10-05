import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from './app/store';
import { fetchCurrentUser } from './features/auth/authSlice';
import { router } from './app/router';

// On load/reload, if a token is stored, restore the signed-in user (the slice only
// rehydrates the token). If the token has expired, this rejects and logs out cleanly.
if (store.getState().auth.token) {
  store.dispatch(fetchCurrentUser() as never);
}
import { InteractiveDotGrid } from './components/InteractiveDotGrid';
import './index.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <InteractiveDotGrid />
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
