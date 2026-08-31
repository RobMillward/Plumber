import { configure, render, screen } from "@testing-library/react";
import Hammer from "./hammer";
import type { HammerProps } from "./hammer";

configure({ testIdAttribute: "data-element" });

function mountHammer(props: Omit<HammerProps, "collected"> & { collected?: boolean } = {}): HTMLElement | null {
	render(<Hammer collected={false} {...props} />);
	return screen.queryByTestId("hammer");
}

describe("Hammer", () => {
	it("renders a div marked with data-element=\"hammer\" when not collected", () => {
		const hammer = mountHammer({ collected: false });
		expect(hammer).toBeInTheDocument();
		expect(hammer?.tagName).toBe("DIV");
	});

	it("renders nothing when collected", () => {
		const hammer = mountHammer({ collected: true });
		expect(hammer).not.toBeInTheDocument();
	});

	it("always uses the fixed \"hammer\" className", () => {
		const hammer = mountHammer();
		expect(hammer?.className).toBe("hammer");
	});

	it("discards a passed className in favor of the fixed one", () => {
		const hammer = mountHammer({ className: "extra" });
		expect(hammer?.className).toBe("hammer");
	});

	it("applies a passed style directly, with no default size properties of its own", () => {
		const hammer = mountHammer({ style: { left: 40, top: 60 } });
		expect(hammer).toHaveStyle({ left: "40px", top: "60px" });
		expect(hammer?.style.getPropertyValue("--hammer-width")).toBe("");
		expect(hammer?.style.getPropertyValue("--hammer-height")).toBe("");
	});

	it("renders with no inline style attribute when none is passed", () => {
		const hammer = mountHammer();
		expect(hammer?.getAttribute("style")).toBeNull();
	});

	it("spreads through additional HTML attributes", () => {
		const hammer = mountHammer({ id: "my-hammer" });
		expect(hammer).toHaveAttribute("id", "my-hammer");
	});
});
