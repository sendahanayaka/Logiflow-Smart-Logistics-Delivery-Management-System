import { useState } from 'react'
import { Link } from 'react-router-dom'
import './LandingPage.css'

const features = [
  {
    number: '01',
    title: 'Smart Delivery Planning',
    description:
      'Give delivery requests a clear path from intake to an efficient, dispatch-ready plan.',
  },
  {
    number: '02',
    title: 'Fleet & Driver Management',
    description:
      'Bring drivers, vehicles, availability and assignments into one coordinated workspace.',
  },
  {
    number: '03',
    title: 'Warehouse Operations',
    description:
      'Support package intake, warehouse handling and orderly dispatch preparation.',
  },
  {
    number: '04',
    title: 'Real-Time Delivery Tracking',
    description:
      'Create visibility around delivery progress, status updates and the journey to completion.',
  },
  {
    number: '05',
    title: 'AI-Assisted Dispatch Planning',
    description:
      'Use intelligent agents to assist planning while important dispatch decisions stay under human approval.',
  },
]

const workflow = [
  'Customer Order',
  'AI Planning',
  'Manager Approval',
  'Driver Dispatch',
  'Live Tracking',
  'Delivery Completed',
]

const roles = [
  ['CU', 'Customer', 'Request and follow deliveries'],
  ['DR', 'Driver', 'Receive clear assignments'],
  ['WS', 'Warehouse Staff', 'Prepare packages for dispatch'],
  ['OM', 'Operations Manager', 'Coordinate and approve operations'],
]

export default function LandingPage() {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="landing-page">
      <header className="public-header">
        <div className="landing-container public-navbar">
          <a className="public-brand" href="#home" onClick={closeMenu}>
            <img src="/logo.png" alt="LogiFlow logo" />
            <span>LogiFlow</span>
          </a>

          <button
            type="button"
            className="public-menu-button"
            aria-label="Toggle navigation"
            aria-expanded={isMenuOpen}
            aria-controls="public-navigation"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            id="public-navigation"
            className={`public-navigation ${isMenuOpen ? 'is-open' : ''}`}
            aria-label="Public navigation"
          >
            <div className="public-navigation__links">
              <a href="#home" onClick={closeMenu}>Home</a>
              <a href="#features" onClick={closeMenu}>Features</a>
              <a href="#how-it-works" onClick={closeMenu}>How It Works</a>
            </div>
            <div className="public-navigation__actions">
              <Link className="public-sign-in" to="/login" onClick={closeMenu}>
                Sign In
              </Link>
              <Link className="button button--primary button-link" to="/register" onClick={closeMenu}>
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="landing-container landing-hero__grid">
            <div className="landing-hero__content">
              <span className="landing-kicker">
                <span aria-hidden="true" /> One connected logistics platform
              </span>
              <h1>Smarter logistics.<br /><em>Better deliveries.</em></h1>
              <p>
                Plan, manage and track deliveries through one intelligent
                logistics platform built for every team in the journey.
              </p>
              <div className="landing-hero__actions">
                <Link className="button button--primary button--large button-link" to="/register">
                  Get Started <span aria-hidden="true">→</span>
                </Link>
                <Link className="button button--secondary button--large button-link" to="/login">
                  Sign In
                </Link>
              </div>
              <div className="landing-hero__trust" aria-label="Platform priorities">
                <span>Human-approved planning</span>
                <span>Role-based access</span>
                <span>Live visibility</span>
              </div>
            </div>

            <div className="route-preview" aria-label="Illustration of a delivery route">
              <div className="route-preview__header">
                <div>
                  <span>Delivery route</span>
                  <strong>Colombo Central</strong>
                </div>
                <span className="route-preview__status"><i /> Planning</span>
              </div>
              <div className="route-preview__map" aria-hidden="true">
                <svg viewBox="0 0 520 330" role="img">
                  <title>Planned delivery route between warehouse and destination</title>
                  <path className="route-preview__road" d="M-20 245 C85 170 125 270 210 190 S350 70 545 112" />
                  <path className="route-preview__route" d="M34 249 C100 204 143 249 211 190 S358 82 480 112" />
                </svg>
                <span className="route-pin route-pin--warehouse"><i>W</i>Warehouse</span>
                <span className="route-pin route-pin--driver"><i>D</i>Driver</span>
                <span className="route-pin route-pin--customer"><i>C</i>Customer</span>
                <div className="route-preview__vehicle">
                  <span aria-hidden="true">→</span>
                  <div><strong>LF-204</strong><small>On schedule</small></div>
                </div>
              </div>
              <div className="route-preview__metrics">
                <div><span>Stops</span><strong>03</strong></div>
                <div><span>Route</span><strong>24 km</strong></div>
                <div><span>Approval</span><strong>Pending</strong></div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-container">
            <div className="landing-section__heading">
              <div>
                <span className="landing-kicker">Built for the full delivery lifecycle</span>
                <h2>One flow from request to arrival.</h2>
              </div>
              <p>
                LogiFlow provides the shared foundation for teams to plan,
                coordinate and monitor logistics operations as the platform grows.
              </p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-card__number">{feature.number}</span>
                  <div className="feature-card__mark" aria-hidden="true">
                    <span /><span /><span />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section workflow-section" id="how-it-works">
          <div className="landing-container">
            <div className="landing-section__heading landing-section__heading--light">
              <div>
                <span className="landing-kicker landing-kicker--light">How it works</span>
                <h2>A clearer path for every delivery.</h2>
              </div>
              <p>
                Intelligent planning supports the process, while operations
                managers keep control of important dispatch decisions.
              </p>
            </div>
            <ol className="workflow-list">
              {workflow.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step}</strong>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="landing-section platform-section" aria-labelledby="platform-title">
          <div className="landing-container platform-grid">
            <div className="platform-copy">
              <span className="landing-kicker">Designed around real teams</span>
              <h2 id="platform-title">Everyone connected.<br />Every role in sync.</h2>
              <p>
                Give each participant a focused view of the same logistics flow,
                with access shaped around their responsibilities.
              </p>
            </div>
            <div className="role-list">
              {roles.map(([initials, role, description]) => (
                <article key={role}>
                  <span aria-hidden="true">{initials}</span>
                  <div><h3>{role}</h3><p>{description}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-container landing-cta__inner">
            <div>
              <span className="landing-kicker landing-kicker--light">Move with clarity</span>
              <h2>Ready to simplify your logistics operations?</h2>
            </div>
            <div className="landing-cta__actions">
              <Link className="button button--primary button--large button-link" to="/register">Get Started</Link>
              <Link className="landing-cta__sign-in" to="/login">Sign In <span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer__top">
          <a className="public-brand public-brand--footer" href="#home">
            <img src="/logo.png" alt="LogiFlow logo" />
            <span>LogiFlow</span>
          </a>
          <p>Smart Logistics &amp; Delivery Management Platform</p>
          <nav aria-label="Footer navigation">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Sign In</Link>
          </nav>
        </div>
        <div className="landing-container landing-footer__bottom">
          <span>© {new Date().getFullYear()} LogiFlow</span>
          <span>Plan clearly. Deliver confidently.</span>
        </div>
      </footer>
    </div>
  )
}
