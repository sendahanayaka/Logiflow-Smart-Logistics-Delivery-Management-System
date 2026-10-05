import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
    return (
        <div className="landing-page-ref">

            {/* HERO SECTION */}
            <section id="home" className="hero-ref">
                <div className="hero-ref-overlay"></div>

                <div className="hero-ref-content">
                    <div className="hero-ref-links">
                        <Link to="/login" className="hero-ref-pill special-pill" style={{ textDecoration: 'none', display: 'block', backgroundColor: 'var(--color-navy, #08006C)', color: 'white', borderColor: 'transparent', fontWeight: 800 }}>App Portals</Link>
                        <div className="hero-ref-pill">Delivery Order Management</div>
                        <div className="hero-ref-pill">Fleet & Driver Intelligence</div>
                        <div className="hero-ref-pill">Warehouse Operations</div>
                        <div className="hero-ref-pill">AI Route Planning</div>
                        <div className="hero-ref-pill">Real-Time Tracking</div>
                        <div className="hero-ref-pill">Logistics Analytics</div>
                    </div>
                </div>
            </section>

            {/* INTRO & METRICS */}
            <section id="about" className="intro-section-ref">
                <h1 className="intro-title">
                    <span className="text-orange">LOGI</span><span className="text-navy">FLOW</span>
                </h1>
                <h3 className="intro-subtitle">GROUP OF COMPANIES</h3>

                <p className="intro-desc">
                    LogiFlow Group stands as a leading force in the global logistics and delivery management sector, offering a
                    comprehensive suite of integrated solutions tailored to meet the growing demands of modern supply chains. Our
                    platform encompasses diverse specialized modules, each with a strong focus on efficiency,
                    innovation, and exceptional service delivery. From intelligent routing and real-time tracking to large-scale fleet
                    management and warehouse optimizations, we are committed to enhancing logistics operations while
                    driving economic growth. With cutting-edge technology and a seamlessly connected ecosystem, we are poised to
                    continue shaping the future of logistics globally.
                </p>

                <div className="metrics-card-ref">
                    <div className="metric-box">
                        <div className="metric-num">3,500+</div>
                        <div className="metric-text">Employees</div>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-box">
                        <div className="metric-num">50,000+</div>
                        <div className="metric-text">Deliveries Per Day</div>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-box">
                        <div className="metric-num">120+</div>
                        <div className="metric-text">Vehicle Fleet</div>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-box">
                        <div className="metric-num">19+</div>
                        <div className="metric-text">Years of Experience</div>
                    </div>
                    <div className="metric-divider"></div>
                    <div className="metric-box">
                        <div className="metric-num">100+</div>
                        <div className="metric-text">Fulfillment Centers</div>
                    </div>
                </div>
            </section>

            {/* OUR SUCCESS */}
            <section id="success" className="our-success-section">
                <div className="success-container" style={{ justifyContent: 'center' }}>
                    <div className="success-left-card" style={{ maxWidth: '800px', textAlign: 'center' }}>
                        <h2>Our Success</h2>
                        <p>
                            With over 19 years of excellence, LogiFlow Group has
                            become a trusted leader in the global logistics industry. Our intelligent
                            service modules have successfully managed large-scale ventures
                            and earned numerous industry awards. We are proud of our
                            innovative solutions and unwavering commitment to quality, driving
                            our continuous growth and success throughout the supply chain ecosystem.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};
