import Router from '@koa/router'

import { index } from './index/index.js'
import { dump } from './dump/index.js'
import { search } from './youtube/search.js'
import { stream } from './youtube/stream.js'

const router = new Router()

router.all('/', index)
router.all('/dump', dump)
router.all('/dump/:type', dump)
router.get('/youtube/audio', stream)
router.get('/youtube/video', stream)
router.get('/youtube/search/:type', search)

export { router as default }