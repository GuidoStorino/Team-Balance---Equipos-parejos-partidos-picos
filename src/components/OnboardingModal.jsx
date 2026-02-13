import { useState } from 'react';
import './OnboardingModal.css';

function OnboardingModal({ onComplete, t }) {
  const [name, setName] = useState('');
  const [velocidad, setVelocidad] = useState(5);
  const [defensa, setDefensa] = useState(5);
  const [pase, setPase] = useState(5);
  const [gambeta, setGambeta] = useState(5);
  const [pegada, setPegada] = useState(5);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  const skills = [
    { key: 'velocidad', label: t.skills.velocidad, value: velocidad, setter: setVelocidad },
    { key: 'defensa',   label: t.skills.defensa,   value: defensa,   setter: setDefensa   },
    { key: 'pase',      label: t.skills.pase,       value: pase,      setter: setPase      },
    { key: 'gambeta',   label: t.skills.gambeta,    value: gambeta,   setter: setGambeta   },
    { key: 'pegada',    label: t.skills.pegada,     value: pegada,    setter: setPegada    },
  ];

  const total = velocidad + defensa + pase + gambeta + pegada;

  const handleNext = () => {
    if (!name.trim()) { setError(t.enterName); return; }
    setError('');
    setStep(2);
  };

  const handleComplete = () => {
    onComplete({ name: name.trim(), velocidad, defensa, pase, gambeta, pegada });
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="onboarding-ball">⚽</div>
          <h2>{t.welcomeTitle}</h2>
          <p>{t.welcomeSubtitle}</p>
        </div>

        {step === 1 && (
          <div className="onboarding-step">
            <div className="step-indicator">
              <div className="step active">1</div>
              <div className="step-line"></div>
              <div className="step">2</div>
            </div>
            <h3>{t.whatsYourName}</h3>
            <div className="onboarding-input-group">
              <input
                type="text" value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder={t.yourNamePlaceholder}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
              {error && <span className="onboarding-error">{error}</span>}
            </div>
            <button className="btn-onboarding" onClick={handleNext}>{t.next}</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <div className="step-indicator">
              <div className="step done">✓</div>
              <div className="step-line active"></div>
              <div className="step active">2</div>
            </div>
            <h3>{t.yourSkills} <span className="player-name-highlight">{name}</span>?</h3>
            <p className="step-subtitle">{t.beHonest}</p>

            <div className="onboarding-skills">
              {skills.map(skill => (
                <div key={skill.key} className="onboarding-skill">
                  <div className="onboarding-skill-header">
                    <label>{skill.label}</label>
                    <span className="onboarding-skill-value">{skill.value}</span>
                  </div>
                  <input type="range" min="1" max="10" value={skill.value}
                    onChange={(e) => skill.setter(Number(e.target.value))} />
                  <div className="range-labels">
                    <span>{t.bad}</span>
                    <span>{t.crack}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="onboarding-total">
              <span>{t.totalScore}</span>
              <span className="total-num">{total}/50</span>
            </div>

            <div className="onboarding-actions">
              <button className="btn-onboarding-secondary" onClick={() => setStep(1)}>{t.back2}</button>
              <button className="btn-onboarding" onClick={handleComplete}>{t.letsPlay}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingModal;
