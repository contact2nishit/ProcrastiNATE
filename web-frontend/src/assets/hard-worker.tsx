import React from 'react';
import './styling/hard-worker.css';

const BadgeHardWorker: React.FC = () => {
  return (
    <div className="badge-container-hard-worker">
      <div className="explosion-hard-worker">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-hard-worker"></div>
        ))}
      </div>

      <div className="badge-hard-worker">
        <div className="inner-ring-hard-worker"></div>
        <div className="mega-shine-hard-worker"></div>

        <div className="particles-hard-worker">
          <div className="particle-hard-worker">⚙️</div>
          <div className="particle-hard-worker">🔧</div>
          <div className="particle-hard-worker">⚡</div>
          <div className="particle-hard-worker">⚙️</div>
          <div className="particle-hard-worker">🔧</div>
          <div className="particle-hard-worker">⚡</div>
        </div>

        <div className="gears-container-hard-worker">
          <div className="main-gear-hard-worker">
            <div className="gear-center-hard-worker"></div>
            <div className="gear-teeth-hard-worker">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="gear-tooth-hard-worker" style={{transform: `rotate(${i * 30}deg) translateY(-28px)`}}></div>
              ))}
            </div>
          </div>
          <div className="small-gear-hard-worker small-gear-1-hard-worker">
            <div className="gear-center-small-hard-worker"></div>
            <div className="gear-teeth-small-hard-worker">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="gear-tooth-small-hard-worker" style={{transform: `rotate(${i * 45}deg) translateY(-18px)`}}></div>
              ))}
            </div>
          </div>
          <div className="small-gear-hard-worker small-gear-2-hard-worker">
            <div className="gear-center-small-hard-worker"></div>
            <div className="gear-teeth-small-hard-worker">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="gear-tooth-small-hard-worker" style={{transform: `rotate(${i * 45}deg) translateY(-18px)`}}></div>
              ))}
            </div>
          </div>
        </div>

        <div className="big-text-hard-worker">HARD</div>
        <div className="label-hard-worker">WORKER!</div>
      </div>
    </div>
  );
};

export default BadgeHardWorker;