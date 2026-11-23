# Adding Your Bot to the Veyra Catalog

This guide explains how to submit your own open-source Discord bot to
the Veyra catalog.

**Bot catalog submissions are handled through the official Veyra
website. They are not submitted through GitHub Pull Requests.**

Website: [Veyra](https://veyra.example)

> The website address above is a placeholder. Replace it with Veyra's
> official production URL before publishing this document.

> The website submission system is planned for
> [Phase 7 of the roadmap](../ROADMAP.md#phase-7--submission-system). This
> guide describes the requirements and review flow it will enforce.

## 1. Check that your bot is eligible

Before submitting, make sure your project meets these requirements:

-   It is an open-source Discord bot.
-   Its source code is available for review.
-   You own the project or have permission to submit and distribute it.
-   It includes a valid `veyra.json` manifest in the repository root, as
    defined by the [Veyra Bot Metadata Specification](./specifications/bot-metadata.md).
-   It complies with the [Veyra Bot Standard](./bot-standard/VBS-SPECIFICATION.md).
-   Its license permits the type of redistribution and use intended by
    Veyra.
-   The bot is functional and can be set up using the instructions you
    provide.
-   It includes clear documentation explaining installation,
    configuration, and usage.
-   It complies with Discord's applicable terms and developer policies,
    as well as Veyra's terms.

If you use third-party libraries, assets, or code, make sure their
licenses are compatible with your distribution plans.

## 2. Prepare your project

Before submitting, check that your repository is ready for review.

Recommended preparation:

-   Add a README with an overview, features, setup instructions, and
    command documentation.
-   Include a license file.
-   Document the dependencies and supported runtime requirements.
-   Explain every environment variable the bot needs.
-   Provide an `.env.example` containing variable names and safe example
    or placeholder values.
-   Keep real credentials out of the repository.

**Never include real Discord bot tokens, API keys, passwords, private
keys, or other secrets in your source code, repository, screenshots, or
submission.** Use placeholders in examples.

### Create `veyra.json`

Every submission must include a `veyra.json` manifest in the repository
root. It is the machine-readable source of truth for the catalog entry:
name, description, category, version, license, repository, runtime, and
environment variables. Veyra validates it against the
[official JSON Schema](../schemas/bot-metadata.schema.json); the complete
rules and examples are in the
[Veyra Bot Metadata Specification](./specifications/bot-metadata.md).

Keep the manifest consistent with the rest of the repository:

-   The catalog fields in `veyra.json` must match what the bot actually
    is.
-   The `variables` array must list the same environment variables
    documented in the README and `.env.example`.
-   The `license` value must be a valid SPDX identifier or simple
    expression that matches the `LICENSE` file.
-   The `version` value must match the release you are submitting.
-   Never put real credentials in the manifest or in a variable default.

The
[minimal valid manifest](./specifications/bot-metadata.md#111-minimal-valid-manifest)
is a good starting point.

Veyra may customize the runtime name and description in
`global_settings.json` during distribution. The catalog metadata itself
comes from `veyra.json`; make sure both stay consistent with the bot's
actual behavior.

## 3. Create a submission on the website

1.  Open the official [Veyra website](https://veyra.example).
2.  Register for an account, or sign in if you already have one.
3.  Navigate to the bot submission area.
4.  Start a new bot proposal.
5.  Complete the requested information.

The submission system is expected to read `veyra.json` from the repository
and prefill the catalog fields. Confirm that the prefilled values match
your intent.

The proposal may ask for:

| Field | What to provide |
|---|---|
| Bot name | The name from `veyra.json`; confirm it is the public catalog name |
| Description | The description from `veyra.json` |
| Category | One of the controlled categories in the [metadata specification](./specifications/bot-metadata.md#8-categories) |
| Repository or source | A public HTTPS repository URL whose root contains `veyra.json`, or an initial source upload if the form supports it |
| Discord username | Your Discord username so the team can contact you |
| GitHub profile | A link to your GitHub profile |
| Portfolio | An optional link to your portfolio or other relevant work |

Review the information before submitting it.

## 4. Wait for the review

After submission, your proposal will be reviewed by the Veyra team. Its
status may be:

-   **Pending:** the proposal is waiting for review.
-   **Approved:** the proposal can proceed to the next stage.
-   **Rejected:** the proposal will not proceed in its current form. If
    feedback is provided, review it before submitting again.

The team may contact you through the website or another contact method
associated with your submission. Check your account for status updates
and requests for additional information.

Approval of the initial proposal does not necessarily mean that the bot
has been published.

## 5. Provide the final source

If your proposal is approved, follow the instructions shown on the
website.

You may be asked to provide the final bot source by:

-   Uploading the project files through the provided form; or
-   Supplying the public GitHub repository URL requested by the team.

Submit the complete source required to build and run the bot. The
repository root must contain `veyra.json`, and its `version` must match the
release being submitted. Make sure the submitted version matches the
documentation and does not contain secrets or unnecessary local files.

## 6. Technical and security review

Before a bot is added to the public catalog, Veyra performs a technical
and security review.

The review may check:

-   Whether the source is available and can be inspected.
-   Whether the bot can be installed and started using the supplied
    instructions.
-   Whether `veyra.json` is present at the repository root, parses as
    JSON, and validates against the
    [official JSON Schema](../schemas/bot-metadata.schema.json).
-   Whether the manifest passes the semantic checks: unique variable
    names, SPDX license identifiers, catalog license policy, and
    credential scanning.
-   Whether the manifest is consistent with the README, `.env.example`,
    `LICENSE`, and the actual source code.
-   Dependency and license information.
-   Configuration and environment-variable handling.
-   Potentially unsafe behavior or exposed credentials.
-   Whether the submitted project meets Veyra's catalog requirements and
    the [Veyra Bot Standard](./bot-standard/VBS-SPECIFICATION.md).

The team may request corrections or additional information. Publication
takes place only after the required review steps have been completed and
the submission has been accepted.

## 7. Configuration and distribution

The catalog metadata comes from `veyra.json`. Veyra's distribution process
may also adapt runtime settings in `global_settings.json`, such as the
generated copy's name and description.

If your bot requires environment variables, declare them in the
`variables` array of `veyra.json` and list them in `.env.example` with safe
placeholders. Veyra builds the dynamic configuration form from the
manifest. Variables marked `secret` are handled as sensitive values:
Veyra must not log them, display them, or store them in plaintext in the
catalog. Do not hard-code credentials or include your personal tokens in
the distributed source.

The original repository should remain unchanged by the distribution
process.

## Submission checklist

Before sending your proposal, verify the following:

-   [ ] My bot is open-source and I have the right to submit it.
-   [ ] `veyra.json` is present in the repository root.
-   [ ] The manifest validates against the official JSON Schema.
-   [ ] The manifest `variables` match the variables documented in the
    README and `.env.example`.
-   [ ] The manifest `license` matches `LICENSE` and is an OSI-approved
    open-source license.
-   [ ] No real tokens, passwords, or API keys are included in the
    manifest, its defaults, or the repository.
-   [ ] Its license permits redistribution.
-   [ ] The source code is accessible and complete.
-   [ ] The bot is functional.
-   [ ] A README explains installation, configuration, and usage.
-   [ ] Required environment variables are documented.
-   [ ] My Discord and GitHub contact information is correct.
-   [ ] I submitted the proposal through the Veyra website.

## Need help?

For questions about a catalog submission, use the contact or support
options available on the official Veyra website.

Thank you for contributing to the Veyra community!
