import { configure, render, screen } from "@testing-library/react";
import Ladder from "./ladder";
import type { LadderProps } from "./ladder";

configure({ testIdAttribute: "data-element" });

function mountLadder(props: LadderProps = {}): HTMLElement {
	render(<Ladder {...props} />);
	return screen.getByTestId("ladder");
}

describe("Ladder", () => {
	it("renders a div marked with data-element=\"ladder\"", () => {
		const ladder = mountLadder();
		expect(ladder).toBeInTheDocument();
		expect(ladder.tagName).toBe("DIV");
	});

	it("always uses the fixed \"ladder\" className", () => {
		const ladder = mountLadder();
		expect(ladder.className).toBe("ladder");
	});

	it("discards a passed className in favor of the fixed one", () => {
		const ladder = mountLadder({ className: "extra" });
		expect(ladder.className).toBe("ladder");
	});

	it("applies a passed style directly, with no default size properties of its own", () => {
		const ladder = mountLadder({ style: { left: 45, top: 100, height: 40 } });
		expect(ladder).toHaveStyle({ left: "45px", top: "100px", height: "40px" });
	});

	it("renders with no inline style attribute when none is passed", () => {
		const ladder = mountLadder();
		expect(ladder.getAttribute("style")).toBeNull();
	});

	it("spreads through additional HTML attributes", () => {
		const ladder = mountLadder({ id: "my-ladder" });
		expect(ladder).toHaveAttribute("id", "my-ladder");
	});
});
