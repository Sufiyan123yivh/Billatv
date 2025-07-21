export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing 'id' query parameter." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const targetUrl = `http://opplex.ch:8080/live/323232/323232/${id}.m3u8`;

    try {
      const upstreamResponse = await fetch(targetUrl, {
        redirect: "follow"
      });

      if (!upstreamResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch data from the upstream server." }), {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" }
        });
      }

      const finalUrl = upstreamResponse.url;
      const domain = new URL(finalUrl).origin;
      const content = await upstreamResponse.text();

      const modifiedContent = content.split("\n").map(line => {
        if (line.startsWith("/") || line.endsWith(".ts")) {
          return `${domain}${line}`;
        }
        return line;
      }).join("\n");

      return new Response(modifiedContent, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "public, max-age=10"
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal server error." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}
