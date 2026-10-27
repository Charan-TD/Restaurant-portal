import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "@/core/api/baseApi";
export const makeStore = () =>
  configureStore({
    reducer: { [baseApi.reducerPath]: baseApi.reducer },
    middleware: (getDefault) =>
      getDefault({
        // Upload requests carry File objects as their arguments.
        serializableCheck: {
          ignoredActionPaths: ["meta.arg.originalArgs", "meta.baseQueryMeta"],
          ignoredPaths: [/^api\.(queries|mutations)\..*\.originalArgs$/],
        },
      }).concat(baseApi.middleware),
  });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
