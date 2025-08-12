import React from 'react';
import './styling/early-bird.css';

const BadgeEarlyBird: React.FC = () => {
  return (
    <div className="badge-container-early-bird">
      <div className="explosion-early-bird">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-early-bird"></div>
        ))}
      </div>

      <div className="badge-early-bird">
        <div className="inner-ring-early-bird"></div>
        <div className="mega-shine-early-bird"></div>

        <div className="particles-early-bird">
          <div className="particle-early-bird">🌅</div>
          <div className="particle-early-bird">🐦</div>
          <div className="particle-early-bird">⏰</div>
          <div className="particle-early-bird">🌅</div>
          <div className="particle-early-bird">🐦</div>
          <div className="particle-early-bird">⏰</div>
        </div>

        <div className="sunrise-container-early-bird">
          <div className="sunrise-scene-early-bird">
            <div className="sun-early-bird">
              <div className="sun-core-early-bird">8</div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
              <div className="sun-ray-early-bird"></div>
            </div>
            <div className="horizon-early-bird">
              <div className="mountain-early-bird left"></div>
              <div className="mountain-early-bird center"></div>
              <div className="mountain-early-bird right"></div>
            </div>
            <div className="bird-silhouette-early-bird">
              <div className="bird-body-early-bird"></div>
              <div className="bird-wing-early-bird left"></div>
              <div className="bird-wing-early-bird right"></div>
              <div className="bird-tail-early-bird"></div>
            </div>
            <div className="clouds-early-bird">
              <div className="cloud-early-bird small"></div>
              <div className="cloud-early-bird medium"></div>
              <div className="cloud-early-bird large"></div>
            </div>
            <div className="dawn-glow-early-bird">
              <div className="glow-ring-early-bird outer"></div>
              <div className="glow-ring-early-bird middle"></div>
              <div className="glow-ring-early-bird inner"></div>
            </div>
            <div className="time-sparkles-early-bird">
              <div className="sparkle-early-bird"></div>
              <div className="sparkle-early-bird"></div>
              <div className="sparkle-early-bird"></div>
              <div className="sparkle-early-bird"></div>
            </div>
          </div>
        </div>

        <div className="big-text-early-bird">EARLY</div>
        <div className="label-early-bird">BIRD</div>
      </div>
    </div>
  );
};

export default BadgeEarlyBird;