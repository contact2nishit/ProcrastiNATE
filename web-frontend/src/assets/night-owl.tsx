import React from 'react';
import './styling/night-owl.css';

const BadgeNightOwl: React.FC = () => {
  return (
    <div className="badge-container-night-owl">
      <div className="explosion-night-owl">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-night-owl"></div>
        ))}
      </div>

      <div className="badge-night-owl">
        <div className="inner-ring-night-owl"></div>
        <div className="mega-shine-night-owl"></div>

        <div className="particles-night-owl">
          <div className="particle-night-owl">🌙</div>
          <div className="particle-night-owl">⭐</div>
          <div className="particle-night-owl">🦉</div>
          <div className="particle-night-owl">🌙</div>
          <div className="particle-night-owl">⭐</div>
          <div className="particle-night-owl">🦉</div>
        </div>

        <div className="owl-container-night-owl">
          <div className="owl-night-owl">
            <div className="owl-head-night-owl">
              <div className="owl-eyes-night-owl">
                <div className="owl-eye-night-owl left-eye">
                  <div className="owl-pupil-night-owl"></div>
                </div>
                <div className="owl-eye-night-owl right-eye">
                  <div className="owl-pupil-night-owl"></div>
                </div>
              </div>
              <div className="owl-beak-night-owl"></div>
              <div className="owl-tufts-night-owl">
                <div className="owl-tuft-night-owl left-tuft"></div>
                <div className="owl-tuft-night-owl right-tuft"></div>
              </div>
            </div>
            <div className="owl-body-night-owl">
              <div className="owl-wing-night-owl left-wing"></div>
              <div className="owl-wing-night-owl right-wing"></div>
              <div className="owl-chest-night-owl"></div>
            </div>
          </div>
        </div>

        <div className="big-text-night-owl">NIGHT</div>
        <div className="label-night-owl">OWL!</div>
      </div>
    </div>
  );
};

export default BadgeNightOwl;