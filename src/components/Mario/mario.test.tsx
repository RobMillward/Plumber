import { configure, render, screen } from "@testing-library/react";
import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import Mario from "./mario";
import type { MarioProps } from "./mario";

configure({ testIdAttribute: "data-element" });

const BASE_PROPS: MarioProps = {
	facing: "left",
	sprite: 0,
	hammerState: "none",
	isClimbing: false,
};

function mountMario(props: Partial<MarioProps> = {}): { wrapper: HTMLElement; sprite: HTMLElement } {
	render(<Mario {...BASE_PROPS} {...props} />);
	const wrapper = screen.getByTestId("mario");
	return { wrapper, sprite: wrapper.firstElementChild as HTMLElement };
}

describe("Mario", () => {
	describe("wrapper", () => {
		it("renders a div marked with data-element=\"mario\"", () => {
			const { wrapper } = mountMario();
			expect(wrapper).toBeInTheDocument();
			expect(wrapper.tagName).toBe("DIV");
		});

		it("has no facing-right class when facing left", () => {
			const { wrapper } = mountMario({ facing: "left" });
			expect(wrapper).not.toHaveClass("mario--facing-right");
		});

		it("has the facing-right class when facing right", () => {
			const { wrapper } = mountMario({ facing: "right" });
			expect(wrapper).toHaveClass("mario--facing-right");
		});

		it("sizes itself via CSS custom properties matching the mario dimension constants", () => {
			const { wrapper } = mountMario();
			expect(wrapper).toHaveStyle({
				"--mario-width": `${MARIO_WIDTH}px`,
				"--mario-height": `${MARIO_HEIGHT}px`,
			});
		});

		it("merges a passed style with the default size properties", () => {
			const { wrapper } = mountMario({ style: { left: 64, top: 128 } });
			expect(wrapper).toHaveStyle({
				"--mario-width": `${MARIO_WIDTH}px`,
				"--mario-height": `${MARIO_HEIGHT}px`,
				left: "64px",
				top: "128px",
			});
		});

		it("spreads through additional HTML attributes", () => {
			const { wrapper } = mountMario({ id: "my-mario" });
			expect(wrapper).toHaveAttribute("id", "my-mario");
		});
	});

	describe("walking sprite selection", () => {
		it("uses the plain sprite class when not carrying a hammer", () => {
			const { sprite } = mountMario({ sprite: 1, hammerState: "none" });
			expect(sprite).toHaveClass("mario--sprite-1");
			expect(sprite.className).not.toMatch(/hammer/);
		});

		it("uses the hammer-up sprite class while carrying a hammer up", () => {
			const { sprite } = mountMario({ sprite: 2, hammerState: "up" });
			expect(sprite).toHaveClass("mario--sprite-2-hammer-up");
		});

		it("uses the hammer-down sprite class while carrying a hammer down", () => {
			const { sprite } = mountMario({ sprite: 2, hammerState: "down" });
			expect(sprite).toHaveClass("mario--sprite-2-hammer-down");
		});

		it("is flipped when facing right", () => {
			const { sprite } = mountMario({ facing: "right" });
			expect(sprite).toHaveClass("mario--flipped");
		});

		it("is not flipped when facing left", () => {
			const { sprite } = mountMario({ facing: "left" });
			expect(sprite).not.toHaveClass("mario--flipped");
		});

		it("appends a passed className after the sprite class", () => {
			const { sprite } = mountMario({ className: "extra" });
			expect(sprite).toHaveClass("mario--sprite-0", "extra");
		});
	});

	describe("climbing sprite selection", () => {
		it("uses the inactive climb sprite when sprite is 0", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 0 });
			expect(sprite).toHaveClass("mario--sprite-climb-inactive");
		});

		it("uses the active climb sprite when sprite is 1", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 1 });
			expect(sprite).toHaveClass("mario--sprite-climb-active");
		});

		it("uses the active climb sprite when sprite is 2", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 2 });
			expect(sprite).toHaveClass("mario--sprite-climb-active");
		});

		it("is not flipped on the inactive (sprite 0) frame", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 0 });
			expect(sprite).not.toHaveClass("mario--flipped");
		});

		it("is not flipped on the first active (sprite 1) frame", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 1 });
			expect(sprite).not.toHaveClass("mario--flipped");
		});

		it("is flipped on the second active (sprite 2) frame", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 2 });
			expect(sprite).toHaveClass("mario--flipped");
		});

		it("ignores hammerState for the sprite image while climbing", () => {
			const { sprite } = mountMario({ isClimbing: true, sprite: 1, hammerState: "up" });
			expect(sprite).toHaveClass("mario--sprite-climb-active");
			expect(sprite.className).not.toMatch(/hammer/);
		});

		it("ignores facing for the flip while climbing, even when facing right", () => {
			const { sprite, wrapper } = mountMario({ isClimbing: true, sprite: 0, facing: "right" });
			expect(wrapper).toHaveClass("mario--facing-right");
			expect(sprite).not.toHaveClass("mario--flipped");
		});
	});
});
