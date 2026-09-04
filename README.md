# Signal Repeat for RemNote

> Repeat only what matters.

Signal Repeat provides short, focused repetition sessions without leaving the
RemNote learning flow. The current repository is the implementation scaffold for
the MVP described in `Signal-Repeat-SPECIFICATION.md`.

The scaffold uses development version `0.0.0`. Version `0.1.0` is reserved for
the completed MVP.

## Development

Install [Mise](https://mise.jdx.dev/), then install the project runtime and
dependencies:

```sh
mise install
mise run setup
```

Start the RemNote plugin development server with:

```sh
mise run dev
```

Validate the TypeScript project and create a RemNote plugin package with:

```sh
mise run typecheck
mise run build
```

The build produces `PluginZip.zip`.

## Documentation

- Product requirements: `Signal-Repeat-SPECIFICATION.md`
- Development instructions: `AGENTS.md`
- Architecture: `docs/architecture.md`
- Development workflow: `docs/development.md`
- Release notes: `docs/release.md`
- Changelog: `CHANGELOG.md`
- Contribution guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`

## Privacy

Signal Repeat does not transmit RemNote content to an external server. Selected
text and flashcard content are processed locally in the RemNote plugin
environment. The MVP will store only plugin preferences such as repeat duration.

## License

MIT
