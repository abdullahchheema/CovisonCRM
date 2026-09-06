import { LegalPage } from "@/components/marketing/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="[date]">
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Using Covison</h2>
        <p>
          Describe who may create a workspace, acceptable use, and that
          customers are responsible for the data they store in their
          workspace.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Accounts &amp; workspaces</h2>
        <p>
          Describe workspace ownership, roles/permissions, and what happens
          to workspace data if an account is closed.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Availability &amp; changes</h2>
        <p>
          Describe that the service is provided as-is during this stage, and
          how changes to these terms will be communicated.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Contact</h2>
        <p>How to reach you with questions about these terms.</p>
      </section>
    </LegalPage>
  );
}
