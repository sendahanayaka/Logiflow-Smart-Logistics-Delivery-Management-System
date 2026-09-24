import React from 'react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
    return (
        <div className="landing-page">

            {/* 1. HERO SECTION */}
            <section id="home" className="hero-section">
                <div className="hero-content">
                    <h1>Smart Logistics. Seamless Delivery.</h1>
                    <p>
                        LogiFlow is a smart logistics and delivery management platform that
                        helps organizations manage orders, fleet operations, warehouse operations,
                        delivery tracking, and intelligent logistics planning globally.
                    </p>
                    <div className="hero-actions">
                        <button className="btn-primary-large">Get Started</button>
                        <button className="btn-secondary-large">Explore Services</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="abstract-shape shape-1"></div>
                    <div className="abstract-shape shape-2"></div>
                </div>
            </section>

            {/* 2. SERVICES / FEATURES */}
            <section id="services" className="services-section">
                <div className="section-header">
                    <h2>Our Core Services</h2>
                    <p>Comprehensive logistics solutions designed for modern supply chains</p>
                </div>
                <div className="services-grid">
                    {[
                        { title: "Delivery Order Management", desc: "Automate and streamline your entire order lifecycle seamlessly." },
                        { title: "Fleet & Driver Management", desc: "Monitor vehicles, manage drivers, and optimize fleet performance." },
                        { title: "Warehouse & Dispatch Management", desc: "Control inventory, streamline packing, and coordinate dispatches." },
                        { title: "Real-Time Delivery Tracking", desc: "Provide total visibility to customers with real-time updates." },
                        { title: "AI-Powered Logistics Planning", desc: "Leverage intelligent algorithms to route and allocate resources." }
                    ].map((srv, idx) => (
                        <div className="service-card" key={idx}>
                            <div className="service-icon">⚡</div>
                            <h3>{srv.title}</h3>
                            <p>{srv.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. HOW IT WORKS */}
            <section id="how-it-works" className="how-it-works-section">
                <div className="section-header">
                    <h2>How LogiFlow Works</h2>
                    <p>An end-to-end operational flow powered by intelligence.</p>
                </div>

                <div className="workflow-container">
                    <div className="workflow-step">
                        <div className="step-circle">1</div>
                        <h4>Customer Creates Order</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step highlight">
                        <div className="step-circle ai-circle">2</div>
                        <h4>AI Plans Delivery</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step">
                        <div className="step-circle">3</div>
                        <h4>Resources Allocated</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step">
                        <div className="step-circle">4</div>
                        <h4>Warehouse Validates</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step">
                        <div className="step-circle">5</div>
                        <h4>Route Planned</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step">
                        <div className="step-circle">6</div>
                        <h4>Manager Approves</h4>
                    </div>
                    <div className="workflow-connector"></div>
                    <div className="workflow-step success">
                        <div className="step-circle">7</div>
                        <h4>Delivery Completed</h4>
                    </div>
                </div>
            </section>

            {/* 4. ABOUT LOGIFLOW */}
            <section id="about" className="about-section">
                <div className="about-content">
                    <h2>About LogiFlow</h2>
                    <p>
                        LogiFlow is redefining the standards of smart logistics and delivery management.
                        We provide a centralized platform that focuses on <strong>efficiency</strong>,
                        <strong>visibility</strong>, and <strong>intelligent delivery coordination</strong>.
                    </p>
                    <p>
                        Whether handling small-scale dispatches or global operational management,
                        LogiFlow’s intelligent planning features ensure your resources are utilized
                        optimally, reducing costs and maximizing customer satisfaction.
                    </p>
                </div>
            </section>

            {/* 5. CTA SECTION */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to simplify your logistics operations?</h2>
                    <button className="btn-primary-large">Get Started Now</button>
                </div>
            </section>

        </div>
    );
};
