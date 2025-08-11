import React from 'react';
import './styling/seven-day-streak.css';

const BadgeSevenDayStreak: React.FC = () => {
  return (
    <div className="badge-container-seven-day-streak">
      <div className="explosion-seven-day-streak">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-seven-day-streak"></div>
        ))}
      </div>

      <div className="badge-seven-day-streak">
        <div className="inner-ring-seven-day-streak"></div>
        <div className="mega-shine-seven-day-streak"></div>

        <div className="particles-seven-day-streak">
          <div className="particle-seven-day-streak">🔥</div>
          <div className="particle-seven-day-streak">📅</div>
          <div className="particle-seven-day-streak">✨</div>
          <div className="particle-seven-day-streak">🔥</div>
          <div className="particle-seven-day-streak">📅</div>
          <div className="particle-seven-day-streak">✨</div>
        </div>

        <div className="trophy-container-seven-day-streak">
          <div className="trophy-seven-day-streak">
            <div className="trophy-cup-seven-day-streak">
              <div className="trophy-handle-seven-day-streak left"></div>
              <div className="trophy-handle-seven-day-streak right"></div>
            </div>
            <div className="trophy-base-seven-day-streak"></div>
            <div className="trophy-bottom-seven-day-streak"></div>
          </div>
        </div>

        <div className="big-text-seven-day-streak">7 DAY</div>
        <div className="label-seven-day-streak">STREAK!</div>
      </div>
    </div>
  );
};

export default BadgeSevenDayStreak;