import { useEffect, useRef, useState } from "react";

import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition, LadderPosition } from "~/consts/levels";
import {
	FALL_STEP,
	findGirderCrossing,
	findGirdersUnder,
	findJumpLanding,
	findNearestGirder,
	isTouchingGirder,
} from "./girderCollision";
import { findLadderAt, isWithinLadderBounds } from "./ladderCollision";
import type {
	ClimbResolution,
	Direction,
	Facing,
	HorizontalResolution,
	JumpResolution,
	MarioPosition,
	PressedKeys,
	WalkSprite,
	WorldConfig,
} from "./useMarioPhysics.types";

const MOVE_STEP = 2;
const CLIMB_STEP = 2;
// How close a girder needs to be to a ladder's own top/bottom edge to
// count as "this ladder connects here" (see resolveClimbing) — deliberately
// tight, since this level stacks multiple girder rows well beyond any
// single ladder's own span, and a looser distance would treat an unrelated
// row further along the same column as catching a genuinely dead-end
// ladder too.
const LADDER_GIRDER_CONNECTION_TOLERANCE = 16;
const TICK_MS = 50;
const STEP_TOLERANCE = 4;
const WALK_FRAME_TICKS = 4;
const HAMMER_SWAP_MS = 250;
const JUMP_STEP = [10, 7, 4, 2, 1, 0, -1, -2, -4, -7, -10];
const JUMP_TICKS = JUMP_STEP.length;

const HELD_KEY_MAP: Record<string, keyof PressedKeys> = {
	ArrowLeft: "left",
	ArrowRight: "right",
	ArrowUp: "up",
	ArrowDown: "down",
	" ": "jump",
};

// Advances an in-progress jump one tick, or starts a new one.
function resolveJump(
	left: number,
	bottom: number,
	isJumping: boolean,
	jumpValue: number,
	pressedJump: boolean,
	girders: GirderPosition[],
): JumpResolution {
	if (isJumping) {
		if (jumpValue <= 0) return { bottom, isJumping: false };

		const nextBottom = bottom - JUMP_STEP[JUMP_TICKS - jumpValue];
		const landingGirder = findJumpLanding(left, bottom, nextBottom, girders);

		if (landingGirder) return { bottom: landingGirder.top, isJumping: false };
		return { bottom: nextBottom, isJumping: true };
	}

	if (pressedJump && isTouchingGirder(left, bottom, girders)) {
		return { bottom: bottom - JUMP_STEP[0], isJumping: true };
	}

	return { bottom, isJumping };
}

// Moves Mario left/right, snapping onto a girder within step tolerance.
function resolveHorizontalMovement(
	originalLeft: number,
	originalBottom: number,
	bottomAfterJump: number,
	direction: Direction,
	isJumping: boolean,
	world: WorldConfig,
): HorizontalResolution {
	if (direction === 0) return { left: originalLeft, bottom: bottomAfterJump, isJumping };

	const candidateLeft = Math.min(Math.max(0, originalLeft + direction * MOVE_STEP), world.worldWidth - MARIO_WIDTH);

	if (isJumping) return { left: candidateLeft, bottom: bottomAfterJump, isJumping };

	const girdersUnderCandidate = findGirdersUnder(candidateLeft, world.girders);
	if (girdersUnderCandidate.length === 0) return { left: candidateLeft, bottom: bottomAfterJump, isJumping };

	const nearestGirder = findNearestGirder(girdersUnderCandidate, originalBottom);
	const heightDiff = nearestGirder.top - originalBottom;

	if (heightDiff < -STEP_TOLERANCE) {
		return { left: originalLeft, bottom: bottomAfterJump, isJumping };
	}
	if (heightDiff > STEP_TOLERANCE) {
		return { left: candidateLeft, bottom: bottomAfterJump, isJumping };
	}
	return { left: candidateLeft, bottom: nearestGirder.top, isJumping: false };
}

// Mario's spawn/reset state at a given position.
function createInitialPosition(left: number, top: number): MarioPosition {
	return {
		left,
		top,
		facing: "left",
		sprite: 0,
		walkTick: 0,
		isJumping: false,
		jumpValue: 0,
		hammerState: "none",
		carryingHammer: false,
		canUseLadder: false,
		verticalDirection: 0,
		isClimbing: false,
	};
}

