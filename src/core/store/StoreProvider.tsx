"use client";
import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./store";
export function StoreProvider({ children }: { children: ReactNode }) {
  // A fresh store per mount, so it is never shared between server requests.
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
