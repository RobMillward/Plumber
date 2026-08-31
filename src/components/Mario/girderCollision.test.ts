import { GIRDER_WIDTH, MARIO_WIDTH } from "~/consts/dimensions";
import type { GirderPosition } from "~/consts/levels";
import {
	FALL_STEP,
	findGirderCrossing,
	findGirdersUnder,
	findJumpLanding,
	findNearestGirder,
	isTouchingGirder,
} from "./girderCollision";

function girder(left: number, top: number): GirderPosition {
	return { left, top };
}

describe("FALL_STEP", () => {
	it("is a small positive per-tick fall distance", () => {
		expect(FALL_STEP).toBe(2);
	});
});

describe("isTouchingGirder", () => {
	it("is true when overlapping horizontally and resting exactly on top of the girder", () => {
		expect(isTouchingGirder(0, 100, [girder(0, 100)])).toBe(true);
	});

	it("is true within FALL_STEP below the girder's top", () => {
		expect(isTouchingGirder(0, 100 + FALL_STEP, [girder(0, 100)])).toBe(true);
	});

	it("is false just past FALL_STEP below the girder's top", () => {
		expect(isTouchingGirder(0, 100 + FALL_STEP + 1, [girder(0, 100)])).toBe(false);
	});

	it("is false one pixel above the girder's top", () => {
		expect(isTouchingGirder(0, 99, [girder(0, 100)])).toBe(false);
	});

	it("is false when there is no horizontal overlap, even at the right height", () => {
		expect(isTouchingGirder(GIRDER_WIDTH, 100, [girder(0, 100)])).toBe(false);
	});

	it("is true when only partially overlapping horizontally by one pixel", () => {
		expect(isTouchingGirder(GIRDER_WIDTH - 1, 100, [girder(0, 100)])).toBe(true);
	});

	it("is false against an empty girder list", () => {
		expect(isTouchingGirder(0, 100, [])).toBe(false);
	});

	it("is true when any one of several girders matches", () => {
		const girders = [girder(0, 500), girder(0, 100), girder(0, 900)];
		expect(isTouchingGirder(0, 100, girders)).toBe(true);
	});
});

describe("findGirdersUnder", () => {
	it("returns girders overlapping the given left position regardless of height", () => {
		const low = girder(0, 300);
		const high = girder(0, 50);
		expect(findGirdersUnder(0, [low, high])).toEqual([low, high]);
	});

	it("excludes girders with no horizontal overlap", () => {
		expect(findGirdersUnder(0, [girder(GIRDER_WIDTH, 100)])).toEqual([]);
	});

	it("excludes a girder exactly touching the right edge (no overlap)", () => {
		expect(findGirdersUnder(GIRDER_WIDTH, [girder(0, 100)])).toEqual([]);
	});

	it("excludes a girder exactly touching the left edge (no overlap)", () => {
		expect(findGirdersUnder(-MARIO_WIDTH, [girder(0, 100)])).toEqual([]);
	});

	it("includes a girder overlapping by a single pixel on the right", () => {
		expect(findGirdersUnder(GIRDER_WIDTH - 1, [girder(0, 100)])).toEqual([girder(0, 100)]);
	});

	it("returns an empty array when given no girders", () => {
		expect(findGirdersUnder(0, [])).toEqual([]);
	});
});

describe("findNearestGirder", () => {
	it("returns the only girder when there is just one", () => {
		const only = girder(0, 100);
		expect(findNearestGirder([only], 90)).toBe(only);
	});

	it("returns the girder with the smallest vertical distance to feet", () => {
		const near = girder(0, 105);
		const far = girder(0, 200);
		expect(findNearestGirder([far, near], 100)).toBe(near);
	});

	it("compares distance regardless of whether the girder is above or below", () => {
		const above = girder(0, 90);
		const below = girder(0, 108);
		expect(findNearestGirder([above, below], 100)).toBe(below);
	});

	it("keeps the earlier girder on an exact distance tie", () => {
		const first = girder(0, 90);
		const second = girder(0, 110);
		expect(findNearestGirder([first, second], 100)).toBe(first);
	});
});

