import React from 'react';
import './styling/grinder-expert.css';

const BadgeGrinderExpert: React.FC = () => {
  return (
    <div className="badge-container-grinder-expert">
      <div className="explosion-grinder-expert">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-grinder-expert"></div>
        ))}
      </div>

      <div className="badge-grinder-expert">
        <div className="inner-ring-grinder-expert"></div>
        <div className="mega-shine-grinder-expert"></div>

        <div className="particles-grinder-expert">
          <div className="particle-grinder-expert">☕</div>
          <div className="particle-grinder-expert">🫘</div>
          <div className="particle-grinder-expert">💨</div>
          <div className="particle-grinder-expert">☕</div>
          <div className="particle-grinder-expert">🫘</div>
          <div className="particle-grinder-expert">💨</div>
        </div>

        <div className="grinder-container-grinder-expert">
          <div className="grinder-grinder-expert">
            <div className="grinder-top-grinder-expert">
              <div className="grinder-handle-grinder-expert"></div>
              <div className="grinder-lid-grinder-expert"></div>
            </div>
            <div className="grinder-body-grinder-expert">
              <div className="grinder-window-grinder-expert">
                <div className="coffee-bean-grinder-expert bean-1-grinder-expert"></div>
                <div className="coffee-bean-grinder-expert bean-2-grinder-expert"></div>
                <div className="coffee-bean-grinder-expert bean-3-grinder-expert"></div>
              </div>
            </div>
            <div className="grinder-base-grinder-expert"></div>
            <div className="steam-grinder-expert">
              <div className="steam-puff-grinder-expert puff-1-grinder-expert"></div>
              <div className="steam-puff-grinder-expert puff-2-grinder-expert"></div>
              <div className="steam-puff-grinder-expert puff-3-grinder-expert"></div>
            </div>
          </div>
        </div>

        <div className="big-text-grinder-expert">GRINDER</div>
        <div className="label-grinder-expert">EXPERT!</div>
      </div>
    </div>
  );
};

export default BadgeGrinderExpert;