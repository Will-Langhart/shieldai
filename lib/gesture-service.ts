interface GestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  threshold?: number;
  minSwipeDistance?: number;
}

class GestureService {
  private startX: number = 0;
  private startY: number = 0;
  private startTime: number = 0;
  private isTracking: boolean = false;
  private options: GestureOptions;

  constructor(options: GestureOptions = {}) {
    this.options = {
      threshold: 50,
      minSwipeDistance: 50,
      ...options
    };
  }

  attach(element: HTMLElement): void {
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  detach(element: HTMLElement): void {
    element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;

    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isTracking = true;
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTracking || event.touches.length !== 1) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;

    // Prevent default if we're tracking a significant gesture
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      event.preventDefault();
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isTracking) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    this.isTracking = false;

    // Check if it's a tap
    if (distance < (this.options.threshold || 50) && deltaTime < 300) {
      this.options.onTap?.();
      return;
    }

    // Check if it's a long press
    if (distance < (this.options.threshold || 50) && deltaTime > 500) {
      this.options.onLongPress?.();
      return;
    }

    // Check if it's a swipe
    if (distance > (this.options.minSwipeDistance || 50)) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.options.onSwipeRight?.();
        } else {
          this.options.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.options.onSwipeDown?.();
        } else {
          this.options.onSwipeUp?.();
        }
      }
    }
  }
}

// Message gesture handlers
export const createMessageGestures = (messageId: string, onDelete?: () => void, onReply?: () => void, onCopy?: () => void) => {
  return new GestureService({
    onSwipeLeft: () => {
      // Swipe left to delete
      onDelete?.();
    },
    onSwipeRight: () => {
      // Swipe right to reply
      onReply?.();
    },
    onLongPress: () => {
      // Long press to copy
      onCopy?.();
    }
  });
};

// Conversation list gesture handlers
export const createConversationGestures = (conversationId: string, onDelete?: () => void, onPin?: () => void) => {
  return new GestureService({
    onSwipeLeft: () => {
      // Swipe left to delete conversation
      onDelete?.();
    },
    onSwipeRight: () => {
      // Swipe right to pin conversation
      onPin?.();
    }
  });
};

// Sidebar gesture handlers
export const createSidebarGestures = (onToggle?: () => void) => {
  return new GestureService({
    onSwipeRight: () => {
      // Swipe right to open sidebar
      onToggle?.();
    }
  });
};

export default GestureService; 