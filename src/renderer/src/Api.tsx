import { Component, ParentProps, createContext, useContext } from 'solid-js';

const _api: typeof window.api = window.api;
const ApiContext = createContext<typeof _api>(_api);

export const ApiContextProvider: Component<ParentProps> = (props) => (
  <ApiContext.Provider value={_api}>{props.children}</ApiContext.Provider>
);
export const useApi = () => useContext(ApiContext);
