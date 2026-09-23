const ALLOWED_ORIGIN = "*";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400"
    };
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            ...corsHeaders()
        }
    });
}

export default {
    async fetch(request, env) {
        // Handle browser CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        const url = new URL(request.url);

        try {
            /*
             * GET /profiles/:profile/denylist
             *
             * Gets the current denylist.
             */
            if (
                request.method === "GET" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.endsWith("/denylist")
            ) {
                const parts = url.pathname.split("/");
                const profile = parts[2];

                if (!profile) {
                    return json({ error: "Missing profile ID" }, 400);
                }

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist`,
                    {
                        method: "GET",
                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY
                        }
                    }
                );

                const body = await response.text();

                return new Response(body, {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders()
                    }
                });
            }

            /*
             * POST /profiles/:profile/denylist
             *
             * Adds a domain to the denylist.
             *
             * Body:
             * {
             *   "domain": "example.com"
             * }
             */
            if (
                request.method === "POST" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.endsWith("/denylist")
            ) {
                const parts = url.pathname.split("/");
                const profile = parts[2];

                const body = await request.json();

                if (!body.domain) {
                    return json({ error: "Missing domain" }, 400);
                }

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist`,
                    {
                        method: "POST",
                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            domain: body.domain
                        })
                    }
                );

                const responseBody = await response.text();

                return new Response(responseBody, {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders()
                    }
                });
            }

            /*
             * DELETE /profiles/:profile/denylist/:domain
             *
             * Removes a domain from the denylist.
             */
            if (
                request.method === "DELETE" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.includes("/denylist/")
            ) {
                const parts = url.pathname.split("/");

                const profile = parts[2];
                const domain = decodeURIComponent(parts.slice(4).join("/"));

                if (!profile || !domain) {
                    return json({
                        error: "Missing profile or domain"
                    }, 400);
                }

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist/${encodeURIComponent(domain)}`,
                    {
                        method: "DELETE",
                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY
                        }
                    }
                );

                const responseBody = await response.text();

                return new Response(responseBody || "OK", {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders()
                    }
                });
            }

            /*
             * PATCH /profiles/:profile/denylist/:domain
             *
             * Changes a denylist entry.
             *
             * Body:
             * {
             *   "active": false
             * }
             */
            if (
                request.method === "PATCH" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.includes("/denylist/")
            ) {
                const parts = url.pathname.split("/");

                const profile = parts[2];
                const domain = decodeURIComponent(parts.slice(4).join("/"));

                const body = await request.json();

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist/${encodeURIComponent(domain)}`,
                    {
                        method: "PATCH",
                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(body)
                    }
                );

                const responseBody = await response.text();

                return new Response(responseBody, {
                    status: response.status,
                    headers: {
                        "Content-Type": "application/json",
                        ...corsHeaders()
                    }
                });
            }

            return json({
                error: "Not found"
            }, 404);

        } catch (error) {
            return json({
                error: "Worker error",
                message: error.message
            }, 500);
        }
    }
};