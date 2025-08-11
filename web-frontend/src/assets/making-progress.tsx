import React from 'react';
import './styling/making-progress.css';

const BadgeMakingProgress: React.FC = () => {
  return (
    <div className="badge-container-making-progress">
      <div className="explosion-making-progress">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-making-progress"></div>
        ))}
      </div>

      <div className="badge-making-progress">
        <div className="inner-ring-making-progress"></div>
        <div className="mega-shine-making-progress"></div>

        <div className="particles-making-progress">
          <div className="particle-making-progress">🚀</div>
          <div className="particle-making-progress">💨</div>
          <div className="particle-making-progress">⭐</div>
          <div className="particle-making-progress">🚀</div>
          <div className="particle-making-progress">💨</div>
          <div className="particle-making-progress">⭐</div>
        </div>

        <div className="rocket-container-making-progress">
          <div className="rocket-making-progress">
            <div className="rocket-nose-making-progress"></div>
            <div className="rocket-body-making-progress">
              <div className="rocket-rivets-making-progress">
                <div className="rocket-rivet-making-progress"></div>
                <div className="rocket-rivet-making-progress"></div>
                <div className="rocket-rivet-making-progress"></div>
                <div className="rocket-rivet-making-progress"></div>
                <div className="rocket-rivet-making-progress"></div>
              </div>
              <div className="rocket-window-making-progress"></div>
              <div className="rocket-base-making-progress"></div>
            </div>
            <div className="rocket-fin-making-progress left"></div>
            <div className="rocket-fin-making-progress right"></div>
            <div className="rocket-flames-making-progress">
              <div className="rocket-flame-making-progress center"></div>
              <div className="rocket-flame-making-progress left"></div>
              <div className="rocket-flame-making-progress right"></div>
            </div>
          </div>
        </div>

        <div className="big-text-making-progress">LEVEL 10</div>
        <div className="label-making-progress">MAKING PROGRESS</div>
      </div>
    </div>
  );
};

export default BadgeMakingProgress;