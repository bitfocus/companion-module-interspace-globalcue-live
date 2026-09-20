# companion-module-interspace-globalcue-live

A Bitfocus Companion module to control and monitor presenters on the free
[Interspace GlobalCue Live](https://globalcue.live) remote cue-light service.

## Features

- **Session ID auto-discovery** - point the module at a GlobalCue session and it finds every
  presenter automatically, or configure up to 8 presenters manually
- **Actions** - Send Cue (Forward/Back/Black) and Presenter Control (Pause/Play/Solo/Toggle)
- **Feedback** - live Paused/Playing/Solo status per presenter
- **Variables** - name, status and active handset count per presenter
- **Presets** - a ready-made button group per presenter, generated automatically and kept in
  sync as presenters are added or removed

See [companion/HELP.md](./companion/HELP.md) for full usage details, and [LICENSE](./LICENSE).

## Development

Executing a `yarn` command should perform all necessary steps to develop the module, if it does not then follow the steps below.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by companion.

While developing the module, by using `yarn dev` the compiler will be run in watch mode to recompile the files on change.
