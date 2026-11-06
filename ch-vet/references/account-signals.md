# Account signals (Reddit)

Use the account-history tool's output (posts, comments, karma, age, top subreddits). Judge the pattern, not a single number.

| Signal | Reading |
|---|---|
| Age under 30 days and karma under 50, posting a paid job | major: `account_new` |
| Age under 7 days, posting high pay plus off-platform contact | treat the off-platform flag as critical |
| Older than 1 year, steady activity in communities related to the request | positive signal |
| Most posts are the same job across many subreddits within hours | major: `spray_posting` |
| The same "hiring" post repeated weekly or daily for a month | major: `spray_posting` (ghost or bait job) |
| History mainly selling the same service they now "ask" for | block: `seller_disguised` |
| History in r/Scams as the accused, or replies on their posts calling them a scam | major `community_warning`, or `block:reported` when credible |
| History full of crypto pumps, giveaways, adult links or link drops | major |
| Deleted or hidden history with a high-pay offer | major |
| Karma from a single viral post, otherwise empty | neutral; check the rest |

Record in the vet result only: `checked`, `age_days`, `karma` (total), and a notes line (max 20 words). Never store the history itself.

When the tool is unavailable or refused, set `checked: false`. A lead can still pass, but cap it at `caution` if it also has pay above market or off-platform contact.
