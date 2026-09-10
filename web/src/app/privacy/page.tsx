import { LegalPage } from "@/components/marketing/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="September 10, 2026">
      <section>
        <p>
          Covison CRM (&quot;Covison&quot;, &quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) is operated by Prime Galleria Ltd, a company
          registered in England and Wales (company number 16604562). This
          policy explains what information we collect through
          crm.covison.com and our related services (the &quot;Service&quot;),
          how we use it, and the choices you have.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">
          Information we collect
        </h2>
        <p className="mb-3">We collect information in three ways:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-foreground">Account information.</span>{" "}
            When you sign up, we collect your name, email address, and
            profile picture. If you sign up with Google, Google provides us
            with this information directly. We also store your password as
            a securely hashed value if you sign up with email and password;
            we never store or have access to your plaintext password.
          </li>
          <li>
            <span className="font-medium text-foreground">Content you store in Covison.</span>{" "}
            Covison is a tool for managing your own business relationships.
            The contacts, companies, deals, tasks, tickets, notes, and any
            other records you or your team create in your workspace
            (&quot;Customer Content&quot;) are stored on your behalf. You
            control this data and are responsible for having the right to
            store and process it, including any personal data about your own
            customers or contacts. We act as a data processor for Customer
            Content; your organization is the data controller.
          </li>
          <li>
            <span className="font-medium text-foreground">Usage and log data.</span>{" "}
            We automatically receive standard technical information when you
            use the Service, such as IP address, browser type, device
            information, pages visited, and timestamps, for security,
            debugging, and operating the Service. We do not use third-party
            advertising or analytics trackers.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Cookies</h2>
        <p>
          We use a small number of cookies strictly necessary to keep you
          signed in and to remember your session. We also store your
          light/dark theme preference in your browser&apos;s local storage.
          We do not use cookies for advertising or cross-site tracking.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">
          How we use information
        </h2>
        <p className="mb-3">We use the information above to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide, operate, and maintain the Service;</li>
          <li>Authenticate you and secure your account and workspace;</li>
          <li>
            Send you emails you or your workspace trigger (for example,
            sending a template email to a contact) and essential service
            notices (for example, security or policy updates);
          </li>
          <li>Respond to your support requests; and</li>
          <li>
            Detect, investigate, and prevent fraud, abuse, and security
            incidents.
          </li>
        </ul>
        <p className="mt-3">
          We do not sell your personal information or Customer Content, and
          we do not use it to serve ads.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">
          Who we share information with
        </h2>
        <p className="mb-3">
          We share information only with the service providers that help us
          run Covison, under contracts that limit their use of it to
          providing that service to us:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-foreground">Supabase</span>, for
            our database, authentication, and file storage;
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel</span>, for
            application hosting; and
          </li>
          <li>
            <span className="font-medium text-foreground">Google</span>, if
            you choose to sign in with your Google account.
          </li>
        </ul>
        <p className="mt-3">
          We may also disclose information if required to by law, or to
          protect the rights, property, or safety of Covison, our users, or
          others. If our business is ever involved in a merger, acquisition,
          or asset sale, your information may be transferred as part of
          that transaction; we will notify you before it becomes subject to
          a different privacy policy.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Data retention</h2>
        <p>
          We retain your account information and Customer Content for as
          long as your account is active. If you delete a record, or close
          your account, we delete or anonymize it within a reasonable
          period, except where we&apos;re required to retain it for legal,
          security, or accounting reasons.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Data security</h2>
        <p>
          We use industry-standard measures to protect your information,
          including encryption in transit, database-level access controls
          scoped to your organization, and hashed password storage. No
          method of transmission or storage is completely secure, and we
          cannot guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">
          International data transfers
        </h2>
        <p>
          Our service providers may process information in countries other
          than your own, including the United Kingdom and the United
          States. Where we transfer personal data internationally, we rely
          on our providers&apos; standard contractual safeguards.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Your rights</h2>
        <p className="mb-3">
          Depending on where you live, you may have the right to access,
          correct, export, or delete your personal information. In
          practice, in Covison you can:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Export your contacts, companies, deals, and tasks to CSV at any time;</li>
          <li>Edit or delete any record directly in the app; and</li>
          <li>
            Contact us at{" "}
            <a href="mailto:support@covison.com" className="text-primary underline-offset-4 hover:underline">
              support@covison.com
            </a>{" "}
            to request a full export or deletion of your account and
            associated data.
          </li>
        </ul>
        <p className="mt-3">
          If you are in the UK or the EEA, you have rights under the UK GDPR
          and, where applicable, the EU GDPR, including the right to lodge a
          complaint with your local data protection authority.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Children&apos;s privacy</h2>
        <p>
          Covison is not directed to, and we do not knowingly collect
          information from, anyone under 18. If you believe a child has
          provided us with personal information, contact us and we will
          delete it.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Changes to this policy</h2>
        <p>
          We may update this policy from time to time. If we make material
          changes, we will notify account holders by email or an in-app
          notice before the changes take effect. The &quot;last
          updated&quot; date above always reflects the current version.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Contact us</h2>
        <p>
          Prime Galleria Ltd (company number 16604562), trading as Covison.
          For any question about this policy or your data, email{" "}
          <a href="mailto:support@covison.com" className="text-primary underline-offset-4 hover:underline">
            support@covison.com
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
