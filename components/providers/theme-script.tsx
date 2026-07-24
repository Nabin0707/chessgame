/**
 * Theme initialisation script — SERVER COMPONENT.
 *
 * Renders a synchronously-executing script tag that sets the correct
 * theme class on <html> BEFORE the browser paints.  Because this is a
 * Server Component, React never re-renders it on the client, so the
 * React 19 "script tag in client component" warning is avoided.
 */
export function ThemeScript() {
  const script = /* js */ `
    (function(){
      try {
        var theme = localStorage.getItem("theme") || "system";
        if (theme === "system") {
          theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
