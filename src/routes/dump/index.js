import getRawBody from 'raw-body'

import { getIP } from '../../helpers/network.js'

async function dump(ctx, next) {
    if (ctx.params.type == 'ip') {
        ctx.body = { 'ip': getIP(ctx) }
    } else if (ctx.params.type == 'user-agent') {
        ctx.body = { 'user-agent': ctx.request.header['user-agent'] }
    } else {
        ctx.body = { header: ctx.request.header, hostname: ctx.request.hostname, method: ctx.request.method, path: ctx.request.path, protocol: ctx.request.protocol }
        if (['GET', 'HEAD'].includes(ctx.request.method) != true) {
            //Assume all bodies are encoded with UTF-8
            ctx.body['body'] = await getRawBody(ctx.req, { encoding: 'utf-8' })
        }
        if (ctx.search.length > 0) {
            ctx.body['search'] = ctx.request.search
        }
    }
}

export { dump }
