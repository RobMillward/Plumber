import { render, screen } from "@testing-library/react";
import { useStore as mockUseStore } from "react-redux";
import { store } from "~/store";
import App from "./App";

let mockCapturedStore: unknown;

jest.mock("./components/World/world", () => ({
	__esModule: true,
	default: function MockWorld() {
		mockCapturedStore = mockUseStore();
		return <div data-testid="mock-world" />;
	},
}));

afterEach(() => {
	mockCapturedStore = undefined;
});

describe("App", () => {
	it("renders World", () => {
		render(<App />);
		expect(screen.getByTestId("mock-world")).toBeInTheDocument();
	});

	it("wraps World in a redux Provider carrying the app's real store", () => {
		render(<App />);
		expect(mockCapturedStore).toBe(store);
	});
});
