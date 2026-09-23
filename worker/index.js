const ALLOWED_ORIGIN = "*";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: corsHeaders()
    });
}

export default {
    async fetch(request, env) {

        // CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: corsHeaders()
            });
        }

        const url = new URL(request.url);

        try {

            // ============================
            // GET DENYLIST
            // ============================

            if (
                request.method === "GET" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.endsWith("/denylist")
            ) {

                const parts = url.pathname.split("/");
                const profile = parts[2];

                if (!profile) {
                    return json({
                        error: "Missing profile ID"
                    }, 400);
                }

                const nextdnsURL =
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist`;

                const response = await fetch(nextdnsURL, {
                    method: "GET",
                    headers: {
                        "X-Api-Key": env.NEXTDNS_API_KEY,
                        "Accept": "application/json"
                    }
                });

                const body = await response.text();

                // Return the actual NextDNS response,
                // even if it isn't successful.
                return new Response(
                    body || JSON.stringify({
                        error: "NextDNS returned an empty response",
                        status: response.status
                    }),
                    {
                        status: response.status,
                        headers: corsHeaders()
                    }
                );
            }


            // ============================
            // ADD TO DENYLIST
            // ============================

            if (
                request.method === "POST" &&
                url.pathname.startsWith("/profiles/") &&
                url.pathname.endsWith("/denylist")
            ) {

                const parts = url.pathname.split("/");
                const profile = parts[2];

                if (!profile) {
                    return json({
                        error: "Missing profile ID"
                    }, 400);
                }

                const body = await request.json();

                if (!body.domain) {
                    return json({
                        error: "Missing domain"
                    }, 400);
                }

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist`,
                    {
                        method: "POST",

                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY,
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify({
                            domain: body.domain
                        })
                    }
                );

                const responseBody = await response.text();

                return new Response(
                    responseBody || JSON.stringify({
                        status: response.status
                    }),
                    {
                        status: response.status,
                        headers: corsHeaders()
                    }
                );
            }


            // ============================
            // REMOVE FROM DENYLIST
            // ============================

            if (
                request.method === "DELETE" &&
                url.pathname.includes("/denylist/")
            ) {

                const parts = url.pathname.split("/");

                const profile = parts[2];

                const domain =
                    decodeURIComponent(
                        parts.slice(4).join("/")
                    );

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
                            "X-Api-Key": env.NEXTDNS_API_KEY,
                            "Accept": "application/json"
                        }
                    }
                );

                const responseBody = await response.text();

                return new Response(
                    responseBody || JSON.stringify({
                        success: response.ok,
                        status: response.status
                    }),
                    {
                        status: response.status,
                        headers: corsHeaders()
                    }
                );
            }


            // ============================
            // PATCH DENYLIST ENTRY
            // ============================

            if (
                request.method === "PATCH" &&
                url.pathname.includes("/denylist/")
            ) {

                const parts = url.pathname.split("/");

                const profile = parts[2];

                const domain =
                    decodeURIComponent(
                        parts.slice(4).join("/")
                    );

                const body = await request.json();

                const response = await fetch(
                    `https://api.nextdns.io/profiles/${encodeURIComponent(profile)}/denylist/${encodeURIComponent(domain)}`,
                    {
                        method: "PATCH",

                        headers: {
                            "X-Api-Key": env.NEXTDNS_API_KEY,
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },

                        body: JSON.stringify(body)
                    }
                );

                const responseBody = await response.text();

                return new Response(
                    responseBody || JSON.stringify({
                        success: response.ok,
                        status: response.status
                    }),
                    {
                        status: response.status,
                        headers: corsHeaders()
                    }
                );
            }


            // ============================
            // UNKNOWN ROUTE
            // ============================

            return json({
                error: "Not found",
                path: url.pathname,
                method: request.method
            }, 404);


        } catch (error) {

            return json({
                error: "Worker error",
                message: error.message
            }, 500);
        }
    }
};