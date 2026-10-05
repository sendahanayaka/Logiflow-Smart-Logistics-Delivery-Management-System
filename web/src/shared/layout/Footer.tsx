import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logoUrl from '../../assets/logo.png';

export const Footer: React.FC = () => {
    return (
        <footer className="footer-ref" id="contact">
            <div className="footer-logo-container">
                <img src={logoUrl} alt="LogiFlow Logo" className="footer-logo" />
            </div>
            <p className="footer-text">
                LogiFlow is a Global Logistics, Freight, Port Services and Delivery Management company. We are part of
                multiple networks and have been in operation for over 19 years.
            </p>

            <div className="footer-links">
                <a href="#home">Home</a>
                <span className="divider">|</span>
                <a href="#about">About Us</a>
                <span className="divider">|</span>
                <a href="#services">Services</a>
                <span className="divider">|</span>
                <a href="#contact">Contact Us</a>
            </div>

            <div className="footer-contact">
                <div className="contact-item">
                    <span className="phone-icon">📞</span>
                    <span className="contact-text">+94-11 266 2050</span>
                </div>
                <div className="contact-item">
                    <span className="phone-icon">📞</span>
                    <span className="contact-text">+94-11 266 2060</span>
                </div>
                <div className="contact-item">
                    <span className="phone-icon">✉️</span>
                    <span className="contact-text">info@logiflow.com</span>
                </div>
            </div>

            <div className="footer-socials">
                <div className="social-circle">in</div>
                <div className="social-circle">f</div>
                <div className="social-circle">yt</div>
            </div>

            <div className="footer-bottom">
                © {new Date().getFullYear()} LogiFlow All Rights Reserved. Made by LogiFlow Systems
            </div>
        </footer>
    );
};
