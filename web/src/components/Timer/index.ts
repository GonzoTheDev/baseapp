import React, {useState, useEffect} from 'react'

interface TimerProps {
    initialMinutes: number;
    initialSeconds: number;
    updateTimer?: boolean;
    className?: string;
    handleRequest?: () => void;
}

export const Timer = (props: TimerProps) => {
    const {initialMinutes = 0, initialSeconds = 0, handleRequest } = props;
    const [minutes, setMinutes] = useState(initialMinutes);
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        setSeconds(initialSeconds);
        setMinutes(initialMinutes);
    }, [props.updateTimer])

    useEffect(() => {
        let myInterval = setInterval(() => {
            if (+seconds > 0) {
                setSeconds(+seconds - 1);
            }
            if (+seconds === 0) {
                if (+minutes === 0) {
                    handleRequest && handleRequest();
                    setSeconds(initialSeconds);
                    setMinutes(initialMinutes);
                    clearInterval(myInterval);
                } else {
                    setMinutes(+minutes - 1);
                    setSeconds(59);
                }
            }
        }, 1000);

        return () => {
            clearInterval(myInterval);
        };
    }, [initialMinutes, initialSeconds, minutes, seconds]);

    return null;
}
