import React from 'react';
import './styling/sleep-is-for-the-weak.css';

const BadgeSleepIsForTheWeak: React.FC = () => {
  return (
    <div className="badge-container-sleep-is-for-the-weak">
      <div className="explosion-sleep-is-for-the-weak">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-sleep-is-for-the-weak"></div>
        ))}
      </div>

      <div className="badge-sleep-is-for-the-weak">
        <div className="inner-ring-sleep-is-for-the-weak"></div>
        <div className="mega-shine-sleep-is-for-the-weak"></div>

        <div className="particles-sleep-is-for-the-weak">
          <div className="particle-sleep-is-for-the-weak">☕</div>
          <div className="particle-sleep-is-for-the-weak">⚡</div>
          <div className="particle-sleep-is-for-the-weak">💪</div>
          <div className="particle-sleep-is-for-the-weak">☕</div>
          <div className="particle-sleep-is-for-the-weak">⚡</div>
          <div className="particle-sleep-is-for-the-weak">💪</div>
        </div>

        <div className="trophy-container-sleep-is-for-the-weak">
          <div className="coffee-cup-sleep-is-for-the-weak">
            <div className="steam-sleep-is-for-the-weak">
              <div className="steam-line-sleep-is-for-the-weak"></div>
              <div className="steam-line-sleep-is-for-the-weak"></div>
              <div className="steam-line-sleep-is-for-the-weak"></div>
            </div>
            <div className="cup-body-sleep-is-for-the-weak">
              <div className="coffee-surface-sleep-is-for-the-weak"></div>
              <div className="energy-bolt-sleep-is-for-the-weak left"></div>
              <div className="energy-bolt-sleep-is-for-the-weak right"></div>
            </div>
            <div className="cup-handle-sleep-is-for-the-weak"></div>
            <div className="cup-saucer-sleep-is-for-the-weak"></div>
          </div>
        </div>

        <div className="big-text-sleep-is-for-the-weak">SLEEP</div>
        <div className="label-sleep-is-for-the-weak">IS WEAK!</div>
      </div>
    </div>
  );
};

export default BadgeSleepIsForTheWeak;