import { fetchVideo, getStream, testUrl } from '../../helpers/youtube.js'
import { trueStrings } from '../../helpers/const.js'

async function stream(ctx, next) {
    if (ctx.path.endsWith('audio') == true) {
        var itags = [251, 140, 250, 249]
        var preferAdaptive = true
    } else if (ctx.path.endsWith('video') == true) {
        var itags = [22, 18]
        var preferAdaptive = false
    }

    try {
        var id = ctx.query['id'] || testUrl(ctx.query['url'])[1]
    } catch (e) {
        ctx.status = 400; return ctx.body = 'ID/URL is empty or invalid.'
    }
    try {
        var data = getStream(await fetchVideo(id), itags, preferAdaptive)
    } catch (e) {
        ctx.status = 500; return ctx.body = e.message
    }

    if (trueStrings.includes(ctx.query['redirect']) == true) {
        ctx.set('location', data['url'])
        return ctx.status = 302
    } else {
        ctx.body = data
    }
}

export { stream }
