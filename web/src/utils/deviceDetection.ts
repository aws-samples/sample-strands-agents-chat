/**
 * Utility functions for device detection
 */

/**
 * Detects if the current device is a mobile device
 * @returns {boolean} True if mobile device, false otherwise
 */
export const isMobileDevice = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detects if the current device is a touch device
 * @returns {boolean} True if touch device, false otherwise
 */
export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
