export const VIEWER_CONTROLS = {
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 5,
  ZOOM_STEP: 1.2,
  CONTAINER_PADDING: 100,
} as const

export const KEYBOARD_CONTROLS = {
  ESCAPE: 'Escape',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ZOOM_IN: ['+', '='],
  ZOOM_OUT: ['-'],
  RESET: '0',
} as const