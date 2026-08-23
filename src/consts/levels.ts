export type GirderPosition = {
	left: number;
	top: number;
};

// The girder sprite is a native 32x16 tile with a built-in rise across its
// width (that's how consecutive tiles form a diagonal girder). Tiling it
// every 32px keeps tiles edge-to-edge instead of overlapping — overlap
// would double up that built-in rise and fake a slope on flat rows too.
const TILE_STEP = 32;
const COLUMNS = 9; // 0, 32, 64, ... 256
const SLOPE_STEP = 4;
const GIRDER_HEIGHT = 16;

// The top/bottom platforms are flat for their first half, then drift
// gently from the halfway column onward — a much subtler version of the
// full sloped rows in between.
const HALFWAY_COLUMN = Math.floor((COLUMNS - 1) / 2);
const DRIFT_STEP = 2;

// The visible gap kept between one row's lowest tile edge and the next
// row's highest tile edge, regardless of how steep either row is.
const ROW_GAP = 24;

type RowDirection = "flat" | "down-right" | "down-left" | "drift-down" | "drift-up";

function columnOffset(direction: RowDirection, column: number): number {
	const columnsPastHalfway = Math.max(0, column - HALFWAY_COLUMN);

	switch (direction) {
		case "down-right":
			return column * SLOPE_STEP;
		case "down-left":
			return (COLUMNS - 1 - column) * SLOPE_STEP;
		case "drift-down":
			return columnsPastHalfway * DRIFT_STEP;
		case "drift-up":
			return -columnsPastHalfway * DRIFT_STEP;
		case "flat":
			return 0;
	}
}

// A row's own vertical footprint (relative to its base top) varies by
// direction — a full slope spans SLOPE_STEP * (COLUMNS - 1), a drift row
// spans much less. Deriving row spacing from these actual footprints
// (rather than a single constant sized for the steepest row) is what
// keeps the gap between every pair of rows equal.
function offsetRange(direction: RowDirection): { min: number; max: number } {
	const offsets = Array.from({ length: COLUMNS }, (_, column) => columnOffset(direction, column));
	return { min: Math.min(...offsets), max: Math.max(...offsets) };
}

// The column sitting at a row's lowest point is left unrendered — a gap
// for barrels/players to fall through — except on the bottom-most row
// (always "drift-up" here), which stays solid as the landing platform.
function lowestPointColumn(direction: RowDirection): number | null {
	switch (direction) {
		case "drift-down":
		case "down-right":
			return COLUMNS - 1;
		case "down-left":
			return 0;
		case "drift-up":
		case "flat":
			return null;
	}
}

function buildGirderRow(baseTop: number, direction: RowDirection): GirderPosition[] {
	const skipColumn = lowestPointColumn(direction);

	return Array.from({ length: COLUMNS }, (_, column) => ({ column, top: baseTop + columnOffset(direction, column) }))
		.filter(({ column }) => column !== skipColumn)
		.map(({ column, top }) => ({ left: column * TILE_STEP, top }));
}

// A zigzag of alternating sloped girders stacked between a flat top
// platform (Donkey Kong) and a flat bottom platform (Mario's start),
// approximating the "25m" stage from the original game.
const ROW_DIRECTIONS: RowDirection[] = [
	"drift-down",
	"down-left",
	"down-right",
	"down-left",
	"down-right",
	"drift-up",
];

const ROW_BASE_TOPS = ROW_DIRECTIONS.reduce<number[]>((bases, direction, index) => {
	if (index === 0) return [10];

	const previousDirection = ROW_DIRECTIONS[index - 1];
	const previousBase = bases[index - 1];
	const previousMax = offsetRange(previousDirection).max;
	const currentMin = offsetRange(direction).min;

	return [...bases, previousBase + previousMax + GIRDER_HEIGHT + ROW_GAP - currentMin];
}, []);

export const LEVEL_1_GIRDER_POSITIONS: GirderPosition[] = ROW_DIRECTIONS.flatMap((direction, index) =>
	buildGirderRow(ROW_BASE_TOPS[index], direction),
);
