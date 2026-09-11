import { useState, useEffect } from 'react';

const EVENT_NAME = 'nurseprep_exam_focus_mode_change';

export function setExamFocusMode(active: boolean) {
  try {
    sessionStorage.setItem('nurseprep_exam_focus_mode', active ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { active } }));
  } catch (e) {
    console.warn('Unable to set exam focus mode:', e);
  }
}

export function getExamFocusMode(): boolean {
  try {
    return sessionStorage.getItem('nurseprep_exam_focus_mode') === 'true';
  } catch {
    return false;
  }
}

export function useExamFocusMode(): [boolean, (active: boolean) => void] {
  const [isFocusMode, setIsFocusMode] = useState<boolean>(getExamFocusMode);

  useEffect(() => {
    const handleFocusChange = (e: any) => {
      if (e && e.detail && typeof e.detail.active === 'boolean') {
        setIsFocusMode(e.detail.active);
      } else {
        setIsFocusMode(getExamFocusMode());
      }
    };

    window.addEventListener(EVENT_NAME, handleFocusChange);
    return () => {
      window.removeEventListener(EVENT_NAME, handleFocusChange);
    };
  }, []);

  const toggle = (active: boolean) => {
    setExamFocusMode(active);
  };

  return [isFocusMode, toggle];
}
