import { useState, useEffect } from 'react';
import { useNotification } from '../utils/NotificationContext';
import Toast from './Toast';
import styles from '../styles/Toast.module.css';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();
  const [removingIds, setRemovingIds] = useState(new Set());

  const handleClose = (id) => {
    setRemovingIds(prev => new Set([...prev, id]));
    setTimeout(() => {
      removeNotification(id);
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  return (
    <div className={styles.toastContainer}>
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={removingIds.has(notification.id) ? 'removing' : ''}
        >
          <Toast
            notification={notification}
            onClose={() => handleClose(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
