export const REVIEW_TO_POST_PROMPT = `
{businessContext}

TASK: Write a Google Business Profile post for the above business. A customer named {reviewerName} left a {rating}-star review containing these key phrases: {phrases}

Write a Google Business Profile post that addresses this review.
Tone requested: {tone}

The post must:
- Open with an engaging hook
- Address the review appropriately based on the rating and tone (if negative, be constructive and apologetic; if positive, be grateful)
- Feel warm, local, and authentic (not corporate)
- Mention a specific product or service if relevant
- Naturally use the customer's own words/phrases
- Do not make it sound like an advertisement. Keep it genuine and conversational as a business update.
- Maximum 150 words
- Use 1-2 relevant emojis naturally
- NOT use hashtags
- Sound like a real local business owner wrote it
- NEVER mention anything in the never_mention list

Return only the post text. No title, no explanation.
`;

export const SEASONAL_POST_PROMPT = `
{businessContext}

TASK: Write a Google Business Profile post for the upcoming {occasionName} on {occasionDate}.

Write a festive Google Business Profile post that:
- Acknowledges the upcoming occasion warmly
- Ties it naturally to what this business offers (food/services/products)
- Feels genuinely Indian and local in tone
- If language preference is Hinglish, use it naturally
- Is between 80-150 words
- Uses 1-2 appropriate emojis
- Ends with a call to visit or contact
- Does NOT use hashtags
- NEVER mention anything in the never_mention list

Return only the post text. No title, no explanation.
`;

export const MANUAL_POST_PROMPT = `
{businessContext}

TASK: Write a Google Business Profile post for the above business.
Topic/context provided: {context}
Tone requested: {tone}

Write a Google Business Profile post that:
- Directly addresses the provided topic/context
- Matches the requested tone exactly
- Is between 100-200 words
- Uses 1-2 relevant emojis
- Does NOT use hashtags
- Ends with a clear call to action
- NEVER mention anything in the never_mention list

Return only the post text. No title, no explanation.
`;

export const EVENT_POST_PROMPT = `
{businessContext}

TASK: Write a Google Business Profile post for the upcoming local event: {eventName} on {eventDate}.

Write a Google Business Profile post that:
- Acknowledges the upcoming local event
- Ties it naturally to the business (e.g., stopping by before/after, special offers)
- Feels genuinely local and community-focused
- Is between 80-150 words
- Uses 1-2 appropriate emojis
- Ends with a call to visit or contact
- Does NOT use hashtags
- NEVER mention anything in the never_mention list

Return only the post text. No title, no explanation.
`;
