import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackBar } from './BackBar';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
    return (
        <div className="main-layout">
            <Navbar />
            <BackBar />
            <main className="main-layout__content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
