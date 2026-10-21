"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import axios from "axios";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  initialRegistration,
  type RegistrationForm,
} from "@/features/onboarding/models/registration";
import { registrationSchema } from "@/features/onboarding/models/validation";
import type { ApprovalResult } from "@/features/approval/models/approval";
import type { Order } from "@/features/dashboard/models/order";
import type { SessionProfile } from "@/features/auth/models/auth";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { claimsOf, clearTokens, getAccessToken } from "@/core/api/axios";
import { getMyRestaurant } from "@/features/profile/services/restaurantService";
interface PortalState {
  form: UseFormReturn<RegistrationForm>;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  completed: number[];
  setCompleted: Dispatch<SetStateAction<number[]>>;
  /** Returned by the backend when the details step is saved. */
  registrationId: string | null;
  setRegistrationId: Dispatch<SetStateAction<string | null>>;
  approval: ApprovalResult | null;
  setApproval: Dispatch<SetStateAction<ApprovalResult | null>>;
  /** True until the saved login has been checked after a page load. */
  restoring: boolean;
  authenticated: boolean;
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
  /** The signed-in vendor, from the login response. */
  profile: SessionProfile;
  setProfile: Dispatch<SetStateAction<SessionProfile>>;
  /** Whether the restaurant is taking orders right now. */
  online: boolean;
  setOnline: Dispatch<SetStateAction<boolean>>;
  orders: Order[];
  setOrders: Dispatch<SetStateAction<Order[]>>;
}
const PortalContext = createContext<PortalState | null>(null);
export function PortalProvider({ children }: { children: ReactNode }) {
  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: initialRegistration,
    mode: "onTouched",
  });
  const [currentStep, setCurrentStep] = useState(0),
    [completed, setCompleted] = useState<number[]>([]),
    [registrationId, setRegistrationId] = useState<string | null>(null),
    [approval, setApproval] = useState<ApprovalResult | null>(null),
    [restoring, setRestoring] = useState(!DEMO_MODE),
    [authenticated, setAuthenticated] = useState(false),
    [profile, setProfile] = useState<SessionProfile>({}),
    [online, setOnline] = useState(true),
    [orders, setOrders] = useState<Order[]>([]);
  // A page reload empties React state, but the token is still saved: pick the
  // login back up instead of sending the vendor to the sign-in page.
  useEffect(() => {
    if (DEMO_MODE) return;
    // The saved login is read from browser storage, which only exists here.
    queueMicrotask(() => {
      const token = getAccessToken(),
        claims = token ? claimsOf(token) : undefined,
        expires = Number(claims?.exp);
      if (token && claims && !(expires * 1000 <= Date.now())) {
        setProfile({
          restaurantId:
            typeof claims.restaurant_id === "string"
              ? claims.restaurant_id
              : undefined,
        });
        setAuthenticated(true);
        if (API_PATHS.restaurantMe)
          void getMyRestaurant()
            .catch((error) => {
              // A revoked or rejected token: drop the saved login.
              if (axios.isAxiosError(error) && error.response?.status === 401) {
                clearTokens();
                setAuthenticated(false);
                setProfile({});
              }
              throw error;
            })
            .then((restaurant) => {
              if (restaurant.active !== undefined) setOnline(restaurant.active);
              setProfile((current) => ({
                ...current,
                restaurantName: current.restaurantName ?? restaurant.name,
                city: current.city ?? restaurant.city,
                name: current.name ?? restaurant.ownerName,
                phone: current.phone ?? restaurant.phone,
                email: current.email ?? restaurant.email,
              }));
            })
            .catch(() => undefined);
      } else if (token) clearTokens();
      setRestoring(false);
    });
  }, []);
  return (
    <PortalContext.Provider
      value={{
        form,
        currentStep,
        setCurrentStep,
        completed,
        setCompleted,
        registrationId,
        setRegistrationId,
        approval,
        setApproval,
        restoring,
        authenticated,
        setAuthenticated,
        profile,
        setProfile,
        online,
        setOnline,
        orders,
        setOrders,
      }}
    >
      <FormProvider {...form}>{children}</FormProvider>
    </PortalContext.Provider>
  );
}
export function usePortal() {
  const context = useContext(PortalContext);
  if (!context) throw new Error("PortalProvider is required.");
  return context;
}
