import { configure, render, screen } from "@testing-library/react";
import Info from "./info";
import type { MarioPosition } from "../Mario/useMarioPhysics.types";

configure({ testIdAttribute: "data-element" });

function marioPosition(overrides: Partial<MarioPosition> = {}): MarioPosition {
	return {
		left: 0,
		top: 0,
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

function expectedRowsText(position: MarioPosition): string {
	return [
		["left", position.left.toFixed(0)],
		["top", position.top.toFixed(0)],
		["facing", position.facing],
		["sprite", String(position.sprite)],
		["walkTick", String(position.walkTick)],
		["isJumping", String(position.isJumping)],
		["jumpValue", String(position.jumpValue)],
		["hammerState", position.hammerState],
		["carryingHammer", String(position.carryingHammer)],
		["canUseLadder", String(position.canUseLadder)],
		["verticalDirection", String(position.verticalDirection)],
		["isClimbing", String(position.isClimbing)],
	]
		.map(([label, value]) => `${label}${value}`)
		.join("");
}

function mountInfo(position: MarioPosition): HTMLElement {
	render(<Info position={position} />);
	return screen.getByTestId("info");
}

describe("Info", () => {
	it("renders a div marked with data-element=\"info\"", () => {
		const info = mountInfo(marioPosition());
		expect(info).toBeInTheDocument();
		expect(info.tagName).toBe("DIV");
	});

	it("renders every field, in order, with the expected formatting", () => {
		const position = marioPosition({
			left: 12,
			top: 340,
			facing: "right",
			sprite: 2,
			walkTick: 7,
			isJumping: true,
			jumpValue: 5,
			hammerState: "up",
			carryingHammer: true,
			canUseLadder: true,
			verticalDirection: -1,
			isClimbing: true,
		});

		const info = mountInfo(position);
		expect(info.textContent).toBe(expectedRowsText(position));
	});

	it("rounds fractional left/top to the nearest whole pixel", () => {
		const position = marioPosition({ left: 12.6, top: 99.4 });
		const info = mountInfo(position);
		expect(info.textContent).toBe(expectedRowsText(position));
		expect(info.textContent).toContain("left13");
		expect(info.textContent).toContain("top99");
	});

	it("re-renders with updated values when position changes", () => {
		const first = marioPosition({ left: 0 });
		const { rerender } = render(<Info position={first} />);
		expect(screen.getByTestId("info").textContent).toBe(expectedRowsText(first));

		const second = marioPosition({ left: 200 });
		rerender(<Info position={second} />);
		expect(screen.getByTestId("info").textContent).toBe(expectedRowsText(second));
	});
});
