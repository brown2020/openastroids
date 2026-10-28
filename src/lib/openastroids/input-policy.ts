const SCROLL_KEYS = new Set(["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
const ACTIVATOR_KEYS = new Set(["Space", "Enter"]);
const REPEAT_LOCKED_KEYS = new Set(["KeyP", "ShiftLeft", "ShiftRight", "Enter"]);

/** Space and arrows scroll the page. Leave them alone when a control is focused. */
export function shouldPreventGameKeyDefault(code: string, interactive: boolean): boolean {
  return SCROLL_KEYS.has(code) && !interactive;
}

/**
 * Enter and Space belong to the focused button or link.
 * Key-repeat must not toggle pause, queue hyperspace, or restart.
 */
export function shouldIgnoreGameAction(code: string, repeat: boolean, interactive: boolean): boolean {
  if (interactive && ACTIVATOR_KEYS.has(code)) return true;
  if (repeat && REPEAT_LOCKED_KEYS.has(code)) return true;
  return false;
}

/** Left and right touch holds are independent; releasing one keeps the other. */
export function touchRotateDir(left: boolean, right: boolean): -1 | 0 | 1 {
  if (left === right) return 0;
  return left ? -1 : 1;
}
