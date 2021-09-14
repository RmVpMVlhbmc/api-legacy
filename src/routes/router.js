import Router from '@koa/router'
import { index } from './index/index.js'
import { dump } from './dump/index.js'
import { stream } from './youtube/stream.js'

const router = new Router()

router.all('/dump', dump)
router.all('/dump/:type', dump)
router.get('/', index)
router.get('/youtube/audio', stream)
router.get('/youtube/video', stream)

export { router as default }