import { LADDER_WIDTH, MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { LadderPosition } from "~/consts/levels";

// A 1px tolerance on the top/bottom edges — without it, the exact resting
// position at the top of a ladder (top + MARIO_HEIGHT === ladder.top) fails
// the strict `>` check, so canUseLadder is false right where a player would
// naturally be standing to start climbing back down.
const LADDER_VERTICAL_TOLERANCE = 2;

// Same bounds test as isWithinLadderBounds, but returns the actual ladder
// matched (rather than just whether one was) — needed by the climbing
// logic to clamp Mario to that specific ladder's own top/bottom rung.
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
