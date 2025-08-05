class NotificationService {
  private static instance: NotificationService;
  private registration: ServiceWorkerRegistration | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('Service Worker ready for notifications');
      } catch (error) {
        console.error('Failed to initialize service worker:', error);
      }
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  async subscribeToNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('Service Worker not available');
      return null;
    }

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('VAPID public key not configured');
        return null;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return null;
    }
  }

  async unsubscribeFromNotifications(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      return false;
    }
  }

  async scheduleDailyVerse(): Promise<void> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return;
    }

    // Schedule daily notification at 9 AM
    const now = new Date();
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      this.showDailyVerseNotification();
    }, delay);
  }

  private async showDailyVerseNotification(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      // Fetch a random Bible verse
      const response = await fetch('/api/bible/popular');
      const data = await response.json();
      
      if (data.verses && data.verses.length > 0) {
        const randomVerse = data.verses[Math.floor(Math.random() * data.verses.length)];
        
        await this.registration.showNotification('Daily Bible Verse', {
          body: `${randomVerse.reference}: "${randomVerse.text}"`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'daily-verse',
          requireInteraction: false,
          actions: [
            {
              action: 'read',
              title: 'Read More',
              icon: '/logo.png'
            }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to show daily verse notification:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (!base64String) {
      return new Uint8Array(0);
    }
    
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async isSupported(): Promise<boolean> {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}

export default NotificationService; 