import Link from "next/link";
export default function NotFound() {
  return (
    <main className="centered-page">
      <section className="card">
        <h1>Page not found</h1>
        <Link href="/login">Return to login</Link>
      </section>
    </main>
  );
}
