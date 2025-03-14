export function isWebShareSupported(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' && 
    navigator.share && 
    navigator.canShare
  );
}

export function isMobileDevice(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}