import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export const Footer: React.FC = () => {
    return (
        <footer className="footer" id="contact">
            <div className="footer-container">
                <div className="footer-brand">
                    <h3>📦 LogiFlow</h3>
                    <p>
                        Smart logistics and delivery management platform helping
                        organizations manage orders, fleets, and warehouses seamlessly.
                    </p>
                </div>

                <div className="footer-links">
                    <h4>Navigation</h4>
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#services">Services</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </div>

                <div className="footer-contact">
                    <h4>Contact Us</h4>
                    <p>Email: contact@logiflow.com</p>
                    <p>Phone: +1 234 567 890</p>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} LogiFlow. All rights reserved.</p>
            </div>
        </footer>
    );
};
