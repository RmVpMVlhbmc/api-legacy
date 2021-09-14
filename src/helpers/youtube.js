import { fetchX, fetchInit } from './network.js'

const videoRegex = /var ytInitialPlayerResponse = ({.+});(?:<\/script><div id="player"|var meta)/
const videoErrors = { "Video is unavailable.": '"status":"ERROR","reason":"Video unavailable"', "Login is required.": '"status":"LOGIN_REQUIRED","reason":"Sign in to confirm your age"' }
const videoUselessParts = ['adPlacements', 'annotations', 'attestation', 'cards', 'endscreen', 'frameworkUpdates', 'messages', 'microformat', 'playabilityStatus', 'playbackTracking', 'playerAds', 'playerConfig', 'responseContext', 'storyboards', 'trackingParams', 'videoQualityPromoSupportedRenderers']
const playerRegex = /src="(\/s\/player\/[^"]+\/player_ias\.vflset\/[^"]+\/base\.js)"/
const playerEntryRegex = /function\(a\){(a=a\.split\(""\);(\w+).+;return a\.join\(""\))}/
const playerHelperExtraRegex = /([a-zA-Z0-9"]+):function\(((?:a|a,b))\){([a-zA-Z0-9.,()\[\]=%; ]+)}/

class Decryptor {
    constructor(entry, helperName, helperContent) {
        this.hnr = new RegExp(helperName, 'g')
        this.decrypt = Function('a', entry.replace(this.hnr, 'this'))
        for (this.i of helperContent.split(',\n')) {
            this.i = this.i.match(playerHelperExtraRegex).splice(1, 3)
            this[this.i[0]] = Function(this.i[1], this.i[2])
        }
        delete this.i; delete this.hnr
    }
}

async function fetchVideo(id) {
    var res = await fetchX(`https://www.youtube.com/watch?v=${id}`, fetchInit)
    res = await res.text()
    //YouTube doesn't return 403/404 when videos are unplayable.
    for (var [msg, err] of Object.entries(videoErrors)) {
        if (res.includes(err)) {
            throw new Error(msg)
        }
    }
    let data = JSON.parse(res.match(videoRegex)[1])

    videoUselessParts.forEach(i => {
        var info = i.split('/')
        if (info.length == 1) {
            delete data[info[0]]
        } else {
            delete data[info[0]][info[1]]
        }
    })

    if (data['streamingData']['formats'][0]['signatureCipher'] != null) {
        const decryptData = await fetchDecryptData(res)
        const decryptor = new Decryptor(decryptData[0], decryptData[1], decryptData[2])
        for (var i of ['formats', 'adaptiveFormats']) {
            for (var n = 0; n < data['streamingData'][i].length; n++) {
                var sig = new URLSearchParams(`?${data['streamingData'][i][n]['signatureCipher']}`)
                data['streamingData'][i][n]['url'] = `${decodeURI(sig.get('url'))}&${sig.get('sp')}=${decryptor.decrypt(decodeURI(sig.get('s')))}`
                delete data['streamingData'][i][n]['signatureCipher']
            }
        }
    }
    return data
}

async function fetchDecryptData(data) {
    var data = await fetchX(`https://www.youtube.com/${data.match(playerRegex)[1]}`)
    data = await data.text()
    try {
        var entry = data.match(playerEntryRegex).splice(1, 2)
    } catch (e) {
        throw new Error('Unable to fetch entry decryption function.')
    }

    //construct regex with function name from entrypoint
    const playerHelperRegex = new RegExp(`(var ${entry[1]}={([a-zA-Z0-9"]+:function\\((?:a|a,b)\\){.+}(?:,\\n)?)+)};`)
    try {
        var helper = data.match(playerHelperRegex)[1]
    } catch (e) {
        throw new Error('Unable to fetch helper decryption function.')
    }
    return [entry[0], entry[1], helper]
}

function getStream(data, fmts) {
    if (isNaN(fmts) != true) {
        fmts = [fmts]
    }
    for (var i of fmts) {
        for (var t of ['adaptiveFormats', 'formats']) {
            var fmt = data['streamingData'][t].find(f => f['itag'] == i)
            if (fmt != null) {
                return fmt
            }
        }
    }
    throw new Error('Unable to get specific format')
}

function testUrl(url) {
    const data = url.match(/https?:\/\/\w+(?:\.\w+)+\/(?:watch|playlist)\?(\w+)=([a-zA-Z0-9-_]+)/)
    if (data[1] != null && data[2] != null) {
        return [data[1], data[2]]
    }
    throw new Error('Invalid YouTube url.')
}

export { fetchVideo, fetchDecryptData, getStream, testUrl }