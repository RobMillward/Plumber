import { LADDER_WIDTH, MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { LadderPosition } from "~/consts/levels";

// Tolerance so the exact resting position at a ladder's edge still counts as within its bounds.
const LADDER_VERTICAL_TOLERANCE = 2;

// Same bounds test as isWithinLadderBounds, but returns the matched ladder itself.
export function findLadderAt(left: number, top: number, ladders: LadderPosition[]): LadderPosition | null {
	return (
		ladders.find(
			(ladder) =>
				left + MARIO_WIDTH > ladder.left + LADDER_WIDTH &&
				left < ladder.left &&
				top + MARIO_HEIGHT > ladder.top - LADDER_VERTICAL_TOLERANCE &&
				top < ladder.top + ladder.height + LADDER_VERTICAL_TOLERANCE,
		) ?? null
	);
}

export function isWithinLadderBounds(left: number, top: number, ladders: LadderPosition[]): boolean {
	return findLadderAt(left, top, ladders) !== null;
}
