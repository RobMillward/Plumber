import "./hammer.css";

import type { HTMLAttributes } from "react";

export type HammerProps = HTMLAttributes<HTMLDivElement> & {
    collected: boolean;
};

export default function Hammer({ style, collected, ...props }: HammerProps) {
    return collected ? null : (
        <div
            {...props}
            className="hammer"
            style={{ ...style }}
            data-element="hammer"
        />
    );
}