describe("findJumpLanding", () => {
	it("returns null while still ascending (nextBottom below previousBottom)", () => {
		expect(findJumpLanding(0, 100, 90, [girder(0, 95)])).toBeNull();
	});

	it("returns null when bottom is unchanged", () => {
		expect(findJumpLanding(0, 100, 100, [girder(0, 100)])).toBeNull();
	});

	it("finds a girder whose top falls within the falling step", () => {
		const landing = girder(0, 110);
		expect(findJumpLanding(0, 100, 120, [landing])).toBe(landing);
	});

	it("matches a girder top exactly at previousBottom", () => {
		const landing = girder(0, 100);
		expect(findJumpLanding(0, 100, 120, [landing])).toBe(landing);
	});

	it("matches a girder top exactly at nextBottom", () => {
		const landing = girder(0, 120);
		expect(findJumpLanding(0, 100, 120, [landing])).toBe(landing);
	});

	it("returns null when no girder top falls within the step", () => {
		expect(findJumpLanding(0, 100, 120, [girder(0, 130)])).toBeNull();
	});

	it("returns null when the only crossed girder has no horizontal overlap", () => {
		expect(findJumpLanding(0, 100, 120, [girder(GIRDER_WIDTH, 110)])).toBeNull();
	});

	it("returns the first matching girder in array order", () => {
		const first = girder(0, 105);
		const second = girder(0, 110);
		expect(findJumpLanding(0, 100, 120, [first, second])).toBe(first);
	});
});

describe("findGirderCrossing", () => {
	it("returns null when bottom is unchanged", () => {
		expect(findGirderCrossing(0, 100, 100, [girder(0, 100)])).toBeNull();
	});

	describe("moving down (nextBottom > previousBottom)", () => {
		it("excludes a girder exactly at previousBottom (the one just left)", () => {
			expect(findGirderCrossing(0, 100, 120, [girder(0, 100)])).toBeNull();
		});

		it("matches a girder strictly after previousBottom", () => {
			const crossed = girder(0, 110);
			expect(findGirderCrossing(0, 100, 120, [crossed])).toBe(crossed);
		});

		it("matches a girder exactly at nextBottom", () => {
			const crossed = girder(0, 120);
			expect(findGirderCrossing(0, 100, 120, [crossed])).toBe(crossed);
		});

		it("does not match a girder past nextBottom", () => {
			expect(findGirderCrossing(0, 100, 120, [girder(0, 121)])).toBeNull();
		});

		it("ignores a matching girder with no horizontal overlap", () => {
			expect(findGirderCrossing(0, 100, 120, [girder(GIRDER_WIDTH, 110)])).toBeNull();
		});
	});

	describe("moving up (nextBottom < previousBottom)", () => {
		it("excludes a girder exactly at previousBottom (the one just left)", () => {
			expect(findGirderCrossing(0, 120, 100, [girder(0, 120)])).toBeNull();
		});

		it("matches a girder strictly before previousBottom", () => {
			const crossed = girder(0, 110);
			expect(findGirderCrossing(0, 120, 100, [crossed])).toBe(crossed);
		});

		it("matches a girder exactly at nextBottom", () => {
			const crossed = girder(0, 100);
			expect(findGirderCrossing(0, 120, 100, [crossed])).toBe(crossed);
		});

		it("does not match a girder past nextBottom", () => {
			expect(findGirderCrossing(0, 120, 100, [girder(0, 99)])).toBeNull();
		});

		it("ignores a matching girder with no horizontal overlap", () => {
			expect(findGirderCrossing(0, 120, 100, [girder(GIRDER_WIDTH, 110)])).toBeNull();
		});
	});
});
