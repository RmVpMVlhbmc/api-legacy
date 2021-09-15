import { fetchVideo, getStream, testUrl } from '../../helpers/youtube.js'
import { trueStrings } from '../../helpers/const.js'

async function stream(ctx, next) {
    const req = [ctx.originalUrl.substr(0, 14), ctx.originalUrl.substr(14)]
    if (req[0].endsWith('audio') == true) {
        var itags = [251, 140, 250, 249]
        var preferAdaptive = true
    } else if (req[0].endsWith('video') == true) {
        var itags = [18]
        var preferAdaptive = false
    }

    let params = new URLSearchParams(req[1])
    try {
        var id = params.get('id') || testUrl(params.get('url'))[1]
    } catch (e) {
        ctx.status = 400; return ctx.body = 'ID/URL is empty or invalid.'
    }
    try {
        var data = getStream(await fetchVideo(id), itags, preferAdaptive)
    } catch (e) {
        ctx.status = 500; return ctx.body = e.message

    }

    if (trueStrings.includes(params.get('redirect')) == true) {
        ctx.set('location', data['url'])
        return ctx.status = 302

    } else {
        ctx.body = data
    }
}

export { stream }
