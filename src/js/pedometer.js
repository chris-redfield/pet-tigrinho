/**
 * Step counting from the phone's accelerometer.
 *
 * The web has no step-counter API and no bridge to Health Connect or
 * HealthKit, so this listens to `devicemotion` while the game is open and
 * finds the bounce of each step in the acceleration. It only counts while
 * the page is open and the screen is on - it is a "count my walk now" mode,
 * not a background pedometer.
 *
 * Needs a secure context (HTTPS or localhost). iOS also needs a permission
 * prompt, which must come from a tap.
 */

/** A step is a bounce at least this far above the moving average (m/s²). */
const RISE = 1.0;
/** ...after the signal has settled back to within this of it (m/s²). */
const SETTLE = 0.3;
/** People do not take more than ~3 steps a second, so peaks closer than this are one step. */
const MIN_GAP_MS = 300;
/** If no motion data arrives within this, the device has no usable sensor. */
const NO_SENSOR_MS = 1500;

/**
 * Pure step detector: feed it acceleration magnitudes, it says which are
 * steps. A smoothed signal is compared with a slow moving average (which
 * is gravity plus the phone's tilt), with hysteresis so one bounce counts
 * once, and a minimum gap so jitter does not count twice.
 */
export function createStepDetector() {
  let smooth = null;
  let baseline = null;
  let armed = true;
  let lastStep = -Infinity;

  return function push(magnitude, timeMs) {
    if (smooth === null) { smooth = baseline = magnitude; return false; }
    smooth = smooth * 0.75 + magnitude * 0.25;
    baseline = baseline * 0.97 + magnitude * 0.03;
    const lift = smooth - baseline;

    if (armed && lift > RISE && timeMs - lastStep >= MIN_GAP_MS) {
      armed = false;
      lastStep = timeMs;
      return true;
    }
    if (!armed && lift < SETTLE) armed = true;
    return false;
  };
}

/** Whether this browser can even try (motion events exist and the page is secure). */
export function motionAvailable() {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return 'ok';
}

/**
 * Starts counting. Call from a tap: iOS shows its permission prompt here.
 *
 * @param {(steps: number) => void} onStep  called with the running total
 * @param {(reason: 'denied'|'no-sensor') => void} onFail
 * @returns {Promise<() => void>} stop function
 */
export async function startPedometer(onStep, onFail) {
  // iOS asks the user; recent Chrome has the same call but may answer
  // 'prompt' when it has nothing to ask. Only an explicit 'denied' stops us -
  // otherwise listen, and the watchdog below tells "no sensor" apart.
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    let answer;
    try { answer = await DeviceMotionEvent.requestPermission(); } catch { answer = 'denied'; }
    if (answer === 'denied') { onFail('denied'); return () => {}; }
  }

  const detect = createStepDetector();
  let steps = 0;
  let heard = false;

  function onMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x === null) return;
    heard = true;
    if (detect(Math.hypot(a.x, a.y, a.z), e.timeStamp)) onStep(++steps);
  }

  // Desktops often define the event but never fire it.
  const watchdog = setTimeout(() => { if (!heard) { stop(); onFail('no-sensor'); } }, NO_SENSOR_MS);

  // Keep the screen on while counting; the sensor stops when it sleeps.
  let wakeLock = null;
  try { wakeLock = await navigator.wakeLock?.request('screen'); } catch { /* not fatal */ }

  window.addEventListener('devicemotion', onMotion);

  function stop() {
    clearTimeout(watchdog);
    window.removeEventListener('devicemotion', onMotion);
    wakeLock?.release().catch(() => {});
    wakeLock = null;
  }
  return stop;
}
