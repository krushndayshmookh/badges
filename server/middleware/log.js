export default defineEventHandler((event) => {
  const { method, url } = event.node.req
  console.log(`[${new Date().toISOString()}] ${method} ${url}`)
})
