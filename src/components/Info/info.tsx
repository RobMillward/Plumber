import "./info.css";

import type { MarioPosition } from "../Mario/useMarioPhysics.types";

export type InfoProps = {
	position: MarioPosition;
};

export default function Info({ position }: InfoProps) {
	const rows: Array<[string, string]> = [
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
	];

	return (
		<div className="info" data-element="info">
			{rows.map(([label, value]) => (
				<div className="info-row" key={label}>
					<span className="info-row-label">{label}</span>
					<span>{value}</span>
				</div>
			))}
		</div>
	);
}
