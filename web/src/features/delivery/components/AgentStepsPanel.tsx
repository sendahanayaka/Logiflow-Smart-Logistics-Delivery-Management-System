// [S4] Agent transparency (items 9 & 10): renders the agent's audit trail so an
// ops manager can see exactly how each agent (Plan → Allocate → Validate → Route →
// Execute) worked on this order. Each step expands to show its tool calls.
import React, { useState } from 'react';
import type { AgentStep } from '../types';

// Map an audit step/agent to a friendly canonical stage label + icon.
const stageOf = (s: AgentStep): { label: string; icon: string } => {
  const k = `${s.step} ${s.agent}`.toLowerCase();
  if (k.includes('alloc')) return { label: 'Allocate', icon: '🚚' };
  if (k.includes('valid')) return { label: 'Validate', icon: '✅' };
  if (k.includes('rout') || k.includes('sequence')) return { label: 'Route', icon: '🗺️' };
  if (k.includes('exec') || k.includes('dispatch')) return { label: 'Execute', icon: '📦' };
  if (k.includes('plan') || k.includes('triage') || k.includes('intake')) return { label: 'Plan', icon: '🧭' };
  return { label: s.step || 'Step', icon: '•' };
};

export const AgentStepsPanel: React.FC<{ steps: AgentStep[] | null | undefined }> = ({ steps }) => {
  const [open, setOpen] = useState<number | null>(null);

  if (!steps || steps.length === 0) {
    return (
      <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '0.5rem 0 1rem' }}>
        No agent step detail was recorded for this workflow.
      </p>
    );
  }

  return (
    <div style={{ margin: '0.5rem 0 1.25rem' }}>
      <h4 style={{ color: '#08006C', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>
        How the agents built this plan
      </h4>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {steps.map((s, i) => {
          const stage = stageOf(s);
          const expanded = open === i;
          const hasTools = s.toolCalls && s.toolCalls.length > 0;
          return (
            <li
              key={i}
              style={{
                border: '1px solid #e2e8f0', borderLeft: `4px solid ${s.ok ? '#16a34a' : '#d9534f'}`,
                borderRadius: 8, padding: '10px 12px', marginBottom: 8, background: '#fff',
                cursor: hasTools ? 'pointer' : 'default',
              }}
              onClick={() => hasTools && setOpen(expanded ? null : i)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                <strong style={{ color: '#0f172a' }}>{i + 1}. {stage.label}</strong>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>· {s.agent}</span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {typeof s.durationMs === 'number' && (
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{s.durationMs} ms</span>
                  )}
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 700, color: '#fff', borderRadius: 999,
                    padding: '1px 8px', background: s.ok ? '#16a34a' : '#d9534f',
                  }}>{s.ok ? 'OK' : 'FAIL'}</span>
                </span>
              </div>
              <div style={{ color: '#475569', fontSize: '0.86rem', marginTop: 6 }}>{s.summary}</div>
              {hasTools && (
                <div style={{ marginTop: 6 }}>
                  {!expanded ? (
                    <span style={{ color: '#FD5901', fontSize: '0.76rem' }}>
                      {s.toolCalls.length} tool call{s.toolCalls.length > 1 ? 's' : ''} — click to view
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.toolCalls.map((t, ti) => (
                        <span key={ti} style={{
                          background: '#eef2ff', color: '#3730a3', borderRadius: 6,
                          padding: '2px 8px', fontSize: '0.72rem', fontFamily: 'monospace',
                        }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
