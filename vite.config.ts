import {
  defineConfig,
  type HtmlTagDescriptor,
  type Plugin,
  type ProxyOptions,
} from "vite"

import react from "@vitejs/plugin-react"

import tailwindcss from "@tailwindcss/vite"

import path from "node:path"

import fs from "node:fs"

import type { ServerResponse } from "node:http"

import siteConfiguration from "./.figma/make/site.json"

// Vite config — https://vitejs.dev/config/

export default defineConfig(({ mode }) => {
  // .figma/make/deploy-preview passes `--mode development` for cached-preview builds.

  const emitSourcemaps = mode === "development"

  return {
    base: process.env.FIGMA_PUBLIC_URL
      ? `${process.env.FIGMA_PUBLIC_URL}/`
      : "/",

    build: {
      sourcemap: emitSourcemaps ? "inline" : false,

      minify: !emitSourcemaps,
    },

    plugins: [
      react(),

      tailwindcss(),

      figmaSiteConfiguration(siteConfiguration),

      figmaErrorOverlayReplay(),

      figmaReactRefreshBoundaryFallback(),

      figmaMakeKitPlugin({ storiesGlob: "/src/**/*.stories.{ts,tsx,js,jsx}" }),

      // Serve oauth2-callback.html for /oauth2/callback path (popup flow)
      oauthCallbackPlugin(),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    server: {
      host: "0.0.0.0",

      port: parseInt(process.env.PORT || "8300"),

      strictPort: true,

      // Rewrite /oauth2/callback → serve the static HTML file that postMessages
      // the token back to the parent window (popup flow).
      // This must come BEFORE the proxy so Vite handles it locally, not forwarding it.
      fs: { strict: false },

      proxy: {
        "/api": {
          target: "http://localhost:8310",
          changeOrigin: true,
          configure: withOfflineFallback(),
        },

        // Proxy all OAuth2 Authorization endpoints (e.g. /oauth2/authorization/google)
        // Uses a regex key so sub-paths are matched. We do NOT proxy "/oauth2/callback"
        // because that is handled client-side by the SPA (served as static HTML).
        "^/oauth2/authorization": {
          target: "http://localhost:8310",
          changeOrigin: true,
          configure: withOfflineFallback(),
        },

        "/login/oauth2": {
          target: "http://localhost:8310",
          changeOrigin: true,
          configure: withOfflineFallback(),
        },
      },

      watch: { ignored: ["**/.figma/**"] },
    },

    preview: {
      host: "0.0.0.0",

      port: parseInt(process.env.PORT || "8300"),
    },
  }
})

/**
 * Khi backend (localhost:8310) chưa start/crash, http-proxy của Vite dev server mặc
 * định chỉ đóng kết nối — trình duyệt tự hiện trang lỗi kết nối riêng (không phải
 * response HTTP thật), trải nghiệm còn tệ hơn cả trang 502 mặc định. Bắt sự kiện
 * "error" của proxy và trả về đúng public/error.html (cùng popup thông báo dùng ở
 * production qua nginx `error_page`, xem nginx.conf) để dev và prod nhất quán.
 * Đọc lại file mỗi lần lỗi xảy ra (không cache) để luôn phản ánh đúng nội dung mới
 * nhất nếu error.html được sửa mà không cần khởi động lại dev server.
 */

function withOfflineFallback(): NonNullable<ProxyOptions["configure"]> {
  return (proxy) => {
    proxy.on("error", (_err, _req, res) => {
      const httpRes = res as ServerResponse

      if (
        !httpRes ||
        typeof httpRes.writeHead !== "function" ||
        httpRes.headersSent
      )
        return

      try {
        const html = fs.readFileSync(
          path.resolve(__dirname, "public/error.html"),
          "utf-8",
        )

        httpRes.writeHead(502, { "Content-Type": "text/html; charset=utf-8" })

        httpRes.end(html)
      } catch {
        httpRes.writeHead(502)

        httpRes.end("Bad Gateway")
      }
    })
  }
}

/**
 * Vite dev‑server plugin: serve public/oauth2-callback.html for the path
 * /oauth2/callback (the URL that Spring Security redirects the popup window to
 * after a successful Google OAuth2 login).  The HTML file uses postMessage to
 * send the JWT token back to the parent window, then closes itself.
 *
 * In production (Nginx) the same file should be served via:
 *   location = /oauth2/callback { try_files /oauth2-callback.html =404; }
 */
function oauthCallbackPlugin(): Plugin {
  return {
    name: "oauth2-callback",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/oauth2/callback")) {
          const html = fs.readFileSync(
            path.resolve(__dirname, "public/oauth2-callback.html"),
            "utf-8",
          )
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
          res.end(html)
          return
        }
        next()
      })
    },
  }
}

