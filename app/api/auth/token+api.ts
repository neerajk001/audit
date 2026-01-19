import {
    BASE_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
} from "../../../constants";

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = formData.get("code") as string;

  if (!code) {
    return Response.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    // Exchange code for tokens with Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token exchange error:", error);
      return Response.json(
        { error: "Failed to exchange token" },
        { status: 500 },
      );
    }

    const tokens = await tokenResponse.json();

    // Fetch user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      return Response.json(
        { error: "Failed to fetch user info" },
        { status: 500 },
      );
    }

    const userInfo = await userInfoResponse.json();

    // Return user data
    return Response.json({
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        given_name: userInfo.given_name,
        family_name: userInfo.family_name,
        email_verified: userInfo.verified_email,
        provider: "google",
        exp: Date.now() + 3600000,
        cookieExpiresAt: Date.now() + 3600000,
      },
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
