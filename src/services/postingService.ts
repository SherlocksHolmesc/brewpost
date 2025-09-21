// postingService.ts (Function URL path)
const LAMBDA_FUNCTION_URL = "https://ilytuzdhum5h2pec6jgy5vnm2m0lmsoz.lambda-url.us-east-1.on.aws/";

interface PostResponse {
  ok: boolean;
  tweetId?: string;
  error?: string;
  rate?: { retryAfterSec?: number | null; resetEpochSec?: number | null; remaining?: number | null };
  details?: any;
}

export class PostingService {
  private static inFlight = false;

  static async postToX(text: string): Promise<PostResponse> {
    if (this.inFlight) {
      return { ok: false, error: "A post is already in progress. Please wait." };
    }
    this.inFlight = true;
    try {
      const res = await fetch(LAMBDA_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you set WEBHOOK_SECRET in Lambda, include it here:
          // "x-webhook-secret": "<same-secret>"
        },
        body: JSON.stringify({ text })
      });

      const body: PostResponse = await res.json().catch(() => ({ ok: false, error: "Bad JSON from Lambda" }));

      if (res.status === 429) {
        const retryIn =
          body?.rate?.retryAfterSec ??
          (body?.rate?.resetEpochSec ? Math.max(0, body.rate.resetEpochSec - Math.floor(Date.now() / 1000)) : null);
        const friendly = retryIn ? `Rate-limited. Try again in ~${Math.ceil(retryIn)}s.` : "Rate-limited. Try later.";
        return { ok: false, error: friendly, rate: body.rate, details: body.details };
      }

      return body;
    } finally {
      this.inFlight = false;
    }
  }
}