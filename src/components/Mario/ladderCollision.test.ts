import type { LadderPosition } from "~/consts/levels";
import { findLadderAt, isWithinLadderBounds } from "./ladderCollision";

function ladder(left: number, top: number, height: number): LadderPosition {
	return { left, top, height };
}

const LADDER = ladder(100, 200, 50);
const MATCHING_LEFT = 95;
const MATCHING_TOP = 210;

describe("findLadderAt", () => {
	describe("horizontal bounds", () => {
		it("matches when Mario's box straddles the ladder from the left", () => {
			expect(findLadderAt(MATCHING_LEFT, MATCHING_TOP, [LADDER])).toBe(LADDER);
		});

		it("matches at the innermost edge of the horizontal zone", () => {
			expect(findLadderAt(99, MATCHING_TOP, [LADDER])).toBe(LADDER);
		});

		it("excludes left exactly at the ladder's own left edge", () => {
			expect(findLadderAt(100, MATCHING_TOP, [LADDER])).toBeNull();
		});

		it("excludes left to the right of the ladder entirely", () => {
			expect(findLadderAt(105, MATCHING_TOP, [LADDER])).toBeNull();
		});

		it("matches at the outermost edge of the horizontal zone", () => {
			expect(findLadderAt(89, MATCHING_TOP, [LADDER])).toBe(LADDER);
		});

		it("excludes left one pixel past the outermost edge (box no longer contains the ladder)", () => {
			expect(findLadderAt(88, MATCHING_TOP, [LADDER])).toBeNull();
		});

		it("excludes left far to the left of the ladder", () => {
			expect(findLadderAt(0, MATCHING_TOP, [LADDER])).toBeNull();
		});
	});

	describe("vertical bounds", () => {
		it("matches within the ladder's own top/bottom span", () => {
			expect(findLadderAt(MATCHING_LEFT, LADDER.top + 10, [LADDER])).toBe(LADDER);
		});

		it("matches just above the ladder, within tolerance", () => {
			expect(findLadderAt(MATCHING_LEFT, 167, [LADDER])).toBe(LADDER);
		});

		it("excludes exactly at the top tolerance boundary", () => {
			expect(findLadderAt(MATCHING_LEFT, 166, [LADDER])).toBeNull();
		});

		it("matches just below the ladder's bottom, within tolerance", () => {
			expect(findLadderAt(MATCHING_LEFT, 251, [LADDER])).toBe(LADDER);
		});

		it("excludes exactly at the bottom tolerance boundary", () => {
			expect(findLadderAt(MATCHING_LEFT, 252, [LADDER])).toBeNull();
		});

		it("excludes well above the ladder", () => {
			expect(findLadderAt(MATCHING_LEFT, 50, [LADDER])).toBeNull();
		});

		it("excludes well below the ladder", () => {
			expect(findLadderAt(MATCHING_LEFT, 400, [LADDER])).toBeNull();
		});
	});

	describe("multiple ladders and empty input", () => {
		it("returns null for an empty ladder list", () => {
			expect(findLadderAt(MATCHING_LEFT, MATCHING_TOP, [])).toBeNull();
		});

		it("returns null when no ladder matches", () => {
			const other = ladder(200, 400, 30);
			expect(findLadderAt(MATCHING_LEFT, MATCHING_TOP, [other])).toBeNull();
		});

		it("returns the first matching ladder in array order", () => {
			const overlapping = ladder(100, 200, 50);
			expect(findLadderAt(MATCHING_LEFT, MATCHING_TOP, [LADDER, overlapping])).toBe(LADDER);
		});

		it("finds the correct ladder among several non-matching ones", () => {
			const before = ladder(0, 0, 10);
			const after = ladder(250, 300, 10);
			expect(findLadderAt(MATCHING_LEFT, MATCHING_TOP, [before, LADDER, after])).toBe(LADDER);
		});
	});
});

describe("isWithinLadderBounds", () => {
	it("is true when a ladder matches", () => {
		expect(isWithinLadderBounds(MATCHING_LEFT, MATCHING_TOP, [LADDER])).toBe(true);
	});

	it("is false when no ladder matches", () => {
		expect(isWithinLadderBounds(0, 0, [LADDER])).toBe(false);
	});

	it("is false against an empty ladder list", () => {
		expect(isWithinLadderBounds(MATCHING_LEFT, MATCHING_TOP, [])).toBe(false);
	});
});
