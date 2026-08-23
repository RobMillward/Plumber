import "./mario.css";

import type { CSSProperties, HTMLAttributes } from "react";
import { MARIO_HEIGHT, MARIO_WIDTH } from "~/consts/dimensions";

export type MarioProps = HTMLAttributes<HTMLDivElement> & {
    facing?: "left" | "right";
    sprite?: 0 | 1 | 2;
};

const marioSizeStyle = {
    "--mario-width": `${MARIO_WIDTH}px`,
    "--mario-height": `${MARIO_HEIGHT}px`,
} as CSSProperties;

export default function Mario({ className, facing = "left", sprite = 0, style, ...props }: MarioProps) {
    const classNames = [
        "mario",
        facing === "right" && "mario--facing-right",
        sprite !== 0 && `mario--sprite-${sprite}`,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            {...props}
            className={classNames}
            style={{ ...marioSizeStyle, ...style }}
            data-element="mario"
        />
    );
}
