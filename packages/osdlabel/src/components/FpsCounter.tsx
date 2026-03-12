import type { Component } from 'solid-js';
import { createSignal, onCleanup, onMount } from 'solid-js';

const FpsCounter: Component = () => {
  const [fps, setFps] = createSignal(0);

  onMount(() => {
    let frameId: number;
    let frames = 0;
    let lastTime = performance.now();

    const loop = (time: number) => {
      frames++;
      if (time - lastTime >= 1000) {
        setFps(Math.round((frames * 1000) / (time - lastTime)));
        frames = 0;
        lastTime = time;
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    onCleanup(() => {
      cancelAnimationFrame(frameId);
    });
  });

  return (
    <span data-testid="status-fps" style={{ 'margin-left': 'auto' }}>
      FPS: <strong style={{ color: '#fff' }}>{fps()}</strong>
    </span>
  );
};

export default FpsCounter;
