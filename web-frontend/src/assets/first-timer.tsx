import React from 'react';
import './styling/first-timer.css';

const BadgeFirstTimer: React.FC = () => {
  return (
    <div className="badge-container-first-timer">
      <div className="explosion-first-timer">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-first-timer"></div>
        ))}
      </div>

      <div className="badge-first-timer">
        <div className="inner-ring-first-timer"></div>
        <div className="mega-shine-first-timer"></div>

        <div className="particles-first-timer">
          <div className="particle-first-timer">✨</div>
          <div className="particle-first-timer">⭐</div>
          <div className="particle-first-timer">💫</div>
          <div className="particle-first-timer">✨</div>
          <div className="particle-first-timer">⭐</div>
          <div className="particle-first-timer">💫</div>
        </div>

        <div className="trophy-container-first-timer">
          <div className="trophy-first-timer">
            <div className="trophy-cup-first-timer">
              <div className="trophy-handle-first-timer left"></div>
              <div className="trophy-handle-first-timer right"></div>
            </div>
            <div className="trophy-base-first-timer"></div>
            <div className="trophy-bottom-first-timer"></div>
          </div>
        </div>

        <div className="big-text-first-timer">FIRST!</div>
        <div className="label-first-timer">TIMER</div>
      </div>
    </div>
  );
};

export default BadgeFirstTimer;