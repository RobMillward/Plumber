import "./world.css";

import { useCallback, useState, type CSSProperties } from "react";
import Girder from "./Girder/girder";
import Mario from "../Mario/mario";
import { LEVEL_1_GIRDER_POSITIONS, LEVEL_1_HAMMER_POSITIONS } from "~/consts/levels";
import type { HammerPosition } from "~/consts/levels";
import { LEVEL_1_LADDER_POSITIONS } from "~/consts/levels";
import { useMarioPhysics } from "../Mario/useMarioPhysics";
import { WORLD_HEIGHT, WORLD_WIDTH } from "~/consts/dimensions";
import Ladder from "./Ladder/ladder";
import Info from "../Info/info";
import Hammer from "./Hammer/hammer";

const worldStyle = {
	"--world-width": `${WORLD_WIDTH}px`,
	"--world-height": `${WORLD_HEIGHT}px`,
} as CSSProperties;

export default function World() {
	const [hammers, setHammers] = useState<HammerPosition[]>(LEVEL_1_HAMMER_POSITIONS);

	// Marks the touched hammer as collected so it stops rendering; stable identity keeps the physics loop from restarting every tick.
	const handleHammerCollected = useCallback((hammer: HammerPosition) => {
		setHammers((current) => current.map((candidate) => (candidate === hammer ? { ...candidate, collected: true } : candidate)));
	}, []);

	const mario = useMarioPhysics(
		0,
		300,
		LEVEL_1_GIRDER_POSITIONS,
		WORLD_WIDTH,
		WORLD_HEIGHT,
		LEVEL_1_LADDER_POSITIONS,
		hammers,
		handleHammerCollected,
	);

	return (
		<main className="world" style={worldStyle}>
			{LEVEL_1_LADDER_POSITIONS.map(({ left, top, height }, index) => (
				<Ladder key={`ladder_${index}`} style={{ left, top, height }} />
			))}
			{LEVEL_1_GIRDER_POSITIONS.map(({ left, top }, index) => (
				<Girder key={`girder_${index}`} style={{ left, top }} />
			))}
			{hammers.map(({ left, top, collected }, index) => (
				<Hammer key={`hammer_${index}`} style={{ left, top }} collected={collected} />
			))}
			<Mario
				key="mario"
				facing={mario.facing}
				sprite={mario.sprite}
				style={{ left: mario.left, top: mario.top }}
				hammerState={mario.hammerState}
			/>
			<Info position={mario} />
		</main>
	);
}