type FigmaSiteConfiguration = {
  title?: string

  description?: string

  language?: string

  robots?: {
    index?: boolean
  }

  icons?: {
    icon?: string
  }

  openGraph?: {
    image?: string
  }

  analytics?: {
    googleAnalyticsId?: string
  }

  customScripts?: {
    headStart?: string

    headEnd?: string

    bodyStart?: string

    bodyEnd?: string
  }

  accessibility?: {
    addBypassLinks?: boolean
  }
}

/** Applies /.figma/make/site.json to the generated document shell. */

function figmaSiteConfiguration(config: FigmaSiteConfiguration): Plugin {
  function sanitizeHtmlValue(value: string | undefined): string {
    return value?.replace(/[^a-zA-Z0-9_-]/g, "") || ""
  }

  function escapeHtmlText(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  }

  function replaceHtmlCommentSlot(
    html: string,
    slotName: string,
    content: string,
  ): string {
    return html.replace(`<!-- ${slotName} -->`, content)
  }

  const title = config.title ?? "Figma Make App"

  const description = config.description ?? ""

  const favicon = config.icons?.icon ?? ""

  const socialImage = config.openGraph?.image ?? ""

  const language = sanitizeHtmlValue(config.language) || "en"

  const googleAnalyticsId = sanitizeHtmlValue(
    config.analytics?.googleAnalyticsId,
  )

  const headStart = config.customScripts?.headStart ?? ""

  const headEnd = config.customScripts?.headEnd ?? ""

  const bodyStart = config.customScripts?.bodyStart ?? ""

  const bodyEnd = config.customScripts?.bodyEnd ?? ""

  const robotsTxt =
    config.robots?.index === false ? "User-agent: *\nDisallow: /\n" : ""

  return {
    name: "figma-site-configuration",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!robotsTxt || req.url?.split("?")[0] !== "/robots.txt")
          return next()

        res.setHeader("Content-Type", "text/plain; charset=utf-8")

        res.end(robotsTxt)
      })
    },

    generateBundle() {
      if (!robotsTxt) return

      this.emitFile({
        type: "asset",

        fileName: "robots.txt",

        source: robotsTxt,
      })
    },

    transformIndexHtml: {
      order: "pre",

      handler(html) {
        let result = html

        result = replaceHtmlCommentSlot(result, "figma:lang", language)

        result = replaceHtmlCommentSlot(
          result,
          "figma:title",
          escapeHtmlText(title),
        )

        result = replaceHtmlCommentSlot(result, "figma:head-start", headStart)

        result = replaceHtmlCommentSlot(result, "figma:head-end", headEnd)

        result = replaceHtmlCommentSlot(result, "figma:body-start", bodyStart)

        result = replaceHtmlCommentSlot(result, "figma:body-end", bodyEnd)

        const tags: HtmlTagDescriptor[] = []

        if (description) {
          tags.push({
            tag: "meta",
            attrs: { name: "description", content: description },
            injectTo: "head",
          })
        }

        if (config.robots?.index === false) {
          tags.push({
            tag: "meta",
            attrs: { name: "robots", content: "noindex, nofollow" },
            injectTo: "head",
          })
        }

        if (favicon) {
          tags.push({
            tag: "link",
            attrs: { rel: "icon", href: favicon },
            injectTo: "head",
          })
        }

        if (title) {
          tags.push({
            tag: "meta",
            attrs: { property: "og:title", content: title },
            injectTo: "head",
          })
        }

        if (description) {
          tags.push({
            tag: "meta",
            attrs: { property: "og:description", content: description },
            injectTo: "head",
          })
        }

        if (socialImage) {
          tags.push(
            {
              tag: "meta",
              attrs: { property: "og:image", content: socialImage },
              injectTo: "head",
            },

            {
              tag: "meta",
              attrs: { name: "twitter:card", content: "summary_large_image" },
              injectTo: "head",
            },

            {
              tag: "meta",
              attrs: { name: "twitter:image", content: socialImage },
              injectTo: "head",
            },
          )
        }

        if (googleAnalyticsId) {
          tags.push(
            {
              tag: "script",

              attrs: {
                async: true,

                src: `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`,
              },

              injectTo: "head",
            },

            {
              tag: "script",

              children: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', ${JSON.stringify(googleAnalyticsId)});
`,

              injectTo: "head",
            },
          )
        }

        if (config.accessibility?.addBypassLinks) {
          tags.push(
            {
              tag: "style",

              children: `
  .figma-bypass-link {
    position: fixed;
    top: 8px;
    left: 8px;
    z-index: 2147483647;
    transform: translateY(-150%);
    border-radius: 6px;
    background: #111827;
    color: #fff;
    padding: 8px 12px;
    font: 600 14px/1.2 system-ui, sans-serif;
    text-decoration: none;
  }
  .figma-bypass-link:focus {
    transform: translateY(0);
  }
`,

              injectTo: "head",
            },

            {
              tag: "a",

              attrs: { class: "figma-bypass-link", href: "#root" },

              children: "Skip to content",

              injectTo: "body-prepend",
            },
          )
        }

        return {
          html: result,

          tags,
        }
      },
    },
  }
}

/**
 * Replay the most recent build error to clients that connect after
 * it was first broadcast. Vite buffers an error payload only while
 * no clients are connected and clears the buffer on the first
 * reconnect (see `bufferedMessage` in `createWebSocketServer`), so
 * if the preview iframe reloads after Vite already delivered an
 * error to a live socket, the new socket misses the payload and
 * the overlay stays hidden even though the build is still broken.
 * We intercept `ws.send` to remember the latest error and replay
 * it on every new connection; the cache clears on a successful
 * `update` or `full-reload` so a stale overlay can't survive a
 * fixed build.
 */

function figmaErrorOverlayReplay(): Plugin {
  return {
    name: "figma-error-overlay-replay",

    apply: "serve",

    configureServer(server) {
      let lastError: object | null = null

      const origSend = server.ws.send.bind(server.ws) as (
        ...args: any[]
      ) => void

      server.ws.send = (((...args: any[]) => {
        const payload = args[0]

        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          const type = (payload as { type?: string }).type

          if (type === "error") {
            lastError = (payload as object)
          } else if (type === "update" || type === "full-reload") {
            lastError = null
          }
        }

        return origSend(...args)
      }) as typeof server.ws.send)

      server.ws.on("connection", (socket) => {
        if (lastError !== null) {
          socket.send(JSON.stringify(lastError))
        }
      })
    },
  }
}

/**
 * Reload when a module that previously defined a React Refresh boundary stops
 * defining one. This happens when an agent moves a component into a new file
 * and replaces the old module with a re-export:
 *
 *   export { default } from './app/App'
 *
 * Vite otherwise accepts the update using the previous module's HMR boundary,
 * but the re-export-only transform no longer registers a replacement for the
 * mounted component family. React reports a successful refresh while leaving
 * the old tree mounted until the page is reloaded.
 */

function figmaReactRefreshBoundaryFallback(): Plugin {
  const hadRefreshBoundary = new Map<string, boolean>()

  let sendFullReload: (() => void) | null = null

  return {
    name: "figma-react-refresh-boundary-fallback",

    apply: "serve",

    enforce: "post",

    configureServer(server) {
      sendFullReload = () => server.ws.send({ type: "full-reload", path: "*" })
    },

    transform(code, id) {
      if (!/\.[jt]sx?(?:\?|$)/.test(id) || id.includes("/node_modules/"))
        return null

      const moduleId = id.split("?")[0] ?? id

      const hasRefreshBoundary = code.includes("registerExportsForReactRefresh")

      const previousHadRefreshBoundary = hadRefreshBoundary.get(moduleId)

      hadRefreshBoundary.set(moduleId, hasRefreshBoundary)

      if (previousHadRefreshBoundary && !hasRefreshBoundary) {
        queueMicrotask(() => sendFullReload?.())
      }

      return null
    },
  }
}

/**
 * Serves a blank render-target page at /.figma/make/kit.html that
 * the Figma preview script drives directly. The page exposes a
 * registry of every file matching `storiesGlob` on
 * window.__FIGMA__.stories so the design surface can dynamically
 * import + mount each entry into its own grid view.
 *
 * Dev-only: `apply: 'serve'` gates the plugin to `vite dev`. Prod
 * builds (`vite build`) skip it entirely so the route doesn't leak
 * into shipped bundles.
 */

function figmaMakeKitPlugin(options: {
  storiesGlob: string | string[]
}): Plugin {
  const storiesGlob = Array.isArray(options.storiesGlob)
    ? options.storiesGlob
    : [options.storiesGlob]

  const ROUTE = "/.figma/make/kit.html"

  const VIRTUAL_ID = "virtual:figma-stories"

  const RESOLVED_ID = "\0" + VIRTUAL_ID

  const STORIES_MODULE = `export const stories = import.meta.glob(${JSON.stringify(storiesGlob)})`

  const HTML_BOOTSTRAP = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
<div id="figma-make-kit-root"></div>
<script type="module">
  import { stories } from 'virtual:figma-stories'
  window.__FIGMA__ = Object.assign(window.__FIGMA__ ?? {}, { stories })
  window.dispatchEvent(new CustomEvent('figma.ready'))
</script>
</body>
</html>`

  return {
    name: "figma-make-kit",

    apply: "serve",

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID

      return null
    },

    load(id) {
      if (id !== RESOLVED_ID) return null

      return STORIES_MODULE
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || ""

        if (url.split("?")[0] !== ROUTE) return next()

        try {
          res.setHeader("Content-Type", "text/html")

          res.end(await server.transformIndexHtml(url, HTML_BOOTSTRAP))
        } catch (err) {
          next(err as Error)
        }
      })
    },
  }
}
