import type { GirderPosition, HammerPosition, LadderPosition } from "~/consts/levels";

export type Direction = -1 | 0 | 1;
export type Facing = "left" | "right";
export type WalkSprite = 0 | 1 | 2;
export type PressedKeys = { left: boolean; right: boolean; jump: boolean; up: boolean; down: boolean };
export type HammerState = "up" | "down" | "none";

export type MarioPosition = {
	left: number;
	top: number;
	facing: Facing;
	sprite: WalkSprite;
	walkTick: number;
	isJumping: boolean;
	jumpValue: number;
	hammerState: HammerState;
	carryingHammer: boolean;
	hammerCountdown: ReturnType<typeof setTimeout> | null;
	canUseLadder: boolean;
	verticalDirection: Direction;
	isClimbing: boolean;
};

export type ClimbResolution = { top: number; canUseLadder: boolean; isClimbing: boolean };

export type JumpResolution = {
	bottom: number;
	isJumping: boolean;
	carryingHammer: boolean;
	hammerCountdown: ReturnType<typeof setTimeout> | null;
};

// The hammer-carrying state and callbacks resolveJump needs, bundled since they always travel together.
export type HammerContext = {
	carryingHammer: boolean;
	hammerCountdown: ReturnType<typeof setTimeout> | null;
	onHammerExpire: () => void;
	onHammerCollected: (hammer: HammerPosition) => void;
};
export type HorizontalResolution = { left: number; bottom: number; isJumping: boolean };

export type WorldConfig = {
	girders: GirderPosition[];
	ladders: LadderPosition[];
	hammers: HammerPosition[];
	worldWidth: number;
	worldHeight: number;
	startLeft: number;
	startTop: number;
};
