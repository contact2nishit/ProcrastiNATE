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

        <div className="trophy-container-focus-beast">
          <div className="trophy-focus-beast">
            <div className="trophy-cup-focus-beast">
              <div className="trophy-handle-focus-beast left"></div>
              <div className="trophy-handle-focus-beast right"></div>
            </div>
            <div className="trophy-base-focus-beast"></div>
            <div className="trophy-bottom-focus-beast"></div>
          </div>
        </div>

        <div className="big-text-focus-beast">FOCUS</div>
        <div className="label-focus-beast">BEAST!</div>
      </div>
    </div>
  );
};

export default BadgeFocusBeast;