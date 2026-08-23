import "./mario.css";

import type { HTMLAttributes } from "react";

export type MarioProps = HTMLAttributes<HTMLDivElement> & {
    facing?: "left" | "right";
    sprite?: 0 | 1 | 2;
};

export default function Mario({ className, facing = "left", sprite = 0, ...props }: MarioProps) {
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
            data-element="mario"
        />
    );
}
