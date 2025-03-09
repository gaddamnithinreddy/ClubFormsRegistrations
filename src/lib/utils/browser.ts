export function isWebShareSupported(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    'share' in navigator && 
    'canShare' in navigator
  );
}

export function isMobileDevice(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

export function isIOSDevice(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent)
  );
}

export function isSafari(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  );
}

export function supportsFileSystemAccess(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    'showOpenFilePicker' in window
  );
}

export function supportsClipboard(): boolean {
  return Boolean(
    typeof window !== 'undefined' && 
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  );
}

export function getPreferredColorScheme(): 'light' | 'dark' | null {
  if (typeof window === 'undefined') return null;
  
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  
  return null;
}