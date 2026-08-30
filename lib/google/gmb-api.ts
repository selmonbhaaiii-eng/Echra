type GoogleAccount = {
  name: string;
  accountName?: string;
};

const USE_MOCK = process.env.GOOGLE_API_QUOTA_APPROVED !== "true";

type GoogleLocation = {
  name: string;
  title?: string;
  metadata?: {
    placeId?: string;
  };
};

export type GoogleReview = {
  reviewId: string;
  reviewer?: {
    displayName?: string;
    profilePhotoUrl?: string;
  };
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: {
    comment?: string;
    updateTime?: string;
  };
};

export type GBPAccountInfo = {
  accountName: string;
  accountLabel: string;
  locationName: string;
  locationLabel: string;
  locationId: string;
};

async function googleFetch<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? `Google API request failed with ${response.status}`;
    const code = payload?.error?.status ?? payload?.error?.code;
    throw new Error(`${code ?? "GOOGLE_API_ERROR"}: ${message}`);
  }

  return payload as T;
}

async function googleMutate<T>(url: string, accessToken: string, body: unknown, method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message ?? `Google API request failed with ${response.status}`;
    const code = payload?.error?.status ?? payload?.error?.code;
    throw new Error(`${code ?? "GOOGLE_API_ERROR"}: ${message}`);
  }

  return payload as T;
}

function idFromResourceName(name: string) {
  return name.split("/").filter(Boolean).pop() ?? name;
}

export async function fetchGBPAccountInfo(accessToken: string): Promise<GBPAccountInfo> {
  if (USE_MOCK) {
    return {
      accountName: "accounts/mock_account_123",
      accountLabel: "Test Bakery",
      locationName: "locations/mock_location_456",
      locationLabel: "Test Bakery, Bandra West",
      locationId: "mock_location_456",
    };
  }

  const accountsPayload = await googleFetch<{ accounts?: GoogleAccount[] }>(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    accessToken,
  );

  const account = accountsPayload.accounts?.[0];

  if (!account) {
    throw new Error("NO_LOCATIONS_FOUND: No Google Business Profile account found.");
  }

  const locationsUrl = new URL(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations`,
  );
  locationsUrl.searchParams.set(
    "readMask",
    "name,title",
  );

  const locationsPayload = await googleFetch<{ locations?: GoogleLocation[] }>(
    locationsUrl.toString(),
    accessToken,
  );

  const location = locationsPayload.locations?.[0];

  if (!location) {
    throw new Error("NO_LOCATIONS_FOUND: No Google Business Profile location found.");
  }

  return {
    accountName: account.name,
    accountLabel: account.accountName ?? account.name,
    locationName: location.name,
    locationLabel: location.title ?? location.name,
    locationId: idFromResourceName(location.name),
  };
}

export async function fetchReviews({
  accessToken,
  accountName,
  locationName,
  pageToken,
}: {
  accessToken: string;
  accountName: string;
  locationName: string;
  pageToken?: string;
}) {
  if (USE_MOCK) {
    return {
      reviews: [
        {
          reviewId: "mock_r001",
          reviewer: { displayName: "Priya Mehta", profilePhotoUrl: undefined },
          starRating: "FIVE" as const,
          comment:
            "Best bakery in Bandra! The croissants are buttery and melt in your mouth. Better than anything I have had in Europe. Staff is warm.",
          createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r002",
          reviewer: { displayName: "Rahul Desai", profilePhotoUrl: undefined },
          starRating: "FIVE" as const,
          comment:
            "The cold brew here is literally the only reason I survive Monday mornings. They know my order now. Great WiFi and comfortable seating.",
          createTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r003",
          reviewer: { displayName: "Sneha Kulkarni", profilePhotoUrl: undefined },
          starRating: "FIVE" as const,
          comment:
            "Came here for my birthday and they surprised me with a free cupcake! Service is everything here. Will definitely come back.",
          createTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r004",
          reviewer: { displayName: "Arjun Nair", profilePhotoUrl: undefined },
          starRating: "THREE" as const,
          comment:
            "Food is great but weekend queues are really long. Would be nice if they had a pre-order system.",
          createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r005",
          reviewer: { displayName: "Meera Shah", profilePhotoUrl: undefined },
          starRating: "FIVE" as const,
          comment:
            "Their sourdough loaf is absolutely divine. I drove 40 minutes from Powai just for this. Will come back every weekend.",
          createTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r006",
          reviewer: { displayName: "Rohan Kapoor", profilePhotoUrl: undefined },
          starRating: "ONE" as const,
          comment:
            "Terrible experience. The barista was extremely rude when I asked for a dairy-free option and the coffee tasted burnt. Completely unacceptable.",
          createTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
        {
          reviewId: "mock_r007",
          reviewer: { displayName: "Anjali Gupta", profilePhotoUrl: undefined },
          starRating: "TWO" as const,
          comment:
            "The ambiance is nice, but I found a hair in my sandwich. The manager apologized but didn't even offer a refund. Won't be coming back.",
          createTime: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
          reviewReply: undefined,
        },
      ],
      totalReviewCount: 5,
      nextPageToken: undefined,
    };
  }

  const accountId = idFromResourceName(accountName);
  const locationId = idFromResourceName(locationName);
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`,
  );
  url.searchParams.set("pageSize", "50");

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  return googleFetch<{ reviews?: GoogleReview[]; nextPageToken?: string }>(
    url.toString(),
    accessToken,
  );
}

export async function postGBPUpdate({
  accessToken,
  accountName,
  locationName,
  postContent,
  imageUrl,
}: {
  accessToken: string;
  accountName: string;
  locationName: string;
  postContent: string;
  imageUrl?: string | null;
}) {
  if (USE_MOCK) {
    console.log("MOCK: Would publish post:", postContent, imageUrl ? `with image: ${imageUrl}` : "without image");
    return {
      name: `accounts/mock/locations/mock/localPosts/mock_${Date.now()}`,
    };
  }

  const accountId = idFromResourceName(accountName);
  const locationId = idFromResourceName(locationName);
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;

  const body: any = {
    languageCode: "en-US",
    summary: postContent,
    topicType: "STANDARD",
  };

  if (imageUrl) {
    body.media = [
      {
        mediaFormat: "PHOTO",
        sourceUrl: imageUrl,
      },
    ];
  }

  return googleMutate<{ name: string }>(url, accessToken, body);
}

export function isGoogleMockMode() {
  return USE_MOCK;
}

export async function replyToReview({
  accessToken,
  accountName,
  locationName,
  reviewId,
  replyText,
}: {
  accessToken: string;
  accountName: string;
  locationName: string;
  reviewId: string;
  replyText: string;
}) {
  if (USE_MOCK) {
    console.log("MOCK: Would publish review reply to", reviewId, ":", replyText);
    return { comment: replyText, updateTime: new Date().toISOString() };
  }

  const accountId = idFromResourceName(accountName);
  const locationId = idFromResourceName(locationName);
  // reviewId in DB for mock has a prefix, but for real reviews it's just the google ID
  const rawReviewId = reviewId.includes("_") ? reviewId.split("_").pop() : reviewId;
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${rawReviewId}/reply`;

  return googleMutate<{ comment: string; updateTime: string }>(
    url,
    accessToken,
    { comment: replyText },
    "PUT"
  );
}
