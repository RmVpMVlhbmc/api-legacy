import { fetchX, fetchInit } from './network.js'

const videoRegex = /var ytInitialPlayerResponse = ({.+});(?:<\/script><div id="player"|var meta)/
const videoUselessParts = ['adPlacements', 'annotations', 'attestation', 'cards', 'endscreen', 'frameworkUpdates', 'messages', 'microformat', 'playabilityStatus', 'playbackTracking', 'playerAds', 'playerConfig', 'responseContext', 'storyboards', 'trackingParams', 'videoQualityPromoSupportedRenderers']
const playerRegex = /src="(\/s\/player\/[^"]+\/player_ias\.vflset\/[^"]+\/base\.js)"/
const playerEntryRegex = /function\(a\){(a=a\.split\(""\);(\w+).+;return a\.join\(""\))}/
const playerHelperExtraRegex = /([a-zA-Z0-9"]+):function\(((?:a|a,b))\){([a-zA-Z0-9.,()\[\]=%; ]+)}/
const searchRegex = /var ytInitialData = (.+);<\/script><script/
const URLRegex = /https?:\/\/\w+(?:\.\w+)+\/(?:watch|playlist)\?(\w+)=([a-zA-Z0-9-_]+)/

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

async function fetchVideo(id) {
    var res = await fetchX(`https://www.youtube.com/watch?v=${id}`, fetchInit)
    res = await res.text()
    //YouTube doesn't return 403/404 when videos are unplayable.
    try {
        var data = JSON.parse(res.match(videoRegex)[1])
    } catch (e) {
        throw new Error('Unable to parse video data')
    }
    if (data['playabilityStatus']['status'] != 'OK') {
        throw new Error(`Upstream error: ${data['playabilityStatus']['reason']}`)
    }

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

function getStream(data, itags, preferAdaptive = true) {
    if (isNaN(itags) != true) {
        itags = [itags]
    }
    if (preferAdaptive == true) {
        var types = ['adaptiveFormats', 'formats']
    } else {
        var types = ['formats', 'adaptiveFormats']
    }

    for (var i of itags) {
        for (var t of types) {
            var stream = data['streamingData'][t].find(s => s['itag'] == i)
            if (stream != null) {
                return stream
            }
        }
    }
    throw new Error('Unable to get the specific stream format')
}

async function searchChannels(query) {
    var res = await fetchX(`https://www.youtube.com/results?search_query=${query}&sp=EgIQAg%253D%253D`, fetchInit)
    res = await res.text()
    try {
        var rd = JSON.parse(res.match(searchRegex)[1])
    } catch (e) {
        throw new Error('Unable to parse search results')
    }

    let data = []
    for (var i = 0; i < rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'].length; i++) {
        //Subscriber count could be hidden
        try {
            var subscriberCount = rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['channelRenderer']['subscriberCountText']['simpleText']
        } catch (e) {
            var subscriberCount = '0 subscriber'
        }
        data.push({
            id: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['channelRenderer']['channelId'],
            subscriberCount: subscriberCount,
            title: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['channelRenderer']['title']['simpleText'],
            thumbnails: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['channelRenderer']['thumbnail']['thumbnails'],
        })
    }
    return data

}

async function searchVideos(query) {
    var res = await fetchX(`https://www.youtube.com/results?search_query=${query}&sp=EgIQAQ%253D%253D`, fetchInit)
    res = await res.text()
    try {
        var rd = JSON.parse(res.match(searchRegex)[1])
    } catch (e) {
        throw new Error('Unable to parse search results')
    }

    let data = []
    for (var i = 0; i < rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'].length; i++) {
        //Views could be hidden
        try {
            var views = rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['viewCountText']['simpleText']
        } catch (e) {
            var views = '0 view'
        }
        data.push({
            id: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['videoId'],
            length: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['lengthText']['simpleText'],
            publishedTime: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['publishedTimeText']['simpleText'],
            thumbnails: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['thumbnail']['thumbnails'],
            title: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['title']['runs'][0]['text'],
            views: views,
            channelId: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['ownerText']['runs'][0]['navigationEndpoint']['browseEndpoint']['browseId'],
            channelTitle: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['ownerText']['runs'][0]['text'],
            channelThumbnails: rd['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents'][i]['videoRenderer']['channelThumbnailSupportedRenderers']['channelThumbnailWithLinkRenderer']['thumbnail']['thumbnails']
        })
    }
    return data
}

function testUrl(url) {
    const data = url.match(URLRegex)
    if (data[1] != null && data[2] != null) {
        return [data[1], data[2]]
    }
    throw new Error('Invalid YouTube url.')
}

export { fetchDecryptData, fetchVideo, getStream, searchChannels, searchVideos, testUrl }