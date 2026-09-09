## Interspace GlobalCue Live

Controls presenters on the free [Interspace GlobalCue Live](https://globalcue.live) remote
cue-light service, using its public HTTP API.

### Setup

You have two options, configured on the connection's config page:

1. **Session ID** (recommended) - enter the ID of a GlobalCue session and the module will
   automatically discover every presenter in that session, including their names, and keep
   their status updated live.
2. **Manual presenters** - leave the Session ID blank and instead enter one or more Presenter
   IDs (and optional friendly names) directly. Presenter IDs look like `123-456-7890` and are
   found at the end of a presenter's "presenter link" on the session setup page.

### Actions

- **Send Cue** - inject a Forward, Back or Black cue to a presenter.
- **Presenter Control** - Pause, Play (resume), Solo, or Toggle Pause/Play (pauses if playing,
  resumes if paused) a presenter.

Each action has a "Presenter" dropdown listing every currently known presenter. You can also
type/paste any other presenter ID directly into that field (or use a variable), even if it
isn't one of the presenters this connection is actively polling.

### Feedbacks

- **Presenter Status** - shows whether a presenter is currently Paused, Playing or Solo. This
  only works for presenters the connection is actively polling (i.e. discovered via a Session
  ID, or manually configured above).

### Variables

For every known presenter (numbered in the order they were discovered/configured):

- `presenter{n}_id`, `presenter{n}_name`
- `presenter{n}_pause`, `presenter{n}_play`, `presenter{n}_solo` (`Yes`/`No`)
- `presenter{n}_active_handsets`

`presenter_count` reports the total number of known presenters.

### Presets

A group of 8 buttons ("Presenter {n} - {Name} ({ID})") is generated automatically for every
known presenter, and updates live as presenters are added/removed (e.g. discovered via a
Session ID): **Name** (display, highlights while playing), **Next**, **Back**, **Black**,
**Solo**, **Play**, **Toggle Pause/Play**, and **Pause**.
