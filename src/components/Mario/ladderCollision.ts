import { LADDER_WIDTH, MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { LadderPosition } from "~/consts/levels";

export function isWithinLadderBounds(left: number, top: number, ladders: LadderPosition[]): boolean {
	return ladders.some(
		(ladder) =>
			left + MARIO_WIDTH > ladder.left + LADDER_WIDTH &&
			left < ladder.left &&
			top + MARIO_HEIGHT > ladder.top &&
			top < ladder.top + ladder.height,
	);
}
