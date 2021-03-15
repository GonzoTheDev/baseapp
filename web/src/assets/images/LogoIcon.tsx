import * as React from 'react';

interface LogoIconProps {
    className?: string;
    styles?: any;
}

export const LogoIcon: React.FC<LogoIconProps> = (props: LogoIconProps) => (
    <svg
        className={props.className}
        style={props.styles}
        fill="none"
        width="130"
        height="40"
        viewBox="0 0 130 40"
        xmlns="http://www.w3.org/2000/svg"
    >
    <g>
    <title>Layer 1</title>
    <text stroke-width="0" stroke-dasharray="5,2,2,2,2,2" stroke="#000" transform="matrix(0.649874511911103,0,0,0.6563401183561074,-18.391348216442346,-23.817321639394287) " font-style="normal" font-weight="bold" xml:space="preserve" text-anchor="start" font-family="'Poppins'" font-size="60" id="svg_1" y="85.37411" x="36.82077" opacity="undefined" fill="#8CD79F">CryptX</text>
    </g>
    </svg>
);