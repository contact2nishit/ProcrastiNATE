import React from 'react';
import './styling/focus-beast.css';

const BadgeFocusBeast: React.FC = () => {
  return (
    <div className="badge-container-focus-beast">
      <div className="explosion-focus-beast">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-focus-beast"></div>
        ))}
      </div>

      <div className="badge-focus-beast">
        <div className="inner-ring-focus-beast"></div>
        <div className="mega-shine-focus-beast"></div>

        <div className="particles-focus-beast">
          <div className="particle-focus-beast">🦁</div>
          <div className="particle-focus-beast">🔥</div>
          <div className="particle-focus-beast">⚡</div>
          <div className="particle-focus-beast">🦁</div>
          <div className="particle-focus-beast">🔥</div>
          <div className="particle-focus-beast">⚡</div>
        </div>

        <div className="lion-container-focus-beast">
          <div className="lion-focus-beast">🦁</div>
        </div>

        <div className="big-text-focus-beast">FOCUS</div>
        <div className="label-focus-beast">BEAST!</div>
      </div>
    </div>
  );
};

export default BadgeFocusBeast;