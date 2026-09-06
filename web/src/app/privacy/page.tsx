import { LegalPage } from "@/components/marketing/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="[date]">
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Information we collect</h2>
        <p>
          Describe what account, contact, and usage data Covison collects, and
          why — e.g. account details at sign-up, the customer data your
          workspace stores (contacts, deals, tasks), and basic product-usage
          analytics.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">How we use it</h2>
        <p>
          Describe the purposes data is used for: operating the product,
          maintaining security, and communicating with account holders.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Data sharing</h2>
        <p>
          Describe any subprocessors or third parties data is shared with
          (e.g. your hosting and database providers), and confirm data is
          never sold.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Your rights</h2>
        <p>
          Describe how a user can access, export, or delete their data, and
          how to contact you about privacy questions.
        </p>
      </section>
    </LegalPage>
  );
}
