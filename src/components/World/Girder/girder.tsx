import "./girder.css";

import type { CSSProperties, HTMLAttributes } from "react";
import { GIRDER_WIDTH, GIRDER_HEIGHT } from "~/consts/dimensions";

export type GirderProps = HTMLAttributes<HTMLDivElement>;

const girderSizeStyle = {
	"--girder-width": `${GIRDER_WIDTH}px`,
	"--girder-height": `${GIRDER_HEIGHT}px`
} as CSSProperties;

export default function Girder({ className, style, ...props }: GirderProps) {
	return (
		<div
			{...props}
			className={className ? `girder ${className}` : "girder"}
			style={{ ...girderSizeStyle, ...style }}
			data-element="girder"
		/>
	);
}
