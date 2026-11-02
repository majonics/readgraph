# readgraph

A tool that creates beautiful knowledge graphs for the books you are reading.

Pick a book, and readgraph maps everything around it: the people, places, works and ideas in the
book, plus **exactly one level of context** around each. Every node opens up the best material
available (paintings, lectures, podcasts, articles), shown right in the tool. The graph follows your reading
progress, so it never spoils what's ahead.

- **Generation:** Claude Code skills research the book and write the graph (`/build-graph "The Divine Comedy"`).
- **Viewing:** a local web app with a whole-book graph and a focus view for any single entity.
- **Storage:** plain JSON in `library/`, versioned with git.

Status: early development. See [docs/ROADMAP.md](docs/ROADMAP.md).

Start with [docs/VISION.md](docs/VISION.md), then read [CLAUDE.md](CLAUDE.md) for how the project is organised.

## License

MIT
