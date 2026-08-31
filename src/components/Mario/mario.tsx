import "./mario.css";

import type { CSSProperties, HTMLAttributes } from "react";
import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { Facing, HammerState, WalkSprite } from "./useMarioPhysics.types";

export type MarioProps = HTMLAttributes<HTMLDivElement> & {
    facing: Facing;
    sprite: WalkSprite;
    hammerState: HammerState;
    isClimbing: boolean;
};

const marioSizeStyle = {
    "--mario-width": `${MARIO_WIDTH}px`,
    "--mario-height": `${MARIO_HEIGHT}px`,
} as CSSProperties;

export default function Mario({ className, facing, sprite, hammerState, isClimbing, style, ...props }: MarioProps) {
    // Climbing mirrors on its own cadence (see sprite), independent of horizontal facing.
    const flipped = isClimbing ? sprite !== 0 && sprite % 2 === 0 : facing === "right";

    const classNamesWrapper = [
        "mario-wrapper",
        facing === "right" && "mario--facing-right",
    ]
        .filter(Boolean)
        .join(" ");

    const spriteImageClass = isClimbing
        ? sprite === 0
            ? "mario--sprite-climb-inactive"
            : "mario--sprite-climb-active"
        : hammerState === "none"
          ? `mario--sprite-${sprite}`
          : `mario--sprite-${sprite}-hammer-${hammerState}`;

    const classNamesSprite = [
        "mario-sprite",
        spriteImageClass,
        flipped && "mario--flipped",
        className,
    ]
        .filter(Boolean)
        .join(" ");
    return (
        <div
            {...props}
            style={{ ...marioSizeStyle, ...style }}
            className={classNamesWrapper}
            data-element="mario"
        >
            <div
                className={classNamesSprite}
             />
        </div>
    );
}
