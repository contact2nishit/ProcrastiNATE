import React from 'react';
import './styling/getting-the-hang-of-it.css';

const BadgeHangOfIt: React.FC = () => {
  return (
    <div className="badge-container-hang-of-it">
      <div className="explosion-hang-of-it">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-hang-of-it"></div>
        ))}
      </div>

      <div className="badge-hang-of-it">
        <div className="inner-ring-hang-of-it"></div>
        <div className="mega-shine-hang-of-it"></div>

        <div className="particles-hang-of-it">
          <div className="particle-hang-of-it">🔥</div>
          <div className="particle-hang-of-it">⚡</div>
          <div className="particle-hang-of-it">💪</div>
          <div className="particle-hang-of-it">🔥</div>
          <div className="particle-hang-of-it">⚡</div>
          <div className="particle-hang-of-it">💪</div>
        </div>

        <div className="trophy-container-hang-of-it">
          <div className="trophy-hang-of-it">
            <div className="trophy-handle-hang-of-it"></div>
            <div className="trophy-cup-hang-of-it"></div>
            <div className="trophy-bottom-hang-of-it"></div>
            <div className="trophy-base-hang-of-it"></div>
          </div>
        </div>

        <div className="big-text-hang-of-it">HANG</div>
        <div className="label-hang-of-it">OF IT!</div>
      </div>
    </div>
  );
};

export default BadgeHangOfIt;