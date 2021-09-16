import fetch from 'node-fetch'

/**
 * Fetch http resources and throw errors when get 4xx/5xx responses
 * @param {string} url Request URL
 * @param {object} init Init options, documentation: https://github.com/node-fetch/node-fetch#options
 * @returns {Promose} Response
 */
function fetchX(url, init) {
    return new Promise((resolve, reject) => {
        fetch(url, init).then(
            (res) => {
                if (res.ok == true) {
                    return resolve(res)
                } else {
                    return reject(`${res.status} ${res.statusText}`)
                }
            },
            (err) => {
                return reject(err.message)
            }
        )
    })
}

const fetchInit = {
    headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "Dnt": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Sec-Gpc": "1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.0.0 Safari/537.36",
    }
}

/**
 * Get client IP from Koajs request context
 * @param {object} ctx Koajs context
 * @returns {string} Client IP
 */
function getIP(ctx) {
    var ip = ctx.request.header['cf-connecting-ip'] || ctx.request.header['x-nf-client-connection-ip'] || ctx.request.header['x-forwarded-for'] || ctx.socket.remoteAddress
    if (ip != null) {
        return ip
    }
    throw new Error('Unable to get client IP.')
}

export { fetchX, fetchInit, getIP }