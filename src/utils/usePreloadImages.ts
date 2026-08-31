import { useEffect } from "react";

// Warms the browser's image cache for a fixed list of URLs so sprite swaps (e.g. hammer pickup, ladder climb) never pop in.
export function usePreloadImages(urls: string[]): void {
	useEffect(() => {
		const images = urls.map((url) => {
			const image = new Image();
			image.src = url;
			return image;
		});

		return () => {
			images.forEach((image) => {
				image.src = "";
			});
		};
	}, [urls]);
}
