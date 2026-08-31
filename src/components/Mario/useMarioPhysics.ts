import { useEffect, useRef, useState } from "react";

import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition, HammerPosition, LadderPosition } from "~/consts/levels";
import {
	FALL_STEP,
	findGirderCrossing,
	findGirdersUnder,
	findJumpLanding,
	findNearestGirder,
	isTouchingGirder,
} from "./girderCollision";
import { findHammerAt } from "./hammerCollisions";
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
// How near a girder must be to a ladder's edge to count as connecting to it (see resolveClimbing).
const LADDER_GIRDER_CONNECTION_TOLERANCE = 16;
const TICK_MS = 50;
const STEP_TOLERANCE = 4;
const WALK_FRAME_TICKS = 4;
const HAMMER_SWAP_MS = 250;
const HAMMER_CARRY_MS = 14000;
const JUMP_STEP = [10, 7, 4, 2, 1, 0, -1, -2, -4, -7, -10];
const JUMP_TICKS = JUMP_STEP.length;

const HELD_KEY_MAP: Record<string, keyof PressedKeys> = {
	ArrowLeft: "left",
	ArrowRight: "right",
	ArrowUp: "up",
	ArrowDown: "down",
	" ": "jump",
};

// Advances an in-progress jump one tick, or starts a new one (blocked while carrying a hammer); also picks up a touched hammer.
function resolveJump(
	left: number,
	bottom: number,
	isJumping: boolean,
	jumpValue: number,
	pressedJump: boolean,
	girders: GirderPosition[],
	hammers: HammerPosition[],
	carryingHammer: boolean,
	hammerCountdown: ReturnType<typeof setTimeout> | null,
	onHammerExpire: () => void,
	onHammerCollected: (hammer: HammerPosition) => void,
): JumpResolution {
	let nextBottom = bottom;
	let nextIsJumping = isJumping;

	if (isJumping) {
		if (jumpValue > 0) {
			const candidateBottom = bottom - JUMP_STEP[JUMP_TICKS - jumpValue];
			const landingGirder = findJumpLanding(left, bottom, candidateBottom, girders);

			nextBottom = landingGirder ? landingGirder.top : candidateBottom;
			nextIsJumping = landingGirder === null;
		} else {
			nextIsJumping = false;
		}
	} else if (pressedJump && !carryingHammer && isTouchingGirder(left, bottom, girders)) {
		nextBottom = bottom - JUMP_STEP[0];
		nextIsJumping = true;
	}

	// Checked against the tick's resolved position so a hammer touched mid-jump is still picked up.
	const touchedHammer = carryingHammer ? null : findHammerAt(left, nextBottom, hammers);

	if (touchedHammer) {
		onHammerCollected(touchedHammer);
		const timeoutId = setTimeout(onHammerExpire, HAMMER_CARRY_MS);
		return { bottom: nextBottom, isJumping: nextIsJumping, carryingHammer: true, hammerCountdown: timeoutId };
	}

	return { bottom: nextBottom, isJumping: nextIsJumping, carryingHammer, hammerCountdown };
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
		hammerCountdown: null,
		canUseLadder: false,
		verticalDirection: 0,
		isClimbing: false,
	};
}

// Whether a girder near a ladder's edge (ahead of Mario's current position, not already passed) still connects here.
function hasReachableGirderNear(
	ladderEdge: number,
	currentBottom: number,
	verticalDirection: Direction,
	left: number,
	girders: GirderPosition[],
): boolean {
	return findGirdersUnder(left, girders).some((girder) => {
		const notYetPassed = verticalDirection === -1 ? girder.top <= currentBottom : girder.top >= currentBottom;
		const distance = verticalDirection === -1 ? ladderEdge - girder.top : girder.top - ladderEdge;
		return notYetPassed && distance >= 0 && distance <= LADDER_GIRDER_CONNECTION_TOLERANCE;
	});
}

// Clamps bottom to a ladder's own top/bottom rung, for a dead-end climb with nothing beyond it.
function clampToLadderEdge(bottom: number, verticalDirection: Direction, ladder: LadderPosition): number {
	if (verticalDirection === -1) return Math.max(bottom, ladder.top);
	return Math.min(bottom, ladder.top + ladder.height);
}

