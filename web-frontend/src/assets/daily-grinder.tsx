import React from 'react';
import './styling/daily-grinder.css';

const BadgeDailyGrinder: React.FC = () => {
  return (
    <div className="badge-container-daily-grinder">
      <div className="explosion-daily-grinder">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-daily-grinder"></div>
        ))}
      </div>

      <div className="badge-daily-grinder">
        <div className="inner-ring-daily-grinder"></div>
        <div className="mega-shine-daily-grinder"></div>

        <div className="particles-daily-grinder">
          <div className="particle-daily-grinder">⚙️</div>
          <div className="particle-daily-grinder">☕</div>
          <div className="particle-daily-grinder">🔥</div>
          <div className="particle-daily-grinder">⚙️</div>
          <div className="particle-daily-grinder">☕</div>
          <div className="particle-daily-grinder">🔥</div>
        </div>

        <div className="trophy-container-daily-grinder">
          <div className="grinder-machine-daily-grinder">
            <div className="grinder-top-daily-grinder">
              <div className="beans-container-daily-grinder">
                <div className="coffee-bean-daily-grinder"></div>
                <div className="coffee-bean-daily-grinder"></div>
                <div className="coffee-bean-daily-grinder"></div>
                <div className="coffee-bean-daily-grinder"></div>
                <div className="coffee-bean-daily-grinder"></div>
              </div>
            </div>
            <div className="main-gear-daily-grinder">
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-tooth-daily-grinder"></div>
              <div className="gear-center-daily-grinder">5</div>
            </div>
            <div className="side-gear-daily-grinder left">
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
            </div>
            <div className="side-gear-daily-grinder right">
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
              <div className="small-gear-tooth-daily-grinder"></div>
            </div>
            <div className="grinding-sparks-daily-grinder">
              <div className="spark-daily-grinder"></div>
              <div className="spark-daily-grinder"></div>
              <div className="spark-daily-grinder"></div>
              <div className="spark-daily-grinder"></div>
            </div>
          </div>
        </div>

        <div className="big-text-daily-grinder">DAILY</div>
        <div className="label-daily-grinder">GRINDER</div>
      </div>
    </div>
  );
};

export default BadgeDailyGrinder;