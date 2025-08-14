import React from 'react';

const TransitionBackground: React.FC = () => {
  return (
    <div className="transition-layer" aria-hidden>
      <div className="w-full h-full" style={{
        background: 'linear-gradient(to bottom, #FFE8A3 0%, #FFC358 35%, #FF9A32 70%, #FF7A1B 100%)'
      }} />
      {/* Flying Birds (black silhouettes) */}
      <>
      {[
        { top: '38%', delay: '0s', duration: '18s', scale: 1 },
        { top: '50%', delay: '3s', duration: '22s', scale: 1.2 },
        { top: '44%', delay: '6s', duration: '20s', scale: 0.85 },
        { top: '56%', delay: '9s', duration: '24s', scale: 1.05 },
        { top: '48%', delay: '12s', duration: '26s', scale: 0.95 },
      ].map((b,i)=> (
        <div
          key={i}
          className="transition-bird"
          style={{ top: b.top, animationDelay: b.delay, animationDuration: b.duration, ['--scale' as any]: b.scale }}
        />
      ))}
      </>
    </div>
  );
};
export default TransitionBackground;
