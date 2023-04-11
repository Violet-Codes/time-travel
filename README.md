# time-travel
React hooks for async communication

## exports
The two most important exports of this module are:

### useRefState
```ts
// Like useState but provides getState so that long living async blocks can access the state of the current cycle
export function useRefState<S>(initialState: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>, () => S];
```
Usage:
```ts
const [state, setState, getState] = useRefState();
```
This hook can be used to interact with the current state of the component from a process spawned from an old render cycle.
```tsx
async () => {
    //...
    const fresh = getState();
    setState(fresh.process());
    //...
}
```

### useFuture
```ts
// Sends a message for a render cycle in the future to respond to
export function useFuture<A, B>(): [undefined | ((f: (a: A) => B) => void), (a: A) => Promise<B>];
```
Usage:
```ts
const [respond, message] = useFuture();
```
This hook can be used to send a `message` which will force a re-render and will await for a future cycle to `respond`.
```tsx
async () => {
    //...
    await message(cycle);
    //...
}
//...
<>
    {/*...*/}
    { respond &&
        <Responder onClick={() => alert(`handled message from cycle: ${respond()}`)} />
    }
    {/*...*/}
</>
