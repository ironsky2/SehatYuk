// Web Audio API offline sound synthesizer & system notification dispatcher

export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Pleasant bell chime (E5 -> A5 tone)
    const tones = [
      { freq: 659.25, time: 0, duration: 0.16 }, // E5
      { freq: 880.0, time: 0.12, duration: 0.38 } // A5
    ];

    tones.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      // Bell envelope: instant attack, exponential decay
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.3, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + duration + 0.05);
    });
  } catch (e) {
    console.warn('Web Audio notification sound error:', e);
  }
}

export async function triggerSystemNotification(title, body) {
  // 1. Play sound
  playNotificationSound();

  // 2. Device vibration
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate([200, 100, 200]);
    } catch (e) {}
  }

  // 3. Outside-app notification via ServiceWorker (shows on Android system tray & desktop notification center)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration && 'showNotification' in registration && Notification.permission === 'granted') {
        await registration.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          vibrate: [200, 100, 200],
          tag: 'sehat-yuk-alert',
          renotify: true,
          data: { url: window.location.href }
        });
        return;
      }
    } catch (err) {
      console.warn('SW showNotification failed, fallback to native Notification:', err);
    }
  }

  // 4. Fallback to standard Window Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200]
      });
    } catch (err) {
      console.warn('Standard Notification fallback failed:', err);
    }
  }
}
