import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { shopName, address } = await request.json();

    if (!shopName || !address) {
      return NextResponse.json(
        { message: "Shop name and address are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { message: "Google Maps API key is not configured." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.googleMapsLinks",
        },
        body: JSON.stringify({
          textQuery: `${shopName}, ${address}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Google API error:", data);

      return NextResponse.json(
  {
    message: "Google Places API request failed.",
    googleError: data,
  },
  { status: response.status }
);
    }

    if (!data.places || data.places.length === 0) {
      return NextResponse.json(
        { message: "Business not found on Google Maps." },
        { status: 404 }
      );
    }

    const place = data.places[0];

    const reviewUrl = place.googleMapsLinks?.writeAReviewUri;

    if (!reviewUrl) {
      return NextResponse.json(
        { message: "Review URL could not be found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Google review URL found.",
      reviewUrl,
      place: {
        id: place.id,
        name: place.displayName?.text,
        address: place.formattedAddress,
      },
    });
  } catch (error) {
    console.error("Google review URL error:", error);

    return NextResponse.json(
      { message: "Something went wrong." },
      { status: 500 }
    );
  }
}
