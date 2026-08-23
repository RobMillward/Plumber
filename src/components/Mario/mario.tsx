import "./mario.css";

import type { HTMLAttributes } from "react";

export type MarioProps = HTMLAttributes<HTMLDivElement> & {
    facing?: "left" | "right";
};

export default function Mario({ className, facing = "left", ...props }: MarioProps) {
    const classNames = ["mario", facing === "right" && "mario--facing-right", className].filter(Boolean).join(" ");

    return (
        <div
            {...props}
            className={classNames}
            data-element="mario"
        />
    );
}
