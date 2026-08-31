import type { HammerPosition } from "~/consts/levels";
import { findHammerAt, isTouchingHammer } from "./hammerCollisions";

function hammer(left: number, top: number, collected = false): HammerPosition {
	return { left, top, collected };
}

const HAMMER = hammer(100, 200);
const MATCHING_LEFT = 90;
const MATCHING_BOTTOM = 220;

describe("findHammerAt", () => {
	describe("horizontal bounds", () => {
		it("matches when Mario's box overlaps the hammer's", () => {
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [HAMMER])).toBe(HAMMER);
		});

		it("matches at the innermost edge of the horizontal zone (approaching from the left)", () => {
			expect(findHammerAt(69, MATCHING_BOTTOM, [HAMMER])).toBe(HAMMER);
		});

		it("excludes left exactly touching the right side (no overlap)", () => {
			expect(findHammerAt(68, MATCHING_BOTTOM, [HAMMER])).toBeNull();
		});

		it("matches at the innermost edge of the horizontal zone (approaching from the right)", () => {
			expect(findHammerAt(117, MATCHING_BOTTOM, [HAMMER])).toBe(HAMMER);
		});

		it("excludes left exactly touching the left side (no overlap)", () => {
			expect(findHammerAt(118, MATCHING_BOTTOM, [HAMMER])).toBeNull();
		});

		it("excludes left far to the left of the hammer", () => {
			expect(findHammerAt(0, MATCHING_BOTTOM, [HAMMER])).toBeNull();
		});

		it("excludes left far to the right of the hammer", () => {
			expect(findHammerAt(200, MATCHING_BOTTOM, [HAMMER])).toBeNull();
		});
	});

	describe("vertical bounds", () => {
		it("matches just inside the top of the zone", () => {
			expect(findHammerAt(MATCHING_LEFT, 201, [HAMMER])).toBe(HAMMER);
		});

		it("excludes exactly at the top boundary (no overlap)", () => {
			expect(findHammerAt(MATCHING_LEFT, 200, [HAMMER])).toBeNull();
		});

		it("matches just inside the bottom of the zone", () => {
			expect(findHammerAt(MATCHING_LEFT, 251, [HAMMER])).toBe(HAMMER);
		});

		it("excludes exactly at the bottom boundary (no overlap)", () => {
			expect(findHammerAt(MATCHING_LEFT, 252, [HAMMER])).toBeNull();
		});

		it("excludes well above the hammer", () => {
			expect(findHammerAt(MATCHING_LEFT, 50, [HAMMER])).toBeNull();
		});

		it("excludes well below the hammer", () => {
			expect(findHammerAt(MATCHING_LEFT, 500, [HAMMER])).toBeNull();
		});
	});

	describe("collected hammers", () => {
		it("excludes a hammer marked collected even when fully overlapping", () => {
			const collected = hammer(100, 200, true);
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [collected])).toBeNull();
		});

		it("skips a collected hammer and still matches an uncollected one behind it", () => {
			const collected = hammer(100, 200, true);
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [collected, HAMMER])).toBe(HAMMER);
		});
	});

	describe("multiple hammers and empty input", () => {
		it("returns null for an empty hammer list", () => {
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [])).toBeNull();
		});

		it("returns null when no hammer matches", () => {
			const other = hammer(300, 400);
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [other])).toBeNull();
		});

		it("returns the first matching hammer in array order", () => {
			const overlapping = hammer(100, 200);
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [HAMMER, overlapping])).toBe(HAMMER);
		});

		it("finds the correct hammer among several non-matching ones", () => {
			const before = hammer(0, 0);
			const after = hammer(300, 400);
			expect(findHammerAt(MATCHING_LEFT, MATCHING_BOTTOM, [before, HAMMER, after])).toBe(HAMMER);
		});
	});
});

describe("isTouchingHammer", () => {
	it("is true when a hammer matches", () => {
		expect(isTouchingHammer(MATCHING_LEFT, MATCHING_BOTTOM, [HAMMER])).toBe(true);
	});

	it("is false when no hammer matches", () => {
		expect(isTouchingHammer(0, 0, [HAMMER])).toBe(false);
	});

	it("is false for a collected hammer", () => {
		expect(isTouchingHammer(MATCHING_LEFT, MATCHING_BOTTOM, [hammer(100, 200, true)])).toBe(false);
	});

	it("is false against an empty hammer list", () => {
		expect(isTouchingHammer(MATCHING_LEFT, MATCHING_BOTTOM, [])).toBe(false);
	});
});
