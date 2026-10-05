import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BackBar } from './BackBar';

export const MainLayout: React.FC = () => {
    return (
        <div className="main-layout" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <BackBar />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
