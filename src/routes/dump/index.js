import { getIP } from '../../helpers/network.js'

function dump(ctx, next) {
    if (ctx.params.type == 'ip') {
        ctx.body = { 'ip': getIP(ctx) }
    } else if (ctx.params.type == 'user-agent') {
        ctx.body = { 'user-agent': ctx.request.header['user-agent'] }
    } else {
        ctx.body = ctx.request
    }
}

export { dump }