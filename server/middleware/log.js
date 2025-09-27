export default defineEventHandler((event) => {
  const { method, url } = event.node.req
  console.info(`[${new Date().toISOString()}] ${method} ${url}`)
})
