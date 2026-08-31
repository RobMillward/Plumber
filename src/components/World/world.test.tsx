import { act } from "react";
import { configure, render, screen } from "@testing-library/react";
import { WORLD_HEIGHT, WORLD_WIDTH } from "~/consts/dimensions";
import { LEVEL_1_GIRDER_POSITIONS, LEVEL_1_HAMMER_POSITIONS, LEVEL_1_LADDER_POSITIONS } from "~/consts/levels";
import { useMarioPhysics } from "../Mario/useMarioPhysics";
import type { MarioPosition } from "../Mario/useMarioPhysics.types";
import World from "./world";

jest.mock("../Mario/useMarioPhysics");

const mockUseMarioPhysics = useMarioPhysics as jest.MockedFunction<typeof useMarioPhysics>;

configure({ testIdAttribute: "data-element" });

function marioPosition(overrides: Partial<MarioPosition> = {}): MarioPosition {
	return {
		left: 0,
		top: 300,
		facing: "left",
		sprite: 0,
		walkTick: 0,
		isJumping: false,
		jumpValue: 0,
		hammerState: "none",
		carryingHammer: false,
		hammerCountdown: null,
		canUseLadder: false,
		verticalDirection: 0,
		isClimbing: false,
		...overrides,
	};
}

beforeEach(() => {
	mockUseMarioPhysics.mockReturnValue(marioPosition());
});

afterEach(() => {
	jest.clearAllMocks();
});

describe("World", () => {
	it("renders one Ladder per level ladder position", () => {
		render(<World />);
		expect(screen.getAllByTestId("ladder")).toHaveLength(LEVEL_1_LADDER_POSITIONS.length);
	});

	it("renders one Girder per level girder position", () => {
		render(<World />);
		expect(screen.getAllByTestId("girder")).toHaveLength(LEVEL_1_GIRDER_POSITIONS.length);
	});

	it("renders one Hammer per level hammer position, none collected initially", () => {
		render(<World />);
		expect(screen.getAllByTestId("hammer")).toHaveLength(LEVEL_1_HAMMER_POSITIONS.length);
	});

	it("renders Mario positioned and styled from the physics hook's return value", () => {
		mockUseMarioPhysics.mockReturnValue(marioPosition({ left: 42, top: 88, facing: "right" }));
		render(<World />);

		const mario = screen.getByTestId("mario");
		expect(mario).toHaveStyle({ left: "42px", top: "88px" });
		expect(mario).toHaveClass("mario--facing-right");
	});

	it("calls useMarioPhysics with the level layout, world dimensions, and a spawn position", () => {
		render(<World />);

		expect(mockUseMarioPhysics).toHaveBeenCalledWith(
			0,
			300,
			LEVEL_1_GIRDER_POSITIONS,
			WORLD_WIDTH,
			WORLD_HEIGHT,
			LEVEL_1_LADDER_POSITIONS,
			LEVEL_1_HAMMER_POSITIONS,
			expect.any(Function),
		);
	});

	it("marks a touched hammer as collected, removing it from render, without affecting the other hammer", () => {
		render(<World />);
		expect(screen.getAllByTestId("hammer")).toHaveLength(2);

		const onHammerCollected = mockUseMarioPhysics.mock.calls[0][7];
		act(() => {
			onHammerCollected(LEVEL_1_HAMMER_POSITIONS[0]);
		});

		expect(screen.getAllByTestId("hammer")).toHaveLength(1);
	});
});