function resolveClimbing(
	current: MarioPosition,
	verticalDirection: Direction,
	girders: GirderPosition[],
	ladders: LadderPosition[],
): ClimbResolution | null {
	const currentBottom = current.top + MARIO_HEIGHT;

	const isClimbing = current.isClimbing
		? !isTouchingGirder(current.left, currentBottom, girders)
		: !current.isJumping && current.canUseLadder && verticalDirection !== 0;

	if (!isClimbing) return null;

	if (verticalDirection === 0) {
		const top = currentBottom - MARIO_HEIGHT;
		return { top, canUseLadder: isWithinLadderBounds(current.left, top, ladders), isClimbing };
	}

	const rawNextBottom = currentBottom + verticalDirection * CLIMB_STEP;

	// A girder crossed during this exact step always wins, regardless of
	// anything below — land on it precisely and stop climbing right there.
	// Checking this first (rather than applying the raw step and letting
	// next tick's isTouchingGirder catch up) avoids a step overshooting a
	// girder's surface in one hop; findGirderCrossing deliberately excludes
	// the girder Mario is already resting on (see its own comment), so
	// starting a climb away from wherever he currently stands is never
	// mistaken for re-crossing that same surface.
	const crossedGirder = findGirderCrossing(current.left, currentBottom, rawNextBottom, girders);

	if (crossedGirder) {
		const top = crossedGirder.top - MARIO_HEIGHT;
		return { top, canUseLadder: isWithinLadderBounds(current.left, top, ladders), isClimbing: false };
	}

	// No girder reached yet this step. Some ladders end deliberately
	// without ever reaching one (a dead-end climb) — clamp to the ladder's
	// own top/bottom rung so he doesn't drift into open space, same as
	// before. But when a girder exists a little further along (the normal
	// case — a ladder built to connect two platforms, occasionally a few
	// px past where this single step lands), don't clamp: keep applying
	// the climb step past the ladder's nominal end exactly as if still
	// climbing, so a later tick's crossing check above eventually catches
	// it.
	let bottom = rawNextBottom;
	const currentLadder = findLadderAt(current.left, current.top, ladders);

	if (currentLadder) {
		const ladderEdge = verticalDirection === -1 ? currentLadder.top : currentLadder.top + currentLadder.height;
		// Must be on the far side of the edge in the direction of travel
		// (above it when ascending, below it when descending) — not just
		// within the tolerance distance in either direction. Without this,
		// a girder anchoring the OTHER end of a short ladder can end up
		// coincidentally within tolerance of this edge too, and get
		// mistaken for one that catches this end.
		const hasCatchingGirder = findGirdersUnder(current.left, girders).some((girder) => {
			// Must still be ahead of (or exactly at) Mario's CURRENT position,
			// not just near the ladder's fixed edge coordinate — otherwise,
			// once he's already slipped a step or two past this exact girder
			// (which findGirderCrossing's exact-start exclusion allows, by
			// design, so a fresh climb can leave the surface it started on),
			// every later tick would keep seeing the same now-passed girder
			// as still "catching" and keep skipping the clamp forever,
			// letting him drift straight through it with nothing to stop him.
			const notYetPassed = verticalDirection === -1 ? girder.top <= currentBottom : girder.top >= currentBottom;
			const distance = verticalDirection === -1 ? ladderEdge - girder.top : girder.top - ladderEdge;
			return notYetPassed && distance >= 0 && distance <= LADDER_GIRDER_CONNECTION_TOLERANCE;
		});

		if (!hasCatchingGirder) {
			if (verticalDirection === -1) bottom = Math.max(bottom, currentLadder.top);
			if (verticalDirection === 1) bottom = Math.min(bottom, currentLadder.top + currentLadder.height);
		}
	}

	const top = bottom - MARIO_HEIGHT;
	const canUseLadder = isWithinLadderBounds(current.left, top, ladders);

	return { top, canUseLadder, isClimbing };
}

// Derives the walk-cycle tick counter and which sprite frame it maps to.
function resolveWalkAnimation(direction: Direction, previousWalkTick: number): { walkTick: number; sprite: WalkSprite } {
	if (direction === 0) return { walkTick: 0, sprite: 0 };

	const walkTick = previousWalkTick + 1;
	const sprite: WalkSprite = Math.floor(walkTick / WALK_FRAME_TICKS) % 2 === 0 ? 1 : 2;
	return { walkTick, sprite };
}

