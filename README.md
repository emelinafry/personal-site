# personal-site

Personal landing page for Emelina Fry: name, a short bio, a few links, and an
"Ask about me" box that answers only from the bio.

No framework and no dependencies — just Node and one small server (`server.js`).

## Editing

- **Bio:** `bio.txt`. Plain text; blank lines start a new paragraph. The
  "Ask about me" box only knows what is in this file.
- **Links:** `public/index.html`, in the `<nav class="links">` block. Replace
  the `#` placeholders with real URLs.
- **Look:** `public/styles.css`.

## Run locally

Requires Node 22.9 or newer.

```sh
npm start
```

Then open http://127.0.0.1:3000.

Without an API key the page works normally and the box says
"The assistant is not set up yet."

## Turning on "Ask about me"

The server reads the OpenAI key from the `OPENAI_API_KEY` **environment
variable**. It is used only on the server and is never sent to the browser.
Never commit the key.

The easiest way locally is a `.env.local` file. `npm start` loads it if it
exists, and `.gitignore` keeps it out of git:

```sh
nano .env.local
```

Add one line, save, then run `npm start`:

```
OPENAI_API_KEY=your-key-here
```

Or set it in your shell instead:

```sh
export OPENAI_API_KEY=your-key-here
npm start
```

A variable already set in the environment wins over `.env.local`.

When deploying, set `OPENAI_API_KEY` in your host's environment/secrets
settings instead.

Optional environment variables:

| Variable       | Default       |
| -------------- | ------------- |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `PORT`         | `3000`        |
| `HOST`         | `127.0.0.1` (use `0.0.0.0` on most hosts) |

## Tests

```sh
npm test
```

The tests use a local mock instead of OpenAI, so no key is needed.
