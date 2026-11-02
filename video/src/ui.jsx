import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const C = {
  bg: '#0f172a',
  panel: '#1e293b',
  line: '#334155',
  text: '#f8fafc',
  muted: '#94a3b8',
  human: '#f59e0b',
  ai: '#a78bfa',
  code: '#2dd4bf',
  red: '#f87171',
  green: '#4ade80',
};

export const FONT = '"Segoe UI", Inter, Arial, sans-serif';
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export const progress = (frame, start, dur = 15) => interpolate(frame, [start, start + dur], [0, 1], clamp);

export const rupees = (v) => `₹${Math.round(v).toLocaleString('en-IN')}`;

export function Scene({ dur, children, style }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.text, fontFamily: FONT, padding: '80px 110px', justifyContent: 'center', opacity, ...style }}>
      {children}
    </AbsoluteFill>
  );
}

export function Appear({ at = 0, children, style, dy = 24 }) {
  const p = progress(useCurrentFrame(), at);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * dy}px)`, ...style }}>{children}</div>;
}

export const Heading = ({ children, at = 0, size = 62 }) => (
  <Appear at={at}>
    <div style={{ fontSize: size, fontWeight: 700, marginBottom: 44, lineHeight: 1.15 }}>{children}</div>
  </Appear>
);

export function Count({ to, at, dur = 40, format }) {
  const v = interpolate(useCurrentFrame(), [at, at + dur], [0, to], clamp);
  return <>{format(v)}</>;
}

export const Box = ({ color = C.line, children, style }) => (
  <div style={{ border: `3px solid ${color}`, borderRadius: 18, padding: '20px 26px', background: C.panel, ...style }}>{children}</div>
);

export const Arrow = ({ label, color = C.muted }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 150, color }}>
    <div style={{ fontSize: 22, marginBottom: 6, textAlign: 'center' }}>{label}</div>
    <div style={{ fontSize: 44, lineHeight: 1 }}>⟶</div>
  </div>
);

export const Footnote = ({ children, at = 0 }) => (
  <Appear at={at} style={{ position: 'absolute', left: 110, bottom: 50, fontSize: 22, color: C.muted }}>
    {children}
  </Appear>
);

export const Tag = ({ color, children }) => (
  <span style={{ display: 'inline-block', fontSize: 20, fontWeight: 700, letterSpacing: 1, color, border: `2px solid ${color}`, borderRadius: 8, padding: '2px 10px' }}>
    {children}
  </span>
);
