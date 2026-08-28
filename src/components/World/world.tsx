import "./world.css";

import type { CSSProperties } from "react";
import Girder from "./Girder/girder";
import Mario from "../Mario/mario";
import { LEVEL_1_GIRDER_POSITIONS } from "~/consts/levels";
import { useMarioPhysics } from "../Mario/useMarioPhysics";
import { WORLD_HEIGHT, WORLD_WIDTH } from "~/consts/dimensions";

const worldStyle = {
	"--world-width": `${WORLD_WIDTH}px`,
	"--world-height": `${WORLD_HEIGHT}px`,
} as CSSProperties;

export default function World() {
	const mario = useMarioPhysics(0, 300, LEVEL_1_GIRDER_POSITIONS, WORLD_WIDTH, WORLD_HEIGHT);

	return (
		<main className="world" style={worldStyle}>
			{LEVEL_1_GIRDER_POSITIONS.map(({ left, top }, index) => (
				<Girder key={`girder_${index}`} style={{ left, top }} />
			))}
			<Mario
				key="mario"
				facing={mario.facing}
				sprite={mario.sprite}
				style={{ left: mario.left, top: mario.top }}
				hammerState={mario.hammerState}
			/>
		</main>
	);
}
