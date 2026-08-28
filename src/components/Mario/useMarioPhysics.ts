import { useEffect, useRef, useState } from "react";

import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition } from "~/consts/levels";
import { FALL_STEP, findGirdersUnder, findJumpLanding, findNearestGirder, isTouchingGirder } from "./girderCollision";
import type {
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
const TICK_MS = 50;
const STEP_TOLERANCE = 4;
const WALK_FRAME_TICKS = 4;
const HAMMER_SWAP_MS = 250;
const JUMP_STEP = [10, 8, 6, 4, 2, 0, -2, -4, -6, -8, -10];
const JUMP_TICKS = JUMP_STEP.length;

const HELD_KEY_MAP: Record<string, keyof PressedKeys> = {
	ArrowLeft: "left",
	ArrowRight: "right",
	" ": "jump",
};

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
	};
}

function resolveWalkAnimation(direction: Direction, previousWalkTick: number): { walkTick: number; sprite: WalkSprite } {
	if (direction === 0) return { walkTick: 0, sprite: 0 };

	const walkTick = previousWalkTick + 1;
	const sprite: WalkSprite = Math.floor(walkTick / WALK_FRAME_TICKS) % 2 === 0 ? 1 : 2;
	return { walkTick, sprite };
}

function stepPosition(current: MarioPosition, pressedKeys: PressedKeys, world: WorldConfig): MarioPosition {
	const direction: Direction = pressedKeys.left ? -1 : pressedKeys.right ? 1 : 0;
	const facing: Facing = direction === 1 ? "right" : direction === -1 ? "left" : current.facing;
	const currentBottom = current.top + MARIO_HEIGHT;
	const jump = resolveJump(current.left, currentBottom, current.isJumping, current.jumpValue, pressedKeys.jump, world.girders);

	const horizontal = resolveHorizontalMovement(current.left, currentBottom, jump.bottom, direction, jump.isJumping, world);

	let { left, bottom, isJumping } = horizontal;

	if (!isJumping) {
		bottom = isTouchingGirder(left, bottom, world.girders) ? bottom : bottom + FALL_STEP;
	}

	const top = bottom - MARIO_HEIGHT;
	const { walkTick, sprite } = resolveWalkAnimation(direction, current.walkTick);
	const jumpValue = isJumping ? current.jumpValue - 1 : JUMP_TICKS;

	if (top > world.worldHeight) return createInitialPosition(world.startLeft, world.startTop);

	return left === current.left &&
		top === current.top &&
		facing === current.facing &&
		sprite === current.sprite &&
		walkTick === current.walkTick &&
		isJumping === current.isJumping &&
		jumpValue === current.jumpValue
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
			};
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

	useEffect(() => {
		const world: WorldConfig = { girders, worldWidth, worldHeight, startLeft, startTop };

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
	}, [girders, worldWidth, worldHeight, startLeft, startTop]);

	return position;
}
