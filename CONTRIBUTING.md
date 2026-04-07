# Contributing

## Development Workflow

All pull requests are treated as release PRs. Every change to a package must go through the changeset flow before opening a PR.

### Steps

1. Create a new branch
2. Make your changes
3. Run `pnpm changeset` to describe what changed and which packages are affected
4. Run `pnpm changeset version` to bump versions and update changelogs
5. Commit everything and open a PR

CI will verify that `changeset version` was run by checking for CHANGELOG updates. PRs missing this will be blocked.

### Changes That Don't Affect Any Package

For changes that only touch CI, tooling, or other non-package files, add the `skip-changeset` label to the PR to explicitly bypass the changeset check.

For changes that don't require running tests at all (e.g. devcontainer, docs), also add the `skip-ci` label to skip the CI job entirely.

Create the labels once in the repository if they don't exist:

```sh
gh label create skip-changeset --color "#e4e669"
gh label create skip-ci --color "#e4e669"
```

## Release

Merging into `main` automatically publishes all bumped packages to npm and creates git tags.
