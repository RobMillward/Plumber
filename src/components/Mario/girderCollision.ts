import { GIRDER_WIDTH, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition } from "~/consts/levels";

export const FALL_STEP = 2;

function overlapsHorizontally(left: number, girder: GirderPosition): boolean {
	return left + MARIO_WIDTH > girder.left && left < girder.left + GIRDER_WIDTH;
}

export function isTouchingGirder(left: number, bottom: number, girders: GirderPosition[]): boolean {
	return girders.some(
		(girder) => overlapsHorizontally(left, girder) && bottom >= girder.top && bottom <= girder.top + FALL_STEP,
	);
}

export function findGirdersUnder(left: number, girders: GirderPosition[]): GirderPosition[] {
	return girders.filter((girder) => overlapsHorizontally(left, girder));
}

export function findNearestGirder(girders: GirderPosition[], feet: number): GirderPosition {
	return girders.reduce((nearest, girder) =>
		Math.abs(girder.top - feet) < Math.abs(nearest.top - feet) ? girder : nearest,
	);
}

export function findJumpLanding(
	left: number,
	previousBottom: number,
	nextBottom: number,
	girders: GirderPosition[],
): GirderPosition | null {
	if (nextBottom <= previousBottom) return null;

	return (
		girders.find(
			(girder) => overlapsHorizontally(left, girder) && previousBottom <= girder.top && nextBottom >= girder.top,
		) ?? null
	);
}

// Same idea as findJumpLanding, but direction-agnostic (a jump only ever
// descends into a landing; climbing can cross a girder's surface moving
// either up or down). previousBottom itself is deliberately excluded (a
// strict `>`/`<`, not `>=`/`<=`) — climbing starts from wherever Mario
// already is, which is very often resting exactly on a girder (the one at
// the bottom of the ladder he's about to climb, say), and moving AWAY from
// that girder onto the ladder must not immediately re-match the very
// surface he's leaving.
export function findGirderCrossing(
	left: number,
	previousBottom: number,
	nextBottom: number,
	girders: GirderPosition[],
): GirderPosition | null {
	if (nextBottom === previousBottom) return null;

	return (
		girders.find((girder) => {
			if (!overlapsHorizontally(left, girder)) return false;
			return nextBottom > previousBottom
				? girder.top > previousBottom && girder.top <= nextBottom
				: girder.top < previousBottom && girder.top >= nextBottom;
		}) ?? null
	);
}
