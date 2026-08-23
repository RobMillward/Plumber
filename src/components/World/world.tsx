import "./world.css";

import Girder from "./Girder/girder";
import { LEVEL_1_GIRDER_POSITIONS } from "~/consts/levels";

export default function World() {
	return (
		<main className="world">
			{LEVEL_1_GIRDER_POSITIONS.map(({ left, top }, index) => (
				<Girder key={`girder_${index}`} style={{ left, top }} />
			))}
		</main>
	);
}
