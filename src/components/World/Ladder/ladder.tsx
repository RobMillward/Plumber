import "./ladder.css";

import type { HTMLAttributes } from "react";

export type LadderProps = HTMLAttributes<HTMLDivElement>;

export default function Ladder({ style, ...props }: LadderProps) {
    return (
        <div
            {...props}
            className="ladder"
            style={{ ...style }}
            data-element="ladder"
        />
    );
}
