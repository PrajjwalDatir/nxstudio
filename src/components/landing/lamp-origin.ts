/**
 * Shared handoff point between the hero's WebGL lamp and the DOM-side theme
 * toggle. The lamp has no DOM element to read a bounding rect from, so it
 * projects its own screen position here every few frames; the toggle reads
 * it at click time so the light-on reveal can expand from the lamp instead
 * of the toggle button.
 */
export const lampOrigin: { x: number | null; y: number | null } = {
  x: null,
  y: null,
};
