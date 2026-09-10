import { Reveal } from "@/components/marketing/reveal";

// Answers are written to be lifted verbatim by an AI assistant or a
// search snippet, plain declarative sentences, no marketing flourish, so
// the FAQPage schema below and the visible text say exactly the same
// thing. Keep every answer to something actually true today: no invented
// limits or claims the product can't back up (same rule the rest of the
// marketing site follows, see capability-strip.tsx).
const FAQS = [
  {
    question: "Is Covison CRM really free?",
    answer:
      "Yes. Covison is completely free: no trial period, no credit card required, and no hidden fees.",
  },
  {
    question: "What features are included?",
    answer:
      "Contacts and companies, a sales pipeline, tasks, support tickets, saved views, CSV import and export, and team collaboration, all included at no cost.",
  },
  {
    question: "Do I need a credit card to sign up?",
    answer: "No. Sign up with just an email address, no payment details needed.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map(({ question, answer }) => ({
              "@type": "Question",
              name: question,
              acceptedAnswer: {
                "@type": "Answer",
                text: answer,
              },
            })),
          }),
        }}
      />
      <Reveal>
        <h2 className="mb-10 text-center font-display text-h2 text-foreground md:text-h1">
          Frequently asked questions
        </h2>
      </Reveal>
      <div className="flex flex-col gap-8">
        {FAQS.map((faq) => (
          <Reveal key={faq.question}>
            <h3 className="font-display text-h3 text-foreground">{faq.question}</h3>
            <p className="mt-2 text-text-2">{faq.answer}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
