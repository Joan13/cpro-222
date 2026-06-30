import { useEffect, useState } from 'react';
import Proximity from '../../../modules/proximity';

export function useProximity(isEnabled: boolean) {
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setIsNear(false);
      return;
    }

    try {
      Proximity.setProximityMonitoringEnabled(true);
    } catch (e) {
      console.warn('Failed to enable proximity sensor monitoring:', e);
    }

    const subscription = Proximity.addListener('onProximityChange', (event: { isNear: boolean }) => {
      setIsNear(event.isNear);
    });

    return () => {
      subscription.remove();
      try {
        Proximity.setProximityMonitoringEnabled(false);
      } catch (e) {
        console.warn('Failed to disable proximity sensor monitoring:', e);
      }
    };
  }, [isEnabled]);

  return isNear;
}
