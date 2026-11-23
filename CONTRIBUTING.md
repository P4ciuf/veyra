# Contributing to Veyra

Thank you for your interest in contributing to Veyra! Contributions, bug
reports, and thoughtful suggestions help improve the platform for
everyone.

Veyra has two main areas of contribution:

- **Core applications:** the official Discord bot and the Veyra
  website.
- **Bot catalog:** community-created Discord bots distributed through
  Veyra.

These areas use different contribution processes. Please follow the
correct one.

## 1. Contributing to the core applications

Pull Requests are the preferred way to contribute code to Veyra's main
applications.

You can submit Pull Requests for:

- Bug fixes and reliability improvements.
- New features and enhancements.
- UI/UX improvements to the website.
- Improvements to the official Discord bot.
- Documentation, tests, and code quality improvements.
- Performance, accessibility, and security improvements.

### Contribution workflow

1.  **Check existing work.** Look through the open issues and Pull
    Requests to see whether the problem or feature has already been
    reported or is being worked on.
2.  **Discuss significant changes.** For large features or architectural
    changes, open an issue or discussion first so the proposed direction
    can be reviewed.
3.  **Fork the repository.** Create your own fork of the Veyra
    repository.
4.  **Create a branch.** Use a descriptive branch name, such as
    `fix/login-validation` or `feat/bot-settings`.
5.  **Set up the project.** Follow the installation and development
    instructions in the repository's README and relevant application
    documentation.
6.  **Make your changes.** Keep changes focused and follow the
    conventions already used by the project.
7.  **Run checks.** Run the relevant tests, linting, formatting, and
    build commands. Add or update tests when appropriate.
8.  **Open a Pull Request.** Explain what changed, why it was needed,
    and how you tested it. Link any related issue.

### Pull Request expectations

Before opening a Pull Request, make sure that:

- The change has a clear purpose and does not include unrelated
  modifications.
- Existing functionality is preserved unless the change intentionally
  updates it.
- New or changed behavior is covered by appropriate tests where
  practical.
- Documentation is updated when necessary.
- No credentials, API keys, bot tokens, private keys, or other secrets
  are included.
- Generated files and local configuration files are not committed
  unless the project explicitly requires them.

Be respectful and constructive during code review. Maintainers may
request changes, ask for clarification, or close a Pull Request that is
out of scope.

## 2. Adding a bot to the Veyra catalog

**Do not open a Pull Request to add a bot to the public Veyra catalog.**

Catalog submissions must be made through the official Veyra website and
follow the bot submission and review process.

Read the dedicated guide:

**[How to Add Your Bot to the Veyra Catalog](docs/ADDING_BOTS.md)**

Every bot repository must include a `veyra.json` manifest at its root. The
manifest is defined by the [Veyra Bot Metadata
Specification](docs/specifications/bot-metadata.md) and validated against the
[official JSON Schema](schemas/bot-metadata.schema.json). It complements the
[Veyra Bot Standard](docs/bot-standard/VBS-SPECIFICATION.md).

Start the process on the official website:

**[Veyra Website](https://veyra.example)**

> The website address above is a placeholder. Replace it with Veyra's
> official production URL before publishing this document.

The website submission process allows the Veyra team to collect the
required information, review the project, and perform technical and
security checks before publication.

## 3. Reporting bugs and suggesting improvements

For issues affecting the core applications, use the repository's issue
tracker when available. Include:

- A clear and descriptive title.
- The application affected (Discord bot or website).
- Steps to reproduce the issue.
- Expected and actual behavior.
- Relevant error messages or screenshots, after removing any private
  information.

For security vulnerabilities, do not publish exploit details or
sensitive information in a public issue. Use the project's designated
private security reporting channel described in
[SECURITY.md](./SECURITY.md).

## 4. License and contributor agreement

By submitting a contribution, you confirm that you have the right to
submit the work and that it can be distributed under the license
applicable to the Veyra repository. Review the repository's `LICENSE`
file before contributing.

Thank you for helping make Veyra better!
