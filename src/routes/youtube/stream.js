import { fetchVideo, getStream, testUrl } from '../../helpers/youtube.js'
import { trueStrings } from '../../helpers/const.js'

async function stream(ctx, next) {
    if (ctx.originalUrl.substr(0, 14).endsWith('audio') == true) {
        var fmts = [172, 251, 171, 141, 250, 140, 249, 139]
    } else if (ctx.originalUrl.substr(0, 14).endsWith('video') == true) {
        var fmts = [22, 18]
    }

    let params = new URLSearchParams(ctx.originalUrl.substr(14))
    try {
        var id = params.get('id') || testUrl(params.get('url'))[1]
    } catch (e) {
        ctx.status = 400; return ctx.body = 'ID/URL is empty or invalid.'
    }
    try {
        var data = getStream(await fetchVideo(id), fmts)
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