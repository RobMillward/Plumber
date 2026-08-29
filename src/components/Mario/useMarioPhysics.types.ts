import type { GirderPosition, LadderPosition } from "~/consts/levels";

export type Direction = -1 | 0 | 1;
export type Facing = "left" | "right";
export type WalkSprite = 0 | 1 | 2;
export type PressedKeys = { left: boolean; right: boolean; jump: boolean, up: boolean; down: boolean };
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
	canUseLadder: boolean;
};

export type JumpResolution = { bottom: number; isJumping: boolean };
export type HorizontalResolution = { left: number; bottom: number; isJumping: boolean };

export type WorldConfig = {
	girders: GirderPosition[];
	ladders: LadderPosition[];
	worldWidth: number;
	worldHeight: number;
	startLeft: number;
	startTop: number;
};
