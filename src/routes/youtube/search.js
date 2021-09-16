import { searchChannels, searchVideos } from '../../helpers/youtube.js'

async function search(ctx, next) {
    if (ctx.query['query'] == null) {
        ctx.status = 400; return ctx.body = 'Query is empty or invalid.'
    }

    try {
        if (ctx.params.type == 'channels') {
            var data = await searchChannels(ctx.query['query'])
        } else if (ctx.params.type == 'videos') {
            var data = await searchVideos(ctx.query['query'])
        }
    } catch (e) {
        ctx.status = 500; return ctx.body = e.message
    }

    ctx.body = data
}

export { search }