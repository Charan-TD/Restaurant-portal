"use client";
import Check from "@mui/icons-material/Check";
interface Rule {
  label: string;
  short: string;
  test: (value: string) => boolean;
}
export function PasswordChecklist({
  value,
  rules,
}: {
  value: string;
  rules: Rule[];
}) {
  return (
    <ul className="password-rules" aria-label="Password must contain">
      {rules.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.label}
            className={ok ? "ok" : undefined}
            title={rule.label}
          >
            {ok && <Check fontSize="inherit" />}
            {rule.short}
          </li>
        );
      })}
    </ul>
  );
}
