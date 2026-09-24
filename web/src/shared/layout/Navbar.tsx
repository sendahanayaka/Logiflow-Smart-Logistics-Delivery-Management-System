import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export const Navbar: React.FC = () => {
    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link to="/">
                        <span className="brand-logo">📦 LogiFlow</span>
                    </Link>
                </div>

                <nav className="navbar-nav">
                    <ul className="nav-links">
                        <li><a href="#home">Home</a></li>
                        <li><a href="#services">Services</a></li>
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </nav>

                <div className="navbar-actions">
                    <Link to="/login" className="btn-login">Login</Link>
                    <Link to="/get-started" className="btn-primary">Get Started</Link>
                </div>
            </div>
        </header>
    );
};
