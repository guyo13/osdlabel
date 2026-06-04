import { useState, useEffect } from 'react';

export default function FpsCounter() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
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

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <span data-testid="status-fps" style={{ marginLeft: 'auto' }}>
      FPS: <strong style={{ color: '#fff' }}>{fps}</strong>
    </span>
  );
}
