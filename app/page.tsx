export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero */}
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold tracking-tight text-teal-700">
            UniRide
          </span>
          <nav className="flex gap-6 text-sm font-medium text-stone-600">
            <a href="#how" className="hover:text-teal-600">
              How it works
            </a>
            <a href="#rides" className="hover:text-teal-600">
              Types of rides
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
              Ride-sharing for{" "}
              <span className="text-teal-600">university communities</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-stone-600 sm:text-xl">
              UniRide helps students find and share rides with others from their
              university—reducing costs and making travel simpler and safer.
            </p>
          </div>
        </section>

        {/* Use cases */}
        <section
          id="rides"
          className="border-y border-stone-200/80 bg-white px-6 py-16 md:py-20"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-semibold text-stone-900 sm:text-3xl">
              Rides for every situation
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-stone-600">
              Students often need rides for:
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Airport trips",
                "Weekend travel",
                "Concerts and events",
                "Grocery runs",
                "Inter-city trips",
              ].map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50/50 px-5 py-4 text-stone-800"
                >
                  <span className="text-teal-500" aria-hidden>
                    →
                  </span>
                  <span className="font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Problem */}
        <section className="px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              The problem
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-600">
              Today these rides are usually coordinated through WhatsApp groups,
              Facebook posts, or random messages—often disorganized and
              unreliable. It’s hard to know who’s going where, when, and whether
              you can trust the arrangement.
            </p>
          </div>
        </section>

        {/* Solution */}
        <section
          id="how"
          className="border-t border-stone-200/80 bg-teal-50/30 px-6 py-16 md:py-20"
        >
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
              How UniRide helps
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-stone-700">
              UniRide creates structured ride-sharing communities within
              universities. Students can easily{" "}
              <strong className="font-semibold text-stone-900">post</strong>,{" "}
              <strong className="font-semibold text-stone-900">find</strong>, and{" "}
              <strong className="font-semibold text-stone-900">join</strong>{" "}
              rides—all in one place, with clear details and only people from
              your university.
            </p>
            <div className="mt-10">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
              >
                Get started
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 bg-stone-100/50 px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-stone-500">
          UniRide – Ride-sharing for university communities
        </div>
      </footer>
    </div>
  );
}
