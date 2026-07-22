# Skill - FastAPI Supabase Wordcloud Analysis

## When To Use

Use this skill when implementing Naver blog collection, morphological analysis, wordcloud data generation, or Supabase persistence.

## Goal

FastAPI receives a search keyword from Next.js, analyzes it, saves the result to Supabase, and lets Next.js fetch the result.

## API Base Flow

1. The user enters a keyword in Next.js.
2. Next.js calls FastAPI `POST /wordcloud/analyze`.
3. The backend checks the user's token or subscription state.
4. The backend creates a `wordcloud_jobs` row.
5. The backend calls the Naver Search API.
6. The backend collects up to 20 top blog links.
7. The backend collects blog bodies.
8. KoNLPy or a fallback analyzer extracts nouns.
9. Stopwords are removed.
10. Word frequencies are calculated.
11. Result JSON is saved.
12. A wordcloud image may be saved when needed.
13. Job status is updated.

## API Endpoints

### POST /wordcloud/analyze

Responsibilities:

- Confirm the logged-in user.
- Check token or subscription state.
- Create an analysis job.
- Start analysis work.

Request:

```json
{
  "keyword": "Cheonan bathroom cleaning"
}
```

Response:

```json
{
  "jobId": "string",
  "status": "pending"
}
```

### GET /wordcloud/jobs/{job_id}

Responsibilities:

- Return analysis status.
- Return the result when complete.

### GET /wordcloud/history

Responsibilities:

- Return the current user's analysis history list.

### GET /wordcloud/history/{job_id}

Responsibilities:

- Return saved analysis result detail.

### POST /payments/mock-success

Responsibilities:

- Process mock payment success.
- Add tokens or update subscription state.

## Supabase Tables

- `profiles`
- `wordcloud_jobs`
- `wordcloud_sources`
- `payments`
- `token_transactions`

## Analysis Result JSON Standard

```json
{
  "keyword": "Cheonan bathroom cleaning",
  "createdAt": "2026-07-05T12:00:00+09:00",
  "requestedBlogCount": 20,
  "collectedBlogCount": 17,
  "failedBlogCount": 3,
  "words": [
    { "text": "cleaning", "count": 42 },
    { "text": "bathroom", "count": 39 }
  ],
  "sources": [
    {
      "title": "Blog title",
      "url": "https://...",
      "status": "success"
    }
  ]
}
```

## Failure Handling

Handle these failure scenarios:

- Missing Naver API key
- Naver API call failure
- Empty search results
- Blog body collection failure
- iframe structure changes
- Access restriction
- Timeout
- Empty body
- KoNLPy / JPype / JVM error
- Insufficient tokens
- Supabase save failure

## Fallback Principles

- Use mock search data when Naver API keys are unavailable.
- Use the fallback analyzer when KoNLPy fails.
- If wordcloud rendering fails, keep the bar chart and frequency table visible.

## Security Principles

- Use the Supabase service role key only on the FastAPI server.
- Do not expose the service role key to the frontend.
- Do not expose Naver API keys to the client.
- Combine RLS with server-side validation for user-scoped data access.

