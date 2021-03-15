import * as React from 'react';

interface LogoIconProps {
    className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = (props: LogoIconProps) => (
    <img className={props.className} src="https://raw.githubusercontent.com/GonzoTheDev/baseapp/2-6-stable/src/assets/images/logo.png" />
);