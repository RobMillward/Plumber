import "./world.css";

import type { CSSProperties } from "react";
import Girder from "./Girder/girder";
import Mario from "../Mario/mario";
import { LEVEL_1_GIRDER_POSITIONS } from "~/consts/levels";
import { useMarioPhysics } from "./useMarioPhysics";

const WORLD_WIDTH = 288;

// Widely supported (unlike attr() for sizing properties): CSS reads this
// from the custom property set below rather than a hardcoded value.
const worldStyle = { "--world-width": `${WORLD_WIDTH}px` } as CSSProperties;

export default function World() {
	const mario = useMarioPhysics(0, 300, LEVEL_1_GIRDER_POSITIONS, WORLD_WIDTH);

	return (
		<main className="world" style={worldStyle}>
			{LEVEL_1_GIRDER_POSITIONS.map(({ left, top }, index) => (
				<Girder key={`girder_${index}`} style={{ left, top }} />
			))}
			<Mario key="mario" facing={mario.facing} style={{ left: mario.left, top: mario.top }} />
		</main>
	);
}
