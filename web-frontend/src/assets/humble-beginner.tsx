import React from 'react';
import './styling/humble-beginner.css';

const BadgeHumbleBeginner: React.FC = () => {
  return (
    <div className="badge-container-humble-beginner">
      <div className="explosion-humble-beginner">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="explosion-particle-humble-beginner"></div>
        ))}
      </div>

      <div className="badge-humble-beginner">
        <div className="inner-ring-humble-beginner"></div>
        <div className="mega-shine-humble-beginner"></div>

        <div className="particles-humble-beginner">
          <div className="particle-humble-beginner">🌱</div>
          <div className="particle-humble-beginner">🌿</div>
          <div className="particle-humble-beginner">🍃</div>
          <div className="particle-humble-beginner">🌱</div>
          <div className="particle-humble-beginner">🌿</div>
          <div className="particle-humble-beginner">🍃</div>
        </div>

        <div className="seedling-container-humble-beginner">
          <div className="seedling-humble-beginner">
            <div className="seedling-leaf-humble-beginner left"></div>
            <div className="seedling-leaf-humble-beginner right"></div>
            <div className="seedling-stem-humble-beginner"></div>
            <div className="seedling-pot-humble-beginner"></div>
          </div>
        </div>

        <div className="big-text-humble-beginner">LEVEL 5</div>
        <div className="label-humble-beginner">HUMBLE BEGINNER</div>
      </div>
    </div>
  );
};

export default BadgeHumbleBeginner;