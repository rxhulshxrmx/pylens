import { auth, signIn } from "@/auth"
import Link from "next/link"
import { Sparkles, FileText, Ticket, ClipboardList } from "lucide-react"

export default async function LandingPage() {
  const session = await auth()

  async function handleSignIn() {
    "use server"
    await signIn("google", { redirectTo: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-[var(--geist-background-100)] text-[var(--geist-primary)]">
      {/* Topbar */}
      <header className="flex h-14 items-center justify-between border-b border-[var(--geist-gray-alpha-200)] px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)]">
            <Sparkles size={15} className="text-[var(--geist-background-100)]" />
          </div>
          <span className="text-sm font-semibold">Factory</span>
        </div>

        {session ? (
          <Link
            href="/dashboard"
            className="flex h-8 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-200)] px-3 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className="flex h-8 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] bg-[var(--geist-background-200)] px-3 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Sign in
          </Link>
        )}
      </header>

      {/* Hero */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 pb-16 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] px-3 py-1 text-xs text-[var(--geist-gray-800)]">
          <Sparkles size={11} />
          AI Software Factory
        </div>

        <h1 className="mt-4 max-w-2xl text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-[1.1] tracking-[-2px] text-[var(--geist-primary)]">
          Turn product intent into shipped software.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-[var(--geist-gray-800)]">
          Describe what you want to build. Factory generates feature specs, Jira-ready tickets, a Kanban board, and file blueprints — all driven by agents.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="flex h-10 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-5 text-sm font-semibold text-[var(--geist-background-100)] transition-colors hover:opacity-90"
            >
              Go to Dashboard
            </Link>
          ) : (
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex h-10 items-center gap-2 rounded-[var(--geist-radius-sm)] bg-[var(--geist-primary)] px-5 text-sm font-semibold text-[var(--geist-background-100)] transition-colors hover:opacity-90"
              >
                Get started with Google
              </button>
            </form>
          )}
          <Link
            href="/sign-in"
            className="flex h-10 items-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-300)] px-5 text-sm font-medium transition-colors hover:bg-[var(--geist-gray-alpha-100)]"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <FeatureCard
          icon={FileText}
          title="Feature Specs"
          description="AI generates structured specs from a plain-text product description."
        />
        <FeatureCard
          icon={Ticket}
          title="Jira-ready Tickets"
          description="Each spec becomes scoped, prioritised tickets with acceptance criteria."
        />
        <FeatureCard
          icon={ClipboardList}
          title="Kanban Board"
          description="Move tickets through Backlog → Ready → In Progress → Review → Done."
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--geist-gray-alpha-200)] py-6 text-center text-xs text-[var(--geist-gray-700)]">
        Factory — built with Next.js and Claude
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText
  title: string
  description: string
}) {
  return (
    <div className="rounded-[var(--geist-radius-md)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-200)] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--geist-radius-sm)] border border-[var(--geist-gray-alpha-200)] bg-[var(--geist-background-100)]">
        <Icon size={16} className="text-[var(--geist-blue-700)]" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-[var(--geist-gray-800)]">{description}</p>
    </div>
  )
}
