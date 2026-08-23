import { useEffect, useRef, useState } from "react";

import { GIRDER_WIDTH, MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition } from "~/consts/levels";
import type {
	Direction,
	Facing,
	HorizontalResolution,
	JumpResolution,
	MarioPosition,
	PressedKeys,
	WalkSprite,
} from "./useMarioPhysics.types";

const FALL_STEP = 2;
const MOVE_STEP = 2;
const TICK_MS = 50;
const STEP_TOLERANCE = 4;
const WALK_FRAME_TICKS = 4;
const JUMP_STEP = [10, 8, 6, 4, 2, 0, -2, -4, -6, -8, -10];
const JUMP_TICKS = JUMP_STEP.length;

function overlapsHorizontally(left: number, girder: GirderPosition): boolean {
	return left + MARIO_WIDTH > girder.left && left < girder.left + GIRDER_WIDTH;
}

function isTouchingGirder(left: number, top: number, girders: GirderPosition[]): boolean {
	const feet = top + MARIO_HEIGHT;

	return girders.some(
		(girder) => overlapsHorizontally(left, girder) && feet >= girder.top && feet <= girder.top + FALL_STEP,
	);
}

function findGirdersUnder(left: number, girders: GirderPosition[]): GirderPosition[] {
	return girders.filter((girder) => overlapsHorizontally(left, girder));
}

function findNearestGirder(girders: GirderPosition[], feet: number): GirderPosition {
	return girders.reduce((nearest, girder) =>
		Math.abs(girder.top - feet) < Math.abs(nearest.top - feet) ? girder : nearest,
	);
}

function findJumpLanding(
	left: number,
	previousTop: number,
	nextTop: number,
	girders: GirderPosition[],
): GirderPosition | null {
	const previousFeet = previousTop + MARIO_HEIGHT;
	const nextFeet = nextTop + MARIO_HEIGHT;

	if (nextFeet <= previousFeet) return null;

	return (
		girders.find(
			(girder) => overlapsHorizontally(left, girder) && previousFeet <= girder.top && nextFeet >= girder.top,
		) ?? null
	);
}

function resolveJump(
	left: number,
	top: number,
	isJumping: boolean,
	jumpValue: number,
	pressedJump: boolean,
	girders: GirderPosition[],
): JumpResolution {
	if (isJumping) {
		if (jumpValue <= 0) return { top, isJumping: false };

		const nextTop = top - JUMP_STEP[JUMP_TICKS - jumpValue];
		const landingGirder = findJumpLanding(left, top, nextTop, girders);

		if (landingGirder) return { top: landingGirder.top - MARIO_HEIGHT, isJumping: false };
		return { top: nextTop, isJumping: true };
	}

	if (pressedJump && isTouchingGirder(left, top, girders)) {
		return { top: top - JUMP_STEP[0], isJumping: true };
	}

	return { top, isJumping };
}

function resolveHorizontalMovement(
	originalLeft: number,
	originalTop: number,
	topAfterJump: number,
	direction: Direction,
	isJumping: boolean,
	worldWidth: number,
	girders: GirderPosition[],
): HorizontalResolution {
	if (direction === 0) return { left: originalLeft, top: topAfterJump, isJumping };

	const candidateLeft = Math.min(Math.max(0, originalLeft + direction * MOVE_STEP), worldWidth - MARIO_WIDTH);

	if (isJumping) return { left: candidateLeft, top: topAfterJump, isJumping };

	const girdersUnderCandidate = findGirdersUnder(candidateLeft, girders);
	if (girdersUnderCandidate.length === 0) return { left: candidateLeft, top: topAfterJump, isJumping };

	const feet = originalTop + MARIO_HEIGHT;
	const nearestGirder = findNearestGirder(girdersUnderCandidate, feet);
	const heightDiff = nearestGirder.top - feet;

	if (heightDiff < -STEP_TOLERANCE) {
		return { left: originalLeft, top: topAfterJump, isJumping };
	}
	if (heightDiff > STEP_TOLERANCE) {
		return { left: candidateLeft, top: topAfterJump, isJumping };
	}
	return { left: candidateLeft, top: nearestGirder.top - MARIO_HEIGHT, isJumping: false };
}

function createInitialPosition(left: number, top: number): MarioPosition {
	return { left, top, facing: "left", sprite: 0, walkTick: 0, isJumping: false, jumpValue: 0 };
}

function stepPosition(
	current: MarioPosition,
	pressedKeys: PressedKeys,
	girders: GirderPosition[],
	worldWidth: number,
	worldHeight: number,
	startLeft: number,
	startTop: number,
): MarioPosition {
	const direction: Direction = pressedKeys.left ? -1 : pressedKeys.right ? 1 : 0;
	const facing: Facing = direction === 1 ? "right" : direction === -1 ? "left" : current.facing;

	const jump = resolveJump(current.left, current.top, current.isJumping, current.jumpValue, pressedKeys.jump, girders);

	const horizontal = resolveHorizontalMovement(
		current.left,
		current.top,
		jump.top,
		direction,
		jump.isJumping,
		worldWidth,
		girders,
	);

	let { left, top, isJumping } = horizontal;

	if (!isJumping) {
		top = isTouchingGirder(left, top, girders) ? top : top + FALL_STEP;
	}

	const walkTick = direction !== 0 ? current.walkTick + 1 : 0;
	const sprite: WalkSprite = direction === 0 ? 0 : Math.floor(walkTick / WALK_FRAME_TICKS) % 2 === 0 ? 1 : 2;
	const jumpValue = isJumping ? current.jumpValue - 1 : JUMP_TICKS;

	// Fell out of the world container (missed every girder on the way down)
	// — send Mario back to his starting spot rather than let him fall forever.
	if (top > worldHeight) return createInitialPosition(startLeft, startTop);

	return left === current.left &&
		top === current.top &&
		facing === current.facing &&
		sprite === current.sprite &&
		walkTick === current.walkTick &&
		isJumping === current.isJumping &&
		jumpValue === current.jumpValue
		? current
		: { left, top, facing, sprite, walkTick, isJumping, jumpValue };
}

export function useMarioPhysics(
	startLeft: number,
	startTop: number,
	girders: GirderPosition[],
	worldWidth: number,
	worldHeight: number,
): MarioPosition {
	const [position, setPosition] = useState<MarioPosition>(() => createInitialPosition(startLeft, startTop));
	const pressedKeys = useRef<PressedKeys>({ left: false, right: false, jump: false });

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowLeft") pressedKeys.current.left = true;
			if (event.key === "ArrowRight") pressedKeys.current.right = true;
			if (event.key === " ") pressedKeys.current.jump = true;
		}

		function handleKeyUp(event: KeyboardEvent) {
			if (event.key === "ArrowLeft") pressedKeys.current.left = false;
			if (event.key === "ArrowRight") pressedKeys.current.right = false;
			if (event.key === " ") pressedKeys.current.jump = false;
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useEffect(() => {
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
						next = stepPosition(next, pressedKeys.current, girders, worldWidth, worldHeight, startLeft, startTop);
					}
					return next;
				});
			}

			animationFrameId = requestAnimationFrame(frame);
		}

		animationFrameId = requestAnimationFrame(frame);

		return () => cancelAnimationFrame(animationFrameId);
	}, [girders, worldWidth, worldHeight, startLeft, startTop]);

	return position;
}
