import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AgenticAIDrawer } from '../features/fleet/components/AgenticAIDrawer';

export const AppLayout: React.FC = () => {
  const [isAgentDrawerOpen, setIsAgentDrawerOpen] = useState(false);

  return (
    <>
      <Outlet />

      {/* Floating Agentic AI Trigger Button in Bottom-Right Corner - Global across all pages */}
      <button
        type="button"
        onClick={() => setIsAgentDrawerOpen(true)}
        title="Open Agentic AI Resource Allocation Assistant"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 990,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '2px solid #f97316',
          borderRadius: '50px',
          padding: '0.75rem 1.35rem',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.4), 0 0 20px rgba(249, 115, 22, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.92rem',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.04)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.5), 0 0 28px rgba(249, 115, 22, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.4), 0 0 20px rgba(249, 115, 22, 0.35)';
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(249, 115, 22, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f97316',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <span>Agentic AI</span>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            animation: 'pulse 1.5s infinite',
          }}
        />
      </button>

      {/* Agentic AI Monitoring Drawer */}
      <AgenticAIDrawer
        isOpen={isAgentDrawerOpen}
        onClose={() => setIsAgentDrawerOpen(false)}
      />
    </>
  );
};

export default AppLayout;
