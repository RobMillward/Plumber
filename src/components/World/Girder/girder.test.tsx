import { configure, render, screen } from "@testing-library/react";
import { GIRDER_HEIGHT, GIRDER_WIDTH } from "~/consts/dimensions";
import Girder from "./girder";
import type { GirderProps } from "./girder";

configure({ testIdAttribute: "data-element" });

function mountGirder(props: GirderProps = {}): HTMLElement {
	render(<Girder {...props} />);
	return screen.getByTestId("girder");
}

describe("Girder", () => {
	it("renders a div marked with data-element=\"girder\"", () => {
		const girder = mountGirder();
		expect(girder).toBeInTheDocument();
		expect(girder.tagName).toBe("DIV");
	});

	it("applies the base girder className by default", () => {
		const girder = mountGirder();
		expect(girder.className).toBe("girder");
	});

	it("appends a passed className after the base class", () => {
		const girder = mountGirder({ className: "extra" });
		expect(girder.className).toBe("girder extra");
	});

	it("sizes itself via CSS custom properties matching the girder dimension constants", () => {
		const girder = mountGirder();
		expect(girder).toHaveStyle({
			"--girder-width": `${GIRDER_WIDTH}px`,
			"--girder-height": `${GIRDER_HEIGHT}px`,
		});
	});

	it("merges a passed style with the default size properties", () => {
		const girder = mountGirder({ style: { left: 64, top: 128 } });
		expect(girder).toHaveStyle({
			"--girder-width": `${GIRDER_WIDTH}px`,
			"--girder-height": `${GIRDER_HEIGHT}px`,
			left: "64px",
			top: "128px",
		});
	});

	it("lets a passed style override a default size property", () => {
		const girder = mountGirder({ style: { "--girder-width": "999px" } as React.CSSProperties });
		expect(girder).toHaveStyle({ "--girder-width": "999px" });
	});

	it("spreads through additional HTML attributes", () => {
		const girder = mountGirder({ id: "my-girder" });
		expect(girder).toHaveAttribute("id", "my-girder");
	});
});
