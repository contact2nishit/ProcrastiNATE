import React from 'react';
import './styling/redemption.css';

const BadgeRedemption: React.FC = () => {
  return (
    <div className="badge-container-redemption">
      <div className="explosion-redemption">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="explosion-particle-redemption"></div>
        ))}
      </div>

      <div className="badge-redemption">
        <div className="inner-ring-redemption"></div>
        <div className="mega-shine-redemption"></div>

        <div className="particles-redemption">
          <div className="particle-redemption">🔥</div>
          <div className="particle-redemption">🦅</div>
          <div className="particle-redemption">⭐</div>
          <div className="particle-redemption">🔥</div>
          <div className="particle-redemption">🦅</div>
          <div className="particle-redemption">⭐</div>
        </div>

        <div className="phoenix-container-redemption">
          <div className="phoenix-redemption">
            <div className="phoenix-body-redemption">
              <div className="phoenix-head-redemption">
                <div className="phoenix-beak-redemption"></div>
                <div className="phoenix-eye-redemption"></div>
              </div>
              <div className="phoenix-chest-redemption"></div>
            </div>
            <div className="phoenix-wings-redemption">
              <div className="wing-redemption wing-left-redemption">
                <div className="feather-redemption feather-1-redemption"></div>
                <div className="feather-redemption feather-2-redemption"></div>
                <div className="feather-redemption feather-3-redemption"></div>
              </div>
              <div className="wing-redemption wing-right-redemption">
                <div className="feather-redemption feather-1-redemption"></div>
                <div className="feather-redemption feather-2-redemption"></div>
                <div className="feather-redemption feather-3-redemption"></div>
              </div>
            </div>
            <div className="phoenix-tail-redemption">
              <div className="tail-feather-redemption tail-1-redemption"></div>
              <div className="tail-feather-redemption tail-2-redemption"></div>
              <div className="tail-feather-redemption tail-3-redemption"></div>
            </div>
            <div className="flames-redemption">
              <div className="flame-redemption flame-big-redemption"></div>
              <div className="flame-redemption flame-medium-redemption"></div>
              <div className="flame-redemption flame-small-redemption"></div>
            </div>
          </div>
        </div>

        <div className="big-text-redemption">REDEMPTION</div>
        <div className="label-redemption">REBORN!</div>
      </div>
    </div>
  );
};

export default BadgeRedemption;