import girder from "~/assets/girder_32.png";
import hammer from "~/assets/hammer.png";
import climbActive from "~/assets/mario/climb_active.png";
import climbInactive from "~/assets/mario/climb_inactive.png";
import mario0 from "~/assets/mario/mario_32_0.png";
import mario0HammerDown from "~/assets/mario/mario_32_0_hammer_down.png";
import mario0HammerUp from "~/assets/mario/mario_32_0_hammer_up.png";
import mario1 from "~/assets/mario/mario_32_1.png";
import mario1HammerDown from "~/assets/mario/mario_32_1_hammer_down.png";
import mario1HammerUp from "~/assets/mario/mario_32_1_hammer_up.png";
import mario2 from "~/assets/mario/mario_32_2.png";
import mario2HammerDown from "~/assets/mario/mario_32_2_hammer_down.png";
import mario2HammerUp from "~/assets/mario/mario_32_2_hammer_up.png";

// Every background-image referenced from CSS (mario.css, girder.css, hammer.css), imported as modules so their
// built URLs are known up front — lets the whole set be pre-cached before a sprite state first needs one of them.
export const SPRITE_IMAGE_URLS: string[] = [
	mario0,
	mario0HammerUp,
	mario0HammerDown,
	mario1,
	mario1HammerUp,
	mario1HammerDown,
	mario2,
	mario2HammerUp,
	mario2HammerDown,
	climbInactive,
	climbActive,
	girder,
	hammer,
];
