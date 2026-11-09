# How to help

English | [Español](CONTRIBUTING.md)

## Report a problem

Open an issue and pick "Something is broken". The form asks what happened, what you expected, the steps, the output of `claude --version` and `claude plugin list`, and your macOS version. Before that, check [docs/problemas.en.md](docs/problemas.en.md).

## Suggest an idea

Open an issue and pick "Idea". Say what you want to get done, not only the solution.

## Send a change

1. Fork the repo and create a branch.
2. Make your change.
3. Run `python3 scripts/validar.py`. It must end with a line that starts with `validar: todo bien`.
4. Open a pull request and tick the checklist that appears.
5. New versions reach users by themselves, so work goes on the `desarrollo` branch; `main` only moves with `scripts/publicar.sh` (it adds the version tag).
6. This repository is generated from a separate source. If we accept your change, we copy it into that source by hand so it is not lost in the next release.

## Rules

- No emojis.
- Plain, everyday language.
- Spanish first, with an English mirror. If you change one, change the other.
- No personal data (names, emails, phone numbers, keys).
- Nothing that sends anything to another person unless the user says "envíalo" (send it).

## Security

Security problems do not go in public issues. See [SECURITY.md](SECURITY.md).