// Resolves ladder climbing for one tick, or returns null when Mario isn't climbing (blocked from starting one while carrying a hammer).
function resolveClimbing(
	current: MarioPosition,
	verticalDirection: Direction,
	girders: GirderPosition[],
	ladders: LadderPosition[],
): ClimbResolution | null {
	const currentBottom = current.top + MARIO_HEIGHT;

	const isClimbing = current.isClimbing
		? !isTouchingGirder(current.left, currentBottom, girders)
		: !current.isJumping && !current.carryingHammer && current.canUseLadder && verticalDirection !== 0;

	if (!isClimbing) return null;

	if (verticalDirection === 0) {
		const top = currentBottom - MARIO_HEIGHT;
		return { top, canUseLadder: isWithinLadderBounds(current.left, top, ladders), isClimbing };
	}

	const rawNextBottom = currentBottom + verticalDirection * CLIMB_STEP;

	// A girder crossed this exact step always wins — land on it precisely and stop climbing right there.
	const crossedGirder = findGirderCrossing(current.left, currentBottom, rawNextBottom, girders);

	if (crossedGirder) {
		const top = crossedGirder.top - MARIO_HEIGHT;
		return { top, canUseLadder: isWithinLadderBounds(current.left, top, ladders), isClimbing: false };
	}

	// No girder reached yet — clamp to the ladder's own edge unless one is still reachable a bit further along.
	const currentLadder = findLadderAt(current.left, current.top, ladders);
	let bottom = rawNextBottom;

	if (currentLadder) {
		const ladderEdge = verticalDirection === -1 ? currentLadder.top : currentLadder.top + currentLadder.height;
		const hasCatchingGirder = hasReachableGirderNear(ladderEdge, currentBottom, verticalDirection, current.left, girders);

		if (!hasCatchingGirder) bottom = clampToLadderEdge(bottom, verticalDirection, currentLadder);
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

// Returns `current` unchanged if `next` is identical field-for-field, otherwise `next` — avoids re-rendering on a no-op tick.
function withUnchangedBailout(current: MarioPosition, next: MarioPosition): MarioPosition {
	const isUnchanged = (Object.keys(next) as (keyof MarioPosition)[]).every((key) => next[key] === current[key]);
	return isUnchanged ? current : next;
}

// Advances Mario's full state by one physics tick.
function stepPosition(
	current: MarioPosition,
	pressedKeys: PressedKeys,
	world: WorldConfig,
	onHammerExpire: () => void,
	onHammerCollected: (hammer: HammerPosition) => void,
): MarioPosition {
	const horizontalDirection: Direction = pressedKeys.left ? -1 : pressedKeys.right ? 1 : 0;
	const verticalDirection: Direction = pressedKeys.up ? -1 : pressedKeys.down ? 1 : 0;

	// While climbing, jump and horizontal movement are skipped entirely — climbing a ladder locks Mario onto it.
	const climb = resolveClimbing(current, verticalDirection, world.girders, world.ladders);

	if (climb) {
		if (climb.top > world.worldHeight) return createInitialPosition(world.startLeft, world.startTop);

		return withUnchangedBailout(current, {
			left: current.left,
			top: climb.top,
			facing: current.facing,
			sprite: 0,
			walkTick: 0,
			isJumping: false,
			jumpValue: JUMP_TICKS,
			hammerState: current.hammerState,
			carryingHammer: current.carryingHammer,
			hammerCountdown: current.hammerCountdown,
			canUseLadder: climb.canUseLadder,
			verticalDirection,
			isClimbing: climb.isClimbing,
		});
	}

	const facing: Facing = horizontalDirection === 1 ? "right" : horizontalDirection === -1 ? "left" : current.facing;
	const currentBottom = current.top + MARIO_HEIGHT;
	const jump = resolveJump(
		current.left,
		currentBottom,
		current.isJumping,
		current.jumpValue,
		pressedKeys.jump,
		world.girders,
		world.hammers,
		current.carryingHammer,
		current.hammerCountdown,
		onHammerExpire,
		onHammerCollected,
	);

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

	return withUnchangedBailout(current, {
		left,
		top,
		facing,
		sprite,
		walkTick,
		isJumping,
		jumpValue,
		hammerState: current.hammerState,
		carryingHammer: jump.carryingHammer,
		hammerCountdown: jump.hammerCountdown,
		canUseLadder,
		verticalDirection,
		isClimbing: false,
	});
}

// React hook wiring up input, timers, and the physics loop into Mario's live position.
export function useMarioPhysics(
	startLeft: number,
	startTop: number,
	girders: GirderPosition[],
	worldWidth: number,
	worldHeight: number,
	ladders: LadderPosition[],
	hammers: HammerPosition[],
	onHammerCollected: (hammer: HammerPosition) => void,
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
		const world: WorldConfig = { girders, ladders, hammers, worldWidth, worldHeight, startLeft, startTop };

		// Fires once a picked-up hammer's carry time runs out, dropping it.
		function onHammerExpire() {
			setPosition((current) => ({ ...current, carryingHammer: false, hammerCountdown: null, hammerState: "none" }));
		}

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
						next = stepPosition(next, pressedKeys.current, world, onHammerExpire, onHammerCollected);
					}
					return next;
				});
			}

			animationFrameId = requestAnimationFrame(frame);
		}

		animationFrameId = requestAnimationFrame(frame);

		return () => cancelAnimationFrame(animationFrameId);
	}, [girders, ladders, hammers, worldWidth, worldHeight, startLeft, startTop, onHammerCollected]);

	return position;
}
