import { useEffect, useRef, useState } from "react";

import type { GirderPosition } from "~/consts/levels";

const MARIO_WIDTH = 32;
const MARIO_HEIGHT = 32;
const GIRDER_WIDTH = 32;
const FALL_STEP = 2;
const MOVE_STEP = 2;
const TICK_MS = 50;
const STEP_TOLERANCE = 4;

type Facing = "left" | "right";
type MarioPosition = { left: number; top: number; facing: Facing };

function isTouchingGirder(left: number, top: number, girders: GirderPosition[]): boolean {
	const feet = top + MARIO_HEIGHT;

	return girders.some(
		(girder) =>
			left + MARIO_WIDTH > girder.left &&
			left < girder.left + GIRDER_WIDTH &&
			feet >= girder.top &&
			feet <= girder.top + FALL_STEP,
	);
}

function findGirdersUnder(left: number, girders: GirderPosition[]): GirderPosition[] {
	return girders.filter((girder) => left + MARIO_WIDTH > girder.left && left < girder.left + GIRDER_WIDTH);
}

function findNearestGirder(girders: GirderPosition[], feet: number): GirderPosition {
	return girders.reduce((nearest, girder) =>
		Math.abs(girder.top - feet) < Math.abs(nearest.top - feet) ? girder : nearest,
	);
}

export function useMarioPhysics(
	startLeft: number,
	startTop: number,
	girders: GirderPosition[],
	worldWidth: number,
): MarioPosition {
	const [position, setPosition] = useState<MarioPosition>({ left: startLeft, top: startTop, facing: "left" });
	const pressedKeys = useRef({ left: false, right: false });

	useEffect(() => {
		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "ArrowLeft") pressedKeys.current.left = true;
			if (event.key === "ArrowRight") pressedKeys.current.right = true;
		}

		function handleKeyUp(event: KeyboardEvent) {
			if (event.key === "ArrowLeft") pressedKeys.current.left = false;
			if (event.key === "ArrowRight") pressedKeys.current.right = false;
		}

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	useEffect(() => {
		const interval = setInterval(() => {
			setPosition((current) => {
				const direction = pressedKeys.current.left ? -1 : pressedKeys.current.right ? 1 : 0;
				let left = current.left;
				let top = current.top;
				const facing: Facing = direction === 1 ? "right" : direction === -1 ? "left" : current.facing;

				if (direction !== 0) {
					const candidateLeft = Math.min(
						Math.max(0, current.left + direction * MOVE_STEP),
						worldWidth - MARIO_WIDTH,
					);
					const girdersUnderCandidate = findGirdersUnder(candidateLeft, girders);

					if (girdersUnderCandidate.length === 0) {
						left = candidateLeft;
					} else {
						const feet = current.top + MARIO_HEIGHT;
						const nearestGirder = findNearestGirder(girdersUnderCandidate, feet);
						const heightDiff = nearestGirder.top - feet;

						if (heightDiff < -STEP_TOLERANCE) {
						} else if (heightDiff > STEP_TOLERANCE) {
							left = candidateLeft;
						} else {
							left = candidateLeft;
							top = nearestGirder.top - MARIO_HEIGHT;
						}
					}
				}

				top = isTouchingGirder(left, top, girders) ? top : top + FALL_STEP;

				return left === current.left && top === current.top && facing === current.facing
					? current
					: { left, top, facing };
			});
		}, TICK_MS);

		return () => clearInterval(interval);
	}, [girders, worldWidth]);

	return position;
}
