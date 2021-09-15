import { searchChannels, searchVideos } from '../../helpers/youtube.js'

async function search(ctx, next) {
    let params = new URLSearchParams(ctx.originalUrl.substr(16 + ctx.params.type.length))
    if (params.get('query') == null) {
        ctx.status = 400; return ctx.body = 'Query is empty or invalid.'
    }

    try {
        if (ctx.params.type == 'channels') {
            var data = await searchChannels(params.get('query'))
        } else if (ctx.params.type == 'videos') {
            var data = await searchVideos(params.get('query'))
        }
    } catch (e) {
        ctx.status = 500; return ctx.body = e.message
    }

    ctx.body = data
}

export { search }