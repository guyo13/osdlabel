/**
 * Vitest global test setup.
 *
 * Suppresses the jsdom "Not implemented: HTMLCanvasElement.prototype.getContext"
 * warning that fires when OSD/Fabric are imported in a jsdom environment.
 * Our unit tests mock the OSD viewer and never use a real canvas, so this
 * warning is harmless noise.
 */

const originalError = console.error.bind(console);

console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('Not implemented: HTMLCanvasElement.prototype.getContext')) {
    return; // suppress
  }
  originalError(...args);
};
