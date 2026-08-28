import "./mario.css";

import type { CSSProperties, HTMLAttributes } from "react";
import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";
import type { Facing, HammerState, WalkSprite } from "./useMarioPhysics.types";

export type MarioProps = HTMLAttributes<HTMLDivElement> & {
    facing: Facing;
    sprite: WalkSprite;
    hammerState: HammerState;
};

const marioSizeStyle = {
    "--mario-width": `${MARIO_WIDTH}px`,
    "--mario-height": `${MARIO_HEIGHT}px`,
} as CSSProperties;

export default function Mario({ className, facing, sprite, hammerState, style, ...props }: MarioProps) {
    const classNamesWrapper = [
        "mario-wrapper",
        facing === "right" && "mario--facing-right",
    ]
        .filter(Boolean)
        .join(" ");

    const classNamesSprite = [
        "mario-sprite",
        facing === "right" && "mario--facing-right",
        hammerState === "none" ? `mario--sprite-${sprite}` : `mario--sprite-${sprite}-hammer-${hammerState}`,
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
