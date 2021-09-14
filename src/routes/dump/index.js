function dump(ctx, next) {
    if (ctx.params.type == 'ip') {
        ctx.body = { 'ip': ctx.request.ip }
    } else if (ctx.params.type == 'user-agent') {
        ctx.body = { 'user-agent': ctx.request.header['user-agent'] }
    } else {
        ctx.body = ctx.request
    }
}

export { dump }