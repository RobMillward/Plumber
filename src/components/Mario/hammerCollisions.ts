import { HAMMER_HEIGHT, HAMMER_WIDTH, MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { HammerPosition } from "~/consts/levels";

// AABB overlap between Mario and an uncollected hammer's container, returning the matched hammer itself.
export function findHammerAt(left: number, bottom: number, hammers: HammerPosition[]): HammerPosition | null {
	const top = bottom - MARIO_HEIGHT;

	return (
		hammers.find(
			(hammer) =>
				!hammer.collected &&
				left + MARIO_WIDTH > hammer.left &&
				left < hammer.left + HAMMER_WIDTH &&
				top + MARIO_HEIGHT > hammer.top &&
				top < hammer.top + HAMMER_HEIGHT,
		) ?? null
	);
}

export function isTouchingHammer(left: number, bottom: number, hammers: HammerPosition[]): boolean {
	return findHammerAt(left, bottom, hammers) !== null;
}
