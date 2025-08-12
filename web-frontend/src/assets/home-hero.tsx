import React from 'react';
import './styling/home-hero.css';

interface BadgeHomeHeroProps {
  variant?: 1 | 2 | 3 | 4 | 5;
}

const BadgeHomeHero: React.FC<BadgeHomeHeroProps> = ({ variant = 1 }) => {
  const getHouseSize = () => {
    switch (variant) {
      case 1: return 'normal';
      case 2: return 'bigger';
      case 3: return 'large';
      case 4: return 'mansion';
      case 5: return 'super-mansion';
      default: return 'normal';
    }
  };


  const getRomanNumeral = () => {
    switch (variant) {
      case 1: return 'I';
      case 2: return 'II';
      case 3: return 'III';
      case 4: return 'IV';
      case 5: return 'V';
      default: return 'I';
    }
  };

  const getGlowIntensity = () => {
    const baseClass = 'badge-home-hero';
    return `${baseClass} variant-${variant}`;
  };
  return (
    <div className="badge-container-home-hero">
      <div className="explosion-home-hero">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-home-hero"></div>
        ))}
      </div>

      <div className={getGlowIntensity()}>
        <div className="mega-shine-home-hero"></div>

        <div className="particles-home-hero">
          <div className="particle-home-hero">🏠</div>
          <div className="particle-home-hero">⭐</div>
          <div className="particle-home-hero">🦸</div>
          <div className="particle-home-hero">🏠</div>
          <div className="particle-home-hero">⭐</div>
          <div className="particle-home-hero">🦸</div>
        </div>

        <div className="house-container-home-hero">
          <div className={`house-home-hero ${getHouseSize()}`}>
            <div className="house-roof-home-hero">
              <div className="chimney-home-hero"></div>
            </div>
            <div className="house-body-home-hero">
              <div className="door-home-hero">
                <div className="door-handle-home-hero"></div>
              </div>
              <div className="window-home-hero window-left-home-hero"></div>
              <div className="window-home-hero window-right-home-hero"></div>
            </div>
            <div className="hero-emblem-home-hero">H</div>
            <div className="roman-numeral-home-hero">{getRomanNumeral()}</div>
          </div>
        </div>

        <div className="big-text-home-hero">HOME</div>
        <div className="label-home-hero">HERO {variant}!</div>
      </div>
    </div>
  );
};

export default BadgeHomeHero;