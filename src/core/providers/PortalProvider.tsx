"use client";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useForm, FormProvider, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  initialRegistration,
  type RegistrationForm,
} from "@/features/onboarding/models/registration";
import { registrationSchema } from "@/features/onboarding/models/validation";
import type { ApprovalResult } from "@/features/approval/models/approval";
import type { Order } from "@/features/dashboard/models/order";
interface PortalState {
  form: UseFormReturn<RegistrationForm>;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  completed: number[];
  setCompleted: Dispatch<SetStateAction<number[]>>;
  approval: ApprovalResult | null;
  setApproval: Dispatch<SetStateAction<ApprovalResult | null>>;
  authenticated: boolean;
  setAuthenticated: Dispatch<SetStateAction<boolean>>;
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
    [approval, setApproval] = useState<ApprovalResult | null>(null),
    [authenticated, setAuthenticated] = useState(false),
    [orders, setOrders] = useState<Order[]>([]);
  return (
    <PortalContext.Provider
      value={{
        form,
        currentStep,
        setCurrentStep,
        completed,
        setCompleted,
        approval,
        setApproval,
        authenticated,
        setAuthenticated,
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
