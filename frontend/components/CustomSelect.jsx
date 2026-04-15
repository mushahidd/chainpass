import { useState, useRef, useEffect } from 'react';
import styles from '../styles/CustomSelect.module.css';

export default function CustomSelect({ name, value, onChange, options, disabled, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedLabel = options.find(opt => opt.value === value)?.label;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    onChange({
      target: {
        name,
        value: optValue
      }
    });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        type="button"
        disabled={disabled}
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={styles.label}>
          {selectedLabel || placeholder}
        </span>
        <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.options}>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.option} ${opt.value === value ? styles.selected : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className={styles.optionText}>{opt.label}</span>
                {opt.value === value && (
                  <svg className={styles.checkmark} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
