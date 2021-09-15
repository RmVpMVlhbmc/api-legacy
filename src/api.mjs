import Koa from 'koa'
import router from './routes/router.js'

const app = new Koa()
app.use(router.routes()).use(router.allowedMethods())
if (process.env.DEVELOPMENT == 'true') {
    app.listen(10000)
    console.log('Server now ready on http://127.0.0.1:10000')
}

import serverless from 'serverless-http'
const handler = serverless(app)

export { app as default, handler }