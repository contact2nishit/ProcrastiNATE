import React from 'react';
import './styling/weekend-warrior.css';

const BadgeWeekendWarrior: React.FC = () => {
  return (
    <div className="badge-container-weekend-warrior">
      <div className="explosion-weekend-warrior">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-weekend-warrior"></div>
        ))}
      </div>

      <div className="badge-weekend-warrior">
        <div className="inner-ring-weekend-warrior"></div>
        <div className="mega-shine-weekend-warrior"></div>

        <div className="particles-weekend-warrior">
          <div className="particle-weekend-warrior">⚔️</div>
          <div className="particle-weekend-warrior">🛡️</div>
          <div className="particle-weekend-warrior">⚡</div>
          <div className="particle-weekend-warrior">⚔️</div>
          <div className="particle-weekend-warrior">🛡️</div>
          <div className="particle-weekend-warrior">⚡</div>
        </div>

        <div className="sword-container-weekend-warrior">
          <div className="sword-weekend-warrior">
            <div className="sword-blade-weekend-warrior"></div>
            <div className="sword-guard-weekend-warrior"></div>
            <div className="sword-handle-weekend-warrior"></div>
            <div className="sword-pommel-weekend-warrior"></div>
          </div>
        </div>

        <div className="big-text-weekend-warrior">WEEKEND</div>
        <div className="label-weekend-warrior">WARRIOR!</div>
      </div>
    </div>
  );
};

export default BadgeWeekendWarrior;