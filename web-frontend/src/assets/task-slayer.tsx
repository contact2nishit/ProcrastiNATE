import React from 'react';
import './styling/task-slayer.css';

interface BadgeTaskSlayerProps {
  variant?: 1 | 2 | 3 | 4 | 5;
}

const BadgeTaskSlayer: React.FC<BadgeTaskSlayerProps> = ({ variant = 1 }) => {
  const getRunesByVariant = () => {
    switch (variant) {
      case 1: return ['⚡'];
      case 2: return ['⚡', '🗡️'];
      case 3: return ['⚡', '🗡️', '💀'];
      case 4: return ['⚡', '🗡️', '💀', '⚔️'];
      case 5: return ['⚡', '🗡️', '💀', '⚔️', '👑'];
      default: return ['⚡'];
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
    const baseClass = 'badge-task-slayer';
    return `${baseClass} variant-${variant}`;
  };

  const runes = getRunesByVariant();
  return (
    <div className="badge-container-task-slayer">
      <div className="explosion-task-slayer">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="explosion-particle-task-slayer"></div>
        ))}
      </div>

      <div className={getGlowIntensity()}>
        <div className="inner-ring-task-slayer"></div>
        <div className="mega-shine-task-slayer"></div>

        <div className="particles-task-slayer">
          <div className="particle-task-slayer">✨</div>
          <div className="particle-task-slayer">📜</div>
          <div className="particle-task-slayer">⭐</div>
          <div className="particle-task-slayer">✨</div>
          <div className="particle-task-slayer">📜</div>
          <div className="particle-task-slayer">⭐</div>
        </div>

        <div className="scroll-container-task-slayer">
          <div className="scroll-task-slayer">
            <div className="scroll-top-task-slayer"></div>
            <div className="scroll-body-task-slayer">
              {runes.map((rune, index) => (
                <div key={index} className="rune-task-slayer">{rune}</div>
              ))}
            </div>
            <div className="scroll-bottom-task-slayer"></div>
            <div className="scroll-rod-top-task-slayer"></div>
            <div className="scroll-rod-bottom-task-slayer"></div>
            <div className="roman-numeral-task-slayer">{getRomanNumeral()}</div>
          </div>
        </div>

        <div className="big-text-task-slayer">TASK</div>
        <div className="label-task-slayer">SLAYER {variant}!</div>
      </div>
    </div>
  );
};

export default BadgeTaskSlayer;