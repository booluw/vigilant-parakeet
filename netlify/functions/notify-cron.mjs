// Netlify scheduled function: self-triggers the notification check on this site's
// Nitro server. Note: scheduled functions have no public URL and only run on
// published deploys. The external cron job (see README) provides the fast cadence;
// this one keeps the check running even if the external cron is ever removed.
//
// Cadence is subject to your Netlify plan (free plans may throttle below */5).

export default async () => {
  const siteUrl = process.env.URL
  if (!siteUrl) {
    return { statusCode: 500, body: 'Missing site URL' }
  }

  const secret = process.env.NUXT_PUSH_TICK_SECRET || ''
  const res = await fetch(`${siteUrl}/push/tick`, {
    method: 'POST',
    headers: { 'x-tick-secret': secret }
  })

  return { statusCode: res.status, body: await res.text() }
}

export const config = {
  schedule: '*/5 * * * *'
}
