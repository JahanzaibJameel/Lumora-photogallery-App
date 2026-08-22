export const ACCESSIBILITY_HINTS = {
  open: 'Opens the item',
  close: 'Closes the current view',
  refresh: 'Updates the content',
  back: 'Returns to the previous screen',
  search: 'Opens the search bar',
  clear: 'Clears the current input',
  delete: 'Deletes the selected item',
  save: 'Saves changes',
  cancel: 'Cancels the current action',
  next: 'Navigates to the next item',
  previous: 'Navigates to the previous item',
  settings: 'Opens settings',
  more: 'Shows more options',
  less: 'Shows fewer options',
} as const;

export type AccessibilityHint = keyof typeof ACCESSIBILITY_HINTS | string;

export const MIN_TOUCH_TARGET = 48;

export const getAccessibilityRole = (type: 'button' | 'input' | 'text' | 'image' | 'header' | 'alert' | 'adjustable' | 'summary') => {
  return type;
};
