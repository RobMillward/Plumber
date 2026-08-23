export type Direction = -1 | 0 | 1;
export type Facing = "left" | "right";
export type WalkSprite = 0 | 1 | 2;
export type PressedKeys = { left: boolean; right: boolean; jump: boolean };

export type MarioPosition = {
	left: number;
	top: number;
	facing: Facing;
	sprite: WalkSprite;
	walkTick: number;
	isJumping: boolean;
	jumpValue: number;
};

export type JumpResolution = { top: number; isJumping: boolean };
export type HorizontalResolution = { left: number; top: number; isJumping: boolean };