// Advances Mario's full state by one physics tick.
function stepPosition(current: MarioPosition, pressedKeys: PressedKeys, world: WorldConfig): MarioPosition {
	const horizontalDirection: Direction = pressedKeys.left ? -1 : pressedKeys.right ? 1 : 0;
	const verticalDirection: Direction = pressedKeys.up ? -1 : pressedKeys.down ? 1 : 0;

	// While climbing, jump and horizontal movement are skipped entirely —
	// climbing a ladder locks Mario onto it.
	const climb = resolveClimbing(current, verticalDirection, world.girders, world.ladders);

	if (climb) {
		if (climb.top > world.worldHeight) return createInitialPosition(world.startLeft, world.startTop);

		return climb.top === current.top &&
			climb.canUseLadder === current.canUseLadder &&
			verticalDirection === current.verticalDirection &&
			climb.isClimbing === current.isClimbing
			? current
			: {
					left: current.left,
					top: climb.top,
					facing: current.facing,
					sprite: 0,
					walkTick: 0,
					isJumping: false,
					jumpValue: JUMP_TICKS,
					hammerState: current.hammerState,
					carryingHammer: current.carryingHammer,
					canUseLadder: climb.canUseLadder,
					verticalDirection,
					isClimbing: climb.isClimbing,
				};
	}

	const facing: Facing = horizontalDirection === 1 ? "right" : horizontalDirection === -1 ? "left" : current.facing;
	const currentBottom = current.top + MARIO_HEIGHT;
	const jump = resolveJump(current.left, currentBottom, current.isJumping, current.jumpValue, pressedKeys.jump, world.girders);

	const horizontal = resolveHorizontalMovement(current.left, currentBottom, jump.bottom, horizontalDirection, jump.isJumping, world);

	let { left, bottom, isJumping } = horizontal;

	if (!isJumping) {
		bottom = isTouchingGirder(left, bottom, world.girders) ? bottom : bottom + FALL_STEP;
	}

	const top = bottom - MARIO_HEIGHT;
	const { walkTick, sprite } = resolveWalkAnimation(horizontalDirection, current.walkTick);
	const jumpValue = isJumping ? current.jumpValue - 1 : JUMP_TICKS;
	const canUseLadder = isWithinLadderBounds(left, top, world.ladders);

	if (top > world.worldHeight) return createInitialPosition(world.startLeft, world.startTop);

	return left === current.left &&
		top === current.top &&
		facing === current.facing &&
		sprite === current.sprite &&
		walkTick === current.walkTick &&
		isJumping === current.isJumping &&
		jumpValue === current.jumpValue &&
		canUseLadder === current.canUseLadder &&
		verticalDirection === current.verticalDirection &&
		current.isClimbing === false
		? current
		: {
				left,
				top,
				facing,
				sprite,
				walkTick,
				isJumping,
				jumpValue,
				hammerState: current.hammerState,
				carryingHammer: current.carryingHammer,
				canUseLadder,
				verticalDirection,
				isClimbing: false,
			};
}

// React hook wiring up input, timers, and the physics loop into Mario's live position.
export function useMarioPhysics(
	startLeft: number,
	startTop: number,
	girders: GirderPosition[],
	worldWidth: number,
	worldHeight: number,
	ladders: LadderPosition[],
): MarioPosition {
	const [position, setPosition] = useState<MarioPosition>(() => createInitialPosition(startLeft, startTop));
	const pressedKeys = useRef<PressedKeys>({ left: false, right: false, jump: false, up: false, down: false });

	// Tracks held movement/jump keys and toggles carryingHammer on H.
	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const heldKey = HELD_KEY_MAP[event.key];
			if (heldKey) pressedKeys.current[heldKey] = true;

			if ((event.key === "h" || event.key === "H") && !event.repeat) {
				setPosition((current) => {
					const carryingHammer = !current.carryingHammer;
					return {
						...current,
						carryingHammer,
						hammerState: carryingHammer ? current.hammerState : "none",
					};
				});
			}
		}

		function handleKeyUp(event: KeyboardEvent) {
			const heldKey = HELD_KEY_MAP[event.key];
			if (heldKey) pressedKeys.current[heldKey] = false;
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	// Swings the hammer sprite between its up/down frames while carrying one.
	useEffect(() => {
		if (!position.carryingHammer) return;

		const intervalId = setInterval(() => {
			setPosition((current) => ({
				...current,
				hammerState: current.hammerState === "up" ? "down" : "up",
			}));
		}, HAMMER_SWAP_MS);

		return () => clearInterval(intervalId);
	}, [position.carryingHammer]);

	// Runs the fixed-timestep physics loop that advances Mario's position.
	useEffect(() => {
		const world: WorldConfig = { girders, ladders, worldWidth, worldHeight, startLeft, startTop };

		let animationFrameId: number;
		let lastTime: number | null = null;
		let accumulatedMs = 0;

		function frame(now: number) {
			if (lastTime !== null) {
				const delta = Math.min(now - lastTime, TICK_MS * 5);
				accumulatedMs += delta;
			}
			lastTime = now;

			const tickCount = Math.floor(accumulatedMs / TICK_MS);

			if (tickCount > 0) {
				accumulatedMs -= tickCount * TICK_MS;

				setPosition((current) => {
					let next = current;
					for (let i = 0; i < tickCount; i++) {
						next = stepPosition(next, pressedKeys.current, world);
					}
					return next;
				});
			}

			animationFrameId = requestAnimationFrame(frame);
		}

		animationFrameId = requestAnimationFrame(frame);

		return () => cancelAnimationFrame(animationFrameId);
	}, [girders, ladders, worldWidth, worldHeight, startLeft, startTop]);

	return position;
}
