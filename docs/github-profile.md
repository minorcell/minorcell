# GitHub Profile

In production, `/about` loads `https://raw.githubusercontent.com/minorcell/minorcell/output/github.json`
once on page load. It never calls the GitHub API or polls for live activity.
The static site build needs neither a token nor a local snapshot. Loading and
failure states are shown while the snapshot is unavailable, with manual retry.
Profile text, public organizations and public repositories come from GitHub.
Account creation time is neither published nor displayed.

For local development, run `pnpm github:sync` once to generate the stable file
`content/site/github.local.json`, then open `/about` with `pnpm dev`. Development
reads that local file on the server and does not request the remote JSON.
Sync also renders `content/site/snake-light.local.svg` and `snake-dark.local.svg`
from the same daily counts using the existing snake renderer. Development embeds
these local animations; production loads the snake SVGs from `output`.
Refresh the page after running sync again. The local snapshot is ignored by Git
and is not included in production builds. Missing local data shows an empty
state without silently switching to the network.

Pass `--output /path/to/github.json` to choose another destination, as the Action
does with `dist/github.json`. The script uses `GH_TOKEN`, then
`GITHUB_TOKEN`, then the local `gh` login. Only public REST profile/repository
data, aggregate contribution-calendar data and public personal activity are written to the snapshot.
Organization memberships use `/users/{username}/orgs`, which only returns public
memberships even when authenticated. Private repositories are filtered out, and serialization
uses an explicit field allowlist. Tokens, private names, repository details,
organization memberships, private commit messages and private activity URLs are never published.

`.github/workflows/shake.yml` generates the JSON alongside both snake SVGs every
12 hours and on manual dispatch, then publishes all three files to `output` in
one step. Collection failure fails the job before publication, preserving the
last successful files and update date on that branch. Site deployment is independent.

`SNAKE_GITHUB_TOKEN` must belong to the profile owner; the GraphQL viewer is
checked and there is no fallback to the workflow token. Use a PAT with `read:user`
and access to the private repositories whose activity should be included
(classic PAT: `repo`; authorize SSO when required). Contribution completeness
depends on the token's access and GitHub's contribution rules.

- Public repository count includes Fork repositories.
- Personal Stars, featured projects and primary-language counts use public
  non-Fork repositories only, including archived repositories with an archive badge.
- Fork repositories have no dedicated display, and upstream Stars are not fetched.
  Public contributions to any project appear only when the owner actually contributes.
- Featured repositories sort by Stars, then latest push time, then name.
  Initially three are displayed; More Repositories reveals the rest.
- Public activity comes from the profile owner's `contributionsCollection` for
  the recent six calendar months, rather than repository push timestamps. The activity UI
  groups projects into an interactive contribution map connected to the owner's
  profile. Project pins show actual contribution counts; clicking a pin opens
  an attached, unscaled project note with contribution totals, clickable activity
  stamps and links to actual records. Mobile notes sit inside the map's lower edge.
  The map opens at 100% scale around the most recent active project, independent
  of the number of projects. Selecting a project preserves the map's position
  and scale; fitting all projects is an explicit action. A reset control returns to 100%
  scale around the selected project.
  Keyboard focus pans only when the focused project is outside the visible area.
  Map dragging does not select text; note content remains selectable. The map supports
  dragging, zooming and fitting all projects without month or type dropdowns.
  Positions are diagram coordinates, not geographic locations.
  Projects are distributed evenly around the owner in circular rings, with
  additional concentric rings for larger collections. Canvas width and height
  grow together, and straight radial connections form the project network.
- Commits are grouped per repository/day with the user's commit count and a
  filtered commit-history link. Issues and PRs use their own URLs; reviews link
  to the submitted review. GitHub returns the latest review per PR in this range.
- Issue, PR and review connections are paginated. Commit activity requests up to
  100 repositories per 90-day segment to avoid the 100-node repository/day cap;
  reaching a cap marks the feed
  as partial rather than claiming it is complete.
- Restricted, private and internal activity is discarded before copying any
  names, titles or URLs. Only repository visibility `PUBLIC` is eligible for
  the detailed feed. Private contribution counts remain in the annual calendar.
- Contributions use GitHub's calendar definition, including commits, PRs,
  issues and reviews. The owner's token includes accessible private activity
  in total and daily counts; private names and details are never published.
- The contribution section uses the existing animated snake with light/dark
  variants, replacing both the static heatmap and monthly bars. The local
  renderer derives color levels from daily counts; no private activity details
  are included in the SVGs. Totals remain visible if the animation cannot load.
- Dates are displayed in `Asia/Shanghai`. First and last months can be partial.

Run `pnpm test:github` for pagination, aggregation, upstream metrics, owner-token checks,
privacy filtering and failed-write preservation tests.
