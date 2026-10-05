import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    return (
        <div className="main-layout">
            <Navbar />
            <main className="main-layout__content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
