export default {
  async fetch(request) {
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
      const upstreamResponse = await fetch(targetUrl);

      if (!upstreamResponse.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch from upstream." }), {
          status: upstreamResponse.status,
          headers: { "Content-Type": "application/json" }
        });
      }

      const finalUrl = upstreamResponse.url;
      const domain = new URL(finalUrl).origin;
      const data = await upstreamResponse.text();

      const modified = data.split("\n").map(line =>
        (line.startsWith("/") || line.endsWith(".ts")) ? `${domain}${line}` : line
      ).join("\n");

      return new Response(modified, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/vnd.apple.mpegurl"
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
