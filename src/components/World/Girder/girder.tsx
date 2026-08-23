import "./girder.css";

import type { HTMLAttributes } from "react";

export type GirderProps = HTMLAttributes<HTMLDivElement>;

export default function Girder({ className, ...props }: GirderProps) {
	return (
		<div
			{...props}
			className={className ? `girder ${className}` : "girder"}
			data-element="girder"
		/>
	);
}
