import React from 'react';
import './styling/legend-of-grinding.css';

const BadgeLegendOfGrinding: React.FC = () => {
  return (
    <div className="badge-container-legend-of-grinding">
      <div className="explosion-legend-of-grinding">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="explosion-particle-legend-of-grinding"></div>
        ))}
      </div>

      <div className="badge-legend-of-grinding">
        <div className="inner-ring-legend-of-grinding"></div>
        <div className="mega-shine-legend-of-grinding"></div>

        <div className="particles-legend-of-grinding">
          <div className="particle-legend-of-grinding">💥</div>
          <div className="particle-legend-of-grinding">⚡</div>
          <div className="particle-legend-of-grinding">🔥</div>
          <div className="particle-legend-of-grinding">💥</div>
          <div className="particle-legend-of-grinding">⚡</div>
          <div className="particle-legend-of-grinding">🔥</div>
        </div>

        <div className="anvil-container-legend-of-grinding">
          <div className="anvil-legend-of-grinding">
            <div className="anvil-top-legend-of-grinding"></div>
            <div className="anvil-body-legend-of-grinding"></div>
            <div className="anvil-base-legend-of-grinding"></div>
            <div className="hammer-legend-of-grinding">
              <div className="hammer-head-legend-of-grinding"></div>
              <div className="hammer-handle-legend-of-grinding"></div>
            </div>
            <div className="sparks-legend-of-grinding">
              <div className="spark-legend-of-grinding"></div>
              <div className="spark-legend-of-grinding"></div>
              <div className="spark-legend-of-grinding"></div>
              <div className="spark-legend-of-grinding"></div>
            </div>
          </div>
        </div>

        <div className="big-text-legend-of-grinding">LEGEND</div>
        <div className="label-legend-of-grinding">OF GRINDING!</div>
      </div>
    </div>
  );
};

export default BadgeLegendOfGrinding;