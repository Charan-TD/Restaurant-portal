import Image from "next/image";
export function PortalHeader() {
  return (
    <header className="portal-header">
      <div className="brand">
        <Image
          src="/logo.jpg"
          alt="Train Dhaba logo"
          width={48}
          height={48}
          className="brand-logo"
          priority
        />
        <strong>Train Dhaba</strong>
        <span>Restaurant partner</span>
      </div>
    </header>
  );
}
