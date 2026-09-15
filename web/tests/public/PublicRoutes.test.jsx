import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { appRoutes } from '../../src/app/router'
import { store } from '../../src/app/store'

function renderRoute(initialEntry) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )

  return router
}

describe('public routes', () => {
  it('renders the LogiFlow landing page at the root route', () => {
    renderRoute('/')

    expect(
      screen.getByRole('heading', { name: /smarter logistics/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Smart Delivery Planning')).toBeInTheDocument()
  })

  it('navigates from the landing page to sign in', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/')

    await user.click(screen.getAllByRole('link', { name: 'Sign In' })[0])

    expect(router.state.location.pathname).toBe('/login')
    expect(
      screen.getByRole('heading', { name: 'Sign in to LogiFlow' }),
    ).toBeInTheDocument()
  })

  it('navigates from the landing page to registration', async () => {
    const user = userEvent.setup()
    const router = renderRoute('/')

    await user.click(screen.getAllByRole('link', { name: 'Get Started' })[0])

    expect(router.state.location.pathname).toBe('/register')
    expect(
      screen.getByRole('heading', { name: 'Create your Customer account' }),
    ).toBeInTheDocument()
  })

  it('redirects an unknown public URL to the landing page', async () => {
    const router = renderRoute('/not-a-real-page')

    expect(
      await screen.findByRole('heading', { name: /smarter logistics/i }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('keeps the existing login route available', () => {
    renderRoute('/login')

    expect(
      screen.getByRole('heading', { name: 'Sign in to LogiFlow' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to LogiFlow home' }),
    ).toHaveAttribute('href', '/')
  })

  it('keeps the existing register route available', () => {
    renderRoute('/register')

    expect(
      screen.getByRole('heading', { name: 'Create your Customer account' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Back to LogiFlow home' }),
    ).toHaveAttribute('href', '/')
  })
})
