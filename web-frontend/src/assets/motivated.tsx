import React from 'react';
import './styling/motivated.css';

const BadgeMotivated: React.FC = () => {
  return (
    <div className="badge-container-motivated">
      <div className="explosion-motivated">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-motivated"></div>
        ))}
      </div>

      <div className="badge-motivated">
        <div className="inner-ring-motivated"></div>
        <div className="mega-shine-motivated"></div>

        <div className="particles-motivated">
          <div className="particle-motivated">🌟</div>
          <div className="particle-motivated">🚀</div>
          <div className="particle-motivated">💫</div>
          <div className="particle-motivated">🌟</div>
          <div className="particle-motivated">🚀</div>
          <div className="particle-motivated">💫</div>
        </div>

        <div className="rocket-container-motivated">
          <div className="rocket-motivated">
            <div className="rocket-nose-motivated"></div>
            <div className="rocket-body-motivated">
              <div className="rocket-window-motivated"></div>
              <div className="rocket-stripe-motivated"></div>
            </div>
            <div className="rocket-fins-motivated">
              <div className="fin-motivated fin-left-motivated"></div>
              <div className="fin-motivated fin-right-motivated"></div>
            </div>
            <div className="rocket-flames-motivated">
              <div className="flame-motivated flame-1-motivated"></div>
              <div className="flame-motivated flame-2-motivated"></div>
              <div className="flame-motivated flame-3-motivated"></div>
            </div>
          </div>
        </div>

        <div className="big-text-motivated">MOTIVATED</div>
        <div className="label-motivated">BLAST OFF!</div>
      </div>
    </div>
  );
};

export default BadgeMotivated;