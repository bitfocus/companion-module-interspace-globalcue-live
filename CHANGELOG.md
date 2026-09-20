# Changelog

All notable changes to this module are documented in this file.
The format is loosely based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.1] - 2026-09-20

### Fixed

- `manifest.json` and `package.json` `repository`/`bugs` fields pointed at the developer's
  personal fork instead of the official `bitfocus/companion-module-interspace-globalcue-live`
  repository.
- `README.md` only had the generic scaffold dev-setup instructions; added a short feature
  summary and a link to `companion/HELP.md`.

## [1.0.0] - 2026-09-09

Initial release.

### Added

- Connection to the [Interspace GlobalCue Live](https://globalcue.live) HTTP API.
- Two setup modes: automatic presenter discovery via a **Session ID**, or up to 8 **manually
  configured presenters** (ID + friendly name).
- Live presenter state (Paused/Playing/Solo, active handset count) via long-polling, with
  automatic reconnect and connection status reporting.
- Actions:
  - **Send Cue** - Forward / Back / Black.
  - **Presenter Control** - Pause / Play (resume) / Solo / Toggle Pause-Play.
  - Presenter selection via dropdown (known presenters) or free-text/variable presenter ID.
- Feedback: **Presenter Status** - reflects live Paused/Playing/Solo state.
- Variables per known presenter: `presenter{n}_id`, `presenter{n}_name`, `presenter{n}_pause`,
  `presenter{n}_play`, `presenter{n}_solo`, `presenter{n}_active_handsets`, plus
  `presenter_count`.
- Presets: an auto-generated group per known presenter ("Presenter {n} - {Name} ({ID})") with 8
  buttons - Name, Next, Back, Black, Solo, Play, Toggle Pause/Play, Pause - that updates live as
  presenters are added/removed.
  - Each preset ships as a `layered`/`simple` alternatives pair (built on
    `@companion-module/base` 2.1.3) so newer Companion releases render the richer layered-graphics
    version while older releases fall back to the simple version automatically.
