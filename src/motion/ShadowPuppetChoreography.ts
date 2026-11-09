/**
 * Deterministic side-view shadow-puppet walking. No React/Remotion dependency.
 *
 * Coordinates: actor-local +x is the face/toe direction; +y is down.
 * The ground/sole baseline is y=0. dirScale is the outer facing sign (+1/-1),
 * while scale is the positive outer SVG scale (normally 1.3).
 *
 * Render torso/head/arms at translate(0,-hipLift); render returned legs outside
 * that lifted group. Do NOT lift the entire actor, or the planted feet will float.
 * Front/back name the SVG foreground/background layers, not the leading foot.
 */
export type Point = Readonly<{x: number; y: number}>;

export type TwoBoneIKResult = Readonly<{
  joint: Point;
  end: Point;
  requestedEnd: Point;
  clamped: boolean;
  distance: number;
}>;

const finite = (value: number | undefined, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const smooth = (value: number): number => {
  const u = clamp(value, 0, 1);
  return u * u * (3 - 2 * u);
};
const EPS = 0.00001;

/**
 * Two-link IK, with the end clamped to the reachable annulus.
 * bendSign=+1 bends toward local +x for a target directly below the root.
 * The returned end must be used when drawing a clamped arm/hand.
 */
export function solveTwoBoneIK(
  root: Point,
  target: Point,
  len1: number,
  len2: number,
  bendSign = 1,
): TwoBoneIKResult {
  const a = Math.max(0.001, finite(len1, 1));
  const b = Math.max(0.001, finite(len2, 1));
  const dx = finite(target.x, root.x) - root.x;
  const dy = finite(target.y, root.y) - root.y;
  const requestedDistance = Math.hypot(dx, dy);
  const maxDistance = Math.max(0.001, a + b - EPS);
  const minDistance = Math.min(maxDistance, Math.abs(a - b) + EPS);
  const distance = clamp(requestedDistance, minDistance, maxDistance);
  const ux = requestedDistance > EPS ? dx / requestedDistance : 0;
  const uy = requestedDistance > EPS ? dy / requestedDistance : 1;
  const end = {x: root.x + ux * distance, y: root.y + uy * distance};
  const along = (a * a - b * b + distance * distance) / (2 * distance);
  const side = Math.sqrt(Math.max(0, a * a - along * along));
  const bend = bendSign < 0 ? -1 : 1;
  return {
    joint: {
      x: root.x + ux * along + uy * side * bend,
      y: root.y + uy * along - ux * side * bend,
    },
    end,
    requestedEnd: {x: root.x + dx, y: root.y + dy},
    clamped: Math.abs(distance - requestedDistance) > 0.0001,
    distance,
  };
}

export type PuppetWalkInput = Readonly<{
  t: number;
  start: number;
  end: number;
  xFrom: number;
  xTo: number;
  /** One step = one alternating foot swing, not a complete two-foot cycle. */
  steps?: number;
  /** Facing sign in world space, separate from the positive actor scale. */
  dirScale?: number;
  scale?: number;
  beatSec?: number;
  hipY?: number;
  upperLeg?: number;
  lowerLeg?: number;
  footHeight?: number;
  stepHeight?: number;
  hipLift?: number;
  maxStride?: number;
  armAmplitude?: number;
  leanAmplitude?: number;
  toeLiftAngle?: number;
  /**
   * Auto derives backward walking from world travel versus facing.
   * An explicit value selects body/arm intent; the world path is still xFrom→xTo.
   * directionMismatch reports an explicit intent that contradicts that path.
   */
  direction?: "auto" | "forward" | "backward";
}>;

export type PuppetLegPose = Readonly<{
  hip: Point;
  knee: Point;
  ankle: Point;
  /** Neutral shoe sole anchor. Draw the shoe around ankle, with footRotate. */
  foot: Point;
  footRotate: number;
  planted: boolean;
  swingPhase: number | null;
  /** Ideal fixed world-space sole x; useful when checking for foot sliding. */
  worldFootX: number;
  reachable: boolean;
}>;

export type PuppetWalkPose = Readonly<{
  x: number;
  hip: Point;
  hipLift: number;
  bodyLean: number;
  legBack: PuppetLegPose;
  legFront: PuppetLegPose;
  armSwing: Readonly<{front: number; back: number}>;
  /** Fraction through the current single step, in [0,1]. */
  phase: number;
  cyclePhase: number;
  progress: number;
  stepIndex: number;
  steps: number;
  requestedSteps: number;
  stepSeconds: number;
  beats: number;
  beatPhase: number;
  moving: boolean;
  localDirection: 1 | -1;
  directionMismatch: boolean;
  reachClamped: boolean;
}>;

/**
 * Continuous walk with alternating world-anchored support feet.
 *
 * Body x advances one stride during each foot swing. That foot travels two
 * strides using smoothstep while the other remains at its last world anchor.
 * Sole y never passes below the local ground. The half-stride initial/final
 * stance is deliberately retained outside the interval: no endpoint pose jump.
 *
 * Steps automatically increase if the requested distance exceeds maxStride.
 * Defaults: hipY=-82, legs=60/58, actor scale=1.3, BPM=112.91.
 */
export function shadowPuppetWalk(input: PuppetWalkInput): PuppetWalkPose {
  const start = finite(input.start, 0);
  const end = finite(input.end, start);
  const t = finite(input.t, start);
  const duration = Math.max(0, end - start);
  const from = finite(input.xFrom, 0);
  const to = finite(input.xTo, from);
  const distance = to - from;
  const scale = Math.max(0.001, Math.abs(finite(input.scale, 1.3)));
  const face = finite(input.dirScale, 1) < 0 ? -1 : 1;
  const beatSec = Math.max(0.001, finite(input.beatSec, 60 / 112.91));
  const hipY = -Math.max(1, Math.abs(finite(input.hipY, -82)));
  const upperLeg = Math.max(1, finite(input.upperLeg, 60));
  const lowerLeg = Math.max(1, finite(input.lowerLeg, 58));
  const footHeight = Math.max(0, finite(input.footHeight, 7));
  const liftAmplitude = Math.max(0, finite(input.hipLift, 2.7));
  const stepHeight = Math.max(0, finite(input.stepHeight, 13));
  const armAmplitude = Math.max(0, finite(input.armAmplitude, 14));
  const leanAmplitude = Math.max(0, finite(input.leanAmplitude, 3.5));
  const toeLiftAngle = clamp(Math.abs(finite(input.toeLiftAngle, 11)), 0, 24);
  const requestedSteps = Math.max(
    1,
    Math.round(Math.abs(finite(input.steps, Math.round(duration / beatSec)))),
  );

  // 0.61 safely bounds the relative foot x for the cubic swing below.
  const worstVertical = Math.abs(hipY) + liftAmplitude - footHeight;
  const maxReach = upperLeg + lowerLeg - 0.01;
  const horizontalReach = Math.sqrt(Math.max(0, maxReach * maxReach -
    worstVertical * worstVertical));
  const naturalStride = Math.max(1, finite(input.maxStride, Math.abs(hipY) * 1.35));
  const safeStride = Math.max(1, Math.min(naturalStride, horizontalReach / 0.61));
  const fittedSteps = Math.max(1, Math.ceil(Math.abs(distance) / (safeStride * scale)));
  const steps = Math.max(requestedSteps, fittedSteps);
  const staticMove = Math.abs(distance) < EPS || duration <= EPS;
  const progress = duration > EPS ? clamp((t - start) / duration, 0, 1) :
    (t < start ? 0 : 1);
  const q = progress * steps;
  const atEnd = progress >= 1;
  const stepIndex = atEnd ? steps - 1 : Math.floor(q);
  const phase = atEnd ? 1 : q - stepIndex;
  const active = !staticMove && t >= start && t < end;
  const stride = staticMove ? 0 : distance / steps;
  const x = staticMove ? (progress >= 1 ? to : from) : from + stride * q;

  const physicalDirection = distance * face < 0 ? -1 : 1;
  const intentDirection = input.direction === "backward" ? -1 :
    input.direction === "forward" ? 1 : physicalDirection;
  const directionMismatch = !staticMove && input.direction !== undefined &&
    input.direction !== "auto" && intentDirection !== physicalDirection;

  // Anticipate the first step and settle the last without a torso/arm jump.
  const envelope = active
    ? smooth(Math.min(1, q / 0.35, (steps - q) / 0.35))
    : 0;
  const hipLift = active ? liftAmplitude * Math.pow(Math.sin(Math.PI * phase), 2) : 0;
  const hip = {x: 0, y: hipY - hipLift};
  const bodyLean = leanAmplitude * intentDirection * envelope;
  const armFront = active
    ? -armAmplitude * intentDirection * Math.cos(Math.PI * q) * envelope
    : 0;

  const leg = (parity: 0 | 1): PuppetLegPose => {
    if (staticMove) {
      const footX = parity === 0 ? -8 : 8;
      const ankle = {x: footX, y: -footHeight};
      const ik = solveTwoBoneIK(hip, ankle, upperLeg, lowerLeg, 1);
      return {
        hip,
        knee: ik.joint,
        ankle: ik.end,
        foot: {x: ik.end.x, y: Math.min(0, ik.end.y + footHeight)},
        footRotate: 0,
        planted: true,
        swingPhase: null,
        worldFootX: x + footX * scale * face,
        reachable: !ik.clamped,
      };
    }

    const swinging = active && stepIndex % 2 === parity;
    let worldFootX: number;
    let footLift = 0;
    let footRotate = 0;

    if (swinging) {
      // From the previous contact to the next: support foot stays untouched.
      worldFootX = from + (stepIndex - 0.5 + 2 * smooth(phase)) * stride;
      const sine = Math.max(0, Math.sin(Math.PI * phase));
      footRotate = -toeLiftAngle * sine * (intentDirection < 0 ? 0.72 : 1);
      // Reserve clearance for a 28px shoe rotated around the ankle.
      const rotationClearance = 28 * Math.abs(Math.sin(footRotate * Math.PI / 180));
      footLift = Math.max(stepHeight * Math.pow(sine, 1.22), rotationClearance);
    } else {
      const completed = atEnd ? steps : Math.floor(q);
      let lastTouchdown = completed - 1;
      if (lastTouchdown % 2 !== parity) lastTouchdown -= 1;
      worldFootX = lastTouchdown >= 0
        ? from + (lastTouchdown + 1.5) * stride
        : from + (parity === 0 ? -0.5 : 0.5) * stride;
    }

    const requestedAnkle = {
      x: (worldFootX - x) / (scale * face),
      y: -footHeight - footLift,
    };
    const ik = solveTwoBoneIK(hip, requestedAnkle, upperLeg, lowerLeg, 1);
    return {
      hip,
      knee: ik.joint,
      ankle: ik.end,
      foot: {x: ik.end.x, y: Math.min(0, ik.end.y + footHeight)},
      footRotate,
      planted: !swinging || phase <= EPS || phase >= 1 - EPS,
      swingPhase: swinging ? phase : null,
      worldFootX,
      reachable: !ik.clamped,
    };
  };

  const legFront = leg(0);
  const legBack = leg(1);
  const beats = Math.max(0, (t - start) / beatSec);
  return {
    x,
    hip,
    hipLift,
    bodyLean,
    legBack,
    legFront,
    armSwing: {front: armFront, back: -armFront},
    phase,
    cyclePhase: staticMove ? 0 : (q % 2) / 2,
    progress,
    stepIndex,
    steps,
    requestedSteps,
    stepSeconds: duration / steps,
    beats,
    beatPhase: beats - Math.floor(beats),
    moving: active,
    localDirection: intentDirection,
    directionMismatch,
    reachClamped: !legFront.reachable || !legBack.reachable,
  };
}

/** Descriptive alias for callers that prefer a get-pose name. */
export const getShadowPuppetWalk = shadowPuppetWalk;
