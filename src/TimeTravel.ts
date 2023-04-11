// time-travel

import { useEffect, useRef, useState } from "react";

export function useCycle(): [number, () => void] {
    const cycle = useRef<number>(0);
    useEffect(() => { cycle.current += 1; });
    const [_, setState] = useState({});
    const doCycle = () => setState({});
    return [cycle.current, doCycle];
}

export function useRefState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>, () => S] {
    const [state, setState] = useState<S>(initialState);
    const fresh = useRef<S | undefined>(undefined);
    fresh.current = state;
    const getState = () => fresh.current as S;
    return [state, setState, getState];
}

export function useFuture<A, B>(): [undefined | ((f: (a: A) => B) => void), (a: A) => Promise<B>] {
    const [respond, setRespond] = useState<undefined | ((f: (a: A) => B) => void)>(undefined);
    const message = (a: A) => new Promise<B>(res =>
        setRespond((_: undefined | ((f: (a: A) => B) => void)) =>
            (f: (a: A) => B) => {
                setRespond(undefined);
                res(f(a));
            }
        )
    );
    return [respond, message];
}
export function useQueueFuture<A, B>(): [undefined | ((f: (a: A) => B) => void), (a: A) => Promise<B>] {
    const queue = useRef<((f: (a: A) => B) => void)[]>([]);
    const [respond, setRespond] = useState<undefined | ((f: (a: A) => B) => void)>(undefined);
    function updateRespond() {
        if (queue) {
            setRespond((_: undefined | ((f: (a: A) => B) => void)) =>
                (f: (a: A) => B) => {
                    const r = queue.current.pop() as ((f: (a: A) => B) => void);
                    updateRespond();
                    r(f);
                }
            );
        } else {
            setRespond(undefined);
        }
    }
    const message = (a: A) => new Promise<B>(res => {
        queue.current = [
            (f: (a: A) => B) => {
                res(f(a));
            },
            ...queue.current
        ];
        updateRespond();
    });
    return [respond, message];
}

export function useMutualFuture<A, B>(): [(f: (a: A) => B) => Promise<void>, (a: A) => Promise<B>] {
    const messageQueue = useRef<[A, (b: B | PromiseLike<B>) => void][]>([]);
    const responseQueue = useRef<((a: A) => B)[]>([]);
    function tryPair() {
        if (messageQueue && responseQueue) {
            const [a, res] = messageQueue.current.pop() as [A, (b: B | PromiseLike<B>) => void];
            const f = responseQueue.current.pop() as (a: A) => B;
            res(f(a));
        }
    }
    const message = (a: A) => new Promise<B>(res => {
        messageQueue.current = [[a, res], ...messageQueue.current];
        tryPair();
    });
    const respond = (f: (a: A) => B) => new Promise<void>(res => {
        responseQueue.current = [(a: A) => { res(undefined); return f(a); }, ...responseQueue.current];
        tryPair();
    });
    return [respond, message];
}