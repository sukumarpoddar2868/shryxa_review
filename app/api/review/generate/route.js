import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";
import { buildReviewPrompt } from "../../../../lib/llm/reviewPrompt";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // 1. Read and validate the customer's input
    const body = await request.json();

    const { qrIdentifier, experience, rating } = body;

    if (
      typeof qrIdentifier !== "string" ||
      !qrIdentifier.trim() ||
      typeof experience !== "string" ||
      !experience.trim() ||
      experience.length > 1000 ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid QR identifier, experience, and rating.",
        },
        { status: 400 },
      );
    }

    // 2. Find the QR code, business, and its latest subscription
    const qrCode = await prisma.qRCode.findUnique({
      where: {
        qrIdentifier: qrIdentifier.trim(),
      },
      include: {
        business: {
          include: {
            subscriptions: {
              orderBy: {
                updatedAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    });

    // 3. Validate QR code
    if (!qrCode || qrCode.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This QR code is invalid or inactive." },
        { status: 404 },
      );
    }

    // 4. Check the business's latest subscription
    const subscription = qrCode.business.subscriptions[0];

    const subscriptionIsActive =
      subscription?.status === "ACTIVE" &&
      (!subscription.currentPeriodEnd ||
        subscription.currentPeriodEnd > new Date());

    if (!subscriptionIsActive) {
      return NextResponse.json(
        {
          error:
            "This business does not have an active subscription for AI review generation.",
          code: "SUBSCRIPTION_INACTIVE",
        },
        { status: 403 },
      );
    }

    // 5. Ensure Groq credentials are configured
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey || !model) {
      console.error("GROQ_API_KEY or GROQ_MODEL is missing.");

      return NextResponse.json(
        { error: "Review generation is temporarily unavailable." },
        { status: 500 },
      );
    }

    // 6. Generate review suggestions using GroqCloud
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You generate honest review suggestions based only on the customer's actual experience. Follow the requested JSON format exactly.",
            },
            {
              role: "user",
              content: buildReviewPrompt({
                experience: experience.trim(),
                rating,
              }),
            },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      },
    );

    if (!groqResponse.ok) {
      const errorDetails = await groqResponse.text();

      console.error("Groq API error:", groqResponse.status, errorDetails);

      return NextResponse.json(
        { error: "Could not generate reviews right now. Please try again." },
        { status: 502 },
      );
    }

    // 7. Parse and validate the LLM response
    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response.");
    }

    const parsed = JSON.parse(content);

    if (
      !Array.isArray(parsed.reviews) ||
      parsed.reviews.length !== 4 ||
      !parsed.reviews.every(
        (review) => typeof review === "string" && review.trim().length > 0,
      )
    ) {
      throw new Error("Groq returned an invalid review format.");
    }

    // 8. Return four suggestions to the frontend
    return NextResponse.json({
      reviews: parsed.reviews.map((review) => review.trim()),
    });
  } catch (error) {
    console.error("Review generation failed:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request or review response format." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Review generation failed. Please try again." },
      { status: 500 },
    );
  }
}
