declare module "prod" {
  /* bright logic XML web server URL endpoint for real-time floor sensor data */
  const blserver: undefined|string
  /* MoMath CMS API Token for access to static images */
  const imgtoken: undefined|string
  /* Google API key for accessing scheduling calendars */
  const gapikey: undefined|string
  /* Google calendar ID(s) for schedule; earlier calendars take precedence */
  const calendar: undefined|string|string[]
}
