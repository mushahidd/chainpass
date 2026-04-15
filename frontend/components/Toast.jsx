import styles from '../styles/Toast.module.css';

export default function Toast({ notification, onClose }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓';
      case 'error':
      case 'danger':
        return '✕';
      case 'warning':
        return '!';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`${styles.toast} ${styles[notification.type]}`}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>{getIcon()}</span>
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{notification.message}</p>
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
