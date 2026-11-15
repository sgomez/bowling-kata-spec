import type { Pin } from "@bowling/domain";
import { type Body, Circle, World } from "planck";
import { hasSettled, knockedPins, type Pose, rack } from "./knock.js";
import {
  BALL_RADIUS,
  FOUL_LINE,
  LANE_LENGTH,
  LANE_WIDTH,
  PIN_RADIUS,
} from "./lane-geometry.js";
import type { Swipe } from "./swipe.js";
import { HOOK } from "./swipe-aim.js";

// Every constant here is hand-tuned on a phone, not physically measured.
const STEP = 1 / 120;
const BALL = { density: 190, friction: 0.1, restitution: 0.4 };
const PIN = { density: 130, friction: 0.2, restitution: 0.5 };
const BALL_DAMPING = 0.05;
const PIN_DAMPING = 2.5;
const PIN_SPIN_DAMPING = 3;

export interface LaneRoll {
  step(ms: number): void;
  readonly settled: boolean;
  ball(): Pose;
  pins(): Map<Pin, Pose>;
  knocked(): Pin[];
}

const poseOf = (body: Body): Pose => {
  const { x, y } = body.getPosition();
  return { x, y, angle: body.getAngle() };
};

const offLane = ({ x, y }: { x: number; y: number }) =>
  Math.abs(x) > LANE_WIDTH / 2 + 0.3 || y > LANE_LENGTH + 0.3;

export const startRoll = (standing: readonly Pin[], swipe: Swipe): LaneRoll => {
  const world = new World({ gravity: { x: 0, y: 0 } });
  const spots = rack(standing);
  const pins = new Map(
    [...spots].map(([pin, position]) => {
      const body = world.createBody({
        type: "dynamic",
        position,
        linearDamping: PIN_DAMPING,
        angularDamping: PIN_SPIN_DAMPING,
      });
      body.createFixture(new Circle(PIN_RADIUS), PIN);
      return [pin, body] as const;
    }),
  );
  const ball = world.createBody({
    type: "dynamic",
    bullet: true,
    position: { x: swipe.release, y: FOUL_LINE },
    linearDamping: BALL_DAMPING,
  });
  const fixture = ball.createFixture(new Circle(BALL_RADIUS), BALL);
  ball.setLinearVelocity({
    x: swipe.speed * Math.sin(swipe.direction),
    y: swipe.speed * Math.cos(swipe.direction),
  });

  let gutter = false;
  let elapsed = 0;
  let pending = 0;
  let settled = false;

  const hook = () => {
    const position = ball.getPosition();
    if (!gutter && Math.abs(position.x) > LANE_WIDTH / 2) {
      gutter = true;
      fixture.setSensor(true);
      ball.setLinearVelocity({ x: 0, y: ball.getLinearVelocity().length() });
    }
    if (gutter) return;
    const v = ball.getLinearVelocity();
    const lateral = HOOK * swipe.spin * ball.getMass();
    ball.applyForceToCenter({ x: v.y * lateral, y: -v.x * lateral });
  };

  const speeds = () =>
    [ball, ...pins.values()].map((body) =>
      offLane(body.getPosition()) ? 0 : body.getLinearVelocity().length(),
    );

  return {
    step(ms) {
      if (settled) return;
      pending += Math.min(ms, 100) / 1000;
      while (pending >= STEP) {
        hook();
        world.step(STEP);
        pending -= STEP;
        elapsed += STEP * 1000;
      }
      settled = hasSettled(speeds(), elapsed);
    },
    get settled() {
      return settled;
    },
    ball: () => poseOf(ball),
    pins: () => new Map([...pins].map(([pin, body]) => [pin, poseOf(body)])),
    knocked() {
      return knockedPins(spots, this.pins());
    },
  };
};
